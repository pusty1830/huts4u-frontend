import React, { useEffect, useState } from "react";
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
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import dayjs from "dayjs";
import color from "../../components/color"; // adjust path
import {
  getAllHotels,
  getAllBookingsofMyHotel,
  updateBookings,
  getAllRooms,
} from "../../services/services"; // adjust import path

// ---------------------- Types ----------------------
interface HotelOption {
  id: string;
  name: string;
  displayName: string;
  stayTypes: string[];
  totalRooms: number;
}

interface Booking {
  id: string;
  avatar?: string;
  guestName?: string;
  phoneNumber?: string;
  guestDetails?: any;
  checkInDate?: string; // ISO string expected
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  status?: string;
  statusColor?: string;
  hotelId?: string;
  hotelName?: string;
}

// ------------------- BookingTable (grouped by check-in date) -------------------
const BookingTable = ({ bookings = [] }: { bookings: Booking[] }) => {
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  const setLoadingForId = (id: string, loading: boolean) => {
    setLoadingIds((prev) => (loading ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  // Helper to map status -> color
  const statusColorFor = (status: string | undefined) => {
    const s = (status || "").toLowerCase();
    if (s === "checkedin") return "rgba(163,228,215,0.8)";
    if (s === "checkedout") return "rgba(245,183,177,0.9)";
    if (s === "confirmed") return "rgba(204,229,255,0.9)";
    if (s === "pending") return "rgba(255,243,205,0.95)";
    return "rgba(0,0,0,0.08)";
  };

  const updateBookingStatus = async (bookingId: string, newStatus: "checkedIn" | "checkedOut") => {
    const prevBookings = [...bookings]; // snapshot for rollback
    setLoadingForId(bookingId, true);

    const updatedBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: newStatus, statusColor: statusColorFor(newStatus) } : b
    );

    try {
      // Update booking status in backend (this should be implemented)
      await updateBookings(bookingId, { status: newStatus });
    } catch (err) {
      console.error("Failed to update booking status", err);
    } finally {
      setLoadingForId(bookingId, false);
    }
  };

  return (
    <TableContainer component={Paper} sx={{ marginTop: 2 }}>
      <Table aria-label="bookings table">
        <TableHead>
          <TableRow>
            {[
              "Booking ID",
              "Guest Name",
              "Phone Number",
              "Hotel",
              "Check-in Date",
              "Check-out Date",
              "Status",
              "Actions",
            ].map((header) => (
              <TableCell key={header} sx={{ fontWeight: "bold", color: "gray" }}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>{booking.id}</TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar src={booking.avatar} alt={booking.guestName ?? "guest"} />
                  <Typography>{booking.guestName ?? "Guest"}</Typography>
                </Box>
              </TableCell>
              <TableCell>{booking.guestDetails?.phoneNumber ?? "-"}</TableCell>
              <TableCell>{booking.hotelName ?? "-"}</TableCell>
              <TableCell>{booking.checkInDate ? dayjs(booking.checkInDate).format("DD MMM YYYY") : "-"}</TableCell>
              <TableCell>{booking.checkOutDate ? dayjs(booking.checkOutDate).format("DD MMM YYYY") : "-"}</TableCell>
              <TableCell>
                <Chip
                  label={booking.status ?? "unknown"}
                  sx={{
                    backgroundColor: booking.statusColor ?? statusColorFor(booking.status),
                    color: "#000",
                    fontWeight: "bold",
                    textTransform: "capitalize",
                  }}
                />
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1} alignItems="center">
                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      background: color.firstColor,
                      textTransform: "none",
                      borderRadius: "20px",
                    }}
                    disabled={booking.status === "checkedin"}
                    onClick={() => updateBookingStatus(booking.id, "checkedIn")}
                  >
                    Check-In
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      color: color.firstColor,
                      borderColor: color.firstColor,
                      textTransform: "none",
                      borderRadius: "20px",
                    }}
                    disabled={booking.status === "checkedout"}
                    onClick={() => updateBookingStatus(booking.id, "checkedOut")}
                  >
                    Check-Out
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ---------------------- Page: AllHotelBookingsPage ----------------------
const AllHotelBookingsPage: React.FC = () => {
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all'); // 'all' or 'single'

  // Fetch Hotels with pagination
  useEffect(() => {
    const fetchHotelsAndRooms = async () => {
      setLoadingHotels(true);
      try {
        const payload = {
          data: { filter: "" },
          page: 0,
          pageSize: 100000,
          order: [["createdAt", "DESC"]],
        };

        const [hotelsRes, roomsRes] = await Promise.all([
          getAllHotels(payload),
          getAllRooms(payload)
        ]);

        const hotelsData = hotelsRes?.data?.data?.rows || [];
        const roomsData = roomsRes?.data?.data?.rows || [];
        
        setRooms(roomsData);

        // Process hotels with stay types
        const processedHotels = hotelsData.map((hotel: any) => {
          const hotelRooms = roomsData.filter((room: any) => room.hotelId === hotel.id);
          const stayTypes = Array.from(new Set(hotelRooms.map((room: any) => room.stayType))).filter(Boolean);
          
          // Create display name with stay types
          let displayName = hotel.propertyName ?? hotel.name ?? `Hotel ${hotel.id}`;
          if (stayTypes.length > 0) {
            // Sort stay types for consistent display
            stayTypes.sort();
            displayName = `${displayName} (${stayTypes.join(", ")})`;
          }
          
          return {
            id: hotel.id,
            name: hotel.propertyName ?? hotel.name ?? `Hotel ${hotel.id}`,
            displayName: displayName,
            stayTypes: stayTypes,
            totalRooms: hotelRooms.length,
          };
        });

        setHotels(processedHotels);
      } catch (err) {
        console.error("Failed to fetch hotels:", err);
      } finally {
        setLoadingHotels(false);
      }
    };

    fetchHotelsAndRooms();
  }, []);

  // Fetch bookings for the selected hotel
  const fetchBookingsForHotel = async (hotelId: string) => {
    if (!hotelId) return;
    setLoadingBookings(true);
    const payload = {
      data: { filter: "", hotelId },
      page: 0,
      pageSize: 100000,
      order: [["createdAt", "DESC"]],
    };
    try {
      const res = await getAllBookingsofMyHotel(payload);
      const hotel = hotels.find(h => h.id === hotelId);
      const bookingsWithHotel = (res?.data?.data?.rows ?? []).map((booking: any) => ({
        ...booking,
        hotelId,
        hotelName: hotel?.name
      }));
      setBookings(bookingsWithHotel);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch ALL bookings from all hotels
  const fetchAllBookings = async () => {
    setLoadingBookings(true);
    try {
      // We need to fetch bookings for each hotel and combine them
      const allBookings: Booking[] = [];
      
      // Fetch bookings for each hotel
      for (const hotel of hotels) {
        try {
          const payload = {
            data: { filter: "", hotelId: hotel.id },
            page: 0,
            pageSize: 100000,
            order: [["createdAt", "DESC"]],
          };
          const res = await getAllBookingsofMyHotel(payload);
          const hotelBookings = (res?.data?.data?.rows ?? []).map((booking: any) => ({
            ...booking,
            hotelId: hotel.id,
            hotelName: hotel.name
          }));
          allBookings.push(...hotelBookings);
        } catch (error) {
          console.error(`Failed to fetch bookings for hotel ${hotel.id}:`, error);
        }
      }
      
      // Sort by creation date (newest first)
      allBookings.sort((a, b) => {
        const dateA = a.checkInDate ? new Date(a.checkInDate).getTime() : 0;
        const dateB = b.checkInDate ? new Date(b.checkInDate).getTime() : 0;
        return dateB - dateA;
      });
      
      setBookings(allBookings);
    } catch (err) {
      console.error("Failed to fetch all bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'all') {
      fetchAllBookings();
    } else if (viewMode === 'single' && selectedHotelId) {
      fetchBookingsForHotel(selectedHotelId);
    }
  }, [viewMode, selectedHotelId]);

  const handleViewModeChange = (mode: 'all' | 'single') => {
    setViewMode(mode);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, color: color.firstColor }}>
        All Hotel Bookings
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            {/* View Mode Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => {
                if (newMode !== null) handleViewModeChange(newMode);
              }}
              sx={{ mb: { xs: 2, sm: 0 } }}
            >
              <ToggleButton value="all" sx={{ textTransform: 'none' }}>
                All Hotels
              </ToggleButton>
              <ToggleButton value="single" sx={{ textTransform: 'none' }}>
                Single Hotel
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Hotel Selector (only show in single mode) */}
            {viewMode === 'single' && (
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel>Select Hotel</InputLabel>
                <Select
                  value={selectedHotelId ?? ""}
                  label="Select Hotel"
                  onChange={(e: SelectChangeEvent) => setSelectedHotelId(e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {loadingHotels ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2">Loading hotels...</Typography>
                      </Box>
                    </MenuItem>
                  ) : (
                    hotels.map((hotel) => (
                      <MenuItem 
                        key={hotel.id} 
                        value={hotel.id}
                        sx={{
                          py: 1,
                          borderBottom: '1px solid #f0f0f0',
                          '&:last-child': {
                            borderBottom: 'none'
                          }
                        }}
                      >
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" fontWeight={500}>
                            {hotel.displayName}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="textSecondary">
                              Total: {hotel.totalRooms} rooms
                            </Typography>
                            {hotel.stayTypes.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {hotel.stayTypes.map((type, index) => (
                                  <Chip
                                    key={index}
                                    size="small"
                                    label={type}
                                    sx={{ 
                                      height: 20, 
                                      fontSize: '0.65rem',
                                      bgcolor: type === 'Overnight' ? '#e3f2fd' : 
                                               type === 'Hourly' ? '#fff3e0' : '#f5f5f5',
                                      color: type === 'Overnight' ? '#1976d2' : 
                                             type === 'Hourly' ? '#f57c00' : '#757575'
                                    }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}

            <Box sx={{ flexGrow: 1 }} />

            {loadingBookings ? (
              <CircularProgress size={24} sx={{ color: color.firstColor }} />
            ) : (
              <Typography variant="body2" color="textSecondary">
                {viewMode === 'all' 
                  ? `${bookings.length} booking(s) from ${hotels.length} hotel(s)`
                  : `${bookings.length} booking(s) in selected hotel`}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 2 }} />

      {bookings.length > 0 ? (
        <BookingTable bookings={bookings} />
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography variant="body1" color="textSecondary">
            {viewMode === 'all' 
              ? "No bookings found across all hotels"
              : "No bookings found for this hotel"}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AllHotelBookingsPage;