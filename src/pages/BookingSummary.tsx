/* eslint-disable jsx-a11y/img-redundant-alt */
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Typography,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Tooltip,
  CircularProgress,
  Grid,
} from "@mui/material";
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  LocalOffer as OfferIcon,
  PersonAdd as PersonAddIcon,
  Verified as VerifiedIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Restaurant as RestaurantIcon,
  Discount as DiscountIcon,
  Percent as PercentIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { useEffect, useRef, useState } from "react";
import PhoneInput from "react-phone-input-2";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import CustomButton from "../components/CustomButton";
import RenderRazorpay from "../components/Payments/RanderPayments";
import color from "../components/color";
import { BoxStyle, CustomTextField } from "../components/style";
import { getUserId, isLoggedIn } from "../services/axiosClient";
import { createOrder, getHotelDiscount, getProfile, sendOTP, updateGST } from "../services/services";
import LoginOtpModal from "./Account/LoginOtpModal";
import InfoIcon from "@mui/icons-material/Info";
import "react-phone-input-2/lib/style.css";

// Import GST APIs
import { createGST, getAllGSTByUserId, deleteGST } from "../services/services";
import { calculatePriceBreakdown1 } from "../components/Payments/Calculation";

// Declare Cashfree on window object
declare global {
  interface Window {
    Cashfree: any;
  }
}

// UPDATED VALIDATION SCHEMA WITH PHONE VALIDATION
const validationSchema = Yup.object({
  name: Yup.string().required("Guest name is required"),
  email: Yup.string().email("Invalid email").optional(),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .test('is-valid-phone', 'Enter a valid phone number', (value) => {
      if (!value) return false;
      const phoneWithoutCode = value.slice(2);
      return phoneWithoutCode.length >= 10;
    }),
});



// ========== GUEST DISTRIBUTION AND EXTRA CHARGE CALCULATION ==========
const distributeGuestsToRooms = (
  totalGuests: number,
  standardOccupancy: number,
  maxOccupancy: number,
  additionalGuestRate: number
) => {
  let requiredRooms = 0;
  let extraGuestCount = 0;
  let extraGuestCharge = 0;
  const guestsPerRoom: number[] = [];

  if (totalGuests <= 0) {
    return {
      requiredRooms: 1,
      extraGuestCount: 0,
      extraGuestCharge: 0,
      guestsPerRoom: [0]
    };
  }

  // Calculate required rooms based on MAXIMUM occupancy
  requiredRooms = Math.ceil(totalGuests / maxOccupancy);

  // DISTRIBUTE GUESTS EVENLY ACROSS ROOMS
  let remainingGuests = totalGuests;

  // First, fill each room with standard occupancy
  for (let i = 0; i < requiredRooms; i++) {
    if (remainingGuests >= standardOccupancy) {
      guestsPerRoom[i] = standardOccupancy;
      remainingGuests -= standardOccupancy;
    } else {
      guestsPerRoom[i] = remainingGuests;
      remainingGuests = 0;
    }
  }

  // Now distribute remaining guests as extra guests
  let roomIndex = 0;
  while (remainingGuests > 0 && roomIndex < requiredRooms) {
    // Check if this room can take more guests (up to max occupancy)
    if (guestsPerRoom[roomIndex] < maxOccupancy) {
      guestsPerRoom[roomIndex] += 1;
      remainingGuests -= 1;
    }
    roomIndex++;

    // If we've checked all rooms and still have guests, loop back
    if (roomIndex >= requiredRooms && remainingGuests > 0) {
      roomIndex = 0;
    }
  }

  // Calculate extra guest charges PER ROOM
  guestsPerRoom.forEach(guestsInRoom => {
    if (guestsInRoom > standardOccupancy) {
      const extraInThisRoom = guestsInRoom - standardOccupancy;
      extraGuestCount += extraInThisRoom;
      extraGuestCharge += extraInThisRoom * additionalGuestRate;
    }
  });

  return {
    requiredRooms,
    extraGuestCount,
    extraGuestCharge,
    guestsPerRoom,
  };
};

