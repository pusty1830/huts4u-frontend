import React, { useEffect, useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  Chip,
  Paper,
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
} from "@mui/material";
import {
  Search,
  FilterList,
  Clear,
  Download,
  CalendarToday,
  AccountBalanceWallet,
  Paid,
  Pending,
  Refresh,
  Visibility,
  ArrowDownward,
  ArrowUpward,
  Event,
} from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import color from "../../components/color";
import { getAllHotels, getAllHotelRevenue, getAllRooms } from "../../services/services"; // Added getAllRooms
import { getUserId } from "../../services/axiosClient";

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

interface Hotel { 
  id: number; 
  propertyName?: string; 
  name?: string; 
  [key: string]: any; 
}

interface HotelOption { 
  id: string; 
  name: string;
  displayLabel: string; // Added displayLabel
}

interface HotelStayTypes {
  [hotelId: number]: string[];
}

// Interface for bookings included in payment
interface BookingIncluded {
  id: number;
  bookingDate: string;
  // Add other booking fields as needed
}

interface Payment {
  id: string;
  payerName?: string;
  payerAvatar?: string;
  netAmountPaise?: number;
  netAmountRupees?: number;
  currency?: string;
  createdAt?: string;
  status?: string;
  paymentMethod?: string;
  bookingId?: string;
  // New fields based on your data structure
  bookingsIncluded?: BookingIncluded[] | string; // Could be stringified JSON
  bookingDate?: string; // Extracted from bookingsIncluded
}

const LOGO_URL = "https://huts44u.s3.ap-south-1.amazonaws.com/hutlogo-removebg-preview.png";
const LOGO_LINK = "https://huts4u.example";

const paymentStatusColor = (s?: string) => {
  const st = (s || "").toLowerCase();
  if (st === "paid" || st === "completed") return "rgba(163,228,215,0.9)";
  if (st === "pending" || st === "processing") return "rgba(255,243,205,0.95)";
  if (st === "refunded" || st === "failed" || st === "cancelled") return "rgba(245,183,177,0.95)";
  return "rgba(0,0,0,0.06)";
};

// Helper function to get hotel name
const getHotelName = (hotel: Hotel | undefined): string => {
  return hotel?.propertyName || hotel?.name || "Unknown Hotel";
};

// Updated fetchHotels to include stay types
const fetchHotelsWithStayTypes = async (
  setHotels: React.Dispatch<React.SetStateAction<HotelOption[]>>, 
  setSelected: React.Dispatch<React.SetStateAction<string | null>>,
  setHotelStayTypes: React.Dispatch<React.SetStateAction<HotelStayTypes>>
) => {
  try {
    const payload = { data: { filter: "", userId: getUserId() }, page: 0, pageSize: 50, order: [["createdAt", "ASC"]] };
    const res: any = await getAllHotels(payload);
    if (res?.data?.data?.rows) {
      const hotelList = res.data.data.rows;
      
      // Fetch rooms to get stay types
      const roomsPayload = { data: { filter: "" }, page: 0, pageSize: 1000, order: [["createdAt", "ASC"]] };
      const roomsRes: any = await getAllRooms(roomsPayload);
      const roomList = roomsRes?.data?.data?.rows || roomsRes?.data?.rows || roomsRes?.data || [];
      
      // Create stay types map
      const stayTypesMap: HotelStayTypes = {};
      
      hotelList.forEach((hotel: Hotel) => {
        const hotelRooms = roomList.filter((room: any) => room.hotelId === hotel.id);
        const stayTypesSet = new Set<string>();
        
        hotelRooms.forEach((room: any) => {
          if (room.stayType) {
            stayTypesSet.add(room.stayType);
          }
        });
        
        stayTypesMap[hotel.id] = Array.from(stayTypesSet);
      });
      
      // Create hotel options with display labels
      const list = hotelList.map((h: any) => { 
        const stayTypes = stayTypesMap[h.id] || [];
        let displayName = h.propertyName ?? h.name ?? `Hotel ${h.id}`;
        
        // Add stay types to display name if available
        if (stayTypes.length > 0) {
          const stayTypeLabel = stayTypes.length === 2 
            ? "Overnight & Hourly" 
            : stayTypes[0];
          displayName = `${displayName} (${stayTypeLabel})`;
        }
        
        return { 
          id: h.id, 
          name: h.propertyName ?? h.name ?? `Hotel ${h.id}`,
          displayLabel: displayName
        };
      });
      
      setHotels(list);
      setHotelStayTypes(stayTypesMap);
      if (list.length) setSelected(prev => prev || list[0].id);
    }
  } catch (err) {
    console.error("fetchHotels err", err);
  }
};

