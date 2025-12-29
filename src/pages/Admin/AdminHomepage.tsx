import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, IconButton, Box, Card, CardContent,
  Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, Button, TextField, MenuItem, Chip,
  Grid, Avatar, InputAdornment, Pagination, Stack,
  useTheme, useMediaQuery, Tabs, Tab, Badge,
  CardHeader, Divider, Tooltip, LinearProgress,
  Collapse, IconButton as MuiIconButton
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Hotel as HotelIcon,
  BookOnline as BookingIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  LocationCity as CityIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Bed as BedIcon,
  MeetingRoom as RoomIcon,
  ExpandMore as ExpandMoreIcon,
  KingBed as KingBedIcon,
  SingleBed as SingleBedIcon,
  Bathtub as BathroomIcon,
  People as PeopleIcon,
  SquareFoot as AreaIcon
} from "@mui/icons-material";
import { deleteHotel, getAllBookingsofMyHotel, getAllHotels, getAllRooms } from "../../services/services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

// Theme colors
const statusColors: Record<string, string> = {
  "checkedIn": "#4caf50",
  "checkedOut": "#f44336",
  "Cancel": "#9e9e9e",
  "pending": "#ff9800",
  "Approved": "#4caf50",
  "Reject": "#f44336",
  "Pending": "#ff9800",
  "ACTIVE": "#2196f3",
  "available": "#4caf50",
  "occupied": "#f44336",
  "maintenance": "#ff9800"
};

const stayTypeColors: Record<string, string> = {
  "single": "#2196f3",
  "double": "#4caf50",
  "triple": "#9c27b0",
  "family": "#ff9800",
  "suite": "#795548",
  "deluxe": "#607d8b",
  "executive": "#3f51b5"
};

