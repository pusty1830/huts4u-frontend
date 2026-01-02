import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import Slider from "react-slick";

import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import BlockIcon from "@mui/icons-material/Block";
import StarIcon from "@mui/icons-material/Star";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

import color from "../../components/color";
import { CustomNextArrow, useScreenSize } from "../../components/style";

import {
  getAllHotels,
  getMyAllHotelswithBelongsTo,
  getAllRatings,
  getAllInventories,
} from "../../services/services";


// 💰 Price Calculation
export const calculatePriceBreakdown = (basePrice: number) => {
  const numericBase = Number(basePrice) || 0;

  if (!numericBase || numericBase <= 0) {
    return {
      basePrice: 0,
      platformFee: 0,
      gstOnBase: 0,
      gstOnPlatform: 0,
      gatewayFee: 0,
      gstOnGateway: 0,
      gstTotal: 0,
      finalPrice: 0,
    };
  }

  const gstOnBase = numericBase * 0.05;
  const platformFeeBase = numericBase + gstOnBase;
  const platformFee = platformFeeBase * 0.13;
  const gstOnPlatform = platformFee * 0.18;

  const amountBeforeGateway =
    numericBase + gstOnBase + platformFee + gstOnPlatform;

  const gatewayFee = amountBeforeGateway * 0.02;
  const gstOnGateway = gatewayFee * 0.18;

  const gstTotal = gstOnBase + gstOnPlatform + gstOnGateway + gatewayFee;

  const finalPrice = numericBase + platformFee + gstTotal;

  return {
    basePrice: numericBase,
    platformFee,
    gstOnBase,
    gstOnPlatform,
    gatewayFee,
    gstOnGateway,
    gstTotal,
    finalPrice,
  };
};

// Function to calculate average rating
const calculateAverageRating = (ratings: any[]) => {
  if (!ratings || !Array.isArray(ratings) || ratings.length === 0) return 0;

  const total = ratings.reduce((sum, rating) => {
    return sum + (Number(rating.rating) || 0);
  }, 0);

  return Math.round((total / ratings.length) * 10) / 10;
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
    return ratingHotelId === hotelId || ratingHotelId?.toString() === hotelId?.toString();
  });
};

