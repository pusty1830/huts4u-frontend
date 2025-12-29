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
} from "@mui/material";
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  LocalOffer as OfferIcon,
  PersonAdd as PersonAddIcon,
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
import { isLoggedIn } from "../services/axiosClient";
import { createOrder, getProfile, sendOTP } from "../services/services";
import LoginOtpModal from "./Account/LoginOtpModal";
import 'react-phone-input-2/lib/style.css';

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

// ---------------- SIMPLE PRICE CALCULATION ----------------
export const calculatePriceBreakdown = (
  basePrice: number,
  couponApplied = true
) => {
  const numericBase = Number(basePrice) || 0;

  if (!numericBase || numericBase <= 0) {
    return {
      basePrice: 0,
      gstOnBase: 0,
      platformFee: 0,
      gstOnPlatform: 0,
      convenienceFee: 0,
      gstOnConvenience: 0,
      totalWithoutDiscount: 0,
      couponDiscount: 0,
      finalPrice: 0,
    };
  }

  // 1. GST on base (5%)
  const gstOnBase = numericBase * 0.05;

  // Amount after base GST
  const amountAfterBaseGst = numericBase + gstOnBase;

  // 2. Platform fee (13% on base + GST)
  const platformFee = amountAfterBaseGst * 0.13;

  // 3. GST on platform fee (18%)
  const gstOnPlatform = platformFee * 0.18;

  // 4. Subtotal before convenience
  const subtotalBeforeConvenience =
    numericBase + gstOnBase + platformFee + gstOnPlatform;

  // 5. Convenience fee (2% on subtotal)
  const convenienceFee = subtotalBeforeConvenience * 0.02;

  // 6. GST on convenience fee (18%)
  const gstOnConvenience = convenienceFee * 0.18;

  // 7. Total without discount
  const totalWithoutDiscount =
    subtotalBeforeConvenience + convenienceFee + gstOnConvenience;

  // 8. Coupon discount (5% on total without discount) - ONLY if coupon is applied
  let couponDiscount = 0;
  if (couponApplied) {
    couponDiscount = totalWithoutDiscount * 0.05;
  }

  // 9. Final price = total without discount - discount
  const finalPrice = totalWithoutDiscount - couponDiscount;

  return {
    basePrice: numericBase,
    gstOnBase,
    platformFee,
    gstOnPlatform,
    convenienceFee,
    gstOnConvenience,
    totalWithoutDiscount,
    couponDiscount,
    finalPrice,
  };
};

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
// ---------------------------------------------------------------------------

