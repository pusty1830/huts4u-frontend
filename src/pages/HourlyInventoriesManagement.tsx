import React, { useState, useEffect, useCallback } from 'react';
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
  FormControlLabel,
  Switch
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
  AccessTime as HourlyIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Group as GroupIcon,
  CurrencyRupee as RupeeIcon
} from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { alpha, styled } from '@mui/material/styles';
import { getUserId } from '../services/axiosClient';
import { getAllHotels, getAllRooms, createInventory, getAllInventories, udateInventory, deletInventory } from '../services/services';

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

interface HotelStayTypes {
  [hotelId: string]: string[];
}

interface Room {
  id: string;
  hotelId: string;
  roomCategory: string;
  roomSize: string;
  stayType: 'Overnight' | 'Hourly' | 'Both';
  availableRooms: number;
  rateFor1Night: number;
  rateFor3Hour: number;
  rateFor6Hour: number;
  rateFor12Hour: number;
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

// Time Slot Types
interface TimeSlot {
  id: '3hour' | '6hour' | '12hour';
  name: string;
  duration: number;
  label: string;
  description: string;
  maxRooms: number;
}


// Custom Input Component


// Styled DatePicker with Custom Popup
const StyledDatePicker = styled(DatePicker)(({ theme }) => ({
  width: '100%',
  '& .react-datepicker': {
    fontFamily: theme.typography.fontFamily,
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: theme.shape.borderRadius * 1.5,
    boxShadow: theme.shadows[3],
  },
  '& .react-datepicker__header': {
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(2),
  },
  '& .react-datepicker__current-month': {
    ...theme.typography.subtitle1,
    fontWeight: 600,
  },
  '& .react-datepicker__day-names': {
    marginTop: theme.spacing(1),
  },
  '& .react-datepicker__day-name': {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    width: '2.5rem',
    lineHeight: '2.5rem',
  },
  '& .react-datepicker__day': {
    ...theme.typography.body2,
    width: '2.5rem',
    height: '2.5rem',
    lineHeight: '2.5rem',
    borderRadius: '50%',
    margin: '0.2rem',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
    },
  },
  '& .react-datepicker__day--selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  '& .react-datepicker__day--keyboard-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.text.primary,
  },
  '& .react-datepicker__navigation': {
    top: '16px',
  },
  '& .react-datepicker__navigation-icon::before': {
    borderColor: theme.palette.text.secondary,
  },
}));

// Helper function to get hotel name
const getHotelName = (hotel: Hotel | undefined): string => {
  return hotel?.propertyName || hotel?.name || "Unknown Hotel";
};

