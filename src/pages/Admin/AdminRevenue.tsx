import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
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
  Paper,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  IconButton,
  Tooltip,
  DialogContentText,
  Stack,
  Divider,
  useTheme,
  useMediaQuery
} from "@mui/material";
import dayjs from "dayjs";
import color from "../../components/color";
import { getAllHotels, getAllHotelRevenue, updatePayoutStatus } from "../../services/services";

// --- types
type HotelOption = { id: string; name: string };

interface RevenueRow {
  id: string;
  hotelId: string;
  hotelName?: string;
  date?: string;
  amountPaise?: number;
  feePaise?: number;
  netAmountPaise?: number;
  status?: "pending" | "processing" | "completed" | "failed" | "cancelled" | string;
  note?: string;
  createdAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#4caf50",
  pending: "#ff9800",
  processing: "#2196f3",
  failed: "#f44336",
  cancelled: "#9e9e9e",
  unknown: "#757575",
};

const paiseToRupeesInt = (paise?: number) => Math.round((Number(paise) || 0) / 100);

const ALL_STATUSES = ["pending", "processing", "completed", "failed", "cancelled"];

const AdminRevenuePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowsForBulk, setSelectedRowsForBulk] = useState<Record<string, boolean>>({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);

  const [searchText, setSearchText] = useState("");
  const searchRef = useRef<number | null>(null);

  // status filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // edit single
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RevenueRow | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("pending");
  const [editingNote, setEditingNote] = useState<string>("");

  // last updated timestamp
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  // fetch hotels once
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const payload = { data: { filter: "" }, page: 0, pageSize: 200, order: [["createdAt", "ASC"]] };
        const res: any = await getAllHotels(payload);
        const list = res?.data?.data?.rows?.map((h: any) => ({ id: h.id, name: h.propertyName ?? h.name ?? `Hotel ${h.id}` })) ?? [];
        setHotels(list);
      } catch (err) {
        console.error("fetchHotels err", err);
      }
    };
    void fetchHotels();
  }, []);

  // fetch all revenue rows
  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const payload = {
        data: { filter: "" },
        page: 0,
        pageSize: 100000,
        order: [["createdAt", "DESC"]],
      };
      const res: any = await getAllHotelRevenue(payload);
      const rowsFromApi: RevenueRow[] = res?.data?.data?.rows ?? [];
      console.log(rowsFromApi)

      const filteredRows = rowsFromApi.filter((r: RevenueRow) => r.status !== "cancelled");

      const normalized = filteredRows.map((r) => {
        const dateVal = r.date ?? r.createdAt ?? undefined;
        return {
          ...r,
          date: dateVal ? dayjs(dateVal).format("YYYY-MM-DD") : undefined,
          hotelName: r.hotelName ?? hotels.find((h) => h.id === r.hotelId)?.name ?? r.hotelId,
          amountPaise: r.amountPaise ? Number(r.amountPaise) : 0,
          feePaise: r.feePaise ? Number(r.feePaise) : 0,
          netAmountPaise: r.netAmountPaise
            ? Number(r.netAmountPaise)
            : (Number(r.amountPaise || 0) - Number(r.feePaise || 0)),
        } as RevenueRow;
      });

      normalized.sort((a, b) => {
        const da = a.date ? dayjs(a.date) : dayjs("1970-01-01");
        const db = b.date ? dayjs(b.date) : dayjs("1970-01-01");
        if (da.isBefore(db)) return 1;
        if (da.isAfter(db)) return -1;
        return (a.hotelName ?? "").localeCompare(b.hotelName ?? "");
      });

      setRows(normalized);
      setSelectedRowsForBulk({});
      setLastUpdatedAt(dayjs().format("YYYY-MM-DD HH:mm:ss"));
    } catch (err) {
      console.error("fetchRevenue err", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [hotels]);

  useEffect(() => {
    void fetchRevenue();
  }, [fetchRevenue]);

  // FRONTEND FILTERING
  const filteredRows = useMemo(() => {
    let data = [...rows];

    if (selectedHotelId && selectedHotelId !== "all") {
      data = data.filter((r) => r.hotelId === selectedHotelId);
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((r) => (r.status ?? "").toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      data = data.filter((r) =>
        (r.hotelName || "").toLowerCase().includes(q) ||
        (r.note || "").toLowerCase().includes(q) ||
        (r.id || "").toLowerCase().includes(q)
      );
    }

    if (dateFrom) data = data.filter((r) => !r.date || r.date >= dateFrom);
    if (dateTo) data = data.filter((r) => !r.date || r.date <= dateTo);

    return data;
  }, [rows, selectedHotelId, statusFilter, searchText, dateFrom, dateTo]);

  // totals
  const totals = useMemo(() => {
    const totalAmountPaise = filteredRows.reduce((s, r) => s + (Number(r.amountPaise || 0)), 0);
    const totalFeePaise = filteredRows.reduce((s, r) => s + (Number(r.feePaise || 0)), 0);
    const totalNetPaise = filteredRows.reduce((s, r) => s + (Number(r.netAmountPaise || (Number(r.amountPaise || 0) - Number(r.feePaise || 0)))), 0);
    return {
      grossRupees: paiseToRupeesInt(totalAmountPaise),
      commissionRupees: paiseToRupeesInt(totalFeePaise),
      netRupees: paiseToRupeesInt(totalNetPaise),
    };
  }, [filteredRows]);

  const handleUpdateStatus = async (row: RevenueRow, newStatus: string, note?: string) => {
    const prevRows = [...rows];
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: newStatus, note: note ?? r.note } : r)));
    try {
      await updatePayoutStatus(row.id, { status: newStatus, note: note ?? row.note ?? "" });
    } catch (err) {
      setRows(prevRows);
      console.error("Failed to update payout status", err);
      alert("Failed to update payout status. See console for details.");
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowsForBulk((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAllOnPage = (checked: boolean) => {
    const newSel: Record<string, boolean> = {};
    if (checked) filteredRows.forEach((r) => (newSel[r.id] = true));
    setSelectedRowsForBulk(newSel);
  };

  const handleBulkMarkCompleted = async () => {
    const ids = Object.entries(selectedRowsForBulk).filter(([, v]) => v).map(([k]) => k);
    if (ids.length === 0) {
      alert("Select at least one payout row for bulk operation.");
      return;
    }
    setConfirmDialogOpen(true);
  };

  const confirmBulkMarkCompleted = async () => {
    setConfirmDialogOpen(false);
    setBulkOperationInProgress(true);
    try {
      const ids = Object.entries(selectedRowsForBulk).filter(([, v]) => v).map(([k]) => k);
      const prevRows = [...rows];
      setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status: "completed" } : r)));
      await Promise.all(ids.map((id) => updatePayoutStatus(id, { status: "completed" })));
      setSelectedRowsForBulk({});
    } catch (err) {
      console.error("Bulk update failed", err);
      alert("Bulk update failed. See console for details.");
      await fetchRevenue();
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const openEditDialog = (row: RevenueRow) => {
    setEditingRow(row);
    setEditingStatus(row.status ?? "pending");
    setEditingNote(row.note ?? "");
    setEditDialogOpen(true);
  };

  const submitEditDialog = async () => {
    if (!editingRow) return;
    setEditDialogOpen(false);
    await handleUpdateStatus(editingRow, editingStatus, editingNote);
  };

  const selectedCount = Object.values(selectedRowsForBulk).filter(Boolean).length;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600, color: color.firstColor }}>
          Hotel Payouts & Revenue
        </Typography>
        {lastUpdatedAt && (
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdatedAt}
          </Typography>
        )}
      </Stack>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gross Revenue
              </Typography>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: '#1976d2' }}>
                ₹{totals.grossRupees.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Commission
              </Typography>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: '#f57c00' }}>
                ₹{totals.commissionRupees.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Net Payout
              </Typography>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: '#2e7d32' }}>
                ₹{totals.netRupees.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fce4ec', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Records
              </Typography>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: '#c2185b' }}>
                {filteredRows.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Hotel</InputLabel>
                <Select value={selectedHotelId} label="Hotel" onChange={(e: SelectChangeEvent) => setSelectedHotelId(e.target.value as string)}>
                  <MenuItem value="all">All Hotels</MenuItem>
                  {hotels.map((h) => (
                    <MenuItem key={h.id} value={h.id}>
                      {h.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={6} md={2}>
              <TextField
                label="From"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </Grid>

            <Grid item xs={6} sm={6} md={2}>
              <TextField
                label="To"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value as string)}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  {ALL_STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Search"
                placeholder="Hotel, note, ID..."
                size="small"
                fullWidth
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Stack direction="row" spacing={1}>
                  <Button 
                    variant="outlined" 
                    onClick={() => void fetchRevenue()} 
                    disabled={loading}
                    size={isMobile ? "small" : "medium"}
                  >
                    {loading ? <CircularProgress size={18} /> : "Refresh"}
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleBulkMarkCompleted} 
                    disabled={bulkOperationInProgress || selectedCount === 0}
                    size={isMobile ? "small" : "medium"}
                  >
                    {bulkOperationInProgress ? <CircularProgress size={18} /> : `Mark ${selectedCount > 0 ? `(${selectedCount})` : ''} Completed`}
                  </Button>
                </Stack>
                {selectedCount > 0 && (
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                    {selectedCount} row{selectedCount !== 1 ? 's' : ''} selected
                  </Typography>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Revenue Table */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={filteredRows.length > 0 && filteredRows.every((r) => selectedRowsForBulk[r.id] ?? false)}
                      onChange={(e) => handleSelectAllOnPage(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hotel</TableCell>
                  {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>}
                  {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Fee</TableCell>}
                  <TableCell sx={{ fontWeight: 600 }}>Net</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 6 : 8} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 6 : 8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No records found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedRowsForBulk[row.id] ?? false}
                          onChange={() => toggleSelectRow(row.id)}
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.date || '—'}</TableCell>
                      <TableCell sx={{ maxWidth: isMobile ? 100 : 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.hotelName}
                      </TableCell>
                      {!isMobile && <TableCell>₹{paiseToRupeesInt(row.amountPaise).toLocaleString()}</TableCell>}
                      {!isMobile && <TableCell>₹{paiseToRupeesInt(row.feePaise).toLocaleString()}</TableCell>}
                      <TableCell sx={{ fontWeight: 600 }}>₹{paiseToRupeesInt(row.netAmountPaise).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          sx={{
                            textTransform: "capitalize",
                            fontWeight: 600,
                            bgcolor: STATUS_COLORS[row.status ?? "unknown"] ?? STATUS_COLORS.unknown,
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => openEditDialog(row)} variant="outlined">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Payout</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Status"
              select
              value={editingStatus}
              onChange={(e) => setEditingStatus(e.target.value)}
              variant="outlined"
            >
              {ALL_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: STATUS_COLORS[status] }} />
                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Note"
              value={editingNote}
              onChange={(e) => setEditingNote(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitEditDialog} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Bulk Update</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark {selectedCount} payout{selectedCount !== 1 ? 's' : ''} as completed? This operation cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmBulkMarkCompleted} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminRevenuePage;