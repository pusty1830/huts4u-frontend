import {
  CalendarMonth,
  CurrencyRupeeRounded,
  StarRateRounded,
  TrendingDown,
  TrendingUp,
  Menu as MenuIcon,
  DashboardRounded,
  Refresh
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Typography,
  Button,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  CssBaseline,
  ListItemButton,
  CircularProgress
} from "@mui/material";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import color from "../../components/color";
import BookingTable from "./BookingTable";
import { useEffect, useState } from "react";
import {
  getAllHotels,
  getAllMyBookings,
  getAllRatings,
  getAllHotelRevenue,
  updateBookings,
  updateRooms,
  getAllMyRevenue,
} from "../../services/services";
import { getUserId } from "../../services/axiosClient";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const CARD_HEIGHT = 140;
const drawerWidth = 240;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  // chart placeholder / data from revenue
  const [chartData, setChartData] = useState<any[]>([
    { name: "Dec 27", revenue: 0 },
    { name: "Jan 28", revenue: 0 },
    { name: "Feb 28", revenue: 0 },
  ]);

  // state
  const [hotels, setHotels] = useState<Array<{ id: string; name: string }>>([]);
  const [hotelBookings, setHotelBookings] = useState<Record<string, any[]>>({});
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");

  const [newBookingsCount, setNewBookingsCount] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });

  // ratings
  const [ratingHotelId, setRatingHotelId] = useState<string>("");
  const [ratingsMap, setRatingsMap] = useState<
    Record<string, { avg: number; count: number }>
  >({});
  const [ratingsListMap, setRatingsListMap] = useState<Record<string, any[]>>(
    {}
  );

  // revenue
  const [revenueMap, setRevenueMap] = useState<Record<string, { total: number }>>(
    {}
  );

  // fetch hotels + bookings + metrics
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        await fetchHotels();
        await Promise.all([
          fetchAllBookings(),
          fetchAllRevenue(),
          fetchAllRatings(),
          fetchChartData(),
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const fetchHotels = async () => {
    const payLoad = {
      data: { filter: "", userId: getUserId() },
      page: 0,
      pageSize: 100,
      order: [["createdAt", "ASC"]],
    };

    try {
      const res = await getAllHotels(payLoad);
      if (res?.data?.data?.rows) {
        const hotelData = res.data.data.rows.map((hotel: any) => ({
          id: hotel.id,
          name: hotel.propertyName ?? hotel.name ?? `Hotel ${hotel.id}`,
        }));
        setHotels(hotelData);
        if (hotelData.length > 0) {
          const firstHotelId = hotelData[0].id;
          setSelectedHotelId(firstHotelId);
          setRatingHotelId(firstHotelId);
        }
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
  };

  // Fetch all bookings across all hotels
  const fetchAllBookings = async () => {
    try {
      const payload = {
        data: { filter: "" },
        page: 0,
        pageSize: 1000,
        order: [["createdAt", "DESC"]],
      };
      const res = await getAllMyBookings(payload);
      const bookings = res?.data?.data?.rows || [];
      
      // Group bookings by hotelId
      const bookingsByHotel: Record<string, any[]> = {};
      bookings.forEach((booking: any) => {
        const hotelId = booking.hotelId;
        if (!bookingsByHotel[hotelId]) {
          bookingsByHotel[hotelId] = [];
        }
        bookingsByHotel[hotelId].push(booking);
      });
      setHotelBookings(bookingsByHotel);
      
      // Calculate new bookings (pending/upcoming bookings)
      const pendingBookings = bookings.filter((booking: any) => {
        const status = String(booking.status || "").toLowerCase();
        return status === "pending" || status === "confirmed" || status === "upcoming";
      });
      setNewBookingsCount(pendingBookings.length);
      
    } catch (error) {
      console.error("Error fetching all bookings:", error);
    }
  };

  // Fetch all revenue across all hotels
  const fetchAllRevenue = async () => {
    setLoadingRevenue(true);
    try {
      const payload = {
        data: { filter: "" },
        page: 0,
        pageSize: 1000,
        order: [["createdAt", "DESC"]],
      };
      
      const res = await getAllMyRevenue(payload);
      const revenueData = res?.data?.data?.rows || [];
      console.log("Raw revenue data:", revenueData);
      
      // Calculate total revenue
      let totalRev = 0;
      const revenueByHotel: Record<string, { total: number }> = {};
      
      revenueData.forEach((item: any) => {
        // Parse amount - check different possible fields
        let amount = 0;
        
        // Try different field names for amount
        if (item.netAmountPaise) {
          amount = parseFloat(item.netAmountPaise) / 100; // Convert paise to rupees
        } else if (item.amount) {
          amount = parseFloat(item.amount);
        } else if (item.totalAmount) {
          amount = parseFloat(item.totalAmount);
        } else if (item.revenue) {
          amount = parseFloat(item.revenue);
        }
        
        // Skip if amount is 0 or negative
        if (amount <= 0) return;
        
        // Get hotelId from different possible fields
        const hotelId = item.hotelId || item.propertyId || item.hotel?.id || selectedHotelId;
        
        if (hotelId) {
          if (!revenueByHotel[hotelId]) {
            revenueByHotel[hotelId] = { total: 0 };
          }
          revenueByHotel[hotelId].total += amount;
        }
        
        totalRev += amount;
      });
      
      console.log("Processed revenue:", {
        totalRevenue: totalRev,
        revenueByHotel,
        dataCount: revenueData.length
      });
      
      setRevenueMap(revenueByHotel);
      setTotalRevenue(totalRev);
      
    } catch (error) {
      console.error("Error fetching revenue:", error);
    } finally {
      setLoadingRevenue(false);
    }
  };

  // Fetch all ratings across all hotels
  const fetchAllRatings = async () => {
    try {
      const payload = {
        data: { filter: "", userId: getUserId() },
        page: 0,
        pageSize: 1000,
        order: [["createdAt", "DESC"]],
      };
      const res = await getAllRatings(payload);
      const ratings = res?.data?.data?.rows || [];
      
      // Group ratings by hotelId
      const ratingsByHotel: Record<string, any[]> = {};
      const avgByHotel: Record<string, { avg: number; count: number }> = {};
      
      ratings.forEach((rating: any) => {
        const hotelId = rating.hotelId || rating.propertyId;
        
        if (!hotelId) return;
        
        // Add to list
        if (!ratingsByHotel[hotelId]) {
          ratingsByHotel[hotelId] = [];
        }
        ratingsByHotel[hotelId].push(rating);
      });
      
      // Calculate averages for each hotel
      Object.keys(ratingsByHotel).forEach(hotelId => {
        const hotelRatings = ratingsByHotel[hotelId];
        const count = hotelRatings.length;
        let sum = 0;
        
        hotelRatings.forEach((rating: any) => {
          sum += parseFloat(rating.rating || 0);
        });
        
        const avg = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;
        avgByHotel[hotelId] = { avg, count };
      });
      
      // Calculate overall average
      const allRatings = ratings.map((r: any) => parseFloat(r.rating || 0)).filter((r:any) => !isNaN(r));
      const totalCount = allRatings.length;
      const totalSum = allRatings.reduce((sum: number, rating: number) => sum + rating, 0);
      const overallAvg = totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(1)) : 0;
      
      setRatingsMap(avgByHotel);
      setRatingsListMap(ratingsByHotel);
      setTotalRatings({ avg: overallAvg, count: totalCount });
      
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  // Fetch chart data (last 7 days)
  const fetchChartData = async () => {
    try {
      const payload = {
        data: { filter: "", userId: getUserId() },
        page: 0,
        pageSize: 1000,
        order: [["createdAt", "DESC"]],
      };
      const res = await getAllMyRevenue(payload);
      const revenueData = res?.data?.data?.rows || [];
      
      // Generate last 7 days
      const last7Days: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day');
        last7Days.push({
          name: date.format('DD MMM'),
          date: date.format('YYYY-MM-DD'),
          revenue: 0
        });
      }
      
      // Sum revenue for each day
      revenueData.forEach((item: any) => {
        let amount = 0;
        
        // Parse amount
        if (item.netAmountPaise) {
          amount = parseFloat(item.netAmountPaise) / 100;
        } else if (item.amount) {
          amount = parseFloat(item.amount);
        } else if (item.totalAmount) {
          amount = parseFloat(item.totalAmount);
        }
        
        if (amount <= 0) return;
        
        const createdAt = item.createdAt || item.date;
        if (createdAt) {
          const itemDate = dayjs(createdAt).format('YYYY-MM-DD');
          const dayData = last7Days.find(d => d.date === itemDate);
          
          if (dayData) {
            dayData.revenue += amount;
          }
        }
      });
      
      // Format for chart (ensure revenue is not negative)
      const chartDataFormatted = last7Days.map(day => ({
        name: day.name,
        revenue: Math.max(0, Math.round(day.revenue))
      }));
      
      setChartData(chartDataFormatted);
      
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  // Refetch data when hotel changes
  useEffect(() => {
    if (selectedHotelId) {
      fetchRevenueForHotel(selectedHotelId);
      if (!ratingsMap[selectedHotelId]) fetchRatingsForHotel(selectedHotelId);
    }
  }, [selectedHotelId]);

  const fetchRatingsForHotel = async (hotelId: string) => {
    if (!hotelId) return;
    try {
      const payload = {
        data: { filter: "", hotelId },
        page: 0,
        pageSize: 1000,
        order: [["createdAt", "DESC"]],
      };
      const res = await getAllRatings(payload);
      const rows = res?.data?.data?.rows || [];
      const count = rows.length;
      let avg = 0;
      if (count > 0) {
        const sum = rows.reduce((s: number, r: any) => {
          const val = Number(r.rating ?? r.score ?? 0);
          return s + (isNaN(val) ? 0 : val);
        }, 0);
        avg = +(sum / count).toFixed(2);
      }
      setRatingsMap((m) => ({ ...m, [hotelId]: { avg, count } }));
      setRatingsListMap((m) => ({ ...m, [hotelId]: rows }));
    } catch (err) {
      console.error(`Error fetching ratings for hotel ${hotelId}:`, err);
      setRatingsMap((m) => ({ ...m, [hotelId]: { avg: 0, count: 0 } }));
      setRatingsListMap((m) => ({ ...m, [hotelId]: [] }));
    }
  };

  const fetchRevenueForHotel = async (hotelId: string) => {
    if (!hotelId) return;
    try {
      const payload = {
        data: { filter: "", hotelId },
        page: 0,
        pageSize: 1000,
        order: [["createdAt", "ASC"]],
      };
      const res = await getAllHotelRevenue(payload);
      const rows = res?.data?.data?.rows ?? [];
      
      let total = 0;
      const chart: any[] = [];
      
      if (Array.isArray(rows) && rows.length > 0) {
        rows.forEach((r: any, idx: number) => {
          let amount = 0;
          
          if (r.netAmountPaise) {
            amount = parseFloat(r.netAmountPaise) / 100;
          } else if (r.amount) {
            amount = parseFloat(r.amount);
          } else if (r.totalAmount) {
            amount = parseFloat(r.totalAmount);
          }
          
          if (amount <= 0) return;
          
          total += amount;
          const name = r.createdAt
            ? dayjs(r.createdAt).format("DD MMM")
            : `Rec ${idx + 1}`;
          chart.push({ name, revenue: amount });
        });
      }
      
      console.log(`Revenue for hotel ${hotelId}:`, { total, chart });
      setRevenueMap((m) => ({ ...m, [hotelId]: { total } }));
      if (chart.length) {
        setChartData(chart.slice(-7)); // Show last 7 entries
      }
    } catch (err) {
      console.error(`Error fetching revenue for hotel ${hotelId}:`, err);
    }
  };

  // simple formatter for INR
  const formatINR = (val: number) =>
    val.toLocaleString("en-IN", { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    });

  // NAV handlers: always navigate to dedicated pages
  const goToBookings = () => {
    navigate(`/booking`);
  };
  const goToReviews = () => {
    navigate(`/review`);
  };
  const goToPayments = () => {
    navigate(`/hotel-payment`);
  };

  // handlers for select changes
  const handleHotelChange = (event: any) => setSelectedHotelId(event.target.value);
  const handleRatingHotelChange = (event: any) => {
    const id = event.target.value;
    setRatingHotelId(id);
    fetchRatingsForHotel(id);
  };

  // clickable metric card props
  const metrics = [
    {
      key: "newBookings",
      title: "New Bookings",
      value: newBookingsCount,
      icon: <CalendarMonth />,
      change: "8.70%",
      onClick: goToBookings,
      hoverText: "Go to Bookings",
    },
    {
      key: "guestRatings",
      title: "Guest ratings",
      value: totalRatings.count > 0 ? `${totalRatings.avg}/5` : "—/5",
      icon: <StarRateRounded />,
      change: "-3.56%",
      onClick: goToReviews,
      hoverText: "Go to Reviews",
    },
    {
      key: "revenue",
      title: "Total Revenue",
      value: totalRevenue > 0 ? formatINR(totalRevenue) : "₹0",
      icon: <CurrencyRupeeRounded />,
      change: "5.70%",
      onClick: goToPayments,
      hoverText: "Go to Payments",
      isLoading: loadingRevenue,
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Refresh all data
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAllBookings(),
        fetchAllRevenue(),
        fetchAllRatings(),
        fetchChartData(),
      ]);
      if (selectedHotelId) {
        await Promise.all([
          fetchRevenueForHotel(selectedHotelId),
          fetchRatingsForHotel(selectedHotelId),
        ]);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debug info component
  const DebugInfo = () => (
    <Box sx={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: 1, 
      borderRadius: 1,
      fontSize: '10px',
      zIndex: 1000 
    }}>
      <div>Total Revenue: {totalRevenue}</div>
      <div>Hotels: {hotels.length}</div>
      <div>Selected Hotel: {selectedHotelId}</div>
    </Box>
  );

  // Mobile drawer content
  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" sx={{ color: color.firstColor }}>
          Hotel Dashboard
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {["Dashboard", "Bookings", "Reviews", "Payments"].map((text) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {text === "Dashboard" ? (
                  <DashboardRounded />
                ) : text === "Bookings" ? (
                  <CalendarMonth />
                ) : text === "Reviews" ? (
                  <StarRateRounded />
                ) : text === "Payments" ? (
                  <CurrencyRupeeRounded />
                ) : null}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: color.thirdColor 
      }}>
        <CircularProgress sx={{ color: color.firstColor }} />
        <Typography sx={{ ml: 2, color: color.firstColor }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: color.thirdColor }}>
      <CssBaseline />
      {/* <DebugInfo /> */}

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        {/* Mobile App Bar */}
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            display: { xs: 'block', sm: 'none' },
            backgroundColor: color.thirdColor,
            boxShadow: 'none',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: color.firstColor }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ color: color.firstColor }}>
              Hotel Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Main Content Padding for Mobile AppBar */}
        <Box sx={{ mt: { xs: 7, sm: 0 } }}>
          {/* Header + Hotel select */}
          <Box
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            mb={2}
            gap={2}
          >
            <Typography
              variant="h5"
              sx={{
                color: color.firstColor,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}
            >
              Hotel Dashboard
            </Typography>
            <Box
              display="flex"
              gap={2}
              alignItems="center"
              flexDirection={{ xs: 'column', sm: 'row' }}
              width={{ xs: '100%', sm: 'auto' }}
            >
              <FormControl sx={{ minWidth: { xs: '100%', sm: 200, md: 300 } }} size={isMobile ? "small" : "medium"}>
                <Select
                  value={selectedHotelId ?? ""}
                  onChange={handleHotelChange}
                  displayEmpty
                  fullWidth
                >
                  {hotels.map((h) => (
                    <MenuItem key={h.id} value={h.id}>
                      <Typography noWrap sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                        {h.name}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={handleRefresh}
                startIcon={<Refresh />}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </Box>
          </Box>

          {/* Metrics Cards */}
          <Grid container spacing={2} mb={3}>
            {metrics.map((item) => (
              <Grid key={item.key} item xs={12} sm={6} md={4}>
                <Card
                  onClick={item.onClick}
                  sx={{
                    background: color.thirdColor,
                    boxShadow: "0px 0px 14px rgba(0, 0, 0, 0.14)",
                    borderRadius: "12px",
                    minHeight: { xs: 120, sm: CARD_HEIGHT },
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "transform 0.15s ease",
                    "&:hover": { transform: "translateY(-4px)" },
                  }}
                >
                  <CardContent sx={{ width: "100%", p: { xs: 1.5, sm: 2 } }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        color="#7c7c7c"
                        fontSize={{ xs: "12px", sm: "14px" }}
                        noWrap
                      >
                        {item.title}
                      </Typography>
                      <IconButton
                        sx={{
                          background: color.firstColor,
                          color: "white",
                          borderRadius: "8px",
                          width: { xs: 30, sm: 36 },
                          height: { xs: 30, sm: 36 },
                        }}
                        size="small"
                      >
                        {item.key === "revenue" ? (
                          loadingRevenue ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <CurrencyRupeeRounded sx={{ fontSize: { xs: 18, sm: 24 } }} />
                          )
                        ) : item.key === "guestRatings" ? (
                          <StarRateRounded sx={{ fontSize: { xs: 18, sm: 24 } }} />
                        ) : (
                          <CalendarMonth sx={{ fontSize: { xs: 18, sm: 24 } }} />
                        )}
                      </IconButton>
                    </Box>

                    <Box
                      display="flex"
                      gap={2}
                      mt={1}
                      flexDirection={{ xs: 'column', sm: 'row' }}
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                    >
                      {item.key === "guestRatings" ? (
                        <FormControl
                          size={isMobile ? "small" : "medium"}
                          sx={{
                            minWidth: { xs: '100%', sm: 160 },
                            width: { xs: '100%', sm: 'auto' }
                          }}
                        >
                          <Select
                            size={isMobile ? "small" : "medium"}
                            value={ratingHotelId}
                            onChange={handleRatingHotelChange}
                            onClick={(e) => e.stopPropagation()}
                            fullWidth
                          >
                            {hotels.map((h) => (
                              <MenuItem key={h.id} value={h.id}>
                                <Typography noWrap sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                                  {h.name}
                                </Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : null}

                      <Typography
                        variant={isMobile ? "h6" : "h5"}
                        fontWeight={600}
                        textAlign={{ xs: 'center', sm: 'left' }}
                      >
                        {item.isLoading ? (
                          <CircularProgress size={24} />
                        ) : (
                          item.value
                        )}
                      </Typography>
                    </Box>

                    <Typography
                      mt={2}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      sx={{
                        color: item.change.includes("-") ? "red" : "green",
                        width: "fit-content",
                        px: 2,
                        borderRadius: "4px",
                        border: "solid 1px",
                        fontSize: { xs: "12px", sm: "14px" },
                        flexWrap: 'wrap'
                      }}
                    >
                      {item.change.includes("-") ? (
                        <TrendingDown sx={{ fontSize: { xs: 16, sm: 20 } }} />
                      ) : (
                        <TrendingUp sx={{ fontSize: { xs: 16, sm: 20 } }} />
                      )}{" "}
                      {item.change} from last week
                    </Typography>

                    <Typography
                      mt={1}
                      color="#7c7c7c"
                      fontSize={{ xs: "10px", sm: "12px" }}
                    >
                      <em>{item.hoverText}</em>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Charts */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background: color.firstColor,
                  color: "white",
                  borderRadius: 2,
                  p: { xs: 1, sm: 2 },
                  height: { xs: 280, sm: 300 },
                }}
              >
                <CardContent sx={{ p: 0, height: "100%" }}>
                  <Box
                    display="flex"
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    mb={2}
                    gap={1}
                  >
                    <Typography
                      fontWeight="bold"
                      variant="h6"
                      fontSize={{ xs: '1rem', sm: '1.25rem' }}
                    >
                      Revenue Overview
                    </Typography>
                    <Typography
                      variant="h6"
                      fontSize={{ xs: '0.9rem', sm: '1.1rem' }}
                    >
                      Total: {formatINR(totalRevenue)}
                    </Typography>
                  </Box>
                  <Box sx={{ height: { xs: "200px", sm: "220px" } }}>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                          <XAxis
                            dataKey="name"
                            stroke="white"
                            style={{ fontSize: isMobile ? 9 : 10 }}
                          />
                          <YAxis 
                            stroke="white" 
                            style={{ fontSize: isMobile ? 9 : 10 }}
                            tickFormatter={(value) => `₹${value}`}
                          />
                          <Tooltip
                            formatter={(value) => [`₹${value}`, 'Revenue']}
                            contentStyle={{
                              backgroundColor: color.firstColor,
                              border: "solid 1.5px white",
                              borderRadius: 4,
                              color: "white",
                              fontSize: isMobile ? 12 : 14,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#ffffff"
                            strokeWidth={isMobile ? 2 : 3}
                            dot={{ r: isMobile ? 4 : 6, stroke: color.firstColor, strokeWidth: 2 }}
                            activeDot={{ r: isMobile ? 6 : 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center' 
                      }}>
                        <Typography>No revenue data available</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background: color.firstColor,
                  color: "white",
                  borderRadius: 2,
                  p: { xs: 1, sm: 2 },
                  height: { xs: 280, sm: 300 },
                }}
              >
                <CardContent sx={{ p: 0, height: "100%" }}>
                  <Box
                    display="flex"
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    mb={2}
                    gap={1}
                  >
                    <Typography
                      fontWeight="bold"
                      variant="h6"
                      fontSize={{ xs: '1rem', sm: '1.25rem' }}
                    >
                      Booking Trends
                    </Typography>
                    <Typography
                      variant="h6"
                      fontSize={{ xs: '0.9rem', sm: '1.1rem' }}
                    >
                      New: {newBookingsCount}
                    </Typography>
                  </Box>
                  <Box sx={{ height: { xs: "200px", sm: "220px" } }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                        <XAxis
                          dataKey="name"
                          stroke="white"
                          style={{ fontSize: isMobile ? 9 : 10 }}
                        />
                        <YAxis 
                          stroke="white" 
                          style={{ fontSize: isMobile ? 9 : 10 }}
                          tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                          formatter={(value) => [`₹${value}`, 'Revenue']}
                          contentStyle={{
                            backgroundColor: color.firstColor,
                            border: "solid 1.5px white",
                            borderRadius: 4,
                            color: "white",
                            fontSize: isMobile ? 12 : 14,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#ffffff"
                          strokeWidth={isMobile ? 2 : 3}
                          dot={{ r: isMobile ? 4 : 6, stroke: color.firstColor, strokeWidth: 2 }}
                          activeDot={{ r: isMobile ? 6 : 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Reviews section */}
          <Box mb={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box
                  display="flex"
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  mb={1}
                  gap={1}
                >
                  <Typography
                    fontWeight="bold"
                    variant="h6"
                    fontSize={{ xs: '1.1rem', sm: '1.25rem' }}
                  >
                    Guest Reviews
                  </Typography>
                  <Box
                    display="flex"
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    gap={{ xs: 0.5, sm: 2 }}
                  >
                    <Typography color="textSecondary" noWrap>
                      {hotels.find((h) => h.id === selectedHotelId)?.name ?? "—"}
                    </Typography>
                    <Typography color="textSecondary" noWrap>
                      {ratingsMap[selectedHotelId]
                        ? `${ratingsMap[selectedHotelId].count} reviews • ${ratingsMap[selectedHotelId].avg}/5`
                        : "No reviews"}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {!ratingsListMap[selectedHotelId] ||
                  ratingsListMap[selectedHotelId].length === 0 ? (
                  <Typography color="textSecondary" textAlign="center">
                    No reviews for this hotel.
                  </Typography>
                ) : (
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    {ratingsListMap[selectedHotelId].slice(0, isMobile ? 3 : 5).map((r: any) => (
                      <Box
                        key={r.id}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: 1,
                          background: color.thirdColor
                        }}
                      >
                        <Box
                          display="flex"
                          flexDirection={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          gap={1}
                        >
                          <Box
                            display="flex"
                            gap={{ xs: 1, sm: 2 }}
                            alignItems="center"
                            width={{ xs: '100%', sm: 'auto' }}
                          >
                            <Avatar
                              src={r.userAvatar || undefined}
                              sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}
                            />
                            <Box flex={1}>
                              <Typography
                                fontWeight={700}
                                fontSize={{ xs: '14px', sm: '16px' }}
                              >
                                {r.userName ?? r.userId ?? "Guest"}
                              </Typography>
                              <Typography
                                fontSize={{ xs: "11px", sm: "12px" }}
                                color="textSecondary"
                              >
                                {r.comment
                                  ? r.comment.length > (isMobile ? 80 : 120)
                                    ? r.comment.substring(0, isMobile ? 80 : 120) + "..."
                                    : r.comment
                                  : "No comment"}
                              </Typography>
                            </Box>
                          </Box>
                          <Box
                            textAlign={{ xs: 'left', sm: 'right' }}
                            width={{ xs: '100%', sm: 'auto' }}
                          >
                            <Typography
                              fontWeight={700}
                              fontSize={{ xs: '14px', sm: '16px' }}
                            >
                              {Number(r.rating ?? 0).toFixed(1)} / 5
                            </Typography>
                            <Typography
                              fontSize={{ xs: "10px", sm: "12px" }}
                              color="textSecondary"
                            >
                              {r.createdAt
                                ? dayjs(r.createdAt).format(
                                  isMobile ? "DD MMM, hh:mm A" : "DD MMM YYYY, hh:mm A"
                                )
                                : "-"}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                    {ratingsListMap[selectedHotelId].length > (isMobile ? 3 : 5) && (
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={goToReviews}
                        sx={{ mt: 1 }}
                      >
                        View All Reviews ({ratingsListMap[selectedHotelId].length})
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;