const AdminHomepage: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [expandedHotelIds, setExpandedHotelIds] = useState<number[]>([]);

  // Filters
  const [bookingFilters, setBookingFilters] = useState({
    search: "",
    status: "",
    checkInFrom: "",
    checkInTo: ""
  });

  const [hotelFilters, setHotelFilters] = useState({
    search: "",
    city: "",
    status: "",
    category: ""
  });

  // Pagination states
  const [bookingPage, setBookingPage] = useState<number>(1);
  const [hotelPage, setHotelPage] = useState<number>(1);
  const [rowsPerPage] = useState<number>(10);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<"booking" | "hotel" | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const payLoad = {
          data: { filter: "" },
          page: 0,
          pageSize: 5000,
          order: [["createdAt", "DESC"]]
        };

        const [bookingsRes, hotelsRes, roomsRes] = await Promise.all([
          getAllBookingsofMyHotel(payLoad),
          getAllHotels(payLoad),
          getAllRooms(payLoad)
        ]);

        const bookingsData = bookingsRes?.data?.data?.rows || [];
        const hotelsData = hotelsRes?.data?.data?.rows || [];
        const roomsData = roomsRes?.data?.data?.rows || [];

        // Map hotel names to rooms
        const roomsWithHotelInfo = roomsData.map((room: any) => {
          const hotel = hotelsData.find((h: any) => h.id === room.hotelId);
          return {
            ...room,
            hotelName: hotel?.propertyName || "Unknown Hotel",
            hotelCity: hotel?.city || "Unknown City",
            hotelStatus: hotel?.status || "Unknown"
          };
        });

        setBookings(bookingsData);
        setFilteredBookings(bookingsData);
        setHotels(hotelsData);
        setFilteredHotels(hotelsData);
        setRooms(roomsWithHotelInfo);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format Amount
  const formattedAmount = (amount: any) => {
    if (!amount) return "0.00";
    const str = amount.toString();
    return str.length > 2 ? `${str.slice(0, -2)}.${str.slice(-2)}` : `0.${str.padStart(2, '0')}`;
  };

  // Get Status Icon
  const getStatusIcon = (status: string): React.ReactElement | null => {
    switch (status?.toLowerCase()) {
      case "checkedin":
      case "approved":
      case "available":
        return <CheckCircleIcon sx={{ color: statusColors[status] || "#4caf50" }} />;
      case "checkedout":
      case "reject":
      case "cancel":
      case "occupied":
        return <CancelIcon sx={{ color: statusColors[status] || "#f44336" }} />;
      case "pending":
      case "maintenance":
        return <PendingIcon sx={{ color: statusColors[status] || "#ff9800" }} />;
      default:
        return null;
    }
  };

  // Get Stay Type Icon
  const getStayTypeIcon = (stayType: string): React.ReactElement => {
    switch (stayType?.toLowerCase()) {
      case "single":
        return <SingleBedIcon />;
      case "double":
        return <SingleBedIcon />;
      case "king":
      case "suite":
      case "deluxe":
        return <KingBedIcon />;
      default:
        return <BedIcon />;
    }
  };

  // Get Bed Count
  const getBedCount = (room: any): number => {
    if (room.bedCount) return room.bedCount;
    const stayType = room.stayType?.toLowerCase();
    if (stayType === "single") return 1;
    if (stayType === "double") return 2;
    if (stayType === "triple") return 3;
    if (stayType === "family") return 4;
    return 1;
  };

  // Toggle hotel expansion
  const toggleHotelExpansion = (hotelId: number) => {
    setExpandedHotelIds(prev =>
      prev.includes(hotelId)
        ? prev.filter(id => id !== hotelId)
        : [...prev, hotelId]
    );
  };

  // Apply Booking Filters
  useEffect(() => {
    let data = [...bookings];

    if (bookingFilters.search) {
      data = data.filter(
        (b) =>
          b.id.toString().includes(bookingFilters.search) ||
          b.geustName?.toLowerCase().includes(bookingFilters.search.toLowerCase()) ||
          b.hotelName?.toLowerCase().includes(bookingFilters.search.toLowerCase())
      );
    }

    if (bookingFilters.status) {
      data = data.filter((b) => b.status === bookingFilters.status);
    }

    if (bookingFilters.checkInFrom) {
      data = data.filter((b) => new Date(b.checkInDate) >= new Date(bookingFilters.checkInFrom));
    }

    if (bookingFilters.checkInTo) {
      data = data.filter((b) => new Date(b.checkInDate) <= new Date(bookingFilters.checkInTo));
    }

    setFilteredBookings(data);
    setBookingPage(1);
  }, [bookingFilters, bookings]);

  // Apply Hotel Filters
  useEffect(() => {
    let data = [...hotels];

    if (hotelFilters.search) {
      data = data.filter((h) =>
        h.propertyName?.toLowerCase().includes(hotelFilters.search.toLowerCase()) ||
        h.ownerMobile?.includes(hotelFilters.search)
      );
    }

    if (hotelFilters.city) {
      data = data.filter(
        (h) => h.city?.toLowerCase() === hotelFilters.city.toLowerCase()
      );
    }

    if (hotelFilters.status) {
      data = data.filter((h) => h.status === hotelFilters.status);
    }

    if (hotelFilters.category) {
      data = data.filter((h) => h.category === hotelFilters.category);
    }

    setFilteredHotels(data);
    setHotelPage(1);
  }, [hotelFilters, hotels]);

  // Pagination calculations
  const bookingStartIndex = (bookingPage - 1) * rowsPerPage;
  const bookingEndIndex = bookingStartIndex + rowsPerPage;
  const paginatedBookings = filteredBookings.slice(bookingStartIndex, bookingEndIndex);
  const totalBookingPages = Math.ceil(filteredBookings.length / rowsPerPage);

  const hotelStartIndex = (hotelPage - 1) * rowsPerPage;
  const hotelEndIndex = hotelStartIndex + rowsPerPage;
  const paginatedHotels = filteredHotels.slice(hotelStartIndex, hotelEndIndex);
  const totalHotelPages = Math.ceil(filteredHotels.length / rowsPerPage);

  // Group rooms by hotel for expanded view
  const groupedRoomsByHotel = paginatedHotels.map(hotel => {
    const hotelRooms = rooms.filter(room => room.hotelId === hotel.id);
    // Get unique stay types for this hotel
    const uniqueStayTypes = Array
      .from(new Set(hotelRooms.map(room => room.stayType)))
      .filter(Boolean);
    
    return {
      ...hotel,
      hotelRooms: hotelRooms,
      stayTypes: uniqueStayTypes,
      totalRooms: hotelRooms.length
    };
  });

  const handleOpenDialog = (id: number, type: "booking" | "hotel", name: string) => {
    setSelectedId(id);
    setDeleteType(type);
    setSelectedName(name);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedId(null);
    setDeleteType(null);
    setSelectedName("");
  };

  const handleConfirmDelete = async () => {
    if (!selectedId || !deleteType) return;

    try {
      if (deleteType === "hotel") {
        await deleteHotel(selectedId);
        setHotels(hotels.filter((h) => h.id !== selectedId));
        toast.success("Hotel deleted successfully");
      }
      handleCloseDialog();
    } catch (error) {
      toast.error("Failed to delete");
      console.error("Delete error:", error);
    }
  };

  // Stats Calculation
  const bookingStats = {
    total: bookings.length,
    checkedIn: bookings.filter(b => b.status === "checkedIn").length,
    pending: bookings.filter(b => b.status === "pending").length,
    revenue: bookings.reduce((sum, b) => sum + (parseFloat(formattedAmount(b.amountPaid)) || 0), 0)
  };

  const hotelStats = {
    total: hotels.length,
    approved: hotels.filter(h => h.status === "Approved").length,
    pending: hotels.filter(h => h.status === "Pending").length,
    totalRooms: rooms.length
  };

  // Reset Filters
  const resetBookingFilters = () => {
    setBookingFilters({ search: "", status: "", checkInFrom: "", checkInTo: "" });
  };

  const resetHotelFilters = () => {
    setHotelFilters({ search: "", city: "", status: "", category: "" });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: "100%", overflowX: "hidden" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: theme.palette.primary.main, mb: 1 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage bookings and hotels efficiently
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", bgcolor: "#e3f2fd" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <BookingIcon sx={{ color: "#1976d2", mr: 1 }} />
                <Typography variant="h6">Total Bookings</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {bookingStats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active: {bookingStats.checkedIn} | Pending: {bookingStats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", bgcolor: "#f3e5f5" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <MoneyIcon sx={{ color: "#7b1fa2", mr: 1 }} />
                <Typography variant="h6">Total Revenue</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                ₹{bookingStats.revenue.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                From all bookings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", bgcolor: "#e8f5e9" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <HotelIcon sx={{ color: "#388e3c", mr: 1 }} />
                <Typography variant="h6">Total Hotels</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {hotelStats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Approved: {hotelStats.approved} | Pending: {hotelStats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", bgcolor: "#fff3e0" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <BedIcon sx={{ color: "#f57c00", mr: 1 }} />
                <Typography variant="h6">Total Rooms</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {hotelStats.totalRooms}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Across all hotels
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              fontWeight: "bold",
              textTransform: "none",
              fontSize: isMobile ? "0.875rem" : "1rem"
            }
          }}
        >
          <Tab 
            icon={<BookingIcon />} 
            iconPosition="start" 
            label={
              <Badge badgeContent={bookingStats.total} color="primary">
                Bookings
              </Badge>
            } 
          />
          <Tab 
            icon={<HotelIcon />} 
            iconPosition="start" 
            label={
              <Badge badgeContent={hotelStats.total} color="primary">
                Hotels
              </Badge>
            } 
          />
        </Tabs>

        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress />
            <Typography sx={{ mt: 2, textAlign: "center" }}>Loading data...</Typography>
          </Box>
        ) : (
          <>
            {/* BOOKINGS TAB */}
            {activeTab === 0 && (
              <Box sx={{ p: { xs: 1, sm: 2 } }}>
                {/* Booking Filters */}
                <Card sx={{ mb: 2, p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <FilterListIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6">Booking Filters</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button size="small" onClick={resetBookingFilters}>
                      Reset Filters
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Search"
                        size="small"
                        fullWidth
                        value={bookingFilters.search}
                        onChange={(e) => setBookingFilters({ ...bookingFilters, search: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        label="Status"
                        select
                        size="small"
                        fullWidth
                        value={bookingFilters.status}
                        onChange={(e) => setBookingFilters({ ...bookingFilters, status: e.target.value })}
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="checkedIn">Checked In</MenuItem>
                        <MenuItem value="checkedOut">Checked Out</MenuItem>
                        <MenuItem value="Cancel">Cancelled</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        type="date"
                        label="Check-In From"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={bookingFilters.checkInFrom}
                        onChange={(e) => setBookingFilters({ ...bookingFilters, checkInFrom: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        type="date"
                        label="Check-In To"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={bookingFilters.checkInTo}
                        onChange={(e) => setBookingFilters({ ...bookingFilters, checkInTo: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Card>

                {/* Bookings Table */}
                <Card>
                  <CardHeader
                    title={`Bookings (${filteredBookings.length})`}
                    subheader={`Showing ${paginatedBookings.length} of ${filteredBookings.length} bookings`}
                    action={
                      <Chip
                        label={`Page ${bookingPage} of ${totalBookingPages}`}
                        color="primary"
                        variant="outlined"
                      />
                    }
                  />
                  <Divider />
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      maxHeight: "500px",
                      overflow: "auto"
                    }}
                  >
                    <Table stickyHeader size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Hotel</TableCell>
                          <TableCell>Guest</TableCell>
                          <TableCell>Check-In</TableCell>
                           <TableCell>Check-In Time</TableCell>
                          <TableCell>Check-Out</TableCell>
                           <TableCell>Check-Out Time</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedBookings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                              <Typography color="text.secondary">
                                No bookings found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedBookings.map((b) => (
                            <TableRow 
                              key={b.id}
                              hover
                              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                  #{b.id}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <HotelIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    {b.hotelName || "Unknown Hotel"}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <PersonIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    {b.geustName || "Unknown Guest"}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <CalendarIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    {dayjs(b.checkInDate).format("DD MMM YYYY")}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <CalendarIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    {b.checkInTime}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {dayjs(b.checkOutDate).format("DD MMM YYYY")}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <CalendarIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    {b.checkOutTime}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={b.status || "Unknown"}
                                  icon={getStatusIcon(b.status)|| undefined}
                                  sx={{
                                    backgroundColor: `${statusColors[b.status] || "#e0e0e0"}20`,
                                    color: statusColors[b.status] || "#757575",
                                    fontWeight: "bold",
                                    textTransform: "capitalize"
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                  ₹{formattedAmount(b.amountPaid)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Booking Pagination */}
                  {totalBookingPages > 1 && (
                    <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                      <Pagination
                        count={totalBookingPages}
                        page={bookingPage}
                        onChange={(e, page) => setBookingPage(page)}
                        color="primary"
                        size={isMobile ? "small" : "medium"}
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  )}
                </Card>
              </Box>
            )}

            {/* HOTELS TAB */}
            {activeTab === 1 && (
              <Box sx={{ p: { xs: 1, sm: 2 } }}>
                {/* Hotel Filters */}
                <Card sx={{ mb: 2, p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <FilterListIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6">Hotel Filters</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button size="small" onClick={resetHotelFilters}>
                      Reset Filters
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Search Hotel"
                        size="small"
                        fullWidth
                        value={hotelFilters.search}
                        onChange={(e) => setHotelFilters({ ...hotelFilters, search: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        label="City"
                        size="small"
                        fullWidth
                        value={hotelFilters.city}
                        onChange={(e) => setHotelFilters({ ...hotelFilters, city: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        label="Status"
                        select
                        size="small"
                        fullWidth
                        value={hotelFilters.status}
                        onChange={(e) => setHotelFilters({ ...hotelFilters, status: e.target.value })}
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="Approved">APPROVED</MenuItem>
                        <MenuItem value="Reject">REJECT</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        label="Category"
                        size="small"
                        fullWidth
                        value={hotelFilters.category}
                        onChange={(e) => setHotelFilters({ ...hotelFilters, category: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Card>

                {/* Hotels Table with Rooms Expandable */}
                <Card>
                  <CardHeader
                    title={`Hotels (${filteredHotels.length})`}
                    subheader={`Showing ${paginatedHotels.length} of ${filteredHotels.length} hotels with room details`}
                    action={
                      <Chip
                        label={`Page ${hotelPage} of ${totalHotelPages}`}
                        color="primary"
                        variant="outlined"
                      />
                    }
                  />
                  <Divider />
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      maxHeight: "600px",
                      overflow: "auto"
                    }}
                  >
                    <Table stickyHeader size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow>
                          <TableCell width={50}></TableCell>
                          <TableCell>ID</TableCell>
                          <TableCell>Hotel Name</TableCell>
                          <TableCell>City</TableCell>
                          <TableCell>Contact</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Stay Types</TableCell>
                          <TableCell>Total Rooms</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedHotels.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                              <Typography color="text.secondary">
                                No hotels found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          groupedRoomsByHotel.map((hotel) => {
                            const isExpanded = expandedHotelIds.includes(hotel.id);
                            const hotelRooms = hotel.hotelRooms || [];
                            const stayTypes = hotel.stayTypes || [];
                            
                            return (
                              <React.Fragment key={hotel.id}>
                                {/* Hotel Row */}
                                <TableRow 
                                  hover
                                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                  <TableCell>
                                    <MuiIconButton
                                      size="small"
                                      onClick={() => toggleHotelExpansion(hotel.id)}
                                      sx={{
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s',
                                      }}
                                    >
                                      <ExpandMoreIcon />
                                    </MuiIconButton>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                      #{hotel.id}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <Avatar 
                                        sx={{ 
                                          width: 32, 
                                          height: 32,
                                          bgcolor: theme.palette.primary.main
                                        }}
                                      >
                                        {hotel.propertyName?.[0] || "H"}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                          {hotel.propertyName || "Unnamed Hotel"}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {hotel.category || "Hotel"}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <CityIcon fontSize="small" color="action" />
                                      <Typography variant="body2">
                                        {hotel.city || "Unknown"}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {hotel.ownerMobile || "No contact"}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={hotel.status || "ACTIVE"}
                                      icon={getStatusIcon(hotel.status) || undefined}
                                      sx={{
                                        backgroundColor: `${statusColors[hotel.status] || "#2196f3"}20`,
                                        color: statusColors[hotel.status] || "#2196f3",
                                        fontWeight: "bold"
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                      {stayTypes.length > 0 ? (
                                        stayTypes.slice(0, 3).map((type: string, index: number) => (
                                          <Chip
                                            key={index}
                                            size="small"
                                            label={type}
                                            sx={{
                                              backgroundColor: `${stayTypeColors[type?.toLowerCase()] || "#9e9e9e"}20`,
                                              color: stayTypeColors[type?.toLowerCase()] || "#757575",
                                              fontSize: '0.7rem',
                                              height: '24px',
                                              mb: 0.5
                                            }}
                                          />
                                        ))
                                      ) : (
                                        <Typography variant="caption" color="text.secondary">
                                          No stay types
                                        </Typography>
                                      )}
                                      {stayTypes.length > 3 && (
                                        <Chip
                                          size="small"
                                          label={`+${stayTypes.length - 3}`}
                                          sx={{
                                            backgroundColor: '#e0e0e0',
                                            fontSize: '0.7rem',
                                            height: '24px',
                                            mb: 0.5
                                          }}
                                        />
                                      )}
                                    </Stack>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <BedIcon fontSize="small" color="action" />
                                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                        {hotel.totalRooms || 0}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                      <Tooltip title="Edit Hotel">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => navigate('/property-registration', { state: hotel.id })}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Delete Hotel">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleOpenDialog(hotel.id, "hotel", hotel.propertyName)}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                  </TableCell>
                                </TableRow>

                                {/* Rooms Row (Expanded) */}
                                {isExpanded && (
                                  <TableRow>
                                    <TableCell colSpan={9} sx={{ p: 0, bgcolor: '#fafafa' }}>
                                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <Box sx={{ p: 2 }}>
                                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                                            Hotel Rooms ({hotelRooms.length})
                                          </Typography>
                                          
                                          {hotelRooms.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                              No rooms available for this hotel
                                            </Typography>
                                          ) : (
                                            <Grid container spacing={2}>
                                              {hotelRooms.map((room: any) => (
                                                <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
                                                  <Card variant="outlined" sx={{ height: '100%' }}>
                                                    <CardContent sx={{ p: 2 }}>
                                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: "center", gap: 1 }}>
                                                          {getStayTypeIcon(room.stayType)}
                                                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                            Room {room.roomNumber}
                                                          </Typography>
                                                        </Box>
                                                        <Chip
                                                          size="small"
                                                          label={room.status || "available"}
                                                          icon={getStatusIcon(room.status) || undefined}
                                                          sx={{
                                                            backgroundColor: `${statusColors[room.status] || "#4caf50"}20`,
                                                            color: statusColors[room.status] || "#4caf50",
                                                            fontSize: '0.7rem'
                                                          }}
                                                        />
                                                      </Box>
                                                      
                                                      <Typography variant="caption" color="text.secondary" display="block">
                                                        Stay Type:
                                                      </Typography>
                                                      <Chip
                                                        size="small"
                                                        label={room.stayType || "Standard"}
                                                        sx={{
                                                          backgroundColor: `${stayTypeColors[room.stayType?.toLowerCase()] || "#9e9e9e"}20`,
                                                          color: stayTypeColors[room.stayType?.toLowerCase()] || "#757575",
                                                          fontSize: '0.7rem',
                                                          my: 0.5
                                                        }}
                                                      />
                                                      
                                                      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: "center", gap: 0.5 }}>
                                                          <PeopleIcon fontSize="small" color="action" />
                                                          <Typography variant="caption">
                                                            Capacity: {room.capacity || getBedCount(room)}
                                                          </Typography>
                                                        </Box>
                                                        {room.bathroomCount && (
                                                          <Box sx={{ display: 'flex', alignItems: "center", gap: 0.5 }}>
                                                            <BathroomIcon fontSize="small" color="action" />
                                                            <Typography variant="caption">
                                                              Bath: {room.bathroomCount}
                                                            </Typography>
                                                          </Box>
                                                        )}
                                                      </Box>
                                                      
                                                      <Box sx={{ mt: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                                          ₹{room.price ? room.price.toLocaleString('en-IN') : "0"}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                          /night
                                                        </Typography>
                                                      </Box>
                                                    </CardContent>
                                                  </Card>
                                                </Grid>
                                              ))}
                                            </Grid>
                                          )}
                                        </Box>
                                      </Collapse>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Hotel Pagination */}
                  {totalHotelPages > 1 && (
                    <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                      <Pagination
                        count={totalHotelPages}
                        page={hotelPage}
                        onChange={(e, page) => setHotelPage(page)}
                        color="primary"
                        size={isMobile ? "small" : "medium"}
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  )}
                </Card>
              </Box>
            )}
          </>
        )}
      </Card>

      {/* DELETE DIALOG */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "error.main", color: "white" }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Avatar sx={{ bgcolor: "error.light", width: 60, height: 60, mx: "auto", mb: 2 }}>
              <DeleteIcon fontSize="large" />
            </Avatar>
            <DialogContentText>
              Are you sure you want to delete this {deleteType}?
            </DialogContentText>
            <Typography variant="h6" sx={{ mt: 1, fontWeight: "bold" }}>
              "{selectedName}"
            </Typography>
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
              This action cannot be undone
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined" fullWidth>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            fullWidth
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminHomepage;