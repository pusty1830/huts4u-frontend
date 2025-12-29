import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Rating,
  Typography,
  CircularProgress,
  TextField,
} from "@mui/material";
import { HourglassBottom } from "@mui/icons-material";
import color from "../components/color";
import { CustomTextField } from "../components/style";
import { getUserId } from "../services/axiosClient";
import {
  getAllMyBookings,
  createRating,
  cancelBooking,
  updateBookings,
  createCancel,
  updateMypayment,
  getAllHotelRevenue,
  updatePayout,
  getAllMyRevenue,
  getOneRatings,
  updateRatings,
  getAllHotels,
} from "../services/services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const MyBookings: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [ratingLoading, setRatingLoading] = useState<Record<string, boolean>>({});

  // ---- Filters & Search ----
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "checkedIn" | "checkedOut" | "cancelled"
  >("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // local state for inline rating edits and per-card saving
  const [editedMap, setEditedMap] = useState<Record<string, { rating: number; reviewText: string; ratingId?: string }>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();

  const formatCurrency = (amount: number | string) => {
    if (!amount && amount !== 0) return "₹0.00";
    let num = Number(amount);
    if (!isNaN(num) && Math.abs(num) > 1000) num = num / 100;
    if (isNaN(num)) return String(amount);
    return num.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    });
  };

  // Function to fetch all hotels - only once
  const fetchAllHotels = useCallback(async () => {
    setLoadingHotels(true);
    try {
      const payload = {
        data: { filter: "" },
        page: 0,
        pageSize: 1000,
        order: [["createdAt", "DESC"]]
      };
      const response = await getAllHotels(payload);
      const hotelRows = response?.data?.data?.rows || [];
      setHotels(hotelRows);
    } catch (error) {
      console.error("Failed to fetch hotels", error);
    } finally {
      setLoadingHotels(false);
    }
  }, []);

  // Function to find hotel by name from the hotels list
  const findHotelByName = useCallback((hotelName: string) => {
    if (!hotels.length || !hotelName) return null;
    
    const normalizedSearchName = hotelName.toLowerCase().trim();
    
    // Try exact match first
    let hotel = hotels.find(h => 
      h.name?.toLowerCase() === normalizedSearchName ||
      h.title?.toLowerCase() === normalizedSearchName ||
      h.propertyName?.toLowerCase() === normalizedSearchName
    );
    
    // Try partial match if exact not found
    if (!hotel) {
      hotel = hotels.find(h => 
        h.name?.toLowerCase().includes(normalizedSearchName) ||
        h.title?.toLowerCase().includes(normalizedSearchName) ||
        h.propertyName?.toLowerCase().includes(normalizedSearchName)
      );
    }
    
    return hotel || null;
  }, [hotels]);

  const parseBookingDate = (card: any): Date | null => {
    try {
      if (!card) return null;
      if (card.checkInDateTime) {
        const d = new Date(card.checkInDateTime);
        if (!isNaN(d.getTime())) return d;
      }
      if (card.checkInDate) {
        const datePart = String(card.checkInDate).replace(/[\u2018\u2019\u201C\u201D]/g, "'").trim();
        const timePart = card.checkInTime ? String(card.checkInTime).trim() : "";
        const attempts = [`${datePart} ${timePart}`, `${datePart}T${timePart}`, datePart];
        for (const s of attempts) {
          if (!s) continue;
          const d = new Date(s);
          if (!isNaN(d.getTime())) return d;
        }
        const cleaned = `${datePart.replace(/'|'|'/g, "")} ${timePart}`.replace(/[\u2018\u2019\u201C\u201D]/g, "");
        const d2 = new Date(cleaned);
        if (!isNaN(d2.getTime())) return d2;
      }
      return null;
    } catch {
      return null;
    }
  };

  const isCancelable = (card: any) => {
    const bookingDate = parseBookingDate(card);
    if (!bookingDate) return false;
    const now = new Date();
    const diffMs = bookingDate.getTime() - now.getTime();
    const btype = String(card?.bookingType || card?.type || "").toLowerCase();
    const isHourly = btype === "hourly" || btype === "hour";
    if (isHourly) return diffMs > 15 * 60 * 1000;
    return diffMs > 24 * 60 * 60 * 1000;
  };

  // Function to fetch rating for a specific booking
  const fetchBookingRating = useCallback(async (bookingId: string) => {
    try {
      setRatingLoading(prev => ({ ...prev, [bookingId]: true }));
      const response = await getOneRatings(bookingId);

      if (response?.data?.data) {
        const ratingData = response.data?.data;
        setEditedMap(prev => ({
          ...prev,
          [bookingId]: {
            rating: ratingData.rating || 0,
            reviewText: ratingData.comment || "",
            ratingId: ratingData.id
          }
        }));

        // Also update the card data
        setData(prev => prev.map(card =>
          card.id === bookingId
            ? { ...card, rating: ratingData.rating, reviewText: ratingData.comment, hasRated: true }
            : card
        ));
      }
    } catch (error) {
      console.error(`Failed to fetch rating for booking ${bookingId}:`, error);
    } finally {
      setRatingLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  }, []);

  // Load hotels only once on component mount
  useEffect(() => {
    fetchAllHotels();
  }, [fetchAllHotels]);

  // Load bookings
  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      try {
        const Payload = {
          data: { filter: "", userId: getUserId() },
          page: 0,
          pageSize: 50,
          order: [["createdAt", "DESC"]]
        };
        const res = await getAllMyBookings(Payload);
        const rows = res?.data?.data?.rows || [];
        
        // Enrich booking data with hotel info if hotels are already loaded
        let enrichedRows = rows;
        
        if (hotels.length > 0) {
          enrichedRows = rows.map((row: any) => {
            const hotelName = row.hotelName || row.propertyName || row.title;
            const hotel = findHotelByName(hotelName);
            
            return {
              ...row,
              // If we found a matching hotel, add its data
              ...(hotel ? {
                hotelId: hotel.id,
                hotelName: hotel.name || hotel.title || hotel.propertyName,
                hotelData: hotel // Store full hotel data
              } : {})
            };
          });
        }
        
        setData(enrichedRows);

        // Initialize edit map and fetch ratings for each booking
        const initMap: Record<string, { rating: number; reviewText: string; ratingId?: string }> = {};
        for (const r of enrichedRows) {
          const key = String(r.id);

          // Default values from booking data
          const defaultRating = r.status && String(r.status).toLowerCase().replace(/\s/g, "") === "checkedin" && (r.rating == null || r.rating === 0) ? 1 : Number(r.rating ?? 0);

          initMap[key] = {
            rating: defaultRating,
            reviewText: r.reviewText ?? r.comment ?? "",
            ratingId: r.ratingId
          };

          // Fetch the actual rating if booking is checked in or checked out
          const normStatus = String(r.status || "").toLowerCase().replace(/\s/g, "");
          if (normStatus === "checkedin" || normStatus === "checkedout") {
            fetchBookingRating(key);
          }
        }
        setEditedMap(initMap);
      } catch (err) {
        console.error("Failed to load bookings", err);
        toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    // Only load bookings if hotels are loaded OR if we don't need hotels
    loadBookings();
  }, [fetchBookingRating, findHotelByName, hotels.length]);

  // Update edited map when data changes
  useEffect(() => {
    if (!data || !data.length) return;
    setEditedMap((prev) => {
      const copy = { ...prev };
      data.forEach((r) => {
        const key = String(r.id);
        if (!copy[key]) {
          const defaultRating = r.status && String(r.status).toLowerCase().replace(/\s/g, "") === "checkedin" && (r.rating == null || r.rating === 0) ? 1 : Number(r.rating ?? 0);
          copy[key] = {
            rating: defaultRating,
            reviewText: r.reviewText ?? r.comment ?? "",
            ratingId: r.ratingId
          };
        }
      });
      return copy;
    });
  }, [data]);

  const handleSubmitReview = async (bookingId: number | string): Promise<void> => {
    const key = String(bookingId);
    const edited = editedMap[key];
    if (!edited) {
      toast.info("Please provide a rating or review before submitting.");
      return;
    }
    if (!edited.rating || edited.rating <= 0) {
      toast.info("Please select a rating before submitting.");
      return;
    }

    const prevData = [...data];
    setSavingMap(s => ({ ...s, [key]: true }));

    try {
      const booking = data.find(b => String(b.id) === key);
      const userId = getUserId();

      // Prepare payload
      const payload = {
        userId,
        hotelId: booking?.hotelId,
        bookingId: key,
        rating: Number(edited.rating),
        comment: edited.reviewText || ""
      };

      let response;

      if (edited.ratingId) {
        response = await updateRatings(edited.ratingId, payload);
        toast.success("Rating updated successfully!");
      } else {
        response = await createRating(payload);
        toast.success("Thanks for your review!");
      }

      if (response?.data) {
        const saved = response.data;

        // Update local state with server response
        setData(prev => prev.map(card =>
          String(card.id) === key
            ? {
              ...card,
              rating: saved.rating ?? edited.rating,
              reviewText: saved.comment ?? edited.reviewText,
              hasRated: true,
              ratingId: saved.id
            }
            : card
        ));

        if (saved.id && !edited.ratingId) {
          setEditedMap(prev => ({
            ...prev,
            [key]: {
              ...prev[key],
              ratingId: saved.id
            }
          }));
        }
      }
    } catch (err: any) {
      console.error("Failed to submit rating:", err);
      setData(prevData);
      toast.error(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setSavingMap(s => ({ ...s, [key]: false }));
    }
  };

  const reversePriceBreakup = (finalAmount: number) => {
    const multiplier = 1.2156862745;
    const basePrice = finalAmount / multiplier;
    const gstOnBase = basePrice * 0.05;
    const commission = basePrice * 0.13;
    const gstOnCommission = commission * 0.18;
    const core = basePrice + gstOnBase + commission + gstOnCommission;
    const convenienceFee = core * 0.02;
    const gstOnConvenience = convenienceFee * 0.18;
    return {
      basePrice: Math.round(basePrice),
      gstOnBase,
      commission,
      gstOnCommission,
      convenienceFee,
      gstOnConvenience,
      totalCheck: basePrice + gstOnBase + commission + gstOnCommission + convenienceFee + gstOnConvenience
    };
  };

  const handleCancelBooking = async (card: any) => {
    const amount = card.amountPaid / 100;
    const p = reversePriceBreakup(amount);
    const convRaw = p.convenienceFee + p.gstOnConvenience;
    const conv = Math.ceil(convRaw);
    const refundRaw = amount - convRaw;
    const refundamount = Math.floor(refundRaw);

    if (!isCancelable(card)) {
      toast.info(card?.bookingType === "hourly" || card?.bookingType === "hour"
        ? "Hourly bookings can only be cancelled more than 15 minutes before start."
        : "Bookings can only be cancelled more than 24 hours before check-in.");
      return;
    }

    const prevStatus = card.status;
    setData(prev => prev.map(c => (c.id === card.id ? { ...c, status: "cancelled" } : c)));

    try {
      const payLoad = { paymentId: card.paymentId, amount: refundamount };
      await cancelBooking(payLoad);
      
      const cancelPayload = {
        userId: getUserId(),
        hotelId: card.hotelId,
        bookingId: card.id,
        amount: card.amountPaid,
        refundAmount: refundamount,
        reason: "Guest requested cancellation",
        status: "pending",
        processedBy: 1,
        refundedAt: new Date().toISOString(),
        currency: "INR"
      };

      await updateBookings(card.id, { status: "Cancel" });
      
      // Update revenue status
      try {
        const hotelRevenuePayload = { data: { filter: "", bookingId: card.id }, page: 0, pageSize: 50 };
        const hotelRes = await getAllHotelRevenue(hotelRevenuePayload);
        const firstRow = hotelRes?.data?.data?.rows?.[0];
        if (firstRow?.id) await updatePayout(firstRow.id, { status: "cancelled" });
      } catch (error) {
        console.error("Error updating hotel revenue:", error);
      }

      try {
        const myRevenuePayload = { data: { filter: "", bookingId: card.id }, page: 0, pageSize: 50 };
        const myRes = await getAllMyRevenue(myRevenuePayload);
        const firstRow = myRes?.data?.data?.rows?.[0];
        if (firstRow?.id) await updateMypayment(firstRow.id, { status: "cancelled" });
      } catch (error) {
        console.error("Error updating my revenue:", error);
      }

      await createCancel(cancelPayload);
      toast.success("Booking cancelled and you will receive the payment in between 7-14 days.");
    } catch (err) {
      setData(prev => prev.map(c => c.id === card.id ? { ...c, status: prevStatus } : c));
      toast.error("Failed to cancel booking. Please try again.");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    const normStatus = (s: any) => String(s || "").toLowerCase().replace(/\s/g, "");
    let items = data.filter((card) => {
      const status = normStatus(card.status);
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && status !== "pending") return false;
        if (statusFilter === "checkedIn" && status !== "checkedin") return false;
        if (statusFilter === "checkedOut" && status !== "checkedout") return false;
        if (statusFilter === "cancelled" && !status.startsWith("cancel")) return false;
      }
      if (searchTerm.trim()) {
        const haystack = (card.hotelName || card.propertyName || card.title || "") + " " + (card.guestName || "");
        if (!haystack.toLowerCase().includes(searchTerm.toLowerCase().trim())) return false;
      }
      const d = parseBookingDate(card);
      if (d) {
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (d < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (d > to) return false;
        }
      }
      return true;
    });

    const statusOrder: Record<string, number> = { pending: 0, checkedin: 1, checkedout: 2, cancelled: 3 };
    items.sort((a, b) => {
      const sa = statusOrder[normStatus(a.status)] ?? 99;
      const sb = statusOrder[normStatus(b.status)] ?? 99;
      if (sa !== sb) return sa - sb;
      const da = parseBookingDate(a)?.getTime() ?? 0;
      const db = parseBookingDate(b)?.getTime() ?? 0;
      return db - da;
    });

    return items;
  }, [data, searchTerm, statusFilter, dateFrom, dateTo]);

  if (loading || loadingHotels) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  const pendingCount = data.filter((b) => String(b.status).toLowerCase().replace(/\s/g, "") === "pending").length;

  const badgeColorFor = (rawStatus: any) => {
    const s = String(rawStatus || "").toLowerCase().replace(/\s/g, "");
    if (s === "checkedin") return "#1976d2";
    if (s === "checkedout") return "green";
    if (s === "pending") return "#faaf00";
    if (s.startsWith("cancel")) return "#d32f2f";
    return "#666";
  };

  const handleRatingChange = (bookingId: string, newValue: number | null) => {
    setEditedMap(prev => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || { rating: 0, reviewText: "" }),
        rating: Number(newValue || 0)
      }
    }));
  };

  const handleReviewTextChange = (bookingId: string, text: string) => {
    setEditedMap(prev => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || { rating: 0, reviewText: "" }),
        reviewText: text
      }
    }));
  };

  const handleReset = (bookingId: string, card: any) => {
    setEditedMap(prev => ({
      ...prev,
      [bookingId]: {
        rating: card.rating ?? 0,
        reviewText: card.reviewText ?? "",
        ratingId: card.ratingId
      }
    }));
  };

  return (
    <Box sx={{ background: color.thirdColor, px: { xs: 2, md: 4 }, py: 4, minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight="bold" sx={{ textAlign: "center", color: color.firstColor, mb: 2 }}>
        Your Bookings
      </Typography>

      {pendingCount > 0 && (
        <Typography sx={{ textAlign: "center", mb: 2, fontSize: 14, color: "#555" }}>
          You have <strong>{pendingCount}</strong> upcoming booking{pendingCount > 1 ? "s" : ""} (shown on top).
        </Typography>
      )}

      <Box sx={{ mb: 3, p: 2, borderRadius: 2, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <CustomTextField
              fullWidth
              label="Search by hotel / property / guest"
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                size="small"
                variant={statusFilter === "all" ? "contained" : "outlined"}
                sx={{ textTransform: "none", borderRadius: "20px", minWidth: 0 }}
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                size="small"
                variant={statusFilter === "pending" ? "contained" : "outlined"}
                sx={{ textTransform: "none", borderRadius: "20px", minWidth: 0 }}
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </Button>
              <Button
                size="small"
                variant={statusFilter === "checkedIn" ? "contained" : "outlined"}
                sx={{ textTransform: "none", borderRadius: "20px", minWidth: 0 }}
                onClick={() => setStatusFilter("checkedIn")}
              >
                Checked In
              </Button>
              <Button
                size="small"
                variant={statusFilter === "checkedOut" ? "contained" : "outlined"}
                sx={{ textTransform: "none", borderRadius: "20px", minWidth: 0 }}
                onClick={() => setStatusFilter("checkedOut")}
              >
                Checked Out
              </Button>
              <Button
                size="small"
                variant={statusFilter === "cancelled" ? "contained" : "outlined"}
                sx={{ textTransform: "none", borderRadius: "20px", minWidth: 0 }}
                onClick={() => setStatusFilter("cancelled")}
              >
                Cancelled
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <CustomTextField
                label="From date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={dateFrom}
                onChange={(e: any) => setDateFrom(e.target.value)}
                sx={{ flex: 1 }}
              />
              <CustomTextField
                label="To date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={dateTo}
                onChange={(e: any) => setDateTo(e.target.value)}
                sx={{ flex: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2}>
        {filteredAndSortedData.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography sx={{ color: "#666" }}>No bookings found for this filter.</Typography>
            </Box>
          </Grid>
        )}

        {filteredAndSortedData.map((card, index) => {
          const cancelEnabled = isCancelable(card);
          const cancelTitle = cancelEnabled
            ? "Cancel booking"
            : String(card?.bookingType || "").toLowerCase() === "hourly" || String(card?.bookingType || "").toLowerCase() === "hour"
              ? "Hourly bookings can be cancelled only more than 15 minutes before start"
              : "Bookings can be cancelled only more than 24 hours before check-in";

          const key = String(card.id);
          const edited = editedMap[key] ?? { rating: 0, reviewText: "" };
          const saving = Boolean(savingMap[key]);
          const loadingRating = Boolean(ratingLoading[key]);
          const normStatus = String(card.status || "").toLowerCase().replace(/\s/g, "");

          return (
            <Grid item xs={12} md={6} key={card.id ?? index}>
              <Card sx={{
                margin: "auto",
                mt: 2,
                p: { xs: 2, md: 3 },
                boxShadow: "0px 8px 28px rgba(0,0,0,0.12)",
                borderRadius: "12px",
                border: `1px solid ${color.firstColor}`,
                position: "relative",
                cursor: "pointer",
              }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button, a, [role="button"]')) {
                  return;
                }
                navigate(`/booking/${card.id}`, { state: card });
              }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{
                    position: "absolute",
                    top: { xs: 8, md: 8 },
                    right: { xs: 16, md: 16 },
                    background: badgeColorFor(card.status),
                    color: "white",
                    px: 1,
                    borderRadius: { xs: "6px", md: "8px" },
                    py: 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: "12px",
                    textTransform: "capitalize"
                  }}>
                    {card.status}
                  </Box>

                  {/* Make hotel name clickable */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 0.5,
                      cursor: "pointer",
                      color: color.firstColor,
                      "&:hover": {
                        textDecoration: "underline",
                        opacity: 0.8
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to hotel page with hotel data
                      if (card.hotelData || card.hotelId) {
                        navigate(`/hotel/${card.hotelId || card.hotelData?.id}`, { 
                          state: { 
                            hotelData: card.hotelData || {
                              id: card.hotelId,
                              name: card.hotelName || card.propertyName || card.title
                            }
                          } 
                        });
                      } else {
                        // If no hotel data, show a toast or navigate to a fallback
                        toast.info("Hotel details not available");
                      }
                    }}
                  >
                    {card?.hotelName || card?.propertyName || card?.title}
                  </Typography>

                  <Typography color="textSecondary" sx={{ fontSize: 13 }}>
                    {card?.checkInDate} {card?.checkInTime ? `, ${card.checkInTime}` : ""} {card?.guestName ? `· ${card.guestName}` : ""}
                  </Typography>

                  <Typography sx={{ mt: 1 }}>
                    {card?.adults ?? 1} Adults{card?.children ? `, ${card.children} Child` : ""}
                  </Typography>

                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {formatCurrency(card?.amountPaid ?? card?.amount ?? 0)}
                  </Typography>

                  <Divider sx={{ my: 1.5, borderStyle: "dashed", borderColor: "grey" }} />

                  {/* Rating section for Checked Out and Checked In bookings */}
                  {(normStatus === "checkedout" || normStatus === "checkedin") && (
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                      {loadingRating ? (
                        <Box display="flex" justifyContent="center" py={2}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : (
                        <>
                          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                            <Typography sx={{ minWidth: 90 }}>
                              {normStatus === "checkedin" ? "Quick rating:" : "Your rating:"}
                            </Typography>
                            <Rating
                              value={edited.rating}
                              onChange={(e, newValue) => handleRatingChange(key, newValue)}
                              disabled={saving}
                            />
                          </Box>

                          <TextField
                            label={normStatus === "checkedin" ? "Quick note" : "Write your review"}
                            multiline
                            minRows={normStatus === "checkedin" ? 2 : 3}
                            fullWidth
                            value={edited.reviewText}
                            onChange={(e) => handleReviewTextChange(key, e.target.value)}
                            variant="outlined"
                            disabled={saving}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                          />

                          <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                            <Button
                              sx={{
                                borderRadius: 44,
                                textTransform: "none"
                              }}
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/booking/${card.id}`, { state: card });
                              }}
                            >
                              Details
                            </Button>

                            <Box display="flex" gap={2}>
                              <Button
                                sx={{
                                  background: "transparent",
                                  border: "solid 2px",
                                  color: color.firstColor,
                                  borderColor: color.firstColor,
                                  borderRadius: "44px",
                                  textTransform: "none"
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReset(key, card);
                                }}
                                disabled={saving}
                              >
                                Reset
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmitReview(card.id);
                                }}
                                variant="contained"
                                sx={{
                                  background: color.firstColor,
                                  color: "white",
                                  textTransform: "none",
                                  borderRadius: "44px",
                                  px: 3
                                }}
                                disabled={saving}
                              >
                                {saving ? (
                                  <CircularProgress size={20} color="inherit" />
                                ) : card.hasRated || edited.ratingId ? (
                                  "Update Review"
                                ) : (
                                  "Submit Review"
                                )}
                              </Button>
                            </Box>
                          </Box>
                        </>
                      )}
                    </Box>
                  )}

                  {/* Pending area */}
                  {normStatus === "pending" && (
                    <Box display="flex" alignItems="flex-start" mt={2} color={"#faaf00"}>
                      <HourglassBottom />
                      <Box sx={{ ml: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography>Upcoming</Typography>
                        <Button
                          sx={{
                            background: "transparent",
                            border: "solid 2px",
                            color: color.firstColor,
                            borderColor: color.firstColor,
                            borderRadius: "44px",
                            textTransform: "none",
                            ml: 2
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelBooking(card);
                          }}
                          disabled={!cancelEnabled}
                          title={cancelTitle}
                        >
                          Cancel
                        </Button>

                        <Button
                          sx={{
                            ml: 1,
                            borderRadius: 44,
                            textTransform: "none",
                            border: `1px solid ${color.firstColor}`
                          }}
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/booking/${card.id}`, { state: card });
                          }}
                        >
                          Details
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Details button for other statuses (not pending, cancelled, checkedin, checkedout) */}
                  {normStatus !== "pending" &&
                    !normStatus.startsWith("cancel") &&
                    normStatus !== "checkedin" &&
                    normStatus !== "checkedout" && (
                      <Box display="flex" justifyContent="flex-end" mt={2}>
                        <Button
                          sx={{ borderRadius: 44, textTransform: "none" }}
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/booking/${card.id}`, { state: card });
                          }}
                        >
                          Details
                        </Button>
                      </Box>
                    )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default MyBookings;