const BookingSummary = () => {
  const location = useLocation();
  const hotel = location.state?.hotelData;
  const room = location.state?.selectedRoom;
  const selectedSlot = location.state?.selectedSlot;
  const selectedMealPlan = location.state?.selectedMealPlan;
  const pricingDetails = location.state?.pricingDetails || {};
  const inventoryData = location.state?.inventoryData || [];

  const queryParams = new URLSearchParams(location.search);
 

  const initialBookingType = queryParams.get("bookingType");
  const initialCheckinTime = queryParams.get("time");
  const initialCheckinDate = queryParams.get("checkinDate");
  const initialCheckOutDate = queryParams.get("checkOutDate");
  const initialRooms = queryParams.get("rooms");
  const initialAdults = queryParams.get("adults");
  const initialChildren = queryParams.get("children");

  // State for editable dates
  const [bookingType, setBookingType] = useState(initialBookingType);
  const [checkinTime, setCheckinTime] = useState(initialCheckinTime || "12:00");
  const [checkinDate, setCheckinDate] = useState(initialCheckinDate || dayjs().format("YYYY-MM-DD"));
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOutDate || dayjs().add(1, 'day').format("YYYY-MM-DD"));
  const [rooms, setRooms] = useState(initialRooms || "1");
  const [adults, setAdults] = useState(initialAdults || "1");
  const [children, setChildren] = useState(initialChildren || "0");
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  // State for editing
  const [editingCheckin, setEditingCheckin] = useState(false);
  const [editingCheckout, setEditingCheckout] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [tempCheckinDate, setTempCheckinDate] = useState(initialCheckinDate || dayjs().format("YYYY-MM-DD"));
  const [tempCheckOutDate, setTempCheckOutDate] = useState(initialCheckOutDate || dayjs().add(1, 'day').format("YYYY-MM-DD"));
  const [tempCheckinTime, setTempCheckinTime] = useState(initialCheckinTime || "12:00");

  // Extract initial slot duration
  const value = selectedSlot?.slot;
  const number = value?.match(/\d+/)?.[0];
  const initialExtractedNumber = number ? parseInt(number, 10) : 3;
  const [slotDuration, setSlotDuration] = useState(initialExtractedNumber);
  const [tempSlotDuration, setTempSlotDuration] = useState(initialExtractedNumber);

  const [user, setUser] = useState<any>({});
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState({
    phone: "",
    name: "",
    email: "",
    token: "",
  });
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Terms & Conditions state
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // Discount states
  const [hotelDiscountData, setHotelDiscountData] = useState<any[]>([]);
  const [loadingHotelDiscount, setLoadingHotelDiscount] = useState(false);
  const [hotelDiscountApplied, setHotelDiscountApplied] = useState(false);
  const [hotelDiscount, setHotelDiscount] = useState<{
    id: number;
    hotelId: number;
    roomId: number | null;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    isActive: boolean;
  } | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("HUTS4U");
  const [couponApplied, setCouponApplied] = useState(true);
  const [couponValue] = useState(0.05); // 5% coupon

  // Validation error state
  const [validationError, setValidationError] = useState<string | null>(null);

  // GST state
  const [gstSectionOpen, setGstSectionOpen] = useState(false);
  const [gstinNumber, setGstinNumber] = useState("");
  const [legalName, setLegalName] = useState("");
  const [gstAddress, setGstAddress] = useState("");
  const [gstVerificationStatus, setGstVerificationStatus] = useState<"none" | "verified" | "pending" | "invalid">("none");
  const [verifyingGst, setVerifyingGst] = useState(false);
  const [userGSTRecords, setUserGSTRecords] = useState<any[]>([]);
  const [selectedGSTRecord, setSelectedGSTRecord] = useState<any>(null);
  const [loadingGSTRecords, setLoadingGSTRecords] = useState(false);
  const [showNewGSTForm, setShowNewGSTForm] = useState(false);
  const [deletingGST, setDeletingGST] = useState<string | null>(null);

  // Store calculated price
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);

  // Meal plan state
  const [mealPlan, setMealPlan] = useState<string>(selectedMealPlan || "EP");
  const [mealPlanPrice, setMealPlanPrice] = useState<number>(pricingDetails?.mealPlanPrice || 0);
  const [mealPlanDescription, setMealPlanDescription] = useState<string>(pricingDetails?.mealPlanDescription || "");

  // Refs for scrolling to fields
  const nameFieldRef = useRef<HTMLInputElement>(null);
  const phoneFieldRef = useRef<HTMLDivElement>(null);
  const gstinFieldRef = useRef<HTMLInputElement>(null);

  // ========== UPDATED GUEST DISTRIBUTION LOGIC ==========
  const calculateGuestDistribution = () => {
    const totalGuests = Number(adults) + Number(children);
    const standardOccupancy = room?.standardRoomOccupancy || 1;
    const maxOccupancy = room?.maxRoomOccupancy || 1;
    const additionalGuestRate = room?.additionalGuestRate || 0;

    return distributeGuestsToRooms(
      totalGuests,
      standardOccupancy,
      maxOccupancy,
      additionalGuestRate
    );
  };

  const guestDistribution = calculateGuestDistribution();
  const {
    requiredRooms,
    extraGuestCount,
    extraGuestCharge,
    guestsPerRoom
  } = guestDistribution;

  // FIXED: Get inventory-based price for the selected slot and date
  const getInventoryPriceForDate = (slot: string): number => {
    if (!room || !checkinDate || !slot) return 0;

    const checkDay = dayjs(checkinDate).format('YYYY-MM-DD');
    const dayInventory = inventoryData?.find((inv: any) =>
      dayjs(inv.date).format('YYYY-MM-DD') === checkDay
    );

    if (!dayInventory) {
      // If no inventory data, fall back to room rates
      switch (slot) {
        case 'rateFor1Night':
          return room.rateFor1Night || 0;
        case 'rateFor3Hour':
          return room.rateFor3Hour || 0;
        case 'rateFor6Hour':
          return room.rateFor6Hour || 0;
        case 'rateFor12Hour':
          return room.rateFor12Hour || 0;
        default:
          return 0;
      }
    }

    // Return inventory-specific rate
    switch (slot) {
      case 'rateFor1Night':
        return dayInventory.overnightRate || room.rateFor1Night || 0;
      case 'rateFor3Hour':
        return dayInventory.threeHourRate || room.rateFor3Hour || 0;
      case 'rateFor6Hour':
        return dayInventory.sixHourRate || room.rateFor6Hour || 0;
      case 'rateFor12Hour':
        return dayInventory.twelveHourRate || room.rateFor12Hour || 0;
      default:
        return 0;
    }
  };

  // Get the slot key based on booking type
  const getSlotKey = (): string => {
    if (bookingType === "hourly") {
      switch (slotDuration) {
        case 3:
          return 'rateFor3Hour';
        case 6:
          return 'rateFor6Hour';
        case 12:
          return 'rateFor12Hour';
        default:
          return 'rateFor3Hour';
      }
    } else {
      return 'rateFor1Night';
    }
  };

  // Check slot availability
  const checkSlotAvailability = (): { isAvailable: boolean, message: string } => {
    if (!room) {
      return {
        isAvailable: false,
        message: 'Room information is missing'
      };
    }

    const roomStatus = room.status?.toLowerCase();
    const isStatusAvailable = roomStatus === "available" || roomStatus === "active";

    if (!isStatusAvailable) {
      return {
        isAvailable: false,
        message: 'This room is currently not available'
      };
    }

    return {
      isAvailable: true,
      message: 'Available'
    };
  };

  const slotAvailability = checkSlotAvailability();

  // Get unit base price from inventory or room
  const getUnitBasePrice = (): number => {
    const slotKey = getSlotKey();
    return getInventoryPriceForDate(slotKey);
  };

  const unitBase = Number(getUnitBasePrice());

  // Auto-update rooms based on occupancy
  useEffect(() => {
    if (Number(rooms) !== requiredRooms) {
      setRooms(requiredRooms.toString());
    }
  }, [adults, children, room]);

  // Fetch hotel discounts when component mounts or hotel changes - USE MYSQL ID
  useEffect(() => {
    if (hotel?.id) {
      fetchHotelDiscounts();
    }
  }, [hotel?.id]);

  // Initialize calculated price from pricingDetails
  useEffect(() => {
    if (pricingDetails) {
      setCalculatedPrice(pricingDetails);
      // Set meal plan details from pricingDetails
      if (pricingDetails.mealPlanPrice) {
        setMealPlanPrice(pricingDetails.mealPlanPrice);
      }
      if (pricingDetails.mealPlanDescription) {
        setMealPlanDescription(pricingDetails.mealPlanDescription);
      }
    }
  }, [pricingDetails]);

  // Fetch hotel discounts - USE MYSQL ID
  const fetchHotelDiscounts = async () => {
    if (!hotel?.id) return;

    setLoadingHotelDiscount(true);
    try {
      const payload = {
        data: {
          filter: "",
          hotelId: parseInt(hotel.id), // Use MySQL ID
          isActive: true
        },
        page: 0,
        pageSize: 1000,
        order: [["createdAt", "ASC"]]
      };

      const response = await getHotelDiscount(payload);

      // Handle different response structures
      let discountsData = [];
      if (response?.data?.data?.rows) {
        discountsData = response.data.data.rows;
      } else if (response?.data?.data) {
        discountsData = response.data.data;
      } else if (response?.data) {
        discountsData = Array.isArray(response.data) ? response.data : [response.data];
      }

      setHotelDiscountData(discountsData);

      // Auto-apply the first active discount
      if (discountsData.length > 0) {
        const firstDiscount = discountsData[0];
        setHotelDiscount({
          id: firstDiscount.id,
          hotelId: firstDiscount.hotelId,
          roomId: firstDiscount.roomId,
          discountType: firstDiscount.discountType,
          discountValue: parseFloat(firstDiscount.discountValue) || 0,
          isActive: firstDiscount.isActive
        });
        setHotelDiscountApplied(true);
        toast.success(`Hotel discount applied: ${firstDiscount.discountValue}${firstDiscount.discountType === 'percentage' ? '%' : '₹'} off`);
      }
    } catch (error) {
      console.error("Error fetching hotel discounts:", error);
      toast.error("Failed to load hotel discounts");
    } finally {
      setLoadingHotelDiscount(false);
    }
  };

  // Load user profile and GST records on component mount
  useEffect(() => {
    if (isLoggedIn()) {
      loadUserProfileAndGST();
    }
  }, []);

  // Load user profile and GST records
  const loadUserProfileAndGST = async () => {
    try {
      const profileRes = await getProfile();
      const userData = profileRes?.data?.data;
      setUser(userData);

      if (userData?._id) {
        // Load user's GST records
        loadUserGSTRecords(userData._id);
      }
    } catch (err) {
      toast.error("Failed to load user profile");
    }
  };

  const loadUserGSTRecords = async (userId: string) => {
    if (!userId) return;

    setLoadingGSTRecords(true);
    try {
      const response = await getAllGSTByUserId(userId);

      let gstRecords: any[] = [];

      // Extract from response.data.data array
      if (response?.data?.data && Array.isArray(response.data.data)) {
        gstRecords = response.data.data;
      }
      // If response.data itself is array
      else if (Array.isArray(response?.data)) {
        gstRecords = response.data;
      }

      // Transform the data: extract gst_detail objects
      const transformedRecords = gstRecords.map((record: any) => {
        // If record has gst_detail property, use that
        if (record.gst_detail && typeof record.gst_detail === 'object') {
          return {
            ...record.gst_detail,
            // Keep mapping info if needed
            mappingId: record.id,
            userId: record.userId,
            gstId: record.gstId,
            isPrimary: record.isPrimary || false,
            mappingCreatedAt: record.createdAt,
            mappingUpdatedAt: record.updatedAt,
          };
        }
        // Otherwise use the record as is
        return record;
      });

      setUserGSTRecords(transformedRecords);

      // If user has verified GST records, automatically select the first verified one
      const verifiedRecords = transformedRecords.filter((record: any) => {
        return (
          record.verified === true ||
          record.gstStatus === "Active"
        );
      });

      if (verifiedRecords.length > 0) {
        const firstRecord = verifiedRecords[0];
        setSelectedGSTRecord(firstRecord);
        setGstinNumber(firstRecord.gstNumber || "");
        setLegalName(firstRecord.legalName || firstRecord.tradeName || "");
        setGstAddress(firstRecord.address || "");
        setGstVerificationStatus("verified");

        // Auto-open GST section if records exist
        setGstSectionOpen(true);

        toast.success(`Auto-selected GST: ${firstRecord.gstNumber}`);
      } else if (transformedRecords.length > 0) {
        // Auto-open GST section if records exist
        setGstSectionOpen(true);
      }
    } catch (error: any) {
      console.error("Error loading GST records:", error);
    } finally {
      setLoadingGSTRecords(false);
    }
  };

  // Handle hotel discount apply/remove
  const handleApplyHotelDiscount = () => {
    if (hotelDiscountData.length > 0 && !hotelDiscountApplied) {
      const firstDiscount = hotelDiscountData[0];
      setHotelDiscount({
        id: firstDiscount.id,
        hotelId: firstDiscount.hotelId,
        roomId: firstDiscount.roomId,
        discountType: firstDiscount.discountType,
        discountValue: parseFloat(firstDiscount.discountValue) || 0,
        isActive: firstDiscount.isActive
      });
      setHotelDiscountApplied(true);
      toast.success(`Hotel discount applied: ${firstDiscount.discountValue}${firstDiscount.discountType === 'percentage' ? '%' : '₹'} off`);
    }
  };

  const handleRemoveHotelDiscount = () => {
    setHotelDiscount(null);
    setHotelDiscountApplied(false);
    toast.info("Hotel discount removed");
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    toast.info("Huts4u Discount removed");
  };

  const handleApplyCoupon = () => {
    setCouponApplied(true);
    toast.success("Huts4u Discount applied!");
  };

  // Handle GST verification and creation
  const handleVerifyGST = async () => {
    if (!gstinNumber.trim()) {
      toast.error("Please enter GSTIN number");
      gstinFieldRef.current?.focus();
      return;
    }

    // Basic GSTIN format validation (15 characters, alphanumeric)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    if (!gstinRegex.test(gstinNumber.toUpperCase())) {
      toast.error("Please enter a valid 15-digit GSTIN format");
      setGstVerificationStatus("invalid");
      return;
    }

    setVerifyingGst(true);
    setGstVerificationStatus("pending");

    try {
      // Get user ID if logged in
      const userId = isLoggedIn() ? getUserId() : null;

      // Prepare GST payload - only include userId if logged in
      const gstPayload = {
        gstNumber: gstinNumber.toUpperCase(),
        ...(userId && { userId })
      };

      // Call createGST API (which will verify via API)
      const response = await createGST(gstPayload);

      if (response?.data?.data) {
        const gstData = response.data?.data || response.data?.result;

        setGstVerificationStatus("verified");
        setLegalName(gstData?.legalName || gstData?.lgnm || "");
        setGstAddress(gstData?.address || gstData?.pradr?.adr || "");

        // Create selected record object
        const selectedRecord = {
          ...gstData,
          id: gstData?.id,
          gstNumber: gstData?.gstNumber || gstinNumber.toUpperCase(),
          legalName: gstData?.legalName || gstData?.lgnm || "",
          address: gstData?.address || gstData?.pradr?.adr || "",
          verified: true
        };

        setSelectedGSTRecord(selectedRecord);

        toast.success("GSTIN verified successfully!");

        // If user is logged in, reload their GST records
        if (userId) {
          loadUserGSTRecords(userId);
        }

      } else if (response?.data?.status === "BAD_REQUEST") {
        // Handle duplicate GST or verification failure
        const errorMessage = response.data?.message || "GST verification failed";

        if (errorMessage.includes("already exists")) {
          // GST already exists in system
          const existingGST = response.data?.data;

          // Update with user ID if logged in
          if (userId && existingGST?.id) {
            try {
              const updateResponse = await updateGST(existingGST.id, { userId });
              if (updateResponse?.data?.success) {
                toast.success("GST linked to your account!");
              }
            } catch (updateError) {
              console.error("Error updating GST user ID:", updateError);
            }
          }

          setGstVerificationStatus("verified");
          setGstinNumber(existingGST.gstNumber || gstinNumber.toUpperCase());
          setLegalName(existingGST.legalName || "");
          setGstAddress(existingGST.address || "");
          setSelectedGSTRecord(existingGST);

          toast.info("Using existing GST record");
        } else {
          setGstVerificationStatus("invalid");
          toast.error(errorMessage);
        }
      } else {
        setGstVerificationStatus("invalid");
        toast.error("GST verification failed. Please try again.");
      }
    } catch (error: any) {
      console.error("GST verification error:", error);
      setGstVerificationStatus("invalid");

      // Check if it's a duplicate GST error
      if (error.response?.data?.status === "BAD_REQUEST") {
        const errorData = error.response.data;

        if (errorData?.data) {
          // Existing GST found
          setGstVerificationStatus("verified");
          setLegalName(errorData.data.legalName || "");
          setGstAddress(errorData.data.address || "");
          setSelectedGSTRecord(errorData.data);
          toast.info("Using existing GST record");
        } else {
          toast.error(errorData?.message || "Invalid GST number");
        }
      } else {
        toast.error("Failed to verify GST. Please check your internet connection.");
      }
    } finally {
      setVerifyingGst(false);
    }
  };

  // Handle GST record selection from saved records
  const handleGSTRecordSelect = (record: any) => {
    setSelectedGSTRecord(record);
    setGstinNumber(record.gstNumber || "");
    setLegalName(record.legalName || "");
    setGstAddress(record.address || "");
    setGstVerificationStatus(
      record.verified === true || record.gstStatus === "Active"
        ? "verified"
        : "none"
    );
    setShowNewGSTForm(false);
    toast.success(`Selected GSTIN: ${record.gstNumber}`);
  };

  // Handle adding new GST
  const handleAddNewGST = () => {
    setShowNewGSTForm(true);
    setGstinNumber("");
    setLegalName("");
    setGstAddress("");
    setGstVerificationStatus("none");
    setSelectedGSTRecord(null);
  };

  // Handle deleting GST mapping (unlinking from user)
  const handleDeleteGST = async (gstId: string) => {
    if (!isLoggedIn()) {
      toast.error("Please login to manage GST records");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this GST from your account?")) {
      return;
    }

    setDeletingGST(gstId);
    try {
      const payLoad = {
        userId: getUserId()
      }
      const response = await deleteGST(gstId, payLoad.userId);
      if (response?.data?.success) {
        toast.success("GST removed from your account");

        // Update local state
        setUserGSTRecords(prev => prev.filter(record =>
          record.id !== gstId && record._id !== gstId
        ));

        // Clear selection if deleted record was selected
        if (selectedGSTRecord &&
          (selectedGSTRecord.id === gstId || selectedGSTRecord._id === gstId)) {
          handleClearGST();
        }
      } else {
        toast.error("Failed to remove GST");
      }
    } catch (error) {
      console.error("Error deleting GST:", error);
      toast.error("Failed to remove GST");
    } finally {
      setDeletingGST(null);
    }
  };

  // Function to copy GSTIN to clipboard
  const handleCopyGSTIN = (gstNumber: string) => {
    navigator.clipboard.writeText(gstNumber)
      .then(() => toast.success("GSTIN copied to clipboard"))
      .catch(() => toast.error("Failed to copy GSTIN"));
  };

  // Handle clearing GST selection
  const handleClearGST = () => {
    setSelectedGSTRecord(null);
    setGstinNumber("");
    setLegalName("");
    setGstAddress("");
    setGstVerificationStatus("none");
    setShowNewGSTForm(false);
    toast.info("GST selection cleared");
  };

  // Handle date changes and update price
  const handleCheckinDateSave = () => {
    if (!tempCheckinDate) {
      toast.error("Please select a check-in date");
      return;
    }

    if (!dayjs(tempCheckinDate, "YYYY-MM-DD", true).isValid()) {
      toast.error("Invalid date format. Please use YYYY-MM-DD format");
      return;
    }

    if (bookingType === "hourly") {
      setCheckinDate(tempCheckinDate);
      setEditingCheckin(false);
      toast.success("Check-in date updated");
    } else {
      if (dayjs(tempCheckinDate).isAfter(dayjs(tempCheckOutDate))) {
        toast.error("Check-in date cannot be after check-out date");
        return;
      }
      setCheckinDate(tempCheckinDate);
      setEditingCheckin(false);
      toast.success("Check-in date updated");
    }
  };

  const handleCheckoutDateSave = () => {
    if (!tempCheckOutDate) {
      toast.error("Please select a check-out date");
      return;
    }

    if (!dayjs(tempCheckOutDate, "YYYY-MM-DD", true).isValid()) {
      toast.error("Invalid date format. Please use YYYY-MM-DD format");
      return;
    }

    if (dayjs(tempCheckOutDate).isBefore(dayjs(tempCheckinDate))) {
      toast.error("Check-out date cannot be before check-in date");
      return;
    }
    setCheckOutDate(tempCheckOutDate);
    setEditingCheckout(false);
    toast.success("Check-out date updated");
  };

  // Handle time changes for hourly bookings
  const handleTimeSave = () => {
    if (!tempCheckinTime) {
      toast.error("Please select a check-in time");
      return;
    }

    // Validate time format
    if (!tempCheckinTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      toast.error("Invalid time format. Please use HH:mm format");
      return;
    }

    setCheckinTime(tempCheckinTime);
    setSlotDuration(tempSlotDuration);
    setEditingTime(false);
    toast.success("Check-in time and duration updated");
  };

  // Calculate nights based on dates
  const calculateNights = () => {
    if (!checkinDate || !checkOutDate) return 1;

    const inDate = dayjs(checkinDate, "YYYY-MM-DD", true);
    const outDate = dayjs(checkOutDate, "YYYY-MM-DD", true);

    if (!inDate.isValid() || !outDate.isValid()) return 1;

    const diff = outDate.diff(inDate, "day");
    return Math.max(1, diff);
  };

  const nights = calculateNights();

  // Calculate price breakdown WITH MEAL PLAN & DISCOUNTS
  const calculateTotalPrice = () => {
    // If we have calculatedPrice from props or previous calculation, use it
    if (calculatedPrice && !editingCheckin && !editingCheckout && !editingTime) {
      // Calculate multiplier WITHOUT extra guest charges
      let totalMultiplier;
      if (bookingType === "hourly") {
        const hoursMultiplier = slotDuration / 3;
        totalMultiplier = requiredRooms * hoursMultiplier;
      } else {
        totalMultiplier = requiredRooms * nights;
      }

      // Get meal plan price (per room per night)
      const totalMealPlanPrice = mealPlanPrice * requiredRooms * (bookingType === "hourly" ? 1 : nights);

      // Total base price including meal plan
      const totalBasePrice = (calculatedPrice.basePrice || 0) + totalMealPlanPrice;

      // Calculate breakdown with both discounts
      const breakdown = calculatePriceBreakdown1(
        calculatedPrice.basePrice || 0,
        totalMealPlanPrice,
        {
          hotelDiscountValue: hotelDiscountApplied ? hotelDiscount?.discountValue || 0 : 0,
          hotelDiscountType: hotelDiscountApplied ? hotelDiscount?.discountType || null : null,
          couponApplied,
          couponValue: 0.05 // 5% coupon
        }
      );

      return {
        ...breakdown,
        nights,
        totalMultiplier,
        bookingType,
        slotDuration,
        requiredRooms,
        unitBase: (calculatedPrice.basePrice || 0) / requiredRooms / (bookingType === "hourly" ? slotDuration / 3 : nights),
        totalMealPlanPrice,
        mealPlanDescription,
      };
    }

    // Otherwise calculate from scratch
    // Calculate multiplier WITHOUT extra guest charges
    let totalMultiplier;
    if (bookingType === "hourly") {
      const hoursMultiplier = slotDuration / 3;
      totalMultiplier = requiredRooms * hoursMultiplier;
    } else {
      totalMultiplier = requiredRooms * nights;
    }

    const totalBasePrice = unitBase * totalMultiplier;

    // Get meal plan price (per room per night)
    const totalMealPlanPrice = mealPlanPrice * requiredRooms * (bookingType === "hourly" ? 1 : nights);

    // Calculate breakdown with both discounts
    const breakdown = calculatePriceBreakdown1(
      totalBasePrice,
      totalMealPlanPrice,
      {
        hotelDiscountValue: hotelDiscountApplied ? hotelDiscount?.discountValue || 0 : 0,
        hotelDiscountType: hotelDiscountApplied ? hotelDiscount?.discountType || null : null,
        couponApplied,
        couponValue: 0.05 // 5% coupon
      }
    );

    return {
      ...breakdown,
      nights,
      totalMultiplier,
      bookingType,
      slotDuration,
      requiredRooms,
      unitBase,
      totalMealPlanPrice,
      mealPlanDescription,
    };
  };

  const priceBreakdown = calculateTotalPrice();
  const {
    basePrice: totalBase,
    mealPlanPrice: totalMealPlan,
    gstOnBase,
    platformFee,
    gstOnPlatform,
    convenienceFee,
    gstOnConvenience,
    totalWithoutDiscount,
    hotelDiscount: hotelDiscountAmount,
    couponDiscount,
    totalDiscount,
    finalPrice,
    unitBase: inventoryUnitBase,
    mealPlanDescription: mealDesc,
  } = priceBreakdown;

  // Display values for UI
  const displayBase = totalBase + totalMealPlan;
  const displayBasePlus700 = displayBase + 700;
  const displayCombinedBasePlatform = displayBase + platformFee;
  const displayGstTotal = gstOnBase + gstOnPlatform + convenienceFee + gstOnConvenience;
  const payableAfterDiscount = Number(finalPrice.toFixed(2));

  // Invoice pieces
  const serviceTaxableValue = platformFee;
  const cgstOnService = gstOnPlatform / 2;
  const sgstOnService = gstOnPlatform / 2;
  const convenienceFeeInclGst = convenienceFee + gstOnConvenience;
  const grandTotal = payableAfterDiscount;

  // In your BookingSummary.tsx, replace the entire handlePayment function:
  const handlePayment = async () => {
    try {
      if (!grandTotal || grandTotal <= 0) {
        toast.error("Booking amount cannot be zero.");
        return;
      }

      const hotelId = hotel?.id || hotel?._id;
      if (!hotelId) {
        toast.error("Hotel information is missing");
        return;
      }

      // ================= GST =================
      let gstDataForBooking = null;
      if (gstVerificationStatus === "verified" && gstinNumber) {
        gstDataForBooking = {
          gstNumber: gstinNumber,
          legalName,
          address: gstAddress,
          verified: true,
          gstRecordId: selectedGSTRecord?.id || selectedGSTRecord?._id,
          gstStatus: selectedGSTRecord?.gstStatus || "Active",
        };
      }

      // ================= DISCOUNTS =================
      const discountData = {
        hotelDiscount: hotelDiscountApplied
          ? {
            discountId: hotelDiscount?.id,
            discountType: hotelDiscount?.discountType,
            discountValue: hotelDiscount?.discountValue,
            discountAmount: hotelDiscountAmount,
          }
          : null,
        couponDiscount: couponApplied
          ? {
            couponCode,
            discountValue: 0.05,
            discountAmount: couponDiscount,
          }
          : null,
        totalDiscount,
      };

      // ================= PRICE BREAKDOWN =================
      const pricingDetails = {
        ...priceBreakdown,
        nights,
        rooms: requiredRooms.toString(),
        adults,
        children,
        bookingType,
        checkinDate,
        checkOutDate,
        checkinTime,
        slotDuration,
        extraGuestCount,
        extraGuestCharge,
        guestsPerRoom,
        inventoryData,
        unitBase: inventoryUnitBase,
        mealPlan,
        mealPlanPrice: totalMealPlan,
        mealPlanDescription: mealDesc,
        finalPrice: payableAfterDiscount,
        grandTotal: Math.round(grandTotal),
      };

      // ================= GUEST INFO =================
      const guestInfo = {
        name: formik.values.name,
        email: formik.values.email || "guest@huts4u.com",
        phoneNumber: formik.values.phoneNumber,
      };

      // ================= TIMING =================
      const timing = calculateCheckoutTime();

      // ================= PAYLOAD =================
      const payload = {
        amount: Math.round(grandTotal),
        order_currency: "INR",
        customerName: formik.values.name,
        customerEmail: formik.values.email || "guest@huts4u.com",
        customerPhone: formik.values.phoneNumber,

        order_meta: {
          return_url: `${window.location.origin}/payment/return`,
        },

        order_note: "Hotel Booking",

        booking_data: {
          gstDetails: gstDataForBooking,
          discountDetails: discountData,
          bookingType,
          hotelId,
          roomId: room?.id || room?._id,
          mealPlan,
          mealPlanPrice: totalMealPlan,
          checkinDate,
          checkOutDate,
          checkinTime,
          slotDuration,
          rooms: requiredRooms,
          adults,
          children,
          extraGuestCount,
          extraGuestCharge,
          guestsPerRoom,
        },
      };

      setIsLoadingPayment(true);

      // ================= CREATE ORDER =================
      const response = await createOrder(payload);

      const { orderId, paymentSessionId } = response?.data?.data || {};

      if (!orderId || !paymentSessionId) {
        toast.error("Failed to create Cashfree order");
        return;
      }

      // ================= COMPLETE BOOKING DATA TO STORE =================
      const completeBookingData = {
        orderId,
        paymentSessionId,
        orderDetails: response?.data?.data, // Store full order details if needed
        bookingDetails: {
          // All the data you need for the payment return page
          hotel: {
            id: hotel?.id || hotel?._id,
            propertyName: hotel?.propertyName,
            address: hotel?.address,
            propertyImages: hotel?.propertyImages,
            receptionEmail: hotel?.receptionEmail,
            receptionMobile: hotel?.receptionMobile,
          },
          room: {
            id: room?.id || room?._id,
            roomCategory: room?.roomCategory,
            standardRoomOccupancy: room?.standardRoomOccupancy,
            maxRoomOccupancy: room?.maxRoomOccupancy,
            additionalGuestRate: room?.additionalGuestRate,
          },
          guestInfo,
          gstDetails: gstDataForBooking,
          discountDetails: discountData,
          timing,
          pricingDetails,
          bookingType,
          checkinDate,
          checkOutDate,
          checkinTime,
          slotDuration,
          rooms: requiredRooms,
          adults,
          children,
          extraGuestCount,
          extraGuestCharge,
          guestsPerRoom,
          inventoryData,
          mealPlan,
          mealPlanPrice: totalMealPlan,
          mealPlanDescription: mealDesc,
          // Store form values for customer details
          customerDetails: {
            customer_name: formik.values.name,
            customer_email: formik.values.email || "guest@huts4u.com",
            customer_phone: formik.values.phoneNumber,
          },
          // Store amount for payout calculations
          amount: Math.round(grandTotal),
        },
        // Store the original payload for reference
        originalPayload: payload,
      };

      // ================= SAVE FOR VERIFICATION =================
      sessionStorage.setItem(
        "cashfree_booking_data",
        JSON.stringify(completeBookingData)
      );


      // ================= OPEN CASHFREE MODAL =================
      const cashfree = new window.Cashfree({
        mode: "production", // 🔥 change to "production" later
      });

      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_modal", // 👈 THIS OPENS MODAL
        theme: {
          primaryColor: "#6A1B9A",   // 🔥 Purple
          secondaryColor: "#9C27B0", // lighter purple
          textColor: "#FFFFFF",
          backgroundColor: "#FFFFFF",
        },
      });

      // Redirect after a short delay (Cashfree will handle the redirect)
      setTimeout(() => {
        window.location.href = `/payment/return?order_id=${orderId}`;
      }, 2000);
    } catch (err) {
      console.error("Cashfree Payment Error:", err);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsLoadingPayment(false);
    }
  };



  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      name: user.userName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber ? `91${user.phoneNumber}` : "91",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      // Clear previous validation error
      setValidationError(null);

      // Check slot availability first
      if (!slotAvailability.isAvailable) {
        setValidationError(slotAvailability.message);
        return;
      }

      // Check for required fields before terms
      if (!values.name.trim()) {
        setValidationError("Guest name is required");
        nameFieldRef.current?.focus();
        nameFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (!values.phoneNumber || values.phoneNumber === "91" || values.phoneNumber.length < 12) {
        setValidationError("Valid phone number is required");
        phoneFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (!termsChecked) {
        setValidationError("Please accept Terms & Conditions before proceeding.");
        return;
      }

      if (isLoggedIn()) {
        // Direct payment for logged-in users
        await handlePayment();
      } else {
        // For guest users, first send OTP
        const payLoad = {
          name: values.name,
          email: values.email,
          phone: values.phoneNumber.slice(2),
        };

        try {
          const res = await sendOTP(payLoad);
          setShowOtpModal(true);
          toast("OTP sent successfully. Please verify the OTP.");
          setOtpData({
            phone: values.phoneNumber.slice(2),
            name: values.name,
            email: values.email,
            token: res?.data?.data,
          });
        } catch (err) {
          console.log(err);
          toast.error("Failed to send OTP. Please try again.");
        }
      }
    },
  });

  const handleOtpSuccess = () => {
    setShowOtpModal(false);

    // If GST is verified but doesn't have user ID, update it
    if (gstVerificationStatus === "verified" && selectedGSTRecord &&
      isLoggedIn() && !selectedGSTRecord.userId) {
      updateGSTRecordWithUserId();
    } else {
      handlePayment();
    }
  };

  // Function to update GST record with user ID
  const updateGSTRecordWithUserId = async () => {
    try {
      const userId = getUserId();
      const gstId = selectedGSTRecord?.id || selectedGSTRecord?._id;

      if (userId && gstId) {
        // Update GST record with user ID
        const updatePayload = { userId };
        const response = await updateGST(gstId, updatePayload);

        if (response?.data?.success) {
          toast.success("GST record linked to your account!");

          // Reload GST records to get updated data
          loadUserGSTRecords(userId);
        }
      }

      // Proceed to payment
      handlePayment();
    } catch (error) {
      console.error("Error updating GST with user ID:", error);
      toast.error("Could not link GST to account. Proceeding with payment...");
      handlePayment();
    }
  };

  const textContainerRef = useRef<HTMLDivElement>(null);
  const [imageHeight, setImageHeight] = useState("auto");

  // Updated calculateCheckoutTime function
  const calculateCheckoutTime = () => {
    if (bookingType === "hourly" && checkinTime && checkinDate && slotDuration) {
      const checkInDateTime = dayjs(`${checkinDate} ${checkinTime}`, "YYYY-MM-DD HH:mm");
      const checkOutDateTime = checkInDateTime.add(slotDuration, "hour");

      return {
        checkInDate: checkInDateTime.format("DD MMM YYYY"),
        checkInTime: checkInDateTime.format("hh:mm A"),
        checkOutDate: checkOutDateTime.format("DD MMM YYYY"),
        checkOutTime: checkOutDateTime.format("hh:mm A"),
        duration: `${slotDuration} hrs`,
        bookingType: "hourly",
      };
    } else {
      const nights = calculateNights();
      return {
        checkInDate: dayjs(checkinDate, "YYYY-MM-DD").format("DD MMM YYYY"),
        checkInTime: "12:00 PM",
        checkOutDate: dayjs(checkOutDate, "YYYY-MM-DD").format("DD MMM YYYY"),
        checkOutTime: "11:00 AM",
        duration: `${nights} night${nights > 1 ? 's' : ''}`,
        bookingType: "daily",
      };
    }
  };

  // Get booking type label for display
  const getBookingTypeLabel = () => {
    switch (bookingType) {
      case "hourly":
        return "Hourly Booking";
      case "daily":
      case "overnight":
      default:
        return "Daily/Overnight Booking";
    }
  };

  useEffect(() => {
    if (textContainerRef.current) {
      setImageHeight(`${textContainerRef.current.clientHeight}px`);
    }
  }, [hotel, nights, slotDuration]);

  // Generate time slots for the time picker
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({ value: time, label: dayjs(time, "HH:mm").format("hh:mm A") });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // T&C modal content
  const termsText = `
By booking, you agree to the property's terms and conditions, cancellation policy, and house rules.
You also agree to follow Huts4u's official Terms & Conditions mentioned on the link below.
Please ensure you have read and understood all applicable policies.
`;

  // Function to check if form is valid
  const isFormValid = () => {
    const isNameValid = formik.values.name.trim() !== "";
    const isPhoneValid = formik.values.phoneNumber &&
      formik.values.phoneNumber !== "91" &&
      formik.values.phoneNumber.length >= 12;
    const isTermsAccepted = termsChecked;
    const isSlotAvailable = slotAvailability.isAvailable;

    return isNameValid && isPhoneValid && isTermsAccepted && isSlotAvailable;
  };

  // Function to handle field changes and show errors
  const handleFieldChange = (field: string, value: string) => {
    formik.setFieldValue(field, value);
    formik.setFieldTouched(field, true);

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  // Price source indicator
  const getPriceSource = () => {
    const checkDay = dayjs(checkinDate).format('YYYY-MM-DD');
    const dayInventory = inventoryData?.find((inv: any) =>
      dayjs(inv.date).format('YYYY-MM-DD') === checkDay
    );

    return dayInventory ? "Dynamic Inventory Pricing" : "Standard Rate";
  };

  // Get discount type icon and label
  const getDiscountTypeIcon = (type: string) => {
    return type === 'percentage' ? <PercentIcon /> : <MoneyIcon />;
  };

  const getDiscountTypeLabel = (type: string) => {
    return type === 'percentage' ? '% off' : '₹ off';
  };

  return (
    <Box
      sx={{
        ...BoxStyle,
        background: "#f6f6f6",
        mt: 0,
        py: 4,
        px: { xs: 1, md: 3 },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "center",
        gap: "20px",
      }}
    >
      {/* LEFT: Booking + Guest Info */}
      <Card
        sx={{
          p: 1,
          background: "white",
          maxWidth: "700px",
          border: "none",
          boxShadow: 0,
          borderRadius: "12px",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: color.firstColor, fontWeight: "bold" }}
          >
            Your Booking Summary
          </Typography>

          {/* SLOT AVAILABILITY ALERT */}
          {!slotAvailability.isAvailable && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontSize: '14px',
                  fontWeight: 500
                }
              }}
            >
              {slotAvailability.message}
              <Button
                variant="outlined"
                size="small"
                sx={{ ml: 2 }}
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
            </Alert>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: { xs: 0, md: 2 },
              position: "relative",
              mt: 2,
              height: "fit-content",
              alignItems: "stretch",
            }}
          >
            <CardMedia
              component="img"
              sx={{
                width: { xs: "100%", md: "250px" },
                borderRadius: "12px",
                objectFit: "cover",
                height: imageHeight,
                transition: "height 0.3s ease",
              }}
              image={hotel?.propertyImages?.[0]}
            />
            <div style={{ height: "fit-content" }} ref={textContainerRef}>
              <Typography
                sx={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: color.firstColor,
                  mt: { xs: 1.5, md: 1 },
                  display: "-webkit-box",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {hotel?.propertyName}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "CustomFontSB",
                  fontSize: { xs: "12px", md: "14px" },
                  display: "-webkit-box",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {hotel?.address}
              </Typography>

              {/* Booking Type Label */}
              <Typography sx={{ fontSize: 14, color: color.forthColor, fontStyle: 'italic', mb: 1, mt: 0.5 }}>
                {getBookingTypeLabel()}
              </Typography>

              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  flexWrap: "wrap",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {/* Editable Check-in Date - ALWAYS SHOW */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {editingCheckin ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TextField
                        type="date"
                        size="small"
                        value={tempCheckinDate}
                        onChange={(e) => {
                          setTempCheckinDate(e.target.value);
                          // Reset calculated price when date changes
                          setCalculatedPrice(null);
                        }}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 150 }}
                        InputProps={{
                          sx: { height: 36 }
                        }}
                      />
                      <IconButton size="small" onClick={handleCheckinDateSave} sx={{ color: "green" }}>
                        <CheckIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => {
                        setTempCheckinDate(checkinDate);
                        setEditingCheckin(false);
                      }} sx={{ color: "red" }}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <>
                      <Typography sx={typoStyle}>
                        <strong>Check-In Date:</strong>{" "}
                        {dayjs(checkinDate, "YYYY-MM-DD").format("DD MMM YYYY")}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setTempCheckinDate(checkinDate);
                          setEditingCheckin(true);
                        }}
                        sx={{ ml: -1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>

                {/* FOR HOURLY BOOKINGS: Show check-in time */}
                {bookingType === "hourly" && (
                  <>
                    {/* Editable Check-in Time */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                      {editingTime ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <InputLabel>Check-in Time</InputLabel>
                              <Select
                                value={tempCheckinTime}
                                onChange={(e) => setTempCheckinTime(e.target.value)}
                                label="Check-in Time"
                              >
                                {timeSlots.map((time) => (
                                  <MenuItem key={time.value} value={time.value}>
                                    {time.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton size="small" onClick={handleTimeSave} sx={{ color: "green" }}>
                              <CheckIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => {
                              setTempCheckinTime(checkinTime);
                              setTempSlotDuration(slotDuration);
                              setEditingTime(false);
                            }} sx={{ color: "red" }}>
                              <CloseIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      ) : (
                        <>
                          <Typography sx={typoStyle}>
                            <strong>Check-In Time:</strong>{" "}
                            {checkinTime
                              ? dayjs(checkinTime, "HH:mm", true).isValid()
                                ? dayjs(checkinTime, "HH:mm").format("hh:mm A")
                                : "12:00 PM"
                              : "12:00 PM"}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setTempCheckinTime(checkinTime);
                              setTempSlotDuration(slotDuration);
                              setEditingTime(true);
                            }}
                            sx={{ ml: -1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>

                    {/* Show check-out time calculation for hourly */}
                    <Typography sx={typoStyle}>
                      <strong>Check-Out Time:</strong>{" "}
                      {dayjs(`${checkinDate} ${checkinTime}`, "YYYY-MM-DD HH:mm")
                        .add(slotDuration, 'hour')
                        .format("DD MMM YYYY hh:mm A")}
                    </Typography>
                  </>
                )}

                {/* FOR DAILY/OVERNIGHT BOOKINGS: Show check-out date */}
                {bookingType !== "hourly" && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    {editingCheckout ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TextField
                          type="date"
                          size="small"
                          value={tempCheckOutDate}
                          onChange={(e) => {
                            setTempCheckOutDate(e.target.value);
                            // Reset calculated price when date changes
                            setCalculatedPrice(null);
                          }}
                          InputLabelProps={{ shrink: true }}
                          sx={{ width: 150 }}
                          InputProps={{
                            sx: { height: 36 }
                          }}
                        />
                        <IconButton size="small" onClick={handleCheckoutDateSave} sx={{ color: "green" }}>
                          <CheckIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => {
                          setTempCheckOutDate(checkOutDate);
                          setEditingCheckout(false);
                        }} sx={{ color: "red" }}>
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <Typography sx={typoStyle}>
                          <strong>Check-Out Date:</strong>{" "}
                          {dayjs(checkOutDate, "YYYY-MM-DD").format("DD MMM YYYY")}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setTempCheckOutDate(checkOutDate);
                            setEditingCheckout(true);
                          }}
                          sx={{ ml: -1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                )}

                {/* Duration display - Show based on booking type */}
                {bookingType === "hourly" ? (
                  <Typography sx={typoStyle}>
                    <strong>Duration: </strong>
                    {slotDuration} hrs
                  </Typography>
                ) : (
                  <Typography sx={typoStyle}>
                    <strong>Nights: </strong>
                    {nights} night{nights > 1 ? 's' : ''}
                  </Typography>
                )}

                <Typography sx={typoStyle}>
                  <strong>Room type:</strong> {room?.roomCategory}
                </Typography>

                {/* Meal Plan Information */}
                {mealPlanPrice > 0 && mealDesc && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{
                      ...typoStyle,
                      bgcolor: '#e8f5e9',
                      border: '1px solid #c8e6c9'
                    }}>
                      <strong>Meal Plan:</strong> {mealDesc}
                    </Typography>
                    <RestaurantIcon fontSize="small" sx={{ color: color.firstColor }} />
                  </Box>
                )}

                {/* Auto-calculated Room Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={typoStyle}>
                    <strong>Room Info: </strong>
                    {requiredRooms} Room{requiredRooms && requiredRooms > 1 ? 's' : ''},
                    {adults} Adult{adults && Number(adults) > 1 ? 's' : ''},
                    {children} Child{children && Number(children) > 1 ? 'ren' : ''}
                  </Typography>
                </Box>

                {/* Price source indicator */}
                <Typography sx={{ fontSize: 12, color: color.forthColor, mt: 1, fontStyle: 'italic' }}>
                  {getPriceSource()} • Price may vary by date and availability
                </Typography>
              </div>
            </div>
          </Box>

          {/* Occupancy Information Panel */}
          <Box sx={{
            mt: 2,
            p: 1.5,
            bgcolor: '#f5f5f5',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: color.forthColor, display: 'block', mb: 0.5 }}>
              Room Occupancy Rules
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{
                bgcolor: '#e3f2fd',
                color: '#1976d2',
                px: 1,
                py: 0.5,
                borderRadius: '4px'
              }}>
                Standard: {room?.standardRoomOccupancy || 1} guest{room?.standardRoomOccupancy > 1 ? 's' : ''}
              </Typography>

              <Typography variant="caption" sx={{
                bgcolor: '#fff3e0',
                color: '#f57c00',
                px: 1,
                py: 0.5,
                borderRadius: '4px'
              }}>
                Maximum: {room?.maxRoomOccupancy || 1} guest{room?.maxRoomOccupancy > 1 ? 's' : ''}
              </Typography>

              <Typography variant="caption" sx={{
                bgcolor: '#e8f5e9',
                color: '#2e7d32',
                px: 1,
                py: 0.5,
                borderRadius: '4px'
              }}>
                Your Guest: {Number(adults) + Number(children)} guest{(Number(adults) + Number(children)) > 1 ? 's' : ''}
              </Typography>

              <Typography variant="caption" sx={{
                bgcolor: '#f3e5f5',
                color: '#7b1fa2',
                px: 1,
                py: 0.5,
                borderRadius: '4px'
              }}>
                Rooms needed: {requiredRooms}
              </Typography>
            </Box>

            {/* ROOM-WISE DISTRIBUTION */}
            {guestsPerRoom && guestsPerRoom.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: color.forthColor, display: 'block', mb: 0.5 }}>
                  Room-wise Guest Distribution:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {guestsPerRoom.map((guests, index) => {
                    const standardOccupancy = room?.standardRoomOccupancy || 1;
                    const extraInRoom = guests > standardOccupancy ? guests - standardOccupancy : 0;

                    return (
                      <Typography key={index} variant="caption" sx={{
                        bgcolor: extraInRoom > 0 ? '#ffebee' : '#e8f5e9',
                        color: extraInRoom > 0 ? '#c62828' : '#2e7d32',
                        px: 1,
                        py: 0.5,
                        borderRadius: '4px'
                      }}>
                        Room {index + 1}: {guests} guest{guests !== 1 ? 's' : ''}
                        {extraInRoom > 0 && ` (+${extraInRoom} extra)`}
                      </Typography>
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* EXTRA GUEST CHARGE NOTICE - Only show if there are extra guests */}
            {extraGuestCount > 0 && (
              <Box sx={{
                mt: 1.5,
                p: 1,
                bgcolor: '#fff3e0',
                borderRadius: '6px',
                border: '1px solid #ffcc80'
              }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#e65100', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <PersonAddIcon fontSize="small" />
                  Additional Guest Charges (Payable at Property):
                </Typography>
                <Box sx={{ ml: 2, mt: 0.5 }}>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    • {extraGuestCount} extra guest{extraGuestCount > 1 ? 's' : ''} across {requiredRooms} room{requiredRooms > 1 ? 's' : ''}
                    (Standard occupancy: {room?.standardRoomOccupancy || 1} guest{room?.standardRoomOccupancy > 1 ? 's' : ''} per room)
                  </Typography>

                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#e65100', mt: 0.5 }}>
                    • Total extra charge: ₹ {extraGuestCharge.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#666', mt: 0.5 }}>
                    Note: This amount will be collected directly by the property during check-in.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* VALIDATION ERROR MESSAGE */}
          {validationError && (
            <Alert
              severity="error"
              sx={{
                mt: 3,
                mb: 2,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontSize: '14px',
                  fontWeight: 500
                }
              }}
              onClose={() => setValidationError(null)}
            >
              {validationError}
            </Alert>
          )}

          {/* GUEST FORM */}
          <form onSubmit={formik.handleSubmit}>
            <Typography
              variant="h6"
              mt={4}
              sx={{ color: color.firstColor, fontWeight: "bold" }}
            >
              Guest Information
            </Typography>

            {/* Guest Name */}
            <CustomTextField
              label="Guest Name *"
              name="name"
              fullWidth
              margin="normal"
              value={formik.values.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={
                formik.touched.name && formik.errors.name
                  ? String(formik.errors.name)
                  : " "
              }
              inputRef={nameFieldRef}
              sx={{
                '& .MuiFormHelperText-root': {
                  color: 'red',
                  fontSize: '12px',
                  marginLeft: 1,
                  marginTop: 0.5,
                  fontWeight: 500,
                },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-error fieldset': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  }
                }
              }}
            />

            {/* PHONE NUMBER */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                width: {
                  xs: "100%",
                  md: "100%",
                },
              }}
            >
              <PhoneInput
                country="in"
                onlyCountries={["in"]}
                disableDropdown
                countryCodeEditable={false}
                enableSearch={false}
                value={formik.values.phoneNumber}
                placeholder="Phone Number"
                onChange={(value) => formik.setFieldValue("phoneNumber", value)}
                onBlur={() => formik.setFieldTouched("phoneNumber", true)}
                inputStyle={{
                  width: "100%",
                  height: "56px",
                  borderRadius: "52px",
                  border: "none",
                  outline: "none",
                  boxShadow: "4px 4px 10px rgba(104, 39, 184, 0.17)",
                  color: color.firstColor,
                  paddingLeft: "60px",
                  fontSize: "16px",
                  backgroundColor: "white",
                }}
                buttonStyle={{
                  borderRadius: "52px 0 0 52px",
                  backgroundColor: "white",
                  border: "none",
                }}
                containerStyle={{
                  width: "100%",
                }}
                dropdownStyle={{
                  borderRadius: "12px",
                }}
              />

              {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                <Typography
                  sx={{
                    color: "red",
                    fontSize: "12px",
                    mt: 0.5,
                    ml: "14px",
                  }}
                >
                  {formik.errors.phoneNumber}
                </Typography>
              )}
            </Box>
            {/* Email */}
            <CustomTextField
              label="Email Address (Optional)"
              name="email"
              fullWidth
              margin="normal"
              value={formik.values.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={
                formik.touched.email && formik.errors.email
                  ? String(formik.errors.email)
                  : " "
              }
              sx={{
                '& .MuiFormHelperText-root': {
                  fontSize: '12px',
                  marginLeft: 1,
                  marginTop: 0.5,
                },
              }}
            />


            {/* DISCOUNT SECTION */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ color: color.firstColor, fontWeight: "bold", mb: 1 }}
              >
                Available Discounts
              </Typography>

              {/* Hotel Discount Section */}
              {hotelDiscountData.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {hotelDiscountApplied ? (
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#e8f5e9",
                      border: "1px solid #c8e6c9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      animation: hotelDiscount ? 'fadeInScale 0.5s ease-out' : 'none',
                      '@keyframes fadeInScale': {
                        '0%': {
                          opacity: 0,
                          transform: 'scale(0.95)',
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'scale(1)',
                        }
                      }
                    }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <DiscountIcon color="success" />
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: "#2e7d32" }}>
                            Hotel Discount Applied
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#388e3c", display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getDiscountTypeIcon(hotelDiscount?.discountType || 'flat')}
                            {hotelDiscount?.discountValue || 0}{getDiscountTypeLabel(hotelDiscount?.discountType || 'flat')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#666", display: "block", mt: 0.5 }}>
                            You saved ₹ {hotelDiscountAmount.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={handleRemoveHotelDiscount}
                      >
                        Remove
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#e3f2fd",
                      border: "1px solid #bbdefb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <DiscountIcon color="primary" />
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: "#1565c0" }}>
                            Hotel Discount Available
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#1976d2", display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getDiscountTypeIcon(hotelDiscountData[0].discountType)}
                            {hotelDiscountData[0].discountValue}{getDiscountTypeLabel(hotelDiscountData[0].discountType)}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        sx={{ background: color.firstColor }}
                        size="small"
                        onClick={handleApplyHotelDiscount}
                      >
                        Apply
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Huts4u Discount Section */}
              {couponApplied ? (
                <Box sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#e8f5e9",
                  border: "1px solid #c8e6c9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  animation: couponApplied ? 'fadeInScale 0.5s ease-out' : 'none',
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <OfferIcon color="success" />
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: "#2e7d32" }}>
                        Huts4u Discount Applied
                      </Typography>

                      <Typography variant="caption" sx={{ color: "#666", display: "block", mt: 0.5 }}>
                        You saved ₹ {couponDiscount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleRemoveCoupon}
                  >
                    Remove
                  </Button>
                </Box>
              ) : (
                <Box sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#fff3e0",
                  border: "1px solid #ffcc80",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <OfferIcon color="warning" />
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: "#e65100" }}>
                        Huts4u Discount Available
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#e65100" }}>
                        5% off on total amount
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    sx={{ background: color.firstColor }}
                    size="small"
                    onClick={handleApplyCoupon}
                  >
                    Apply
                  </Button>
                </Box>
              )}

              {/* Combined Discount Summary */}
              {(hotelDiscountApplied || couponApplied) && (
                <Box sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "#f5f0ff",
                  border: "1px solid #d1c4e9",
                  animation: 'slideInFromLeft 0.5s ease-out',
                  '@keyframes slideInFromLeft': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateX(-20px)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateX(0)',
                    }
                  }
                }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: color.firstColor, mb: 0.5 }}>
                    Total Discounts Applied:
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Total savings:
                    </Typography>
                    <Typography variant="body2" sx={{
                      fontWeight: 600,
                      color: "#2e7d32",
                      animation: totalDiscount > 0 ? 'pulse 1s ease-in-out' : 'none',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)' },
                      }
                    }}>
                      ₹ {totalDiscount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* GST SECTION */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 1,
                gap: { xs: 1, sm: 0 }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: color.firstColor,
                      fontWeight: "bold",
                      fontSize: { xs: '1rem', sm: '1.1rem' }
                    }}
                  >
                    GST Details(Optional)
                  </Typography>

                  {/* GST Added Indicator */}
                  {gstinNumber && (
                    <Chip
                      label="GST Added ✓"
                      color="success"
                      size="small"
                      icon={<VerifiedIcon />}
                      sx={{
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        height: { xs: 28, sm: 32 }
                      }}
                    />
                  )}
                </Box>

                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  width: { xs: '100%', sm: 'auto' }
                }}>
                  {/* Toggle Button - Only show "Add GST" when not added yet */}
                  {!gstinNumber ? (
                    <Button
                      size="small"
                      variant={gstSectionOpen ? "outlined" : "contained"}
                      onClick={() => {
                        setGstSectionOpen(!gstSectionOpen);
                        if (isLoggedIn() && !gstSectionOpen) {
                          loadUserGSTRecords(getUserId());
                        }
                      }}
                      sx={{
                        textTransform: 'none',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        minWidth: { xs: '100px', sm: '120px' },
                        whiteSpace: 'nowrap',
                        bgcolor: gstSectionOpen ? 'transparent' : color.firstColor,
                        color: gstSectionOpen ? color.firstColor : 'white',
                        borderColor: gstSectionOpen ? color.firstColor : 'transparent',
                        '&:hover': {
                          bgcolor: gstSectionOpen ? '#f5f0ff' : color.firstColor,
                          borderColor: color.firstColor
                        }
                      }}
                    >
                      {gstSectionOpen ? 'Cancel' : 'Add GST'}
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleClearGST}
                        sx={{
                          textTransform: 'none',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          minWidth: { xs: '80px', sm: '100px' },
                          whiteSpace: 'nowrap',
                          borderColor: '#ff6b6b',
                          color: '#ff6b6b',
                          '&:hover': {
                            bgcolor: '#ffeaea',
                            borderColor: '#ff4444'
                          }
                        }}
                      >
                        Remove
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setGstSectionOpen(!gstSectionOpen)}
                        sx={{
                          textTransform: 'none',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          minWidth: { xs: '100px', sm: '120px' },
                          whiteSpace: 'nowrap',
                          borderColor: color.firstColor,
                          color: color.firstColor,
                          '&:hover': {
                            bgcolor: '#f5f0ff'
                          }
                        }}
                      >
                        {gstSectionOpen ? 'Hide Details' : 'Change GST'}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Optional GST Notice */}
              {!gstinNumber && !gstSectionOpen && (
                <Box sx={{
                  p: { xs: 1, sm: 1.5 },
                  borderRadius: 1.5,
                  bgcolor: '#f0f7ff',
                  border: '1px solid #cce5ff',
                  mb: 2
                }}>
                  <Typography variant="body2" sx={{
                    color: '#0066cc',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <BusinessIcon fontSize="small" />
                    Need a business invoice? Add your GST details to get a tax invoice with your booking.
                  </Typography>
                </Box>
              )}

              {gstSectionOpen && (
                <Box sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  bgcolor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  {/* Loading state */}
                  {loadingGSTRecords && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  )}

                  {/* STEP 1: Show saved GST records if user is logged in */}
                  {isLoggedIn() && userGSTRecords.length > 0 && !showNewGSTForm && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{
                        mb: 1.5,
                        color: color.forthColor,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: { xs: '0.85rem', sm: '0.9rem' }
                      }}>
                        <BusinessIcon fontSize="small" />
                        Your Saved GST Records:
                      </Typography>

                      <Box sx={{
                        p: { xs: 1, sm: 2 },
                        borderRadius: 2,
                        bgcolor: 'white',
                        border: '1px solid #e0e0e0',
                        maxHeight: { xs: '250px', sm: '300px' },
                        overflowY: 'auto'
                      }}>
                        {userGSTRecords.length === 0 ? (
                          <Box sx={{
                            p: 3,
                            textAlign: 'center',
                            color: '#666'
                          }}>
                            <BusinessIcon sx={{ fontSize: 40, color: '#ddd', mb: 1 }} />
                            <Typography variant="body2">
                              No saved GST records found
                            </Typography>
                            <Typography variant="caption">
                              Add your first GSTIN to save it for future bookings
                            </Typography>
                          </Box>
                        ) : (
                          userGSTRecords.map((record, index) => {
                            const isVerified = record.verified === true || record.gstStatus === "Active";
                            const isSelected = selectedGSTRecord?.id === record.id ||
                              selectedGSTRecord?._id === record._id;

                            return (
                              <Box
                                key={record._id || record.id || index}
                                sx={{
                                  p: { xs: 1, sm: 1.5 },
                                  mb: 1.5,
                                  borderRadius: 2,
                                  border: isSelected ? `2px solid ${color.firstColor}` : '1px solid #ddd',
                                  backgroundColor: isSelected ? '#f3e5f5' : 'white',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    borderColor: color.firstColor,
                                    backgroundColor: '#faf5ff'
                                  }
                                }}
                                onClick={() => handleGSTRecordSelect(record)}
                              >
                                <Box sx={{
                                  display: 'flex',
                                  flexDirection: { xs: 'column', sm: 'row' },
                                  justifyContent: 'space-between',
                                  alignItems: { xs: 'flex-start', sm: 'center' },
                                  gap: { xs: 1, sm: 0 }
                                }}>
                                  <Box sx={{ flex: 1, width: '100%' }}>
                                    <Box sx={{
                                      display: 'flex',
                                      flexDirection: { xs: 'column', sm: 'row' },
                                      alignItems: { xs: 'flex-start', sm: 'center' },
                                      gap: { xs: 0.5, sm: 1 },
                                      mb: 0.5
                                    }}>
                                      <Typography variant="body2" sx={{
                                        fontWeight: 600,
                                        fontSize: { xs: '0.85rem', sm: '0.9rem' }
                                      }}>
                                        {record.gstNumber}
                                      </Typography>
                                      <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        flexWrap: 'wrap'
                                      }}>
                                        {isVerified && (
                                          <Tooltip title="Verified GST">
                                            <VerifiedIcon fontSize="small" color="success" />
                                          </Tooltip>
                                        )}
                                        {record.gstStatus && (
                                          <Chip
                                            label={record.gstStatus}
                                            size="small"
                                            color={record.gstStatus === "Active" ? "success" : "error"}
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.65rem' }}
                                          />
                                        )}
                                      </Box>
                                    </Box>
                                    <Typography variant="caption" sx={{
                                      color: '#666',
                                      display: 'block',
                                      mb: 0.5,
                                      fontSize: { xs: '0.75rem', sm: '0.8rem' }
                                    }}>
                                      {record.legalName}
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                      color: '#888',
                                      display: 'block',
                                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                    }}>
                                      {record.address}
                                    </Typography>
                                  </Box>

                                  <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    width: { xs: '100%', sm: 'auto' },
                                    justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                                    mt: { xs: 1, sm: 0 }
                                  }}>
                                    {isSelected ? (
                                      <Chip
                                        label="Selected"
                                        size="small"
                                        color="success"
                                        icon={<CheckIcon />}
                                        sx={{ height: 24, fontSize: '0.7rem' }}
                                      />
                                    ) : (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleGSTRecordSelect(record);
                                        }}
                                        sx={{
                                          fontSize: '0.75rem',
                                          minWidth: '70px'
                                        }}
                                      >
                                        Select
                                      </Button>
                                    )}

                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <Tooltip title="Copy GSTIN">
                                        <IconButton
                                          size="small"
                                          sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyGSTIN(record.gstNumber);
                                          }}
                                        >
                                          <CopyIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>

                                      <Tooltip title="Remove from account">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteGST(record.id || record._id);
                                          }}
                                          disabled={deletingGST === (record.id || record._id)}
                                        >
                                          {deletingGST === (record.id || record._id) ? (
                                            <CircularProgress size={16} />
                                          ) : (
                                            <DeleteIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })
                        )}
                      </Box>

                      {/* Add New GST Button */}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mt: 2
                      }}>
                        <Button
                          startIcon={<AddIcon />}
                          variant="outlined"
                          onClick={handleAddNewGST}
                          sx={{
                            textTransform: 'none',
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                          }}
                        >
                          Add New GST
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* STEP 2: Show GST verification form when adding new GST or if no saved records */}
                  {(showNewGSTForm || !isLoggedIn() || (isLoggedIn() && userGSTRecords.length === 0)) && (
                    <Box>
                      <Typography variant="body2" sx={{
                        mb: 2,
                        color: color.forthColor,
                        fontWeight: 600,
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}>
                        {showNewGSTForm ? 'Add New GSTIN' : 'Enter GSTIN for Business Invoice'}
                      </Typography>

                      {/* GSTIN Input */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'stretch', sm: 'center' },
                          gap: { xs: 1, sm: 1 },
                          mb: 1
                        }}>
                          <CustomTextField
                            label="GSTIN Number"
                            fullWidth
                            value={gstinNumber}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase();
                              setGstinNumber(value);
                              // Auto-verify if 15 characters entered
                              if (value.length === 15) {
                                const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
                                if (!gstinRegex.test(value)) {
                                  toast.error("Invalid GSTIN format. Please check the number.");
                                  setGstVerificationStatus("invalid");
                                }
                              }
                            }}
                            placeholder="Enter 15-digit GSTIN"
                            inputRef={gstinFieldRef}
                            disabled={gstVerificationStatus === "verified"}
                            sx={{ flex: 1 }}
                            size="small"
                          />

                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            {gstVerificationStatus === "verified" && (
                              <Tooltip title="GSTIN Verified">
                                <VerifiedIcon color="success" sx={{
                                  fontSize: { xs: 24, sm: 28 }
                                }} />
                              </Tooltip>
                            )}

                            <Button
                              variant="contained"
                              size="small"
                              onClick={handleVerifyGST}
                              disabled={verifyingGst || gstVerificationStatus === "verified" || gstinNumber.length !== 15}
                              sx={{
                                textTransform: 'none',
                                bgcolor: color.firstColor,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                minWidth: { xs: '100px', sm: '120px' },
                                height: { xs: '36px', sm: '40px' }
                              }}
                              startIcon={verifyingGst ? <CircularProgress size={16} color="inherit" /> : null}
                            >
                              {verifyingGst ? 'Verifying...' : gstVerificationStatus === "verified" ? 'Verified' : 'Verify'}
                            </Button>
                          </Box>
                        </Box>

                        {gstVerificationStatus === "invalid" && (
                          <Alert
                            severity="error"
                            sx={{
                              mt: 1,
                              fontSize: '0.8rem',
                              py: 0.5
                            }}
                          >
                            Invalid GSTIN format. Please enter a valid 15-digit GSTIN.
                          </Alert>
                        )}

                        {gstinNumber.length > 0 && gstinNumber.length < 15 && (
                          <Typography variant="caption" sx={{
                            color: 'warning.main',
                            display: 'block',
                            mt: 0.5,
                            fontSize: '0.75rem'
                          }}>
                            Enter 15-digit GSTIN to verify
                          </Typography>
                        )}
                      </Box>

                      {/* Show verified GST details */}
                      {gstVerificationStatus === "verified" && (
                        <>
                          <CustomTextField
                            label="Legal Business Name"
                            fullWidth
                            margin="normal"
                            size="small"
                            value={legalName}
                            onChange={(e) => setLegalName(e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <Tooltip title="Verified">
                                  <VerifiedIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                                </Tooltip>
                              )
                            }}
                            sx={{ mb: 2 }}
                          />

                          <CustomTextField
                            label="Registered Business Address"
                            fullWidth
                            margin="normal"
                            size="small"
                            multiline
                            rows={2}
                            value={gstAddress}
                            onChange={(e) => setGstAddress(e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <Tooltip title="Verified">
                                  <VerifiedIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                                </Tooltip>
                              )
                            }}
                            sx={{ mb: 2 }}
                          />

                          <Alert
                            severity="success"
                            sx={{
                              mb: 2,
                              fontSize: '0.9rem'
                            }}
                            icon={<VerifiedIcon />}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              GSTIN verified successfully!
                            </Typography>
                            <Typography variant="caption">
                              This GST will be added to your invoice
                            </Typography>
                          </Alert>

                          {/* For logged-in users: Show message that GST will be saved to account */}
                          {isLoggedIn() && (
                            <Typography variant="caption" sx={{
                              color: '#666',
                              display: 'block',
                              textAlign: 'center',
                              mt: 1,
                              fontSize: '0.8rem'
                            }}>
                              This GST record will be saved to your account for future bookings
                            </Typography>
                          )}
                        </>
                      )}

                      {/* Back button for logged-in users with existing records */}
                      {isLoggedIn() && userGSTRecords.length > 0 && showNewGSTForm && (
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mt: 2
                        }}>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => {
                              setShowNewGSTForm(false);
                              setGstinNumber("");
                              setLegalName("");
                              setGstAddress("");
                              setGstVerificationStatus("none");
                            }}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.8rem'
                            }}
                          >
                            ← Back to Saved GST Records
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* STEP 3: Show selected GST summary */}
                  {selectedGSTRecord && (
                    <Alert
                      severity="success"
                      sx={{
                        mt: 2,
                        fontSize: '0.9rem'
                      }}
                      icon={<CheckIcon />}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Selected GST for Invoice:
                      </Typography>
                      <Box sx={{ ml: 1, mt: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedGSTRecord.gstNumber}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#388e3c', display: 'block' }}>
                          {selectedGSTRecord.legalName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                          {selectedGSTRecord.address}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button
                          size="small"
                          color="error"
                          onClick={handleClearGST}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Remove GST
                        </Button>
                      </Box>
                    </Alert>
                  )}

                  {/* Optional GST Notice inside section */}
                  {!gstinNumber && (
                    <Box sx={{
                      p: { xs: 1, sm: 1.5 },
                      borderRadius: 1.5,
                      bgcolor: '#f0f7ff',
                      border: '1px solid #cce5ff',
                      mt: 2
                    }}>
                      <Typography variant="body2" sx={{
                        color: '#0066cc',
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <InfoIcon fontSize="small" />
                        <strong>Optional:</strong> Add GST only if you need a business invoice. You can proceed without GST for personal bookings.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Terms acceptance checkbox */}
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsChecked}
                    onChange={(e) => {
                      setTermsChecked(e.target.checked);
                      // Clear validation error when user checks terms
                      if (validationError && e.target.checked) {
                        setValidationError(null);
                      }
                    }}
                    color="primary"
                  />
                }
                label={
                  <span>
                    I accept the{" "}
                    <span
                      style={{
                        color: color.firstColor,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      onClick={() => setTermsOpen(true)}
                    >
                      Terms & Conditions
                    </span>
                  </span>
                }
              />
            </Box>

            {/* Submit button with improved validation - DISABLED until all conditions are met */}
            <CustomButton
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                mt: 2,
                opacity: isFormValid() ? 1 : 0.7,
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#9e9e9e',
                  cursor: 'not-allowed',
                }
              }}
              type="submit"
              disabled={!isFormValid()}
            >
              {isLoggedIn() ? 'Pay Now' : 'Verify Phone & Pay'}
            </CustomButton>

            <LoginOtpModal
              open={showOtpModal}
              onClose={() => setShowOtpModal(false)}
              onVerificationSuccess={handleOtpSuccess}
              phone={otpData.phone}
              name={otpData.name}
              email={otpData.email}
              token={otpData.token}
            />

            {/* Razorpay - Pass all data including discounts */}
            {/* {orderDetails && (
              <RenderRazorpay
                orderDetails={orderDetails}
                mode="modal"
                bookingDetails={{
                  hotel,
                  room,
                  guestInfo: formik.values,
                  gstDetails: gstVerificationStatus === "verified" ? {
                    gstNumber: gstinNumber,
                    legalName,
                    address: gstAddress,
                    verified: true,
                    gstRecordId: selectedGSTRecord?.id || selectedGSTRecord?._id,
                    gstStatus: selectedGSTRecord?.gstStatus || "Active",
                  } : null,
                  discountDetails: {
                    hotelDiscount: hotelDiscountApplied ? {
                      discountId: hotelDiscount?.id,
                      discountType: hotelDiscount?.discountType,
                      discountValue: hotelDiscount?.discountValue,
                      discountAmount: hotelDiscountAmount
                    } : null,
                    couponDiscount: couponApplied ? {
                      couponCode,
                      discountValue: 0.05,
                      discountAmount: couponDiscount
                    } : null,
                    totalDiscount
                  },
                  timing: calculateCheckoutTime(),
                  pricingDetails: {
                    ...priceBreakdown,
                    nights,
                    rooms: requiredRooms.toString(),
                    adults,
                    children,
                    bookingType,
                    checkinDate,
                    checkOutDate,
                    checkinTime,
                    slotDuration,
                    extraGuestCount,
                    extraGuestCharge,
                    guestsPerRoom,
                    inventoryData,
                    unitBase: inventoryUnitBase,
                    mealPlan,
                    mealPlanPrice: totalMealPlan,
                    mealPlanDescription: mealDesc,
                  },
                  bookingType,
                  rooms: requiredRooms.toString(),
                  adults,
                  children,
                }}
              />
            )} */}
          </form>
        </CardContent>
      </Card>

      {/* RIGHT: BILL SUMMARY */}
      {/* RIGHT: BILL SUMMARY */}
      <Card
        sx={{
          p: 1,
          background: "white",
          border: "none",
          boxShadow: 0,
          borderRadius: "12px",
          height: "fit-content",
          minWidth: { md: "350px" },
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: color.firstColor, fontWeight: "bold" }}
          >
            Your Bill Summary
          </Typography>

          {/* Discounts Applied Badge */}
          {(hotelDiscountApplied || couponApplied) && (
            <Box sx={{
              mb: 2,
              p: 1.5,
              bgcolor: "#e8f5e9",
              borderRadius: 1,
              border: "1px solid #c8e6c9",
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <DiscountIcon color="success" fontSize="small" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#2e7d32" }}>
                  Discounts Applied
                </Typography>
                <Typography variant="caption" sx={{ color: "#388e3c", display: "block" }}>
                  Total savings: ₹ {totalDiscount.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  {hotelDiscountApplied && (
                    <Chip
                      size="small"
                      label={`Hotel Discount: ₹ ${hotelDiscountAmount.toFixed(2)}`}
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {couponApplied && (
                    <Chip
                      size="small"
                      label={`Huts4u: ₹ ${couponDiscount.toFixed(2)}`}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* GST Info Badge if GST is added */}
          {gstVerificationStatus === "verified" && (
            <Box sx={{
              mb: 2,
              p: 1.5,
              bgcolor: "#e8f5e9",
              borderRadius: 1,
              border: "1px solid #c8e6c9",
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <VerifiedIcon color="success" fontSize="small" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#2e7d32" }}>
                  GST Invoice Enabled
                </Typography>
                <Typography variant="caption" sx={{ color: "#388e3c", display: "block" }}>
                  GSTIN: {gstinNumber}
                </Typography>
                <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
                  {legalName}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Meal Plan Info Badge - Show from pricingDetails */}
          {pricingDetails?.mealPlanPrice > 0 && pricingDetails?.mealPlanDescription && (
            <Box sx={{
              mb: 2,
              p: 1.5,
              bgcolor: "#fff3e0",
              borderRadius: 1,
              border: "1px solid #ffcc80",
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <RestaurantIcon color="warning" fontSize="small" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#e65100" }}>
                  Meal Plan Included
                </Typography>
                <Typography variant="caption" sx={{ color: "#e65100", display: "block" }}>
                  {pricingDetails.mealPlanDescription}
                </Typography>
                <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
                  Meal charges included in base price
                </Typography>
              </Box>
            </Box>
          )}

          {/* Price Source Indicator */}
          <Box sx={{
            mb: 2,
            p: 1.5,
            bgcolor: "#e3f2fd",
            borderRadius: 1,
            border: "1px solid #bbdefb"
          }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1565c0" }}>
              {getPriceSource()}
            </Typography>
            <Typography variant="caption" sx={{ color: "#1976d2", display: "block", mt: 0.5 }}>
              {bookingType === "hourly"
                ? `${slotDuration} hrs • ${requiredRooms} room${requiredRooms && requiredRooms > 1 ? 's' : ''}`
                : `${nights} night${nights > 1 ? 's' : ''} • ${requiredRooms} room${requiredRooms && requiredRooms > 1 ? 's' : ''}`}
            </Typography>
            {pricingDetails?.mealPlanPrice > 0 && (
              <Typography variant="caption" sx={{ color: "#e65100", fontWeight: 600, mt: 0.5, display: 'block' }}>
                ✓ {pricingDetails.mealPlanDescription} Included
              </Typography>
            )}
            {couponApplied && (
              <Typography variant="caption" sx={{ color: "green", fontWeight: 600, mt: 0.5, display: 'block' }}>
                ✓  Huts4u Discount Applied
              </Typography>
            )}
            {hotelDiscountApplied && (
              <Typography variant="caption" sx={{ color: "#2e7d32", fontWeight: 600, mt: 0.5, display: 'block' }}>
                ✓  Hotel Discount Applied
              </Typography>
            )}
          </Box>

          {/* EXTRA GUEST CHARGE NOTICE */}
          {extraGuestCount > 0 && (
            <Box sx={{
              mb: 2,
              p: 1.5,
              bgcolor: '#fff3e0',
              borderRadius: '8px',
              border: '1px solid #ffcc80'
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#e65100', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <PersonAddIcon fontSize="small" />
                Additional Guest Charges
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                {extraGuestCount} extra guest{extraGuestCount > 1 ? 's' : ''}: ₹ {extraGuestCharge.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#666', mt: 1, fontStyle: 'italic' }}>
                Note: This amount will be collected directly by the property during check-in.
              </Typography>
            </Box>
          )}

          {/* TOP: Compact price view with animation */}
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              flexWrap: "wrap",
              flexDirection: "column",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >


            {/* Main bold price = base + platform after discount */}
            <Typography
              sx={{
                fontSize: "24px",
                color: color.firstColor,
                fontWeight: "bold",
                animation: hotelDiscountApplied ? 'priceDropAnimation 0.6s ease-out' : 'none',
                '@keyframes priceDropAnimation': {
                  '0%': {
                    opacity: 0,
                    transform: 'scale(0.9)'
                  },
                  '70%': {
                    opacity: 1,
                    transform: 'scale(1.05)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'scale(1)'
                  }
                }
              }}
            >
              {displayCombinedBasePlatform > 0
                ? `₹ ${displayCombinedBasePlatform.toFixed(0)}`
                : "—"}
            </Typography>

            {/* GST breakdown */}
            <Typography
              sx={{
                fontSize: "13px",
                color: color.forthColor,
                textAlign: "right",
              }}
            >
              {displayGstTotal > 0 ? (
                <>+ ₹{displayGstTotal.toFixed(0)} taxes &amp; fees</>
              ) : (
                "—"
              )}
            </Typography>
            <Divider sx={{ width: "100%", mt: 1 }} />

            {/* Final total with discount animation */}
            <div style={{ width: "100%", textAlign: "right" }}>
              {/* Show subtotal before discount */}
              <Typography sx={{ fontSize: 13, color: color.forthColor }}>
                Subtotal before discount: ₹ {totalWithoutDiscount.toFixed(2)}
              </Typography>

              {/* Show hotel discount if applied - with animation */}
              {hotelDiscountApplied && hotelDiscountAmount > 0 && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                  animation: 'slideInDiscount 0.5s ease-out',
                  '@keyframes slideInDiscount': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateX(-20px)'
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateX(0)'
                    }
                  }
                }}>
                  <Typography sx={{ fontSize: 14, color: "#2e7d32", fontWeight: 600 }}>
                    Hotel Discount:
                  </Typography>
                  <Typography sx={{
                    fontSize: 14,
                    color: "#2e7d32",
                    fontWeight: 600,
                    animation: 'discountFlash 0.8s ease-in-out',
                    '@keyframes discountFlash': {
                      '0%, 100%': { color: '#2e7d32' },
                      '50%': { color: '#4caf50' }
                    }
                  }}>
                    - ₹ {hotelDiscountAmount.toFixed(2)}
                  </Typography>
                </Box>
              )}

              {/* Show coupon discount if applied */}
              {couponApplied && couponDiscount > 0 && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                  animation: 'slideInDiscount 0.5s ease-out 0.2s',
                  animationFillMode: 'both'
                }}>
                  <Typography sx={{ fontSize: 14, color: "green", fontWeight: 600 }}>
                    Huts4u Discount:
                  </Typography>
                  <Typography sx={{
                    fontSize: 14,
                    color: "green",
                    fontWeight: 600,
                    animation: 'discountFlash 0.8s ease-in-out 0.3s',
                    animationFillMode: 'both'
                  }}>
                    - ₹ {couponDiscount.toFixed(2)}
                  </Typography>
                </Box>
              )}

              {/* Final Price with bounce animation */}
              <Typography
                sx={{
                  fontSize: "16px",
                  color: color.firstColor,
                  fontWeight: "700",
                  mt: (hotelDiscountAmount > 0 || couponDiscount > 0) ? 1 : 0,
                  animation: hotelDiscountApplied || couponApplied ? 'bounceIn 0.8s ease-out' : 'none',
                  '@keyframes bounceIn': {
                    '0%': {
                      opacity: 0,
                      transform: 'scale(0.3)'
                    },
                    '50%': {
                      opacity: 1,
                      transform: 'scale(1.05)'
                    },
                    '70%': {
                      transform: 'scale(0.95)'
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'scale(1)'
                    }
                  }
                }}
              >
                {finalPrice > 0
                  ? `Final: ₹ ${payableAfterDiscount.toFixed(2)}`
                  : "---"}
              </Typography>
            </div>
          </div>

          {/* DETAILED INVOICE-STYLE BREAKUP */}
          {/* DETAILED INVOICE-STYLE BREAKUP */}
          <Box
            sx={{
              mt: 3,
              borderRadius: 2,
              border: "1px dashed #ddd",
              p: 2,
              backgroundColor: "#fafafa",
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                mb: 1,
                color: color.forthColor,
              }}
            >
              Detailed Breakup
            </Typography>

            {/* 1. Base Price (Room + Meal Plan) */}
            <Typography sx={{ fontSize: 13 }}>
              <strong>1. Base Price</strong>
              <span style={{ float: "right" }}>
                ₹ {(totalBase + totalMealPlan + gstOnBase).toFixed(2)}
              </span>
            </Typography>


            {/* 2. Service Charges + CGST + SGST */}
            <Typography sx={{ fontSize: 13, mt: 1 }}>
              <strong>2. Service Charges</strong>
              <span style={{ fontSize: 11 }}> (HSN 996111)</span>
              <span style={{ float: "right" }}>
                ₹ {serviceTaxableValue.toFixed(2)}
              </span>
            </Typography>
            <Typography sx={{ fontSize: 12, ml: 2, mt: 0.3 }}>
              CGST @ 9% on Service
              <span style={{ float: "right" }}>
                ₹ {cgstOnService.toFixed(2)}
              </span>
            </Typography>
            <Typography sx={{ fontSize: 12, ml: 2 }}>
              SGST @ 9% on Service
              <span style={{ float: "right" }}>
                ₹ {sgstOnService.toFixed(2)}
              </span>
            </Typography>

            {/* 3. Convenience Fees (Incl. GST) */}
            <Typography sx={{ fontSize: 13, mt: 1 }}>
              <strong>3. Convenience Fees (Incl. GST)</strong>
              <span style={{ float: "right" }}>
                ₹ {convenienceFeeInclGst.toFixed(2)}
              </span>
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            {/* SUBTOTAL BEFORE DISCOUNT */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                Subtotal:
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                ₹ {totalWithoutDiscount.toFixed(2)}
              </Typography>
            </Box>

            {/* DISCOUNTS */}
            {(hotelDiscountApplied || couponApplied) && (
              <>
                {/* Hotel Discount */}
                {hotelDiscountApplied && hotelDiscountAmount > 0 && (
                  <Box sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                    animation: hotelDiscountApplied ? 'slideInLeft 0.5s ease-out' : 'none',
                    '@keyframes slideInLeft': {
                      '0%': {
                        opacity: 0,
                        transform: 'translateX(-20px)'
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'translateX(0)'
                      }
                    }
                  }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#2e7d32" }}>
                      Hotel Discount:
                    </Typography>
                    <Typography sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#2e7d32",
                      animation: hotelDiscountApplied ? 'discountPulse 1s ease-in-out' : 'none',
                      '@keyframes discountPulse': {
                        '0%, 100%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' }
                      }
                    }}>
                      - ₹ {hotelDiscountAmount.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                {/* Huts4u Discount */}
                {couponApplied && couponDiscount > 0 && (
                  <Box sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1.5,
                    animation: couponApplied ? 'slideInLeft 0.5s ease-out 0.2s' : 'none',
                    animationFillMode: 'both'
                  }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "green" }}>
                      Huts4u Discount:
                    </Typography>
                    <Typography sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "green",
                      animation: couponApplied ? 'discountPulse 1s ease-in-out 0.3s' : 'none',
                      animationFillMode: 'both'
                    }}>
                      - ₹ {couponDiscount.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                {/* Total Discount */}
                <Box sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1.5,
                  animation: totalDiscount > 0 ? 'slideInLeft 0.5s ease-out 0.4s' : 'none',
                  animationFillMode: 'both'
                }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                    Total Discount:
                  </Typography>
                  <Typography sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "red",
                    animation: totalDiscount > 0 ? 'highlightDiscount 1s ease-in-out' : 'none',
                    '@keyframes highlightDiscount': {
                      '0%': { color: 'red' },
                      '50%': { color: '#ff6b6b' },
                      '100%': { color: 'red' }
                    }
                  }}>
                    - ₹ {totalDiscount.toFixed(2)}
                  </Typography>
                </Box>
              </>
            )}

            <Divider sx={{ my: 1 }} />

            {/* FINAL TOTAL AFTER DISCOUNT */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                Total After Discount:
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: color.firstColor }}>
                ₹ {(totalWithoutDiscount - totalDiscount).toFixed(2)}
              </Typography>
            </Box>

            {/* FINAL TOTAL PAYABLE */}
            <Box sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 1.5,
              pt: 1.5,
              borderTop: '1px solid #ddd',
              animation: finalPrice > 0 ? 'finalTotalAnimation 0.8s ease-out' : 'none',
              '@keyframes finalTotalAnimation': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(10px)'
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              }
            }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: color.firstColor }}>
                Total Payable
              </Typography>
              <Typography sx={{
                fontSize: 18,
                fontWeight: 700,
                color: color.firstColor,
                animation: finalPrice > 0 ? 'totalBounce 0.8s ease-out' : 'none',
                '@keyframes totalBounce': {
                  '0%': { transform: 'scale(0.8)' },
                  '50%': { transform: 'scale(1.1)' },
                  '100%': { transform: 'scale(1)' }
                }
              }}>
                ₹ {grandTotal.toFixed(2)}
              </Typography>
            </Box>

            {/* Discount & GST Invoice Note */}
            <Box sx={{ mt: 1.5 }}>
              {(hotelDiscountApplied || couponApplied) && (
                <Box sx={{
                  p: 1.5,
                  bgcolor: "#e8f5e9",
                  borderRadius: 1,
                  border: "1px solid #c8e6c9",
                  mb: 1,
                  animation: 'slideInBottom 0.5s ease-out',
                  '@keyframes slideInBottom': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px)'
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)'
                    }
                  }
                }}>
                  <Typography sx={{
                    fontSize: 13,
                    color: "#2e7d32",
                    fontWeight: 600,
                    textAlign: "center"
                  }}>
                    🎉 You saved ₹ {totalDiscount.toFixed(2)} with discounts!
                  </Typography>
                </Box>
              )}

              {gstVerificationStatus === "verified" && (
                <Box sx={{
                  p: 1.5,
                  bgcolor: "#e8f5e9",
                  borderRadius: 1,
                  border: "1px solid #c8e6c9",
                  animation: 'slideInBottom 0.5s ease-out 0.2s',
                  animationFillMode: 'both'
                }}>
                  <Typography sx={{
                    fontSize: 13,
                    color: "#2e7d32",
                    fontWeight: 600,
                    textAlign: "center",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <VerifiedIcon fontSize="small" />
                    GST Invoice will be generated with your booking
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Terms & Conditions Dialog */}
      <Dialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Terms & Conditions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
            {termsText}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: color.firstColor,
              textDecoration: "underline",
              cursor: "pointer",
              fontWeight: 600,
            }}
            onClick={() => window.open("https://huts4u.com/terms", "_blank")}
          >
            Open Huts4u Terms & Conditions
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setTermsOpen(false);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingSummary;

const typoStyle = {
  borderRadius: "52px",
  boxShadow: "4px 4px 10px rgba(104, 39, 184, 0.17)",
  color: color.firstColor,
  background: "white",
  fontSize: { xs: "12px", md: "14px" },
  width: "fit-content",
  p: 1,
  px: 2,
  mb: 1,
};