// Function to get inventory-based price
const getInventoryPrice = (room: any, inventoryData: any[], checkDate: string, slot: string): number => {
  if (!room || !checkDate) return room[slot] || 0;
  
  const roomId = room.id;
  const checkDay = dayjs(checkDate).format('YYYY-MM-DD');
  
  const dayInventory = inventoryData?.find(inv => 
    inv.roomId === roomId && dayjs(inv.date).format('YYYY-MM-DD') === checkDay
  );

  if (!dayInventory) return room[slot] || 0;

  switch(slot) {
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

// Function to check slot availability
const isSlotAvailable = (room: any, inventoryData: any[], checkDate: string, slot: string): boolean => {
  if (!room || !checkDate) return false;
  
  const roomStatus = room.status?.toLowerCase();
  const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
  if (!isStatusAvailable) return false;
  
  const checkDay = dayjs(checkDate).format('YYYY-MM-DD');
  const dayInventory = inventoryData?.find(inv => 
    dayjs(inv.date).format('YYYY-MM-DD') === checkDay
  );
  
  if (!dayInventory) return true;
  
  if (dayInventory.isBlocked) return false;

  switch(slot) {
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

// Function to check overall room availability
const checkRoomAvailability = (room: any, inventoryData: any[], checkDate: string): boolean => {
  if (!room || !checkDate) return false;
  
  const roomStatus = room.status?.toLowerCase();
  const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
  if (!isStatusAvailable) return false;
  
  if (!inventoryData || inventoryData.length === 0) return true;
  
  const checkDay = dayjs(checkDate).format('YYYY-MM-DD');
  const dayInventory = inventoryData.find(inv => 
    dayjs(inv.date).format('YYYY-MM-DD') === checkDay
  );
  
  if (!dayInventory) return true;
  
  if (dayInventory.isBlocked) return false;

  // Check if any slot is available
  return (
    (dayInventory.overnightAvailable > dayInventory.overnightBooked) ||
    (dayInventory.threeHourAvailable > dayInventory.threeHourBooked) ||
    (dayInventory.sixHourAvailable > dayInventory.sixHourBooked) ||
    (dayInventory.twelveHourAvailable > dayInventory.twelveHourBooked)
  );
};

// Function to get inventory status
const getInventoryStatus = (room: any, inventoryData: any[], checkDate: string): { 
  isAvailable: boolean, 
  status: string, 
  reason: string 
} => {
  const roomStatus = room.status?.toLowerCase();
  const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
  
  if (!isStatusAvailable) {
    return { 
      isAvailable: false, 
      status: 'Unavailable', 
      reason: 'Room is currently unavailable'
    };
  }

  if (!inventoryData || inventoryData.length === 0) {
    return { 
      isAvailable: true, 
      status: 'Available', 
      reason: 'Available for booking'
    };
  }
  
  const checkDay = checkDate ? dayjs(checkDate).format('YYYY-MM-DD') : '';
  const dayInventory = checkDay ? inventoryData.find(inv => 
    dayjs(inv.date).format('YYYY-MM-DD') === checkDay
  ) : null;
  
  if (dayInventory) {
    if (dayInventory.isBlocked) {
      return { 
        isAvailable: false, 
        status: 'Blocked', 
        reason: 'Room is blocked for selected date'
      };
    }
    
    // Check if any slot is available
    const hasAvailability = 
      dayInventory.overnightAvailable > dayInventory.overnightBooked ||
      dayInventory.threeHourAvailable > dayInventory.threeHourBooked ||
      dayInventory.sixHourAvailable > dayInventory.sixHourBooked ||
      dayInventory.twelveHourAvailable > dayInventory.twelveHourBooked;
    
    if (!hasAvailability) {
      return { 
        isAvailable: false, 
        status: 'Sold Out', 
        reason: 'No slots available for selected date'
      };
    }
  }
  
  return { 
    isAvailable: true, 
    status: 'Available', 
    reason: 'Available for booking'
  };
};

// Fetch inventory for a specific room
const fetchRoomInventory = async (roomId: string, checkDate: string) => {
  try {
    const payLoad = {
      data: { 
        filter: "",
        roomId: roomId,
        date: checkDate
      },
      page: 0,
      pageSize: 1000,
      order: [["createdAt", "ASC"]],
    };

    const inventoryResponse = await getAllInventories(payLoad);
    
    let inventoryArray: any[] = [];
    if (inventoryResponse?.data?.data?.data && Array.isArray(inventoryResponse.data.data.data)) {
      inventoryArray = inventoryResponse.data.data.data;
    } else if (inventoryResponse?.data?.data?.rows && Array.isArray(inventoryResponse.data.data.rows)) {
      inventoryArray = inventoryResponse.data.data.rows;
    } else if (inventoryResponse?.data?.data?.result && Array.isArray(inventoryResponse.data.data.result)) {
      inventoryArray = inventoryResponse.data.data.result;
    } else if (Array.isArray(inventoryResponse?.data?.data)) {
      inventoryArray = inventoryResponse.data.data;
    }

    return inventoryArray;
  } catch (error) {
    console.error(`Error fetching inventory for room ${roomId}:`, error);
    return [];
  }
};

// Lowest rate finder with inventory consideration
const getBaseRateInfo = (hotel: any, inventoryData: any[] = [], checkDate: string) => {
  const firstRoom = hotel?.rooms?.[0];
  if (!firstRoom) return { rate: 0, label: "" };

  const options = [
    { 
      rate: getInventoryPrice(firstRoom, inventoryData, checkDate, 'rateFor3Hour'), 
      label: "per 3 hour",
      slot: 'rateFor3Hour'
    },
    { 
      rate: getInventoryPrice(firstRoom, inventoryData, checkDate, 'rateFor6Hour'), 
      label: "per 6 hour",
      slot: 'rateFor6Hour'
    },
    { 
      rate: getInventoryPrice(firstRoom, inventoryData, checkDate, 'rateFor12Hour'), 
      label: "per 12 hour",
      slot: 'rateFor12Hour'
    },
    { 
      rate: getInventoryPrice(firstRoom, inventoryData, checkDate, 'rateFor1Night'), 
      label: "per night",
      slot: 'rateFor1Night'
    },
  ].filter((o) => o.rate > 0 && isSlotAvailable(firstRoom, inventoryData, checkDate, o.slot));

  if (!options.length) return { rate: 0, label: "" };

  return options.reduce((min, cur) => (cur.rate < min.rate ? cur : min));
};

// Function to select random properties
const selectRandomProperties = (hotels: any[], count: number = 20) => {
  if (hotels.length <= count) return hotels;

  const shuffled = [...hotels];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
};

// Function to get a random mix ensuring variety
const selectMixedProperties = (hotels: any[], count: number = 20) => {
  if (hotels.length <= count) return hotels;

  const shuffled = [...hotels];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Create a map to track selected hotels
  const selectedHotels: any[] = [];
  const seenIds = new Set();

  // Helper function to add unique hotels
  const addUniqueHotels = (hotelList: any[], maxCount: number) => {
    for (const hotel of hotelList) {
      if (selectedHotels.length >= count) break;
      if (hotel && hotel.id && !seenIds.has(hotel.id)) {
        seenIds.add(hotel.id);
        selectedHotels.push(hotel);
        if (selectedHotels.length >= maxCount) break;
      }
    }
  };

  // Try to get at least one from each price range
  const getHotelPrice = (hotel: any, checkDate: string) => {
    const firstRoom = hotel?.rooms?.[0];
    if (!firstRoom) return 0;
    
    const inventoryData = hotel._inventoryData?.[firstRoom.id] || [];
    const baseRateInfo = getBaseRateInfo(hotel, inventoryData, checkDate);
    return baseRateInfo.rate;
  };

  // Get today's date for inventory check
  const today = dayjs().format('YYYY-MM-DD');
  
  const budgetHotels = shuffled.filter(h => getHotelPrice(h, today) <= 1500 && getHotelPrice(h, today) > 0);
  const midRangeHotels = shuffled.filter(h => getHotelPrice(h, today) > 1500 && getHotelPrice(h, today) <= 3000);
  const luxuryHotels = shuffled.filter(h => getHotelPrice(h, today) > 3000);

  // Step 1: Add variety from different price ranges
  const priceRanges = [budgetHotels, midRangeHotels, luxuryHotels];
  priceRanges.forEach(range => {
    if (selectedHotels.length < count && range.length > 0) {
      const randomHotel = range[Math.floor(Math.random() * range.length)];
      if (randomHotel && randomHotel.id && !seenIds.has(randomHotel.id)) {
        seenIds.add(randomHotel.id);
        selectedHotels.push(randomHotel);
      }
    }
  });

  // Step 2: Fill remaining slots with random hotels
  const remainingSlots = count - selectedHotels.length;
  if (remainingSlots > 0) {
    const remainingHotels = shuffled.filter(h => !seenIds.has(h.id));
    addUniqueHotels(remainingHotels, remainingSlots);
  }

  // Shuffle the final selection
  const finalShuffled = [...selectedHotels];
  for (let i = finalShuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [finalShuffled[i], finalShuffled[j]] = [finalShuffled[j], finalShuffled[i]];
  }

  return finalShuffled.slice(0, count);
};

const HotelCardCarousel = () => {
  const { isBelow400px } = useScreenSize();
  const [allHotels, setAllHotels] = useState<any[]>([]);
  const [displayHotels, setDisplayHotels] = useState<any[]>([]);
  const [allRatings, setAllRatings] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const settings = {
    dots: false,
    infinite: displayHotels.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      { 
        breakpoint: 1024, 
        settings: { 
          slidesToShow: 2,
          centerMode: false,
          arrows: false,
        } 
      },
      { 
        breakpoint: 600, 
        settings: { 
          slidesToShow: 1,
          centerMode: false,
          arrows: false,
        } 
      },
    ],
  };

  // Function to fetch all ratings
  const fetchAllRatings = async () => {
    try {
      const payLoad = {
        data: { filter: "" },
        page: 0,
        pageSize: 1000,
        order: [["createdAt", "ASC"]],
      };
      const ratingsResponse = await getAllRatings(payLoad);
      let ratingsData = ratingsResponse?.data?.data;

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

  // Fetch inventory for a hotel
  const fetchHotelInventory = async (hotel: any, checkDate: string) => {
    const inventoryByRoom: {[key: string]: any[]} = {};

    if (!hotel.rooms || hotel.rooms.length === 0) {
      return inventoryByRoom;
    }

    for (const room of hotel.rooms) {
      try {
        const inventory = await fetchRoomInventory(room.id, checkDate);
        inventoryByRoom[room.id] = inventory;
      } catch (error) {
        console.error(`Error fetching inventory for room ${room.id}:`, error);
        inventoryByRoom[room.id] = [];
      }
    }

    return inventoryByRoom;
  };

  useEffect(() => {
    const fetchHotelsWithRooms = async () => {
      try {
        setLoading(true);

        // Fetch ratings in parallel
        const ratingsPromise = fetchAllRatings();

        // Fetch hotels
        const hotelPayload = {
          data: { filter: "", status: "Approved" },
          page: 0,
          pageSize: 50,
          order: [["createdAt", "ASC"]],
        };
        const hotelRes = await getAllHotels(hotelPayload);
        const hotelData = hotelRes?.data?.data?.rows || [];
        const hotelIds = hotelData.map((h: any) => h.id);

        console.log(`Fetching rooms for ${hotelIds.length} hotels...`);

        // Fetch hotels with rooms and ratings
        const [ratingsData] = await Promise.all([ratingsPromise]);

        setAllRatings(ratingsData);

        let mergedData: any[] = [];
        // Fetch rooms for all hotels
        for (const hotelId of hotelIds) {
          const belongsToPayload = {
            id: hotelId,
            secondTable: "Room",
          };
          const hotelWithRoomsRes = await getMyAllHotelswithBelongsTo(
            belongsToPayload
          );
          const hotelWithRooms = hotelWithRoomsRes?.data || null;
          if (hotelWithRooms && hotelWithRooms.data?.[0]) {
            // Calculate rating for this hotel
            const hotelId = hotelWithRooms.data[0].id;
            const hotelRatings = getRatingsForHotel(ratingsData, hotelId);
            const averageRating = calculateAverageRating(hotelRatings);

            mergedData.push({
              ...hotelWithRooms.data[0],
              ratings: {
                rating: averageRating,
                count: hotelRatings.length
              }
            });
          }
        }

        console.log(`Total hotels fetched with rooms: ${mergedData.length}`);
        
        // Store all hotels
        setAllHotels(mergedData);
        
        // Select mixed 20 properties for display
        const mixedProperties = selectMixedProperties(mergedData, 15); // Reduced to 15 for performance
        setDisplayHotels(mixedProperties);

        // Fetch inventory for display hotels
        const today = dayjs().format('YYYY-MM-DD');
        const inventoryPromises = mixedProperties.map(async (hotel) => {
          const inventory = await fetchHotelInventory(hotel, today);
          return { hotelId: hotel.id, inventory };
        });

        const inventoryResults = await Promise.all(inventoryPromises);
        const inventoryMap = inventoryResults.reduce((acc, { hotelId, inventory }) => {
          acc[hotelId] = inventory;
          return acc;
        }, {} as {[key: string]: any});

        setInventoryData(inventoryMap);

        console.log(`Displaying ${mixedProperties.length} hotels with inventory data`);

      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotelsWithRooms();
  }, []);

  const handleClick = (hotel: any) => {
    // Check availability based on inventory
    const firstRoom = hotel?.rooms?.[0];
    if (!firstRoom) return;

    const roomInventory = inventoryData[hotel.id]?.[firstRoom.id] || [];
    const inventoryStatus = getInventoryStatus(firstRoom, roomInventory, dayjs().format('YYYY-MM-DD'));
    
    if (!inventoryStatus.isAvailable) return;

    const searchData = {
      bookingType: "fullDay",
      location: "Bhubaneswar, Odisha, India",
      rooms: 1,
      adults: 2,
      children: 0,
      nights: 1,
      checkinDate: dayjs().format("YYYY-MM-DD"),
      minBudget: 100,
      maxBudget: 20000,
      sortBy: "all",
      page: 1,
      hotelId: hotel.id,
    };

    const queryString = Object.entries(searchData)
      .filter(([_, value]) => value !== "" && value !== null && value !== undefined)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      )
      .join("&");

    console.log("Navigating to search with params:", queryString);
    navigate(`/search?${queryString}`);
  };

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        '& .slick-slider': {
          width: '100%',
        },
        '& .slick-list': {
          width: '100%',
          margin: { xs: '0 -4px', sm: '0' },
        },
        '& .slick-track': {
          display: 'flex',
          alignItems: 'stretch',
        },
        '& .slick-slide': {
          height: 'auto',
          padding: { xs: '0 8px', sm: '0 12px' },
          '& > div': {
            height: '100%',
          }
        }
      }}
    >
      <Slider {...settings}>
        {displayHotels.map((hotel: any) => {
          const firstRoom = hotel?.rooms?.[0];
          const roomInventory = inventoryData[hotel.id]?.[firstRoom?.id] || [];
          const today = dayjs().format('YYYY-MM-DD');
          
          // Get base rate with inventory consideration
          const baseRateInfo = getBaseRateInfo(hotel, roomInventory, today);
          const { rate: baseRate, label } = baseRateInfo;
          
          const { basePrice, platformFee, gstTotal } =
            calculatePriceBreakdown(baseRate);

          const mainPrice = basePrice + platformFee;
          const taxesAndFees = gstTotal;

          // Check availability
          const inventoryStatus = firstRoom ? 
            getInventoryStatus(firstRoom, roomInventory, today) : 
            { isAvailable: false, status: 'No Rooms', reason: 'No rooms available' };

          const isAvailable = inventoryStatus.isAvailable;

          // Get rating
          const rating = hotel.ratings?.rating || 0;
          const reviewCount = hotel.ratings?.count || 0;

          return (
            <Box 
              key={hotel.id} 
              sx={{ 
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Card
                onClick={() => isAvailable && handleClick(hotel)}
                sx={{
                  width: { xs: '100%', sm: '100%', md: '100%' },
                  maxWidth: { xs: '100%', sm: '320px', md: '320px' },
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: "none",
                  borderRadius: "12px",
                  border: "solid 3px",
                  borderColor: isAvailable ? color.firstColor : "#777",
                  position: "relative",
                  cursor: isAvailable ? "pointer" : "not-allowed",
                  opacity: isAvailable ? 1 : 0.5,
                  pointerEvents: isAvailable ? "auto" : "none",
                  overflow: 'visible',
                }}
              >
                {/* Availability Badge */}
                {!isAvailable && (
                  <Tooltip title={inventoryStatus.reason}>
                    <Typography
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        zIndex: 1,
                        px: 1.5,
                        background: "#ff4444",
                        color: "white",
                        borderRadius: "0px 0px 0px 12px",
                        fontSize: "14px",
                        pb: 0.3,
                        fontWeight: "bold",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <BlockIcon sx={{ fontSize: 16 }} />
                      {inventoryStatus.status.toUpperCase()}
                    </Typography>
                  </Tooltip>
                )}

                {isAvailable && rating >= 4.5 && (
                  <Typography
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      zIndex: 1,
                      px: 1.5,
                      background: "#FFD700",
                      color: "#000",
                      borderRadius: "0px 0px 12px 0px",
                      fontSize: "12px",
                      pb: 0.3,
                      fontWeight: "bold",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <StarIcon sx={{ fontSize: 14 }} />
                    TOP RATED
                  </Typography>
                )}

                {isAvailable && (
                  <Typography
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: isAvailable && rating >= 4.5 ? 'auto' : 0,
                      left: isAvailable && rating >= 4.5 ? 'auto' : 0,
                      zIndex: 1,
                      px: 1.5,
                      background: color.background,
                      color: "white",
                      borderRadius: isAvailable && rating >= 4.5 ? "0px 0px 12px 0px" : "0px 0px 0px 12px",
                      fontSize: "14px",
                      pb: 0.3,
                    }}
                  >
                    Featured
                  </Typography>
                )}

                {/* Image container with fixed height */}
                <Box sx={{ height: '200px', overflow: 'hidden', flexShrink: 0 }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={hotel.propertyImages?.[0] || "/default-hotel.jpg"}
                    alt={hotel.propertyName}
                    sx={{ 
                      objectFit: "cover",
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </Box>

                {/* Card content with flex-grow to fill remaining space */}
                <CardContent sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  p: 2,
                  pb: 3,
                }}>
                  {/* Rating section */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center">
                      <Rating
                        value={rating}
                        precision={0.1}
                        readOnly
                        size="small"
                      />
                      <Typography
                        sx={{ fontSize: "16px", color: color.secondColor, ml: 1 }}
                      >
                        {rating > 0 ? rating.toFixed(1) : "N/A"}
                      </Typography>
                    </Box>
                    {reviewCount > 0 && (
                      <Typography
                        sx={{ fontSize: "12px", color: "#666" }}
                      >
                        ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                      </Typography>
                    )}
                  </Box>

                  {/* Property name - fixed height with minHeight */}
                  <Typography
                    sx={{ 
                      fontFamily: "CustomFontB", 
                      mb: 0.5,
                      minHeight: '3em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.5em'
                    }}
                    variant="h6"
                  >
                    {hotel.propertyName}
                  </Typography>

                  {/* Price section - dynamic pricing */}
                  <Box sx={{ 
                    minHeight: '60px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    mb: 1.5,
                  }}>
                    {mainPrice > 0 && isAvailable ? (
                      <>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                          ₹{Math.round(mainPrice)}{" "}
                          <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                            {label}
                          </span>
                        </Typography>
                        <Typography
                          sx={{ fontSize: "12px", color: "#555" }}
                        >
                          + ₹{Math.round(taxesAndFees)} taxes & fees
                        </Typography>
                        <Typography
                          sx={{ fontSize: "10px", color: "#888", mt: 0.5 }}
                        >
                          <em>Dynamic pricing based on today's availability</em>
                        </Typography>
                      </>
                    ) : (
                      <Typography sx={{ 
                        fontSize: "14px", 
                        color: "#777",
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        {isAvailable ? "Check Price" : inventoryStatus.reason}
                      </Typography>
                    )}
                  </Box>

                  {/* Location and Occupancy - fixed height */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    sx={{
                      background: color.background,
                      p: 1,
                      py: 1.5,
                      borderRadius: "12px",
                      minHeight: '50px',
                      mb: 1.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        color: "white",
                        px: 2,
                        display: "flex",
                        alignItems: "center",
                        width: '50%'
                      }}
                    >
                      <LocationOnIcon
                        style={{ fontSize: "18px", paddingRight: "4px" }}
                      />
                      {hotel.city || "City N/A"}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "12px",
                        color: "white",
                        px: 2,
                        display: "flex",
                        alignItems: "center",
                        width: '50%'
                      }}
                    >
                      <PersonIcon
                        style={{ fontSize: "18px", paddingRight: "4px" }}
                      />
                      {hotel.rooms?.[0]?.standardRoomOccupancy || 2}
                    </Typography>
                  </Box>

                  {/* Property Type Badge */}
                  <Typography
                    sx={{
                      fontSize: "10px",
                      background: "#e0e0e0",
                      color: "#333",
                      px: 1,
                      py: 0.2,
                      borderRadius: "4px",
                      display: "inline-block",
                      width: 'fit-content',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {hotel.propertyType || "Hotel"}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Slider>
    </Box>
  );
};

export default HotelCardCarousel;