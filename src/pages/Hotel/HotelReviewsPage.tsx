// HotelReviewsPage.tsx
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
  Paper,
  Rating,
} from "@mui/material";
import dayjs from "dayjs";
import color from "../../components/color";
import { getAllHotels, getAllRatings } from "../../services/services"; // unchanged
import { getUserId } from "../../services/axiosClient";
import StarRounded from "@mui/icons-material/StarRounded";

// ---------- Replace this service with your actual reviews API call
// I keep the API call inline so you can adapt it to your existing service layer.
const fetchReviewsApi = async (hotelId: string) => {
  // Your backend endpoint should return rows like:
  // [{ id, rating, comment, createdAt, user: { id, userName, avatar } , bookingId, hotelId }, ...]
  // Replace the URL below with your actual endpoint or call your services function.
  const payload = { data: { filter: "", hotelId }, page: 0, pageSize: 500, order: [["createdAt", "ASC"]] };
  const res = await getAllRatings(payload);
  const json =  res?.data?.data?.rows;
  return json ?? [];
};

interface HotelOption {
  id: string;
  name: string;
}

type RatingRow = {
  id: string | number;
  rating: number;
  comment?: string | null;
  createdAt?: string | null;
  user?: { id?: number; userName?: string; avatar?: string } | null;
  userId?: number;
  bookingId?: number;
  // optional legacy fields
  reviewerName?: string;
  reviewerAvatar?: string;
};

const groupKeyFor = (iso?: string | null) => {
  if (!iso) return "No Date";
  const d = dayjs(iso);
  if (d.isSame(dayjs(), "day")) return "Today";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return d.format("DD MMM YYYY");
};

const fetchHotels = async (
  setHotels: React.Dispatch<React.SetStateAction<HotelOption[]>>,
  setSelected: React.Dispatch<React.SetStateAction<string | null>>
) => {
  try {
    const payload = { data: { filter: "", userId: getUserId() }, page: 0, pageSize: 50, order: [["createdAt", "ASC"]] };
    const res: any = await getAllHotels(payload);
    if (res?.data?.data?.rows) {
      const list = res.data.data.rows.map((h: any) => ({ id: h.id, name: h.propertyName ?? h.name ?? `Hotel ${h.id}` }));
      setHotels(list);
      if (list.length) setSelected(prev => prev || list[0].id);
    }
  } catch (err) {
    console.error("fetchHotels err", err);
  }
};

const HotelReviewsPage: React.FC = () => {
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHotels(setHotels, setSelectedHotelId);
  }, []);

  const fetchReviews = async (hotelId?: string | null) => {
    if (!hotelId) {
      setReviews([]);
      return;
    }
    setLoading(true);
    try {
      const rows: RatingRow[] = await fetchReviewsApi(hotelId);
      // normalize shapes (support user included or simple fields)
      const normalized = rows.map(r => ({
        id: r.id ?? `${Math.random()}`,
        rating: typeof r.rating === "number" ? r.rating : Number(r.rating) || 0,
        comment: r.comment ?? null,
        createdAt: r.createdAt ?? null,
        user: r.user ?? (r.userId ? { id: r.userId, userName: (r as any).reviewerName ?? `User ${r.userId}`, avatar: (r as any).reviewerAvatar ?? "" } : null),
        bookingId: r.bookingId,
      }));
      setReviews(normalized);
    } catch (err) {
      console.error("fetchReviews err", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHotelId) fetchReviews(selectedHotelId);
  }, [selectedHotelId]);

  // Aggregates
  const summary = useMemo(() => {
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
    return { count, avg };
  }, [reviews]);

  // Group by date for UI: Today / Yesterday / other dates desc / No Date
  const grouped = useMemo(() => {
    const map = new Map<string, RatingRow[]>();
    for (const r of reviews) {
      const key = groupKeyFor(r.createdAt ?? null);
      const arr = map.get(key) ?? [];
      arr.push(r);
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

    const result: Array<[string, RatingRow[]]> = [];
    if (today.length) result.push(["Today", today]);
    if (yesterday.length) result.push(["Yesterday", yesterday]);
    result.push(...otherEntries);
    if (noDate.length) result.push(["No Date", noDate]);
    return result;
  }, [reviews]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, color: color.firstColor }}>
        Hotel Reviews
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>Select Hotel</InputLabel>
            <Select
              value={selectedHotelId ?? ""}
              label="Select Hotel"
              onChange={(e: SelectChangeEvent) => setSelectedHotelId(e.target.value as string)}
            >
              {hotels.map(h => (
                <MenuItem value={h.id} key={h.id}>
                  {h.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={() => selectedHotelId && fetchReviews(selectedHotelId)} sx={{ textTransform: "none" }}>
            Refresh
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" color="textSecondary">
              {summary.count} review(s)
            </Typography>
            <Box display="flex" alignItems="center" gap={1} justifyContent="flex-end">
              <StarRounded sx={{ color: "#f7b500" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {summary.avg.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {grouped.length === 0 ? (
            <Typography color="textSecondary">No reviews found for this hotel.</Typography>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 620 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Reviewer</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Rating</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Comment</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Time</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {grouped.map(([dateLabel, list]) => (
                    <React.Fragment key={dateLabel}>
                      <TableRow>
                        <TableCell colSpan={4} sx={{ background: dateLabel === "Today" ? color.firstColor : "#f5f5f5", color: dateLabel === "Today" ? "#fff" : "#000", py: 1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography sx={{ fontWeight: 700 }}>{dateLabel}</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>{list.length} review(s)</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>

                      {list.map(r => {
                        const reviewerName = r.user?.userName ?? (r.userId ? `User ${r.userId}` : "Guest");
                        const avatar = r.user?.avatar ?? undefined;
                        return (
                          <TableRow key={r.id}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar src={avatar}>{(!avatar && reviewerName) ? reviewerName.charAt(0) : null}</Avatar>
                                <Box>
                                  <Typography sx={{ fontWeight: 700 }}>{reviewerName}</Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {r.createdAt ? dayjs(r.createdAt).format("DD MMM YYYY") : "-"}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Rating value={r.rating || 0} precision={0.5} readOnly />
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{(r.rating || 0).toFixed(1)}</Typography>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{r.comment ?? "—"}</Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2">{r.createdAt ? dayjs(r.createdAt).format("hh:mm A") : "-"}</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default HotelReviewsPage;
