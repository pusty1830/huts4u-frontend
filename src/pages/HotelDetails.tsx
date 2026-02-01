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
import Restaurant from '@mui/icons-material/Restaurant';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import BreakfastDining from '@mui/icons-material/BreakfastDining';
import LunchDining from '@mui/icons-material/LunchDining';
import DinnerDining from '@mui/icons-material/DinnerDining';
import Close from '@mui/icons-material/Close';
import ArrowRightAlt from '@mui/icons-material/ArrowRightAlt';

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
import { CDN_URL, MAPBOX_ACCESS_TOKEN, s3BASEURL } from '../services/Secret';
import { getAllRatings, getAllHotels, getMyAllHotelswithBelongsTo, getAllInventories, getHotelMeals } from '../services/services';
import { ClearAll, Info, SquareFoot } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { calculatePriceBreakdown } from '../components/Payments/Calculation';

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
  const S3_BASE_URL = s3BASEURL;
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

  // Meal plans state
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [loadingMealPlans, setLoadingMealPlans] = useState<boolean>(true);
  const [selectedMealPlan, setSelectedMealPlan] = useState<string>('Room Only'); // 'Room Only', 'EP', 'CP', 'AP'

  // Fetch meal plans
  const fetchMealPlans = async () => {
    try {
      setLoadingMealPlans(true);
      const payload = {
        data: { filter: "" },
        page: 0,
        pageSize: 1000,
        order: [["createdAt", "ASC"]],
      };

      const response = await getHotelMeals(payload);
      let mealData = response?.data?.data;

      // Handle different API response structures
      let mealArray: any[] = [];
      if (mealData?.data && Array.isArray(mealData.data)) {
        mealArray = mealData.data;
      } else if (mealData?.rows && Array.isArray(mealData.rows)) {
        mealArray = mealData.rows;
      } else if (mealData?.result && Array.isArray(mealData.result)) {
        mealArray = mealData.result;
      } else if (Array.isArray(mealData)) {
        mealArray = mealData;
      }

      // Filter meal plans for current hotel
      const hotelMealPlans = mealArray.filter((meal: any) =>
        meal.hotelId === hotel.id || meal.hotelId?.toString() === hotel.id?.toString()
      );

      setMealPlans(hotelMealPlans);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      setMealPlans([]);
    } finally {
      setLoadingMealPlans(false);
    }
  };

  // Get meal plans for a specific room
  const getMealPlansForRoom = (roomId: string) => {
    return mealPlans.filter(meal => meal.roomId === roomId || meal.roomId?.toString() === roomId?.toString());
  };

  // Update the getAvailableMealPlansForRoom function
  const getAvailableMealPlansForRoom = (room: any) => {
    const roomMealPlans = getMealPlansForRoom(room.id);
    const availablePlans = ['Room Only'];

    roomMealPlans.forEach(meal => {
      // Try different field names
      const mealType = meal.mealType || meal.mealPlan || meal.meal_type || meal.plan || meal.mealName;
      if (mealType && !availablePlans.includes(mealType)) {
        availablePlans.push(mealType);
      }
    });

    return availablePlans;
  };

  // Update the calculateMealPlanPrice function to handle string prices
  const calculateMealPlanPrice = (room: any, mealPlanType: string) => {
    if (mealPlanType === 'Room Only') {
      return 0; // No additional cost for room only
    }

    const roomMealPlans = getMealPlansForRoom(room.id);

    // Try to find meal plan by different field names
    const mealPlan = roomMealPlans.find(meal => {
      const mealType = meal.mealType || meal.mealPlan || meal.meal_type || meal.plan || meal.mealName;
      return mealType === mealPlanType;
    });

    if (!mealPlan) {
      console.warn(`Meal plan ${mealPlanType} not found for room ${room.id}`);
      return 0;
    }

    // Parse price string to number
    const mealPriceStr = mealPlan.price || mealPlan.rate || mealPlan.cost || mealPlan.mealPrice || '0';
    const mealPrice = parseFloat(mealPriceStr) || 0;

    const standardOccupancy = room.standardRoomOccupancy || 1;

    // For overnight bookings
    if (bookingType !== "hourly") {
      return mealPrice * standardOccupancy * nights;
    } else {
      // For hourly bookings, apply proportional meal cost
      const hourlyMultiplier = selectedSlot.slot === "rateFor12Hour" ? 1 :
        selectedSlot.slot === "rateFor6Hour" ? 0.5 : 0.25;
      return mealPrice * standardOccupancy * hourlyMultiplier;
    }
  };

  // Function to get room price (without meals)
  const getRoomPriceOnly = (room: any, slot: string) => {
    if (!room || !slot) return 0;
    return getPriceForSlot(room, slot);
  };

  // Add a debug function to check meal plan data


  // Get meal plan icon
  const getMealPlanIcon = (mealPlanType: string) => {
    const type = mealPlanType?.toUpperCase();
    switch (type) {
      case 'EP':
      case 'EUROPEAN PLAN':
        return <BreakfastDining />;
      case 'CP':
      case 'CONTINENTAL PLAN':
        return <RestaurantMenu />;
      case 'AP':
      case 'AMERICAN PLAN':
      case 'FULL BOARD':
        return <Restaurant />;
      case 'MAP':
      case 'MODIFIED AMERICAN PLAN':
        return <RestaurantMenu />;
      case 'ROOM ONLY':
        return null;
      default:
        // Check if it contains breakfast/lunch/dinner keywords
        if (type?.includes('BREAKFAST')) return <BreakfastDining />;
        if (type?.includes('LUNCH')) return <LunchDining />;
        if (type?.includes('DINNER')) return <DinnerDining />;
        if (type?.includes('MEAL')) return <Restaurant />;
        return null;
    }
  };

  const getMealPlanDescription = (mealPlanType: string) => {
    const type = mealPlanType?.toUpperCase();
    switch (type) {
      case 'EP':
      case 'EUROPEAN PLAN':
        return 'Room + Breakfast';
      case 'CP':
      case 'CONTINENTAL PLAN':
        return 'Room + Breakfast + Lunch/Dinner';
      case 'AP':
      case 'AMERICAN PLAN':
      case 'FULL BOARD':
        return 'All Meals Included';
      case 'MAP':
      case 'MODIFIED AMERICAN PLAN':
        return 'Room + Breakfast + Dinner';
      case 'ROOM ONLY':
        return 'Room Only';
      default:
        return mealPlanType || 'Room Only';
    }
  };

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

  // Get total price including selected meal plan
  const getTotalPriceWithMeals = (room: any, slot: string, mealPlanType: string) => {
    const roomPrice = getPriceForSlot(room, slot);
    const mealPrice = calculateMealPlanPrice(room, mealPlanType);
    return roomPrice + mealPrice;
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

  // Fetch ratings, inventory, and meal plans on component mount
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
      fetchMealPlans();
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

  // Meal plan filter state
  const [mealPlanFilter, setMealPlanFilter] = useState<string>('');

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

  // Get filtered rooms based on meal plan filter
  const getFilteredRooms = () => {
    if (!mealPlanFilter || mealPlanFilter === 'All Meal Plans') {
      return availableRooms;
    }

    return availableRooms.filter((room: any) => {
      const roomMealPlans = getAvailableMealPlansForRoom(room);
      return roomMealPlans.includes(mealPlanFilter);
    });
  };

  // Get count of filtered rooms
  const getFilteredRoomsCount = () => {
    return getFilteredRooms().length;
  };

  // Per-unit price breakdown (no coupon logic)
  const unitBasePrice =
    selectedSlot.roomId && selectedSlot.slot && selectedRoom
      ? getTotalPriceWithMeals(selectedRoom, selectedSlot.slot, selectedMealPlan)
      : 0;
  const unitBreakdown = calculatePriceBreakdown(unitBasePrice);

  // Get room-only price for breakdown display
  const unitRoomOnlyPrice = selectedSlot.roomId && selectedSlot.slot && selectedRoom
    ? getRoomPriceOnly(selectedRoom, selectedSlot.slot)
    : 0;
  const unitRoomOnlyBreakdown = calculatePriceBreakdown(unitRoomOnlyPrice);

  // Get meal price separately
  const unitMealPrice = selectedRoom ? calculateMealPlanPrice(selectedRoom, selectedMealPlan) : 0;

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

  // Room-only totals for comparison
  const totalRoomOnlyBasePrice = unitRoomOnlyBreakdown.basePrice * totalMultiplier;
  const totalRoomOnlyPlatformFee = unitRoomOnlyBreakdown.platformFee * totalMultiplier;
  const totalRoomOnlyCombined = totalRoomOnlyBasePrice + totalRoomOnlyPlatformFee;

  // display values (TOTALS)
  const displayBase = totalBreakdown.basePrice;
  const displayBasePlus700 = displayBase + 700;
  const displayCombinedBasePlatform =
    totalBreakdown.basePrice + totalBreakdown.platformFee;
  const displayGstTotal = totalBreakdown.gstTotal;

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

  // Function to handle Book Now click
  const handleBookNow = () => {
    if (availableRooms.length === 0) return;

    if (selectedRoom && selectedSlot.slot) {
      const isAvailable = isSlotAvailable(selectedRoom, selectedSlot.slot);
      if (!isAvailable) {
        alert('This room is no longer available. Please select another room or slot.');
        return;
      }
    }

    const queryString = new URLSearchParams(queryParams).toString();
    const mealPrice = calculateMealPlanPrice(selectedRoom, selectedMealPlan);
    const roomPrice = selectedSlot.slot ? getPriceForSlot(selectedRoom, selectedSlot.slot) : 0;
    const totalBasePrice = roomPrice + mealPrice;

    navigate(
      `/booking-summary/${hotel.id}${queryString ? `?${queryString}` : ""}`,
      {
        state: {
          hotelData: hotel,
          selectedRoom: selectedRoom,
          selectedSlot: selectedSlot,
          selectedMealPlan: selectedMealPlan,
          pricingDetails: {
            rooms: roomsCountParam,
            nights: perStayMultiplier,
            basePrice: totalBasePrice * totalMultiplier,
            platformFee: totalBreakdown.platformFee,
            gstOnBase: totalBreakdown.gstOnBase,
            gstOnPlatform: totalBreakdown.gstOnPlatform,
            gstTotal: totalBreakdown.gstTotal,
            gatewayFee: totalBreakdown.gatewayFee,
            totalPrice: totalBreakdown.finalPrice,
            mealPlan: selectedMealPlan,
            mealPlanDescription: getMealPlanDescription(selectedMealPlan),
            mealPlanPrice: mealPrice * totalMultiplier,
            roomPrice: roomPrice * totalMultiplier,
            addOn: selectedMealPlan !== 'Room Only' ? `${selectedMealPlan} (Meal Plan)` : 'No Add-ons',
          },
          inventoryData: inventoryData[selectedRoom?.id] || [],
        },
      }
    );
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
            {/* Main container for MMT-like layout */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: { xs: 2, lg: 3 },
              mt: { xs: 0, lg: 2 }
            }}>

              {/* LEFT SIDE - Rooms list (60% width) - First on mobile */}
              <Box sx={{
                flex: { xs: 1, lg: 0.6 },
                order: { xs: 1, lg: 1 },
                width: '100%',
                maxWidth: '100%',
                overflowX: 'hidden'
              }}>
                {/* Loading inventory indicator */}
                {loadingInventory && (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 2,
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0'
                  }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="textSecondary" fontSize={{ xs: '14px', lg: '14px' }}>
                      Checking room availability...
                    </Typography>
                  </Box>
                )}

                {/* MEAL PLAN FILTER */}
                <Box sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: '1px solid #e0e0e0',
                  width: '95%',
                  overflowX: 'hidden'
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1.5
                  }}>
                    <RestaurantMenu sx={{
                      color: color.firstColor,
                      fontSize: { xs: 20, lg: 20 }
                    }} />
                    <Typography variant="subtitle1" fontWeight="bold" fontSize={{ xs: '15px', lg: '16px' }}>
                      Filter by Meal Plan
                    </Typography>
                  </Box>

                  {/* Meal plan chips */}
                  <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 2
                  }}>
                    {['All Meal Plans', 'Room Only'].concat(
                      Array.from(new Set(
                        availableRooms.flatMap((room: any) =>
                          getAvailableMealPlansForRoom(room).filter((plan: string) => plan !== 'Room Only')
                        )
                      ))
                    ).map((plan) => {
                      const isSelected = mealPlanFilter === (plan === 'All Meal Plans' ? '' : plan);

                      const planLabels: Record<string, string> = {
                        'EP': 'Room + Breakfast',
                        'CP': 'Room + Breakfast + Lunch/Dinner',
                        'AP': 'Room + All Meals',
                        'MAP': 'Room + Breakfast + Dinner',
                        'Room Only': 'Room Only',
                        'All Meal Plans': 'All Meal Plans'
                      };

                      const displayLabel = planLabels[plan] || plan;

                      return (
                        <Chip
                          key={plan}
                          label={displayLabel}
                          clickable
                          size="medium"
                          variant={isSelected ? "filled" : "outlined"}
                          onClick={() => setMealPlanFilter(plan === 'All Meal Plans' ? '' : plan)}
                          sx={{
                            borderColor: isSelected ? color.firstColor : '#e0e0e0',
                            backgroundColor: isSelected ? color.firstColor : '#ffffff',
                            color: isSelected ? '#ffffff' : 'text.primary',
                            fontWeight: isSelected ? 600 : 400,
                            fontSize: { xs: '12px', lg: '13px' },
                            height: { xs: 32, lg: 32 },
                            '& .MuiChip-label': {
                              px: 1.5
                            },
                            flexShrink: 0,
                          }}
                        />
                      );
                    })}
                  </Box>

                  {/* Filter summary */}
                  {mealPlanFilter && (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                      mt: 2
                    }}>
                      <Typography variant="body2" color="textSecondary" fontSize={{ xs: '13px', lg: '14px' }}>
                        Showing rooms with:
                      </Typography>
                      <Chip
                        label={
                          (() => {
                            const planLabels: Record<string, string> = {
                              'EP': 'Room + Breakfast',
                              'CP': 'Room + Breakfast + Lunch/Dinner',
                              'AP': 'Room + All Meals',
                              'MAP': 'Room + Breakfast + Dinner',
                              'Room Only': 'Room Only'
                            };
                            return planLabels[mealPlanFilter] || mealPlanFilter;
                          })()
                        }
                        size="medium"
                        onDelete={() => setMealPlanFilter('')}
                        deleteIcon={<Close sx={{ fontSize: { xs: 16, lg: 16 } }} />}
                        sx={{
                          fontWeight: 500,
                          backgroundColor: '#e3f2fd',
                          color: color.firstColor,
                          fontSize: { xs: '12px', lg: '13px' },
                          height: { xs: 28, lg: 28 }
                        }}
                      />
                      <Typography variant="body2" color="textSecondary" fontSize={{ xs: '12px', lg: '12px' }}>
                        ({getFilteredRoomsCount()} rooms available)
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Alert if all rooms are unavailable */}
                {getFilteredRooms().length === 0 && !loadingInventory && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      border: '1px solid #ffcdd2',
                      p: 2
                    }}
                    icon={<Block sx={{ fontSize: { xs: 20, lg: 20 } }} />}
                  >
                    <AlertTitle sx={{ fontSize: { xs: '14px', lg: '16px' }, mb: 0.5 }}>
                      No Rooms Available
                    </AlertTitle>
                    <Typography variant="body2" fontSize={{ xs: '13px', lg: '14px' }}>
                      {mealPlanFilter
                        ? `No rooms with "${mealPlanFilter}" meal plan are available for your selected dates.`
                        : 'All rooms in this hotel are currently unavailable for your selected dates. Please try different dates or explore other hotels.'
                      }
                    </Typography>
                  </Alert>
                )}

                {/* Alert if some rooms are available */}
                {unavailableRooms.length > 0 && getFilteredRooms().length > 0 && !loadingInventory && (
                  <Alert
                    severity="info"
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      border: '1px solid #bbdefb',
                      p: 2
                    }}
                    icon={<Info sx={{ fontSize: { xs: 20, lg: 20 } }} />}
                  >
                    <AlertTitle sx={{ fontSize: { xs: '14px', lg: '16px' }, mb: 0.5 }}>
                      Some Rooms Unavailable
                    </AlertTitle>
                    <Typography variant="body2" fontSize={{ xs: '13px', lg: '14px' }}>
                      {unavailableRooms.length} room{unavailableRooms.length > 1 ? 's are' : ' is'} currently unavailable.
                      Showing {getFilteredRooms().length} available room{getFilteredRooms().length > 1 ? 's' : ''}.
                    </Typography>
                  </Alert>
                )}

                {/* Rooms Grid */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {getFilteredRooms().map((room: any) => {
                    const inventoryStatus = getRoomInventoryStatus(room);
                    const availableSlots = (bookingType || "").toLowerCase() === "hourly"
                      ? ["rateFor3Hour", "rateFor6Hour", "rateFor12Hour"]
                      : ["rateFor1Night"];

                    const hasAvailableSlots = availableSlots.some(slot => {
                      const price = getPriceForSlot(room, slot);
                      return price > 0 && isSlotAvailable(room, slot);
                    });

                    return (
                      <Card
                        key={`available-${room.id}`}
                        sx={{
                          p: 2,
                          display: "flex",
                          flexDirection: "column",
                          background: '#ffffff',
                          borderRadius: '12px',
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          border: "1px solid #e0e0e0",
                          position: "relative",
                          overflow: "hidden",
                          cursor: hasAvailableSlots ? 'pointer' : 'default',
                          opacity: hasAvailableSlots ? 1 : 0.7,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: hasAvailableSlots ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.1)",
                            borderColor: hasAvailableSlots ? color.firstColor : '#e0e0e0'
                          }
                        }}
                        onClick={() => {
                          if (!hasAvailableSlots) return;

                          setSelectedRoom(room);
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
                        {/* Selected Room Checkmark */}
                        {selectedRoom?.id === room.id && (
                          <CheckCircle
                            sx={{
                              position: "absolute",
                              top: -1,
                              right: -1,
                              color: '#4caf50',
                              background: '#ffffff',
                              borderRadius: "50%",
                              fontSize: '28px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              zIndex: 2
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
                              {React.cloneElement(inventoryStatus.icon, {
                                sx: { fontSize: 12 }
                              })}
                              <Typography variant="caption" fontWeight="bold" fontSize='10px'>
                                {inventoryStatus.status}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}

                        {/* Top row: Image and basic info */}
                        <Box sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', md: 'row' },
                          gap: 2,
                          mb: 2
                        }}>
                          {/* Room Image */}
                          <Box sx={{
                            width: { xs: '100%', md: '200px' },
                            height: { xs: '180px', md: '140px' },
                            flexShrink: 0
                          }}>
                            <CardMedia
                              component="img"
                              sx={{
                                height: '100%',
                                width: '100%',
                                borderRadius: '8px',
                                objectFit: 'cover'
                              }}
                              image={toCdn(room.roomImages)}
                              alt={room.roomCategory}
                            />
                          </Box>

                          {/* Room Info */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              sx={{
                                color: color.firstColor,
                                fontSize: { xs: '16px', lg: '16px' },
                                lineHeight: 1.3,
                                mb: 1
                              }}
                            >
                              {room.roomCategory}
                            </Typography>

                            {/* Room Size */}
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1
                            }}>
                              <SquareFoot sx={{ fontSize: 14, color: '#666' }} />
                              <Typography variant="body2" color="textSecondary" fontSize='14px'>
                                {room.roomSize} sq.ft
                              </Typography>
                            </Box>

                            {/* Room Amenities */}
                            <Box>
                              <RoomAmenities key={room.id} room={room} />
                            </Box>
                          </Box>
                        </Box>

                        {/* Room Details Toggle */}
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1.5
                        }}>
                          <Button
                            sx={{
                              textTransform: "none",
                              fontSize: '13px',
                              p: 0.5,
                              minWidth: 0,
                              color: color.firstColor,
                              fontWeight: 600
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowRoomDetails(!showRoomDetails);
                            }}
                            startIcon={showRoomDetails ?
                              <ExpandLess sx={{ fontSize: 18 }} /> :
                              <ExpandMore sx={{ fontSize: 18 }} />
                            }
                          >
                            {showRoomDetails ? "Show less" : "More details"}
                          </Button>
                        </Box>

                        {/* Expanded Room Details */}
                        {showRoomDetails && (
                          <Box sx={{
                            mt: 1,
                            p: 2,
                            bgcolor: '#f9f9f9',
                            borderRadius: 1,
                            mb: 2
                          }}>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary" sx={{ display: 'block', fontSize: '12px', mb: 0.5 }}>
                                  Standard Occupancy:
                                </Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '13px' }}>
                                  {room.standardRoomOccupancy} guest(s)
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary" sx={{ display: 'block', fontSize: '12px', mb: 0.5 }}>
                                  Max Occupancy:
                                </Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '13px' }}>
                                  {room.maxRoomOccupancy} guest(s)
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary" sx={{ display: 'block', fontSize: '12px', mb: 0.5 }}>
                                  Additional Adult:
                                </Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '13px' }}>
                                  ₹{room.additionalGuestRate}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary" sx={{ display: 'block', fontSize: '12px', mb: 0.5 }}>
                                  Additional Child:
                                </Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '13px' }}>
                                  ₹{room.additionalChildRate}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        )}

                        {/* Pricing Section */}
                        <Box sx={{
                          width: '100%',
                          borderTop: '1px solid #e0e0e0',
                          pt: 1.5
                        }}>
                          {/* Price Slots */}
                          <Box sx={{
                            display: "flex",
                            flexWrap: 'wrap',
                            gap: 1,
                            mb: 1.5
                          }}>
                            {availableSlots
                              .filter(slotKey => {
                                const price = getPriceForSlot(room, slotKey);
                                return price > 0 && isSlotAvailable(room, slotKey);
                              })
                              .map((slotKey) => {
                                const slotLabel = (bookingType || "").toLowerCase() === "hourly"
                                  ? slotKey.replace("rateFor", "").replace("Hour", "") + " hrs"
                                  : "Per Night";

                                const roomPrice = getRoomPriceOnly(room, slotKey);
                                const totalPrice = getTotalPriceWithMeals(room, slotKey, 'Room Only');
                                const breakdown = calculatePriceBreakdown(totalPrice);
                                const { basePrice, platformFee, gstTotal } = breakdown as any;
                                const perUnitMain = basePrice + platformFee;
                                const perUnitTaxes = gstTotal;

                                return (
                                  <Button
                                    key={slotKey}
                                    variant={selectedSlot.roomId === room.id && selectedSlot.slot === slotKey ? "contained" : "outlined"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSlotAvailable(room, slotKey)) {
                                        handleSlotSelection(room.id, slotKey);
                                        setSelectedMealPlan('Room Only');
                                      }
                                    }}
                                    disabled={!isSlotAvailable(room, slotKey)}
                                    sx={{
                                      flex: '1 1 calc(33.333% - 8px)',
                                      minWidth: '100px',
                                      maxWidth: '140px',
                                      py: 1,
                                      px: 1,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      borderColor: selectedSlot.roomId === room.id && selectedSlot.slot === slotKey ? color.firstColor : '#ddd',
                                      backgroundColor: selectedSlot.roomId === room.id && selectedSlot.slot === slotKey ? color.firstColor : 'transparent',
                                      '&:hover': {
                                        borderColor: color.firstColor,
                                        backgroundColor: selectedSlot.roomId === room.id && selectedSlot.slot === slotKey ? color.firstColor : 'rgba(33, 150, 243, 0.04)'
                                      }
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      fontWeight={600}
                                      color={selectedSlot.roomId === room.id && selectedSlot.slot === slotKey ? '#fff' : '#666'}
                                      fontSize='11px'
                                      sx={{ mb: 0.5 }}
                                    >
                                      {slotLabel}
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      fontWeight={700}
                                      color={selectedSlot.roomId === room.id && selectedSlot.slot === slotKey ? '#fff' : color.firstColor}
                                      fontSize='14px'
                                    >
                                      ₹{Math.round(perUnitMain)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color={selectedSlot.roomId === room.id && selectedSlot.slot === slotKey ? '#fff' : '#666'}
                                      fontSize='10px'
                                      sx={{ mt: 0.5 }}
                                    >
                                      +₹{Math.round(perUnitTaxes)} taxes & fees
                                    </Typography>
                                  </Button>
                                );
                              })}
                          </Box>

                          {/* View Deal Button */}
                          <Box sx={{
                            textAlign: 'right'
                          }}>
                            <Button
                              variant="contained"
                              size="medium"
                              sx={{
                                backgroundColor: color.firstColor,
                                color: '#fff',
                                fontWeight: 600,
                                borderRadius: '6px',
                                px: 2,
                                py: 1,
                                minWidth: '120px',
                                fontSize: '13px',
                                '&:hover': {
                                  backgroundColor: color.secondColor
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (hasAvailableSlots) {
                                  setSelectedRoom(room);
                                }
                              }}
                            >
                              View Deal
                            </Button>
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Box>

                {/* Alternative Stays Button */}
                {hasAlternativeStays && !loadingSimilarHotels && !checkingAlternativeStays && (
                  <Box sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <Typography variant="subtitle1" fontWeight={600} mb={1.5} fontSize={{ xs: '15px', lg: '16px' }}>
                      Looking for {bookingType === "hourly" ? "overnight" : "hourly"} stays?
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      size="medium"
                      startIcon={<Search sx={{ fontSize: { xs: 18, lg: 18 } }} />}
                      onClick={() => {
                        const searchParams = new URLSearchParams();
                        searchParams.set("location", "Bhubaneswar");
                        const oppositeBookingType = bookingType === "hourly" ? "fullDay" : "hourly";
                        searchParams.set("bookingType", oppositeBookingType);

                        if (oppositeBookingType === "hourly") {
                          searchParams.set("bookingHours", "3");
                          searchParams.set("rooms", "1");
                          searchParams.set("adults", "1");
                          searchParams.set("children", "0");
                        } else {
                          const today = dayjs().format('YYYY-MM-DD');
                          const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
                          searchParams.set("checkinDate", today);
                          searchParams.set("checkOutDate", tomorrow);
                          searchParams.set("rooms", "1");
                          searchParams.set("adults", "1");
                          searchParams.set("children", "0");
                          searchParams.set("nights", "1");
                        }

                        navigate(`/search?${searchParams.toString()}`);
                      }}
                      sx={{
                        borderColor: color.firstColor,
                        color: color.firstColor,
                        fontSize: '14px',
                        py: 1,
                        borderRadius: '6px',
                        '&:hover': {
                          borderColor: color.secondColor,
                          backgroundColor: 'rgba(33, 150, 243, 0.04)'
                        }
                      }}
                    >
                      Search {bookingType === "hourly" ? "Overnight" : "Hourly"} Stays
                    </Button>
                  </Box>
                )}
              </Box>

              {/* RIGHT SIDE - Booking Summary (40% width) - Below on mobile */}
              <Box sx={{
                flex: { xs: 1, lg: 0.4 },
                order: { xs: 2, lg: 2 },
                width: '100%',
                position: { xs: 'relative', lg: 'sticky' },
                top: { xs: 'auto', lg: 20 },
                alignSelf: { xs: 'stretch', lg: 'flex-start' },
                height: { xs: 'auto', lg: 'calc(100vh - 100px)' },
                maxHeight: { xs: 'none', lg: 'calc(100vh - 100px)' },
                overflowY: { xs: 'visible', lg: 'auto' },
                zIndex: { xs: 1, lg: 1000 },
                bgcolor: '#fff',
                boxShadow: { xs: '0 2px 8px rgba(0,0,0,0.1)', lg: 'none' },
                borderTop: { xs: '1px solid #e0e0e0', lg: 'none' },
                mt: { xs: 0, lg: 0 },
                '&::-webkit-scrollbar': { display: 'none' }
              }}>
                <Card sx={{
                  borderRadius: { xs: 0, lg: '12px' },
                  boxShadow: { xs: 'none', lg: '0 4px 12px rgba(0,0,0,0.1)' },
                  border: { xs: 'none', lg: '1px solid #e0e0e0' },
                  overflow: 'visible',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Mobile header */}
                  <Box sx={{
                    display: { xs: 'flex', lg: 'none' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    bgcolor: '#f9f9f9',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Booking Summary
                    </Typography>
                    <IconButton size="small" onClick={() => { }}>
                      <Close />
                    </IconButton>
                  </Box>

                  {/* Scrollable content container */}
                  <Box sx={{
                    flex: 1,
                    overflowY: { xs: 'visible', lg: 'auto' },
                    display: 'flex',
                    flexDirection: 'column',
                    '&::-webkit-scrollbar': { display: 'none' }
                  }}>
                    {/* Selected Room Header */}
                    <Box sx={{
                      background: `linear-gradient(135deg, ${color.firstColor}, ${color.secondColor})`,
                      p: { xs: 2, lg: 2 },
                      color: '#fff',
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      <Typography variant="h6" fontWeight={700} fontSize={{ xs: '16px', lg: '18px' }}>
                        {selectedRoom ? selectedRoom.roomCategory : 'Select a Room'}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }} fontSize={{ xs: '12px', lg: '12px' }}>
                        {selectedRoom ? `${selectedRoom.roomSize} sq.ft` : 'Choose from available rooms'}
                      </Typography>
                    </Box>

                    {/* Stay Details Section */}
                    <Box sx={{
                      p: { xs: 2, lg: 2 },
                      flexShrink: 0
                    }}>
                      {/* Dates */}
                      <Box sx={{ mb: { xs: 2, lg: 2 } }}>
                        <Typography variant="subtitle2" fontWeight={600} color="textSecondary" mb={1} fontSize={{ xs: '12px', lg: '14px' }}>
                          Stay Dates
                        </Typography>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: '#f5f5f5',
                          p: { xs: 1.5, lg: 1.5 },
                          borderRadius: '6px'
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="textSecondary" fontSize={{ xs: '11px', lg: '12px' }}>Check-in</Typography>
                            <Typography variant="body2" fontWeight={700} color={color.firstColor} fontSize={{ xs: '13px', lg: '14px' }}>
                              {checkinDate ? dayjs(checkinDate).format("DD MMM") : "Select"}
                            </Typography>
                            {bookingType === "hourly" && checkinTime && (
                              <Typography variant="caption" color="textSecondary" fontSize={{ xs: '10px', lg: '11px' }}>
                                {dayjs(checkinTime, "HH:mm").format("hh:mm A")}
                              </Typography>
                            )}
                          </Box>
                          <ArrowRightAlt sx={{ color: '#666', fontSize: { xs: 18, lg: 20 }, mx: { xs: 0.5, lg: 1 } }} />
                          <Box sx={{ flex: 1, textAlign: 'right' }}>
                            <Typography variant="caption" color="textSecondary" fontSize={{ xs: '11px', lg: '12px' }}>
                              {bookingType === "hourly" ? "Duration" : "Check-out"}
                            </Typography>
                            {bookingType === "hourly" ? (
                              <Typography variant="body2" fontWeight={700} color={color.firstColor} fontSize={{ xs: '13px', lg: '14px' }}>
                                {selectedSlot.slot === "rateFor3Hour" ? "3H" :
                                  selectedSlot.slot === "rateFor6Hour" ? "6H" :
                                    selectedSlot.slot === "rateFor12Hour" ? "12H" : "Select"}
                              </Typography>
                            ) : (
                              <Typography variant="body2" fontWeight={700} color={color.firstColor} fontSize={{ xs: '13px', lg: '14px' }}>
                                {checkOutDate ? dayjs(checkOutDate).format("DD MMM") : "Select"}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        {bookingType !== "hourly" && perStayMultiplier > 0 && (
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }} fontSize={{ xs: '11px', lg: '12px' }}>
                            {perStayMultiplier} night{perStayMultiplier > 1 ? 's' : ''} stay
                          </Typography>
                        )}
                      </Box>

                      {/* Room & Guests */}
                      <Box sx={{ mb: { xs: 2, lg: 2 } }}>
                        <Typography variant="subtitle2" fontWeight={600} color="textSecondary" mb={1} fontSize={{ xs: '12px', lg: '14px' }}>
                          Room & Guests
                        </Typography>
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          bgcolor: '#f5f5f5',
                          p: { xs: 1.5, lg: 1.5 },
                          borderRadius: '6px'
                        }}>
                          <Box>
                            <Typography variant="body2" fontWeight={700} color={color.firstColor} fontSize={{ xs: '13px', lg: '14px' }}>
                              {roomsCountParam} Room{roomsCountParam > 1 ? 's' : ''}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" fontSize={{ xs: '12px', lg: '12px' }}>
                              {adults} Adult{adults !== "1" ? 's' : ''}
                              {children !== "0" ? `, ${children} Child${children !== "1" ? 'ren' : ''}` : ''}
                            </Typography>
                          </Box>
                          {selectedRoom && (
                            <Chip
                              label={`Max ${selectedRoom.standardRoomOccupancy}`}
                              size="small"
                              sx={{
                                bgcolor: color.firstColor,
                                color: '#fff',
                                fontSize: { xs: '11px', lg: '12px' },
                                height: { xs: 24, lg: 28 },
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ mx: { xs: 2, lg: 2 } }} />

                    {/* Meal Plan Selection */}
                    {selectedRoom && !loadingMealPlans && (
                      <Box sx={{
                        p: { xs: 2, lg: 2 },
                        flexShrink: 0
                      }}>
                        <Typography variant="subtitle2" fontWeight={600} color="textSecondary" mb={1} fontSize={{ xs: '12px', lg: '14px' }}>
                          Select Meal Plan
                        </Typography>
                        <Box sx={{
                          display: 'flex',
                          gap: { xs: 1, lg: 1 },
                          overflowX: 'auto',
                          pb: 1,
                          '&::-webkit-scrollbar': { display: 'none' }
                        }}>
                          {getAvailableMealPlansForRoom(selectedRoom).map((plan: string) => {
                            const mealPrice = calculateMealPlanPrice(selectedRoom, plan);
                            const roomPrice = selectedSlot.slot ? getRoomPriceOnly(selectedRoom, selectedSlot.slot) : 0;

                            const roomOnlyTotal = roomPrice;
                            const roomBreakdown = calculatePriceBreakdown(roomOnlyTotal);

                            let mealBreakdown = null;
                            if (plan !== 'Room Only') {
                              mealBreakdown = calculatePriceBreakdown(mealPrice);
                            }

                            const totalRoomPrice = (roomBreakdown.basePrice + roomBreakdown.platformFee) * totalMultiplier;
                            const totalRoomTax = roomBreakdown.gstTotal * totalMultiplier;

                            let totalMealPrice = 0;
                            let totalMealTax = 0;
                            if (plan !== 'Room Only' && mealBreakdown) {
                              totalMealPrice = (mealBreakdown.basePrice + mealBreakdown.platformFee) * totalMultiplier;
                              totalMealTax = mealBreakdown.gstTotal * totalMultiplier;
                            }

                            const totalForPlan = totalRoomPrice + totalMealPrice;
                            const totalTaxForPlan = totalRoomTax + totalMealTax;

                            return (
                              <Box
                                key={plan}
                                onClick={() => setSelectedMealPlan(plan)}
                                sx={{
                                  minWidth: { xs: 140, lg: 160 },
                                  border: `2px solid ${selectedMealPlan === plan ? color.firstColor : '#e0e0e0'}`,
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  bgcolor: selectedMealPlan === plan ? '#e3f2fd' : '#fff',
                                  transition: 'all 0.2s ease',
                                  flexShrink: 0,
                                  '&:hover': { borderColor: color.firstColor }
                                }}
                              >
                                <Box sx={{ p: { xs: 1.5, lg: 1.5 } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    {getMealPlanIcon(plan) || <RestaurantMenu sx={{ fontSize: { xs: 14, lg: 16 } }} />}
                                    <Typography variant="body2" fontWeight={600} fontSize={{ xs: '12px', lg: '13px' }}>
                                      {getMealPlanDescription(plan)}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" color="textSecondary" fontSize={{ xs: '11px', lg: '12px' }} sx={{ mb: 0.5, display: 'block' }}>
                                    {plan === 'Room Only' ? 'No meals' : 'Includes meals'}
                                  </Typography>
                                  <Typography variant="body1" fontWeight={700} color={color.firstColor} fontSize={{ xs: '14px', lg: '15px' }}>
                                    ₹{Math.round(totalForPlan)}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary" fontSize={{ xs: '10px', lg: '11px' }} sx={{ display: 'block' }}>
                                    + ₹{Math.round(totalTaxForPlan)} taxes & fees
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    <Divider sx={{ mx: { xs: 2, lg: 2 } }} />

                    {/* Price Breakdown */}
                    <Box sx={{
                      p: { xs: 2, lg: 2 },
                      flexShrink: 0
                    }}>
                      <Typography variant="subtitle2" fontWeight={600} color="textSecondary" mb={1.5} fontSize={{ xs: '12px', lg: '14px' }}>
                        Price Summary
                      </Typography>

                      {(() => {
                        const roomPrice = selectedSlot.slot ? getRoomPriceOnly(selectedRoom, selectedSlot.slot) : 0;
                        const roomBreakdown = calculatePriceBreakdown(roomPrice);

                        let mealBreakdown = null;
                        if (selectedMealPlan !== 'Room Only') {
                          const mealPrice = calculateMealPlanPrice(selectedRoom, selectedMealPlan);
                          mealBreakdown = calculatePriceBreakdown(mealPrice);
                        }

                        const totalRoomPrice = (roomBreakdown.basePrice + roomBreakdown.platformFee) * totalMultiplier;
                        const totalRoomTax = roomBreakdown.gstTotal * totalMultiplier;

                        let totalMealPrice = 0;
                        let totalMealTax = 0;
                        if (selectedMealPlan !== 'Room Only' && mealBreakdown) {
                          totalMealPrice = (mealBreakdown.basePrice + mealBreakdown.platformFee) * totalMultiplier;
                          totalMealTax = mealBreakdown.gstTotal * totalMultiplier;
                        }

                        const totalBasePrice = totalRoomPrice + totalMealPrice;
                        const totalTax = totalRoomTax + totalMealTax;

                        return (
                          <>
                            <Box sx={{
                              bgcolor: '#f9f9f9',
                              p: { xs: 1.5, lg: 1.5 },
                              borderRadius: '6px',
                              border: '1px solid #e0e0e0',
                              mb: 2
                            }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography variant="body1" fontWeight={700} fontSize={{ xs: '14px', lg: '16px' }}>
                                    Total Amount
                                  </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                  <Typography variant="h6" fontWeight={800} color={color.firstColor} fontSize={{ xs: '18px', lg: '20px' }}>
                                    ₹{Math.round(totalBasePrice)}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary" fontSize={{ xs: '11px', lg: '12px' }}>
                                    + ₹{Math.round(totalTax)} taxes & fees
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>

                            {displayBasePlus700 > displayCombinedBasePlatform && (
                              <Alert
                                severity="success"
                                sx={{
                                  mb: 2,
                                  borderRadius: '6px',
                                  py: { xs: 1, lg: 1 },
                                  '& .MuiAlert-icon': { fontSize: { xs: 16, lg: 18 } }
                                }}
                              >
                                <Typography variant="body2" fontWeight={600} fontSize={{ xs: '12px', lg: '13px' }}>
                                  You save ₹{Math.round(displayBasePlus700 - displayCombinedBasePlatform)}!
                                </Typography>
                              </Alert>
                            )}
                          </>
                        );
                      })()}
                    </Box>
                  </Box>

                  {/* Book Now Button */}
                  <Box sx={{
                    p: { xs: 2, lg: 2 },
                    bgcolor: '#fff',
                    borderTop: '1px solid #e0e0e0',
                    flexShrink: 0
                  }}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={handleBookNow}
                      disabled={availableRooms.length === 0}
                      sx={{
                        height: { xs: '48px', lg: '48px' },
                        fontSize: { xs: '15px', lg: '16px' },
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${color.firstColor}, ${color.secondColor})`,
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${color.secondColor}, ${color.firstColor})`,
                          boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)'
                        },
                        '&:disabled': {
                          background: '#ccc',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      {availableRooms.length === 0 ? 'No Rooms Available' : 'Book Now'}
                    </Button>
                  </Box>
                </Card>
              </Box>
            </Box>
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