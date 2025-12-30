// src/pages/SearchResults.tsx
import {
  AddCircleOutline,
  Cancel,
  FilterAlt,
  StarRounded,
  Whatshot,
  Block,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Drawer,
  FormControlLabel,
  Grid,
  RadioGroup,
  Slider,
  styled,
  ToggleButton,
  Typography,
  useMediaQuery,
  useTheme,
  Skeleton,
  Pagination,
  PaginationItem,
  Alert,
  Tooltip,
} from "@mui/material";
import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import color from "../components/color";
import CustomButton from "../components/CustomButton";
import { amenityIcons } from "../components/data";
import {
  BoxStyle,
  BpRadio,
  getRatingColor,
} from "../components/style";
import {
  getAllHotels,
  getMyAllHotelswithBelongsTo,
  getAllRatings,
  getAllInventories
} from "../services/services";
import SearchSection from "./Home Section/SearchSection";
import dayjs from "dayjs";
import { Helmet } from "react-helmet-async";

// Pagination constants
const ITEMS_PER_PAGE = 5;
const BATCH_SIZE = 30;

// Cache for storing fetched data
const dataCache = {
  hotels: [] as any[],
  ratings: null as any,
  inventories: null as any,
  lastFetched: 0,
  TTL: 5 * 60 * 1000,
};

const HotelCardSkeleton = ({ isMobile }: { isMobile: boolean }) => (
  <Card sx={{ mb: 2, height: { xs: "auto", md: 220 } }}>
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, height: "100%" }}>
      <Skeleton
        variant="rectangular"
        width={isMobile ? "100%" : 300}
        height={isMobile ? 200 : "100%"}
      />
      <Box sx={{ p: 2, flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
        <Skeleton width="40%" height={24} />
        <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
        <Skeleton width="80%" height={20} sx={{ mt: 1 }} />
        <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} width={80} height={24} />
          ))}
        </Box>
        <Box sx={{ mt: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Box>
            <Skeleton width={120} height={28} />
            <Skeleton width={180} height={36} sx={{ mt: 1 }} />
            <Skeleton width={140} height={20} sx={{ mt: 1 }} />
          </Box>
          <Skeleton width={100} height={40} variant="rectangular" sx={{ borderRadius: "8px" }} />
        </Box>
      </Box>
    </Box>
  </Card>
);

// Function to get inventory-based price (INVENTORY FIRST, then room price)
const getInventoryPrice = (room: any, inventoryData: any[], checkDate: string, slot: string): number => {
  if (!room || !checkDate) return 0;
  
  const roomId = room.id;
  const checkDay = dayjs(checkDate).format('YYYY-MM-DD');
  
  // FIRST: Check inventory for the specific day
  const dayInventory = inventoryData?.find(inv => 
    inv.roomId === roomId && dayjs(inv.date).format('YYYY-MM-DD') === checkDay
  );

  if (dayInventory) {
    // Return inventory price if available
    switch(slot) {
      case 'rateFor1Night':
        return dayInventory.overnightRate || 0;
      case 'rateFor3Hour':
        return dayInventory.threeHourRate || 0;
      case 'rateFor6Hour':
        return dayInventory.sixHourRate || 0;
      case 'rateFor12Hour':
        return dayInventory.twelveHourRate || 0;
      default:
        return 0;
    }
  }
  
  // SECOND: If no inventory found for that day, use room price
  return room[slot] || 0;
};

// Function to check slot availability
const isSlotAvailable = (room: any, inventoryData: any[], checkDate: string, slot: string, checkinTime?: string): boolean => {
  if (!room || !checkDate) return false;
  
  const roomStatus = room.status?.toLowerCase();
  const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
  if (!isStatusAvailable) return false;
  
  const checkDay = dayjs(checkDate).format('YYYY-MM-DD');
  const dayInventory = inventoryData?.find(inv => 
    dayjs(inv.date).format('YYYY-MM-DD') === checkDay
  );
  
  // If no inventory data for this day, check room availability
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
const checkRoomAvailability = (room: any, inventoryData: any[], checkDate: string, bookingType: string, checkinTime?: string): boolean => {
  if (!room || !checkDate) return false;
  
  const roomStatus = room.status?.toLowerCase();
  const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
  if (!isStatusAvailable) return false;
  
  const checkDay = dayjs(checkDate).format('YYYY-MM-DD');
  const dayInventory = inventoryData.find(inv => 
    dayjs(inv.date).format('YYYY-MM-DD') === checkDay
  );
  
  // If no inventory data for this day, check room status only
  if (!dayInventory) return true;
  
  if (dayInventory.isBlocked) return false;

  if (bookingType === "hourly") {
    // Check if any hourly slot is available
    return (
      (dayInventory.threeHourAvailable > dayInventory.threeHourBooked) ||
      (dayInventory.sixHourAvailable > dayInventory.sixHourBooked) ||
      (dayInventory.twelveHourAvailable > dayInventory.twelveHourBooked)
    );
  } else {
    // Check overnight availability
    return dayInventory.overnightAvailable > dayInventory.overnightBooked;
  }
};

// UPDATED: Function to get hotel status - check hotel roomAvailable FIRST, then inventory
const getHotelStatus = (hotel: any, room: any, inventoryData: any[], checkDate: string, bookingType: string): { 
  isAvailable: boolean, 
  status: string, 
  reason: string 
} => {
  // DEBUG: Log hotel and room status
  console.log(`🔍 Checking hotel: ${hotel?.propertyName}`);
  console.log(`   - Hotel roomAvailable: ${hotel?.roomAvailable || "Available"}`);
  console.log(`   - Room status: ${room?.status?.toLowerCase()}`);
  
  // FIRST: Check if hotel roomAvailable is "Unavailable" - show as "Sold Out"
  const hotelRoomAvailable = hotel?.roomAvailable || "Available";
  if (hotelRoomAvailable === "Unavailable") {
    console.log(`   ❌ Hotel marked as Unavailable in roomAvailable field`);
    return { 
      isAvailable: false, 
      status: 'Sold Out',
      reason: 'Hotel is currently sold out'
    };
  }

  // SECOND: Check room status
  // const roomStatus = room?.status?.toLowerCase();
  // const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
  
  // if (!isStatusAvailable) {
  //   console.log(`   ❌ Room status not available: ${roomStatus}`);
  //   return { 
  //     isAvailable: false, 
  //     status: 'Sold Out',
  //     reason: 'Room is currently sold out'
  //   };
  // }

  const checkDay = checkDate ? dayjs(checkDate).format('YYYY-MM-DD') : '';
  console.log(`   - Check date: ${checkDay}`);
  
  if (!checkDay) {
    return { 
      isAvailable: true, 
      status: 'Available', 
      reason: 'Available for booking (no date specified)'
    };
  }

  const dayInventory = checkDay ? inventoryData.find(inv => 
    dayjs(inv.date).format('YYYY-MM-DD') === checkDay
  ) : null;
  
  if (dayInventory) {
    console.log(`   - Found inventory for date`);
    console.log(`   - Inventory isBlocked: ${dayInventory.isBlocked}`);
    
    if (dayInventory.isBlocked) {
      return { 
        isAvailable: false, 
        status: 'Blocked', 
        reason: 'Room is blocked for selected date'
      };
    }
    
    if (bookingType === "hourly") {
      const threeHourAvailable = dayInventory.threeHourAvailable > dayInventory.threeHourBooked;
      const sixHourAvailable = dayInventory.sixHourAvailable > dayInventory.sixHourBooked;
      const twelveHourAvailable = dayInventory.twelveHourAvailable > dayInventory.twelveHourBooked;
      
      console.log(`   - Hourly availability check:`);
      console.log(`     - 3h: ${dayInventory.threeHourAvailable}/${dayInventory.threeHourBooked} = ${threeHourAvailable}`);
      console.log(`     - 6h: ${dayInventory.sixHourAvailable}/${dayInventory.sixHourBooked} = ${sixHourAvailable}`);
      console.log(`     - 12h: ${dayInventory.twelveHourAvailable}/${dayInventory.twelveHourBooked} = ${twelveHourAvailable}`);
      
      const hasHourlyAvailability = threeHourAvailable || sixHourAvailable || twelveHourAvailable;
      
      if (!hasHourlyAvailability) {
        console.log(`   ❌ No hourly slots available`);
        return { 
          isAvailable: false, 
          status: 'Sold Out', 
          reason: 'No hourly slots available for selected date'
        };
      }
    } else {
      const overnightAvailable = dayInventory.overnightAvailable > dayInventory.overnightBooked;
      console.log(`   - Overnight availability: ${dayInventory.overnightAvailable}/${dayInventory.overnightBooked} = ${overnightAvailable}`);
      
      if (!overnightAvailable) {
        return { 
          isAvailable: false, 
          status: 'Sold Out', 
          reason: 'No overnight availability for selected date'
        };
      }
    }
  } else {
    console.log(`   - No inventory found for date, assuming available`);
  }
  
  console.log(`   ✅ Hotel is available`);
  return { 
    isAvailable: true, 
    status: 'Available', 
    reason: 'Available for booking'
  };
};

// Get base room rate considering inventory (INVENTORY FIRST, then room)
// Update the getBaseRate function to handle cases where no rates are available:

const getBaseRate = (hotel: any, inventoryData: any[] = [], checkDate: string, bookingType: string, checkinTime?: string) => {
  if (!hotel?.rooms?.[0]) return 0;

  const room = hotel.rooms[0];
  let baseRates: number[] = [];

  // Check if hotel is marked as unavailable
  const hotelRoomAvailable = hotel?.roomAvailable || "Available";
  if (hotelRoomAvailable === "Unavailable") {
    return 0; // Return 0 for sold out hotels
  }

  if (bookingType === "hourly") {
    // Check hourly rates with inventory
    const hourlyRates = [
      { 
        key: 'rateFor3Hour', 
        rate: getInventoryPrice(room, inventoryData, checkDate, 'rateFor3Hour'),
        available: isSlotAvailable(room, inventoryData, checkDate, 'rateFor3Hour', checkinTime)
      },
      { 
        key: 'rateFor6Hour', 
        rate: getInventoryPrice(room, inventoryData, checkDate, 'rateFor6Hour'),
        available: isSlotAvailable(room, inventoryData, checkDate, 'rateFor6Hour', checkinTime)
      },
      { 
        key: 'rateFor12Hour', 
        rate: getInventoryPrice(room, inventoryData, checkDate, 'rateFor12Hour'),
        available: isSlotAvailable(room, inventoryData, checkDate, 'rateFor12Hour', checkinTime)
      },
    ];
    
    // Only include rates that are available and have price > 0
    baseRates = hourlyRates
      .filter(opt => opt.rate > 0 && opt.available)
      .map(opt => opt.rate);
    
    // If no specific date rates available, use room's base rates
    if (baseRates.length === 0) {
      baseRates = [
        room.rateFor3Hour || 0,
        room.rateFor6Hour || 0,
        room.rateFor12Hour || 0,
      ].filter(rate => rate > 0);
    }
  } else {
    // Check overnight rate with inventory
    const overnightRate = getInventoryPrice(room, inventoryData, checkDate, 'rateFor1Night');
    const isAvailable = isSlotAvailable(room, inventoryData, checkDate, 'rateFor1Night');
    
    if (overnightRate > 0 && isAvailable) {
      baseRates.push(overnightRate);
    } else if (room.rateFor1Night > 0) {
      // Use room's base rate if inventory not available
      baseRates.push(room.rateFor1Night);
    }
  }

  if (!baseRates.length) return 0;
  return Math.min(...baseRates);
};

// 💰 Price breakdown per single unit
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
  const amountBeforeGateway = numericBase + gstOnBase + platformFee + gstOnPlatform;
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

// helper to format INR
const formatINR = (val: number) =>
  val.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  });

// Function to calculate average rating for a hotel
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

// HotelCard component with hotel roomAvailable support
const HotelCard = ({
  hotel,
  queryParams,
  isMobile,
  hotelRatings = [],
  inventoryData = [],
}: {
  hotel: any;
  queryParams: URLSearchParams;
  isMobile: boolean;
  hotelRatings?: any[];
  inventoryData?: any[];
}) => {
  const navigate = useNavigate();
  const maxAmenities = isMobile ? 2 : 4;
  const visibleAmenities = hotel?.rooms?.[0]?.amenities?.slice(0, maxAmenities) || [];
  const remainingAmenities = Math.max(0, (hotel?.rooms?.[0]?.amenities?.length || 0) - maxAmenities);
  const isPremium = hotel?.isPremium || false;

  const room = hotel?.rooms?.[0] || {};
  const bookingType = queryParams.get("bookingType") || "fullDay";
  const checkinDate = queryParams.get("checkinDate") || dayjs().format('YYYY-MM-DD');
  const checkinTime = queryParams.get("time") || "";
  const activeHours = queryParams.get("bookingHours") || "3";
  const roomsCount = Math.max(1, Number(queryParams.get("rooms")) || 1);
  const nights = bookingType === "hourly" ? 1 : Math.max(1, Number(queryParams.get("nights")) || 1);

  // UPDATED: Check availability using hotel roomAvailable first, then inventory
  const hotelStatus = getHotelStatus(hotel, room, inventoryData, checkinDate, bookingType);
  const isAvailable = hotelStatus.isAvailable;

  // Get base rate considering inventory (inventory first, then room)
  const baseRate = getBaseRate(hotel, inventoryData, checkinDate, bookingType, checkinTime);
  const breakdown = calculatePriceBreakdown(baseRate);

  const perRoomFinal = breakdown.finalPrice;
  const perRoomBase = breakdown.basePrice;
  const perRoomPlatform = breakdown.platformFee;
  const perRoomGstTotal = breakdown.gstTotal;

  const multiplier = roomsCount * nights;
  const totalBase = +(perRoomBase * multiplier);
  const totalPlatform = +(perRoomPlatform * multiplier);
  const totalGst = +(perRoomGstTotal * multiplier);
  const totalFinal = +(perRoomFinal * multiplier);

  const displayBasePlus700 = totalBase + 700;
  const averageRating = hotelRatings.length > 0 ? calculateAverageRating(hotelRatings) : hotel?.ratings?.rating || 0;
  const reviewCount = hotelRatings.length || hotel?.reviews || 0;

  const handleHourChange = (hour: string) => {
    if (!isAvailable) return; // Don't allow hour change if hotel is unavailable
    const params = new URLSearchParams(queryParams.toString());
    params.set("bookingHours", hour);
    navigate(`/search?${params.toString()}`, { replace: true });
  };

  // Get hourly options with inventory pricing (inventory first, then room)
  const hourlyOptions = bookingType === "hourly"
    ? [
      { 
        key: "3", 
        label: "3 Hrs", 
        slot: 'rateFor3Hour',
        rate: getInventoryPrice(room, inventoryData, checkinDate, 'rateFor3Hour'),
        available: isSlotAvailable(room, inventoryData, checkinDate, 'rateFor3Hour', checkinTime)
      },
      { 
        key: "6", 
        label: "6 Hrs", 
        slot: 'rateFor6Hour',
        rate: getInventoryPrice(room, inventoryData, checkinDate, 'rateFor6Hour'),
        available: isSlotAvailable(room, inventoryData, checkinDate, 'rateFor6Hour', checkinTime)
      },
      { 
        key: "12", 
        label: "12 Hrs", 
        slot: 'rateFor12Hour',
        rate: getInventoryPrice(room, inventoryData, checkinDate, 'rateFor12Hour'),
        available: isSlotAvailable(room, inventoryData, checkinDate, 'rateFor12Hour', checkinTime)
      },
    ]
      .filter((opt) => opt.rate > 0 && opt.available)
      .map((opt) => {
        const br = calculatePriceBreakdown(opt.rate);
        const perRoomBaseHr = br.basePrice;
        const perRoomPlatformHr = br.platformFee;
        const perRoomGstTotalHr = br.gstTotal;

        const totalBaseHr = perRoomBaseHr * roomsCount;
        const totalPlatformHr = perRoomPlatformHr * roomsCount;
        const totalGstHr = perRoomGstTotalHr * roomsCount;
        const totalFinalHr = totalBaseHr + totalPlatformHr + totalGstHr;

        return {
          ...opt,
          totalBase: totalBaseHr,
          totalPlatform: totalPlatformHr,
          totalGst: totalGstHr,
          totalFinal: totalFinalHr,
        };
      })
    : [];

  const truncateAddress = (address: string, maxLength: number = 30) => {
    if (!address) return "Address not available";
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + "...";
  };

  const handleCardClick = () => {
    if (!isAvailable) return;
    const queryString = queryParams.toString();
    navigate(`/hotel/${hotel.id}${queryString ? `?${queryString}` : ""}`, {
      state: { hotelData: hotel },
    });
  };

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        mb: 3,
        background: isAvailable ? color.thirdColor : "#f5f5f5",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        borderRadius: "16px",
        transition: "all 0.3s ease",
        cursor: isAvailable ? "pointer" : "not-allowed",
        border: `1px solid ${isAvailable ? "transparent" : "#e0e0e0"}`,
        position: "relative",
        overflow: "hidden",
        minHeight: { xs: "auto", md: 220 },
        "&:hover": {
          transform: isAvailable ? "translateY(-4px)" : "none",
          boxShadow: isAvailable ? "0px 8px 24px rgba(0, 0, 0, 0.15)" : "0px 4px 12px rgba(0, 0, 0, 0.1)",
          borderColor: isAvailable ? color.firstColor : "#e0e0e0",
        },
        opacity: isAvailable ? 1 : 0.7,
      }}
    >
      {!isAvailable && (
        <Tooltip title={hotelStatus.reason}>
          <Box sx={{ 
            position: "absolute", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 2, 
            background: "rgba(0,0,0,0.6)", 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            borderRadius: "16px"
          }}>
            <Box sx={{ 
              background: hotelStatus.status === 'Sold Out' ? "#ff4444" : 
                        hotelStatus.status === 'Blocked' ? "#ffaa00" : "#ff4444",
              color: "white", 
              px: 3, 
              py: 1.5, 
              borderRadius: "8px", 
              fontWeight: "bold", 
              fontSize: { xs: "13px", md: "14px" }, 
              transform: "rotate(-3deg)", 
              boxShadow: "0 4px 8px rgba(255, 77, 77, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 1
            }}>
              <Block sx={{ fontSize: 20 }} />
              {hotelStatus.status.toUpperCase()}
            </Box>
          </Box>
        </Tooltip>
      )}

      <Box sx={{ 
        width: { xs: "100%", md: 300 }, 
        height: { xs: 200, md: "100%" }, 
        minHeight: { xs: 200, md: 220 }, 
        maxHeight: { xs: 200, md: 250 }, 
        position: "relative", 
        overflow: "hidden", 
        flexShrink: 0 
      }}>
        <CardMedia 
          component="img" 
          sx={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            transition: "transform 0.5s ease", 
            filter: isAvailable ? "none" : "grayscale(80%) brightness(0.9)", 
            opacity: isAvailable ? 1 : 0.7, 
            "&:hover": { transform: isAvailable ? "scale(1.05)" : "none" } 
          }} 
          image={hotel?.propertyImages?.[0] || "https://via.placeholder.com/400x250?text=No+Image"} 
          alt={hotel?.propertyName} 
          loading="lazy" 
        />
        {isPremium && (
          <Box sx={{ 
            position: "absolute", 
            top: 12, 
            left: 12, 
            background: "linear-gradient(135deg, #FFD700, #FFA500)", 
            color: "#000", 
            px: 1.5, 
            py: 0.5, 
            borderRadius: "6px", 
            fontSize: "10px", 
            fontWeight: "bold", 
            display: "flex", 
            alignItems: "center", 
            gap: "4px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)", 
            zIndex: 1 
          }}>
            <Whatshot sx={{ fontSize: "12px" }} /> PREMIUM
          </Box>
        )}
      </Box>

      <CardContent sx={{ 
        padding: { xs: "16px", md: "20px 24px" }, 
        width: "100%", 
        display: "flex", 
        flexDirection: "column", 
        flex: 1, 
        position: "relative" 
      }}>
        {isPremium && (
          <Box sx={{ width: "fit-content", mb: 1.5 }}>
            <Typography sx={{ 
              fontWeight: 700, 
              color: "#000", 
              width: "fit-content", 
              px: 1.5, 
              py: 0.5, 
              borderRadius: "6px", 
              fontSize: "10px", 
              background: "linear-gradient(135deg, #FFD700, #FFA500)", 
              display: "flex", 
              alignItems: "center", 
              gap: "4px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)" 
            }}>
              <Whatshot sx={{ fontSize: "12px" }} /> Huts4u PREMIUM
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ 
            fontSize: { xs: "17px", md: "20px" }, 
            fontWeight: 700, 
            color: isAvailable ? color.firstColor : "#666", 
            display: "-webkit-box", 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            WebkitLineClamp: 1, 
            WebkitBoxOrient: "vertical", 
            lineHeight: 1.2 
          }}>
            {hotel?.propertyName}
          </Typography>
          <Typography sx={{ 
            fontFamily: "CustomFontSB", 
            fontSize: { xs: "12px", md: "14px" }, 
            color: isAvailable ? "#666" : "#888", 
            display: "-webkit-box", 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            WebkitLineClamp: 1, 
            WebkitBoxOrient: "vertical", 
            mt: 0.5, 
            lineHeight: 1.3 
          }}>
            📍 {isMobile ? truncateAddress(hotel?.address || hotel?.city || "", 35) + "  BBSR" : truncateAddress(hotel?.address || hotel?.city || "", 35) + "  BBSR"}
          </Typography>
        </Box>

        {!isMobile && (
          <Box sx={{ 
            position: "absolute", 
            top: { xs: "auto", md: 20 }, 
            right: { xs: "auto", md: 24 }, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "flex-end", 
            mb: 1.5 
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "4px", mb: 0.5 }}>
              {averageRating > 0 ? (
                <Box sx={{ 
                  background: getRatingColor(averageRating), 
                  color: "#fff", 
                  px: 1.2, 
                  py: 0.6, 
                  borderRadius: "8px", 
                  fontSize: "14px", 
                  fontWeight: 700, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "4px", 
                  minWidth: "60px", 
                  justifyContent: "center", 
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)" 
                }}>
                  {averageRating.toFixed(1)}
                  <StarRounded sx={{ fontSize: "14px" }} />
                </Box>
              ) : (
                <Box sx={{ 
                  background: "rgba(0,0,0,0.05)", 
                  color: "#888", 
                  px: 1.2, 
                  py: 0.6, 
                  borderRadius: "8px", 
                  fontSize: "14px", 
                  fontWeight: 700, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "4px", 
                  minWidth: "60px", 
                  justifyContent: "center", 
                  border: "1px dashed #ddd" 
                }}>
                  N/A
                  <StarRounded sx={{ fontSize: "14px", color: "#aaa" }} />
                </Box>
              )}
            </Box>
            {reviewCount > 0 ? (
              <Typography variant="body2" fontWeight={600} color={isAvailable ? "#666" : "#aaa"} sx={{ fontSize: "11px", textAlign: "right" }}>
                ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
              </Typography>
            ) : (
              <Typography variant="body2" fontWeight={600} color={isAvailable ? "#888" : "#aaa"} sx={{ fontSize: "11px", fontStyle: "italic" }}>
                No reviews yet
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ 
          display: "flex", 
          gap: 0.5, 
          flexWrap: "wrap", 
          mt: 1.5, 
          mb: { xs: 2, md: 1.5 } 
        }}>
          {visibleAmenities.map((amenity: any, index: any) => (
            <Chip 
              key={index} 
              label={amenity} 
              icon={amenityIcons[amenity] || <AddCircleOutline />} 
              size="small" 
              sx={{ 
                bgcolor: "rgba(75, 42, 173, 0.1)", 
                fontSize: { xs: "10px", md: "11px" }, 
                color: isAvailable ? "#4B2AAD" : "#aaa", 
                height: "24px", 
                border: "1px solid rgba(75, 42, 173, 0.2)", 
                "& .MuiChip-icon": { 
                  fontSize: { xs: "12px", md: "14px" }, 
                  color: isAvailable ? "#4B2AAD" : "#aaa", 
                  marginLeft: "4px", 
                  marginRight: "-4px" 
                } 
              }} 
            />
          ))}
          {remainingAmenities > 0 && (
            <Chip 
              label={`+${remainingAmenities} more`} 
              size="small" 
              sx={{ 
                bgcolor: isAvailable ? "rgba(0,0,0,0.05)" : "#f5f5f5", 
                fontSize: { xs: "10px", md: "11px" }, 
                color: isAvailable ? "#666" : "#aaa", 
                height: "24px" 
              }} 
            />
          )}
        </Box>

        <Box sx={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: { xs: 2, md: 1 }, 
          mt: "auto", 
          pt: { xs: 3, md: 0 }, 
          borderTop: { xs: "1px dashed #e0e0e0", md: "none" } 
        }}>
          {isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {averageRating > 0 ? (
                  <Box sx={{ 
                    background: getRatingColor(averageRating), 
                    color: "#fff", 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: "6px", 
                    fontSize: "13px", 
                    fontWeight: 700, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "4px", 
                    minWidth: "55px", 
                    justifyContent: "center", 
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)" 
                  }}>
                    {averageRating.toFixed(1)}
                    <StarRounded sx={{ fontSize: "13px" }} />
                  </Box>
                ) : (
                  <Box sx={{ 
                    background: "rgba(0,0,0,0.05)", 
                    color: "#888", 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: "6px", 
                    fontSize: "13px", 
                    fontWeight: 700, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "4px", 
                    minWidth: "55px", 
                    justifyContent: "center", 
                    border: "1px dashed #ddd" 
                  }}>
                    N/A
                    <StarRounded sx={{ fontSize: "13px", color: "#aaa" }} />
                  </Box>
                )}
                {reviewCount > 0 ? (
                  <Typography variant="body2" fontWeight={600} color={isAvailable ? "#666" : "#aaa"} sx={{ fontSize: "12px" }}>
                    ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                  </Typography>
                ) : (
                  <Typography variant="body2" fontWeight={600} color={isAvailable ? "#888" : "#aaa"} sx={{ fontSize: "12px", fontStyle: "italic" }}>
                    No reviews yet
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {bookingType === "hourly" ? (
            <Box sx={{ width: "100%" }}>
              {hourlyOptions.length > 0 ? (
                (() => {
                  const selectedOption = hourlyOptions.find((opt) => opt.key === activeHours);
                  if (!selectedOption) {
                    return (
                      <Typography sx={{ fontSize: "12px", color: "#888", textAlign: "center", py: 2 }}>
                        Not available for selected hours
                      </Typography>
                    );
                  }

                  const mainPrice = Math.round(selectedOption.totalBase + selectedOption.totalPlatform);
                  const gstPrice = Math.round(selectedOption.totalGst);

                  return (
                    <>
                      <Box sx={{ 
                        display: "flex", 
                        gap: { xs: 0.5, sm: 1 }, 
                        mb: 2, 
                        justifyContent: { xs: "flex-start", sm: "flex-start" }, 
                        flexWrap: "nowrap", 
                        overflowX: { xs: "auto", sm: "visible" }, 
                        pb: { xs: 1, sm: 0 }, 
                        "&::-webkit-scrollbar": { height: "4px" }, 
                        "&::-webkit-scrollbar-track": { background: "#f1f1f1" }, 
                        "&::-webkit-scrollbar-thumb": { background: "#ccc", borderRadius: "2px" } 
                      }}>
                        {hourlyOptions.map((opt) => {
                          const isActive = opt.key === activeHours;
                          return (
                            <Box 
                              key={opt.key} 
                              onClick={(e) => { 
                                e.stopPropagation();
                                if (!isAvailable) return;
                                handleHourChange(opt.key); 
                              }} 
                              sx={{ 
                                flexShrink: 0, 
                                textAlign: "center", 
                                py: { xs: 0.75, sm: 1 }, 
                                px: { xs: 0.75, sm: 1.5 }, 
                                borderRadius: "8px", 
                                cursor: isAvailable ? "pointer" : "not-allowed", 
                                fontSize: { xs: "11px", sm: "12px", md: "13px" }, 
                                fontWeight: 700, 
                                background: isActive ? (isAvailable ? "#4B2AAD" : "#aaa") : "rgba(75, 42, 173, 0.1)", 
                                color: isActive ? "#fff" : (isAvailable ? "#4B2AAD" : "#888"), 
                                border: `1px solid ${isActive ? "#4B2AAD" : "rgba(75, 42, 173, 0.3)"}`, 
                                transition: "all 0.2s ease", 
                                opacity: isAvailable ? 1 : 0.6, 
                                minWidth: { xs: "70px", sm: "80px" }, 
                                whiteSpace: "nowrap", 
                                "&:hover": isAvailable ? { 
                                  transform: "translateY(-1px)", 
                                  boxShadow: "0 2px 8px rgba(75, 42, 173, 0.3)" 
                                } : {} 
                              }}
                            >
                              {opt.label}
                            </Box>
                          );
                        })}
                      </Box>

                      <Box sx={{ 
                        display: "flex", 
                        flexDirection: { xs: "column", sm: "row" }, 
                        justifyContent: "space-between", 
                        alignItems: { xs: "stretch", sm: "center" }, 
                        gap: { xs: 1.5, sm: 2, md: 3 } 
                      }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ 
                            fontSize: { xs: "12px", md: "13px" }, 
                            color: isAvailable ? "#666" : "#888", 
                            mb: 0.5, 
                            fontWeight: 500, 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 0.5, 
                            flexWrap: "wrap" 
                          }}>
                            <span>{roomsCount} room{roomsCount > 1 ? "s" : ""}</span>
                            <span>•</span>
                            <span>{selectedOption.label}</span>
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
                            <Typography sx={{ 
                              fontSize: { xs: "20px", sm: "22px", md: "24px" }, 
                              fontWeight: 800, 
                              color: isAvailable ? color.firstColor : "#888", 
                              lineHeight: 1 
                            }}>
                              {isAvailable ? formatINR(mainPrice) : "---"}
                            </Typography>
                            {isAvailable && (
                              <Typography sx={{ 
                                fontSize: { xs: "11px", md: "12px" }, 
                                color: "#666", 
                                fontWeight: 500 
                              }}>
                                + {formatINR(gstPrice)} taxes & fees
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        {isAvailable ? (
                          <Box 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick();
                            }}
                            sx={{ 
                              background: "linear-gradient(135deg, #4B2AAD, #6C4BD3)", 
                              color: "#fff", 
                              px: { xs: 0, sm: 2.5, md: 3 }, 
                              py: { xs: 0, sm: 1.25, md: 1.5 }, 
                              borderRadius: "10px", 
                              textAlign: "center", 
                              minWidth: { xs: "40%", sm: "120px", md: "140px" }, 
                              cursor: "pointer", 
                              transition: "all 0.3s ease", 
                              mt: { xs: 1, sm: 0 }, 
                              marginRight: { xs: 3 }, 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              height: { xs: "44px", sm: "48px" }, 
                              "&:hover": { 
                                transform: "translateY(-2px)", 
                                boxShadow: "0 4px 12px rgba(75, 42, 173, 0.4)" 
                              } 
                            }}
                          >
                            <Typography sx={{ 
                              fontSize: { xs: "14px", sm: "15px", md: "16px" }, 
                              fontWeight: 700, 
                              whiteSpace: "nowrap" 
                            }}>
                              Book Now
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ 
                            background: "#e0e0e0", 
                            color: "#888", 
                            px: { xs: 0, sm: 2.5, md: 3 }, 
                            py: { xs: 0, sm: 1.25, md: 1.5 }, 
                            borderRadius: "10px", 
                            textAlign: "center", 
                            minWidth: { xs: "40%", sm: "120px", md: "140px" }, 
                            cursor: "not-allowed", 
                            mt: { xs: 1, sm: 0 }, 
                            marginRight: { xs: 3 }, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            height: { xs: "44px", sm: "48px" }, 
                          }}>
                            <Typography sx={{ 
                              fontSize: { xs: "14px", sm: "15px", md: "16px" }, 
                              fontWeight: 700, 
                              whiteSpace: "nowrap" 
                            }}>
                              {hotelStatus.status}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </>
                  );
                })()
              ) : (
                <Typography sx={{ 
                  fontSize: "12px", 
                  color: "#888", 
                  textAlign: "center", 
                  py: 2, 
                  border: "1px dashed #ddd", 
                  borderRadius: "8px", 
                  background: "#f9f9f9" 
                }}>
                  Not available for hourly stay
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ 
              display: "flex", 
              flexDirection: { xs: "column", sm: "row" }, 
              justifyContent: "space-between", 
              alignItems: { xs: "stretch", sm: "center" }, 
              gap: { xs: 1.5, sm: 2, md: 3 }, 
              width: "100%" 
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {isAvailable && displayBasePlus700 > 0 && (
                  <Typography sx={{ 
                    fontSize: { xs: "12px", md: "14px" }, 
                    color: isAvailable ? "#999" : "#aaa", 
                    textDecoration: "line-through", 
                    fontWeight: 500, 
                    mb: 0.5 
                  }}>
                    {formatINR(Math.round(displayBasePlus700))}
                  </Typography>
                )}

                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
                  <Typography sx={{ 
                    fontSize: { xs: "22px", sm: "24px", md: "26px" }, 
                    color: isAvailable ? color.firstColor : "#888", 
                    fontWeight: 800, 
                    lineHeight: 1 
                  }}>
                    {isAvailable && totalBase + totalPlatform > 0 ? `${formatINR(Math.round(totalBase + totalPlatform))}` : "---"}
                  </Typography>
                  {isAvailable && totalFinal > 0 && (
                    <Typography sx={{ 
                      fontSize: { xs: "11px", md: "13px" }, 
                      color: "#666", 
                      fontWeight: 500 
                    }}>
                      + {formatINR(Math.round(totalGst))} taxes & fees
                    </Typography>
                  )}
                </Box>

                <Typography sx={{ 
                  fontSize: { xs: "12px", md: "13px" }, 
                  color: isAvailable ? "#666" : "#aaa", 
                  mt: 1, 
                  fontWeight: 500, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 0.5, 
                  flexWrap: "wrap" 
                }}>
                  <span>{roomsCount} room{roomsCount > 1 ? "s" : ""}</span>
                  {bookingType !== "hourly" && (
                    <>
                      <span>•</span>
                      <span>{nights} night{nights > 1 ? "s" : ""}</span>
                    </>
                  )}
                </Typography>
              </Box>

              {isAvailable ? (
                <Box 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                  sx={{ 
                    background: "linear-gradient(135deg, #4B2AAD, #6C4BD3)", 
                    color: "#fff", 
                    px: { xs: 0, sm: 2.5, md: 3 }, 
                    py: { xs: 0, sm: 1.25, md: 1.5 }, 
                    borderRadius: "10px", 
                    textAlign: "center", 
                    minWidth: { xs: "40%", sm: "130px", md: "150px" }, 
                    cursor: "pointer", 
                    transition: "all 0.3s ease", 
                    mt: { xs: 1, sm: 0 }, 
                    marginRight: { xs: 3 }, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    height: { xs: "44px", sm: "48px" }, 
                    "&:hover": { 
                      transform: "translateY(-2px)", 
                      boxShadow: "0 4px 12px rgba(75, 42, 173, 0.4)" 
                    } 
                  }}
                >
                  <Typography sx={{ 
                    fontSize: { xs: "14px", sm: "15px", md: "16px" }, 
                    fontWeight: 700, 
                    whiteSpace: "nowrap" 
                  }}>
                    Book Now
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  background: "#e0e0e0", 
                  color: "#888", 
                  px: { xs: 0, sm: 2.5, md: 3 }, 
                  py: { xs: 0, sm: 1.25, md: 1.5 }, 
                  borderRadius: "10px", 
                  textAlign: "center", 
                  minWidth: { xs: "40%", sm: "130px", md: "150px" }, 
                  cursor: "not-allowed", 
                  mt: { xs: 1, sm: 0 }, 
                  marginRight: { xs: 3 }, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  height: { xs: "44px", sm: "48px" }, 
                }}>
                  <Typography sx={{ 
                    fontSize: { xs: "14px", sm: "15px", md: "16px" }, 
                    fontWeight: 700, 
                    whiteSpace: "nowrap" 
                  }}>
                    {hotelStatus.status}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const SearchResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mergedData, setMergedData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [paginatedData, setPaginatedData] = useState<any[]>([]);
  const [allRatings, setAllRatings] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<{[key: string]: any[]}>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [loadedHotelIds, setLoadedHotelIds] = useState<Set<string>>(new Set());
  const [hotelIdList, setHotelIdList] = useState<string[]>([]);

  const queryParams = new URLSearchParams(location.search);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  // Refs for caching
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize pagination from URL
  useEffect(() => {
    const pageFromUrl = Number(queryParams.get("page")) || 1;
    setCurrentPage(pageFromUrl);
  }, [location.search]);

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

  // Check cache validity
  const isCacheValid = () => {
    return dataCache.hotels.length > 0 && (Date.now() - dataCache.lastFetched) < dataCache.TTL;
  };

  // Function to apply filters
  const applyFilters = () => {
    if (isMobile) {
      setOpen(false);
    }
    
    const newParams = new URLSearchParams(queryParams.toString());
    newParams.set("page", "1");
    navigate({ search: newParams.toString() }, { replace: true });
  };

  // Fetch inventory for rooms in a hotel
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

  // Combine hotels with their ratings
  const combineHotelsWithRatings = (hotels: any[], ratings: any) => {
    return hotels.map(hotel => {
      const hotelId = hotel.id;
      const hotelRatings = getRatingsForHotel(ratings, hotelId);
      const averageRating = calculateAverageRating(hotelRatings);

      return {
        ...hotel,
        ratings: {
          rating: averageRating,
          count: hotelRatings.length
        }
      };
    });
  };

  // Fetch hotel details with rooms in batches
  const fetchHotelBatch = async (hotelIds: string[], startIndex: number, endIndex: number) => {
    const batch = hotelIds.slice(startIndex, endIndex);
    const promises = batch.map(async (hotelId) => {
      try {
        const belongsToPayload = {
          id: hotelId,
          secondTable: "Room",
        };
        const hotelWithRoomsRes = await getMyAllHotelswithBelongsTo(belongsToPayload);
        const hotelWithRooms = hotelWithRoomsRes?.data || null;

        if (hotelWithRooms && Array.isArray(hotelWithRooms.data) && hotelWithRooms.data.length) {
          return hotelWithRooms.data[0];
        }
        return null;
      } catch (error) {
        console.error(`Error fetching hotel ${hotelId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter(hotel => hotel !== null);
  };

  // Fetch hotels data with progressive loading
  useEffect(() => {
    const fetchHotelsWithProgressiveLoading = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        setLoading(true);

        // Check cache first
        if (isCacheValid() && dataCache.ratings) {
          console.log("Using cached data");
          setMergedData(dataCache.hotels);
          setAllRatings(dataCache.ratings);
          setLoading(false);
          isFetchingRef.current = false;
          return;
        }

        // STEP 1: Fetch basic hotel list
        const hotelPayload = {
          data: { filter: "", status: "Approved" },
          page: 0,
          pageSize: 1000,
          order: [["createdAt", "ASC"]],
        };

        const hotelRes = await getAllHotels(hotelPayload);
        const hotelData = hotelRes?.data?.data?.rows || [];
        console.log("Total hotels from API:", hotelData.length);
        const hotelIds = hotelData.map((hotel: any) => hotel.id);

        setHotelIdList(hotelIds);

        // STEP 2: Fetch ratings in parallel
        const ratingsPromise = fetchAllRatings();

        // STEP 3: Fetch FIRST BATCH (current page hotels) immediately
        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;
        const firstBatchIds = hotelIds.slice(startIdx, endIdx);

        console.log(`Fetching first batch: ${firstBatchIds.length} hotels`);

        const [firstBatchHotels, ratingsData] = await Promise.all([
          fetchHotelBatch(firstBatchIds, 0, firstBatchIds.length),
          ratingsPromise
        ]);

        // Update loaded hotel IDs
        setLoadedHotelIds(new Set(firstBatchIds));

        // Combine first batch with ratings
        const firstBatchCombined = combineHotelsWithRatings(firstBatchHotels, ratingsData);

        // STEP 4: Fetch inventory for first batch hotels
        const checkinDate = queryParams.get("checkinDate") || dayjs().format('YYYY-MM-DD');
        const inventoryPromises = firstBatchCombined.map(async (hotel) => {
          const inventory = await fetchHotelInventory(hotel, checkinDate);
          return { hotelId: hotel.id, inventory };
        });

        const inventoryResults = await Promise.all(inventoryPromises);
        const inventoryMap = inventoryResults.reduce((acc, { hotelId, inventory }) => {
          acc[hotelId] = inventory;
          return acc;
        }, {} as {[key: string]: any});

        setInventoryData(inventoryMap);

        // STEP 5: Immediately show first batch
        setMergedData(firstBatchCombined);
        setAllRatings(ratingsData);
        setLoading(false);

        // Update cache
        dataCache.ratings = ratingsData;
        dataCache.hotels = [...firstBatchCombined];
        dataCache.lastFetched = Date.now();

        // STEP 6: Start background loading of ALL remaining hotels
        if (hotelIds.length > firstBatchIds.length) {
          setBackgroundLoading(true);

          const loadedIds = new Set(firstBatchIds);
          const remainingIds = hotelIds.filter((id: any) => !loadedIds.has(id));

          console.log(`Background loading: ${remainingIds.length} hotels (excluding ${firstBatchIds.length} already loaded)`);

          const totalBatches = Math.ceil(remainingIds.length / BATCH_SIZE);

          for (let i = 0; i < totalBatches; i++) {
            const batchStart = i * BATCH_SIZE;
            const batchEnd = batchStart + BATCH_SIZE;
            const batchIds = remainingIds.slice(batchStart, batchEnd);

            try {
              console.log(`Fetching background batch ${i + 1}/${totalBatches}: ${batchIds.length} hotels`);
              const batchHotels = await fetchHotelBatch(batchIds, 0, batchIds.length);

              if (batchHotels.length > 0) {
                // Combine with ratings
                const batchCombined = combineHotelsWithRatings(batchHotels, ratingsData);

                // Fetch inventory for batch hotels
                const batchInventoryPromises = batchCombined.map(async (hotel) => {
                  const inventory = await fetchHotelInventory(hotel, checkinDate);
                  return { hotelId: hotel.id, inventory };
                });

                const batchInventoryResults = await Promise.all(batchInventoryPromises);
                const batchInventoryMap = batchInventoryResults.reduce((acc, { hotelId, inventory }) => {
                  acc[hotelId] = inventory;
                  return acc;
                }, {} as {[key: string]: any});

                // Update inventory data
                setInventoryData(prev => ({
                  ...prev,
                  ...batchInventoryMap
                }));

                // Update merged data with new batch
                setMergedData(prev => [...prev, ...batchCombined]);

                console.log(`✅ Added ${batchCombined.length} hotels. `);

                // Update cache
                dataCache.hotels = [...dataCache.hotels, ...batchCombined];
                dataCache.lastFetched = Date.now();

                // Update loaded IDs
                setLoadedHotelIds(prev => {
                  const newSet = new Set(prev);
                  batchIds.forEach((id: any) => newSet.add(id));
                  return newSet;
                });
              } else {
                console.log(`⚠️ Batch ${i + 1} returned 0 hotels`);
              }

              // Small delay between batches
              if (i < totalBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            } catch (batchError) {
              console.error(`Error in batch ${i + 1}:`, batchError);
            }
          }

          setBackgroundLoading(false);
        }

      } catch (error) {
        console.error("Error fetching hotels with rooms:", error);
        setMergedData([]);
        setLoading(false);
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchHotelsWithProgressiveLoading();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [location.search]); // Run when search params change

  // Filter data based on search parameters
  useEffect(() => {
   const filterProperties = () => {
  const locationFilter = queryParams.get("location") || "";
  const bookingType = queryParams.get("bookingType");
  const bookingHours = queryParams.get("bookingHours") || "3";
  const sortByFilter = queryParams.get("sortBy");
  const maxBudget = Number(queryParams.get("maxBudget")) || 20000;
  const minBudget = Number(queryParams.get("minBudget")) || 100;
  const checkinDate = queryParams.get("checkinDate") || dayjs().format('YYYY-MM-DD');

  const nights = bookingType === "hourly" ? 1 : Math.max(1, Number(queryParams.get("nights")) || 1);

  const getLowestRate = (hotel: any) => {
    const roomInventory = inventoryData[hotel.id]?.[hotel.rooms?.[0]?.id] || [];
    const baseRate = getBaseRate(hotel, roomInventory, checkinDate, bookingType || "fullDay");
    if (!baseRate) return Infinity;

    const perUnitFinal = calculatePriceBreakdown(baseRate).finalPrice;
    const multiplier = nights;
    return perUnitFinal * multiplier;
  };

  // Debug: Check how many hotels have hourly stay type
  console.group('🔍 Hotel Stay Type Analysis');
  const hourlyHotels = mergedData.filter(hotel => hotel?.rooms?.[0]?.stayType === "Hourly");
  console.log(`Total hotels: ${mergedData.length}`);
  console.log(`Hotels with stayType="Hourly": ${hourlyHotels.length}`);
  console.log(`Hotels with stayType="Overnight": ${mergedData.filter(hotel => hotel?.rooms?.[0]?.stayType === "Overnight").length}`);
  console.log(`Hotels with no stayType: ${mergedData.filter(hotel => !hotel?.rooms?.[0]?.stayType).length}`);
  
  // Log all hourly hotels for debugging
  hourlyHotels.forEach((hotel, index) => {
    console.log(`${index + 1}. ${hotel.propertyName} - stayType: "${hotel?.rooms?.[0]?.stayType}"`);
  });
  console.groupEnd();

  // First, filter by booking type
  let filteredHotels = mergedData.filter((hotel: any) => {
    if (bookingType === "fullDay") {
      const isOvernightStay = hotel?.rooms?.[0]?.stayType === "Overnight";
      const isHotelType = hotel.propertyType === "Hotel";
      return isHotelType && isOvernightStay;
    }
    
    if (bookingType === "hourly") {
      // Show ONLY hotels with hourly stay type
      const hasHourlyStay = hotel?.rooms?.[0]?.stayType === "Hourly";
       console.log(hasHourlyStay)
      if (!hasHourlyStay) {
        console.log(`❌ Filtered out: ${hotel.propertyName} - stayType: "${hotel?.rooms?.[0]?.stayType}"`);
        return false;
      }

      // Check hotel availability
      const hotelRoomAvailable = hotel?.roomAvailable || "Available";
      if (hotelRoomAvailable === "Unavailable") {
        console.log(`⚠️ Sold out but showing: ${hotel.propertyName}`);
        return true; // Still show but as sold out
      }
      
      console.log(`✅ Showing hourly hotel: ${hotel.propertyName}`);
      return true;
    }
    
    if (bookingType === "villa") {
      return hotel.propertyType === "Villa";
    }
    
    return false;
  });

  console.log(`📊 After stay type filter: ${filteredHotels.length} hotels`);

  // Budget filter - but for sold out hotels, still show them
  filteredHotels = filteredHotels.filter((hotel: any) => {
    const price = getLowestRate(hotel);
    const hotelRoomAvailable = hotel?.roomAvailable || "Available";
    
    // For sold out hotels, still show them (they'll be marked as sold out)
    if (hotelRoomAvailable === "Unavailable") {
      return true;
    }
    
    // For available hotels, apply budget filter
    const isInBudget = price >= minBudget && price <= maxBudget && price !== Infinity;
    if (!isInBudget) {
      console.log(`💰 Filtered by budget: ${hotel.propertyName} - price: ${price}`);
    }
    return isInBudget;
  });

  console.log(`📊 After budget filter: ${filteredHotels.length} hotels`);

  // Add search relevance score for ALL hotels
  filteredHotels = filteredHotels.map((hotel: any) => {
    let relevanceScore = 0;
    let isExactMatch = false;
    
    if (locationFilter.trim() !== "") {
      const searchTerm = locationFilter.toLowerCase().trim();
      const searchText = (hotel.propertyName || hotel.address || hotel.city || "").toLowerCase();
      const filterWords = searchTerm.split(/[,\s]+/).map((word) => word.trim());

      // Calculate relevance score
      filterWords.forEach(word => {
        if (searchText.includes(word)) {
          relevanceScore += 5;
          
          // Exact match in property name gets highest priority
          if (hotel.propertyName?.toLowerCase().includes(word)) {
            relevanceScore += 20;
          }
          
          // Exact match in address gets medium priority
          if (hotel.address?.toLowerCase().includes(word)) {
            relevanceScore += 15;
          }
          
          // Check for exact matches
          if (searchText === word || 
              hotel.propertyName?.toLowerCase() === word ||
              hotel.address?.toLowerCase() === word) {
            relevanceScore += 30;
            isExactMatch = true;
          }
          
          // Check if word starts with search term
          if (hotel.propertyName?.toLowerCase().startsWith(word)) {
            relevanceScore += 25;
          }
          
          // Check if address starts with search term
          if (hotel.address?.toLowerCase().startsWith(word)) {
            relevanceScore += 20;
          }
        }
      });
      
      // Bonus for hotels that match the entire search phrase
      if (searchText.includes(searchTerm)) {
        relevanceScore += 40;
      }
      
      // Check if hotel name contains search term
      if (hotel.propertyName?.toLowerCase().includes(searchTerm)) {
        relevanceScore += 35;
      }
    }
    
    // Check hotel availability for sorting
    const hotelRoomAvailable = hotel?.roomAvailable || "Available";
    const isAvailable = hotelRoomAvailable !== "Unavailable";
    
    // Base score for all hotels
    const baseScore = 1;
    
    return {
      ...hotel,
      _relevanceScore: baseScore + relevanceScore,
      _isExactMatch: isExactMatch,
      _hasLocationMatch: relevanceScore > 0,
      _isAvailable: isAvailable,
    };
  });

  // Sorting logic - prioritize available hotels first, then exact matches
  filteredHotels.sort((a: any, b: any) => {
    // First, sort by availability (available hotels first)
    if (a._isAvailable && !b._isAvailable) return -1;
    if (b._isAvailable && !a._isAvailable) return 1;
    
    // Then by exact match
    if (a._isExactMatch && !b._isExactMatch) return -1;
    if (b._isExactMatch && !a._isExactMatch) return 1;
    
    // Then by location match
    if (a._hasLocationMatch && !b._hasLocationMatch) return -1;
    if (b._hasLocationMatch && !a._hasLocationMatch) return 1;
    
    // Then by relevance score (highest first)
    const relevanceDiff = (b._relevanceScore || 0) - (a._relevanceScore || 0);
    if (relevanceDiff !== 0) return relevanceDiff;

    // Then apply other sorting criteria
    if (sortByFilter === "rating") {
      return (Number(b?.ratings?.rating) || 0) - (Number(a?.ratings?.rating) || 0);
    } else if (sortByFilter === "lowToHigh") {
      return getLowestRate(a) - getLowestRate(b);
    } else if (sortByFilter === "highToLow") {
      return getLowestRate(b) - getLowestRate(a);
    } else if (sortByFilter === "popularity") {
      return (Number(b?.reviews) || 0) - (Number(a?.reviews) || 0);
    } else {
      // Default: relevance score then price
      return getLowestRate(a) - getLowestRate(b);
    }
  });

  // Prepare pricing data
  const roomsCount = Math.max(1, Number(queryParams.get("rooms")) || 1);
  const hotelsWithPrices = filteredHotels.map((hotel: any) => {
    const roomInventory = inventoryData[hotel.id]?.[hotel.rooms?.[0]?.id] || [];
    const baseRate = getBaseRate(hotel, roomInventory, checkinDate, bookingType || "fullDay");
    const breakdown = calculatePriceBreakdown(baseRate);
    const perRoomFinal = breakdown.finalPrice;
    const nights = bookingType === "hourly" ? 1 : Math.max(1, Number(queryParams.get("nights")) || 1);
    const multiplier = roomsCount * nights;

    return {
      ...hotel,
      _pricing: {
        perRoomFinal,
        perRoomBase: breakdown.basePrice,
        perRoomPlatform: breakdown.platformFee,
        perRoomGstTotal: breakdown.gstTotal,
        roomsCount,
        nights,
        totalFinal: +(perRoomFinal * multiplier),
        totalBase: +(breakdown.basePrice * multiplier),
        totalPlatform: +(breakdown.platformFee * multiplier),
        totalGst: +(breakdown.gstTotal * multiplier),
      },
    };
  });

  console.log(`📊 Final result: ${hotelsWithPrices.length} hourly hotels`);
  
  // Detailed breakdown
  const availableHotels = hotelsWithPrices.filter(h => h._isAvailable);
  const soldOutHotels = hotelsWithPrices.filter(h => !h._isAvailable);
  console.log(`✅ Available: ${availableHotels.length}`);
  console.log(`❌ Sold out: ${soldOutHotels.length}`);
  
  // Log all final hotels
  hotelsWithPrices.forEach((hotel, index) => {
    console.log(`${index + 1}. ${hotel.propertyName} - ${hotel._isAvailable ? 'Available' : 'Sold Out'} - stayType: "${hotel?.rooms?.[0]?.stayType}"`);
  });
  
  return hotelsWithPrices;
};

    if (!loading) {
      const filtered = filterProperties();
      setFilteredData(filtered);

      // Calculate pagination
      const totalItems = filtered.length;
      console.log(`Total items for pagination: ${totalItems}`);
      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
      setTotalPages(totalPages);

      // Get current page data
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginated = filtered.slice(startIndex, endIndex);
      setPaginatedData(paginated);
    }
  }, [loading, mergedData, location.search, currentPage, inventoryData]);

  // Handle page change with preloading
  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);

    // Update URL with page parameter
    const newParams = new URLSearchParams(queryParams.toString());
    newParams.set("page", value.toString());
    navigate({ search: newParams.toString() }, { replace: true });

    // Check if we need to fetch more data for this page
    const startIdx = (value - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;

    // Check if any hotel in this page range is not loaded
    const pageHotelIds = hotelIdList.slice(startIdx, endIdx);
    const missingIds = pageHotelIds.filter(id => !loadedHotelIds.has(id));

    if (missingIds.length > 0 && !backgroundLoading) {
      // Fetch missing hotels for this page
      (async () => {
        try {
          const missingHotels = await fetchHotelBatch(missingIds, 0, missingIds.length);

          if (missingHotels.length > 0 && allRatings) {
            const combined = combineHotelsWithRatings(missingHotels, allRatings);

            // Fetch inventory for missing hotels
            const checkinDate = queryParams.get("checkinDate") || dayjs().format('YYYY-MM-DD');
            const inventoryPromises = combined.map(async (hotel) => {
              const inventory = await fetchHotelInventory(hotel, checkinDate);
              return { hotelId: hotel.id, inventory };
            });

            const inventoryResults = await Promise.all(inventoryPromises);
            const inventoryMap = inventoryResults.reduce((acc, { hotelId, inventory }) => {
              acc[hotelId] = inventory;
              return acc;
            }, {} as {[key: string]: any});

            // Update inventory data
            setInventoryData(prev => ({
              ...prev,
              ...inventoryMap
            }));

            // Update merged data
            setMergedData(prev => {
              const existingIds = new Set(prev.map(h => h.id));
              const newHotels = combined.filter(h => !existingIds.has(h.id));
              return [...prev, ...newHotels];
            });

            // Update loaded IDs
            setLoadedHotelIds(prev => {
              const newSet = new Set(prev);
              missingIds.forEach(id => newSet.add(id));
              return newSet;
            });

            // Update cache
            dataCache.hotels = [...dataCache.hotels, ...combined];
            dataCache.lastFetched = Date.now();
          }
        } catch (error) {
          console.error("Error fetching missing hotels:", error);
        }
      })();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [hotelIdList, loadedHotelIds, backgroundLoading, allRatings, queryParams, navigate]);

  // Filter states
  const defaultBudget = [
    Number(queryParams.get("minBudget")) || 100,
    Number(queryParams.get("maxBudget")) || 20000,
  ];
  const defaultSelected = queryParams.get("bookingHours") || "3";
  const defaultSortBy = queryParams.get("sortBy") || "all";

  const [budget, setBudget] = useState<number[]>(defaultBudget);
  const [selected, setSelected] = useState<string | null>(defaultSelected);
  const [sortBy, setSortBy] = useState<string>(defaultSortBy);

  const updateQueryParams = (
    key: string,
    value: string | number | number[]
  ) => {
    const newParams = new URLSearchParams(location.search);
    if (Array.isArray(value)) {
      newParams.set("minBudget", String(value[0]));
      newParams.set("maxBudget", String(value[1]));
    } else {
      newParams.set(key, String(value));
    }
    newParams.set("page", "1");
    setCurrentPage(1);
    navigate({ search: newParams.toString() }, { replace: true });
  };

  useEffect(() => {
    const newParams = new URLSearchParams(location.search);
    let updated = false;

    if (!newParams.has("minBudget")) {
      newParams.set("minBudget", String(defaultBudget[0]));
      updated = true;
    }
    if (!newParams.has("maxBudget")) {
      newParams.set("maxBudget", String(defaultBudget[1]));
      updated = true;
    }
    if (!newParams.has("bookingHours")) {
      newParams.set("bookingHours", defaultSelected);
      updated = true;
    }
    if (!newParams.has("sortBy")) {
      newParams.set("sortBy", defaultSortBy);
      updated = true;
    }
    if (!newParams.has("page")) {
      newParams.set("page", "1");
      updated = true;
    }

    if (updated) {
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, []);

  const handleBudgetChange = (
    event: Event,
    newValue: number | number[],
    activeThumb: number
  ) => {
    if (Array.isArray(newValue)) {
      setBudget(newValue);
      updateQueryParams("minBudget", newValue[0]);
      updateQueryParams("maxBudget", newValue[1]);
    }
  };

  const handleBookingChange = (value: string) => {
    setSelected(value);
    updateQueryParams("bookingHours", value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateQueryParams("sortBy", value);
  };

  const sidebar = (
    <Box sx={{ position: "sticky", top: 20 }}>
      <Box sx={{ ...BoxStyle, mt: 3 }}>
        <Typography sx={{ ...style, mb: 5 }}>Budget</Typography>
        <Slider
          value={budget}
          onChange={handleBudgetChange}
          step={100}
          min={100}
          max={20000}
          sx={{
            color: color.secondColor,
            "& .MuiSlider-thumb": {
              backgroundColor: "white",
              border: `2px solid ${color.secondColor}`,
              width: 20,
              height: 20,
            },
            "& .MuiSlider-valueLabel": {
              backgroundColor: color.secondColor,
              color: "white",
              fontSize: "12px",
              borderRadius: "5px",
              padding: "2px 8px",
            },
            "& .MuiSlider-track": {
              height: 6,
            },
            "& .MuiSlider-rail": {
              height: 6,
              opacity: 0.3,
            },
          }}
          valueLabelFormat={(value) => `₹${value}`}
          valueLabelDisplay="on"
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: color.firstColor }}>
            ₹{budget[0]}
          </Typography>
          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: color.firstColor }}>
            ₹{budget[1]}
          </Typography>
        </Box>
      </Box>

      {queryParams.get("bookingType") === "hourly" && (
        <Box sx={{ ...BoxStyle }}>
          <Typography sx={{ ...style }}>Book For</Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              mt: 1,
            }}
          >
            {["3", "6", "12"].map((hour) => (
              <StyledToggleButton
                key={hour}
                value={hour}
                selected={selected === hour}
                onClick={() => handleBookingChange(hour)}
                sx={{
                  flex: 1,
                  minWidth: { xs: "30%", sm: "auto" },
                  py: 1,
                  fontSize: { xs: "11px", sm: "12px", md: "13px" },
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {hour} Hours
              </StyledToggleButton>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ ...BoxStyle }}>
        <Typography sx={{ ...style }}>Sort By</Typography>
        <RadioGroup
          sx={{ mt: 0 }}
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <StyledFormControlLabel
            value="all"
            control={<BpRadio />}
            label="All"
          />
          <StyledFormControlLabel
            value="lowToHigh"
            control={<BpRadio />}
            label="Price Low To High"
          />
          <StyledFormControlLabel
            value="highToLow"
            control={<BpRadio />}
            label="Price High To Low"
          />
          <StyledFormControlLabel
            value="popularity"
            control={<BpRadio />}
            label="Popularity"
          />
          <StyledFormControlLabel
            value="rating"
            control={<BpRadio />}
            label="Customer Rating"
          />
        </RadioGroup>
      </Box>

      {/* Apply Filters Button */}
      <Box sx={{ ...BoxStyle, mt: 3 }}>
        <CustomButton
          variant="contained"
          onClick={applyFilters}
          customStyles={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            fontWeight: 700,
            background: "linear-gradient(135deg, #4B2AAD, #6C4BD3)",
            boxShadow: "0 4px 12px rgba(75, 42, 173, 0.3)",
          }}
        >
          Apply Filters
        </CustomButton>
      </Box>

      {/* Background loading indicator */}
      {backgroundLoading && (
        <Box sx={{ ...BoxStyle, mt: 2 }}>
          <Typography sx={{ fontSize: "12px", color: "#666", textAlign: "center" }}>
            Loading more hotels in background...
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{
      background: color.thirdColor,
      p: { xs: 2, sm: 3, md: 4 },
      minHeight: "100vh",
    }}>
      <Helmet>
  <title>Search Hotels in Bhubaneswar | Huts4u</title>
  <meta
    name="description"
    content="Search and book hourly hotels in Bhubaneswar quickly. Find hotels near you for short stays, business trips, or leisure visits."
  />
  <link rel="canonical" href="https://www.huts4u.com/search" />
  <script type="application/ld+json">
    {`
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Search Hotels",
        "url": "https://www.huts4u.com/search"
      }
    `}
  </script>
</Helmet>

      <SearchSection />

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {isMobile ? (
          <Drawer
            anchor="left"
            open={open}
            onClose={() => setOpen(false)}
            sx={{
              "& .MuiDrawer-paper": {
                width: { xs: "100%", sm: "85%" },
                maxWidth: 400,
                height: "100%",
                overflowY: "auto",
              },
            }}
          >
            <Box sx={{ p: { xs: 2, sm: 3 }, height: "100%", overflowY: "auto" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  pb: 2,
                  borderBottom: "1px solid #eee",
                }}
              >
                <Typography variant="h5" sx={{  
                  background: "linear-gradient(135deg, #f3eee1, #e8e0cf)",
                  width: "fit-content",
                  borderRadius: "8px",
                  p: 1.5,
                  fontWeight: 700,
                  color: color.firstColor,
                  fontSize: { xs: "16px", md: "18px" },
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}>
                  Filter & Sort
                </Typography>
                <Cancel
                  onClick={() => setOpen(false)}
                  sx={{
                    fontSize: 28,
                    color: color.firstColor,
                    cursor: "pointer",
                    "&:hover": { opacity: 0.8 },
                  }}
                />
              </Box>
              {sidebar}
            </Box>
          </Drawer>
        ) : (
          <Grid item xs={12} md={3} lg={2.5}>
            {sidebar}
          </Grid>
        )}

        <Grid item xs={12} md={9} lg={9.5}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              mb: 3,
              flexWrap: "wrap",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            {loading ? (
              <Skeleton width={200} height={32} />
            ) : (
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "17px", sm: "18px", md: "20px" },
                    color: color.firstColor,
                    marginTop: "10px"
                  }}
                >
                  {filteredData.length} properties found
                  {backgroundLoading && " (loading more...)"}
                </Typography>
                {totalPages > 1 && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#666",
                      fontSize: { xs: "13px", md: "14px" },
                      mt: 0.5,
                    }}
                  >
                    Page {currentPage} of {totalPages}
                    {backgroundLoading && " • Background loading active"}
                  </Typography>
                )}
              </Box>
            )}
            {isMobile && (
              <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                <CustomButton
                  customStyles={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    borderRadius: "8px",
                    flex: 1,
                  }}
                  onClick={() => setOpen(true)}
                  variant="contained"
                  startIcon={<FilterAlt />}
                >
                  Filter & Sort
                </CustomButton>
                
              </Box>
            )}
          </Box>

          {/* Properties List */}
          {loading ? (
            [...Array(5)].map((_, index) => (
              <HotelCardSkeleton key={index} isMobile={isMobile} />
            ))
          ) : paginatedData.length > 0 ? (
            <>
              <Box sx={{ mb: 4 }}>
                {paginatedData.map((hotel) => {
                  const hotelId = hotel.id;
                  const hotelRatings = getRatingsForHotel(allRatings, hotelId);
                  const roomInventory = inventoryData[hotelId]?.[hotel.rooms?.[0]?.id] || [];
                  
                  return (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      queryParams={queryParams}
                      isMobile={isMobile}
                      hotelRatings={hotelRatings}
                      inventoryData={roomInventory}
                    />
                  );
                })}
              </Box>

              {/* Pagination - Fixed for mobile */}
              {totalPages > 1 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    mt: 4,
                    mb: 2,
                    flexDirection: { xs: "column", sm: "row" },
                    gap: { xs: 2, sm: 0 },
                  }}
                >
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? "medium" : isTablet ? "medium" : "large"}
                    showFirstButton={!isMobile}
                    showLastButton={!isMobile}
                    siblingCount={isMobile ? 1 : 2}
                    boundaryCount={isMobile ? 1 : 2}
                    renderItem={(item) => (
                      <PaginationItem
                        {...item}
                        sx={{
                          "&.Mui-selected": {
                            backgroundColor: color.firstColor,
                            color: color.thirdColor,
                            "&:hover": {
                              backgroundColor: color.secondColor,
                            },
                          },
                          "&.MuiPaginationItem-root": {
                            fontWeight: 600,
                            fontSize: { xs: "14px", md: "14px" },
                            minWidth: { xs: "36px", sm: "40px", md: "48px" },
                            height: { xs: "36px", sm: "40px", md: "48px" },
                          },
                        }}
                      />
                    )}
                  />
                  {!isMobile && (
                    <Typography
                      variant="body2"
                      sx={{
                        ml: 2,
                        color: "#666",
                        fontSize: "14px",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredData.length)}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} properties
                    </Typography>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Box sx={{
              textAlign: "center",
              py: 8,
              px: 2,
            }}>
              <Box
                sx={{
                  maxWidth: 400,
                  mx: "auto",
                  p: 4,
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #f8f9ff, #f0f2ff)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: color.firstColor,
                    mb: 2,
                    fontSize: { xs: "20px", md: "22px" },
                  }}
                >
                  No properties found
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#666",
                    mb: 3,
                    fontSize: { xs: "14px", md: "16px" },
                  }}
                >
                  Try adjusting your search criteria or filters
                </Typography>
                <CustomButton
                  variant="contained"
                  onClick={() => navigate("/")}
                  customStyles={{
                    background: "linear-gradient(135deg, #4B2AAD, #6C4BD3)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: 600,
                  }}
                >
                  Search Again
                </CustomButton>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

const style = {
  background: "linear-gradient(135deg, #f3eee1, #e8e0cf)",
  width: "fit-content",
  borderRadius: "8px",
  p: 1.5,
  m: -2,
  mx: -4,
  mb: 2,
  fontWeight: 700,
  color: color.firstColor,
  fontSize: { xs: "16px", md: "18px" },
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  borderRadius: "8px",
  textTransform: "none",
  fontSize: "13px",
  padding: "6px 12px",
  fontWeight: 600,
  border: "1px solid rgba(75, 42, 173, 0.3)",
  transition: "all 0.2s ease",
  "&.Mui-selected": {
    backgroundColor: color.secondColor,
    color: "white",
    borderColor: color.secondColor,
    boxShadow: "0 2px 8px rgba(75, 42, 173, 0.3)",
    "&:hover": {
      backgroundColor: color.firstColor,
    },
  },
  "&:hover": {
    backgroundColor: "rgba(75, 42, 173, 0.1)",
  },
}));

const StyledFormControlLabel = styled(FormControlLabel)({
  "& .MuiFormControlLabel-label": {
    fontSize: "14px",
    fontWeight: 600,
    color: "#333",
  },
});

export default SearchResults;