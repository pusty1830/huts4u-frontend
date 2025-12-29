import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
  Divider,
  Avatar,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  useMediaQuery,
  useTheme,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  CircularProgress,
  Tooltip,
  Alert,
  LinearProgress,
  CardActionArea,
  Fab,
  Zoom,
  Switch,
  FormControlLabel,
  alpha,
  Snackbar,
} from "@mui/material";
import {
  Search,
  FilterList,
  Clear,
  Refresh,
  Visibility,
  CalendarToday,
  Person,
  Phone,
  Hotel,
  Bed,
  EventAvailable,
  EventBusy,
  MoreVert,
  Download,
  Print,
  Share,
  Notifications,
  ArrowUpward,
  ArrowDownward,
  TrendingUp,
  TrendingDown,
  Group,
  Schedule,
  CheckCircle,
  Cancel,
  AccessTime,
  LocalHotel,
  Wifi,
  Restaurant,
  Pool,
  DirectionsCar,
  AcUnit,
  Tv,
  RoomService,
  FitnessCenter,
  Spa,
  BusinessCenter,
  Pets,
  SmokeFree,
  Kitchen,
  Balcony,
  NightsStay,
  AccessTime as HourlyIcon,
  ArrowDropDown,
  FilterAlt,
  Menu as MenuIcon,
  Close,
  Error as ErrorIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import relativeTime from "dayjs/plugin/relativeTime";
import color from "../../components/color";
import {
  getAllHotels,
  getHotel,
  updateBookings,
  editHotel,
  getAllBookingsofMyHotel,
  getAllRooms,
  getAllInventories,
  udateInventory,
  createInventory,
} from "../../services/services";
import { getUserId } from "../../services/axiosClient";

// Extend dayjs plugins
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(relativeTime);

// ---------------------- Types ----------------------
interface Hotel {
  id: string;
  propertyName: string;
  city: string;
  address: string;
  [key: string]: any;
}

interface HotelOption {
  id: string;
  name: string;
  displayLabel: string;
  hasOvernight: boolean;
  hasHourly: boolean;
  address?: string;
  starRating?: number;
  totalRooms?: number;
  occupiedRooms?: number;
  amenities?: string[];
}

interface Room {
  id: string;
  hotelId: string;
  roomCategory: string;
  roomSize: string;
  stayType: 'Overnight' | 'Hourly' | 'Both';
  availableRooms: number;
}

interface GuestDetails {
  phoneNumber?: string;
  email?: string;
  address?: string;
  specialRequests?: string;
  idProof?: string;
  nationality?: string;
}

interface Booking {
  id: string;
  avatar?: string;
  geustName?: string;
  phoneNumber?: string;
  geustDetails?: GuestDetails;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  status?: string;
  statusColor?: string;
  roomNumber?: string;
  roomType?: string;
  roomId?: string;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  currency?: string;
  adults?: number;
  children?: number;
  specialRequests?: string;
  bookingSource?: string;
  paymentMethod?: string;
  notes?: string;
  stayType?: 'Overnight' | 'Hourly' | 'Both';
  duration?: number; // Duration in hours for hourly stays
}

interface Inventory {
  id: string;
  roomId: string;
  date: string;
  stayType: 'Overnight' | 'Hourly';
  overnightAvailable: number;
  threeHourAvailable: number;
  sixHourAvailable: number;
  twelveHourAvailable: number;
  overnightBooked: number;
  threeHourBooked: number;
  sixHourBooked: number;
  twelveHourBooked: number;
  overnightRate: number;
  threeHourRate: number;
  sixHourRate: number;
  twelveHourRate: number;
  isBlocked: boolean;
  notes?: string;
}

interface BookingTableProps {
  bookings?: Booking[];
  hotelId?: string;
  onCheckIn?: (bookingId: string) => void;
  onCheckOut?: (bookingId: string) => void;
  onViewDetails?: (booking: Booking) => void;
}

// Amenity icons mapping
const amenityIcons: Record<string, React.ReactElement> = {
  wifi: <Wifi fontSize="small" />,
  restaurant: <Restaurant fontSize="small" />,
  pool: <Pool fontSize="small" />,
  parking: <DirectionsCar fontSize="small" />,
  ac: <AcUnit fontSize="small" />,
  tv: <Tv fontSize="small" />,
  roomService: <RoomService fontSize="small" />,
  gym: <FitnessCenter fontSize="small" />,
  spa: <Spa fontSize="small" />,
  businessCenter: <BusinessCenter fontSize="small" />,
  pets: <Pets fontSize="small" />,
  smokeFree: <SmokeFree fontSize="small" />,
  kitchen: <Kitchen fontSize="small" />,
  balcony: <Balcony fontSize="small" />,
};

// Stay Type Options
const stayTypeOptions = [
  { value: "all", label: "All Stay Types", icon: <Hotel /> },
  { value: "overnight", label: "Overnight", icon: <NightsStay /> },
  { value: "hourly", label: "Hourly", icon: <HourlyIcon /> },
  { value: "both", label: "Both", icon: <Hotel /> },
];

// Status options
const statusOptions = [
  { value: "all", label: "All", color: "#666" },
  { value: "pending", label: "Pending", color: "#ffc107" },
  { value: "confirmed", label: "Confirmed", color: "#17a2b8" },
  { value: "checkedin", label: "Checked In", color: "#28a745" },
  { value: "checkedout", label: "Checked Out", color: "#dc3545" },
  { value: "cancelled", label: "Cancelled", color: "#6c757d" },
];

// ------------------- Helper Functions -------------------
const getHotelName = (hotel: Hotel | undefined): string => {
  return hotel?.propertyName || hotel?.name || "Unknown Hotel";
};

// Function to fetch hotels with stay types info
const fetchHotelsWithStayTypes = async (
  setHotels: React.Dispatch<React.SetStateAction<HotelOption[]>>,
  setSelectedHotel: React.Dispatch<React.SetStateAction<string>>
): Promise<HotelOption[]> => {
  try {
    const payload = { 
      data: { filter: "", userId: getUserId() }, 
      page: 0, 
      pageSize: 100, 
      order: [["createdAt", "ASC"]] 
    };
    const response = await getAllHotels(payload);
    const hotelList = response?.data?.data?.rows || [];
    
    // Fetch rooms to check stay types
    const roomsPayload = { 
      data: { filter: "" }, 
      page: 0, 
      pageSize: 1000, 
      order: [["createdAt", "ASC"]] 
    };
    const roomsRes = await getAllRooms(roomsPayload);
    const roomList = roomsRes?.data?.data?.rows || roomsRes?.data?.rows || roomsRes?.data || [];
    
    // Create hotel options with stay type info
    const options: HotelOption[] = hotelList
      .map((hotel: Hotel) => {
        const hotelName = getHotelName(hotel);
        
        // Check hotel rooms for stay types
        const hotelRooms = roomList.filter((room: any) => room.hotelId === hotel.id);
        const hasOvernight = hotelRooms.some((room: any) => 
          room.stayType === 'Overnight' || room.stayType === 'Both'
        );
        const hasHourly = hotelRooms.some((room: any) => 
          room.stayType === 'Hourly' || room.stayType === 'Both'
        );
        
        // Create display label based on stay types
        let displayLabel = hotelName;
        if (hasOvernight && !hasHourly) {
          displayLabel = `${hotelName} (Overnight)`;
        } else if (!hasOvernight && hasHourly) {
          displayLabel = `${hotelName} (Hourly)`;
        } else if (hasOvernight && hasHourly) {
          displayLabel = `${hotelName} (Overnight & Hourly)`;
        }
        
        return {
          id: hotel.id,
          name: hotelName,
          displayLabel,
          hasOvernight,
          hasHourly,
          address: hotel.address,
          starRating: hotel.starRating,
          totalRooms: hotel.totalRooms,
          occupiedRooms: hotel.occupiedRooms,
          amenities: hotel.amenities,
        };
      })
      .filter((hotel: HotelOption) => hotel.hasOvernight || hotel.hasHourly); // Only hotels with bookings

    // Sort alphabetically
    options.sort((a: HotelOption, b: HotelOption) => a.name.localeCompare(b.name));
    
    setHotels(options);
    
    // Auto-select first hotel if exists
    if (options.length > 0) {
      setSelectedHotel(options[0].id);
    }
    
    return options;
  } catch (error) {
    console.error("Error fetching hotels:", error);
    throw error;
  }
};

// Inventory Management Helper Functions
const getInventoryFieldName = (stayType: string, duration?: number): string => {
  if (stayType === 'Overnight') return 'overnight';
  
  if (stayType === 'Hourly' && duration) {
    if (duration <= 3) return 'threeHour';
    if (duration <= 6) return 'sixHour';
    return 'twelveHour';
  }
  
  return 'overnight'; // default
};

const updateInventoryOnCheckIn = async (booking: Booking): Promise<boolean> => {
  try {
    if (!booking.roomId || !booking.checkInDate) {
      console.error("Missing roomId or checkInDate for inventory update");
      return false;
    }

    const stayType = booking.stayType || 'Overnight';
    const date = booking.checkInDate;
    const duration = booking.duration || 0;
    
    // Get inventory for the check-in date
    const inventoryPayload = {
      data: {
        filter: "",
        roomId: booking.roomId,
        date: dayjs(date).format('YYYY-MM-DD')
      },
      page: 0,
      pageSize: 1,
      order: [["date", "ASC"]]
    };

    const inventoryRes = await getAllInventories(inventoryPayload);
    const inventories = inventoryRes?.data?.data?.rows || [];
    
    if (inventories.length === 0) {
      console.error("No inventory found for room", booking.roomId, "on date", date);
      return false;
    }

    const inventory = inventories[0];
    const fieldPrefix = getInventoryFieldName(stayType, duration);
    
    // Calculate available and booked counts
    const availableField = `${fieldPrefix}Available`;
    const bookedField = `${fieldPrefix}Booked`;
    
    const currentAvailable = inventory[availableField] || 0;
    const currentBooked = inventory[bookedField] || 0;
    
    if (currentAvailable <= 0) {
      console.error("No available inventory for", stayType, "on", date);
      return false;
    }

    // Update inventory: decrease available, increase booked
    const updatePayload = {
      [availableField]: Math.max(0, currentAvailable - 1),
      [bookedField]: currentBooked + 1
    };

    await udateInventory(inventory.id, updatePayload);
    console.log("Inventory updated successfully for booking", booking.id);
    return true;
  } catch (error) {
    console.error("Error updating inventory on check-in:", error);
    return false;
  }
};

const updateInventoryOnCheckOut = async (booking: Booking): Promise<boolean> => {
  try {
    if (!booking.roomId || !booking.checkInDate) {
      console.error("Missing roomId or checkInDate for inventory update");
      return false;
    }

    const stayType = booking.stayType || 'Overnight';
    const date = booking.checkInDate;
    const duration = booking.duration || 0;
    
    // Get inventory for the check-in date
    const inventoryPayload = {
      data: {
        filter: "",
        roomId: booking.roomId,
        date: dayjs(date).format('YYYY-MM-DD')
      },
      page: 0,
      pageSize: 1,
      order: [["date", "ASC"]]
    };

    const inventoryRes = await getAllInventories(inventoryPayload);
    const inventories = inventoryRes?.data?.data?.rows || [];
    
    if (inventories.length === 0) {
      console.error("No inventory found for room", booking.roomId, "on date", date);
      return false;
    }

    const inventory = inventories[0];
    const fieldPrefix = getInventoryFieldName(stayType, duration);
    
    // Calculate available and booked counts
    const availableField = `${fieldPrefix}Available`;
    const bookedField = `${fieldPrefix}Booked`;
    
    const currentAvailable = inventory[availableField] || 0;
    const currentBooked = inventory[bookedField] || 0;
    
    if (currentBooked <= 0) {
      console.error("No booked inventory found for", stayType, "on", date);
      return false;
    }

    // Update inventory: increase available, decrease booked
    const updatePayload = {
      [availableField]: currentAvailable + 1,
      [bookedField]: Math.max(0, currentBooked - 1)
    };

    await udateInventory(inventory.id, updatePayload);
    console.log("Inventory updated successfully on check-out for booking", booking.id);
    return true;
  } catch (error) {
    console.error("Error updating inventory on check-out:", error);
    return false;
  }
};

// ------------------- BookingTable Component -------------------
const BookingTable: React.FC<BookingTableProps> = ({ 
  bookings = [], 
  hotelId, 
  onCheckIn, 
  onCheckOut,
  onViewDetails 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [availability, setAvailability] = useState<string | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [quickFilters, setQuickFilters] = useState({
    status: "all",
    stayType: "all",
    search: "",
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  // Show snackbar notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch hotel availability
  useEffect(() => {
    let mounted = true;
    if (!hotelId) {
      setAvailability(null);
      return;
    }

    setLoadingAvailability(true);
    getHotel(hotelId)
      .then((res: any) => {
        if (!mounted) return;
        const avail = res?.data?.data?.roomAvailable ?? "Unavailable";
        setAvailability(avail);
      })
      .catch(() => {
        if (!mounted) return;
        setAvailability("Unavailable");
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingAvailability(false);
      });

    return () => {
      mounted = false;
    };
  }, [hotelId]);

  const toggleAvailability = () => {
    if (!hotelId || availability == null) return;

    const prev = availability;
    const newStatus = availability === "Available" ? "Unavailable" : "Available";
    setAvailability(newStatus);

    editHotel(hotelId, { roomAvailable: newStatus })
      .then(() => {
        showSnackbar(`Availability updated to ${newStatus}`, 'success');
      })
      .catch((err) => {
        console.error("Error updating availability:", err);
        setAvailability(prev);
        showSnackbar('Failed to update availability', 'error');
      });
  };

  const canCheckIn = (booking: Booking) => {
    const s = (booking.status || "").toLowerCase();
    return s === "pending" || s === "confirmed" || s === "booked";
  };

  const canCheckOut = (booking: Booking) => {
    const s = (booking.status || "").toLowerCase();
    return s === "checkedin";
  };

  const setLoadingForId = (id: string, loading: boolean) => {
    setLoadingIds((prev) => {
      if (loading) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      } else {
        return prev.filter((x) => x !== id);
      }
    });
  };

  const statusColorFor = (status: string | undefined) => {
    const s = (status || "").toLowerCase();
    if (s === "checkedin") return "rgba(163,228,215,0.8)";
    if (s === "checkedout") return "rgba(245,183,177,0.9)";
    if (s === "confirmed") return "rgba(204,229,255,0.9)";
    if (s === "pending") return "rgba(255,243,205,0.95)";
    if (s === "cancelled") return "rgba(220,53,69,0.1)";
    return "rgba(0,0,0,0.08)";
  };

  const stayTypeColor = (stayType: string | undefined) => {
    switch (stayType?.toLowerCase()) {
      case 'overnight':
        return theme.palette.primary.main;
      case 'hourly':
        return theme.palette.secondary.main;
      case 'both':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: "checkedIn" | "checkedOut") => {
    const booking = localBookings.find(b => b.id === bookingId);
    if (!booking) return;

    const prev = localBookings.map((b) => ({ ...b }));

    setLoadingForId(bookingId, true);

    // Update local state immediately for better UX
    setLocalBookings((list) =>
      list.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus, statusColor: statusColorFor(newStatus) } : b
      )
    );

    try {
      // First, update the inventory
      let inventoryUpdated = false;
      if (newStatus === "checkedIn") {
        inventoryUpdated = await updateInventoryOnCheckIn(booking);
        if (!inventoryUpdated) {
          throw new Error("Failed to update inventory on check-in");
        }
      } else if (newStatus === "checkedOut") {
        inventoryUpdated = await updateInventoryOnCheckOut(booking);
        if (!inventoryUpdated) {
          throw new Error("Failed to update inventory on check-out");
        }
      }

      // Then, update the booking status
      await updateBookings(bookingId, { status: newStatus });

      // Show success message
      showSnackbar(
        `Booking ${newStatus === "checkedIn" ? "checked in" : "checked out"} successfully!`,
        'success'
      );

      // Trigger parent callbacks
      if (newStatus === "checkedIn") {
        onCheckIn?.(bookingId);
      } else if (newStatus === "checkedOut") {
        onCheckOut?.(bookingId);
      }

    } catch (err) {
      console.error("Failed to update booking status", err);
      
      // Revert local changes on error
      setLocalBookings(prev);
      
      // Show error message
      const errorMsg = newStatus === "checkedIn" 
        ? "Failed to check in. Please check inventory availability."
        : "Failed to check out. Please try again.";
      showSnackbar(errorMsg, 'error');
      
    } finally {
      setLoadingForId(bookingId, false);
    }
  };

  // Filter bookings based on quick filters
  const filteredBookings = useMemo(() => {
    let filtered = [...localBookings];

    // Search filter
    if (quickFilters.search) {
      const query = quickFilters.search.toLowerCase();
      filtered = filtered.filter(b => 
        b.geustName?.toLowerCase().includes(query) ||
        b.roomNumber?.toLowerCase().includes(query) ||
        b.id?.toLowerCase().includes(query) ||
        b.geustDetails?.phoneNumber?.includes(query)
      );
    }

    // Status filter
    if (quickFilters.status !== "all") {
      filtered = filtered.filter(b => 
        (b.status || "").toLowerCase() === quickFilters.status.toLowerCase()
      );
    }

    // Stay type filter
    if (quickFilters.stayType !== "all") {
      filtered = filtered.filter(b => 
        (b.stayType || "").toLowerCase() === quickFilters.stayType.toLowerCase()
      );
    }

    return filtered;
  }, [localBookings, quickFilters]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredBookings.length;
    const pending = filteredBookings.filter(b => b.status?.toLowerCase() === 'pending').length;
    const checkedIn = filteredBookings.filter(b => b.status?.toLowerCase() === 'checkedin').length;
    const revenue = filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const overnightBookings = filteredBookings.filter(b => b.stayType === 'Overnight').length;
    const hourlyBookings = filteredBookings.filter(b => b.stayType === 'Hourly').length;
    const bothBookings = filteredBookings.filter(b => b.stayType === 'Both').length;

    return { 
      total, 
      pending, 
      checkedIn, 
      revenue, 
      overnightBookings, 
      hourlyBookings,
      bothBookings 
    };
  }, [filteredBookings]);

  // Mobile Booking Card Component
  const MobileBookingCard = ({ booking }: { booking: Booking }) => {
    const isLoading = loadingIds.includes(booking.id);
    const status = (booking.status || "").toLowerCase();

    return (
      <Card sx={{ 
        mb: 2, 
        borderRadius: 2, 
        overflow: 'hidden', 
        borderLeft: `4px solid ${statusColorFor(status)}` 
      }}>
        <CardActionArea onClick={() => {
          setSelectedBooking(booking);
          setDetailDialogOpen(true);
        }}>
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
              <Box>
                <Typography variant="h6" fontWeight="bold" noWrap>
                  {booking.geustName || "Guest"}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Booking #{booking.id}
                </Typography>
              </Box>
              <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                <Chip 
                  label={booking.status || "Unknown"} 
                  size="small"
                  sx={{ 
                    backgroundColor: statusColorFor(status),
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                    height: 20
                  }}
                />
                {booking.stayType && (
                  <Chip 
                    label={booking.stayType} 
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: stayTypeColor(booking.stayType),
                      color: stayTypeColor(booking.stayType),
                      height: 18,
                      fontSize: '0.7rem'
                    }}
                  />
                )}
              </Box>
            </Box>

            <Grid container spacing={1} mb={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
                  <CalendarToday fontSize="small" />
                  Check-in
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {booking.checkInDate ? dayjs(booking.checkInDate).format("DD MMM") : "-"}
                </Typography>
                {booking.checkInTime && (
                  <Typography variant="caption" color="textSecondary">
                    {booking.checkInTime}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
                  <EventBusy fontSize="small" />
                  Check-out
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {booking.checkOutDate ? dayjs(booking.checkOutDate).format("DD MMM") : "-"}
                </Typography>
                {booking.checkOutTime && (
                  <Typography variant="caption" color="textSecondary">
                    {booking.checkOutTime}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
                  <Hotel fontSize="small" />
                  Room
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {booking.roomNumber || "TBD"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
                  <Group fontSize="small" />
                  Guests
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {(booking.adults || 0) + (booking.children || 0)}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              
              <Box display="flex" gap={1}>
                {canCheckIn(booking) && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateBookingStatus(booking.id, "checkedIn");
                    }}
                    disabled={isLoading}
                    sx={{ 
                      backgroundColor: color.firstColor,
                      borderRadius: '20px',
                      px: 2,
                      minWidth: '100px'
                    }}
                  >
                    {isLoading ? <CircularProgress size={16} /> : "Check In"}
                  </Button>
                )}
                {canCheckOut(booking) && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateBookingStatus(booking.id, "checkedOut");
                    }}
                    disabled={isLoading}
                    sx={{ 
                      borderColor: color.firstColor,
                      color: color.firstColor,
                      borderRadius: '20px',
                      px: 2,
                      minWidth: '100px'
                    }}
                  >
                    {isLoading ? <CircularProgress size={16} /> : "Check Out"}
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  };

  // Booking Detail Dialog
  const BookingDetailDialog = () => (
    <Dialog 
      open={detailDialogOpen} 
      onClose={() => setDetailDialogOpen(false)}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      {selectedBooking && (
        <>
          <DialogTitle sx={{ 
            backgroundColor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            zIndex: 1
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton onClick={() => setDetailDialogOpen(false)} size="small" sx={{ display: { xs: 'flex', sm: 'none' } }}>
                  <ArrowDropDown />
                </IconButton>
                <Typography variant="h6">Booking Details</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {selectedBooking.stayType && (
                  <Chip 
                    label={selectedBooking.stayType} 
                    sx={{ 
                      backgroundColor: stayTypeColor(selectedBooking.stayType),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                )}
                <Chip 
                  label={selectedBooking.status || "Unknown"} 
                  sx={{ 
                    backgroundColor: statusColorFor(selectedBooking.status),
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={3}>
              {/* Guest Information */}
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2} display="flex" alignItems="center" gap={1}>
                    <Person /> Guest Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Guest Name</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedBooking.geustName || "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Contact</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedBooking.geustDetails?.phoneNumber || "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Email</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedBooking.geustDetails?.email || "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Nationality</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedBooking.geustDetails?.nationality || "-"}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Stay Details */}
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2} display="flex" alignItems="center" gap={1}>
                    <Hotel /> Stay Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">Check-in</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedBooking.checkInDate ? dayjs(selectedBooking.checkInDate).format("DD MMM YYYY") : "-"}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">{selectedBooking.checkInTime || "-"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">Check-out</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedBooking.checkOutDate ? dayjs(selectedBooking.checkOutDate).format("DD MMM YYYY") : "-"}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">{selectedBooking.checkOutTime || "-"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">Room Number</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedBooking.roomNumber || "TBD"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">Room Type</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedBooking.roomType || "-"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">Adults</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedBooking.adults || 0}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">Children</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedBooking.children || 0}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Stay Type</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        <Chip 
                          label={selectedBooking.stayType || "Not specified"} 
                          size="small"
                          sx={{ 
                            backgroundColor: stayTypeColor(selectedBooking.stayType),
                            color: 'white'
                          }}
                        />
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Payment Details */}
              {/* <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2} display="flex" alignItems="center" gap={1}>
                     Payment Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                      <Typography variant="h6" color={color.firstColor} fontWeight="bold">
                        ₹{selectedBooking.totalAmount?.toLocaleString() || "0"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="textSecondary">Payment Method</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedBooking.paymentMethod || "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">Booking Source</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedBooking.bookingSource || "-"}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card> */}

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>Special Requests</Typography>
                    <Typography variant="body2">{selectedBooking.specialRequests}</Typography>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderTop: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'background.paper'
          }}>
            <Button 
              onClick={() => setDetailDialogOpen(false)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Close
            </Button>
            <Button 
              variant="contained" 
              onClick={() => {
                if (canCheckIn(selectedBooking)) {
                  updateBookingStatus(selectedBooking.id, "checkedIn");
                } else if (canCheckOut(selectedBooking)) {
                  updateBookingStatus(selectedBooking.id, "checkedOut");
                }
                setDetailDialogOpen(false);
              }}
              sx={{ 
                backgroundColor: color.firstColor, 
                borderRadius: 2,
                minWidth: '120px'
              }}
              disabled={!canCheckIn(selectedBooking) && !canCheckOut(selectedBooking)}
            >
              {canCheckIn(selectedBooking) ? "Check In" : canCheckOut(selectedBooking) ? "Check Out" : "Update"}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  // Filter Drawer
  const FilterDrawer = () => (
    <Drawer
      anchor="right"
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      sx={{
        '& .MuiDrawer-paper': { 
          width: { xs: '100%', sm: 400 },
          p: 3 
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Filter Bookings</Typography>
        <IconButton onClick={() => setFilterDrawerOpen(false)}>
          <Close />
        </IconButton>
      </Box>
      
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Search"
          value={quickFilters.search}
          onChange={(e) => setQuickFilters({...quickFilters, search: e.target.value})}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={quickFilters.status}
            label="Status"
            onChange={(e) => setQuickFilters({...quickFilters, status: e.target.value})}
          >
            {statusOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: option.color }} />
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Stay Type</InputLabel>
          <Select
            value={quickFilters.stayType}
            label="Stay Type"
            onChange={(e) => setQuickFilters({...quickFilters, stayType: e.target.value})}
          >
            {stayTypeOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                <Box display="flex" alignItems="center" gap={1}>
                  {option.icon}
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Typography variant="subtitle2" mb={1}>Show Only</Typography>
          <FormControlLabel
            control={<Switch />}
            label="Today's Check-ins"
          />
          <FormControlLabel
            control={<Switch />}
            label="Pending Payments"
          />
          <FormControlLabel
            control={<Switch />}
            label="Special Requests"
          />
        </Box>

        <Box display="flex" gap={2} mt={2}>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={() => setQuickFilters({ status: "all", stayType: "all", search: "" })}
            sx={{ borderRadius: 2 }}
          >
            Clear All
          </Button>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => setFilterDrawerOpen(false)}
            sx={{ 
              backgroundColor: color.firstColor,
              borderRadius: 2
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </Stack>
    </Drawer>
  );

  // Snackbar Component
  const SnackbarNotification = () => (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={3000}
      onClose={() => setSnackbar({ ...snackbar, open: false })}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
        sx={{ width: '100%' }}
        iconMapping={{
          success: <CheckCircle fontSize="inherit" />,
          error: <ErrorIcon fontSize="inherit" />,
        }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      minHeight: '100vh',
      backgroundColor: 'background.default'
    }}>
      <BookingDetailDialog />
      <FilterDrawer />
      <SnackbarNotification />

      {/* Header Section */}
      <Box mb={3}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={2} gap={2}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
              color: color.firstColor, 
              fontWeight: 'bold',
            }}>
              Hotel Bookings
            </Typography>
            <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary">
              Manage and track all hotel reservations
            </Typography>
          </Box>
          
          <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }} width={{ xs: '100%', sm: 'auto' }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              sx={{ 
                backgroundColor: color.firstColor, 
                borderRadius: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
              fullWidth={isMobile}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              sx={{ borderRadius: 2 }}
              fullWidth={isMobile}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<Share />}
              sx={{ borderRadius: 2 }}
              fullWidth={isMobile}
            >
              Share
            </Button>
          </Box>
        </Box>

        {/* Quick Stats Cards - Responsive Grid */}
        <Grid container spacing={2} mb={3}>
          {/* Total Bookings */}
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              height: '100%'
            }}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Bookings
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: alpha(color.firstColor, 0.1), 
                    borderRadius: '50%', 
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Hotel sx={{ color: color.firstColor }} />
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={100} 
                  sx={{ 
                    mt: 1, 
                    backgroundColor: alpha(color.firstColor, 0.1),
                    '& .MuiLinearProgress-bar': { backgroundColor: color.firstColor }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Overnight Bookings */}
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              height: '100%'
            }}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
                      {stats.overnightBookings}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Overnight
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: alpha(theme.palette.primary.main, 0.1), 
                    borderRadius: '50%', 
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <NightsStay sx={{ color: theme.palette.primary.main }} />
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(stats.overnightBookings / stats.total) * 100 || 0} 
                  sx={{ 
                    mt: 1, 
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.primary.main }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Hourly Bookings */}
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              height: '100%'
            }}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
                      {stats.hourlyBookings}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Hourly
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1), 
                    borderRadius: '50%', 
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HourlyIcon sx={{ color: theme.palette.secondary.main }} />
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(stats.hourlyBookings / stats.total) * 100 || 0} 
                  sx={{ 
                    mt: 1, 
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.secondary.main }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Revenue */}
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              height: '100%'
            }}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
                      ₹{stats.revenue > 1000 ? `${(stats.revenue/1000).toFixed(1)}k` : stats.revenue}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Revenue
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: alpha(theme.palette.success.main, 0.1), 
                    borderRadius: '50%', 
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingUp sx={{ color: theme.palette.success.main }} />
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={70} 
                  sx={{ 
                    mt: 1, 
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.success.main }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filter Bar */}
        <Card sx={{ 
          mb: 3, 
          p: 2, 
          borderRadius: 3,
          backgroundColor: 'background.paper'
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search bookings, guests, rooms..."
                value={quickFilters.search}
                onChange={(e) => setQuickFilters({...quickFilters, search: e.target.value})}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { borderRadius: 2 }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: quickFilters.search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setQuickFilters({...quickFilters, search: ""})}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
                {/* Status Filter Chips */}
                <Box display="flex" gap={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                  {statusOptions.slice(0, isMobile ? 3 : 6).map(option => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      onClick={() => setQuickFilters({...quickFilters, status: option.value})}
                      color={quickFilters.status === option.value ? "primary" : "default"}
                      size="small"
                      sx={{ 
                        backgroundColor: quickFilters.status === option.value ? option.color : 'default',
                        color: quickFilters.status === option.value ? 'white' : 'default'
                      }}
                    />
                  ))}
                </Box>
                
                {/* Stay Type Filter Chips */}
                <Box display="flex" gap={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                  {stayTypeOptions.slice(0, isMobile ? 2 : 4).map(option => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      onClick={() => setQuickFilters({...quickFilters, stayType: option.value})}
                      color={quickFilters.stayType === option.value ? "primary" : "default"}
                      size="small"
                      icon={option.icon}
                      variant={quickFilters.stayType === option.value ? "filled" : "outlined"}
                    />
                  ))}
                </Box>
                
                <Badge badgeContent={0} color="primary">
                  <Button
                    variant="outlined"
                    onClick={() => setFilterDrawerOpen(true)}
                    startIcon={<FilterList />}
                    sx={{ borderRadius: 2 }}
                    size={isMobile ? "small" : "medium"}
                  >
                    {isMobile ? "Filters" : "More Filters"}
                  </Button>
                </Badge>
                
                <Button
                  variant="contained"
                  onClick={toggleAvailability}
                  startIcon={availability === "Available" ? <CheckCircle /> : <Cancel />}
                  sx={{ 
                    backgroundColor: availability === "Available" ? theme.palette.success.main : theme.palette.error.main,
                    borderRadius: 2,
                    minWidth: isMobile ? '120px' : 'auto'
                  }}
                  size={isMobile ? "small" : "medium"}
                >
                  {availability || "Loading..."}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>
      </Box>

      {/* Main Content - Mobile Card View or Desktop Table View */}
      {isMobile ? (
        // Mobile Card View
        <Box>
          {filteredBookings.length === 0 ? (
            <Card sx={{ 
              p: 4, 
              textAlign: 'center', 
              borderRadius: 3,
              backgroundColor: 'background.paper'
            }}>
              <Hotel sx={{ fontSize: 60, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="textSecondary" mb={1}>
                No bookings found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Try adjusting your filters
              </Typography>
            </Card>
          ) : (
            filteredBookings.map(booking => (
              <MobileBookingCard key={booking.id} booking={booking} />
            ))
          )}
        </Box>
      ) : (
        // Desktop Table View
        <Card sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: 'background.paper'
        }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer sx={{ 
              maxHeight: 600,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555',
              }
            }}>
              <Table stickyHeader size={isTablet ? "small" : "medium"}>
                <TableHead>
                  <TableRow sx={{ 
                    '& th': { 
                      backgroundColor: color.firstColor, 
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      whiteSpace: 'nowrap'
                    }
                  }}>
                    <TableCell>Guest</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Stay Type</TableCell>
                    <TableCell>Check-in</TableCell>
                    <TableCell>Check-out</TableCell>
                    <TableCell>Guests</TableCell>
                   
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredBookings.map((booking) => {
                    const isLoading = loadingIds.includes(booking.id);
                    const status = (booking.status || "").toLowerCase();
                    
                    return (
                      <TableRow key={booking.id} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar 
                              src={booking.avatar} 
                              alt={booking.geustName}
                              sx={{ width: 40, height: 40 }}
                            />
                            <Box>
                              <Typography fontWeight="medium" noWrap maxWidth="150px">
                                {booking.geustName || "Guest"}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" noWrap>
                                {booking.geustDetails?.phoneNumber || "-"}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box>
                            <Typography fontWeight="medium">{booking.roomNumber || "TBD"}</Typography>
                            <Typography variant="caption" color="textSecondary" noWrap>
                              {booking.roomType || "-"}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          {booking.stayType && (
                            <Chip 
                              label={booking.stayType} 
                              size="small"
                              sx={{ 
                                backgroundColor: stayTypeColor(booking.stayType),
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          )}
                        </TableCell>

                        <TableCell>
                          <Box>
                            <Typography>
                              {booking.checkInDate ? dayjs(booking.checkInDate).format("DD MMM") : "-"}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" noWrap>
                              {booking.checkInTime || ""}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box>
                            <Typography>
                              {booking.checkOutDate ? dayjs(booking.checkOutDate).format("DD MMM") : "-"}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" noWrap>
                              {booking.checkOutTime || ""}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography>
                            {(booking.adults || 0) + (booking.children || 0)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {booking.adults || 0}A {booking.children || 0}C
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip 
                            label={booking.status || "-"} 
                            sx={{ 
                              backgroundColor: statusColorFor(status),
                              fontWeight: 'bold',
                              textTransform: 'capitalize',
                              minWidth: '100px'
                            }} 
                          />
                        </TableCell>

                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setDetailDialogOpen(true);
                                }}
                                sx={{ 
                                  backgroundColor: 'action.hover',
                                  '&:hover': { backgroundColor: 'action.selected' }
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {canCheckIn(booking) && (
                              <Tooltip title="Check In">
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => updateBookingStatus(booking.id, "checkedIn")}
                                  disabled={isLoading}
                                  sx={{ 
                                    backgroundColor: color.firstColor,
                                    borderRadius: '20px',
                                    minWidth: '100px'
                                  }}
                                >
                                  {isLoading ? <CircularProgress size={16} /> : "Check In"}
                                </Button>
                              </Tooltip>
                            )}

                            {canCheckOut(booking) && (
                              <Tooltip title="Check Out">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => updateBookingStatus(booking.id, "checkedOut")}
                                  disabled={isLoading}
                                  sx={{ 
                                    borderColor: color.firstColor,
                                    color: color.firstColor,
                                    borderRadius: '20px',
                                    minWidth: '100px'
                                  }}
                                >
                                  {isLoading ? <CircularProgress size={16} /> : "Check Out"}
                                </Button>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredBookings.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">No bookings match your filters</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Zoom in>
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              backgroundColor: color.firstColor
            }}
            onClick={() => {/* Add new booking */}}
          >
            <LocalHotel />
          </Fab>
        </Zoom>
      )}
    </Box>
  );
};

// ---------------------- Main Page Component ----------------------
const HotelBookingsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"today" | "upcoming" | "past" | "all">("today");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    fetchHotelsWithStayTypes(setHotels, setSelectedHotelId);
  }, []);

  const getBookingsForHotel = async (hotelId: string) => {
    try {
      const payLoad = {
        data: { filter: "", hotelId },
        page: 0,
        pageSize: 500,
        order: [["createdAt", "ASC"]],
      };
      const res: any = await getAllBookingsofMyHotel(payLoad);
      const bookingsFromRes: Booking[] = res?.data?.data?.rows ?? [];

      // Add stay type based on booking data
      const enhancedBookings = bookingsFromRes.map(booking => ({
        ...booking,
        stayType: booking.stayType || 'Overnight', // Default to overnight if not specified
        duration: booking.duration || 0,
      }));

      const sorted = enhancedBookings.sort((a: Booking, b: Booking) => {
        const aDate = a.checkInDate ? dayjs(a.checkInDate) : dayjs("9999-12-31");
        const bDate = b.checkInDate ? dayjs(b.checkInDate) : dayjs("9999-12-31");
        return aDate.isBefore(bDate) ? -1 : aDate.isAfter(bDate) ? 1 : 0;
      });

      return sorted;
    } catch (err) {
      console.error("Failed to load bookings for hotel", err);
      return [];
    }
  };

  const fetchBookings = async (hotelId?: string | null) => {
    if (!hotelId) {
      setBookings([]);
      return;
    }
    setLoadingBookings(true);
    try {
      const data = await getBookingsForHotel(hotelId);
      setBookings(data);
    } catch (err) {
      console.error(err);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (selectedHotelId) fetchBookings(selectedHotelId);
  }, [selectedHotelId]);

  const handleCheckIn = (bookingId: string) => {
    if (selectedHotelId) fetchBookings(selectedHotelId);
  };

  const handleCheckOut = (bookingId: string) => {
    if (selectedHotelId) fetchBookings(selectedHotelId);
  };

  const handleViewDetails = (booking: Booking) => {
    console.log("View details for booking:", booking.id);
  };

  // Filter bookings based on selected tab
  const filteredBookingsByTab = useMemo(() => {
    const today = dayjs();
    switch (selectedTab) {
      case "today":
        return bookings.filter(b => 
          b.checkInDate && dayjs(b.checkInDate).isSame(today, 'day')
        );
      case "upcoming":
        return bookings.filter(b => 
          b.checkInDate && dayjs(b.checkInDate).isAfter(today, 'day')
        );
      case "past":
        return bookings.filter(b => 
          b.checkInDate && dayjs(b.checkInDate).isBefore(today, 'day')
        );
      default:
        return bookings;
    }
  }, [bookings, selectedTab]);

  // Mobile Hotel Selector Drawer
  const MobileHotelDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      sx={{
        '& .MuiDrawer-paper': { 
          width: '100%',
          maxWidth: 400,
          p: 2 
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Select Hotel</Typography>
        <IconButton onClick={() => setMobileDrawerOpen(false)}>
          <Close />
        </IconButton>
      </Box>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <TextField
          placeholder="Search hotels..."
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </FormControl>
      
      <Stack spacing={1}>
        {hotels.map((hotel) => (
          <Card 
            key={hotel.id} 
            sx={{ 
              border: selectedHotelId === hotel.id ? `2px solid ${color.firstColor}` : '1px solid',
              borderColor: 'divider',
              cursor: 'pointer'
            }}
            onClick={() => {
              setSelectedHotelId(hotel.id);
              setMobileDrawerOpen(false);
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Typography fontWeight="medium">{hotel.displayLabel}</Typography>
              {hotel.address && (
                <Typography variant="caption" color="textSecondary">
                  {hotel.address}
                </Typography>
              )}
              <Box display="flex" gap={1} mt={1}>
                {hotel.hasOvernight && (
                  <Chip 
                    label="Overnight" 
                    size="small" 
                    icon={<NightsStay fontSize="small" />}
                    variant="outlined"
                    sx={{ borderColor: theme.palette.primary.main }}
                  />
                )}
                {hotel.hasHourly && (
                  <Chip 
                    label="Hourly" 
                    size="small" 
                    icon={<HourlyIcon fontSize="small" />}
                    variant="outlined"
                    sx={{ borderColor: theme.palette.secondary.main }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Drawer>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: 'background.default'
    }}>
      <MobileHotelDrawer />
      
      {/* Hotel Selector Card - Desktop */}
      {!isMobile && (
        <Card sx={{ 
          mb: 3, 
          mx: { xs: 1, sm: 2, md: 3 },
          mt: { xs: 1, sm: 2, md: 3 },
          borderRadius: 3,
          backgroundColor: 'background.paper'
        }}>
          <CardContent>
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} gap={2}>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold" color={color.firstColor} mb={1}>
                  Select Hotel
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Hotel</InputLabel>
                  <Select
                    value={selectedHotelId ?? ""}
                    label="Hotel"
                    onChange={(e: SelectChangeEvent) => setSelectedHotelId(e.target.value as string)}
                    sx={{ borderRadius: 2 }}
                  >
                    {hotels.map((h) => (
                      <MenuItem key={h.id} value={h.id}>
                        <Box>
                          <Typography fontWeight="medium">{h.displayLabel}</Typography>
                          {h.address && (
                            <Typography variant="caption" color="textSecondary">
                              {h.address}
                            </Typography>
                          )}
                          <Box display="flex" gap={0.5} mt={0.5}>
                            {h.hasOvernight && (
                              <Chip 
                                label="Overnight" 
                                size="small" 
                                sx={{ 
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  height: 20,
                                  fontSize: '0.7rem'
                                }}
                              />
                            )}
                            {h.hasHourly && (
                              <Chip 
                                label="Hourly" 
                                size="small" 
                                sx={{ 
                                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                  color: theme.palette.secondary.main,
                                  height: 20,
                                  fontSize: '0.7rem'
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  onClick={() => selectedHotelId && fetchBookings(selectedHotelId)}
                  startIcon={<Refresh />}
                  sx={{ borderRadius: 2, height: '40px' }}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  sx={{ 
                    backgroundColor: color.firstColor,
                    borderRadius: 2,
                    height: '40px'
                  }}
                  startIcon={<Notifications />}
                >
                  Notifications
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Mobile Header with Hotel Selector */}
      {isMobile && (
        <Box sx={{ 
          p: 2, 
          backgroundColor: color.firstColor,
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton 
              size="small" 
              sx={{ color: 'white' }}
              onClick={() => setMobileDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Hotel Bookings
              </Typography>
              <Typography variant="caption">
                {hotels.find(h => h.id === selectedHotelId)?.displayLabel || "Select Hotel"}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            size="small" 
            sx={{ color: 'white' }}
            onClick={() => selectedHotelId && fetchBookings(selectedHotelId)}
          >
            <Refresh />
          </IconButton>
        </Box>
      )}

      {/* Tabs Navigation */}
      <Card sx={{ 
        mb: 3, 
        mx: { xs: 1, sm: 2, md: 3 },
        borderRadius: 3,
        backgroundColor: 'background.paper'
      }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <ToggleButtonGroup
            value={selectedTab}
            exclusive
            onChange={(_, value) => value && setSelectedTab(value)}
            fullWidth={isMobile}
            sx={{ 
              '& .MuiToggleButton-root': {
                borderRadius: 2,
                textTransform: 'none',
                py: { xs: 0.75, sm: 1 }
              }
            }}
          >
            <ToggleButton value="today">
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarToday fontSize="small" />
                {!isMobile && <Typography>Today</Typography>}
                <Chip 
                  label={bookings.filter(b => b.checkInDate && dayjs(b.checkInDate).isSame(dayjs(), 'day')).length}
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Box>
            </ToggleButton>
            <ToggleButton value="upcoming">
              <Box display="flex" alignItems="center" gap={1}>
                <Schedule fontSize="small" />
                {!isMobile && <Typography>Upcoming</Typography>}
                <Chip 
                  label={bookings.filter(b => b.checkInDate && dayjs(b.checkInDate).isAfter(dayjs(), 'day')).length}
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Box>
            </ToggleButton>
            <ToggleButton value="past">
              <Box display="flex" alignItems="center" gap={1}>
                <EventBusy fontSize="small" />
                {!isMobile && <Typography>Past</Typography>}
                <Chip 
                  label={bookings.filter(b => b.checkInDate && dayjs(b.checkInDate).isBefore(dayjs(), 'day')).length}
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Box>
            </ToggleButton>
            <ToggleButton value="all">
              <Box display="flex" alignItems="center" gap={1}>
                <Hotel fontSize="small" />
                {!isMobile && <Typography>All</Typography>}
                <Chip 
                  label={bookings.length}
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loadingBookings ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: color.firstColor }} />
        </Box>
      ) : (
        <BookingTable 
          bookings={filteredBookingsByTab}
          hotelId={selectedHotelId ?? undefined}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Empty State */}
      {!loadingBookings && filteredBookingsByTab.length === 0 && (
        <Card sx={{ 
          mx: { xs: 1, sm: 2, md: 3 },
          mb: 3,
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          backgroundColor: 'background.paper'
        }}>
          <Box sx={{ maxWidth: 400, mx: 'auto' }}>
            <Hotel sx={{ fontSize: 80, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="textSecondary" mb={1}>
              No bookings found
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              {selectedTab === "today" 
                ? "No check-ins scheduled for today"
                : selectedTab === "upcoming"
                ? "No upcoming bookings"
                : selectedTab === "past"
                ? "No past bookings"
                : "No bookings available for this hotel"}
            </Typography>
            <Button
              variant="contained"
              sx={{ 
                backgroundColor: color.firstColor, 
                borderRadius: 2,
                px: 3
              }}
              // startIcon={<Add />}
            >
              Create New Booking
            </Button>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default HotelBookingsPage;