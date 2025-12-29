import { useState, useEffect } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import color from "../../components/color";
import { editHotel, getHotel, updateBookings } from "../../services/services";

interface Booking {
  id: string;
  avatar?: string;
  geustName?: string;
  phoneNumber?: string;
  geustDetails?: any;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  status?: string;
  statusColor?: string;
}

interface BookingTableProps {
  bookings?: Booking[];
  hotelId?: string;
  onCheckIn?: (bookingId: string) => void;
  onCheckOut?: (bookingId: string) => void;
}

const BookingTable = ({ bookings = [], hotelId, onCheckIn, onCheckOut }: BookingTableProps) => {
  const [availability, setAvailability] = useState<string | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    let mounted = true;
    if (!hotelId) {
      setAvailability(null);
      return;
    }

    setLoadingAvailability(true);
    getHotel(hotelId)
      .then((res) => {
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
        console.log("Availability updated to", newStatus);
      })
      .catch((err) => {
        console.error("Error updating availability:", err);
        setAvailability(prev);
      });
  };

  const canCheckIn = (booking: Booking) => {
    const s = (booking.status || "").toLowerCase();
    return s === "pending" || s === "booked";
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

  const statusColorFor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "checkedin") return "rgba(163,228,215,0.8)";
    if (s === "checkedout") return "rgba(245,183,177,0.9)";
    return "rgba(0,0,0,0.08)";
  };

  const allowActionByTime = (booking: Booking) => {
    if (!booking.checkInDate || !booking.checkInTime) return false;

    const checkInDateTimeStr = `${booking.checkInDate} ${booking.checkInTime}`;
    const checkIn = new Date(checkInDateTimeStr);
    const now = new Date();

    const allowedTime = new Date(checkIn.getTime() - 5 * 60 * 1000);
    return now >= allowedTime;
  };

  const updateBookingStatus = async (bookingId: string, newStatus: "checkedIn" | "checkedOut") => {
    const prev = localBookings.map((b) => ({ ...b }));

    setLoadingForId(bookingId, true);

    setLocalBookings((list) =>
      list.map((b) =>
        b.id === bookingId
          ? { ...b, status: newStatus, statusColor: statusColorFor(newStatus) }
          : b
      )
    );

    try {
      await updateBookings(bookingId, { status: newStatus });

      if (newStatus === "checkedIn") onCheckIn?.(bookingId);
      else if (newStatus === "checkedOut") onCheckOut?.(bookingId);
    } catch (err) {
      console.error("Failed to update booking status", err);
      setLocalBookings(prev);
    } finally {
      setLoadingForId(bookingId, false);
    }
  };

  // For mobile, show a simplified view
  const MobileBookingCard = ({ booking }: { booking: Booking }) => {
    const isLoading = loadingIds.includes(booking.id);
    const allowedByTime = allowActionByTime(booking);

    return (
      <Paper sx={{ p: 2, mb: 2, borderRadius: "12px" }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Avatar src={booking.avatar} alt={booking.geustName ?? "guest"} />
            <Box>
              <Typography fontWeight="bold">{booking.geustName ?? "Guest"}</Typography>
              <Typography variant="caption" color="textSecondary">
                ID: {booking.id}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={booking.status ?? "unknown"}
            size="small"
            sx={{
              backgroundColor: booking.statusColor ?? statusColorFor(booking.status ?? ""),
              color: "#000",
              fontWeight: "bold",
              textTransform: "capitalize",
            }}
          />
        </Box>

        <Box mb={1}>
          <Typography variant="body2" color="textSecondary">
            Phone: +{booking?.geustDetails?.phoneNumber ?? "-"}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Check-in: {booking.checkInDate ?? "-"} {booking.checkInTime ?? ""}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Check-out: {booking.checkOutDate ?? "-"} {booking.checkOutTime ?? ""}
          </Typography>
        </Box>

        <Box display="flex" gap={1} mt={2}>
          <Button
            size="small"
            variant="contained"
            fullWidth
            sx={{
              background: color.firstColor,
              textTransform: "none",
              borderRadius: "20px",
            }}
            disabled={!canCheckIn(booking) || isLoading || !allowedByTime}
            onClick={() => updateBookingStatus(booking.id, "checkedIn")}
          >
            {isLoading && canCheckIn(booking) ? "Processing..." : "Check-In"}
          </Button>

          <Button
            size="small"
            variant="outlined"
            fullWidth
            sx={{
              color: color.firstColor,
              borderColor: color.firstColor,
              textTransform: "none",
              borderRadius: "20px",
            }}
            disabled={!canCheckOut(booking) || isLoading || !allowedByTime}
            onClick={() => updateBookingStatus(booking.id, "checkedOut")}
          >
            {isLoading && canCheckOut(booking) ? "Processing..." : "Check-Out"}
          </Button>
        </Box>
      </Paper>
    );
  };

  return (
    <Box
      sx={{
        padding: { xs: 1, sm: 2 },
        background: color.thirdColor,
        boxShadow: "0px 0px 14px rgba(0, 0, 0, 0.14)",
        borderRadius: "12px",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexDirection={{ xs: "column", sm: "row" }} gap={{ xs: 1, sm: 0 }}>
        <Box textAlign={{ xs: "center", sm: "left" }}>
          <Typography variant="h6" fontWeight="bold">
            New bookings
          </Typography>
          <Typography variant="body2" color="gray">
            {localBookings.length > 0 ? "Recent guest reservations list" : "No bookings found"}
          </Typography>
        </Box>

        <FormControl sx={{ width: "fit-content", color: color.firstColor }}>
          <Button
            variant="contained"
            color={availability === "Available" ? "success" : "error"}
            onClick={toggleAvailability}
            disabled={!hotelId || loadingAvailability}
            sx={{ textTransform: "none" }}
            size={isMobile ? "small" : "medium"}
          >
            {availability ?? (loadingAvailability ? "Loading..." : "Unavailable")}
          </Button>
        </FormControl>
      </Box>

      {/* Mobile View - Card Layout */}
      {isMobile && localBookings.length > 0 ? (
        <Box sx={{ maxHeight: 500, overflowY: "auto" }}>
          {localBookings.map((booking) => (
            <MobileBookingCard key={booking.id} booking={booking} />
          ))}
        </Box>
      ) : 
      /* Tablet/Desktop View - Table Layout */
      localBookings.length > 0 ? (
        <Box
          sx={{
            maxHeight: { xs: 400, md: 420 },
            overflowY: "auto",
            overflowX: "auto", // Allow horizontal scroll on tablet
            borderRadius: "12px",
            width: "100%",
          }}
        >
          <TableContainer
            component={Paper}
            sx={{
              boxShadow: "none",
              minWidth: isTablet ? "800px" : "100%", // Force scroll on tablet
              width: "100%",
            }}
          >
            <Table 
              stickyHeader 
              sx={{ 
                minWidth: isTablet ? 800 : undefined,
                width: "100%",
                tableLayout: isTablet ? "auto" : "fixed" // Auto layout for better responsiveness
              }}
            >
              <TableHead>
                <TableRow>
                  {[
                    "Booking ID",
                    "Guest name",
                    "Phone Number",
                    "Check In Date",
                    "Check In Time",
                    "Check Out Date",
                    "Check Out Time",
                    "Status",
                    "Actions",
                  ].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        fontWeight: "bold",
                        color: "gray",
                        fontSize: { xs: "12px", sm: "14px" },
                        whiteSpace: "nowrap",
                        py: { xs: 1, sm: 2 },
                        px: { xs: 1, sm: 2 },
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {localBookings.map((booking) => {
                  const isLoading = loadingIds.includes(booking.id);
                  const allowedByTime = allowActionByTime(booking);

                  return (
                    <TableRow key={booking.id} hover>
                      <TableCell sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 } }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: "12px", sm: "14px" } }}>
                          {booking.id}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 } }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar 
                            src={booking.avatar} 
                            alt={booking.geustName ?? "guest"} 
                            sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
                          />
                          <Typography variant="body2" sx={{ fontSize: { xs: "12px", sm: "14px" } }}>
                            {booking.geustName ?? "Guest"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 } }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: "12px", sm: "14px" } }}>
                          +{booking?.geustDetails?.phoneNumber ?? "-"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 } }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: "12px", sm: "14px" } }}>
                          {booking.checkInDate ?? "-"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 } }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: "12px", sm: "14px" } }}>
                          {booking.checkInTime ?? "-"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 } }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: "12px", sm: "14px" } }}>
                          {booking.checkOutDate ?? "-"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 } }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: "12px", sm: "14px" } }}>
                          {booking.checkOutTime ?? "-"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 } }}>
                        <Chip
                          label={booking.status ?? "unknown"}
                          size={isMobile ? "small" : "medium"}
                          sx={{
                            backgroundColor: booking.statusColor ?? statusColorFor(booking.status ?? ""),
                            color: "#000",
                            fontWeight: "bold",
                            textTransform: "capitalize",
                            fontSize: { xs: "10px", sm: "12px" },
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 } }}>
                        <Box display="flex" gap={1} flexDirection={{ xs: "column", sm: "row" }}>
                          <Button
                            size="small"
                            variant="contained"
                            sx={{
                              background: color.firstColor,
                              textTransform: "none",
                              borderRadius: "20px",
                              fontSize: { xs: "11px", sm: "13px" },
                              px: { xs: 1, sm: 2 },
                            }}
                            disabled={!canCheckIn(booking) || isLoading || !allowedByTime}
                            onClick={() => updateBookingStatus(booking.id, "checkedIn")}
                          >
                            {isLoading && canCheckIn(booking) ? "..." : "Check-In"}
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              color: color.firstColor,
                              borderColor: color.firstColor,
                              textTransform: "none",
                              borderRadius: "20px",
                              fontSize: { xs: "11px", sm: "13px" },
                              px: { xs: 1, sm: 2 },
                            }}
                            disabled={!canCheckOut(booking) || isLoading || !allowedByTime}
                            onClick={() => updateBookingStatus(booking.id, "checkedOut")}
                          >
                            {isLoading && canCheckOut(booking) ? "..." : "Check-Out"}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography>No bookings available for this hotel</Typography>
        </Box>
      )}
    </Box>
  );
};

export default BookingTable;