// Helper function to extract booking date from bookingsIncluded
const extractBookingDate = (payment: any): string | null => {
  try {
    // Check if bookingsIncluded exists
    if (!payment.bookingsIncluded) {
      return payment.bookingDate || payment.createdAt || null;
    }
    
    // If it's a string, parse it
    let bookings: BookingIncluded[] = [];
    if (typeof payment.bookingsIncluded === 'string') {
      bookings = JSON.parse(payment.bookingsIncluded);
    } else if (Array.isArray(payment.bookingsIncluded)) {
      bookings = payment.bookingsIncluded;
    }
    
    // Get the first booking's date if available
    if (bookings.length > 0 && bookings[0].bookingDate) {
      return bookings[0].bookingDate;
    }
    
    // Fallback to other date fields
    return payment.bookingDate || payment.createdAt || null;
  } catch (err) {
    console.error("Error extracting booking date:", err);
    return payment.bookingDate || payment.createdAt || null;
  }
};

// Updated groupKeyFor to use booking date
const groupKeyFor = (payment: any) => {
  const bookingDate = extractBookingDate(payment);
  
  if (!bookingDate) return "No Date";
  
  const d = dayjs(bookingDate);
  if (d.isSame(dayjs(), "day")) return "Today";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return d.format("DD MMM YYYY");
};

// Format date for display
const formatBookingDate = (payment: any): string => {
  const bookingDate = extractBookingDate(payment);
  if (!bookingDate) return "-";
  return dayjs(bookingDate).format("DD MMM YYYY");
};

// Format time for display (still use createdAt for time if needed)
const formatPaymentTime = (payment: any): string => {
  if (payment.createdAt) {
    return dayjs(payment.createdAt).format("hh:mm A");
  }
  return "-";
};

// Status options for filter
const statusOptions = [
  { value: "all", label: "All Status", icon: <FilterList /> },
  { value: "paid", label: "Paid", icon: <Paid /> },
  { value: "pending", label: "Pending", icon: <Pending /> },
  { value: "refunded", label: "Refunded", icon: <AccountBalanceWallet /> },
  { value: "failed", label: "Failed", icon: <Clear /> },
];

// Date range options
const dateRangeOptions = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "Last 3 Months" },
];

const HotelPaymentsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [paymentDetailOpen, setPaymentDetailOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [hotelStayTypes, setHotelStayTypes] = useState<HotelStayTypes>({});

  useEffect(() => { 
    fetchHotelsWithStayTypes(setHotels, setSelectedHotelId, setHotelStayTypes); 
  }, []);

  const fetchPayments = async (hotelId?: string | null) => {
    if (!hotelId) { 
      setPayments([]); 
      return; 
    }
    setLoading(true);
    try {
      const payload = {
        data: { filter: "", hotelId },
        page: 0,
        pageSize: 500,
        order: [["createdAt", "DESC"]],
      };
      const res: any = await getAllHotelRevenue(payload);
      const rows: any[] = res?.data?.data?.rows ?? [];
      console.log(rows)
      const filteredRows = rows.filter(
        (r) => (r.status || "").toLowerCase() !== "cancelled"
      );

      // Process payments to extract booking dates
      const normalized: Payment[] = filteredRows.map((r) => {
        const paise = Number(r.netAmountPaise ?? r.net_amount_paise ?? r.amount_paise) || 0;
        
        // Extract booking date from bookingsIncluded
        const bookingDate = extractBookingDate(r);
        
        return {
          ...r,
          netAmountPaise: paise,
          netAmountRupees: paise / 100,
          currency: r.currency ?? "INR",
          status: r.status?.toLowerCase(),
          paymentMethod: r.paymentMethod,
          bookingId: r.bookingId,
          bookingsIncluded: r.bookingsIncluded,
          bookingDate: bookingDate, // Add extracted booking date
        } as Payment;
      });

      setPayments(normalized);
    } catch (err) {
      console.error("fetchPayments err", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (selectedHotelId) fetchPayments(selectedHotelId); 
  }, [selectedHotelId]);
  useEffect(() => { 
    if (selectedHotelId) fetchPayments(selectedHotelId); 
  }, [selectedHotelId]);

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.payerName?.toLowerCase().includes(query)) ||
        (p.bookingId?.toLowerCase().includes(query)) ||
        (p.paymentMethod?.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(p => 
        (p.status || "").toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Date range filter - NOW USING BOOKING DATE
    if (dateRange !== "all") {
      const now = dayjs();
      filtered = filtered.filter(p => {
        const bookingDate = extractBookingDate(p);
        if (!bookingDate) return false;
        const paymentDate = dayjs(bookingDate);
        
        switch(dateRange) {
          case "today":
            return paymentDate.isSame(now, 'day');
          case "yesterday":
            return paymentDate.isSame(now.subtract(1, 'day'), 'day');
          case "week":
            return paymentDate.isAfter(now.subtract(7, 'day'));
          case "month":
            return paymentDate.isAfter(now.subtract(1, 'month'));
          case "quarter":
            return paymentDate.isAfter(now.subtract(3, 'month'));
          default:
            return true;
        }
      });
    }

    // Amount range filter
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(p => (p.netAmountRupees || 0) >= min);
      }
    }
    
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter(p => (p.netAmountRupees || 0) <= max);
      }
    }

    // Sorting - NOW USING BOOKING DATE for date sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "date") {
        const dateA = extractBookingDate(a) ? new Date(extractBookingDate(a)!).getTime() : 0;
        const dateB = extractBookingDate(b) ? new Date(extractBookingDate(b)!).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortBy === "amount") {
        const amountA = a.netAmountRupees || 0;
        const amountB = b.netAmountRupees || 0;
        comparison = amountA - amountB;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [payments, searchQuery, selectedStatus, dateRange, minAmount, maxAmount, sortBy, sortOrder]);

  // Statistics
  const statistics = useMemo(() => {
    const total = filteredPayments.length;
    const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.netAmountRupees || 0), 0);
    const paidCount = filteredPayments.filter(p => p.status === 'paid' || p.status === 'completed').length;
    const pendingCount = filteredPayments.filter(p => p.status === 'pending' || p.status === 'processing').length;
    
    return {
      total,
      totalAmount,
      paidCount,
      pendingCount,
      avgAmount: total > 0 ? totalAmount / total : 0,
    };
  }, [filteredPayments]);

  // Group payments by booking date
  const grouped = useMemo(() => {
    const map = new Map<string, Payment[]>();
    for (const p of filteredPayments) {
      const key = groupKeyFor(p);
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }

    const today = map.get("Today") ?? [];
    const yesterday = map.get("Yesterday") ?? [];
    const noDate = map.get("No Date") ?? [];

    const otherEntries = Array.from(map.entries())
      .filter(([k]) => k !== "Today" && k !== "Yesterday" && k !== "No Date")
      .sort((a, b) => {
        const da = dayjs(a[0], "DD MMM YYYY");
        const db = dayjs(b[0], "DD MMM YYYY");
        return db.isAfter(da) ? 1 : db.isBefore(da) ? -1 : 0;
      });

    const result: Array<[string, Payment[]]> = [];
    if (today.length) result.push(["Today", today]);
    if (yesterday.length) result.push(["Yesterday", yesterday]);
    result.push(...otherEntries);
    if (noDate.length) result.push(["No Date", noDate]);
    return result;
  }, [filteredPayments]);

  // Handle filter reset
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setDateRange("all");
    setMinAmount("");
    setMaxAmount("");
    setSortBy("date");
    setSortOrder("desc");
  };

  // Handle sort toggle
  const handleSort = (field: "date" | "amount") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Filter badge count
  const activeFilterCount = [
    searchQuery ? 1 : 0,
    selectedStatus !== "all" ? 1 : 0,
    dateRange !== "all" ? 1 : 0,
    minAmount ? 1 : 0,
    maxAmount ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Parse bookings included for display
  const parseBookingsIncluded = (payment: Payment): BookingIncluded[] => {
    try {
      if (!payment.bookingsIncluded) return [];
      
      if (typeof payment.bookingsIncluded === 'string') {
        return JSON.parse(payment.bookingsIncluded);
      } else if (Array.isArray(payment.bookingsIncluded)) {
        return payment.bookingsIncluded;
      }
      return [];
    } catch (err) {
      console.error("Error parsing bookingsIncluded:", err);
      return [];
    }
  };

  // Mobile table view component
  const MobilePaymentCard = ({ payment }: { payment: Payment }) => {
    const bookingDate = formatBookingDate(payment);
    const paymentTime = formatPaymentTime(payment);
    const bookings = parseBookingsIncluded(payment);
    
    return (
      <Card sx={{ mb: 2, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar src={LOGO_URL} alt="HUTS4U" />
            <Box>
              <Typography fontWeight="bold" fontSize="14px">
                HUTS4U
              </Typography>
              {payment.bookingId && (
                <Typography variant="caption" color="textSecondary">
                  Booking: {payment.bookingId}
                </Typography>
              )}
            </Box>
          </Box>
          <Chip 
            label={payment.status || "-"} 
            size="small"
            sx={{ 
              backgroundColor: paymentStatusColor(payment.status), 
              textTransform: "capitalize",
              fontWeight: 700 
            }} 
          />
        </Box>
        
        <Box mb={1}>
          <Typography variant="body2" color="textSecondary">
            Amount: ₹{(payment.netAmountRupees || 0).toFixed(2)} {payment.currency || "INR"}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Booking Date: {bookingDate}
          </Typography>
          {bookings.length > 0 && (
            <Typography variant="caption" color="textSecondary">
              {bookings.length} booking{bookings.length > 1 ? 's' : ''} included
            </Typography>
          )}
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="textSecondary">
            {paymentTime} • {bookingDate}
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => {
              setSelectedPayment(payment);
              setPaymentDetailOpen(true);
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Box>
      </Card>
    );
  };

  // Payment Detail Dialog
  const PaymentDetailDialog = () => {
    const bookings = selectedPayment ? parseBookingsIncluded(selectedPayment) : [];
    const bookingDate = selectedPayment ? formatBookingDate(selectedPayment) : "-";
    
    return (
      <Dialog 
        open={paymentDetailOpen} 
        onClose={() => setPaymentDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Payment Details
          {selectedPayment?.status && (
            <Chip 
              label={selectedPayment.status} 
              sx={{ 
                backgroundColor: paymentStatusColor(selectedPayment.status),
                textTransform: "capitalize",
                fontWeight: 700,
                ml: 2
              }} 
              size="small"
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar src={LOGO_URL} sx={{ width: 60, height: 60 }} />
                <Box>
                  <Typography variant="h6">HUTS4U</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Payment ID: {selectedPayment.id}
                  </Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Amount</Typography>
                <Typography variant="h5" fontWeight="bold">
                  ₹{(selectedPayment.netAmountRupees || 0).toFixed(2)} {selectedPayment.currency || "INR"}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Event fontSize="small" />
                      Booking Date
                    </Box>
                  </Typography>
                  <Typography variant="body1">
                    {bookingDate}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Payment Method</Typography>
                  <Typography variant="body1">
                    {selectedPayment.paymentMethod || "N/A"}
                  </Typography>
                </Grid>
                
                {bookings.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Bookings Included ({bookings.length})
                    </Typography>
                    <Box sx={{ maxHeight: 100, overflowY: 'auto', mt: 1 }}>
                      {bookings.map((booking, index) => (
                        <Box 
                          key={booking.id || index} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            p: 0.5,
                            borderBottom: '1px solid #f0f0f0',
                            '&:last-child': { borderBottom: 'none' }
                          }}
                        >
                          <Typography variant="body2">Booking #{booking.id}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {dayjs(booking.bookingDate).format("DD MMM YYYY")}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                )}
                
                {selectedPayment.bookingId && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Main Booking ID</Typography>
                    <Typography variant="body1">{selectedPayment.bookingId}</Typography>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Transaction Date</Typography>
                  <Typography variant="body1">
                    {selectedPayment.createdAt 
                      ? dayjs(selectedPayment.createdAt).format("DD MMM YYYY, hh:mm A")
                      : "-"
                    }
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "100vh", backgroundColor: color.thirdColor }}>
      <PaymentDetailDialog />
      
      {/* Header Section */}
      <Box mb={3}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={2} gap={2}>
          <Typography variant="h5" sx={{ color: color.firstColor, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
            Hotel Payments
          </Typography>
          
          <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }} width={{ xs: '100%', sm: 'auto' }}>
            <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }} size="small">
              <InputLabel>Select Hotel</InputLabel>
              <Select 
                value={selectedHotelId ?? ""} 
                label="Select Hotel" 
                onChange={(e: SelectChangeEvent) => setSelectedHotelId(e.target.value as string)}
              >
                {hotels.map(h => (
                  <MenuItem value={h.id} key={h.id}>
                    <Typography noWrap>{h.displayLabel}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              onClick={() => selectedHotelId && fetchPayments(selectedHotelId)}
              size="small"
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ p: 2, textAlign: 'center', backgroundColor: color.firstColor, color: 'white' }}>
              <Typography variant="h6" fontWeight="bold">
                {statistics.total}
              </Typography>
              <Typography variant="body2">Total Payments</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(163,228,215,0.9)' }}>
              <Typography variant="h6" fontWeight="bold">
                ₹{statistics.totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2">Total Amount</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(163,228,215,0.7)' }}>
              <Typography variant="h6" fontWeight="bold">
                {statistics.paidCount}
              </Typography>
              <Typography variant="body2">Successful</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(255,243,205,0.95)' }}>
              <Typography variant="h6" fontWeight="bold">
                {statistics.pendingCount}
              </Typography>
              <Typography variant="body2">Pending</Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filter Bar */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search payments or booking IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery("")}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
                <ToggleButtonGroup
                  value={selectedStatus}
                  exclusive
                  onChange={(_, value) => value && setSelectedStatus(value)}
                  size="small"
                >
                  {statusOptions.map(option => (
                    <ToggleButton key={option.value} value={option.value}>
                      {option.icon}
                      <Box component="span" sx={{ ml: 0.5, display: { xs: 'none', sm: 'inline' } }}>
                        {option.label}
                      </Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    startAdornment={<CalendarToday fontSize="small" sx={{ mr: 1 }} />}
                    sx={{ '.MuiSelect-select': { py: 0.8 } }}
                  >
                    {dateRangeOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Badge badgeContent={activeFilterCount} color="primary">
                  <Button
                    variant="outlined"
                    onClick={() => setFilterDrawerOpen(true)}
                    startIcon={<FilterList />}
                    size="small"
                  >
                    {isMobile ? "Filters" : "More Filters"}
                  </Button>
                </Badge>
                
                {activeFilterCount > 0 && (
                  <Button
                    variant="text"
                    onClick={handleResetFilters}
                    size="small"
                    startIcon={<Clear />}
                  >
                    Clear
                  </Button>
                )}
                
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  size="small"
                  sx={{ backgroundColor: color.firstColor }}
                >
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>
      </Box>

      {/* Filter Drawer for Mobile */}
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
          <Typography variant="h6">Filter Payments</Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <Clear />
          </IconButton>
        </Box>
        
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Date Range (Booking Date)</InputLabel>
            <Select
              value={dateRange}
              label="Date Range (Booking Date)"
              onChange={(e) => setDateRange(e.target.value)}
            >
              {dateRangeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min Amount (₹)"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                type="number"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Amount (₹)"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                type="number"
              />
            </Grid>
          </Grid>
          
          <Box>
            <Typography variant="subtitle2" mb={1}>Sort By</Typography>
            <ToggleButtonGroup
              fullWidth
              value={sortBy}
              exclusive
              onChange={(_, value) => value && setSortBy(value)}
            >
              <ToggleButton value="date" onClick={() => handleSort("date")}>
                Booking Date {sortBy === "date" && (sortOrder === "asc" ? <ArrowUpward /> : <ArrowDownward />)}
              </ToggleButton>
              <ToggleButton value="amount" onClick={() => handleSort("amount")}>
                Amount {sortBy === "amount" && (sortOrder === "asc" ? <ArrowUpward /> : <ArrowDownward />)}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <Box display="flex" gap={2} mt={2}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={handleResetFilters}
            >
              Reset All
            </Button>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={() => setFilterDrawerOpen(false)}
              sx={{ backgroundColor: color.firstColor }}
            >
              Apply Filters
            </Button>
          </Box>
        </Stack>
      </Drawer>

      {/* Results Count */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body2" color="textSecondary">
          Showing {filteredPayments.length} of {payments.length} payments
          <Tooltip title="Grouped by booking date from bookingsIncluded">
            <IconButton size="small" sx={{ ml: 1 }}>
              <Event fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        <Typography variant="subtitle1" fontWeight={700}>
          Total: ₹{statistics.totalAmount.toFixed(2)}
        </Typography>
      </Box>

      {/* Payments Table/List */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress sx={{ color: color.firstColor }} />
        </Box>
      ) : filteredPayments.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">No payments found for this hotel.</Typography>
          {payments.length > 0 && (
            <Typography variant="body2" color="textSecondary" mt={1}>
              Try adjusting your filters
            </Typography>
          )}
        </Card>
      ) : isMobile ? (
        // Mobile Card View
        <Box>
          {grouped.map(([dateLabel, list]) => (
            <Box key={dateLabel} mb={3}>
              <Typography 
                variant="subtitle1" 
                fontWeight="bold" 
                sx={{ 
                  backgroundColor: dateLabel === "Today" ? color.firstColor : "#f5f5f5",
                  color: dateLabel === "Today" ? "#fff" : "#000",
                  p: 1,
                  borderRadius: 1,
                  mb: 1
                }}
              >
                {dateLabel} • {list.length} payments • ₹{list.reduce((s, p) => s + (p.netAmountRupees || 0), 0).toFixed(2)}
              </Typography>
              {list.map(payment => (
                <MobilePaymentCard key={payment.id} payment={payment} />
              ))}
            </Box>
          ))}
        </Box>
      ) : (
        // Desktop Table View
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", width: { xs: 'auto', md: '25%' } }}>
                      Payer / Booking
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: { xs: 'auto', md: '15%' } }}>
                      <Button 
                        size="small" 
                        onClick={() => handleSort("amount")}
                        endIcon={sortBy === "amount" && (sortOrder === "asc" ? <ArrowUpward /> : <ArrowDownward />)}
                        sx={{ fontWeight: 'bold', textTransform: 'none' }}
                      >
                        Amount (₹)
                      </Button>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: { xs: 'auto', md: '15%' } }}>
                      <Button 
                        size="small" 
                        onClick={() => handleSort("date")}
                        endIcon={sortBy === "date" && (sortOrder === "asc" ? <ArrowUpward /> : <ArrowDownward />)}
                        sx={{ fontWeight: 'bold', textTransform: 'none' }}
                      >
                        Booking Date
                      </Button>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: { xs: 'auto', md: '15%' } }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: { xs: 'auto', md: '10%' } }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {grouped.map(([dateLabel, list]) => {
                    const dateSubtotal = list.reduce((s, p) => s + (p.netAmountRupees || 0), 0);
                    return (
                      <React.Fragment key={dateLabel}>
                        <TableRow>
                          <TableCell colSpan={5} sx={{ 
                            background: dateLabel === "Today" ? color.firstColor : "#f5f5f5", 
                            color: dateLabel === "Today" ? "#fff" : "#000", 
                            py: 1 
                          }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography sx={{ fontWeight: 700 }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Event fontSize="small" />
                                  {dateLabel} (Booking Date)
                                </Box>
                              </Typography>
                              <Typography variant="body2" sx={{ opacity: 0.95 }}>
                                {list.length} payment(s) • Subtotal: ₹{dateSubtotal.toFixed(2)}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>

                        {list.map(p => {
                          const bookings = parseBookingsIncluded(p);
                          return (
                            <TableRow key={p.id} hover>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Avatar src={LOGO_URL} alt="HUTS4U" />
                                  <Box>
                                    <Typography sx={{ fontWeight: 600 }}>HUTS4U</Typography>
                                    {p.bookingId && (
                                      <Typography variant="caption" color="textSecondary">
                                        Booking: {p.bookingId}
                                      </Typography>
                                    )}
                                    {bookings.length > 0 && (
                                      <Tooltip 
                                        title={
                                          <Box>
                                            {bookings.map((booking, idx) => (
                                              <div key={booking.id || idx}>
                                                Booking #{booking.id}: {dayjs(booking.bookingDate).format("DD MMM YYYY")}
                                              </div>
                                            ))}
                                          </Box>
                                        }
                                      >
                                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', cursor: 'pointer' }}>
                                          {bookings.length} booking{bookings.length > 1 ? 's' : ''} included
                                        </Typography>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>

                              <TableCell>
                                <Typography fontWeight="bold">
                                  ₹{(p.netAmountRupees || 0).toFixed(2)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {p.currency || "INR"}
                                </Typography>
                              </TableCell>
                              
                              <TableCell>
                                <Typography>
                                  {formatBookingDate(p)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {formatPaymentTime(p)}
                                </Typography>
                              </TableCell>

                              <TableCell>
                                <Chip 
                                  label={p.status || "-"} 
                                  sx={{ 
                                    backgroundColor: paymentStatusColor(p.status), 
                                    textTransform: "capitalize", 
                                    fontWeight: 700 
                                  }} 
                                />
                                {p.paymentMethod && (
                                  <Typography variant="caption" display="block" color="textSecondary">
                                    {p.paymentMethod}
                                  </Typography>
                                )}
                              </TableCell>
                              
                              <TableCell>
                                <IconButton 
                                  size="small" 
                                  onClick={() => {
                                    setSelectedPayment(p);
                                    setPaymentDetailOpen(true);
                                  }}
                                >
                                  <Visibility />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default HotelPaymentsPage;