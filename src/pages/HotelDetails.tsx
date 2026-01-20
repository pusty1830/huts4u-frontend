// MUI Icons – only import the icons you use
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Star from '@mui/icons-material/Star';
import StarRounded from '@mui/icons-material/StarRounded';
import Block from '@mui/icons-material/Block';
import LocationOn from '@mui/icons-material/LocationOn';
import DirectionsCar from '@mui/icons-material/DirectionsCar';
import DirectionsTransit from '@mui/icons-material/DirectionsTransit';
import DirectionsWalk from '@mui/icons-material/DirectionsWalk';
import Search from '@mui/icons-material/Search';
import EventBusy from '@mui/icons-material/EventBusy';
import Warning from '@mui/icons-material/Warning';

// MUI Components – import individually
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import RadioGroup from '@mui/material/RadioGroup';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

// Third-party libraries
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Local components / services / constants
import color from '../components/color';
import CustomButton from '../components/CustomButton';
import { amenityIcons } from '../components/data';
import {
  BoxStyle,
  CustomRadio,
  getRatingColor,
  getRatingText,
  ImageGrid,
  RoomAmenities,
  StyledLabel,
} from '../components/style';
import { CDN_URL, MAPBOX_ACCESS_TOKEN } from '../services/Secret';
import { getAllRatings, getAllHotels, getMyAllHotelswithBelongsTo, getAllInventories, getHotelMeals } from '../services/services';

/**
 * calculatePriceBreakdown (simplified - no discount)
 *
 * Flow:
 * - gstOnBase = 5% of base
 * - platformFee = 13% of (base + gstOnBase)
 * - gstOnPlatform = 18% of platformFee
 * - gatewayFee = 2% of (base + gstOnBase + platformFee + gstOnPlatform)
 * - gstOnGateway = 18% of gatewayFee
 * - gstTotal = gstOnBase + gstOnPlatform + gatewayFee + gstOnGateway
 * - finalPrice = base + platformFee + gstOnBase + gstOnPlatform + gatewayFee + gstOnGateway
 */
const calculatePriceBreakdown = (basePrice: number) => {
  const numericBase = Number(basePrice) || 0;

  if (!numericBase || numericBase <= 0) {
    return {
      basePrice: 0,
      platformFee: 0,
      gstOnBase: 0,
      gstOnPlatform: 0,
      gstTotal: 0,
      gatewayFee: 0,
      finalPrice: 0,
    };
  }

  // 5% GST on base
  const gstOnBase = numericBase * 0.05;

  // platform fee = 13% on (base + gstOnBase)
  const platformFee = (numericBase + gstOnBase) * 0.13;

  // GST on platform (18%)
  const gstOnPlatform = platformFee * 0.18;

  // amount that gateway charges apply to (base + gstOnBase + platformFee + gstOnPlatform)
  const amountBeforeGateway =
    numericBase + gstOnBase + platformFee + gstOnPlatform;

  // gateway fee (2%)
  const gatewayFee = amountBeforeGateway * 0.02;

  // GST on gateway fee (18%)
  const gstOnGateway = gatewayFee * 0.18;

  // combined GST & fees
  const gstTotal = gstOnBase + gstOnPlatform + gatewayFee + gstOnGateway;

  // final total
  const finalPrice =
    numericBase + platformFee + gstOnBase + gstOnPlatform + gatewayFee + gstOnGateway;

  return {
    basePrice: numericBase,
    platformFee,
    gstOnBase,
    gstOnPlatform,
    gstTotal,
    gatewayFee,
    finalPrice,
  };
};

// Function to calculate average rating for a hotel
const calculateAverageRating = (ratings: any[]) => {
  if (!ratings || !Array.isArray(ratings) || ratings.length === 0) return 0;

  const total = ratings.reduce((sum, rating) => {
    return sum + (Number(rating.rating) || 0);
  }, 0);

  const average = total / ratings.length;
  return Math.round(average * 10) / 10;
};

// Function to get ratings for a specific hotel
const getRatingsForHotel = (ratingsData: any, hotelId: string) => {
  if (!ratingsData || !hotelId) return [];

  let ratingsArray = [];

  if (Array.isArray(ratingsData)) {
    ratingsArray = ratingsData;
  } else if (ratingsData && typeof ratingsData === 'object') {
    if (Array.isArray(ratingsData.data)) {
      ratingsArray = ratingsData.data;
    } else if (Array.isArray(ratingsData.rows)) {
      ratingsArray = ratingsData.rows;
    } else if (Array.isArray(ratingsData.result)) {
      ratingsArray = ratingsData.result;
    } else {
      return [];
    }
  }

  if (!Array.isArray(ratingsArray)) {
    return [];
  }

  return ratingsArray.filter(rating => {
    const ratingHotelId = rating.hotelId || rating.propertyId || rating.hotel_id || rating.hotelID;
    return ratingHotelId === hotelId ||
      ratingHotelId?.toString() === hotelId?.toString();
  });
};

// Function to check room availability based on inventory for a SPECIFIC DATE
const checkRoomAvailabilityForDate = (room: any, inventoryData: any[], checkDate: string, bookingType: string, checkinTime?: string) => {
  if (!room || !checkDate) return false;

  // First check room status from database
  const roomStatus = room.status?.toLowerCase();
  const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
  if (!isStatusAvailable) return false;

  // If no inventory data, assume available
  if (!inventoryData || inventoryData.length === 0) return true;

  const roomId = room.id;
  const checkDay = dayjs(checkDate).format('YYYY-MM-DD');

  // Find inventory for this specific room and date
  const dayInventory = inventoryData.find(inv =>
    inv.roomId === roomId && dayjs(inv.date).format('YYYY-MM-DD') === checkDay
  );

  // If no inventory record for this date, assume available
  if (!dayInventory) return true;

  // Check if room is blocked in inventory
  if (dayInventory.isBlocked) return false;

  // Check availability based on booking type
  if (bookingType === "hourly") {
    // For hourly bookings, check specific time slot availability
    if (checkinTime) {
      const hour = dayjs(checkinTime, 'HH:mm').hour();
      // Check specific hourly slots
      if (hour >= 0 && hour < 3) {
        return dayInventory.threeHourAvailable > dayInventory.threeHourBooked;
      } else if (hour >= 3 && hour < 6) {
        return dayInventory.sixHourAvailable > dayInventory.sixHourBooked;
      } else if (hour >= 6 && hour < 9) {
        return dayInventory.twelveHourAvailable > dayInventory.twelveHourBooked;
      }
    }
    // If no specific time, check if any hourly slot is available
    return (
      dayInventory.threeHourAvailable > dayInventory.threeHourBooked ||
      dayInventory.sixHourAvailable > dayInventory.sixHourBooked ||
      dayInventory.twelveHourAvailable > dayInventory.twelveHourBooked
    );
  } else {
    // For overnight bookings
    return dayInventory.overnightAvailable > dayInventory.overnightBooked;
  }
};

// Function to check room availability for date range (overnight stays)
const checkRoomAvailabilityForDateRange = (room: any, inventoryData: any[], checkinDate: string, checkoutDate: string) => {
  if (!room || !checkinDate || !checkoutDate) return false;

  // First check room status from database
  const roomStatus = room.status?.toLowerCase();
  const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
  if (!isStatusAvailable) return false;

  const startDate = dayjs(checkinDate);
  const endDate = dayjs(checkoutDate);

  // Check each date in the range
  for (let date = startDate; date.isBefore(endDate); date = date.add(1, 'day')) {
    const dateStr = date.format('YYYY-MM-DD');

    // Find inventory for this specific date
    const dayInventory = inventoryData?.find(inv =>
      inv.roomId === room.id && dayjs(inv.date).format('YYYY-MM-DD') === dateStr
    );

    if (dayInventory) {
      // If inventory exists and room is blocked
      if (dayInventory.isBlocked) return false;

      // If no overnight availability
      if (dayInventory.overnightAvailable <= dayInventory.overnightBooked) {
        return false;
      }
    }
    // If no inventory record for this date, continue checking next date
  }

  return true;
};

// Function to get inventory-based price for a specific date
const getInventoryPriceForDate = (room: any, inventoryData: any[], checkDate: string, slot: string) => {
  if (!room || !checkDate) return room[slot] || 0;

  const roomId = room.id;
  const checkDay = dayjs(checkDate).format('YYYY-MM-DD');

  // Find inventory for this specific date
  const dayInventory = inventoryData?.find(inv =>
    inv.roomId === roomId && dayjs(inv.date).format('YYYY-MM-DD') === checkDay
  );

  if (!dayInventory) return room[slot] || 0;

  // Return inventory-specific rate if available, otherwise room rate
  switch (slot) {
    case 'rateFor1Night':
      return dayInventory.overnightRate || room.rateFor1Night || 0;
    case 'rateFor3Hour':
      return dayInventory.threeHourRate || room.rateFor3Hour || 0;
    case 'rateFor6Hour':
      return dayInventory.sixHourRate || room.rateFor6Hour || 0;
    case 'rateFor12Hour':
      return dayInventory.twelveHourRate || room.rateFor12Hour || 0;
    default:
      return room[slot] || 0;
  }
};

const HotelDetails: React.FC = () => {
  const S3_BASE_URL = "https://huts44u.s3.ap-south-1.amazonaws.com";
const CDN_BASE_URL = CDN_URL; 

const toCdn = (url?: string) => {
  if (!url) return "/default-hotel.jpg";
  return url.includes(S3_BASE_URL)
    ? url.replace(S3_BASE_URL, CDN_BASE_URL)
    : url;
};

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const bookingType = queryParams.get("bookingType") ?? "fullDay";
  const checkinTime = queryParams.get("time") ?? "";
  const checkinDate = queryParams.get("checkinDate") ?? "";
  const checkOutDate = queryParams.get("checkOutDate") ?? "";
  const parsedRooms = Number(queryParams.get("rooms"));
  const roomsCountParam =
    Number.isFinite(parsedRooms) && parsedRooms > 0 ? Math.floor(parsedRooms) : 1;
  const adults = queryParams.get("adults") ?? "1";
  const children = queryParams.get("children") ?? "0";

  const hotel =
    (location.state && (location.state as any).hotelData) ||
    ((location.state as any) || {});
  hotel.rooms = hotel.rooms || [];
  hotel.propertyDesc = hotel.propertyDesc || hotel.description || "";
  hotel.propertyImages = hotel.propertyImages || [];

  // Inventory state - store by roomId and date
  const [inventoryData, setInventoryData] = useState<{ [key: string]: any[] }>({});
  const [loadingInventory, setLoadingInventory] = useState<boolean>(true);

  // Ratings state
  const [allRatings, setAllRatings] = useState<any>(null);
  const [hotelRatings, setHotelRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [loadingRatings, setLoadingRatings] = useState<boolean>(true);

  // State for checking alternative stays in similar hotels
  const [similarHotels, setSimilarHotels] = useState<any[]>([]);
  const [loadingSimilarHotels, setLoadingSimilarHotels] = useState(false);
  const [hasAlternativeStays, setHasAlternativeStays] = useState(false);
  const [checkingAlternativeStays, setCheckingAlternativeStays] = useState(false);
  const [similarHotelsPrices, setSimilarHotelsPrices] = useState({
    minHourlyPrice: Infinity,
    minOvernightPrice: Infinity,
  });

  useEffect(()=>{

    const payLoad = {
            data: { filter: "" },
            page: 0,
            pageSize: 1000,
            order: [["createdAt", "ASC"]],
          }
      getHotelMeals(payLoad).then((res)=>{
        console.log(res?.data?.data?.rows);
        
      })
  },[])
  // Fetch inventory for each room for the specific dates
  const fetchInventoryForRooms = async () => {
    try {
      if (!hotel.id || !hotel.rooms || hotel.rooms.length === 0) {
        setLoadingInventory(false);
        return;
      }

      setLoadingInventory(true);

      // Create date range
      let startDate = checkinDate;
      let endDate = checkOutDate;

      if (bookingType === "hourly") {
        // For hourly bookings, only check the checkin date
        endDate = checkinDate;
      } else if (!endDate) {
        // For overnight without checkout date, assume 1 night
        endDate = dayjs(checkinDate).add(1, 'day').format('YYYY-MM-DD');
      }

      const inventoryByRoom: { [key: string]: any[] } = {};

      // Fetch inventory for each room individually
      for (const room of hotel.rooms) {
        try {
          const payLoad = {
            data: { filter: "", roomId: room.id, date: startDate },
            page: 0,
            pageSize: 1000,
            order: [["createdAt", "ASC"]],
          }

          const inventoryResponse = await getAllInventories(payLoad);
          let inventoryData = inventoryResponse?.data?.data;

          // Handle different API response structures
          let inventoryArray: any[] = [];
          if (inventoryData?.data && Array.isArray(inventoryData.data)) {
            inventoryArray = inventoryData.data;
          } else if (inventoryData?.rows && Array.isArray(inventoryData.rows)) {
            inventoryArray = inventoryData.rows;
          } else if (inventoryData?.result && Array.isArray(inventoryData.result)) {
            inventoryArray = inventoryData.result;
          } else if (Array.isArray(inventoryData)) {
            inventoryArray = inventoryData;
          }

          inventoryByRoom[room.id] = inventoryArray;
        } catch (error) {
          console.error(`Error fetching inventory for room ${room.id}:`, error);
          inventoryByRoom[room.id] = [];
        }
      }

      setInventoryData(inventoryByRoom);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventoryData({});
    } finally {
      setLoadingInventory(false);
    }
  };

  // Check if a specific room is available for the selected dates
  const isRoomAvailable = (room: any) => {
    // First check room status from database
    const roomStatus = room.status?.toLowerCase();
    const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
    if (!isStatusAvailable) return false;

    if (bookingType === "hourly") {
      // For hourly bookings, check specific checkin date
      return checkRoomAvailabilityForDate(
        room,
        inventoryData[room.id] || [],
        checkinDate,
        bookingType,
        checkinTime
      );
    } else {
      // For overnight bookings, check date range
      return checkRoomAvailabilityForDateRange(
        room,
        inventoryData[room.id] || [],
        checkinDate,
        checkOutDate || dayjs(checkinDate).add(1, 'day').format('YYYY-MM-DD')
      );
    }
  };

  // Check if a specific slot is available for a room
  const isSlotAvailable = (room: any, slot: string) => {
    if (!room || !slot || !checkinDate) return false;

    // First check room status
    const roomStatus = room.status?.toLowerCase();
    const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
    if (!isStatusAvailable) return false;

    const roomInventory = inventoryData[room.id] || [];
    const checkDay = dayjs(checkinDate).format('YYYY-MM-DD');

    // Find inventory for this specific date
    const dayInventory = roomInventory.find(inv =>
      dayjs(inv.date).format('YYYY-MM-DD') === checkDay
    );

    // If no inventory record, slot is available
    if (!dayInventory) return true;

    // Check if room is blocked
    if (dayInventory.isBlocked) return false;

    // Check specific slot availability
    switch (slot) {
      case 'rateFor1Night':
        return dayInventory.overnightAvailable > dayInventory.overnightBooked;
      case 'rateFor3Hour':
        return dayInventory.threeHourAvailable > dayInventory.threeHourBooked;
      case 'rateFor6Hour':
        return dayInventory.sixHourAvailable > dayInventory.sixHourBooked;
      case 'rateFor12Hour':
        return dayInventory.twelveHourAvailable > dayInventory.twelveHourBooked;
      default:
        return true;
    }
  };

  // Get price for a specific slot, considering inventory rates
  const getPriceForSlot = (room: any, slot: string) => {
    if (!room || !slot || !checkinDate) return room[slot] || 0;

    return getInventoryPriceForDate(
      room,
      inventoryData[room.id] || [],
      checkinDate,
      slot
    );
  };

  // Get inventory status for a room
  const getRoomInventoryStatus = (room: any) => {
    // First check room status from database
    const roomStatus = room.status?.toLowerCase();
    const isStatusAvailable = roomStatus === "available" || roomStatus === "active";

    if (!isStatusAvailable) {
      return {
        isAvailable: false,
        status: 'Unavailable',
        icon: <Block />,
        reason: 'Room is currently unavailable'
      };
    }

    const roomInventory = inventoryData[room.id] || [];

    if (roomInventory.length === 0) {
      return {
        isAvailable: true,
        status: 'Available',
        icon: null,
        reason: 'Available for booking'
      };
    }

    // For the specific checkin date
    const checkDay = checkinDate ? dayjs(checkinDate).format('YYYY-MM-DD') : '';
    const dayInventory = checkDay ? roomInventory.find(inv =>
      dayjs(inv.date).format('YYYY-MM-DD') === checkDay
    ) : null;

    if (dayInventory) {
      if (dayInventory.isBlocked) {
        return {
          isAvailable: false,
          status: 'Blocked',
          icon: <EventBusy />,
          reason: 'Room is blocked for selected date'
        };
      }

      // Check specific slot availability based on booking type
      if (bookingType === "hourly") {
        const hasHourlyAvailability =
          dayInventory.threeHourAvailable > dayInventory.threeHourBooked ||
          dayInventory.sixHourAvailable > dayInventory.sixHourBooked ||
          dayInventory.twelveHourAvailable > dayInventory.twelveHourBooked;

        if (!hasHourlyAvailability) {
          return {
            isAvailable: false,
            status: 'Sold Out',
            icon: <Block />,
            reason: 'No hourly slots available for selected date'
          };
        }
      } else {
        if (dayInventory.overnightAvailable <= dayInventory.overnightBooked) {
          return {
            isAvailable: false,
            status: 'Sold Out',
            icon: <Block />,
            reason: 'No overnight availability for selected date'
          };
        }
      }
    }

    return {
      isAvailable: true,
      status: 'Available',
      icon: null,
      reason: 'Available for booking'
    };
  };

  // Filter rooms
  const availableRooms = hotel.rooms.filter((room: any) => isRoomAvailable(room));
  const unavailableRooms = hotel.rooms.filter((room: any) => !isRoomAvailable(room));

  // Function to fetch all ratings
  const fetchAllRatings = async () => {
    try {
      const payLoad = {
        data: { filter: "" },
        page: 0,
        pageSize: 1000,
        order: [["createdAt", "ASC"]],
      }
      const ratingsResponse = await getAllRatings(payLoad);
      let ratingsData = ratingsResponse?.data?.data;

      // Handle different API response structures
      if (ratingsData?.data && Array.isArray(ratingsData.data)) {
        return ratingsData.data;
      }
      if (ratingsData?.rows && Array.isArray(ratingsData.rows)) {
        return ratingsData.rows;
      }
      if (ratingsData?.result && Array.isArray(ratingsData.result)) {
        return ratingsData.result;
      }
      if (Array.isArray(ratingsData)) {
        return ratingsData;
      }

      return [];
    } catch (error) {
      console.error("Error fetching ratings:", error);
      return [];
    }
  };

  // Fetch ratings and inventory on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingRatings(true);
        const ratingsData = await fetchAllRatings();
        setAllRatings(ratingsData);

        // Get ratings for this specific hotel
        const hotelId = hotel.id;
        const ratingsForHotel = getRatingsForHotel(ratingsData, hotelId);
        setHotelRatings(ratingsForHotel);

        // Calculate average rating
        const avgRating = calculateAverageRating(ratingsForHotel);
        setAverageRating(avgRating);
        setReviewCount(ratingsForHotel.length);
      } catch (error) {
        console.error("Error loading ratings:", error);
        setAverageRating(hotel?.ratings?.rating || 0);
        setReviewCount(hotel?.reviews || 0);
      } finally {
        setLoadingRatings(false);
      }
    };

    if (hotel.id) {
      fetchData();
      fetchInventoryForRooms();
    } else {
      // Use hotel data if ratings fetch fails
      setAverageRating(hotel?.ratings?.rating || 0);
      setReviewCount(hotel?.reviews || 0);
      setLoadingRatings(false);
    }
  }, [hotel.id, checkinDate, checkOutDate, bookingType]);

  // Fetch similar hotels and check for alternative stays
  useEffect(() => {
    const fetchSimilarHotelsAndCheckAlternative = async () => {
      if (!hotel.propertyName || !hotel.id) return;

      try {
        setLoadingSimilarHotels(true);
        setCheckingAlternativeStays(true);

        // Fetch all hotels
        const payload = {
          data: {
            filter: "",
            status: "Approved"
          },
          page: 0,
          pageSize: 1000,
          order: [["createdAt", "ASC"]],
        };

        const response = await getAllHotels(payload);
        const allHotels = response?.data?.data?.rows || [];

        // Filter hotels with similar name (case-insensitive partial match)
        const currentName = hotel.propertyName?.toLowerCase() || '';
        const similar = allHotels.filter((h: any) => {
          // Skip current hotel
          if (h.id === hotel.id) return false;

          const otherName = h.propertyName?.toLowerCase() || '';

          // Check for partial match
          const words = currentName.split(' ').filter((w: string) => w.length > 2);
          const hasMatchingWord = words.some((word: string) =>
            otherName.includes(word)
          );

          return hasMatchingWord || otherName.includes(currentName) || currentName.includes(otherName);
        });

        // Fetch price information for similar hotels
        const similarHotelsWithPrices = [];
        let alternativeFound = false;
        let minHourlyPrice = Infinity;
        let minOvernightPrice = Infinity;

        // Check each similar hotel for alternative stays (limit to 3 for performance)
        for (const similarHotel of similar.slice(0, 3)) {
          try {
            const belongsToPayload = {
              id: similarHotel.id,
              secondTable: "Room",
            };

            const hotelRes = await getMyAllHotelswithBelongsTo(belongsToPayload);
            const hotelWithRooms = hotelRes?.data || null;

            if (hotelWithRooms && Array.isArray(hotelWithRooms.data) && hotelWithRooms.data.length) {
              const rooms = hotelWithRooms.data[0]?.rooms || [];

              // Check for hourly rates
              let hotelHasHourly = false;
              let hotelMinHourlyPrice = Infinity;

              // Check for overnight rates
              let hotelHasOvernight = false;
              let hotelMinOvernightPrice = Infinity;

              rooms.forEach((room: any) => {
                // Check hourly rates
                if (room.rateFor3Hour > 0) {
                  hotelHasHourly = true;
                  hotelMinHourlyPrice = Math.min(hotelMinHourlyPrice, room.rateFor3Hour);
                }
                if (room.rateFor6Hour > 0) {
                  hotelHasHourly = true;
                  hotelMinHourlyPrice = Math.min(hotelMinHourlyPrice, room.rateFor6Hour);
                }
                if (room.rateFor12Hour > 0) {
                  hotelHasHourly = true;
                  hotelMinHourlyPrice = Math.min(hotelMinHourlyPrice, room.rateFor12Hour);
                }

                // Check overnight rates
                if (room.rateFor1Night > 0) {
                  hotelHasOvernight = true;
                  hotelMinOvernightPrice = Math.min(hotelMinOvernightPrice, room.rateFor1Night);
                }
              });

              // Determine if this hotel offers the alternative booking type
              const currentIsHourly = bookingType === "hourly";
              const hasAlternative = currentIsHourly ? hotelHasOvernight : hotelHasHourly;

              if (hasAlternative) {
                alternativeFound = true;

                // Update min prices
                if (currentIsHourly && hotelHasOvernight) {
                  minOvernightPrice = Math.min(minOvernightPrice, hotelMinOvernightPrice);
                } else if (!currentIsHourly && hotelHasHourly) {
                  minHourlyPrice = Math.min(minHourlyPrice, hotelMinHourlyPrice);
                }
              }

              similarHotelsWithPrices.push({
                ...similarHotel,
                hasHourly: hotelHasHourly,
                hasOvernight: hotelHasOvernight,
                minHourlyPrice: hotelMinHourlyPrice !== Infinity ? hotelMinHourlyPrice : null,
                minOvernightPrice: hotelMinOvernightPrice !== Infinity ? hotelMinOvernightPrice : null
              });
            }
          } catch (error) {
            console.error(`Error checking hotel ${similarHotel.id}:`, error);
            // Continue with next hotel
            similarHotelsWithPrices.push({
              ...similarHotel,
              hasHourly: false,
              hasOvernight: false,
              minHourlyPrice: null,
              minOvernightPrice: null
            });
          }
        }

        setSimilarHotels(similarHotelsWithPrices);
        setHasAlternativeStays(alternativeFound);
        setSimilarHotelsPrices({
          minHourlyPrice: minHourlyPrice !== Infinity ? minHourlyPrice : 0,
          minOvernightPrice: minOvernightPrice !== Infinity ? minOvernightPrice : 0
        });

      } catch (error) {
        console.error("Error fetching similar hotels:", error);
      } finally {
        setLoadingSimilarHotels(false);
        setCheckingAlternativeStays(false);
      }
    };

    fetchSimilarHotelsAndCheckAlternative();
  }, [hotel.id, hotel.propertyName, bookingType]);

  const computeNights = () => {
    if ((bookingType || "").toLowerCase() === "hourly") return 1;

    if (checkinDate && checkOutDate) {
      const inDate = dayjs(checkinDate);
      const outDate = dayjs(checkOutDate);
      if (inDate.isValid() && outDate.isValid()) {
        const diff = outDate.diff(inDate, "day");
        return Math.max(1, diff);
      }
    }

    const urlNights = Number(queryParams.get("nights"));
    return Math.max(
      1,
      Number.isFinite(urlNights) && urlNights > 0 ? Math.floor(urlNights) : 1
    );
  };

  const nights = computeNights();

  const [selectedRoom, setSelectedRoom] = useState<any>(availableRooms[0] ?? null);
  const [selectedSlot, setSelectedSlot] = useState<{
    roomId: number | null;
    slot: string | null;
  }>({
    roomId: availableRooms?.[0]?.id ?? null,
    slot: bookingType === "hourly" ? "rateFor3Hour" : "rateFor1Night",
  });

  // --- New State for Mapbox ---
  const [mapViewport, setMapViewport] = useState({
    latitude: 20.5937, // Default to India center
    longitude: 78.9629,
    zoom: 12
  });
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!selectedRoom && availableRooms && availableRooms.length > 0) {
      setSelectedRoom(availableRooms[0]);
      setSelectedSlot({
        roomId: availableRooms[0].id,
        slot: bookingType === "hourly" ? "rateFor3Hour" : "rateFor1Night",
      });
    }
  }, [availableRooms]);

  const handleSlotSelection = (roomId: number, slot: string) => {
    const room = availableRooms.find((r: any) => r.id === roomId);
    if (room) setSelectedRoom(room);
    setSelectedSlot({ roomId, slot });
  };

  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const maxLength = 150;

  const [isSticky, setIsSticky] = useState(false);
  const [stopPosition, setStopPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const boxA = document.getElementById("boxA");
      const boxB = document.getElementById("boxB");
      const boxC = document.getElementById("boxC");

      if (!boxA || !boxB || !boxC) return;

      const boxBRect = boxB.getBoundingClientRect();
      const boxARect = boxA.getBoundingClientRect();

      if (boxBRect.bottom <= window.innerHeight - 400) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }

      setStopPosition(boxARect.bottom + window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [position, setPosition] = useState<"relative" | "unset">("relative");
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setPosition(entry.isIntersecting ? "relative" : "unset");
      },
      { threshold: 0.1 }
    );

    if (boxRef.current) {
      observer.observe(boxRef.current);
    }

    return () => {
      if (boxRef.current) {
        observer.unobserve(boxRef.current);
      }
    };
  }, []);

  const [value, setValue] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const isMobile = useMediaQuery("(max-width: 900px)");

  const navigate = useNavigate();

  // Per-unit price breakdown (no coupon logic)
  const unitBasePrice =
    selectedSlot.roomId && selectedSlot.slot && selectedRoom
      ? getPriceForSlot(selectedRoom, selectedSlot.slot)
      : 0;
  const unitBreakdown = calculatePriceBreakdown(unitBasePrice);

  // multipliers
  const roomsMultiplier = roomsCountParam;
  const perStayMultiplier =
    (bookingType || "").toLowerCase() === "hourly" ? 1 : nights;
  const totalMultiplier = roomsMultiplier * perStayMultiplier;

  // totals (apply multiplier)
  const totalBreakdown = {
    basePrice: unitBreakdown.basePrice * totalMultiplier,
    platformFee: unitBreakdown.platformFee * totalMultiplier,
    gstOnBase: unitBreakdown.gstOnBase * totalMultiplier,
    gstOnPlatform: unitBreakdown.gstOnPlatform * totalMultiplier,
    gstTotal: unitBreakdown.gstTotal * totalMultiplier,
    gatewayFee: unitBreakdown.gatewayFee * totalMultiplier,
    finalPrice: unitBreakdown.finalPrice * totalMultiplier,
  };

  // display values (TOTALS)
  const displayBase = totalBreakdown.basePrice;
  const displayBasePlus700 = displayBase + 700;
  const displayCombinedBasePlatform =
    totalBreakdown.basePrice + totalBreakdown.platformFee;
  const displayGstTotal = totalBreakdown.gstTotal;

  // Function to geocode address using Mapbox
  const geocodeAddress = useCallback(async (address: string) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setMapViewport(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        setMapLoaded(true);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      setMapLoaded(true); // Map still loads even if geocoding fails
    }
  }, [MAPBOX_ACCESS_TOKEN]);

  // Geocode on component mount or when address changes
  useEffect(() => {
    if (hotel.address) {
      geocodeAddress(hotel.address);
    }
  }, [hotel.address, geocodeAddress]);

  // Function to render sold out overlay with inventory info
  const renderSoldOutOverlay = (room: any) => {
    const inventoryStatus = getRoomInventoryStatus(room);

    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2,
          borderRadius: '12px',
          color: 'white',
          padding: 2,
        }}
      >
        <Block sx={{ fontSize: 48, mb: 1, color: '#ff4444' }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff4444' }}>
          {inventoryStatus.status.toUpperCase()}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          {inventoryStatus.reason}
        </Typography>
      </Box>
    );
  };

  // Function to get price text based on booking type
  const getPriceText = () => {
    if (bookingType === "hourly") {
      const minPrice = similarHotelsPrices.minOvernightPrice;
      return minPrice > 0 ? `Similar hotels in Bhubaneswar offer overnight stays starting from ₹${minPrice} per night` : "Similar hotels in Bhubaneswar offer overnight stays";
    } else {
      const minPrice = similarHotelsPrices.minHourlyPrice;
      return minPrice > 0 ? `Similar hotels in Bhubaneswar offer hourly stays starting from ₹${minPrice} for 3 hours` : "Similar hotels in Bhubaneswar offer hourly stays";
    }
  };
  const hotelSchema = {
  "@context": "https://schema.org",
  "@type": "Hotel",
  "@id": `https://huts4u.com/hotel/${hotel.id}`,
  "name": hotel.propertyName,
  "url": `https://huts4u.com/hotel/${hotel.id}`,
  "image": (hotel.propertyImages || []).map((img: string) => toCdn(img)),
  "description": hotel.propertyDesc,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": hotel.address,
    "addressLocality": "Bhubaneswar",
    "addressRegion": "Odisha",
    "addressCountry": "IN"
  },
  "geo": mapViewport?.latitude && mapViewport?.longitude
    ? {
        "@type": "GeoCoordinates",
        "latitude": mapViewport.latitude,
        "longitude": mapViewport.longitude
      }
    : undefined,
  "amenityFeature": Array.from(
    new Set(
      hotel?.rooms?.flatMap((room: any) => room.amenities || []) || []
    )
  ).map((amenity: any) => ({
    "@type": "LocationFeatureSpecification",
    "name": amenity,
    "value": true
  })),
  ...(reviewCount > 0 && {
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating,
      "reviewCount": reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    }
  }),
  "makesOffer": {
    "@type": "Offer",
    "priceCurrency": "INR",
    "price": Math.round(displayCombinedBasePlatform),
    "availability": availableRooms.length > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    "url": window.location.href
  }
};


  return (
    <Box
      id="boxA"
      sx={{
        background: color.thirdColor,
        px: { xs: 2, md: 4 },
        py: 1,
        position: "relative",
      }}
    >
       <Helmet>
    <title>{hotel.propertyName} in Bhubaneswar {bookingType === "hourly" ? "Hourly" : "Overnight"} Stay in Bhubaneswar by Huts4U</title>
    <meta 
      name="description" 
      content={`Book ${hotel.propertyName} in Bhubaneswar for safe and affordable ${bookingType === "hourly" ? "hourly" : "overnight"} stays with Huts4U. Perfect for short breaks, layovers, and flexible check-ins.`}
    />
    {/* Open Graph tags for social media */}
    <meta property="og:title" content={`${hotel.propertyName} in Bhubaneswar ${bookingType === "hourly" ? "Hourly" : "Overnight"} Stay by Huts4U`} />
    <meta property="og:description" content={`Book ${hotel.propertyName} for safe and affordable ${bookingType === "hourly" ? "hourly" : "overnight"} stays.`} />
    {hotel.propertyImages && hotel.propertyImages[0] && (
      <meta property="og:image" content={toCdn(hotel.propertyImages[0])} />
    )}
    <meta property="og:type" content="website" />
    <meta property="og:url" content={window.location.href} />
    
    {/* Twitter Card tags */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={`${hotel.propertyName} - ${bookingType === "hourly" ? "Hourly" : "Overnight"} Stay in Bhubaneswar`} />
    <meta name="twitter:description" content={`Book safe and affordable ${bookingType === "hourly" ? "hourly" : "overnight"} stays at ${hotel.propertyName} with Huts4U.`} />
    {hotel.propertyImages && hotel.propertyImages[0] && (
      <meta name="twitter:image" content={toCdn(hotel.propertyImages[0])} />
    )}
    
    {/* Additional meta tags */}
    <meta name="keywords" content={`${hotel.propertyName}, Bhubaneswar hotel, ${bookingType === "hourly" ? "hourly hotel" : "overnight stay"}, short stay, affordable hotel, Huts4U`} />
    <script type="application/ld+json">
  {JSON.stringify(hotelSchema)}
</script>
  </Helmet>


      <Box
        sx={{
          px: { xs: 0, md: 2 },
        }}
      >
        <Box
          ref={boxRef}
          id="boxB"
          sx={{
            ...BoxStyle,
            px: { xs: 2, md: 3 },
            py: 3,
            position,
          }}
        >
          {/* HEADER + IMAGES + HIGHLIGHTS */}
          {/* HEADER RATING SECTION - Remove rating text when no reviews */}
          <Box
            sx={{
              position: "absolute",
              top: 24,
              right: 24,
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {/* Only show rating text if there are reviews */}
            {reviewCount > 0 && (
              <Typography
                variant="body2"
                fontWeight={600}
                color={color.firstColor}
                lineHeight={1}
                sx={{
                  fontSize: { xs: "12px", md: "14px" },
                  textAlign: "center",
                }}
              >
                {/* Removed getRatingText - Only show count */}
                <span style={{ fontSize: "10px" }}>
                  ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                </span>
              </Typography>
            )}

            <Typography
              variant="body2"
              fontWeight={600}
              color="#fff"
              sx={{
                background: reviewCount > 0 ? getRatingColor(averageRating) : '#bdbdbd',
                px: 1,
                borderRadius: "4px",
                fontSize: { xs: "14px", md: "16px" },
                boxShadow: "0px -10px 10px rgba(0, 0, 0, 0.12) inset",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {averageRating > 0 ? averageRating.toFixed(1) : "N/A"} <StarRounded />
            </Typography>
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: "18px", md: "24px" },
              fontWeight: 600,
              color: color.firstColor,
            }}
          >
            {hotel.propertyName}
          </Typography>
          <Typography
            color="textSecondary"
            sx={{
              fontFamily: "CustomFontSB",
              fontSize: { xs: "10px", md: "14px" },
              color: color.paperColor,
              mt: { xs: 1, md: 0 },
            }}
          >
            {hotel.address}
          </Typography>

          <Box py={2} sx={{ pr: { xs: 0, md: 2 }, mx: -1 }}>
            <ImageGrid propertyImages={hotel.propertyImages} />
          </Box>

          <Box
            sx={{
              display: { xs: "flex", md: "none" },
            }}
          >
            <Typography
              variant="body2"
              fontWeight={600}
              color={color.thirdColor}
              sx={{
                background: color.background,
                px: 1,
                borderRadius: "4px",
                fontSize: "14px",
                mb: 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Star /> {averageRating > 0 ? averageRating.toFixed(1) : "N/A"} (
              {reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </Typography>
          </Box>

          <Box sx={{ maxWidth: { xs: "100%", md: "calc(100% - 450px)" } }}>
            {/* DESCRIPTION */}
            <Typography
              color="textSecondary"
              sx={{
                fontFamily: "CustomFontB",
                fontSize: "16px",
                color: color.paperColor,
              }}
            >
              Property Description
            </Typography>
            <Typography
              color="textSecondary"
              sx={{
                fontSize: "14px",
                mt: 1,
              }}
            >
              {expanded || (hotel.propertyDesc || "").length <= maxLength
                ? hotel.propertyDesc
                : `${hotel.propertyDesc.substring(0, maxLength)}...`}
              {(hotel.propertyDesc || "").length > maxLength && (
                <Button
                  sx={{
                    textTransform: "none",
                    fontSize: "14px",
                    p: 0,
                    ml: 1,
                    minWidth: 0,
                  }}
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Show less" : "More"}
                </Button>
              )}
            </Typography>
            {/* ADDED: Check-in & Check-out Times above Highlights */}
            {(hotel?.rooms?.[0]?.checkInTime || hotel?.rooms?.[0]?.checkOutTime) && (
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  mt: 2,
                  mb: 1,
                  flexWrap: "wrap",
                }}
              >
                {hotel?.rooms?.[0]?.checkInTime && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: "13px", md: "14px" },
                        color: color.paperColor,
                        fontWeight: 600,
                      }}
                    >
                      Check-in:
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: "13px", md: "14px" },
                        color: color.firstColor,
                        fontWeight: 700,
                      }}
                    >
                      {hotel.rooms[0].checkInTime}
                    </Typography>
                  </Box>
                )}

                {hotel?.rooms?.[0]?.checkOutTime && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: "13px", md: "14px" },
                        color: color.paperColor,
                        fontWeight: 600,
                      }}
                    >
                      Check-out:
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: "13px", md: "14px" },
                        color: color.firstColor,
                        fontWeight: 700,
                      }}
                    >
                      {hotel.rooms[0].checkOutTime}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* HIGHLIGHTS */}
            <Typography
              sx={{
                fontFamily: "CustomFontB",
                fontSize: "16px",
                color: color.paperColor,
                mt: 2,
              }}
            >
              Highlights
            </Typography>



            <Box
              sx={{
                display: "flex",
                gap: { xs: 2, md: 6 },
                flexWrap: "wrap",
                mt: 3,
                p: 2,
                px: 4,
                pt: 3,
                backgroundColor: "rgba(93, 93, 93, 0.14)",
                justifyContent: "space-around",
                borderRadius: "12px",
                width: "fit-content",
              }}
            >
              {(hotel?.rooms?.[0]?.amenities || [])
                .slice(0, 5)
                .map((amenity: any, index: any) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Chip
                      icon={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {React.cloneElement(
                            amenityIcons[amenity] || <AddCircleOutline />,
                            {
                              sx: {
                                fontSize: { xs: 26, md: 34 },
                                color: color.paperColor,
                              },
                            }
                          )}
                        </Box>
                      }
                      size="small"
                      sx={{ bgcolor: "transparent" }}
                    />

                    <Typography
                      sx={{ fontSize: { xs: "10px", md: "14px" } }}
                      mt={1.5}
                    >
                      {amenity}
                    </Typography>
                  </div>
                ))}
            </Box>
          </Box>

          {/* RIGHT STICKY BOOKING SUMMARY BOX */}
          <Box
            id="boxC"
            sx={{
              ...BoxStyle,
              minWidth: "350px",
              maxWidth: "350px",
              maxHeight: "none",
              pb: 3,
              position: isSticky ? "fixed" : "absolute",
              bottom: isSticky ? "10px" : "-380px",
              right: isSticky ? "72px" : "24px",
              zIndex: 100,
              m: 0,
              background: color.thirdColor,
              transition: "bottom 0.3s ease",
              overflow: "visible",
              overflowY: "visible",
              ...(isSticky &&
                typeof window !== "undefined" &&
                window.scrollY >= stopPosition
                ? { position: "absolute", bottom: "85px" }
                : {}),

              "@media (max-width: 900px)": {
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                minWidth: "unset",
                maxWidth: "100%",
                borderRadius: "10px 10px 0 0",
                p: 2,
              },
            }}
          >
            {isMobile && (
              <Box
                onClick={() => setShowDetails(!showDetails)}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  p: 1,
                  m: -2,
                  mb: showDetails ? -4 : 0,
                  background: color.background,
                  color: color.thirdColor,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "18px",
                  }}
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                </Typography>
                {!showDetails ? <ExpandLess /> : <ExpandMore />}
              </Box>
            )}

            {(showDetails || !isMobile) && (
              <>
                {!isMobile && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "50px",
                      background: color.background,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Typography
                      fontWeight={600}
                      color={color.thirdColor}
                      fontSize={"20px"}
                    >
                      Get upto 15% discount on all bookings
                    </Typography>
                  </Box>
                )}

                <Typography
                  sx={{
                    fontFamily: "CustomFontB",
                    fontSize: "16px",
                    color: color.paperColor,
                    mt: "50px",
                  }}
                >
                  Your Booking Summary
                </Typography>

                {/* Dates */}
                <Box
                  sx={{
                    mt: 2,
                    border: "solid 1px",
                    borderColor: color.forthColor,
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    boxShadow:
                      "0px -10px 20px rgba(0, 0, 0, 0.12) inset",
                  }}
                >
                  <Box
                    p={2}
                    sx={{
                      width: "50%",
                    }}
                  >
                    <Typography fontSize={"14px"} color={color.forthColor}>
                      Check In Date
                    </Typography>

                    <Typography fontWeight={600}>
                      {checkinDate
                        ? dayjs(checkinDate).format("DD MMM YYYY")
                        : ""}
                    </Typography>
                  </Box>
                  <Divider
                    sx={{
                      opacity: 1,
                      borderWidth: "1.5px",
                      borderColor: color.forthColor,
                    }}
                    orientation="vertical"
                    flexItem
                  />
                  <Box
                    p={2}
                    sx={{
                      width: "50%",
                    }}
                  >
                    {bookingType === "hourly" ? (
                      <>
                        <Typography
                          fontSize={"14px"}
                          color={color.forthColor}
                        >
                          Check In Time
                        </Typography>

                        <Typography fontWeight={600}>
                          {checkinTime
                            ? dayjs(checkinTime, "HH:mm").format("hh:mm A")
                            : ""}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography
                          fontSize={"14px"}
                          color={color.forthColor}
                        >
                          Check Out Date
                        </Typography>

                        <Typography fontWeight={600}>
                          {checkOutDate
                            ? dayjs(checkOutDate).format("DD MMM YYYY")
                            : ""}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>

                {/* Rooms & Guests */}
                <Box
                  mt={2}
                  p={2}
                  sx={{
                    border: "solid 1px",
                    borderColor: color.forthColor,
                    borderRadius: "12px",
                    px: 4,
                    textAlign: "left",
                    boxShadow:
                      "0px -10px 20px rgba(0, 0, 0, 0.12) inset",
                  }}
                >
                  <Typography fontSize={"14px"} color={color.forthColor}>
                    Rooms & Guest Details
                  </Typography>

                  <Typography fontWeight={600}>
                    {roomsCountParam} Room
                    {roomsCountParam > 1 ? "s" : ""}, {adults} Adults,{" "}
                    {children} Children
                  </Typography>
                </Box>

                {/* Selected Room type (summary box) */}
                <Box
                  mt={2}
                  p={2}
                  sx={{
                    border: "solid 1px",
                    borderColor: color.forthColor,
                    borderRadius: "12px",
                    px: 4,
                    textAlign: "left",
                    boxShadow:
                      "0px -10px 20px rgba(0, 0, 0, 0.12) inset",
                    pb: 3,
                    fontFamily: "CustomFontB",
                  }}
                >
                  <Typography
                    fontSize={"14px"}
                    color={color.forthColor}
                    mb={1}
                  >
                    Selected Room Type
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={selectedRoom?.id ?? ""}
                      onChange={(e) => {
                        const room = availableRooms.find(
                          (r: any) => r.id === Number(e.target.value)
                        );
                        if (room) {
                          setSelectedRoom(room);
                          setSelectedSlot({
                            roomId: room.id,
                            slot:
                              (bookingType || "").toLowerCase() === "hourly"
                                ? "rateFor3Hour"
                                : "rateFor1Night",
                          });
                        }
                      }}
                    >
                      {selectedRoom && (
                        <StyledLabel
                          key={selectedRoom.id}
                          value={selectedRoom.id}
                          checked
                          control={<CustomRadio />}
                          label={
                            <Typography
                              sx={{ fontWeight: "bold" }}
                            >
                              {selectedRoom?.roomCategory}
                            </Typography>
                          }
                        />
                      )}
                    </RadioGroup>
                  </FormControl>
                </Box>

                {/* Hourly slot selector (3hr / 6hr / 12hr) with price + taxes & fees */}
                {(bookingType || "").toLowerCase() === "hourly" &&
                  selectedRoom && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-around",
                        gap: "6px",
                        marginTop: "20px",
                      }}
                    >
                      {["rateFor3Hour", "rateFor6Hour", "rateFor12Hour"]
                        .filter(
                          (slotKey) => {
                            const price = getPriceForSlot(selectedRoom, slotKey);
                            return price > 0 && isSlotAvailable(selectedRoom, slotKey);
                          }
                        )
                        .map((slotKey) => {
                          const slotLabel =
                            slotKey
                              .replace("rateFor", "")
                              .replace("Hour", "") + "hrs";
                          const price = getPriceForSlot(selectedRoom, slotKey);
                          const breakdown = calculatePriceBreakdown(price);
                          const {
                            basePrice,
                            platformFee,
                            gstTotal,
                          } = breakdown as any;

                          // per unit (per room per slot) display
                          const perUnitMain = basePrice + platformFee;
                          const perUnitTaxes = gstTotal;

                          return (
                            <StyledToggleButton
                              key={slotKey}
                              value={slotLabel}
                              selected={
                                selectedSlot.roomId === selectedRoom.id &&
                                selectedSlot.slot === slotKey
                              }
                              onClick={() =>
                                handleSlotSelection(selectedRoom.id, slotKey)
                              }
                              style={{ borderColor: color.forthColor }}
                            >
                              <Typography
                                px={1}
                                py={0.5}
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  lineHeight: 1.4,
                                }}
                              >
                                ₹ {Math.round(perUnitMain)}
                                <br />
                                <span
                                  style={{ fontSize: "10px" }}
                                >
                                  {slotLabel} • + ₹
                                  {Math.round(
                                    perUnitTaxes
                                  )}{" "}
                                  taxes & fees
                                </span>
                              </Typography>
                            </StyledToggleButton>
                          );
                        })}
                    </div>
                  )}

                <Divider
                  sx={{ mt: 3, mb: 1, borderColor: color.forthColor }}
                />
              </>
            )}

            {/* PRICE SUMMARY AT BOTTOM */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                mt: 0,
                px: { xs: 1, md: 3 },
              }}
            >
              {/* 1) TOTAL PRICE (top) */}
              <Box>
                <Typography
                  fontSize={"14px"}
                  color={color.forthColor}
                  mt={1}
                >
                  Total Price
                  {bookingType !== "hourly" && totalMultiplier > 1
                    ? ` (for ${roomsCountParam} room${roomsCountParam > 1 ? "s" : ""
                    } • ${perStayMultiplier} night${perStayMultiplier > 1 ? "s" : ""
                    })`
                    : ` (for ${roomsCountParam} room${roomsCountParam > 1 ? "s" : ""
                    })`}
                  :
                </Typography>

                {/* Top struck-through bigger: base + 700 */}
                <Typography
                  sx={{
                    fontSize: "18px",
                    color: color.paperColor,
                    textDecoration: "line-through",
                    fontWeight: 600,
                    mt: 0.5,
                  }}
                >
                  {displayBase > 0
                    ? `₹ ${displayBasePlus700.toFixed(0)}`
                    : "---"}
                </Typography>

                {/* Main bold price = base + platform */}
                <Typography
                  fontSize={"24px"}
                  color={color.firstColor}
                  fontWeight={"bold"}
                  mt={0.5}
                >
                  {displayCombinedBasePlatform > 0
                    ? `₹${displayCombinedBasePlatform.toFixed(0)}`
                    : "—"}
                </Typography>

                {/* GST & Fees combined */}
                <Typography
                  fontSize={"14px"}
                  color={color.forthColor}
                  mt={0.5}
                >
                  {displayGstTotal > 0
                    ? `+ ₹${displayGstTotal.toFixed(
                      0
                    )} taxes & fees`
                    : ""}
                </Typography>
              </Box>

              {/* 3) BOOK NOW (last, full width) */}
              <Box>
                <CustomButton
                  customStyles={{
                    width: "100%",
                    height: "52px",
                    fontSize: "16px",
                    marginTop: "4px",
                    // Disable if no available rooms or selected room is unavailable
                    opacity: availableRooms.length === 0 ? 0.5 : 1,
                    cursor: availableRooms.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => {
                    // Prevent booking if no available rooms
                    if (availableRooms.length === 0) return;

                    // Check if selected room and slot are still available
                    if (selectedRoom && selectedSlot.slot) {
                      const isAvailable = isSlotAvailable(selectedRoom, selectedSlot.slot);
                      if (!isAvailable) {
                        alert('This room is no longer available. Please select another room or slot.');
                        return;
                      }
                    }

                    const queryString =
                      new URLSearchParams(queryParams).toString();

                    navigate(
                      `/booking-summary/${hotel.id}${queryString ? `?${queryString}` : ""
                      }`,
                      {
                        state: {
                          hotelData: hotel,
                          selectedRoom: selectedRoom,
                          selectedSlot: selectedSlot,
                          pricingDetails: {
                            rooms: roomsCountParam,
                            nights: perStayMultiplier,
                            basePrice: totalBreakdown.basePrice,
                            platformFee: totalBreakdown.platformFee,
                            gstOnBase: totalBreakdown.gstOnBase,
                            gstOnPlatform:
                              totalBreakdown.gstOnPlatform,
                            gstTotal: totalBreakdown.gstTotal,
                            gatewayFee: totalBreakdown.gatewayFee,
                            totalPrice: totalBreakdown.finalPrice,
                          },
                          inventoryData: inventoryData[selectedRoom?.id] || [],
                        },
                      }
                    );
                  }}
                  variant="contained"
                >
                  {availableRooms.length === 0 ? 'No Rooms Available' : 'Book Now'}
                </CustomButton>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* LOWER TABS SECTION */}
        <Box
          sx={{
            ...BoxStyle,
            px: { xs: 1, md: 4 },
            pb: 3,
          }}
        >
          <Tabs
            variant="scrollable"
            value={value}
            onChange={(event, newValue) => setValue(newValue)}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                color: color.forthColor,
                fontSize: "1rem",
                p: 0,
                minWidth: "10px",
                mx: 1,
                px: 0.5,
              },
              "& .Mui-selected": {
                color: "#000 !important",
                fontWeight: "bold",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#000",
                height: 3,
                borderRadius: "4px",
              },
            }}
          >
            <Tab label="Rooms" />
            <Tab label="Location" />
            <Tab label="Service & Amenities" />
            <Tab label="Policies" />
            {/* New Ratings Tab */}
            <Tab label="Ratings & Reviews" />
          </Tabs>

          <TabPanel value={value} index={0}>
            {/* Loading inventory indicator */}
            {loadingInventory && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="textSecondary">
                  Checking room availability...
                </Typography>
              </Box>
            )}

            {/* Alert if all rooms are unavailable */}
            {availableRooms.length === 0 && !loadingInventory && (
              <Alert
                severity="error"
                sx={{ mb: 3 }}
                icon={<Block />}
              >
                <AlertTitle>All Rooms Sold Out</AlertTitle>
                All rooms in this hotel are currently unavailable for your selected dates. Please try different dates or explore other hotels.
              </Alert>
            )}

            {/* Alert if some rooms are available but there are also unavailable ones */}
            {unavailableRooms.length > 0 && availableRooms.length > 0 && !loadingInventory && (
              <Alert
                severity="info"
                sx={{ mb: 3 }}
              >
                <AlertTitle>Some Rooms Unavailable</AlertTitle>
                {unavailableRooms.length} room{unavailableRooms.length > 1 ? 's are' : ' is'} currently unavailable for your selected dates. Showing {availableRooms.length} available room{availableRooms.length > 1 ? 's' : ''}.
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* First show available rooms */}
              {availableRooms.map((room: any) => {
                const inventoryStatus = getRoomInventoryStatus(room);
                const availableSlots = (bookingType || "").toLowerCase() === "hourly"
                  ? ["rateFor3Hour", "rateFor6Hour", "rateFor12Hour"]
                  : ["rateFor1Night"];

                const hasAvailableSlots = availableSlots.some(slot => {
                  const price = getPriceForSlot(room, slot);
                  return price > 0 && isSlotAvailable(room, slot);
                });

                return (
                  <Grid item xs={12} md={7} key={`available-${room.id}`}>
                    <Card
                      sx={{
                        p: 2,
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: "flex-start",
                        background: color.thirdColor,
                        borderRadius: "12px",
                        boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.18)",
                        border: "solid 2px",
                        borderColor:
                          selectedRoom?.id === room.id
                            ? color.firstColor
                            : "transparent",
                        position: "relative",
                        overflow: "visible",
                        cursor: hasAvailableSlots ? 'pointer' : 'default',
                        opacity: hasAvailableSlots ? 1 : 0.7,
                      }}
                      onClick={() => {
                        if (!hasAvailableSlots) return;

                        // Select the room when card is clicked
                        setSelectedRoom(room);
                        // Also set default slot for this room
                        const defaultSlot = bookingType === "hourly"
                          ? (getPriceForSlot(room, "rateFor3Hour") > 0 && isSlotAvailable(room, "rateFor3Hour") ? "rateFor3Hour" :
                            getPriceForSlot(room, "rateFor6Hour") > 0 && isSlotAvailable(room, "rateFor6Hour") ? "rateFor6Hour" :
                              getPriceForSlot(room, "rateFor12Hour") > 0 && isSlotAvailable(room, "rateFor12Hour") ? "rateFor12Hour" : "rateFor1Night")
                          : "rateFor1Night";
                        setSelectedSlot({
                          roomId: room.id,
                          slot: defaultSlot
                        });
                      }}
                    >
                      {selectedRoom?.id === room.id && (
                        <CheckCircle
                          sx={{
                            position: "absolute",
                            top: -10,
                            right: -10,
                            color: color.firstColor,
                            background: color.thirdColor,
                            borderRadius: "50%",
                          }}
                        />
                      )}

                      {/* Inventory status badge */}
                      {inventoryStatus.icon && (
                        <Tooltip title={inventoryStatus.reason}>
                          <Box
                            sx={{
                              position: "absolute",
                              top: 10,
                              left: 10,
                              background: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              zIndex: 1,
                            }}
                          >
                            {inventoryStatus.icon}
                            <Typography variant="caption" fontWeight="bold">
                              {inventoryStatus.status}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}

                      <Box
                        sx={{
                          width: {
                            xs: "100%",
                            md: "fit-content",
                          },
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="160"
                          sx={{
                            borderRadius: "12px",
                            width: { xs: "100%", md: "250px" },
                          }}
                          image={toCdn(room.roomImages)}
                          alt={room.roomCategory}
                        />

                        <Typography
                          variant="h6"
                          mt={1.5}
                          fontWeight={"bold"}
                          sx={{
                            background:
                              selectedRoom?.id === room.id
                                ? color.firstColor
                                : "transparent",
                            ml: -2,
                            pl: 2,
                            borderRadius: "0px 4px 4px 0px",
                            color:
                              selectedRoom?.id === room.id
                                ? color.thirdColor
                                : color.firstColor,
                            mb:
                              selectedRoom?.id === room.id ? 1 : 0,
                            width: {
                              xs: "fit-content",
                              md: "100%",
                            },
                            pr: { xs: 2, md: 0 },
                            mt: { xs: 2, md: 1 },
                            transition: "all 0.3s",
                          }}
                        >
                          {room.roomCategory}
                        </Typography>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            justifyContent: "flex-start",
                            gap: "4px",
                          }}
                        >
                          <Typography variant="body2">
                            Room Size : {room.roomSize} sqft
                          </Typography>

                          {showRoomDetails && (
                            <>
                              <Typography variant="body2">
                                Standard Room Occupancy :{" "}
                                {room.standardRoomOccupancy} head(s)
                              </Typography>
                              <Typography variant="body2">
                                No. Of Free Children Allowed :{" "}
                                {room.numberOfFreeChildren}
                              </Typography>

                              <Typography variant="body2">
                                Max Room Occupancy :{" "}
                                {room.maxRoomOccupancy} head(s)
                              </Typography>

                              <Typography variant="body2">
                                Price per Additional Adult : ₹
                                {room.additionalGuestRate}
                              </Typography>
                              <Typography variant="body2">
                                Price per Additional Child : ₹
                                {room.additionalChildRate}
                              </Typography>
                            </>
                          )}
                          <Button
                            sx={{
                              textTransform: "none",
                              fontSize: "12px",
                              p: 0,
                              minWidth: 0,
                              ml: 0.2,
                              color: color.firstColor,
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent room selection
                              setShowRoomDetails(!showRoomDetails);
                            }}
                          >
                            {showRoomDetails ? "Show less" : "...More"}
                          </Button>
                        </div>
                      </Box>

                      <List
                        sx={{
                          py: 0,
                          mt: 1,
                          width: "100%",
                          pb: { xs: 0, md: "80px" },
                        }}
                      >
                        <RoomAmenities key={room.id} room={room} />
                      </List>

                      {/* ROOM SLOT PRICING (LEFT SIDE) – 3hr / 6hr / 12hr / per night */}
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: "space-around",
                          gap: "6px",
                          position: { xs: "unset", md: "absolute" },
                          bottom: 16,
                          right: 16,
                          margin: "auto",
                          marginTop: "20px",
                        }}
                      >
                        {availableSlots
                          .filter(slotKey => {
                            const price = getPriceForSlot(room, slotKey);
                            return price > 0 && isSlotAvailable(room, slotKey);
                          })
                          .map((slotKey) => {
                            const slotLabel =
                              (bookingType || "").toLowerCase() === "hourly"
                                ? slotKey
                                  .replace("rateFor", "")
                                  .replace("Hour", "") + "hrs"
                                : "Per Night";

                            const price = getPriceForSlot(room, slotKey);
                            const breakdown = calculatePriceBreakdown(price);
                            const { basePrice, platformFee, gstTotal } = breakdown as any;

                            // per unit (per room per slot/night)
                            const perUnitMain = basePrice + platformFee;
                            const perUnitTaxes = gstTotal;

                            return (
                              <StyledToggleButton
                                key={slotKey}
                                value={slotLabel}
                                selected={
                                  selectedSlot.roomId === room.id &&
                                  selectedSlot.slot === slotKey
                                }
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card selection
                                  if (isSlotAvailable(room, slotKey)) {
                                    handleSlotSelection(room.id, slotKey);
                                  }
                                }}
                                style={{
                                  borderColor: color.forthColor,
                                  cursor: isSlotAvailable(room, slotKey) ? 'pointer' : 'not-allowed',
                                  opacity: isSlotAvailable(room, slotKey) ? 1 : 0.5,
                                }}
                                disabled={!isSlotAvailable(room, slotKey)}
                              >
                                <Typography
                                  px={1}
                                  py={0.5}
                                  sx={{
                                    fontSize: { xs: "8px", md: "12px" },
                                    lineHeight: 1.4,
                                    textAlign: 'center',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "18px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {slotLabel}
                                  </span>
                                  <br />
                                  <span style={{ fontSize: "16px", fontWeight: 700 }}>
                                    ₹ {Math.round(perUnitMain)}
                                  </span>
                                  <br />
                                  <span style={{ fontSize: "10px" }}>
                                    + ₹{Math.round(perUnitTaxes)} taxes & fees
                                  </span>
                                </Typography>
                              </StyledToggleButton>
                            );
                          })}
                      </Box>
                    </Card>
                  </Grid>
                );
              })}

              {/* Then show unavailable rooms with sold out overlay */}
              {unavailableRooms.map((room: any) => (
                <Grid item xs={12} md={7} key={`unavailable-${room.id}`}>
                  <Card
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      alignItems: "flex-start",
                      background: color.thirdColor,
                      borderRadius: "12px",
                      boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.18)",
                      border: "solid 2px",
                      borderColor: "transparent",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Sold Out Overlay */}
                    {renderSoldOutOverlay(room)}

                    <Box
                      sx={{
                        width: {
                          xs: "100%",
                          md: "fit-content",
                        },
                        opacity: 0.5,
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="160"
                        sx={{
                          borderRadius: "12px",
                          width: { xs: "100%", md: "250px" },
                          filter: 'grayscale(50%)',
                        }}
                        image={room.roomImages}
                        alt={room.roomCategory}
                      />

                      <Typography
                        variant="h6"
                        mt={1.5}
                        fontWeight={"bold"}
                        sx={{
                          background: "transparent",
                          ml: -2,
                          pl: 2,
                          borderRadius: "0px 4px 4px 0px",
                          color: color.firstColor,
                          mb: 0,
                          width: {
                            xs: "fit-content",
                            md: "100%",
                          },
                          pr: { xs: 2, md: 0 },
                          mt: { xs: 2, md: 1 },
                          transition: "all 0.3s",
                        }}
                      >
                        {room.roomCategory}
                      </Typography>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          justifyContent: "flex-start",
                          gap: "4px",
                        }}
                      >
                        <Typography variant="body2">
                          Room Size : {room.roomSize} sqft
                        </Typography>
                      </div>
                    </Box>

                    <List
                      sx={{
                        py: 0,
                        mt: 1,
                        width: "100%",
                        pb: { xs: 0, md: "80px" },
                        opacity: 0.5,
                      }}
                    >
                      <RoomAmenities key={room.id} room={room} />
                    </List>

                    {/* ROOM SLOT PRICING - Show crossed out pricing for unavailable rooms */}
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-around",
                        gap: "6px",
                        position: { xs: "unset", md: "absolute" },
                        bottom: 16,
                        right: 16,
                        margin: "auto",
                        marginTop: "20px",
                        opacity: 0.5,
                      }}
                    >
                      {((bookingType || "").toLowerCase() === "hourly"
                        ? ["rateFor3Hour", "rateFor6Hour", "rateFor12Hour"]
                        : ["rateFor1Night"]
                      ).filter((slotKey) => getPriceForSlot(room, slotKey) > 0)
                        .map((slotKey) => {
                          const slotLabel =
                            (bookingType || "").toLowerCase() === "hourly"
                              ? slotKey
                                .replace("rateFor", "")
                                .replace("Hour", "") + "hrs"
                              : "Per Night";

                          const price = getPriceForSlot(room, slotKey);
                          const breakdown = calculatePriceBreakdown(price);
                          const { basePrice, platformFee, gstTotal } = breakdown as any;

                          const perUnitMain = basePrice + platformFee;
                          const perUnitTaxes = gstTotal;

                          return (
                            <Box
                              key={slotKey}
                              sx={{
                                borderRadius: "4px",
                                textTransform: "none",
                                fontSize: "12px",
                                padding: "0px 10px",
                                fontWeight: 600,
                                border: "1px solid rgba(61, 61, 61, 0.4)",
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                position: 'relative',
                              }}
                            >
                              {/* Cross out line */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: 0,
                                  right: 0,
                                  height: '2px',
                                  backgroundColor: '#ff4444',
                                  transform: 'rotate(-15deg)',
                                  zIndex: 1,
                                }}
                              />

                              <Typography
                                px={1}
                                py={0.5}
                                sx={{
                                  fontSize: { xs: "8px", md: "12px" },
                                  lineHeight: 1.4,
                                  color: 'rgba(0, 0, 0, 0.5)',
                                  position: 'relative',
                                  zIndex: 2,
                                  textAlign: 'center',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "18px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {slotLabel}
                                </span>
                                <br />
                                <span style={{ fontSize: "16px", fontWeight: 700 }}>
                                  ₹ {Math.round(perUnitMain)}
                                </span>
                                <br />
                                <span style={{ fontSize: "10px", color: color.forthColor }}>
                                  + ₹{Math.round(perUnitTaxes)} taxes & fees
                                </span>
                              </Typography>
                            </Box>
                          );
                        })}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Show alternative booking type search button INSIDE TabPanel */}
            {checkingAlternativeStays ? (
              <Box sx={{ mt: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="textSecondary">
                  Checking for {bookingType === "hourly" ? "overnight" : "hourly"} stays in similar hotels...
                </Typography>
              </Box>
            ) : hasAlternativeStays && !loadingSimilarHotels && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <CustomButton
                  variant="contained"
                  startIcon={<Search />}
                  customStyles={{
                    backgroundColor: bookingType === "hourly" ? color.secondColor : color.firstColor,
                    color: color.thirdColor,
                    fontWeight: 600,
                    fontSize: "14px",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                  onClick={() => {
                    // Get current search params
                    const searchParams = new URLSearchParams();

                    // Set location to "Bhubaneswar" as requested
                    searchParams.set("location", "Bhubaneswar");

                    // Set booking type to the opposite of current
                    const oppositeBookingType = bookingType === "hourly" ? "fullDay" : "hourly";
                    searchParams.set("bookingType", oppositeBookingType);

                    if (oppositeBookingType === "hourly") {
                      // Set default hourly parameters
                      searchParams.set("bookingHours", "3");
                      searchParams.set("rooms", "1");
                      searchParams.set("adults", "1");
                      searchParams.set("children", "0");
                    } else {
                      // Set default overnight parameters
                      const today = dayjs().format('YYYY-MM-DD');
                      const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
                      searchParams.set("checkinDate", today);
                      searchParams.set("checkOutDate", tomorrow);
                      searchParams.set("rooms", "1");
                      searchParams.set("adults", "1");
                      searchParams.set("children", "0");
                      searchParams.set("nights", "1");
                    }

                    // Navigate to search results
                    navigate(`/search?${searchParams.toString()}`);
                  }}
                >
                  {bookingType === "hourly" ? "Search Overnight Stays" : "Search Hourly Stays"} in Similar Hotels
                </CustomButton>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1, fontSize: '12px' }}>
                  {getPriceText()}
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={value} index={1}>
            <Box sx={{ mt: 2 }}>
              <Typography
                sx={{
                  fontFamily: "CustomFontB",
                  fontSize: "16px",
                  color: color.paperColor,
                  mb: 2,
                }}
              >
                Hotel Location
              </Typography>

              {/* Hotel Address with Google Maps Link */}
              <Box sx={{
                mb: 3,
                p: 2,
                bgcolor: 'rgba(93, 93, 93, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <LocationOn sx={{ fontSize: 24, color: color.firstColor }} />
                  <Box>
                    <Typography color="textSecondary" fontWeight={600}>
                      Address:
                    </Typography>
                    <Typography color="textSecondary">
                      {hotel.address}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<LocationOn />}
                  onClick={() => {
                    // Check if we have a Google Maps URL
                    if (hotel.googleBusinessPage) {
                      // Directly open the Google Maps URL
                      window.open(hotel.googleBusinessPage, '_blank');
                    } else if (hotel.address) {
                      // Fallback to creating a Google Maps search URL
                      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}`;
                      window.open(mapsUrl, '_blank');
                    }
                  }}
                  sx={{
                    bgcolor: color.firstColor,
                    '&:hover': { bgcolor: color.background }
                  }}
                >
                  {hotel.googleBusinessPage ? 'View on Google Maps' : 'Open in Google Maps'}
                </Button>
              </Box>

              {/* Simple Static Map */}
              <Box
                sx={{
                  width: '100%',
                  height: '400px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `2px solid ${color.forthColor}`,
                  position: 'relative',
                  bgcolor: 'grey.100',
                  mb: 3
                }}
              >
                {MAPBOX_ACCESS_TOKEN ? (
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l(${mapViewport.longitude},${mapViewport.latitude})/${mapViewport.longitude},${mapViewport.latitude},${mapViewport.zoom}/800x400?access_token=${MAPBOX_ACCESS_TOKEN}`}
                    alt="Hotel Location"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      // Use Google Maps URL if available
                      if (hotel.googleBusinessPage) {
                        window.open(hotel.googleBusinessPage, '_blank');
                      } else if (hotel.address) {
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}`;
                        window.open(mapsUrl, '_blank');
                      }
                    }}
                    onError={(e) => {
                      setMapLoaded(false);
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      p: 3,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      // Use Google Maps URL if available
                      if (hotel.googleBusinessPage) {
                        window.open(hotel.googleBusinessPage, '_blank');
                      } else if (hotel.address) {
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}`;
                        window.open(mapsUrl, '_blank');
                      }
                    }}
                  >
                    <Typography color="textSecondary" variant="h6" sx={{ mb: 2 }}>
                      Map Preview
                    </Typography>
                    <Typography color="textSecondary" align="center">
                      Location: {hotel.address}
                    </Typography>
                    <Typography color="textSecondary" align="center" sx={{ mt: 1 }}>
                      {hotel.googleBusinessPage ? 'Click to view on Google Maps' : 'Click to view on Google Maps'}
                    </Typography>
                  </Box>
                )}

                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    bgcolor: 'rgba(255,255,255,0.7)',
                    px: 1,
                    borderRadius: 1,
                    fontSize: '10px'
                  }}
                >
                  © Mapbox © OpenStreetMap
                </Typography>
              </Box>

              {/* Interactive Directions */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(93, 93, 93, 0.1)', borderRadius: '12px' }}>
                <Typography
                  sx={{
                    fontFamily: "CustomFontB",
                    fontSize: "16px",
                    color: color.paperColor,
                    mb: 1,
                  }}
                >
                  Get Directions
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DirectionsCar />}
                    onClick={() => {
                      // Extract place ID or coordinates from Google Maps URL if available
                      if (hotel.googleBusinessPage) {
                        // Try to extract place ID or coordinates from the URL
                        const url = hotel.googleBusinessPage;
                        // Check if it's a Google Maps URL with place ID or coordinates
                        if (url.includes('place/')) {
                          // Extract place ID from URL like: https://maps.app.goo.gl/xxxx or https://www.google.com/maps/place/...
                          window.open(url, '_blank');
                        } else {
                          // For other Google Maps URLs, use it directly
                          window.open(url, '_blank');
                        }
                      } else if (hotel.address) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotel.address)}&travelmode=driving`;
                        window.open(url, '_blank');
                      }
                    }}
                    sx={{ borderColor: color.firstColor, color: color.firstColor }}
                  >
                    Drive
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DirectionsTransit />}
                    onClick={() => {
                      if (hotel.googleBusinessPage) {
                        // Use the Google Maps URL for transit directions
                        // You might need to append transit mode parameters
                        window.open(hotel.googleBusinessPage, '_blank');
                      } else if (hotel.address) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotel.address)}&travelmode=transit`;
                        window.open(url, '_blank');
                      }
                    }}
                    sx={{ borderColor: color.firstColor, color: color.firstColor }}
                  >
                    Transit
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DirectionsWalk />}
                    onClick={() => {
                      if (hotel.googleBusinessPage) {
                        window.open(hotel.googleBusinessPage, '_blank');
                      } else if (hotel.address) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotel.address)}&travelmode=walking`;
                        window.open(url, '_blank');
                      }
                    }}
                    sx={{ borderColor: color.firstColor, color: color.firstColor }}
                  >
                    Walk
                  </Button>
                </Box>
              </Box>

              {/* Nearby Points of Interest */}
              <Box sx={{ mt: 3 }}>
                <Typography
                  sx={{
                    fontFamily: "CustomFontB",
                    fontSize: "14px",
                    color: color.paperColor,
                    mb: 1,
                  }}
                >
                  What's Nearby
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  Use the interactive map above to explore nearby restaurants, attractions, and transportation options around the hotel.
                </Typography>
                {hotel.googleBusinessPage && (
                  <Typography color="textSecondary" variant="body2" sx={{ mt: 1 }}>
                    Click any button above to view detailed information on Google Maps.
                  </Typography>
                )}
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={value} index={2}>
            <Box>
              {hotel.extraService && (
                <>
                  <Typography
                    sx={{
                      fontFamily: "CustomFontB",
                      fontSize: "16px",
                      color: color.paperColor,
                      mb: 1,
                    }}
                  >
                    Extra Services
                  </Typography>
                  <Box mb={3}>
                    {hotel.extraService.split(/[,，]/).map((service: string, index: number) => (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            color: color.paperColor,
                            mr: 1,
                            mt: 0.2,
                          }}
                        >
                          •
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "14px",
                            lineHeight: 1.6,
                          }}
                        >
                          {service.trim()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}

              <Typography
                sx={{
                  fontFamily: "CustomFontB",
                  fontSize: "16px",
                  color: color.paperColor,
                  mb: 2,
                }}
              >
                Amenities
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mt: 2,
                  p: 2,
                  px: 4,
                  pt: 3,
                  backgroundColor: "rgba(93, 93, 93, 0.14)",
                  justifyContent: "space-around",
                  borderRadius: "12px",
                  width: "fit-content",
                }}
              >
                {Array.from(
                  new Set<string>(
                    hotel?.rooms?.flatMap(
                      (room: any) => room.amenities
                    ) || []
                  )
                )
                  .slice(0, 5)
                  .map((amenity: string, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <Chip
                        icon={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {React.cloneElement(
                              amenityIcons[amenity] ||
                              <AddCircleOutline />,
                              {
                                sx: {
                                  fontSize: { xs: 26, md: 30 },
                                  color: color.paperColor,
                                },
                              }
                            )}
                          </Box>
                        }
                        size="small"
                        sx={{ bgcolor: "transparent" }}
                      />
                      <Typography
                        sx={{
                          fontSize: { xs: "10px", md: "14px" },
                        }}
                      >
                        {amenity}
                      </Typography>
                    </div>
                  ))}
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={value} index={3}>
            <Typography
              sx={{
                fontFamily: "CustomFontB",
                fontSize: "16px",
                color: color.paperColor,
                mb: 2,
              }}
            >
              Property Policies
            </Typography>
            <Box>
              {hotel.propertyPolicy?.split(/[,，]/).map((policy: string, index: number) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      color: color.paperColor,
                      mr: 1.5,
                      mt: 0.2,
                      fontWeight: "bold",
                    }}
                  >
                    •
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      lineHeight: 1.6,
                    }}
                  >
                    {policy.trim()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </TabPanel>

          {/* NEW RATINGS TAB */}
          <TabPanel value={value} index={4}>
            <Box sx={{ mt: 2 }}>
              <Typography
                sx={{
                  fontFamily: "CustomFontB",
                  fontSize: "16px",
                  color: color.paperColor,
                  mb: 2,
                }}
              >
                Ratings & Reviews
              </Typography>

              {loadingRatings ? (
                <Typography textAlign="center" color="textSecondary">
                  Loading reviews...
                </Typography>
              ) : hotelRatings.length > 0 ? (
                <>
                  {/* Overall Rating Summary - Only show when there are reviews */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 4,
                    p: 3,
                    bgcolor: 'rgba(93, 93, 93, 0.1)',
                    borderRadius: '12px',
                    flexWrap: 'wrap',
                    gap: 3
                  }}>
                    <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                      <Typography variant="h2" fontWeight="bold" color={color.firstColor}>
                        {averageRating.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        out of 5
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            sx={{
                              color: star <= Math.round(averageRating) ? '#FFD700' : '#ddd',
                              fontSize: 20
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {reviewCount} Review{reviewCount !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Individual Reviews */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {hotelRatings.map((rating: any, index: number) => (
                      <Box
                        key={index}
                        sx={{
                          p: 3,
                          border: `1px solid ${color.forthColor}`,
                          borderRadius: '12px',
                          bgcolor: 'white'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {rating.userName || 'Anonymous User'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {rating.createdAt ? dayjs(rating.createdAt).format('MMMM D, YYYY') : 'Date not available'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                sx={{
                                  color: star <= (rating.rating || 0) ? '#FFD700' : '#ddd',
                                  fontSize: 16
                                }}
                              />
                            ))}
                            <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>
                              {rating.rating || 0}.0
                            </Typography>
                          </Box>
                        </Box>

                        {rating.review && (
                          <Typography variant="body1" paragraph>
                            {rating.review}
                          </Typography>
                        )}

                        {/* Show rating categories if available */}
                        {rating.cleanliness && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                            <Typography variant="body2">
                              Cleanliness: {rating.cleanliness}/5
                            </Typography>
                            {rating.comfort && (
                              <Typography variant="body2">
                                Comfort: {rating.comfort}/5
                              </Typography>
                            )}
                            {rating.location && (
                              <Typography variant="body2">
                                Location: {rating.location}/5
                              </Typography>
                            )}
                            {rating.service && (
                              <Typography variant="body2">
                                Service: {rating.service}/5
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>

                  {/* Review Summary Stats */}
                  <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(93, 93, 93, 0.05)', borderRadius: '12px' }}>
                    <Typography variant="h6" gutterBottom>
                      Review Summary
                    </Typography>
                    <Grid container spacing={2}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = hotelRatings.filter((r: any) => Math.round(r.rating || 0) === star).length;
                        const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;

                        return (
                          <Grid item xs={12} key={star}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body2" sx={{ minWidth: 60 }}>
                                {star} stars
                              </Typography>
                              <Box sx={{ flex: 1, height: 8, bgcolor: '#eee', borderRadius: 4 }}>
                                <Box
                                  sx={{
                                    width: `${percentage}%`,
                                    height: '100%',
                                    bgcolor: star >= 4 ? '#4CAF50' : star === 3 ? '#FFC107' : '#F44336',
                                    borderRadius: 4
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" sx={{ minWidth: 40 }}>
                                {count}
                              </Typography>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                </>
              ) : (
                /* No Reviews Section - Clean and simple */
                <Box sx={{
                  textAlign: 'center',
                  py: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <StarRounded sx={{
                    fontSize: 80,
                    color: '#e0e0e0',
                    mb: 3,
                    opacity: 0.7
                  }} />
                  <Typography variant="h5" fontWeight="bold" color="textSecondary" gutterBottom>
                    No Reviews Yet
                  </Typography>
                  <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 400, mb: 4 }}>
                    Be the first to share your experience with this property!
                  </Typography>
                </Box>
              )}
            </Box>
          </TabPanel>
        </Box>
      </Box>
    </Box>
  );
};

export default HotelDetails;

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  borderRadius: "4px",
  textTransform: "none",
  fontSize: "12px",
  padding: "0px 10px",
  fontWeight: 600,
  border: "1px solid rgba(61, 61, 61, 0.4)",
  "&.Mui-selected": {
    background: color.background,
    color: "white",
  },
  "&:disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
}));

const TabPanel = ({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) => {
  return (
    <div hidden={value !== index}>
      {value === index && (
        <Box p={1} mt={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
};