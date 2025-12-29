import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Snackbar,
  LinearProgress,
  Chip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  CalendarToday as CalendarIcon,
  Hotel as HotelIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  NightsStay as OvernightIcon,
  Bed as BedIcon,
  Group as GroupIcon,
  CurrencyRupee as RupeeIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { styled } from '@mui/material/styles';
import { getUserId } from '../../services/axiosClient';
import { getAllHotels, getAllRooms, createInventory, getAllInventories, udateInventory, deletInventory } from '../../services/services';

// Types
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
}

interface Room {
  id: string;
  hotelId: string;
  roomCategory: string;
  roomSize: string;
  stayType: 'Overnight' | 'Hourly' | 'Both';
  availableRooms: number;
  rateFor1Night: number;
}

interface InventoryItem {
  id: string;
  roomId: string;
  date: string;
  stayType: string;
  overnightAvailable: number;
  overnightBooked: number;
  overnightRate: number;
  threeHourAvailable: number;
  threeHourBooked: number;
  threeHourRate: number;
  sixHourAvailable: number;
  sixHourBooked: number;
  sixHourRate: number;
  twelveHourAvailable: number;
  twelveHourBooked: number;
  twelveHourRate: number;
  isBlocked: boolean;
  notes: string;
}

// Responsive Custom Input Component for DatePicker
const CustomInput = React.forwardRef<HTMLInputElement, { value?: string; onClick?: () => void }>(
  ({ value, onClick }, ref) => (
    <Box
      ref={ref as any}
      onClick={onClick}
      sx={{
        p: { xs: 1, sm: 1.5 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: { xs: '48px', sm: '56px' }
      }}
    >
      <Typography variant="body2" sx={{ 
        color: value ? 'text.primary' : 'text.disabled',
        fontSize: { xs: '0.875rem', sm: '1rem' }
      }}>
        {value || 'Select date'}
      </Typography>
      <CalendarIcon sx={{ 
        color: 'action.active', 
        width: { xs: 18, sm: 20 }, 
        height: { xs: 18, sm: 20 } 
      }} />
    </Box>
  )
);
CustomInput.displayName = 'CustomInput';

// Styled DatePicker for responsiveness
const StyledDatePicker = styled(DatePicker)(({ theme }) => ({
  width: '100%',
  '& .react-datepicker': {
    fontFamily: theme.typography.fontFamily,
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: 8,
    boxShadow: theme.shadows[3],
    width: '100%',
    maxWidth: '300px',
    [theme.breakpoints.up('sm')]: {
      maxWidth: 'none',
    },
  },
  '& .react-datepicker__header': {
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
      paddingTop: theme.spacing(2),
    },
  },
  '& .react-datepicker__current-month': {
    fontSize: '1rem',
    [theme.breakpoints.up('sm')]: {
      fontSize: '1.1rem',
    },
    fontWeight: 600,
  },
  '& .react-datepicker__day-name, & .react-datepicker__day': {
    width: '2rem',
    height: '2rem',
    lineHeight: '2rem',
    fontSize: '0.875rem',
    [theme.breakpoints.up('sm')]: {
      width: '2.5rem',
      height: '2.5rem',
      lineHeight: '2.5rem',
      fontSize: '1rem',
    },
  },
}));

// Helper function to get hotel name
const getHotelName = (hotel: Hotel | undefined): string => {
  return hotel?.propertyName || hotel?.name || "Unknown Hotel";
};