const BookingSummary = () => {
  const location = useLocation();
  const hotel = location.state?.hotelData;
  const room = location.state?.selectedRoom;
  const selectedSlot = location.state?.selectedSlot;
  const pricingDetails = location.state?.pricingDetails;
  const inventoryData = location.state?.inventoryData || []; // Inventory data from HotelDetails
  
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

  // Coupon state - Auto applied by default
  const [couponCode, setCouponCode] = useState("HUTS4U");
  const [couponApplied, setCouponApplied] = useState(true);
  const [couponError, setCouponError] = useState("");

  // Validation error state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Refs for scrolling to fields
  const nameFieldRef = useRef<HTMLInputElement>(null);
  const phoneFieldRef = useRef<HTMLDivElement>(null);

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

  // Get inventory-based price for the selected slot and date
  const getInventoryPriceForDate = (slot: string): number => {
    if (!room || !checkinDate || !slot) return 0;

    const checkDay = dayjs(checkinDate).format('YYYY-MM-DD');
    const dayInventory = inventoryData?.find((inv:any) => 
      dayjs(inv.date).format('YYYY-MM-DD') === checkDay
    );

    if (!dayInventory) {
      // If no inventory data, fall back to room rates
      switch(slot) {
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
    switch(slot) {
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

  // Check slot availability in inventory
  const isSlotAvailable = (slot: string): boolean => {
    if (!room || !checkinDate || !slot) return false;
    
    const roomStatus = room.status?.toLowerCase();
    const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
    if (!isStatusAvailable) return false;
    
    const checkDay = dayjs(checkinDate).format('YYYY-MM-DD');
    const dayInventory = inventoryData?.find((inv:any) => 
      dayjs(inv.date).format('YYYY-MM-DD') === checkDay
    );
    
    if (!dayInventory) return true; // No inventory record means available
    
    if (dayInventory.isBlocked) return false;

    switch(slot) {
      case 'rateFor1Night':
        return dayInventory.overnightAvailable > dayInventory.overnightBooked;
      case 'rateFor3Hour':
        return dayInventory.threeHourAvailable > dayInventory.threeHourBooked;
      case 'rateFor6Hour':
        return dayInventory.sixHourAvailable > dayInventory.sixHourBooked;
      case 'rateFor12Hour':
        return dayInventory.twelveHourAvailable > dayInventory.twelveHourBooked;
      default:
        return true;
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

  // Check if the selected slot is still available
  const checkSlotAvailability = (): { isAvailable: boolean, message: string } => {
    const slotKey = getSlotKey();
    const available = isSlotAvailable(slotKey);
    
    if (!available) {
      return {
        isAvailable: false,
        message: 'The selected room/slot is no longer available. Please go back and select another room or date.'
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

  useEffect(() => {
    if (isLoggedIn()) {
      getProfile()
        .then((res) => {
          setUser(res?.data?.data);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, []);

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

  // Calculate price breakdown WITHOUT extra guest charges
  const calculateTotalPrice = () => {
    // Calculate multiplier WITHOUT extra guest charges
    let totalMultiplier;
    if (bookingType === "hourly") {
      const hoursMultiplier = slotDuration / 3;
      totalMultiplier = requiredRooms * hoursMultiplier;
    } else {
      totalMultiplier = requiredRooms * nights;
    }

    const totalBasePrice = unitBase * totalMultiplier;

    // Calculate breakdown with coupon (NO extra guest charges added here)
    const breakdown = calculatePriceBreakdown(totalBasePrice, couponApplied);

    return {
      ...breakdown,
      nights,
      totalMultiplier,
      bookingType,
      slotDuration,
      requiredRooms,
      unitBase,
    };
  };

  const priceBreakdown = calculateTotalPrice();
  const {
    basePrice: totalBase,
    gstOnBase,
    platformFee,
    gstOnPlatform,
    convenienceFee,
    gstOnConvenience,
    totalWithoutDiscount,
    couponDiscount,
    finalPrice,
    unitBase: inventoryUnitBase,
  } = priceBreakdown;

  // Display values for UI
  const displayBase = totalBase;
  const displayBasePlus700 = displayBase + 700;
  const displayCombinedBasePlatform = totalBase + platformFee;
  const displayGstTotal = gstOnBase + gstOnPlatform + convenienceFee + gstOnConvenience;
  const payableAfterCoupon = Number(finalPrice.toFixed(2));

  // Invoice pieces
  const serviceTaxableValue = platformFee;
  const cgstOnService = gstOnPlatform / 2;
  const sgstOnService = gstOnPlatform / 2;
  const convenienceFeeInclGst = convenienceFee + gstOnConvenience;
  const grandTotal = payableAfterCoupon; // NO extra guest charges added

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    toast.info("Huts4u Discount removed. Prices updated.");
  };

  const handleApplyCoupon = () => {
    setCouponApplied(true);
    toast.success("Huts4u Discount applied!");
  };

  const handlePayment = async () => {
    try {
      if (!grandTotal || grandTotal <= 0) {
        alert("Booking amount cannot be zero.");
        return;
      }

      const payLoad = {
        amount: Math.round(grandTotal),
        currency: "INR",
      };

      const response = await createOrder(payLoad);

      if (response?.data) {
        setOrderDetails(response.data);
      } else {
        alert("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during payment:", error);
      alert("Payment failed. Please try again.");
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
    onSubmit: (values) => {
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
        handlePayment();
      } else {
        const payLoad = {
          name: values.name,
          email: values.email,
          phone: values.phoneNumber.slice(2),
        };
        sendOTP(payLoad)
          .then((res) => {
            console.log(res);
            setShowOtpModal(true);
            toast("OTP sent successfully. Please verify the OTP.");
            setOtpData({
              phone: values.phoneNumber.slice(2),
              name: values.name,
              email: values.email,
              token: res?.data?.data,
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    },
  });

  const handleOtpSuccess = () => {
    setShowOtpModal(false);
    handlePayment();
  };

  const textContainerRef = useRef<HTMLDivElement>(null);
  const [imageHeight, setImageHeight] = useState("auto");

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
      };
    } else {
      const nights = calculateNights();
      return {
        checkInDate: dayjs(checkinDate, "YYYY-MM-DD").format("DD MMM YYYY"),
        checkInTime: "12.00 PM",
        checkOutDate: dayjs(checkOutDate, "YYYY-MM-DD").format("DD MMM YYYY"),
        checkOutTime: "11.00 AM",
        duration: `${nights} night${nights > 1 ? 's' : ''}`,
      };
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

  // Generate available duration options based on inventory and room availability
  const generateDurationOptions = () => {
    const options = [];

    // Check each slot type for availability
    const checkSlotAvailability = (slotKey: string, hours: number) => {
      if (!room) return false;
      
      // First check room status
      const roomStatus = room.status?.toLowerCase();
      const isStatusAvailable = roomStatus === "available" || roomStatus === "active";
      if (!isStatusAvailable) return false;
      
      // Check inventory availability
      const checkDay = dayjs(checkinDate).format('YYYY-MM-DD');
      const dayInventory = inventoryData?.find((inv:any) => 
        dayjs(inv.date).format('YYYY-MM-DD') === checkDay
      );
      
      if (dayInventory && dayInventory.isBlocked) return false;
      
      // Check specific slot availability
      if (dayInventory) {
        switch(slotKey) {
          case 'rateFor3Hour':
            return dayInventory.threeHourAvailable > dayInventory.threeHourBooked;
          case 'rateFor6Hour':
            return dayInventory.sixHourAvailable > dayInventory.sixHourBooked;
          case 'rateFor12Hour':
            return dayInventory.twelveHourAvailable > dayInventory.twelveHourBooked;
          default:
            return true;
        }
      }
      
      // No inventory record means available
      return true;
    };

    // Check 3 hours
    if (room?.rateFor3Hour && room.rateFor3Hour > 0 && checkSlotAvailability('rateFor3Hour', 3)) {
      options.push({ value: 3, label: "3 hrs", price: getInventoryPriceForDate('rateFor3Hour') });
    }

    // Check 6 hours
    if (room?.rateFor6Hour && room.rateFor6Hour > 0 && checkSlotAvailability('rateFor6Hour', 6)) {
      options.push({ value: 6, label: "6 hrs", price: getInventoryPriceForDate('rateFor6Hour') });
    }

    // Check 12 hours
    if (room?.rateFor12Hour && room.rateFor12Hour > 0 && checkSlotAvailability('rateFor12Hour', 12)) {
      options.push({ value: 12, label: "12 hrs", price: getInventoryPriceForDate('rateFor12Hour') });
    }

    return options;
  };

  const timeSlots = generateTimeSlots();
  const durationOptions = generateDurationOptions();

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
    const dayInventory = inventoryData?.find((inv:any) => 
      dayjs(inv.date).format('YYYY-MM-DD') === checkDay
    );
    
    return dayInventory ? "Dynamic Inventory Pricing" : "Standard Rate";
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

              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  flexWrap: "wrap",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {/* Editable Check-in Date */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {editingCheckin ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TextField
                        type="date"
                        size="small"
                        value={tempCheckinDate}
                        onChange={(e) => setTempCheckinDate(e.target.value)}
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

                {/* Editable Check-in Time - Only for hourly bookings */}
                {bookingType === "hourly" && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    {editingTime ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Time</InputLabel>
                            <Select
                              value={tempCheckinTime}
                              onChange={(e) => setTempCheckinTime(e.target.value)}
                              label="Time"
                            >
                              {timeSlots.map((time) => (
                                <MenuItem key={time.value} value={time.value}>
                                  {time.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Duration</InputLabel>
                            <Select
                              value={tempSlotDuration}
                              onChange={(e) => setTempSlotDuration(e.target.value as number)}
                              label="Duration"
                            >
                              {durationOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label} - ₹{option.price}
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
                          {checkinTime ? dayjs(checkinTime, "HH:mm").format("hh:mm A") : "Not set"}
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
                )}

                {/* Editable Check-out Date - Only for nightly bookings */}
                {bookingType !== "hourly" && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    {editingCheckout ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TextField
                          type="date"
                          size="small"
                          value={tempCheckOutDate}
                          onChange={(e) => setTempCheckOutDate(e.target.value)}
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

                {/* Duration display */}
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
                  
                  {/* Show room-wise breakdown if multiple rooms */}
                  {guestsPerRoom && guestsPerRoom.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                        Room-wise breakdown:
                      </Typography>
                      {guestsPerRoom.map((guests, index) => {
                        const standardOccupancy = room?.standardRoomOccupancy || 1;
                        const extraInRoom = guests - standardOccupancy;
                        const additionalGuestRate = room?.additionalGuestRate || 0;
                        
                        if (extraInRoom > 0) {
                          return (
                            <Typography key={index} variant="caption" sx={{ display: 'block', ml: 1 }}>
                              • Room {index + 1}: {extraInRoom} extra guest{extraInRoom > 1 ? 's' : ''} = ₹ {(extraInRoom * additionalGuestRate).toFixed(2)}
                            </Typography>
                          );
                        }
                        return null;
                      })}
                    </Box>
                  )}
                  
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
              }}
            >
              <PhoneInput
                country="in"
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
                  marginLeft: "5px",
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

            {/* Coupon Section - Auto Applied */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ color: color.firstColor, fontWeight: "bold", mb: 1 }}
              >
                Huts4u Discount
              </Typography>

              {couponApplied ? (
                <Box sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#e8f5e9",
                  border: "1px solid #c8e6c9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <OfferIcon color="success" />
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: "#2e7d32" }}>
                        HUTS4U Discount Applied
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#388e3c" }}>
                        discount on total amount
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

              {couponApplied && (
                <Typography sx={{ color: "green", fontSize: 12, mt: 1, textAlign: "center" }}>
                  ✓  Huts4u Discount automatically applied to your booking
                </Typography>
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

            {/* Razorpay */}
            {orderDetails && (
              <RenderRazorpay
                orderDetails={orderDetails}
                amount={grandTotal}
                bookingDetails={{
                  hotel,
                  room,
                  guestInfo: formik.values,
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
                  },
                  bookingType,
                  rooms: requiredRooms.toString(),
                  adults,
                  children,
                }}
              />
            )}
          </form>
        </CardContent>
      </Card>

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

          {/* Price Source Indicator */}
          <Box sx={{ 
            mb: 2, 
            p: 1, 
            bgcolor: "#e8f5e9", 
            borderRadius: 1,
            border: "1px solid #c8e6c9"
          }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#2e7d32" }}>
              {getPriceSource()}
            </Typography>
            <Typography variant="caption" sx={{ color: "#388e3c", display: "block", mt: 0.5 }}>
              {bookingType === "hourly"
                ? `${slotDuration} hrs • ${requiredRooms} room${requiredRooms && requiredRooms > 1 ? 's' : ''}`
                : `${nights} night${nights > 1 ? 's' : ''} • ${requiredRooms} room${requiredRooms && requiredRooms > 1 ? 's' : ''}`}
            </Typography>
            {couponApplied && (
              <Typography variant="body2" sx={{ color: "green", fontWeight: 600, mt: 0.5 }}>
                ✓  Huts4u Discount Applied
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

          {/* TOP: Compact price view */}
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
            {/* 1) Top struck-through bigger: base + 700 */}
            <Typography
              sx={{
                fontSize: "16px",
                color: color.forthColor,
                textDecoration: "line-through",
                fontWeight: 600,
                opacity: 0.95,
              }}
            >
              {displayBase > 0
                ? `₹ ${displayBasePlus700.toFixed(0)}`
                : "---"}
            </Typography>

            {/* 2) Main bold price = base + platform */}
            <Typography
              sx={{
                fontSize: "24px",
                color: color.firstColor,
                fontWeight: "bold",
              }}
            >
              {displayCombinedBasePlatform > 0
                ? `₹ ${displayCombinedBasePlatform.toFixed(0)}`
                : "—"}
            </Typography>

            {/* 3) GST breakdown */}
            <Typography
              sx={{
                fontSize: "13px",
                color: color.forthColor,
                textAlign: "right",
              }}
            >
              {displayGstTotal > 0 ? (
                <>₹{displayGstTotal.toFixed(0)} taxes &amp; fees</>
              ) : (
                "—"
              )}
            </Typography>
            <Divider sx={{ width: "100%", mt: 1 }} />

            {/* 4) Final total */}
            <div style={{ width: "100%", textAlign: "right" }}>
              {/* Show coupon amount if applied */}
              {couponDiscount > 0 && couponApplied && (
                <>
                  <Typography sx={{ fontSize: 13, color: color.forthColor }}>
                    Subtotal before discount: ₹ {totalWithoutDiscount.toFixed(2)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: "green",
                      fontWeight: 600,
                    }}
                  >
                     Huts4u Discount: - ₹ {couponDiscount.toFixed(2)}
                  </Typography>
                </>
              )}

              <Typography
                sx={{
                  fontSize: "16px",
                  color: color.firstColor,
                  fontWeight: "700",
                  mt: (couponDiscount > 0 && couponApplied) ? 1 : 0,
                }}
              >
                {finalPrice > 0
                  ? `Final: ₹ ${payableAfterCoupon.toFixed(2)}`
                  : "---"}
              </Typography>
            </div>
          </div>

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

            {/* Unit Price Display */}
            {/* <Typography sx={{ fontSize: 12, color: "#666", mb: 1 }}>
              Unit Price: ₹ {inventoryUnitBase.toFixed(2)} {bookingType === "hourly" ? `per ${slotDuration} hours` : 'per night'}
            </Typography> */}

            {/* 1. Base Price + Hotel GST */}
            <Typography sx={{ fontSize: 13 }}>
              <strong>1. Base Price (Reimbursement)</strong>{" "}
              <span style={{ fontSize: 11 }}>(HSN 9985)</span>
              <span style={{ float: "right" }}>
                ₹ {(totalBase + gstOnBase).toFixed(2)}
              </span>
            </Typography>

            {/* 2. Service Charges + CGST + SGST */}
            <Typography sx={{ fontSize: 13, mt: 1 }}>
              <strong>2. Service Charges</strong>{" "}
              <span style={{ fontSize: 11 }}>(HSN 996111)</span>
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
              <strong>3. Convenience Fees (Incl. GST)</strong>{" "}
              <span style={{ fontSize: 11 }}>(Reimbursement, HSN 9985)</span>
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

            {/* DISCOUNT - Only show if applied */}
            {couponApplied && couponDiscount > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "green" }}>
                  Huts4u Discount:
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "green" }}>
                  - ₹ {couponDiscount.toFixed(2)}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />

            {/* FINAL TOTAL PAYABLE */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: color.firstColor }}>
                Total Payable
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: color.firstColor }}>
                ₹ {grandTotal.toFixed(2)}
              </Typography>
            </Box>

            {/* Additional savings note */}
            {couponApplied && couponDiscount > 0 && (
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "#e8f5e9", borderRadius: 1 }}>
                <Typography sx={{ fontSize: 13, color: "#2e7d32", fontWeight: 600, textAlign: "center" }}>
                  🎉 You saved ₹ {couponDiscount.toFixed(2)} with Huts4u Discount!
                </Typography>
              </Box>
            )}
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