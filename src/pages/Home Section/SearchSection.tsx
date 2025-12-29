import {
  CalendarMonthRounded,
  HighlightOff,
  LocationOn,
  Schedule,
  Search,
} from "@mui/icons-material";
import {
  Box,
  styled,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import queryString from "query-string";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import color from "../../components/color";
import CustomButton from "../../components/CustomButton";
import CustomDatePicker from "../../components/CustomDatePicker";
import CustomTimePicker from "../../components/CustomTimePicker";
import LocationPicker from "../../components/LocationPicker";
import RoomGuestSelect from "../../components/RoomGuestSelect";

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  padding: "4px 10px",
  textTransform: "none",
  borderRadius: "6px",
  fontFamily: "CustomFontB",
  background: "rgba(163, 163, 163, 0.21)",
  boxShadow: "-4px -4px 10px rgba(0, 0, 0, 0.11) inset",
  fontSize: "inherit",
  "&.Mui-selected": {
    background: color.background,
    color: "white",
    "&:hover": {
      background: color.background,
    },
  },
}));

const ToggleBookingType = ({ bookingType, handleBookingType }: any) => (
  <ToggleButtonGroup
    value={bookingType}
    exclusive
    onChange={handleBookingType}
    sx={{
      mb: 2,
      background: color.thirdColor,
      p: 2,
      py: 1,
      borderRadius: "8px",
      border: "none",
      fontSize: { xs: "14px", md: "16px" },
    }}
  >
    <StyledToggleButton value="hourly">Hourly</StyledToggleButton>
    <StyledToggleButton value="fullDay">Full Day</StyledToggleButton>
    <StyledToggleButton value="villa">Villa</StyledToggleButton>
  </ToggleButtonGroup>
);

interface Location {
  display_name: string;
  lat: number;
  lon: number;
}

const SearchSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = queryString.parse(location.search);

  const [pickupLocation, setPickupLocation] = useState<Location | any>(null);

 const handlePickupSelect = (place: any) => {
  setPickupLocation({
    display_name: place.display_name,
    lat: place.lat,
    lon: place.lon,
    hotelId: place.hotelId, // Add hotelId if it's a hotel
  });
  
  // Also set the location value
  setLocationValue(place.display_name);
};

  const isMobile = useMediaQuery("(max-width: 900px)");

  // Initialize state from query params
  const [bookingType, setBookingType] = useState<string>(
    (queryParams.bookingType as string) || "hourly"
  );

  // Track if search should trigger automatically
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(false);

  // Use refs to track state without triggering re-renders
  const isSearchingRef = useRef(false);
  const prevSearchParamsRef = useRef("");
  const initialLoadRef = useRef(true);
  const bookingTypeChangedRef = useRef(false);
  const firstTypeChangeRef = useRef(true);

  const handleBookingType = (event: any, newType: any) => {
    if (newType !== null && newType !== bookingType) {
      bookingTypeChangedRef.current = true;
      setBookingType(newType);
      setAutoSearchEnabled(true);
      firstTypeChangeRef.current = false;
    }
  };

  const [locationValue, setLocationValue] = useState<string | null>(
    (queryParams.location as string) ?? null
  );

  const [checkinDate, setCheckinDate] = useState<Dayjs | null>(
    queryParams.checkinDate ? dayjs(queryParams.checkinDate as string) : dayjs()
  );
  const [checkOutDate, setCheckOutDate] = useState<Dayjs | null>(
    queryParams.checkOutDate ? dayjs(queryParams.checkOutDate as string) : dayjs().add(1, 'day')
  );
  
  // Initialize time from query params or current time (round to next hour)
  const [time, setTime] = useState<Dayjs | null>(() => {
    if (queryParams.time) {
      return dayjs(`2024-01-01T${queryParams.time as string}`);
    }
    
    const now = dayjs();
    const currentHour = now.hour();
    const currentMinute = now.minute();
    
    // If minutes > 0, set to next hour
    if (currentMinute > 0) {
      return now.add(1, 'hour').startOf('hour');
    }
    
    // If minutes === 0, return current hour
    return now.startOf('hour');
  });

  const [roomDetails, setRoomDetails] = useState({
    rooms: Number(queryParams.rooms) || 1,
    adults: Number(queryParams.adults) || 2,
    children: Number(queryParams.children) || 0,
  });

  const handleRoomDetailsChange = useCallback((
    key: keyof typeof roomDetails,
    value: number
  ) => {
    setRoomDetails((prev) => ({ ...prev, [key]: value }));
    setAutoSearchEnabled(true);
  }, []);

  // 🧮 Number of nights based on dates & bookingType
  const getNumberOfNights = useCallback(() => {
    if (bookingType === "hourly") return 1;
    if (!checkinDate || !checkOutDate) return 1;

    const start = checkinDate.startOf("day");
    const end = checkOutDate.startOf("day");
    const diff = end.diff(start, "day");

    return diff > 0 ? diff : 1;
  }, [bookingType, checkinDate, checkOutDate]);

  // ---------- Auto-extend checkout for full-day bookings ----------
  useEffect(() => {
    if (bookingType === "hourly") return;
    if (!checkinDate) return;

    if (
      !checkOutDate ||
      checkOutDate.startOf("day").isSame(checkinDate.startOf("day")) ||
      checkOutDate.startOf("day").isBefore(checkinDate.startOf("day"))
    ) {
      const newCheckout = checkinDate.add(1, "day");
      setCheckOutDate(newCheckout);
    }
  }, [checkinDate, bookingType, checkOutDate]);

  // ---------- Handle TimePicker changes (round to nearest hour) ----------
  const handleTimeChange = useCallback((newTime: Dayjs | null) => {
    if (!newTime) {
      setTime(null);
      setAutoSearchEnabled(true);
      return;
    }
    
    // Round to next hour for any minute > 0
    const minute = newTime.minute();
    let roundedTime = newTime;
    
    if (minute > 0) {
      roundedTime = newTime.add(1, 'hour').startOf('hour');
    } else {
      roundedTime = newTime.startOf('hour');
    }
    
    setTime(roundedTime);
    setAutoSearchEnabled(true);
  }, []);

  // ---------- Function to perform search ----------
  const handleSearch = useCallback(() => {
    if (isSearchingRef.current) {
      return;
    }

    isSearchingRef.current = true;

    const nights = getNumberOfNights();

    const searchData: any = {
      bookingType,
      location: locationValue,
      rooms: roomDetails.rooms,
      adults: roomDetails.adults,
      children: roomDetails.children,
      nights: bookingType === "hourly" ? 1 : nights,
    };

    // Add time only for hourly bookings
    if (bookingType === "hourly" && time) {
      searchData.time = time.format("HH:mm");
      searchData.bookingHours = "3";
    }

    // Add dates
    if (checkinDate) {
      searchData.checkinDate = checkinDate.format("YYYY-MM-DD");
    }

    // Add checkout date only for non-hourly bookings
    if (bookingType !== "hourly" && checkOutDate) {
      searchData.checkOutDate = checkOutDate.format("YYYY-MM-DD");
    }

    const queryParams = new URLSearchParams();

    Object.entries(searchData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();

    // Check if search params have actually changed
    if (queryString === prevSearchParamsRef.current && !bookingTypeChangedRef.current) {
      isSearchingRef.current = false;
      return;
    }

    prevSearchParamsRef.current = queryString;
    bookingTypeChangedRef.current = false;

    navigate(`/search?${queryString}`);
    setShowDetails(false);

    setTimeout(() => {
      isSearchingRef.current = false;
    }, 300);
  }, [bookingType, locationValue, checkinDate, checkOutDate, time, roomDetails, getNumberOfNights, navigate]);

  // ---------- Effect to trigger search when booking type changes ----------
  useEffect(() => {
    if (initialLoadRef.current) {
      // Trigger auto-search on first load if we have required fields
      if (location.pathname !== "/" && locationValue) {
        // Check for hourly booking requirements
        if (bookingType === "hourly" && !time) {
          // Set default time if not set
          const now = dayjs();
          const currentHour = now.hour();
          const currentMinute = now.minute();
          let defaultTime = now.startOf('hour');
          
          if (currentMinute > 0) {
            defaultTime = now.add(1, 'hour').startOf('hour');
          }
          
          setTime(defaultTime);
          setAutoSearchEnabled(true);
        } else {
          // Trigger search immediately on first load
          const searchTimeout = setTimeout(() => {
            if (isSearchingRef.current) return;
            handleSearch();
          }, 100);
          
          return () => clearTimeout(searchTimeout);
        }
      }
      initialLoadRef.current = false;
      return;
    }

    // Don't search on homepage
    if (location.pathname === "/") return;

    // If booking type changed and auto-search is enabled, trigger search
    if (autoSearchEnabled && bookingTypeChangedRef.current) {
      // Small delay to ensure all state updates are processed
      const searchTimeout = setTimeout(() => {
        if (isSearchingRef.current) {
          return;
        }
        
        // Check required fields
        if (!locationValue) {
          return;
        }
        
        // For hourly booking, check if time is available
        if (bookingType === "hourly" && !time) {
          // Set default time
          const now = dayjs();
          const currentHour = now.hour();
          const currentMinute = now.minute();
          let defaultTime = now.startOf('hour');
          
          if (currentMinute > 0) {
            defaultTime = now.add(1, 'hour').startOf('hour');
          }
          
          setTime(defaultTime);
          return;
        }
        
        handleSearch();
      }, 100);
      
      return () => clearTimeout(searchTimeout);
    }
  }, [bookingType, autoSearchEnabled, locationValue, time, handleSearch, location.pathname]);

  // ---------- Effect to auto-search when other fields change ----------
  useEffect(() => {
    // Skip on initial load
    if (initialLoadRef.current) return;

    // Don't auto-search if we're on homepage
    if (location.pathname === "/") return;

    // Only auto-search if auto-search is enabled
    if (!autoSearchEnabled) {
      return;
    }

    // If booking type just changed, skip this effect (handled above)
    if (bookingTypeChangedRef.current) return;

    // Check for required fields
    if (!locationValue) {
      return;
    }

    // Additional check for hourly booking
    if (bookingType === "hourly" && !time) {
      return;
    }

    // Prevent rapid searches
    const searchTimeout = setTimeout(() => {
      if (isSearchingRef.current) return;
      handleSearch();
    }, 300);

    return () => {
      clearTimeout(searchTimeout);
    };
  }, [autoSearchEnabled, bookingType, locationValue, checkinDate, checkOutDate, time, roomDetails, handleSearch, location.pathname]);

  const PageLocation = useLocation();
  const [showDetails, setShowDetails] = useState(false);

  // Handle date changes with auto-search
  const handleDateChange = useCallback((date: Dayjs | null, isCheckin = true) => {
    if (isCheckin) {
      setCheckinDate(date);
    } else {
      setCheckOutDate(date);
    }
    setAutoSearchEnabled(true);
  }, []);

  // Handle location change with auto-search
  const handleLocationChange = useCallback((value: string | null) => {
    setLocationValue(value);
    setAutoSearchEnabled(true);
  }, []);

  // Reset autoSearchEnabled when location changes
  useEffect(() => {
    setAutoSearchEnabled(false);
    initialLoadRef.current = true;
    bookingTypeChangedRef.current = false;
  }, [location.pathname]);

  return (
    <div>
      <Box
        sx={{
          p: 1,
          pt: 3.5,
          background: color.background,
          borderRadius: 3,
          textAlign: "center",
          position: "relative",
          mt: { xs: PageLocation.pathname !== "/" ? 3 : 1, md: 1 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            position: "absolute",
            top: { xs: -35, md: -35 },
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <ToggleBookingType
            bookingType={bookingType}
            handleBookingType={handleBookingType}
          />
        </Box>

        {!showDetails && PageLocation.pathname !== "/" && (
          <Box
            onClick={() => setShowDetails(true)}
            sx={{
              display: { md: "none", xs: "flex" },
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-around",
              mb: 0.5,
              mt: -1,
            }}
          >
            <Typography sx={{ ...typoStyle, width: "100%" }}>
              <LocationOn /> {locationValue || "Select Location"}
            </Typography>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                width: "100%",
              }}
            >
              <Typography sx={typoStyle}>
                <CalendarMonthRounded />{" "}
                {checkinDate ? checkinDate.format("YYYY-MM-DD") : "Select Date"}
              </Typography>

              {bookingType === "hourly" ? (
                <Typography sx={typoStyle}>
                  <Schedule /> {time ? time.format("HH:mm") : "Select Time"}
                </Typography>
              ) : (
                <Typography sx={typoStyle}>
                  <CalendarMonthRounded />{" "}
                  {checkOutDate ? checkOutDate.format("YYYY-MM-DD") : "Select Date"}
                </Typography>
              )}
            </div>
          </Box>
        )}

        {(PageLocation.pathname === "/" || showDetails || !isMobile) && (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-around",
                mb: 2,
                px: 2,
                gap: 1,
              }}
            >
              <LocationPicker
                label="City, Property name or Location"
                onSelect={handlePickupSelect}
                value={locationValue ?? pickupLocation?.display_name}
                setValue={handleLocationChange}
              />

              <CustomDatePicker
                date={checkinDate}
                setDate={(date) => handleDateChange(date, true)}
                label="Checkin Date"
              />

              {bookingType === "hourly" ? (
                <CustomTimePicker
                  time={time}
                  setTime={handleTimeChange}
                  label="Checkin Time"
                />
              ) : (
                <CustomDatePicker
                  date={checkOutDate}
                  setDate={(date) => handleDateChange(date, false)}
                  label="Checkout Date"
                />
              )}

              <RoomGuestSelect
                label="Room & Guests"
                rooms={roomDetails.rooms}
                adults={roomDetails.adults}
                children={roomDetails.children}
                setRooms={(value) => handleRoomDetailsChange("rooms", value)}
                setAdults={(value) => handleRoomDetailsChange("adults", value)}
                setChildren={(value) =>
                  handleRoomDetailsChange("children", value)
                }
              />

              {/* Debug info and search button */}
              <div>
                {PageLocation.pathname !== "/" && (
                  <>
                    <CustomButton
                      customStyles={{
                        background: color.thirdColor,
                        padding: "10px",
                      }}
                      onClick={handleSearch}
                      variant="contained"
                      disabled={!locationValue || (bookingType === "hourly" && !time)}
                    >
                      <Search sx={{ color: color.firstColor, fontSize: "28px" }} />
                    </CustomButton>
                  </>
                )}
              </div>
            </Box>

            {PageLocation.pathname !== "/" && (
              <HighlightOff
                onClick={() => setShowDetails(false)}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  color: "white",
                  display: { md: "none", xs: "flex", fontWeight: "bold" },
                }}
              />
            )}
          </>
        )}
      </Box>

      {PageLocation.pathname === "/" && (
        <div style={{ width: "100%", display: "flex", marginTop: "20px" }}>
          <CustomButton
            customStyles={{ margin: "auto" }}
            onClick={handleSearch}
            startIcon={<Search />}
            variant="contained"
            disabled={!locationValue || (bookingType === "hourly" && !time)}
          >
            Search Huts4u
          </CustomButton>
        </div>
      )}
    </div>
  );
};

export default SearchSection;

const typoStyle = {
  borderRadius: "52px",
  boxShadow: "4px 4px 10px rgba(104, 39, 184, 0.17)",
  color: color.firstColor,
  background: color.thirdColor,
  fontSize: { xs: "12px", md: "14px" },
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  p: 1,
  px: 2,
  m: 1,
};