// Function to fetch hotels with ONLY Overnight stay types
const fetchHotelsWithOvernightStayTypes = async (
  setHotels: React.Dispatch<React.SetStateAction<HotelOption[]>>,
  setSelectedHotel: React.Dispatch<React.SetStateAction<string>>
) => {
  try {
    const payload = { 
      data: { filter: "", userId: getUserId() }, 
      page: 0, 
      pageSize: 100, 
      order: [["createdAt", "ASC"]] 
    };
    const response = await getAllHotels(payload);
    const hotelList = response?.data?.data?.rows || [];
    
    const roomsPayload = { 
      data: { filter: "" }, 
      page: 0, 
      pageSize: 1000, 
      order: [["createdAt", "ASC"]] 
    };
    const roomsRes = await getAllRooms(roomsPayload);
    const roomList = roomsRes?.data?.data?.rows || roomsRes?.data?.rows || roomsRes?.data || [];
    
    const options = hotelList
      .filter((hotel: Hotel) => {
        const hasOvernightRooms = roomList.some((room: any) => 
          room.hotelId === hotel.id && 
          (room.stayType === 'Overnight' || room.stayType === 'Both')
        );
        return hasOvernightRooms;
      })
      .map((hotel: Hotel) => {
        const hotelName = getHotelName(hotel);
        return {
          id: hotel.id,
          name: hotelName,
          displayLabel: `${hotelName} (Overnight)`
        };
      });

    options.sort((a:any, b:any) => a.name.localeCompare(b.name));
    
    setHotels(options);
    
    if (options.length > 0) {
      setSelectedHotel(options[0].id);
    }
    
    return options;
  } catch (error) {
    console.error("Error fetching hotels:", error);
    throw error;
  }
};

const OvernightInventoryManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Selection
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedRoomData, setSelectedRoomData] = useState<Room | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Filtering and Sorting
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [searchDate, setSearchDate] = useState<Date | null>(null);
  
  // Dates
  const [initializeStartDate, setInitializeStartDate] = useState<Date>(new Date());
  const [initializeEndDate, setInitializeEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });
  
  const [updateDate, setUpdateDate] = useState<Date>(new Date());
  const [bulkUpdateDate, setBulkUpdateDate] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    })()
  });
  
  // Forms
  const [overnightAvailable, setOvernightAvailable] = useState<string>('');
  const [overnightRate, setOvernightRate] = useState<string>('');
  const [bulkOvernightAvailable, setBulkOvernightAvailable] = useState<string>('');
  const [bulkOvernightRate, setBulkOvernightRate] = useState<string>('');
  
  // Block all dates
  const [blockDate, setBlockDate] = useState<Date>(new Date());
  const [blockReason, setBlockReason] = useState('');
  
  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Fetch hotels on mount
  useEffect(() => {
    fetchHotelsWithOvernightStayTypes(setHotels, setSelectedHotel);
  }, []);

  // Fetch rooms when hotel selected
  useEffect(() => {
    if (selectedHotel) {
      fetchRooms(selectedHotel);
    }
  }, [selectedHotel]);

  // Fetch inventory when room selected
  useEffect(() => {
    if (selectedRoom) {
      fetchInventory();
    }
  }, [selectedRoom]);

  // Set form values when clicking edit from table
  useEffect(() => {
    if (updateDate && inventory.length > 0) {
      const item = getInventoryForDate(updateDate);
      if (item) {
        setOvernightAvailable(item.overnightAvailable.toString());
        setOvernightRate(item.overnightRate.toString());
      }
    }
  }, [updateDate, inventory]);

  const fetchRooms = async (hotelId: string) => {
    try {
      setLoading(true);
      const payload = {
        data: { filter: "", hotelId },
        page: 0,
        pageSize: 100,
        order: [["createdAt", "ASC"]]
      };
      const response = await getAllRooms(payload);
      const allRooms = response?.data?.data?.rows || [];
      
      const overnightRooms = allRooms.filter((room: any) => 
        room.stayType === 'Overnight' || room.stayType === 'Both'
      );
      
      setRooms(overnightRooms);
      setSelectedRoom('');
      setSelectedRoomData(null);
      setInventory([]);
      
      if (overnightRooms.length === 0) {
        showSnackbar('No overnight rooms available in this hotel', 'info');
      }
    } catch (error) {
      showSnackbar('Error fetching rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    if (!selectedRoom) return;
    
    try {
      setLoading(true);
      
      const roomData = rooms.find(room => room.id === selectedRoom);
      setSelectedRoomData(roomData || null);
      
      const payload = {
        data: { filter: "", roomId: selectedRoom },
        page: 0,
        pageSize: 100,
        order: [["date", "ASC"]]
      };
      
      const response = await getAllInventories(payload);
      setInventory(response?.data?.data?.rows || []);
    } catch (error: any) {
      showSnackbar(error?.message || 'Error fetching inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter inventory
  const getFilteredInventory = () => {
    let filtered = [...inventory];
    
    if (searchDate) {
      const searchDateStr = searchDate.toISOString().split('T')[0];
      filtered = filtered.filter(item => item.date === searchDateStr);
    }
    
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (availabilityFilter === 'available') return item.overnightAvailable > 0;
        if (availabilityFilter === 'soldout') return item.overnightAvailable === 0;
        if (availabilityFilter === 'blocked') return item.isBlocked;
        return true;
      });
    }
    
    return filtered;
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalDays = inventory.length;
    const availableDays = inventory.filter(item => item.overnightAvailable > 0 && !item.isBlocked).length;
    const soldOutDays = inventory.filter(item => item.overnightAvailable === 0 && !item.isBlocked).length;
    const blockedDays = inventory.filter(item => item.isBlocked).length;
    
    return { totalDays, availableDays, soldOutDays, blockedDays };
  };

  const stats = calculateStats();

  // CREATE: Initialize inventory for date range
  const handleInitializeInventory = async () => {
    if (!selectedRoom || !selectedRoomData) {
      showSnackbar('Please select a room first', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const startStr = initializeStartDate.toISOString().split('T')[0];
      const endStr = initializeEndDate.toISOString().split('T')[0];
      
      const existingDates = inventory.map(item => item.date);
      const start = new Date(initializeStartDate);
      const end = new Date(initializeEndDate);
      let createdCount = 0;
      let skippedCount = 0;
      
      while (start <= end) {
        const currentDate = start.toISOString().split('T')[0];
        
        if (!existingDates.includes(currentDate)) {
          try {
            await createInventory({
              roomId: selectedRoom,
              date: currentDate,
              stayType: 'Overnight',
              overnightAvailable: selectedRoomData.availableRooms,
              overnightBooked: 0,
              overnightRate: selectedRoomData.rateFor1Night,
              threeHourAvailable: 0,
              threeHourBooked: 0,
              threeHourRate: 0,
              sixHourAvailable: 0,
              sixHourBooked: 0,
              sixHourRate: 0,
              twelveHourAvailable: 0,
              twelveHourBooked: 0,
              twelveHourRate: 0,
              isBlocked: false,
              notes: 'Auto-initialized'
            });
            createdCount++;
          } catch (createError) {
            console.error(`Failed to create inventory for ${currentDate}:`, createError);
          }
        } else {
          skippedCount++;
        }
        
        start.setDate(start.getDate() + 1);
      }
      
      showSnackbar(
        `Inventory initialized: ${createdCount} created, ${skippedCount} skipped`,
        'success'
      );
      
      fetchInventory();
    } catch (error) {
      showSnackbar('Failed to initialize inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  // READ: Get specific inventory item for date
  const getInventoryForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return inventory.find(item => item.date === dateStr);
  };

  // UPDATE: Update single inventory
  const handleUpdateSingleInventory = async () => {
    if (!selectedRoom) {
      showSnackbar('Please select a room first', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const dateStr = updateDate.toISOString().split('T')[0];
      const existingItem = getInventoryForDate(updateDate);
      
      if (!existingItem) {
        showSnackbar('No inventory found. Please initialize first.', 'warning');
        return;
      }
      
      const availableValue = overnightAvailable === '' ? 0 : parseInt(overnightAvailable);
      const rateValue = overnightRate === '' ? 0 : parseFloat(overnightRate);
      
      const updateData = {
        overnightAvailable: availableValue,
        overnightRate: rateValue,
        isBlocked: availableValue === 0
      };
      
      if (availableValue === 0) {
        updateData.isBlocked = true;
        showSnackbar('Setting available to 0 will mark as blocked', 'info');
      }
      
      await udateInventory(existingItem.id, updateData);
      
      showSnackbar('Inventory updated successfully', 'success');
      
      fetchInventory();
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to update inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  // UPDATE: Bulk update inventory
  const handleBulkUpdateInventory = async () => {
    if (!selectedRoom) {
      showSnackbar('Please select a room first', 'warning');
      return;
    }

    if (bulkOvernightAvailable === '' && bulkOvernightRate === '') {
      showSnackbar('Please enter at least one value to update', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const start = new Date(bulkUpdateDate.start);
      const end = new Date(bulkUpdateDate.end);
      let updatedCount = 0;
      let notFoundCount = 0;
      
      const availableValue = bulkOvernightAvailable === '' ? undefined : parseInt(bulkOvernightAvailable);
      const rateValue = bulkOvernightRate === '' ? undefined : parseFloat(bulkOvernightRate);
      
      while (start <= end) {
        const dateStr = start.toISOString().split('T')[0];
        const existingItem = inventory.find(item => item.date === dateStr);
        
        if (existingItem) {
          const updateData: any = {};
          
          if (availableValue !== undefined) {
            updateData.overnightAvailable = availableValue;
            updateData.isBlocked = availableValue === 0;
          }
          
          if (rateValue !== undefined) {
            updateData.overnightRate = rateValue;
          }
          
          if (Object.keys(updateData).length > 0) {
            await udateInventory(existingItem.id, updateData);
            updatedCount++;
          }
        } else {
          notFoundCount++;
        }
        
        start.setDate(start.getDate() + 1);
      }
      
      showSnackbar(
        `Bulk update: ${updatedCount} updated, ${notFoundCount} not found`,
        'success'
      );
      
      fetchInventory();
      setBulkOvernightAvailable('');
      setBulkOvernightRate('');
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to bulk update inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  // UPDATE: Block/Unblock inventory
  const handleToggleBlock = async (inventoryId: string, block: boolean) => {
    try {
      setLoading(true);
      
      const item = inventory.find(item => item.id === inventoryId);
      if (!item) {
        showSnackbar('Inventory item not found', 'error');
        return;
      }
      
      const updateData = {
        isBlocked: block,
        notes: block ? blockReason : 'Unblocked'
      };
      
      await udateInventory(inventoryId, updateData);
      
      showSnackbar(
        `Inventory ${block ? 'blocked' : 'unblocked'} successfully`,
        'success'
      );
      
      fetchInventory();
      setBlockReason('');
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to update inventory status', 'error');
    } finally {
      setLoading(false);
    }
  };

  // DELETE: Delete inventory
  const handleDeleteInventory = async (inventoryId: string) => {
    try {
      setLoading(true);
      
      await deletInventory(inventoryId, {});
      
      showSnackbar('Inventory deleted successfully', 'success');
      
      fetchInventory();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to delete inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatLongDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === inventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(inventory.map(item => item.id));
    }
  };

  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    } else {
      setSelectedItems(prev => [...prev, itemId]);
    }
  };

  // Helper function to format currency as Rs.
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Load item for editing
  const loadItemForEditing = (item: InventoryItem) => {
    setUpdateDate(new Date(item.date));
    setOvernightAvailable(item.overnightAvailable.toString());
    setOvernightRate(item.overnightRate.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered inventory
  const filteredInventory = getFilteredInventory();

  // Responsive table columns
  const tableColumns = isMobile ? ['Date', 'Available', 'Rate', 'Status'] : 
                    isTablet ? ['Date', 'Available', 'Booked', 'Rate', 'Status', 'Actions'] : 
                    ['Date', 'Day', 'Available', 'Booked', 'Rate', 'Status', 'Actions'];

  return (
    <Container maxWidth="xl" sx={{ 
      py: { xs: 2, sm: 3, md: 4 },
      px: { xs: 1, sm: 2, md: 3 }
    }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom sx={{ 
          fontWeight: 700,
          mb: 1
        }}>
          Overnight Inventory Management
        </Typography>
        <Typography variant={isMobile ? "body2" : "subtitle1"} color="text.secondary">
          Manage overnight room availability and pricing
        </Typography>
      </Box>

      {/* Stats Overview - Responsive Grid */}
      <Grid container spacing={2} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        {[
          { label: 'Total Rooms', value: selectedRoomData?.availableRooms || 0, icon: <BedIcon /> },
          { label: 'Available Days', value: stats.availableDays, icon: <OvernightIcon /> },
          { label: 'Sold Out Days', value: stats.soldOutDays, icon: <WarningIcon /> },
          { label: 'Blocked Days', value: stats.blockedDays, icon: <BlockIcon /> }
        ].map((stat, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Paper sx={{ 
              p: { xs: 1.5, sm: 2, md: 3 },
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 2 }
            }}>
              <Box sx={{ 
                p: { xs: 0.75, sm: 1 },
                borderRadius: 1.5,
                bgcolor: 'action.hover'
              }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>
                  {stat.value}
                </Typography>
                <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Hotel and Room Selection */}
      <Card sx={{ 
        mb: { xs: 2, sm: 3, md: 4 },
        borderRadius: 2
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ 
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <HotelIcon color="primary" />
            Hotel & Room Selection
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Select Hotel</InputLabel>
                <Select
                  value={selectedHotel}
                  label="Select Hotel"
                  onChange={(e) => setSelectedHotel(e.target.value)}
                >
                  <MenuItem value="">
                    <Typography color="text.disabled">Select a hotel</Typography>
                  </MenuItem>
                  {hotels.map(hotel => (
                    <MenuItem key={hotel.id} value={hotel.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HotelIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
                        <Box sx={{ overflow: 'hidden' }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                            {hotel.displayLabel}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Select Overnight Room</InputLabel>
                <Select
                  value={selectedRoom}
                  label="Select Overnight Room"
                  onChange={(e) => {
                    setSelectedRoom(e.target.value);
                    const room = rooms.find(r => r.id === e.target.value);
                    setSelectedRoomData(room || null);
                  }}
                  disabled={!selectedHotel || rooms.length === 0}
                >
                  <MenuItem value="">
                    <Typography color="text.disabled">Select a room</Typography>
                  </MenuItem>
                  {rooms.map(room => (
                    <MenuItem key={room.id} value={room.id}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: 1
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                          <BedIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                              {room.roomCategory}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {room.availableRooms} rooms
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={formatCurrency(room.rateFor1Night)} 
                          size="small" 
                          sx={{ 
                            backgroundColor: 'primary.main',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: isMobile ? '0.7rem' : '0.75rem'
                          }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {rooms.length === 0 && selectedHotel && (
            <Alert 
              severity="info" 
              sx={{ 
                mt: 2,
                borderRadius: 1
              }}
              icon={<OvernightIcon />}
            >
              No overnight rooms available in this hotel
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Initialize Inventory */}
      {selectedRoom && (
        <Card sx={{ 
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Initialize Inventory
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
              Will create inventory for selected date range
            </Alert>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={isMobile ? 12 : 6} md={4}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    Start Date
                  </Typography>
                  <StyledDatePicker
                    selected={initializeStartDate}
                    onChange={(date: Date | null) => date && setInitializeStartDate(date)}
                    minDate={new Date()}
                    customInput={<CustomInput />}
                    dateFormat="MMM d, yyyy"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={isMobile ? 12 : 6} md={4}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    End Date
                  </Typography>
                  <StyledDatePicker
                    selected={initializeEndDate}
                    onChange={(date: Date | null) => date && setInitializeEndDate(date)}
                    minDate={initializeStartDate}
                    customInput={<CustomInput />}
                    dateFormat="MMM d, yyyy"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleInitializeInventory}
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                  sx={{
                    height: { xs: '48px', sm: '56px' },
                    borderRadius: 1.5,
                    fontWeight: 600
                  }}
                >
                  Initialize
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Update Single Date */}
      {selectedRoom && (
        <Card sx={{ 
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Update Single Date
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <StyledDatePicker
                  selected={updateDate}
                  onChange={(date: Date | null) => date && setUpdateDate(date)}
                  minDate={new Date()}
                  customInput={<CustomInput />}
                  dateFormat="MMM d, yyyy"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Available Rooms"
                  type="number"
                  size={isMobile ? "small" : "medium"}
                  value={overnightAvailable}
                  onChange={(e) => setOvernightAvailable(e.target.value)}
                  helperText={`Max: ${selectedRoomData?.availableRooms || 0}`}
                  InputProps={{
                    startAdornment: (
                      <GroupIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Rate per Night"
                  type="number"
                  size={isMobile ? "small" : "medium"}
                  value={overnightRate}
                  onChange={(e) => setOvernightRate(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <RupeeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleUpdateSingleInventory}
                  disabled={loading}
                  startIcon={<CheckIcon />}
                  sx={{
                    height: { xs: '48px', sm: '56px' },
                    borderRadius: 1.5,
                    fontWeight: 600
                  }}
                >
                  Update
                </Button>
              </Grid>
            </Grid>
            
            {overnightAvailable !== '' && parseInt(overnightAvailable) === 0 && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
                Setting available rooms to 0 will mark as blocked
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Update */}
      {selectedRoom && (
        <Card sx={{ 
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Bulk Update Date Range
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    From Date
                  </Typography>
                  <StyledDatePicker
                    selected={bulkUpdateDate.start}
                    onChange={(date: Date | null) => date && setBulkUpdateDate(prev => ({ ...prev, start: date }))}
                    minDate={new Date()}
                    customInput={<CustomInput />}
                    dateFormat="MMM d, yyyy"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    To Date
                  </Typography>
                  <StyledDatePicker
                    selected={bulkUpdateDate.end}
                    onChange={(date: Date | null) => date && setBulkUpdateDate(prev => ({ ...prev, end: date }))}
                    minDate={bulkUpdateDate.start}
                    customInput={<CustomInput />}
                    dateFormat="MMM d, yyyy"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Available Rooms"
                  type="number"
                  size={isMobile ? "small" : "medium"}
                  value={bulkOvernightAvailable}
                  onChange={(e) => setBulkOvernightAvailable(e.target.value)}
                  placeholder="Leave empty to keep"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Rate per Night"
                  type="number"
                  size={isMobile ? "small" : "medium"}
                  value={bulkOvernightRate}
                  onChange={(e) => setBulkOvernightRate(e.target.value)}
                  placeholder="Leave empty to keep"
                  InputProps={{
                    startAdornment: (
                      <RupeeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleBulkUpdateInventory}
                  disabled={loading || (bulkOvernightAvailable === '' && bulkOvernightRate === '')}
                  startIcon={<CheckIcon />}
                  sx={{
                    borderRadius: 1.5,
                    fontWeight: 600,
                    px: 3
                  }}
                >
                  Apply Bulk Update
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Block/Unblock */}
      {selectedRoom && (
        <Card sx={{ 
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Block/Unblock Date
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <StyledDatePicker
                  selected={blockDate}
                  onChange={(date: Date | null) => date && setBlockDate(date)}
                  minDate={new Date()}
                  customInput={<CustomInput />}
                  dateFormat="MMM d, yyyy"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Reason"
                  size={isMobile ? "small" : "medium"}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Reason for blocking"
                />
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1,
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                      const item = getInventoryForDate(blockDate);
                      if (item) handleToggleBlock(item.id, true);
                      else showSnackbar('No inventory found', 'warning');
                    }}
                    disabled={loading || !blockReason}
                    startIcon={<LockIcon />}
                    sx={{
                      flex: 1,
                      borderRadius: 1.5,
                      fontWeight: 600
                    }}
                  >
                    Block
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => {
                      const item = getInventoryForDate(blockDate);
                      if (item) handleToggleBlock(item.id, false);
                      else showSnackbar('No inventory found', 'warning');
                    }}
                    disabled={loading}
                    startIcon={<UnlockIcon />}
                    sx={{
                      flex: 1,
                      borderRadius: 1.5,
                      fontWeight: 600
                    }}
                  >
                    Unblock
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {inventory.length > 0 && (
        <Card sx={{ 
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Filters
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>Availability</InputLabel>
                  <Select
                    value={availabilityFilter}
                    label="Availability"
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Dates</MenuItem>
                    <MenuItem value="available">Available Only</MenuItem>
                    <MenuItem value="soldout">Sold Out Only</MenuItem>
                    <MenuItem value="blocked">Blocked Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <StyledDatePicker
                  selected={searchDate}
                  onChange={(date: Date | null) => setSearchDate(date)}
                  minDate={new Date()}
                  customInput={<CustomInput />}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Search by date..."
                  isClearable
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1,
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <Button
                    fullWidth={isMobile}
                    variant="outlined"
                    onClick={handleSelectAll}
                    sx={{ borderRadius: 1.5 }}
                  >
                    {selectedItems.length === inventory.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Chip 
                    icon={<OvernightIcon />} 
                    label={`${stats.totalDays} Dates`} 
                    color="primary" 
                    variant="outlined" 
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      {inventory.length > 0 && (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'flex-start' : 'center',
              mb: 2,
              gap: isMobile ? 1 : 0
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Inventory Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredInventory.length} dates found
              </Typography>
            </Box>
            
            <TableContainer component={Paper} variant="outlined" sx={{ 
              borderRadius: 1,
              maxHeight: { xs: '400px', sm: '500px' },
              overflow: 'auto'
            }}>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    {!isMobile && <TableCell align="center" sx={{ fontWeight: 700 }}>Day</TableCell>}
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Available</TableCell>
                    {!isTablet && <TableCell align="center" sx={{ fontWeight: 700 }}>Booked</TableCell>}
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Rate</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                    {!isTablet && <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInventory.map((item: InventoryItem) => {
                    const isSelected = selectedItems.includes(item.id);
                    const isWeekend = [0, 6].includes(new Date(item.date).getDay());
                    
                    return (
                      <TableRow 
                        key={item.id}
                        hover
                        selected={isSelected}
                        onClick={() => handleSelectItem(item.id)}
                        sx={{
                          cursor: 'pointer',
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectItem(item.id);
                              }}
                            />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {isMobile ? formatDate(item.date) : formatLongDate(item.date)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        {!isMobile && (
                          <TableCell align="center">
                            <Chip
                              label={isWeekend ? 'Weekend' : 'Weekday'}
                              size="small"
                              color={isWeekend ? 'secondary' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                        )}
                        
                        <TableCell align="center">
                          <Typography 
                            variant="body1"
                            color={item.overnightAvailable === 0 ? 'error' : 'text.primary'}
                            fontWeight={600}
                          >
                            {item.overnightAvailable}
                          </Typography>
                        </TableCell>
                        
                        {!isTablet && (
                          <TableCell align="center">
                            <Typography color="text.secondary">
                              {item.overnightBooked}
                            </Typography>
                          </TableCell>
                        )}
                        
                        <TableCell align="center">
                          <Typography 
                            variant="body1"
                            fontWeight={600}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
                          >
                            <RupeeIcon fontSize="small" />
                            {item.overnightRate.toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="center">
                          {item.isBlocked ? (
                            <Chip
                              label={isMobile ? "Blk" : "Blocked"}
                              color="error"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : item.overnightAvailable === 0 ? (
                            <Chip
                              label={isMobile ? "Sold" : "Sold Out"}
                              color="warning"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : (
                            <Chip
                              label={isMobile ? "Avail" : "Available"}
                              color="success"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </TableCell>
                        
                        {!isTablet && (
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    loadItemForEditing(item);
                                  }}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItemToDelete(item.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            {filteredInventory.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <OvernightIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No inventory found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your filters
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Delete Inventory Item
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this inventory item? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => {
              if (itemToDelete) {
                handleDeleteInventory(itemToDelete);
              }
            }}
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading */}
      {loading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ 
          vertical: isMobile ? 'top' : 'bottom', 
          horizontal: 'center' 
        }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 1
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default OvernightInventoryManagement;