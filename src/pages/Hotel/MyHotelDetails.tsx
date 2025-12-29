/* eslint-disable jsx-a11y/img-redundant-alt */
import {
  AddCircleOutline,
  CheckCircle,
  Edit,
  Star,
  ExpandMore,
  ExpandLess,
  Hotel,
  Bathtub,
  Wifi,
  AcUnit,
  LocalParking,
  Restaurant,
  FitnessCenter,
  Pool,
  Spa,
  BusinessCenter,
  RoomService,
  Tv,
  Kitchen,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
  Grid,
  List,
  styled,
  Tab,
  Tabs,
  ToggleButton,
  Typography,
  useMediaQuery,
  Avatar,
  AvatarGroup,
  Rating,
  IconButton,
  Fade,
  Grow,
  Zoom,
  Slide,
  Divider,
  Paper,
  alpha,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import color from "../../components/color";
import CustomButton from "../../components/CustomButton";
import { amenityIcons } from "../../components/data";
import { BoxStyle, ImageGrid, RoomAmenities } from "../../components/style";
import theme from "../../theme";
import { getAllBookingsofMyHotel, getMyAllHotelswithBelongsTo } from "../../services/services";
import BookingTable from "./BookingTable";

// Extended amenity icons mapping with more options
const extendedAmenityIcons: Record<string, React.ReactElement> = {
  ...amenityIcons,
  "Free WiFi": <Wifi />,
  "Swimming Pool": <Pool />,
  "Spa": <Spa />,
  "Gym": <FitnessCenter />,
  "Parking": <LocalParking />,
  "Restaurant": <Restaurant />,
  "Business Center": <BusinessCenter />,
  "Room Service": <RoomService />,
  "TV": <Tv />,
  "Kitchen": <Kitchen />,
  "Air Conditioning": <AcUnit />,
  "Bathroom": <Bathtub />,
  "Hotel": <Hotel />,
};

const MyHotelDetails = () => {
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));
  const { id } = useParams();

  const [booking, setBooking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const today = new Date();
    const next10Days = new Date();
    next10Days.setDate(today.getDate() + 10);

    getAllBookingsofMyHotel({
      data: { filter: "" },
      page: 0,
      pageSize: 50,
      order: [["createdAt", "ASC"]],
    }).then((res) => {
      const allBookings = res?.data?.data?.rows || [];

      const filteredBookings = allBookings.filter((booking: any) => {
        const checkInDate = new Date(booking.checkInDate);
        const isCurrentHotel = booking.hotelId === id;
        const isWithinDateRange = checkInDate >= today && checkInDate <= next10Days;
        return isCurrentHotel && isWithinDateRange;
      });

      setBooking(filteredBookings);
    }).catch(err => {
      console.error("Error fetching bookings:", err);
    });
  }, [id]);

  const [expanded, setExpanded] = useState(false);
  const [expandedAmenities, setExpandedAmenities] = useState(false);
  const maxLength = isMobile ? 100 : 200;

  const [value, setValue] = useState(0);

  const navigate = useNavigate();
  const [hotelData, setHotelData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    getMyAllHotelswithBelongsTo({
      id: id,
      secondTable: 'Room'
    }).then((res) => {
      const hotel = res?.data?.data?.[0];
      setHotelData(hotel);
      
      const rooms = hotel?.rooms || [];
      setRoomData(rooms);
      
      if (rooms.length > 0) {
        setSelectedRoom(rooms[0]);
      }
      
      // Simulate image loading
      setTimeout(() => setImagesLoaded(true), 500);
    }).catch((err) => {
      console.error("Error fetching hotel data:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  const handleRoomSelect = (room: any) => {
    setSelectedRoom(room);
    // Smooth scroll to selected room on mobile
    if (isMobile) {
      const element = document.getElementById(`room-${room.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${color.thirdColor} 0%, ${alpha(color.thirdColor, 0.9)} 100%)`,
        p: 3,
      }}>
        <Box sx={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          border: `4px solid ${alpha(color.firstColor, 0.2)}`,
          borderTopColor: color.firstColor,
          animation: 'spin 1s linear infinite',
          mb: 2,
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          }
        }} />
        <Typography variant="h6" color={color.firstColor} sx={{ fontWeight: 600 }}>
          Loading Hotel Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please wait while we fetch the information...
        </Typography>
      </Box>
    );
  }

  if (!hotelData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: color.thirdColor,
        p: 3,
      }}>
        <Hotel sx={{ fontSize: 80, color: color.paperColor, mb: 2, opacity: 0.5 }} />
        <Typography variant="h5" color={color.firstColor} sx={{ fontWeight: 600, mb: 1 }}>
          Hotel Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          The hotel you're looking for doesn't exist or has been removed.
        </Typography>
        <CustomButton
          variant="contained"
          onClick={() => navigate(-1)}
          sx={{ borderRadius: '12px', px: 4 }}
        >
          Go Back
        </CustomButton>
      </Box>
    );
  }

  const allAmenities = roomData.reduce((acc: string[], room: any) => {
    room?.amenities?.forEach((amenity: string) => {
      if (!acc.includes(amenity)) acc.push(amenity);
    });
    return acc;
  }, []);

  const displayedAmenities = expandedAmenities ? allAmenities : allAmenities.slice(0, 8);

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${color.thirdColor} 0%, ${alpha(color.thirdColor, 0.95)} 100%)`,
        minHeight: "100vh",
        pb: 6,
      }}
    >
      {/* Hero Section with Gradient Overlay */}
      <Box
        sx={{
          position: "relative",
          background: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3)), url('${hotelData.propertyImages?.[0] || "/assets/hotel-default.jpg"}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: isMobile ? "scroll" : "fixed",
          minHeight: { xs: "50vh", md: "60vh" },
          display: "flex",
          alignItems: "flex-end",
          color: "white",
          px: { xs: 2, md: 6 },
          pb: { xs: 4, md: 6 },
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Fade in={imagesLoaded} timeout={1000}>
            <Box>
              <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 2,
              }}>
                <Box sx={{ maxWidth: { xs: "100%", md: "70%" } }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: { xs: "28px", sm: "36px", md: "48px" },
                      fontWeight: 800,
                      lineHeight: 1.2,
                      mb: 1,
                      textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    {hotelData?.propertyName}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: "14px", md: "16px" },
                      opacity: 0.9,
                      mb: 2,
                      fontFamily: "CustomFontSB",
                      maxWidth: { xs: "100%", md: "80%" },
                    }}
                  >
                    {hotelData?.address}
                  </Typography>
                  
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      background: alpha(color.firstColor, 0.9),
                      px: 2,
                      py: 0.5,
                      borderRadius: "20px",
                      backdropFilter: "blur(10px)",
                    }}>
                      <Star sx={{ color: "#FFD700", fontSize: { xs: 16, md: 20 } }} />
                      <Typography sx={{ ml: 1, fontSize: { xs: "12px", md: "14px" }, fontWeight: 600 }}>
                        4.7 ★ (134 reviews)
                      </Typography>
                    </Box>
                    
                    <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
                      <Avatar src="/assets/avatar1.jpg" />
                      <Avatar src="/assets/avatar2.jpg" />
                      <Avatar src="/assets/avatar3.jpg" />
                      <Avatar src="/assets/avatar4.jpg" />
                    </AvatarGroup>
                  </Box>
                </Box>

                <Slide direction="left" in={imagesLoaded} timeout={800}>
                  <Box sx={{ 
                    display: "flex", 
                    gap: 2,
                    flexDirection: { xs: "row", md: "column" },
                    width: { xs: "100%", md: "auto" },
                    mt: { xs: 2, md: 0 },
                  }}>
                    <CustomButton
                      variant="contained"
                      startIcon={<Edit />}
                      onClick={() => navigate("/property-registration", { state: id })}
                      sx={{
                        borderRadius: "12px",
                        px: 3,
                        py: 1.5,
                        background: `linear-gradient(135deg, ${color.firstColor} 0%, ${alpha(color.firstColor, 0.8)} 100%)`,
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                        '&:hover': {
                          background: `linear-gradient(135deg, ${color.firstColor} 0%, ${color.background} 100%)`,
                          transform: "translateY(-2px)",
                          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
                        },
                        transition: "all 0.3s ease",
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Edit Hotel
                    </CustomButton>
                    
                    <CustomButton
                      variant="outlined"
                      sx={{
                        borderRadius: "12px",
                        px: 3,
                        py: 1.5,
                        borderColor: "white",
                        color: "white",
                        '&:hover': {
                          borderColor: color.firstColor,
                          background: alpha(color.firstColor, 0.1),
                        },
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Share Property
                    </CustomButton>
                  </Box>
                </Slide>
              </Box>
            </Box>
          </Fade>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 6 }, mt: { xs: -4, md: -6 }, position: "relative", zIndex: 1 }}>
        {/* Image Grid */}
        <Grow in={imagesLoaded} timeout={1200}>
          <Paper
            elevation={6}
            sx={{
              borderRadius: "20px",
              overflow: "hidden",
              mb: 4,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
            }}
          >
            <ImageGrid propertyImages={hotelData.propertyImages || []} />
          </Paper>
        </Grow>

        {/* Property Details Card */}
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            <Paper
              elevation={2}
              sx={{
                borderRadius: "16px",
                p: { xs: 3, md: 4 },
                background: "white",
                mb: 3,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: color.firstColor,
                  mb: 3,
                  fontSize: { xs: "1.5rem", md: "1.75rem" },
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Hotel sx={{ fontSize: "inherit" }} />
                Property Overview
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.8,
                  color: "text.secondary",
                  mb: 3,
                }}
              >
                {expanded || hotelData?.propertyDesc?.length <= maxLength
                  ? hotelData?.propertyDesc
                  : `${hotelData?.propertyDesc?.substring(0, maxLength)}...`}
                {hotelData?.propertyDesc?.length > maxLength && (
                  <Button
                    onClick={() => setExpanded(!expanded)}
                    endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                    sx={{
                      ml: 1,
                      color: color.firstColor,
                      fontWeight: 600,
                      textTransform: 'none',
                    }}
                  >
                    {expanded ? "Read Less" : "Read More"}
                  </Button>
                )}
              </Typography>

              <Divider sx={{ my: 4 }} />

              {/* Hotel Features */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: color.firstColor }}>
                Hotel Features
              </Typography>
              <Grid container spacing={2}>
                {['coupleFriendly', 'petFriendly', 'familyFriendly', 'businessFriendly'].map((feature) => (
                  <Grid item xs={6} sm={3} key={feature}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: "12px",
                        background: alpha(color.firstColor, 0.05),
                        textAlign: "center",
                        transition: "all 0.3s ease",
                        '&:hover': {
                          background: alpha(color.firstColor, 0.1),
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: color.firstColor }}>
                        {feature.replace('Friendly', ' Friendly')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {hotelData[feature] === "yes" ? "✅ Available" : "❌ Not Available"}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Tabs Section */}
            <Paper
              elevation={2}
              sx={{
                borderRadius: "16px",
                overflow: "hidden",
                mb: 3,
              }}
            >
              <Tabs
                value={value}
                onChange={(e, newValue) => setValue(newValue)}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons="auto"
                sx={{
                  background: alpha(color.firstColor, 0.05),
                  px: 2,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    py: 2,
                    minWidth: { xs: 'auto', md: 120 },
                    '&.Mui-selected': {
                      color: color.firstColor,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: color.firstColor,
                    height: 3,
                  },
                }}
              >
                <Tab label="Rooms & Suites" />
                <Tab label="Amenities" />
                <Tab label="Policies" />
              </Tabs>

              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <TabPanel value={value} index={0}>
                  <Grid container spacing={3}>
                    {roomData.map((room, index) => (
                      <Grid item xs={12} key={room.id}>
                        <Grow in={imagesLoaded} timeout={500 + index * 100}>
                          <Card
                            id={`room-${room.id}`}
                            onClick={() => handleRoomSelect(room)}
                            elevation={selectedRoom?.id === room.id ? 8 : 2}
                            sx={{
                              borderRadius: "16px",
                              overflow: "hidden",
                              border: `3px solid ${selectedRoom?.id === room.id ? color.firstColor : 'transparent'}`,
                              cursor: "pointer",
                              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              '&:hover': {
                                transform: "translateY(-8px)",
                                boxShadow: `0 20px 40px ${alpha(color.firstColor, 0.2)}`,
                              },
                            }}
                          >
                            <Grid container>
                              <Grid item xs={12} md={4}>
                                <Box sx={{ position: "relative", height: "100%", minHeight: 200 }}>
                                  <CardMedia
                                    component="img"
                                    image={room?.roomImages || "/assets/default-room.jpg"}
                                    alt={room?.roomCategory}
                                    sx={{
                                      height: "100%",
                                      width: "100%",
                                      objectFit: "cover",
                                      transition: "transform 0.5s ease",
                                      '&:hover': {
                                        transform: "scale(1.05)",
                                      },
                                    }}
                                  />
                                  {selectedRoom?.id === room.id && (
                                    <Box
                                      sx={{
                                        position: "absolute",
                                        top: 16,
                                        right: 16,
                                        background: color.firstColor,
                                        color: "white",
                                        borderRadius: "50%",
                                        width: 40,
                                        height: 40,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                      }}
                                    >
                                      <CheckCircle />
                                    </Box>
                                  )}
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} md={8}>
                                <Box sx={{ p: { xs: 2, md: 3 }, height: "100%" }}>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                    <Box>
                                      <Typography variant="h6" sx={{ fontWeight: 700, color: color.firstColor, mb: 0.5 }}>
                                        {room.roomCategory || "Standard Room"}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {room.roomSize ? `${room.roomSize} sqft` : "Size not specified"}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label="Available"
                                      color="success"
                                      size="small"
                                      sx={{ fontWeight: 600 }}
                                    />
                                  </Box>

                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                                    Comfortable and spacious room with modern amenities for a perfect stay.
                                  </Typography>

                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: color.firstColor }}>
                                      Key Features:
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                      {room.amenities?.slice(0, 4).map((amenity: string, idx: number) => (
                                        <Chip
                                          key={idx}
                                          label={amenity}
                                          size="small"
                                          sx={{
                                            background: alpha(color.firstColor, 0.1),
                                            color: color.firstColor,
                                            fontWeight: 500,
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>

                                  <Divider sx={{ my: 2 }} />

                                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
                                    {room.rateFor1Night && (
                                      <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="caption" color="text.secondary">
                                          Per Night
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: color.firstColor, fontWeight: 700 }}>
                                          ₹{room.rateFor1Night}
                                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                            /night
                                          </Typography>
                                        </Typography>
                                      </Box>
                                    )}
                                    
                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", ml: "auto" }}>
                                      {room.rateFor3Hour && (
                                        <StyledToggleButton value="3 hrs" selected>
                                          <Box sx={{ textAlign: "center" }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                                              3 hrs
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                              ₹{room.rateFor3Hour}
                                            </Typography>
                                          </Box>
                                        </StyledToggleButton>
                                      )}
                                      
                                      {room.rateFor6Hour && (
                                        <StyledToggleButton value="6 hrs">
                                          <Box sx={{ textAlign: "center" }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                                              6 hrs
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                              ₹{room.rateFor6Hour}
                                            </Typography>
                                          </Box>
                                        </StyledToggleButton>
                                      )}
                                      
                                      {room.rateFor12Hour && (
                                        <StyledToggleButton value="12 hrs">
                                          <Box sx={{ textAlign: "center" }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                                              12 hrs
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                              ₹{room.rateFor12Hour}
                                            </Typography>
                                          </Box>
                                        </StyledToggleButton>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>
                          </Card>
                        </Grow>
                      </Grid>
                    ))}
                  </Grid>
                </TabPanel>

                <TabPanel value={value} index={1}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: color.firstColor }}>
                      All Amenities
                    </Typography>
                    <Grid container spacing={2}>
                      {displayedAmenities.map((amenity: string, index: number) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Zoom in={imagesLoaded} timeout={500 + index * 50}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: "12px",
                                textAlign: "center",
                                background: alpha(color.firstColor, 0.05),
                                transition: "all 0.3s ease",
                                '&:hover': {
                                  background: alpha(color.firstColor, 0.1),
                                  transform: "translateY(-4px)",
                                },
                              }}
                            >
                              <Box sx={{ 
                                color: color.firstColor,
                                mb: 1,
                                fontSize: { xs: "1.5rem", md: "2rem" },
                              }}>
                                {extendedAmenityIcons[amenity] || <AddCircleOutline />}
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {amenity}
                              </Typography>
                            </Paper>
                          </Zoom>
                        </Grid>
                      ))}
                    </Grid>
                    
                    {allAmenities.length > 8 && (
                      <Box sx={{ textAlign: "center", mt: 3 }}>
                        <Button
                          onClick={() => setExpandedAmenities(!expandedAmenities)}
                          endIcon={expandedAmenities ? <ExpandLess /> : <ExpandMore />}
                          sx={{
                            color: color.firstColor,
                            fontWeight: 600,
                          }}
                        >
                          {expandedAmenities ? "Show Less Amenities" : `Show All ${allAmenities.length} Amenities`}
                        </Button>
                      </Box>
                    )}
                  </Box>
                </TabPanel>

                <TabPanel value={value} index={2}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: color.firstColor }}>
                      Hotel Policies
                    </Typography>
                    <Paper elevation={0} sx={{ p: 3, background: alpha(color.firstColor, 0.05), borderRadius: "12px" }}>
                      <Typography>
                        {hotelData?.propertyPolicy || "Standard hotel policies apply. Please contact reception for specific queries."}
                      </Typography>
                    </Paper>
                    
                    <Typography variant="h6" sx={{ fontWeight: 600, mt: 4, mb: 2, color: color.firstColor }}>
                      Additional Services
                    </Typography>
                    <Paper elevation={0} sx={{ p: 3, background: alpha(color.firstColor, 0.05), borderRadius: "12px" }}>
                      <Typography>
                        {hotelData?.extraService || "24/7 room service, laundry, concierge, and airport transfer available."}
                      </Typography>
                    </Paper>
                  </Box>
                </TabPanel>
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <StickyContainer>
              {/* Quick Stats */}
              <Paper
                elevation={2}
                sx={{
                  borderRadius: "16px",
                  p: 3,
                  mb: 3,
                  background: `linear-gradient(135deg, ${color.firstColor} 0%, ${color.background} 100%)`,
                  color: "white",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <Star />
                  Property Stats
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {roomData.length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Room Types
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        4.7
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Guest Rating
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        24/7
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Support
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        100%
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Satisfaction
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Selected Room Details */}
              {selectedRoom && (
                <Paper
                  elevation={2}
                  sx={{
                    borderRadius: "16px",
                    p: 3,
                    mb: 3,
                    border: `2px solid ${alpha(color.firstColor, 0.2)}`,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: color.firstColor }}>
                    Selected Room
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {selectedRoom.roomCategory}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRoom.roomSize} sqft
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: color.firstColor }}>
                    Room Rates
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {selectedRoom.rateFor1Night && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2">Per Night</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{selectedRoom.rateFor1Night}</Typography>
                      </Box>
                    )}
                    {selectedRoom.rateFor3Hour && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2">3 Hours</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{selectedRoom.rateFor3Hour}</Typography>
                      </Box>
                    )}
                    {selectedRoom.rateFor6Hour && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2">6 Hours</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{selectedRoom.rateFor6Hour}</Typography>
                      </Box>
                    )}
                    {selectedRoom.rateFor12Hour && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2">12 Hours</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{selectedRoom.rateFor12Hour}</Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <CustomButton
                      fullWidth
                      variant="contained"
                      sx={{
                        borderRadius: "12px",
                        py: 1.5,
                        background: `linear-gradient(135deg, ${color.firstColor} 0%, ${color.background} 100%)`,
                        '&:hover': {
                          transform: "translateY(-2px)",
                          boxShadow: `0 8px 25px ${alpha(color.firstColor, 0.4)}`,
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Book This Room
                    </CustomButton>
                  </Box>
                </Paper>
              )}

              {/* Contact Info */}
              <Paper
                elevation={2}
                sx={{
                  borderRadius: "16px",
                  p: 3,
                  background: alpha(color.firstColor, 0.05),
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: color.firstColor }}>
                  Contact Information
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                      Reception
                    </Typography>
                    <Typography variant="body2">{hotelData.receptionMobile}</Typography>
                    <Typography variant="body2">{hotelData.receptionEmail}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                      Owner
                    </Typography>
                    <Typography variant="body2">{hotelData.ownerMobile}</Typography>
                    <Typography variant="body2">{hotelData.ownerEmail}</Typography>
                  </Box>
                </Box>
              </Paper>
            </StickyContainer>
          </Grid>
        </Grid>

        {/* Booking Table */}
        <Paper
          elevation={2}
          sx={{
            borderRadius: "16px",
            overflow: "hidden",
            mt: 4,
          }}
        >
          <Box sx={{ p: 3, background: alpha(color.firstColor, 0.05) }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: color.firstColor, mb: 2 }}>
              Upcoming Bookings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bookings for the next 10 days
            </Typography>
          </Box>
          <BookingTable bookings={booking} hotelId={id} />
        </Paper>
      </Box>
    </Box>
  );
};

export default MyHotelDetails;

// Styled Components
const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  borderRadius: "10px",
  textTransform: "none",
  fontWeight: 600,
  border: `2px solid ${alpha(color.firstColor, 0.2)}`,
  padding: "8px 12px",
  minWidth: "70px",
  transition: "all 0.3s ease",
  '&.Mui-selected': {
    background: color.firstColor,
    color: "white",
    borderColor: color.firstColor,
    boxShadow: `0 4px 12px ${alpha(color.firstColor, 0.3)}`,
    '&:hover': {
      background: color.background,
    },
  },
  '&:hover': {
    borderColor: color.firstColor,
    transform: "translateY(-2px)",
  },
  [theme.breakpoints.up('md')]: {
    minWidth: "80px",
    padding: "10px 16px",
  },
}));

const StickyContainer = styled(Box)(({ theme }) => ({
  position: "sticky",
  top: 20,
  [theme.breakpoints.down('lg')]: {
    position: "static",
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
      <Fade in={value === index} timeout={500}>
        <Box>{children}</Box>
      </Fade>
    </div>
  );
};