// Function to fetch hotels with ONLY Hourly stay types
const fetchHotelsWithHourlyStayTypes = async (
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
    
    // Fetch rooms to check which hotels have Hourly rooms
    const roomsPayload = { 
      data: { filter: "" }, 
      page: 0, 
      pageSize: 1000, 
      order: [["createdAt", "ASC"]] 
    };
    const roomsRes = await getAllRooms(roomsPayload);
    const roomList = roomsRes?.data?.data?.rows || roomsRes?.data?.rows || roomsRes?.data || [];
    
    // Create hotel options - ONLY hotels that have Hourly rooms
    const options = hotelList
      .filter((hotel: Hotel) => {
        // Check if hotel has Hourly or Both rooms
        const hasHourlyRooms = roomList.some((room: any) => 
          room.hotelId === hotel.id && 
          (room.stayType === 'Hourly' || room.stayType === 'Both')
        );
        return hasHourlyRooms;
      })
      .map((hotel: Hotel) => {
        const hotelName = getHotelName(hotel);
        
        // For Hourly Inventory page, always show "Hourly" in the label
        return {
          id: hotel.id,
          name: hotelName,
          displayLabel: `${hotelName} (Hourly)`
        };
      });

    // Sort alphabetically
    options.sort((a:any, b:any) => a.name.localeCompare(b.name));
    
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

const HourlyInventoryManagement: React.FC = () => {
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
  
  // Time Slots Configuration
  const timeSlots: TimeSlot[] = [
    { 
      id: '3hour', 
      name: '3-Hour Slot', 
      duration: 3, 
      label: '3h',
      description: 'Short stays (7-10, 10-1, 1-4, 4-7, 7-10, 10-1, 1-4, 4-7)',
      maxRooms: 7 // Can use all 7 rooms
    },
    { 
      id: '6hour', 
      name: '6-Hour Slot', 
      duration: 6, 
      label: '6h',
      description: 'Half-day stays (7-1, 1-7, 7-1, 1-7)',
      maxRooms: 3 // Limited to 3 rooms
    },
    { 
      id: '12hour', 
      name: '12-Hour Slot', 
      duration: 12, 
      label: '12h',
      description: 'Full-day stays (7-7)',
      maxRooms: 1 // Limited to 1 room
    }
  ];
  
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>(timeSlots[0]);
  
  // Hotel stay types
  const [hotelStayTypes, setHotelStayTypes] = useState<HotelStayTypes>({});
  
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
  
  // Forms - Individual Time Slot with auto-calculations
  const [threeHourAvailable, setThreeHourAvailable] = useState<string>('');
  const [threeHourRate, setThreeHourRate] = useState<string>('');
  const [sixHourAvailable, setSixHourAvailable] = useState<string>('');
  const [sixHourRate, setSixHourRate] = useState<string>('');
  const [twelveHourAvailable, setTwelveHourAvailable] = useState<string>('');
  const [twelveHourRate, setTwelveHourRate] = useState<string>('');
  
  // Block all time slots for a date
  const [blockDate, setBlockDate] = useState<Date>(new Date());
  const [blockReason, setBlockReason] = useState('');
  
  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Smart allocation mode
  const [smartAllocationMode, setSmartAllocationMode] = useState(true);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Total rooms available (should be 7)
  const totalRooms = selectedRoomData?.availableRooms || 7;

  // Fetch hotels on mount - UPDATED
  useEffect(() => {
    fetchHotelsWithHourlyStayTypes(setHotels, setSelectedHotel);
  }, []);

  // Fetch rooms when hotel selected - ONLY Hourly rooms
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

  // Reset form when time slot changes
  useEffect(() => {
    if (selectedRoomData) {
      resetTimeSlotForm();
    }
  }, [selectedTimeSlot, selectedRoomData]);

  // Auto-calculate allocations when any slot changes
  useEffect(() => {
    if (smartAllocationMode && selectedRoomData) {
      autoCalculateAllocations();
    }
  }, [threeHourAvailable, sixHourAvailable, twelveHourAvailable, smartAllocationMode]);

  // FIXED: Set form values when clicking edit from table
  useEffect(() => {
    if (updateDate && inventory.length > 0) {
      const item = getInventoryForDate(updateDate);
      if (item) {
        setThreeHourAvailable(item.threeHourAvailable.toString());
        setThreeHourRate(item.threeHourRate.toString());
        setSixHourAvailable(item.sixHourAvailable.toString());
        setSixHourRate(item.sixHourRate.toString());
        setTwelveHourAvailable(item.twelveHourAvailable.toString());
        setTwelveHourRate(item.twelveHourRate.toString());
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
      
      // 🔥 FILTER: Only show Hourly rooms (Hourly or Both)
      const hourlyRooms = allRooms.filter((room: any) => 
        room.stayType === 'Hourly' || room.stayType === 'Both'
      );
      
      setRooms(hourlyRooms);
      setSelectedRoom('');
      setSelectedRoomData(null);
      setInventory([]);
      
      if (hourlyRooms.length === 0) {
        showSnackbar('No hourly rooms available in this hotel', 'info');
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
      
      // Set selected room data
      const roomData = rooms.find(room => room.id === selectedRoom);
      setSelectedRoomData(roomData || null);
      
      // Call getAllInventories API
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

  const resetTimeSlotForm = () => {
    if (!selectedRoomData) return;
    
    // Set initial values based on selected time slot and room data
    const defaultThreeHour = Math.min(selectedRoomData.availableRooms, 7);
    const defaultSixHour = Math.min(selectedRoomData.availableRooms, 3);
    const defaultTwelveHour = Math.min(selectedRoomData.availableRooms, 1);
    
    setThreeHourAvailable(defaultThreeHour.toString());
    setThreeHourRate(selectedRoomData.rateFor3Hour?.toString() || '');
    
    // Only set 6-hour if rate exists
    if (selectedRoomData.rateFor6Hour && selectedRoomData.rateFor6Hour > 0) {
      setSixHourAvailable(defaultSixHour.toString());
      setSixHourRate(selectedRoomData.rateFor6Hour.toString());
    } else {
      setSixHourAvailable('');
      setSixHourRate('');
    }
    
    // Only set 12-hour if rate exists
    if (selectedRoomData.rateFor12Hour && selectedRoomData.rateFor12Hour > 0) {
      setTwelveHourAvailable(defaultTwelveHour.toString());
      setTwelveHourRate(selectedRoomData.rateFor12Hour.toString());
    } else {
      setTwelveHourAvailable('');
      setTwelveHourRate('');
    }
  };

  // Auto-calculate allocations to respect total room limit
  const autoCalculateAllocations = () => {
    if (!smartAllocationMode) return;
    
    const threeHour = threeHourAvailable ? parseInt(threeHourAvailable) : 0;
    const sixHour = sixHourAvailable ? parseInt(sixHourAvailable) : 0;
    const twelveHour = twelveHourAvailable ? parseInt(twelveHourAvailable) : 0;
    
    const totalAllocated = threeHour + sixHour + twelveHour;
    
    // If total exceeds 7 rooms, adjust the selected time slot
    if (totalAllocated > totalRooms) {
      const excess = totalAllocated - totalRooms;
      
      switch (selectedTimeSlot.id) {
        case '3hour':
          const newThreeHour = Math.max(0, threeHour - excess);
          setThreeHourAvailable(newThreeHour.toString());
          break;
        case '6hour':
          const newSixHour = Math.max(0, sixHour - excess);
          setSixHourAvailable(newSixHour.toString());
          break;
        case '12hour':
          const newTwelveHour = Math.max(0, twelveHour - excess);
          setTwelveHourAvailable(newTwelveHour.toString());
          break;
      }
    }
  };

  // Calculate remaining rooms
  const calculateRemainingRooms = () => {
    const threeHour = threeHourAvailable ? parseInt(threeHourAvailable) : 0;
    const sixHour = sixHourAvailable ? parseInt(sixHourAvailable) : 0;
    const twelveHour = twelveHourAvailable ? parseInt(twelveHourAvailable) : 0;
    
    const totalAllocated = threeHour + sixHour + twelveHour;
    return Math.max(0, totalRooms - totalAllocated);
  };

  // Check if time slot should be shown
  const shouldShowTimeSlot = (slotId: '3hour' | '6hour' | '12hour') => {
    if (!selectedRoomData) return false;
    
    switch (slotId) {
      case '3hour':
        return true; // Always show 3-hour
      case '6hour':
        return selectedRoomData.rateFor6Hour && selectedRoomData.rateFor6Hour > 0;
      case '12hour':
        return selectedRoomData.rateFor12Hour && selectedRoomData.rateFor12Hour > 0;
      default:
        return false;
    }
  };

  // CREATE: Initialize inventory for date range with smart allocation
  const handleInitializeInventory = async () => {
    if (!selectedRoom || !selectedRoomData) {
      showSnackbar('Please select a room first', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const startStr = initializeStartDate.toISOString().split('T')[0];
      const endStr = initializeEndDate.toISOString().split('T')[0];
      
      // Get existing inventory to avoid duplicates
      const existingDates = inventory.map(item => item.date);
      const start = new Date(initializeStartDate);
      const end = new Date(initializeEndDate);
      let createdCount = 0;
      let skippedCount = 0;
      
      while (start <= end) {
        const currentDate = start.toISOString().split('T')[0];
        
        // Check if inventory already exists for this date
        if (!existingDates.includes(currentDate)) {
          try {
            // Calculate smart allocations for 7 rooms
            const threeHourAllocation = Math.min(selectedRoomData.availableRooms, 7);
            const sixHourAllocation = selectedRoomData.rateFor6Hour && selectedRoomData.rateFor6Hour > 0 
              ? Math.min(selectedRoomData.availableRooms, 3) 
              : 0;
            const twelveHourAllocation = selectedRoomData.rateFor12Hour && selectedRoomData.rateFor12Hour > 0 
              ? Math.min(selectedRoomData.availableRooms, 1) 
              : 0;
            
            // Adjust allocations to not exceed 7
            let adjustedThreeHour = threeHourAllocation;
            let adjustedSixHour = sixHourAllocation;
            let adjustedTwelveHour = twelveHourAllocation;
            
            const totalAllocated = threeHourAllocation + sixHourAllocation + twelveHourAllocation;
            if (totalAllocated > selectedRoomData.availableRooms) {
              // Prioritize 3-hour slots (most flexible)
              const excess = totalAllocated - selectedRoomData.availableRooms;
              adjustedThreeHour = Math.max(0, threeHourAllocation - excess);
            }
            
            await createInventory({
              roomId: selectedRoom,
              date: currentDate,
              stayType: 'Hourly',
              overnightAvailable: 0,
              overnightBooked: 0,
              overnightRate: 0,
              threeHourAvailable: adjustedThreeHour,
              threeHourBooked: 0,
              threeHourRate: selectedRoomData.rateFor3Hour || 0,
              sixHourAvailable: adjustedSixHour,
              sixHourBooked: 0,
              sixHourRate: selectedRoomData.rateFor6Hour || 0,
              twelveHourAvailable: adjustedTwelveHour,
              twelveHourBooked: 0,
              twelveHourRate: selectedRoomData.rateFor12Hour || 0,
              isBlocked: false,
              notes: 'Auto-initialized (Smart Hourly Allocation)'
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
        `Hourly inventory initialized: ${createdCount} new records created, ${skippedCount} already existed`,
        'success'
      );
      
      // Refresh inventory
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

  // Get current time slot values
  const getCurrentTimeSlotValues = () => {
    switch (selectedTimeSlot.id) {
      case '3hour':
        return { 
          available: threeHourAvailable || '', 
          rate: threeHourRate || '',
          defaultRate: selectedRoomData?.rateFor3Hour || 0
        };
      case '6hour':
        return { 
          available: sixHourAvailable || '', 
          rate: sixHourRate || '',
          defaultRate: selectedRoomData?.rateFor6Hour || 0
        };
      case '12hour':
        return { 
          available: twelveHourAvailable || '', 
          rate: twelveHourRate || '',
          defaultRate: selectedRoomData?.rateFor12Hour || 0
        };
      default:
        return { available: '', rate: '', defaultRate: 0 };
    }
  };

  // Set current time slot values with validation
  const setCurrentTimeSlotValues = (available: string, rate: string) => {
    // Validate max rooms for time slot
    const maxRooms = timeSlots.find(slot => slot.id === selectedTimeSlot.id)?.maxRooms || 7;
    const availableNum = available === '' ? 0 : parseInt(available);
    const validatedAvailable = Math.min(availableNum, maxRooms);
    
    switch (selectedTimeSlot.id) {
      case '3hour':
        setThreeHourAvailable(validatedAvailable.toString());
        setThreeHourRate(rate);
        break;
      case '6hour':
        setSixHourAvailable(validatedAvailable.toString());
        setSixHourRate(rate);
        break;
      case '12hour':
        setTwelveHourAvailable(validatedAvailable.toString());
        setTwelveHourRate(rate);
        break;
    }
  };

  // Check if all time slots are sold out
  const isAllTimeSlotsSoldOut = (item: InventoryItem) => {
    const threeHourSoldOut = item.threeHourAvailable === 0;
    const sixHourSoldOut = shouldShowTimeSlot('6hour') ? item.sixHourAvailable === 0 : true;
    const twelveHourSoldOut = shouldShowTimeSlot('12hour') ? item.twelveHourAvailable === 0 : true;
    
    return threeHourSoldOut && sixHourSoldOut && twelveHourSoldOut;
  };

  // Helper function to format currency as Rs.
  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
  };

  // UPDATE: Update single time slot for specific date
  const handleUpdateSingleTimeSlot = async () => {
    if (!selectedRoom) {
      showSnackbar('Please select a room first', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const dateStr = updateDate.toISOString().split('T')[0];
      const existingItem = getInventoryForDate(updateDate);
      
      if (!existingItem) {
        showSnackbar('No inventory found for this date. Please initialize first.', 'warning');
        return;
      }
      
      const currentValues = getCurrentTimeSlotValues();
      const updateData: any = {};
      
      // Set update data based on selected time slot
      switch (selectedTimeSlot.id) {
        case '3hour':
          updateData.threeHourAvailable = currentValues.available === '' ? 0 : parseInt(currentValues.available);
          updateData.threeHourRate = currentValues.rate === '' ? 0 : parseFloat(currentValues.rate);
          break;
        case '6hour':
          if (selectedRoomData?.rateFor6Hour && selectedRoomData.rateFor6Hour > 0) {
            updateData.sixHourAvailable = currentValues.available === '' ? 0 : parseInt(currentValues.available);
            updateData.sixHourRate = currentValues.rate === '' ? 0 : parseFloat(currentValues.rate);
          }
          break;
        case '12hour':
          if (selectedRoomData?.rateFor12Hour && selectedRoomData.rateFor12Hour > 0) {
            updateData.twelveHourAvailable = currentValues.available === '' ? 0 : parseInt(currentValues.available);
            updateData.twelveHourRate = currentValues.rate === '' ? 0 : parseFloat(currentValues.rate);
          }
          break;
      }
      
      // Check if all time slots are now 0, then block the date
      const newThreeHourAvailable = selectedTimeSlot.id === '3hour' ? 
        (currentValues.available === '' ? 0 : parseInt(currentValues.available)) : 
        existingItem.threeHourAvailable;
      
      const newSixHourAvailable = selectedTimeSlot.id === '6hour' ? 
        (currentValues.available === '' ? 0 : parseInt(currentValues.available)) : 
        existingItem.sixHourAvailable;
      
      const newTwelveHourAvailable = selectedTimeSlot.id === '12hour' ? 
        (currentValues.available === '' ? 0 : parseInt(currentValues.available)) : 
        existingItem.twelveHourAvailable;
      
      const threeHourZero = newThreeHourAvailable === 0;
      const sixHourZero = shouldShowTimeSlot('6hour') ? newSixHourAvailable === 0 : true;
      const twelveHourZero = shouldShowTimeSlot('12hour') ? newTwelveHourAvailable === 0 : true;
      
      if (threeHourZero && sixHourZero && twelveHourZero) {
        updateData.isBlocked = true;
        showSnackbar('All time slots are now 0 - date will be marked as blocked', 'info');
      }
      
      await udateInventory(existingItem.id, updateData);
      
      showSnackbar(`${selectedTimeSlot.name} updated successfully`, 'success');
      
      // Refresh inventory
      fetchInventory();
      
      // DON'T reset form - keep values for editing
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to update time slot', 'error');
    } finally {
      setLoading(false);
    }
  };

  // UPDATE: Block/Unblock all time slots for a date
  const handleToggleBlockAll = async (inventoryId: string, block: boolean) => {
    try {
      setLoading(true);
      
      const item = inventory.find(item => item.id === inventoryId);
      if (!item) {
        showSnackbar('Inventory item not found', 'error');
        return;
      }
      
      const updateData = {
        isBlocked: block,
        notes: block ? blockReason : 'Unblocked (all time slots)'
      };
      
      await udateInventory(inventoryId, updateData);
      
      showSnackbar(
        `All time slots ${block ? 'blocked' : 'unblocked'} successfully`,
        'success'
      );
      
      // Refresh inventory
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
      
      // Refresh inventory
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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const CustomInput = React.forwardRef<HTMLInputElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
      <TextField
        fullWidth
        value={value}
        onClick={onClick}
        ref={ref}
        InputProps={{
          endAdornment: (
            <IconButton size="small" onClick={onClick}>
              <CalendarIcon />
            </IconButton>
          )
        }}
      />
    )
  );
  CustomInput.displayName = 'CustomInput';

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

  // Load existing values when editing a specific date
  const loadItemForEditing = (item: InventoryItem) => {
    setUpdateDate(new Date(item.date));
    setThreeHourAvailable(item.threeHourAvailable.toString());
    setThreeHourRate(item.threeHourRate.toString());
    setSixHourAvailable(item.sixHourAvailable.toString());
    setSixHourRate(item.sixHourRate.toString());
    setTwelveHourAvailable(item.twelveHourAvailable.toString());
    setTwelveHourRate(item.twelveHourRate.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate room allocation status
  const calculateAllocationStatus = () => {
    const remaining = calculateRemainingRooms();
    const threeHour = threeHourAvailable ? parseInt(threeHourAvailable) : 0;
    const sixHour = sixHourAvailable ? parseInt(sixHourAvailable) : 0;
    const twelveHour = twelveHourAvailable ? parseInt(twelveHourAvailable) : 0;
    const allocated = threeHour + sixHour + twelveHour;
    
    return {
      remaining,
      allocated,
      total: totalRooms,
      percentage: (allocated / totalRooms) * 100
    };
  };

  const allocationStatus = calculateAllocationStatus();

  // Get numeric values for display
  const getThreeHourAvailable = () => threeHourAvailable ? parseInt(threeHourAvailable) : 0;
  const getSixHourAvailable = () => sixHourAvailable ? parseInt(sixHourAvailable) : 0;
  const getTwelveHourAvailable = () => twelveHourAvailable ? parseInt(twelveHourAvailable) : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Hourly Inventory Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Smart allocation of 7 rooms across 3-hour, 6-hour, and 12-hour slots
        </Typography>
      </Box>

      {/* Hotel and Room Selection */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Hotel</InputLabel>
                <Select
                  value={selectedHotel}
                  label="Select Hotel"
                  onChange={(e) => setSelectedHotel(e.target.value)}
                >
                  <MenuItem value="">Select a hotel</MenuItem>
                  {hotels.map(hotel => (
                    <MenuItem key={hotel.id} value={hotel.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <HotelIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                           <Typography>{hotel.displayLabel}</Typography> {/* CHANGED FROM hotel.propertyName */}
                          <Typography variant="caption" color="text.secondary">
                            {hotel.name}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Hourly Room</InputLabel>
                <Select
                  value={selectedRoom}
                  label="Select Hourly Room"
                  onChange={(e) => {
                    setSelectedRoom(e.target.value);
                    const room = rooms.find(r => r.id === e.target.value);
                    setSelectedRoomData(room || null);
                    resetTimeSlotForm();
                  }}
                  disabled={!selectedHotel || rooms.length === 0}
                >
                  <MenuItem value="">Select a room</MenuItem>
                  {rooms.map(room => (
                    <MenuItem key={room.id} value={room.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {room.roomCategory}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {room.stayType} • {room.roomSize} • {room.availableRooms} rooms
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <HourlyIcon sx={{ color: 'secondary.main', fontSize: 16 }} />
                          <Chip 
                            label={`${room.availableRooms} rooms`} 
                            size="small" 
                            sx={{ 
                              backgroundColor: 'secondary.main',
                              color: '#fff',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {rooms.length === 0 && selectedHotel && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <HourlyIcon sx={{ mr: 1 }} />
              No hourly rooms available in this hotel. Please select another hotel.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Smart Allocation Settings */}
      {selectedRoomData && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Room Allocation Configuration
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={smartAllocationMode}
                    onChange={(e) => setSmartAllocationMode(e.target.checked)}
                    color="primary"
                  />
                }
                label="Smart Allocation"
              />
            </Box>
            
            {/* Room Allocation Visualization */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon fontSize="small" />
                Room Allocation Status
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                {/* Allocation Bar */}
                <Box sx={{ 
                  height: 40, 
                  bgcolor: 'grey.200', 
                  borderRadius: 2,
                  position: 'relative',
                  mb: 2,
                  overflow: 'hidden'
                }}>
                  {/* 3-hour allocation */}
                  {getThreeHourAvailable() > 0 && (
                    <Box sx={{
                      position: 'absolute',
                      left: 0,
                      width: `${(getThreeHourAvailable() / totalRooms) * 100}%`,
                      height: '100%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {getThreeHourAvailable()}×3h
                    </Box>
                  )}
                  
                  {/* 6-hour allocation */}
                  {getSixHourAvailable() > 0 && (
                    <Box sx={{
                      position: 'absolute',
                      left: `${(getThreeHourAvailable() / totalRooms) * 100}%`,
                      width: `${(getSixHourAvailable() / totalRooms) * 100}%`,
                      height: '100%',
                      bgcolor: 'secondary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {getSixHourAvailable()}×6h
                    </Box>
                  )}
                  
                  {/* 12-hour allocation */}
                  {getTwelveHourAvailable() > 0 && (
                    <Box sx={{
                      position: 'absolute',
                      left: `${((getThreeHourAvailable() + getSixHourAvailable()) / totalRooms) * 100}%`,
                      width: `${(getTwelveHourAvailable() / totalRooms) * 100}%`,
                      height: '100%',
                      bgcolor: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {getTwelveHourAvailable()}×12h
                    </Box>
                  )}
                  
                  {/* Remaining rooms */}
                  {allocationStatus.remaining > 0 && (
                    <Box sx={{
                      position: 'absolute',
                      left: `${((getThreeHourAvailable() + getSixHourAvailable() + getTwelveHourAvailable()) / totalRooms) * 100}%`,
                      width: `${(allocationStatus.remaining / totalRooms) * 100}%`,
                      height: '100%',
                      bgcolor: 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary',
                      fontWeight: 'bold'
                    }}>
                      {allocationStatus.remaining} free
                    </Box>
                  )}
                </Box>
                
                {/* Stats */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {getThreeHourAvailable()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        3-Hour Rooms (Max 7)
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Rate: {formatCurrency(selectedRoomData.rateFor3Hour || 0)}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  {shouldShowTimeSlot('6hour') && (
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary">
                          {getSixHourAvailable()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          6-Hour Rooms (Max 3)
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Rate: {formatCurrency(selectedRoomData.rateFor6Hour || 0)}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  
                  {shouldShowTimeSlot('12hour') && (
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success">
                          {getTwelveHourAvailable()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          12-Hour Rooms (Max 1)
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Rate: {formatCurrency(selectedRoomData.rateFor12Hour || 0)}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
                
                {/* Smart Allocation Info */}
                {smartAllocationMode && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <InfoIcon sx={{ mr: 1 }} />
                    Smart Allocation is ON: Total rooms across all time slots will not exceed {totalRooms}.
                    When you update one slot, others will auto-adjust.
                  </Alert>
                )}
              </Box>
            </Paper>
          </CardContent>
        </Card>
      )}

      {/* Time Slot Selection - Only show available slots */}
      {selectedRoom && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Time Slot to Manage
            </Typography>
            <Grid container spacing={2}>
              {timeSlots
                .filter(slot => shouldShowTimeSlot(slot.id))
                .map(slot => (
                  <Grid item xs={12} md={4} key={slot.id}>
                    <Button
                      fullWidth
                      variant={selectedTimeSlot.id === slot.id ? 'contained' : 'outlined'}
                      onClick={() => setSelectedTimeSlot(slot)}
                      startIcon={<ScheduleIcon />}
                      sx={{
                        height: '120px',
                        flexDirection: 'column',
                        gap: 1,
                        textAlign: 'left',
                        alignItems: 'flex-start',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {slot.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {slot.description}
                      </Typography>
                      <Chip 
                        label={`Max: ${slot.maxRooms} rooms`} 
                        size="small" 
                        sx={{ mt: 1 }}
                      />
                    </Button>
                  </Grid>
                ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Initialize Inventory */}
      {selectedRoom && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Initialize Hourly Inventory (CREATE)
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Will create hourly inventory for selected date range with smart allocation:
              • 3-hour slots: Up to 7 rooms, Rate: {formatCurrency(selectedRoomData?.rateFor3Hour || 0)}
              • 6-hour slots: Up to 3 rooms (if rate exists), Rate: {selectedRoomData?.rateFor6Hour ? formatCurrency(selectedRoomData.rateFor6Hour) : 'Not set'}
              • 12-hour slots: Up to 1 room (if rate exists), Rate: {selectedRoomData?.rateFor12Hour ? formatCurrency(selectedRoomData.rateFor12Hour) : 'Not set'}
              Total allocation will not exceed {totalRooms} rooms per day.
            </Alert>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Start Date
                  </Typography>
                  <StyledDatePicker
                    selected={initializeStartDate}
                    onChange={(date: Date | null) => date && setInitializeStartDate(date)}
                    minDate={new Date()}
                    customInput={<CustomInput />}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    End Date
                  </Typography>
                  <StyledDatePicker
                    selected={initializeEndDate}
                    onChange={(date: Date | null) => date && setInitializeEndDate(date)}
                    minDate={initializeStartDate}
                    customInput={<CustomInput />}
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
                >
                  Initialize Inventory
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Update Single Time Slot */}
      {selectedRoom && shouldShowTimeSlot(selectedTimeSlot.id) && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="h6">
                Update {selectedTimeSlot.name}
              </Typography>
              <Chip 
                label={`${selectedTimeSlot.label} (Max: ${selectedTimeSlot.maxRooms} rooms)`} 
                color="primary" 
                size="small"
              />
            </Box>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <StyledDatePicker
                  selected={updateDate}
                  onChange={(date: Date | null) => date && setUpdateDate(date)}
                  minDate={new Date()}
                  customInput={<CustomInput />}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label={`Available Rooms (${selectedTimeSlot.label})`}
                  type="number"
                  value={getCurrentTimeSlotValues().available}
                  onChange={(e) => {
                    const value = e.target.value;
                    const maxAllowed = Math.min(selectedTimeSlot.maxRooms, totalRooms);
                    const validatedValue = value === '' ? '' : Math.min(parseInt(value), maxAllowed).toString();
                    setCurrentTimeSlotValues(validatedValue, getCurrentTimeSlotValues().rate);
                  }}
                  inputProps={{
                    min: 0,
                    max: Math.min(selectedTimeSlot.maxRooms, totalRooms)
                  }}
                  helperText={`Max: ${Math.min(selectedTimeSlot.maxRooms, totalRooms)} rooms`}
                  placeholder="Leave empty for 0"
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label={`Rate per ${selectedTimeSlot.label}`}
                  type="number"
                  value={getCurrentTimeSlotValues().rate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCurrentTimeSlotValues(getCurrentTimeSlotValues().available, value);
                  }}
                  placeholder={`Default: Rs. ${getCurrentTimeSlotValues().defaultRate.toLocaleString('en-IN')}`}
                  InputProps={{
                    startAdornment: (
                      <Typography sx={{ mr: 1 }} color="text.secondary">
                        <RupeeIcon fontSize="small" />
                      </Typography>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleUpdateSingleTimeSlot}
                  disabled={loading}
                  startIcon={<EditIcon />}
                >
                  Update {selectedTimeSlot.label}
                </Button>
              </Grid>
            </Grid>
            
            {/* Allocation Status */}
            {smartAllocationMode && (
              <Alert severity={allocationStatus.remaining > 0 ? "info" : "warning"} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    Allocation: {allocationStatus.allocated}/{allocationStatus.total} rooms allocated
                    ({allocationStatus.remaining} remaining)
                  </Typography>
                  {allocationStatus.remaining === 0 && (
                    <Chip label="FULLY ALLOCATED" size="small" color="warning" />
                  )}
                </Box>
              </Alert>
            )}
            
            {(getCurrentTimeSlotValues().available === '' || getCurrentTimeSlotValues().available === '0') && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Setting available rooms to 0 for this time slot. If all time slots become 0, the date will be marked as blocked.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Block/Unblock All Time Slots */}
      {selectedRoom && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Block/Unblock All Time Slots
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <StyledDatePicker
                  selected={blockDate}
                  onChange={(date: Date | null) => date && setBlockDate(date)}
                  minDate={new Date()}
                  customInput={<CustomInput />}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Reason"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Reason for blocking all time slots"
                />
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                      const item = getInventoryForDate(blockDate);
                      if (item) handleToggleBlockAll(item.id, true);
                      else showSnackbar('No inventory found for this date', 'warning');
                    }}
                    disabled={loading || !blockReason}
                    startIcon={<BlockIcon />}
                  >
                    Block All Time Slots
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => {
                      const item = getInventoryForDate(blockDate);
                      if (item) handleToggleBlockAll(item.id, false);
                      else showSnackbar('No inventory found for this date', 'warning');
                    }}
                    disabled={loading}
                    startIcon={<UnlockIcon />}
                  >
                    Unblock All Time Slots
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      {inventory.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Hourly Inventory Overview (READ)
              </Typography>
              <Chip 
                icon={<HourlyIcon />} 
                label={`${totalRooms} Rooms Allocation`} 
                color="secondary" 
                variant="outlined" 
              />
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell align="center"><strong>3-Hour</strong></TableCell>
                    {shouldShowTimeSlot('6hour') && (
                      <TableCell align="center"><strong>6-Hour</strong></TableCell>
                    )}
                    {shouldShowTimeSlot('12hour') && (
                      <TableCell align="center"><strong>12-Hour</strong></TableCell>
                    )}
                    <TableCell align="center"><strong>Total</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item: InventoryItem) => {
                    const allSoldOut = isAllTimeSlotsSoldOut(item);
                    const totalAllocated = item.threeHourAvailable + 
                      (shouldShowTimeSlot('6hour') ? item.sixHourAvailable : 0) + 
                      (shouldShowTimeSlot('12hour') ? item.twelveHourAvailable : 0);
                    
                    return (
                      <TableRow key={item.id} sx={{
                        backgroundColor: item.isBlocked ? 'rgba(244, 67, 54, 0.08)' : 
                                      allSoldOut ? 'rgba(255, 152, 0, 0.08)' : 
                                      totalAllocated === totalRooms ? 'rgba(76, 175, 80, 0.08)' : 'inherit'
                      }}>
                        <TableCell>
                          {formatDate(item.date)}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={`Rate: ${formatCurrency(item.threeHourRate)} | Booked: ${item.threeHourBooked}`}>
                            <Box>
                              <Typography 
                                color={item.threeHourAvailable === 0 ? 'error' : 'inherit'}
                                fontWeight={item.threeHourAvailable === 0 ? 'bold' : 'normal'}
                              >
                                {item.threeHourAvailable}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        
                        {shouldShowTimeSlot('6hour') && (
                          <TableCell align="center">
                            <Tooltip title={`Rate: ${formatCurrency(item.sixHourRate)} | Booked: ${item.sixHourBooked}`}>
                              <Box>
                                <Typography 
                                  color={item.sixHourAvailable === 0 ? 'error' : 'inherit'}
                                  fontWeight={item.sixHourAvailable === 0 ? 'bold' : 'normal'}
                                >
                                  {item.sixHourAvailable}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                        )}
                        
                        {shouldShowTimeSlot('12hour') && (
                          <TableCell align="center">
                            <Tooltip title={`Rate: ${formatCurrency(item.twelveHourRate)} | Booked: ${item.twelveHourBooked}`}>
                              <Box>
                                <Typography 
                                  color={item.twelveHourAvailable === 0 ? 'error' : 'inherit'}
                                  fontWeight={item.twelveHourAvailable === 0 ? 'bold' : 'normal'}
                                >
                                  {item.twelveHourAvailable}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                        )}
                        
                        <TableCell align="center">
                          <Chip
                            label={`${totalAllocated}/${totalRooms}`}
                            size="small"
                            color={totalAllocated === totalRooms ? "success" : "default"}
                            variant="outlined"
                          />
                        </TableCell>
                        
                        <TableCell align="center">
                          {item.isBlocked ? (
                            <Chip
                              label="Blocked"
                              color="error"
                              size="small"
                              icon={<LockIcon />}
                            />
                          ) : allSoldOut ? (
                            <Chip
                              label="Sold Out"
                              color="warning"
                              size="small"
                            />
                          ) : totalAllocated === totalRooms ? (
                            <Chip
                              label="Fully Allocated"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              label="Available"
                              color="primary"
                              size="small"
                              icon={<UnlockIcon />}
                            />
                          )}
                        </TableCell>
                        
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => loadItemForEditing(item)}
                              title="Edit All Time Slots"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setItemToDelete(item.id);
                                setDeleteDialogOpen(true);
                              }}
                              title="Delete"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Delete Inventory Item
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this inventory item? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              if (itemToDelete) {
                handleDeleteInventory(itemToDelete);
              }
            }}
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HourlyInventoryManagement;