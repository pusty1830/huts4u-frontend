import React, { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Grid,
    TextField,
    Typography,
    Button,
    Divider,
    CircularProgress,
    useMediaQuery,
    useTheme,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    SelectChangeEvent,
    Tooltip,
    Tabs,
    Tab,
    InputAdornment,
    Switch,
    FormControlLabel,
} from "@mui/material";
import {
    Save,
    Refresh,
    Hotel as HotelIcon,
    MeetingRoom,
    PriceCheck,
    Schedule,
    Bed,
    CheckCircle,
    Cancel,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { getAllHotels, getAllRooms, updateRooms } from "../../services/services";
import { getUserId } from "../../services/axiosClient";

const primaryPurple = "#6827B8";
const lightPurple = "#f3e9ff";
const secondaryColor = "#4CAF50";
const errorColor = "#F44336";

interface Hotel {
    id: number;
    propertyName?: string;
    name?: string;
    [key: string]: any;
}

interface Room {
    id: number;
    hotelId: number;
    roomCategory: string;
    roomSize: string;
    roomName?: string;
    stayType: "Overnight" | "Hourly";
    rateFor1Night: number | null;
    rateFor3Hour: number | null;
    rateFor6Hour: number | null;
    rateFor12Hour: number | null;
    status: "Available" | "Unavailable";
    isActive: boolean;
    [key: string]: any;
}

interface RoomWithHotel extends Room {
    hotel?: Hotel;
    hotelName?: string;
    hotelStayLabel?: string;
}

// Room edit state interface
interface RoomEditState {
    [roomId: number]: {
        rate1Night: string;
        rate3Hour: string;
        rate6Hour: string;
        rate12Hour: string;
        status: "Available" | "Unavailable";
        isActive: boolean;
    };
}

export default function PriceUpdatePage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    // State management
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [rooms, setRooms] = useState<RoomWithHotel[]>([]);
    const [filteredRooms, setFilteredRooms] = useState<RoomWithHotel[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<{ [key: number]: boolean }>({});
    const [initialLoad, setInitialLoad] = useState<boolean>(true);

    // Edit state management
    const [roomEdits, setRoomEdits] = useState<RoomEditState>({});

    // Filters
    const [selectedHotel, setSelectedHotel] = useState<string>("");
    const [stayTypeFilter, setStayTypeFilter] = useState<"all" | "Overnight" | "Hourly">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "Available" | "Unavailable">("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeTab, setActiveTab] = useState<0 | 1>(0);

    // Helper function to get hotel name consistently
    const getHotelName = (hotel: Hotel | undefined): string => {
        return hotel?.propertyName || hotel?.name || "Unknown Hotel";
    };

    // New state for hotel with stay types
    const [hotelOptions, setHotelOptions] = useState<Array<{
        id: number;
        hotelName: string;
        stayTypes: string[];
        displayLabel: string;
    }>>([]);

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        if (rooms.length > 0 && hotels.length > 0) {
            filterRooms();
            updateHotelOptions();
        }
    }, [rooms, selectedHotel, stayTypeFilter, statusFilter, searchTerm, hotels]);

    // when hotel changes – reload rooms for that hotel
    useEffect(() => {
        if (!initialLoad) {
            if (selectedHotel !== "all") {
                fetchRooms(Number(selectedHotel));
            } else {
                fetchRooms();
            }
        }
    }, [selectedHotel]);

    const updateHotelOptions = (): void => {
        // Create a map of hotel IDs to their stay types
        const hotelStayMap = new Map<number, Set<string>>();
        
        rooms.forEach(room => {
            if (!hotelStayMap.has(room.hotelId)) {
                hotelStayMap.set(room.hotelId, new Set());
            }
            hotelStayMap.get(room.hotelId)?.add(room.stayType);
        });

        // Create hotel options with stay types
        const options = Array.from(hotelStayMap.entries()).map(([hotelId, stayTypes]) => {
            const hotel = hotels.find(h => h.id === hotelId);
            const hotelName = getHotelName(hotel);
            const stayTypesArray = Array.from(stayTypes);
            
            // Create display label: HotelName (StayType1/StayType2)
            const stayTypeLabel = stayTypesArray.length === 2 
                ? "Overnight & Hourly" 
                : stayTypesArray[0];
            
            const displayLabel = `${hotelName} (${stayTypeLabel})`;

            return {
                id: hotelId,
                hotelName,
                stayTypes: stayTypesArray,
                displayLabel
            };
        });

        // Sort alphabetically by hotel name
        options.sort((a, b) => a.hotelName.localeCompare(b.hotelName));
        
        setHotelOptions(options);
    };

    const fetchAllData = async (): Promise<void> => {
        try {
            setLoading(true);
            await fetchHotels();
            await fetchRooms();
            setInitialLoad(false);
            toast.success("Data loaded successfully");
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const fetchHotels = async (): Promise<void> => {
        try {
            const payload = {
                data: { filter: "", status: "Approved", userId: getUserId() },
                page: 0,
                pageSize: 100,
                order: [["createdAt", "ASC"]],
            };
            const response = await getAllHotels(payload);
            const hotelList =
                response?.data?.data?.rows ||
                response?.data?.rows ||
                response?.data ||
                [];

            setHotels(hotelList);
        } catch (error) {
            console.error("Error fetching hotels:", error);
            throw error;
        }
    };

    const fetchRooms = async (hotelId?: number): Promise<void> => {
    try {
        const payload = {
            data: { filter: "",hotelId },
            page: 0,
            pageSize: 1000,
            order: [["createdAt", "ASC"]],
        };

        const response = await getAllRooms(payload);
        const roomList =
            response?.data?.data?.rows ||
            response?.data?.rows ||
            response?.data ||
            [];

        // Create hotel map for quick lookup
        const hotelMap = new Map<number, Hotel>();
        hotels.forEach(hotel => {
            hotelMap.set(hotel.id, hotel);
        });

        // First, filter rooms by hotels that belong to current user
        const userHotelIds = new Set(hotels.map(hotel => hotel.id));
        let userRooms = roomList.filter((room: any) => userHotelIds.has(room.hotelId));

        // Then, filter rooms by hotelId if provided
        if (hotelId) {
            userRooms = userRooms.filter((room: any) => room.hotelId === hotelId);
        }

        // Process rooms with hotel information
        const processedRooms: RoomWithHotel[] = userRooms.map((room: any) => {
            const hotel = hotelMap.get(room.hotelId);
            const hotelName = getHotelName(hotel);
            const roomName = room.roomName || room.roomCategory || "Unnamed Room";
            
            // Create the hotelStayLabel: HotelName - StayType
            const hotelStayLabel = `${hotelName} - ${room.stayType || "Overnight"}`;
            
            // Create a display name: HotelName - RoomName (RoomSize)
            const displayRoomName = `${hotelName} - ${roomName} (${room.roomSize || "Standard"})`;

            return {
                id: room.id,
                hotelId: room.hotelId,
                hotelName: hotelName,
                hotelStayLabel: hotelStayLabel,
                displayRoomName: displayRoomName,
                roomCategory: room.roomCategory || "",
                roomSize: room.roomSize || "",
                roomName: roomName,
                stayType: room.stayType || "Overnight",
                rateFor1Night: room.rateFor1Night ? parseFloat(room.rateFor1Night) : null,
                rateFor3Hour: room.rateFor3Hour ? parseFloat(room.rateFor3Hour) : null,
                rateFor6Hour: room.rateFor6Hour ? parseFloat(room.rateFor6Hour) : null,
                rateFor12Hour: room.rateFor12Hour ? parseFloat(room.rateFor12Hour) : null,
                status:
                    room.status === "unAvailable" || room.status === "Unavailable"
                        ? "Unavailable"
                        : "Available",
                isActive: room.isActive !== false,
                hotel,
            };
        });

        setRooms(processedRooms);

        // Initialize edit state
        const initialEdits: RoomEditState = {};
        processedRooms.forEach(room => {
            initialEdits[room.id] = {
                rate1Night: room.rateFor1Night?.toString() || "",
                rate3Hour: room.rateFor3Hour?.toString() || "",
                rate6Hour: room.rateFor6Hour?.toString() || "",
                rate12Hour: room.rateFor12Hour?.toString() || "",
                status: room.status,
                isActive: room.isActive,
            };
        });

        setRoomEdits(initialEdits);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        throw error;
    }
};

const filterRooms = (): void => {
    let filtered = [...rooms];

    // No need to filter by selectedHotel here since we already did it in fetchRooms
    if (selectedHotel !== "all") {
        // Already filtered by hotelId in fetchRooms, but keep this as safety check
        filtered = filtered.filter(room => room.hotelId === Number(selectedHotel));
    }
    
    if (stayTypeFilter !== "all") {
        filtered = filtered.filter(room => room.stayType === stayTypeFilter);
    }
    
    if (statusFilter !== "all") {
        filtered = filtered.filter(room => room.status === statusFilter);
    }
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(room =>
            room.roomName?.toLowerCase().includes(term) ||
            room.roomCategory?.toLowerCase().includes(term) ||
            room.roomSize?.toLowerCase().includes(term) ||
            room.hotelName?.toLowerCase().includes(term) ||
            room.displayRoomName?.toLowerCase().includes(term)
        );
    }

    setFilteredRooms(filtered);
};

    const updateRoomEdit = (
        roomId: number,
        field: keyof RoomEditState[number],
        value: any
    ) => {
        setRoomEdits(prev => ({
            ...prev,
            [roomId]: {
                ...prev[roomId],
                [field]: value,
            }
        }));
    };

    const handleSaveRoom = async (room: RoomWithHotel): Promise<void> => {
        try {
            setSaving(prev => ({ ...prev, [room.id]: true }));

            const edits = roomEdits[room.id];
            if (!edits) {
                toast.error("No edits found for this room");
                return;
            }

            const payload: any = {};
            const hasChanges =
                edits.rate1Night !== (room.rateFor1Night?.toString() || "") ||
                edits.rate3Hour !== (room.rateFor3Hour?.toString() || "") ||
                edits.rate6Hour !== (room.rateFor6Hour?.toString() || "") ||
                edits.rate12Hour !== (room.rateFor12Hour?.toString() || "") ||
                edits.status !== room.status ||
                edits.isActive !== room.isActive;

            if (!hasChanges) {
                toast.info("No changes to save");
                return;
            }

            // Update rate fields based on stay type
            if (room.stayType === "Overnight") {
                payload.rateFor1Night = edits.rate1Night ? parseFloat(edits.rate1Night) : null;
            } else {
                payload.rateFor3Hour = edits.rate3Hour ? parseFloat(edits.rate3Hour) : null;
                payload.rateFor6Hour = edits.rate6Hour ? parseFloat(edits.rate6Hour) : null;
                payload.rateFor12Hour = edits.rate12Hour ? parseFloat(edits.rate12Hour) : null;
            }

            if (edits.status !== room.status) payload.status = edits.status;
            if (edits.isActive !== room.isActive) payload.isActive = edits.isActive;

            await updateRooms(room.id, payload);

            // Update local state
            const updatedRooms = rooms.map(r => {
                if (r.id === room.id) {
                    return {
                        ...r,
                        ...payload,
                        rateFor1Night: payload.rateFor1Night ?? r.rateFor1Night,
                        rateFor3Hour: payload.rateFor3Hour ?? r.rateFor3Hour,
                        rateFor6Hour: payload.rateFor6Hour ?? r.rateFor6Hour,
                        rateFor12Hour: payload.rateFor12Hour ?? r.rateFor12Hour,
                        status: payload.status || r.status,
                        isActive: payload.isActive !== undefined ? payload.isActive : r.isActive,
                    };
                }
                return r;
            });

            setRooms(updatedRooms);
            toast.success(`${room.displayRoomName || room.roomName} updated successfully`);
        } catch (error) {
            console.error("Error updating room:", error);
            toast.error("Failed to update room");
        } finally {
            setSaving(prev => ({ ...prev, [room.id]: false }));
        }
    };

    // Fixed render functions without hooks inside map
    const renderOvernightRooms = () => {
        const overnightRooms = filteredRooms.filter(room => room.stayType === "Overnight");
        
        return (
            <Card>
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Bed />
                            <Typography variant="h6">
                                Overnight Rooms ({overnightRooms.length})
                            </Typography>
                        </Box>
                    }
                    subheader="Update 1 Night prices and status"
                />
                <Divider />
                
                {overnightRooms.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <MeetingRoom sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary">
                            No overnight rooms found
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: lightPurple }}>
                                <TableRow>
                                    <TableCell>Hotel & Room</TableCell>
                                    <TableCell align="center">Hotel-Stay Type</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                    <TableCell align="center">1 Night Rate (₹)</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {overnightRooms.map((room) => {
                                    const edits = roomEdits[room.id] || {
                                        rate1Night: room.rateFor1Night?.toString() || "",
                                        rate3Hour: "",
                                        rate6Hour: "",
                                        rate12Hour: "",
                                        status: room.status,
                                        isActive: room.isActive,
                                    };
                                    
                                    const hasChanges = 
                                        edits.rate1Night !== (room.rateFor1Night?.toString() || "") ||
                                        edits.status !== room.status ||
                                        edits.isActive !== room.isActive;

                                    return (
                                        <TableRow key={room.id} hover>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {room.displayRoomName || `${room.hotelName} - ${room.roomName}`}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Category: {room.roomCategory}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    label={room.hotelStayLabel} 
                                                    size="small" 
                                                    color="primary" 
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                                                    <Select
                                                        size="small"
                                                        value={edits.status}
                                                        onChange={(e: SelectChangeEvent) => 
                                                            updateRoomEdit(room.id, 'status', e.target.value as "Available" | "Unavailable")}
                                                        sx={{ minWidth: 120 }}
                                                    >
                                                        <MenuItem value="Available">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CheckCircle fontSize="small" color="success" />
                                                                Available
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="Unavailable">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Cancel fontSize="small" color="error" />
                                                                Unavailable
                                                            </Box>
                                                        </MenuItem>
                                                    </Select>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                size="small"
                                                                checked={edits.isActive}
                                                                onChange={(e) => updateRoomEdit(room.id, 'isActive', e.target.checked)}
                                                                color="primary"
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="caption">
                                                                {edits.isActive ? "Active" : "Inactive"}
                                                            </Typography>
                                                        }
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={edits.rate1Night}
                                                    onChange={(e) => updateRoomEdit(room.id, 'rate1Night', e.target.value)}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                        inputProps: { min: 0, step: 0.01 }
                                                    }}
                                                    sx={{ width: 120 }}
                                                    placeholder="0.00"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => handleSaveRoom(room)}
                                                    disabled={saving[room.id] || !hasChanges}
                                                    startIcon={saving[room.id] ? <CircularProgress size={16} /> : <Save />}
                                                    sx={{ 
                                                        bgcolor: primaryPurple,
                                                        '&:disabled': { bgcolor: 'action.disabled' }
                                                    }}
                                                >
                                                    {saving[room.id] ? "Saving..." : "Save"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>
        );
    };

    const renderHourlyRooms = () => {
        const hourlyRooms = filteredRooms.filter(room => room.stayType === "Hourly");
        
        return (
            <Card>
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Schedule />
                            <Typography variant="h6">
                                Hourly Rooms ({hourlyRooms.length})
                            </Typography>
                        </Box>
                    }
                    subheader="Update 3hr, 6hr, 12hr prices and status"
                />
                <Divider />
                
                {hourlyRooms.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <MeetingRoom sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary">
                            No hourly rooms found
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: lightPurple }}>
                                <TableRow>
                                    <TableCell>Hotel & Room</TableCell>
                                    <TableCell align="center">Hotel-Stay Type</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                    <TableCell align="center">3hr Rate (₹)</TableCell>
                                    <TableCell align="center">6hr Rate (₹)</TableCell>
                                    <TableCell align="center">12hr Rate (₹)</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {hourlyRooms.map((room) => {
                                    const edits = roomEdits[room.id] || {
                                        rate1Night: "",
                                        rate3Hour: room.rateFor3Hour?.toString() || "",
                                        rate6Hour: room.rateFor6Hour?.toString() || "",
                                        rate12Hour: room.rateFor12Hour?.toString() || "",
                                        status: room.status,
                                        isActive: room.isActive,
                                    };
                                    
                                    const hasChanges = 
                                        edits.rate3Hour !== (room.rateFor3Hour?.toString() || "") ||
                                        edits.rate6Hour !== (room.rateFor6Hour?.toString() || "") ||
                                        edits.rate12Hour !== (room.rateFor12Hour?.toString() || "") ||
                                        edits.status !== room.status ||
                                        edits.isActive !== room.isActive;

                                    return (
                                        <TableRow key={room.id} hover>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {room.displayRoomName || `${room.hotelName} - ${room.roomName}`}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Category: {room.roomCategory}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    label={room.hotelStayLabel} 
                                                    size="small" 
                                                    color="primary" 
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                                                    <Select
                                                        size="small"
                                                        value={edits.status}
                                                        onChange={(e: SelectChangeEvent) => 
                                                            updateRoomEdit(room.id, 'status', e.target.value as "Available" | "Unavailable")}
                                                        sx={{ minWidth: 120 }}
                                                    >
                                                        <MenuItem value="Available">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CheckCircle fontSize="small" color="success" />
                                                                Available
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="Unavailable">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Cancel fontSize="small" color="error" />
                                                                Unavailable
                                                            </Box>
                                                        </MenuItem>
                                                    </Select>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                size="small"
                                                                checked={edits.isActive}
                                                                onChange={(e) => updateRoomEdit(room.id, 'isActive', e.target.checked)}
                                                                color="primary"
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="caption">
                                                                {edits.isActive ? "Active" : "Inactive"}
                                                            </Typography>
                                                        }
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={edits.rate3Hour}
                                                    onChange={(e) => updateRoomEdit(room.id, 'rate3Hour', e.target.value)}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                        inputProps: { min: 0, step: 0.01 }
                                                    }}
                                                    sx={{ width: 100 }}
                                                    placeholder="0.00"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={edits.rate6Hour}
                                                    onChange={(e) => updateRoomEdit(room.id, 'rate6Hour', e.target.value)}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                        inputProps: { min: 0, step: 0.01 }
                                                    }}
                                                    sx={{ width: 100 }}
                                                    placeholder="0.00"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={edits.rate12Hour}
                                                    onChange={(e) => updateRoomEdit(room.id, 'rate12Hour', e.target.value)}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                        inputProps: { min: 0, step: 0.01 }
                                                    }}
                                                    sx={{ width: 100 }}
                                                    placeholder="0.00"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => handleSaveRoom(room)}
                                                    disabled={saving[room.id] || !hasChanges}
                                                    startIcon={saving[room.id] ? <CircularProgress size={16} /> : <Save />}
                                                    sx={{ 
                                                        bgcolor: primaryPurple,
                                                        '&:disabled': { bgcolor: 'action.disabled' }
                                                    }}
                                                >
                                                    {saving[room.id] ? "Saving..." : "Save"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>
        );
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, background: "#faf7ff", minHeight: "100vh" }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ color: primaryPurple, fontWeight: 700, mb: 1 }}>
                    <PriceCheck sx={{ verticalAlign: 'middle', mr: 2, fontSize: 40 }} />
                    Room Price Update
                </Typography>
                <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
                    Update room rates and availability status
                </Typography>
            </Box>

            <Card sx={{ p: 2, mb: 3, bgcolor: lightPurple }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Hotel</InputLabel>
                            <Select
                                value={selectedHotel}
                                onChange={(e: SelectChangeEvent) => setSelectedHotel(e.target.value)}
                                label="Select Hotel"
                            >
                                <MenuItem value="all">All Hotels</MenuItem>
                                {hotelOptions.map((hotelOption) => (
                                    <MenuItem key={hotelOption.id} value={hotelOption.id.toString()}>
                                        {hotelOption.displayLabel}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Stay Type</InputLabel>
                            <Select
                                value={stayTypeFilter}
                                onChange={(e: SelectChangeEvent) => setStayTypeFilter(e.target.value as any)}
                                label="Stay Type"
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="Overnight">Overnight</MenuItem>
                                <MenuItem value="Hourly">Hourly</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value as any)}
                                label="Status"
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="Available">Available</MenuItem>
                                <MenuItem value="Unavailable">Unavailable</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by hotel, room, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <HotelIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={fetchAllData}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
                            sx={{ bgcolor: primaryPurple, height: '40px' }}
                        >
                            Refresh Data
                        </Button>
                    </Grid>
                </Grid>
            </Card>

            <Box sx={{ width: '100%', mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{
                        '& .MuiTab-root': { fontSize: '1rem', fontWeight: 600 },
                        '& .Mui-selected': { color: primaryPurple + '!important' },
                        '& .MuiTabs-indicator': { backgroundColor: primaryPurple },
                    }}
                >
                    <Tab icon={<Bed />} iconPosition="start" label="Overnight Rooms" />
                    <Tab icon={<Schedule />} iconPosition="start" label="Hourly Rooms" />
                </Tabs>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {activeTab === 0 ? renderOvernightRooms() : renderHourlyRooms()}
                    
                    <Card sx={{ mt: 3, p: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color={primaryPurple}>
                                        {rooms.length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Total Rooms
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color={secondaryColor}>
                                        {rooms.filter(r => r.status === "Available").length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Available Rooms
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color={errorColor}>
                                        {rooms.filter(r => r.status === "Unavailable").length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Unavailable Rooms
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6">
                                        {rooms.filter(r => r.stayType === "Overnight").length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Overnight Rooms
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Card>
                </>
            )}
        </Box>
    );
}