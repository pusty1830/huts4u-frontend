import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    CircularProgress,
    Button,
    Paper,
    Alert,
    Divider,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Chip,
    List,
    ListItem,
    ListItemText,
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@mui/material';
import {
    verifyPayment,
    postBooking,
    bookingConfirm,
    createHotelPayment,
    createMyPayment,
} from '../services/services';
import { getUserId } from '../services/axiosClient';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import color from '../components/color';
import {
    Verified as VerifiedIcon,
    Discount as DiscountIcon,
    Restaurant as RestaurantIcon,
    PersonAdd as PersonAddIcon,
    Business as BusinessIcon,
    Hotel as HotelIcon,
    Bed as BedIcon,
    Schedule as ScheduleIcon,
    People as PeopleIcon,
} from '@mui/icons-material';

const PaymentReturn = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed' | 'pending'>('processing');
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [bookingData, setBookingData] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Use a ref to track if processing has started
    const hasProcessedRef = useRef(false);

    const processPaymentReturn = async () => {
        // Prevent multiple executions using ref
        if (hasProcessedRef.current) {
            console.log('Payment processing already in progress or completed');
            return;
        }

        // Mark as processing started
        hasProcessedRef.current = true;

        try {
            // Get data from sessionStorage
            const storedData = sessionStorage.getItem('cashfree_booking_data');

            if (!storedData) {
                setPaymentStatus('failed');
                setErrorMessage('Booking data not found. Please contact support.');
                return;
            }

            const parsedData = JSON.parse(storedData);
            const { bookingDetails } = parsedData;

            // Store booking data for display
            setBookingData(bookingDetails);

            // Extract parameters from URL
            const params = new URLSearchParams(location.search);
            const orderIdFromUrl = params.get('order_id');

            if (!orderIdFromUrl) {
                setPaymentStatus('failed');
                setErrorMessage('Payment information incomplete.');
                return;
            }

            // Verify payment with Cashfree
            const verificationResponse = await verifyPayment({
                orderId: orderIdFromUrl,
            });
            console.log('Payment Verification Response:', verificationResponse);

            if (verificationResponse?.data?.status_code === 'SUCCESS') {
                setPaymentStatus('success');
                setPaymentDetails(verificationResponse.data.data);

                // Proceed with booking creation
                await createBookingAndPayout({
                    bookingDetails,
                    orderId: orderIdFromUrl,
                    paymentDetails: verificationResponse.data.data,
                });

                // Clear session storage
                sessionStorage.removeItem('cashfree_booking_data');

            } else {
                setPaymentStatus('failed');
                setErrorMessage(verificationResponse?.data?.message || 'Payment verification failed');
            }

        } catch (error: any) {
            console.error('Payment processing error:', error);
            setPaymentStatus('failed');
            setErrorMessage(error.response?.data?.message || 'An error occurred during payment processing');
        }
    };

    // Run once on component mount
    useEffect(() => {
        // Add a small delay to ensure component is mounted
        const timer = setTimeout(() => {
            processPaymentReturn();
        }, 100);

        return () => clearTimeout(timer);
    }, []); // Empty dependency array ensures this runs only once on mount

    const createBookingAndPayout = async (data: any) => {
        try {
            const { bookingDetails, orderId, paymentDetails } = data;
            const pricing = bookingDetails.pricingDetails || {};

            // Create booking payload
            const bookingPayload = {
                userId: getUserId(),
                hotelId: bookingDetails.hotel.id,
                roomId: bookingDetails.room.id,
                geustName: bookingDetails.guestInfo.name,
                amountPaid: pricing.finalPrice * 100 || 0,
                checkInDate: bookingDetails.checkinDate,
                checkInTime: bookingDetails.timing.checkInTime,
                checkOutTime: bookingDetails.timing.checkOutTime,
                checkOutDate: bookingDetails.checkOutDate,
                bookingType: bookingDetails.bookingType,
                geustDetails: bookingDetails.guestInfo,
                adults: bookingDetails.adults,
                children: bookingDetails.children,
                hotelName: bookingDetails.hotel.propertyName,
                status: 'pending',
                paymentId: orderId,
                rooms: bookingDetails.rooms,
                extraGuestCount: bookingDetails.extraGuestCount,
                extraGuestCharge: bookingDetails.extraGuestCharge,
                guestsPerRoom: bookingDetails.guestsPerRoom,
                ...(bookingDetails.gstDetails && {
                    GstDetail: bookingDetails.gstDetails,
                }),
                ...(bookingDetails.discountDetails && {
                    discountDetails: bookingDetails.discountDetails,
                }),
            };

           

            // Create booking
            const bookingResponse = await postBooking(bookingPayload);
            const bookingId = bookingResponse?.data?.data?.id;

            if (bookingId) {
                // Create payout for hotel
                const payoutPayload = {
                    userId: getUserId(),
                    paymentId: orderId,
                    hotelId: bookingDetails.hotel.id,
                    roomId: bookingDetails.room.id,
                    bookingId: bookingId,
                    amountPaise: Math.round(pricing.finalPrice * 100),
                    feePaise: Math.round((pricing.platformFee + pricing.gstOnPlatform) * 100),
                    netAmountPaise: Math.round((pricing.basePrice + pricing.gstOnBase) * 100),
                    currency: "INR",
                    bookingsIncluded: [{
                        id: bookingId,
                        bookingDate: bookingDetails.checkinDate
                    }],
                    scheduledAt: dayjs(bookingDetails.checkinDate, "YYYY-MM-DD").toDate(),
                    status: "pending",
                    transactionRef: null,
                    gatewayResponse: null,
                    failureReason: null,
                    processedBy: null,
                    note: "Daily PayOut ",
                    ...(bookingDetails.gstDetails && {
                        GstDetail: bookingDetails.gstDetails,
                    }),
                };

                await createHotelPayment(payoutPayload);

                // Create my payment record
                const myPaymentPayload = {
                    userId: getUserId(),
                    paymentId: orderId,
                    hotelId: bookingDetails.hotel.id,
                    bookingId: bookingId,
                    roomId: bookingDetails.room.id,
                    amountPaise: Math.round(pricing.finalPrice * 100),
                    feePaise: Math.round((pricing.platformFee + pricing.gstOnPlatform) * 100),
                    netmyAmountPaise: Math.round((pricing.platformFee + pricing.gstOnPlatform) * 100),
                    currency: "INR",
                    bookingsIncluded: [bookingId],
                    scheduledAt: dayjs(bookingDetails.checkinDate, "YYYY-MM-DD").toDate(),
                    initiatedAt: new Date(),
                    processedAt: null,
                    status: "pending",
                    transactionRef: null,
                    gatewayResponse: null,
                    failureReason: null,
                    processedBy: null,
                    note: "Auto payout settlement",
                    ...(bookingDetails.gstDetails && {
                        GstDetail: bookingDetails.gstDetails,
                    }),
                };

                await createMyPayment(myPaymentPayload);

                // Send booking confirmation
                const messageTemplate = {
                    guestName: bookingDetails.guestInfo.name,
                    location: bookingDetails.hotel.address,
                    hotelName: bookingDetails.hotel.propertyName,
                    checkInDate: bookingDetails.timing.checkInDate,
                    checkInTime: bookingDetails.timing.checkInTime,
                    phone: bookingDetails.guestInfo.phoneNumber,
                    amountPaid: pricing.finalPrice,
                    basePrice: pricing.basePrice,
                    gstOnBase: pricing.gstOnBase,
                    razorpayfee: 0,
                    platformFee: pricing.platformFee,
                    gstOnPlatform: pricing.gstOnPlatform,
                    totalPrice: pricing.totalWithoutDiscount,
                    adults: bookingDetails.adults,
                    children: bookingDetails.children,
                    rooms: bookingDetails.rooms,
                    checkOutTime: bookingDetails.timing.checkOutTime,
                    checkOutDate: bookingDetails.timing.checkOutDate,
                    hotelEmail: bookingDetails.hotel.receptionEmail,
                    receptionistPhone: bookingDetails.hotel.receptionMobile,
                };

                await bookingConfirm(messageTemplate);

                toast.success('Booking confirmed successfully!');
            }

        } catch (error) {
            console.error('Booking creation error:', error);
            toast.error('Booking created but some operations failed');
        }
    };

    const handleGoToBookings = () => {
        navigate('/my-bookings');
    };

    const handleRetry = () => {
        // Reset the ref and retry
        hasProcessedRef.current = false;
        setPaymentStatus('processing');
        setErrorMessage('');
        setPaymentDetails(null);

        // Small delay before retrying
        setTimeout(() => {
            processPaymentReturn();
        }, 100);
    };

    // Render booking summary when payment is successful
    const renderBookingSummary = () => {
        if (!bookingData) return null;

        const hotel = bookingData.hotel || {};
        const room = bookingData.room || {};
        const guestInfo = bookingData.guestInfo || {};
        const pricing = bookingData.pricingDetails || {};
        const timing = bookingData.timing || {};
        const gstDetails = bookingData.gstDetails || {};
        const discountDetails = bookingData.discountDetails || {};

        return (
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ color: color.firstColor, fontWeight: 'bold', mb: 3 }}>
                    📋 Booking Confirmation
                </Typography>

                {/* Hotel & Room Info */}
                <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <CardMedia
                                    component="img"
                                    image={hotel.propertyImages?.[0]}
                                    alt={hotel.propertyName}
                                    sx={{ borderRadius: 2, height: 200, objectFit: 'cover' }}
                                />
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <HotelIcon color="primary" />
                                    <Typography variant="h6">
                                        {hotel.propertyName}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {hotel.address}
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <BedIcon color="action" />
                                            <Typography variant="subtitle2">
                                                Room Type: {room.roomCategory}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <ScheduleIcon color="action" />
                                            <Typography variant="body2">
                                                <strong>Check-in:</strong> {timing.checkInDate} at {timing.checkInTime}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ScheduleIcon color="action" />
                                            <Typography variant="body2">
                                                <strong>Check-out:</strong> {timing.checkOutDate} at {timing.checkOutTime}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <PeopleIcon color="action" />
                                            <Typography variant="body2">
                                                <strong>Guests:</strong> {bookingData.adults} Adults, {bookingData.children} Children
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2">
                                            <strong>Rooms:</strong> {bookingData.rooms}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Duration:</strong> {timing.duration}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Booking Type:</strong> {bookingData.bookingType === 'hourly' ? 'Hourly' : 'Overnight'}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {/* Extra Guest Info */}
                                {bookingData.extraGuestCount > 0 && (
                                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <PersonAddIcon color="warning" />
                                            <Typography variant="subtitle2" sx={{ color: '#e65100' }}>
                                                Additional Guest Charges
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2">
                                            {bookingData.extraGuestCount} extra guest(s): ₹ {bookingData.extraGuestCharge.toFixed(2)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                                            (Payable directly at the property during check-in)
                                        </Typography>
                                    </Box>
                                )}

                                {/* Guest Info Card */}
                                <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                        👤 Guest Information
                                    </Typography>
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell sx={{ border: 'none', py: 0.5 }}><strong>Name:</strong></TableCell>
                                                <TableCell sx={{ border: 'none', py: 0.5 }}>{guestInfo.name}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ border: 'none', py: 0.5 }}><strong>Phone:</strong></TableCell>
                                                <TableCell sx={{ border: 'none', py: 0.5 }}>{guestInfo.phoneNumber}</TableCell>
                                            </TableRow>
                                            {guestInfo.email && (
                                                <TableRow>
                                                    <TableCell sx={{ border: 'none', py: 0.5 }}><strong>Email:</strong></TableCell>
                                                    <TableCell sx={{ border: 'none', py: 0.5 }}>{guestInfo.email}</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Discounts & GST */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {/* Discounts */}
                    {(discountDetails.hotelDiscount || discountDetails.couponDiscount) && (
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 2, height: '100%' }}>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DiscountIcon color="success" />
                                        Discounts Applied
                                    </Typography>
                                    <List dense>
                                        {discountDetails.hotelDiscount && (
                                            <ListItem>
                                                <ListItemText
                                                    primary="Hotel Discount"
                                                    secondary={`₹ ${discountDetails.hotelDiscount.discountAmount?.toFixed(2)}`}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                    secondaryTypographyProps={{ variant: 'body2', color: 'success.main', fontWeight: 'bold' }}
                                                />
                                            </ListItem>
                                        )}
                                        {discountDetails.couponDiscount && (
                                            <ListItem>
                                                <ListItemText
                                                    primary="Huts4u Discount"
                                                    secondary={`₹ ${discountDetails.couponDiscount.discountAmount?.toFixed(2)}`}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                    secondaryTypographyProps={{ variant: 'body2', color: 'primary.main', fontWeight: 'bold' }}
                                                />
                                            </ListItem>
                                        )}
                                        {discountDetails.totalDiscount > 0 && (
                                            <ListItem sx={{ bgcolor: '#e8f5e9', borderRadius: 1, mt: 1 }}>
                                                <ListItemText
                                                    primary="Total Savings"
                                                    secondary={`₹ ${discountDetails.totalDiscount.toFixed(2)}`}
                                                    primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
                                                    secondaryTypographyProps={{ variant: 'h6', color: '#2e7d32', fontWeight: 'bold' }}
                                                />
                                            </ListItem>
                                        )}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* GST Information */}
                    {gstDetails.gstNumber && (
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 2, height: '100%' }}>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BusinessIcon color="primary" />
                                        GST Invoice Details
                                    </Typography>
                                    <Box sx={{ p: 1 }}>
                                        <Typography variant="body2">
                                            <strong>GSTIN:</strong> {gstDetails.gstNumber}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Legal Name:</strong> {gstDetails.legalName}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Status:</strong>
                                            <Chip
                                                label={gstDetails.gstStatus || "Verified"}
                                                size="small"
                                                color="success"
                                                icon={<VerifiedIcon />}
                                                sx={{ ml: 1, height: 20 }}
                                            />
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>

                {/* Price Breakdown */}
                <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: color.firstColor }}>
                            💰 Price Breakdown
                        </Typography>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell>Base Price</TableCell>
                                    <TableCell align="right">₹ {pricing.basePrice?.toFixed(2)}</TableCell>
                                </TableRow>
                                {pricing.mealPlanPrice > 0 && (
                                    <TableRow>
                                        <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <RestaurantIcon fontSize="small" />
                                            Meal Plan ({pricing.mealPlanDescription})
                                        </TableCell>
                                        <TableCell align="right">₹ {pricing.mealPlanPrice?.toFixed(2)}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell>Service Charges</TableCell>
                                    <TableCell align="right">₹ {pricing.platformFee?.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Taxes & Fees</TableCell>
                                    <TableCell align="right">₹ {(pricing.gstOnBase + pricing.gstOnPlatform + pricing.convenienceFee + pricing.gstOnConvenience)?.toFixed(2)}</TableCell>
                                </TableRow>

                                {/* Subtotal */}
                                <TableRow sx={{ borderTop: '2px solid #ddd' }}>
                                    <TableCell><strong>Subtotal</strong></TableCell>
                                    <TableCell align="right"><strong>₹ {pricing.totalWithoutDiscount?.toFixed(2)}</strong></TableCell>
                                </TableRow>

                                {/* Discounts */}
                                {discountDetails.totalDiscount > 0 && (
                                    <>
                                        <TableRow>
                                            <TableCell sx={{ color: 'success.main' }}>Total Discounts</TableCell>
                                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                - ₹ {discountDetails.totalDiscount?.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                            <TableCell><strong>Amount After Discount</strong></TableCell>
                                            <TableCell align="right">
                                                <strong>₹ {(pricing.totalWithoutDiscount - discountDetails.totalDiscount)?.toFixed(2)}</strong>
                                            </TableCell>
                                        </TableRow>
                                    </>
                                )}

                                {/* Final Total */}
                                <TableRow sx={{ bgcolor: color.firstColor + '10', borderTop: '2px solid' + color.firstColor }}>
                                    <TableCell><strong style={{ fontSize: '1.1em' }}>Total Payable</strong></TableCell>
                                    <TableCell align="right">
                                        <Typography variant="h6" sx={{ color: color.firstColor, fontWeight: 'bold' }}>
                                            ₹ {pricing.finalPrice?.toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Payment Details */}
                {paymentDetails && (
                    <Card sx={{ mt: 3, borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Payment Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>Order ID:</strong> {paymentDetails.orderId}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Payment ID:</strong> {paymentDetails.paymentId}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>Status:</strong>
                                        <Chip
                                            label="Success"
                                            color="success"
                                            size="small"
                                            sx={{ ml: 1 }}
                                        />
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Payment Time:</strong> {dayjs().format('DD MMM YYYY, hh:mm A')}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}
            </Box>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
                {paymentStatus === 'processing' && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <CircularProgress size={80} sx={{ color: color.firstColor, mb: 4 }} />
                        <Typography variant="h4" gutterBottom sx={{ color: color.firstColor, fontWeight: 'bold' }}>
                            Processing Your Payment
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                            Please wait while we verify your payment and confirm your booking...
                        </Typography>
                        <CircularProgress size={24} />
                    </Box>
                )}

                {paymentStatus === 'success' && (
                    <Box>
                        <Box sx={{ textAlign: 'center', mb: 4, py: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                            <Box sx={{ fontSize: 80, color: '#4caf50', mb: 2 }}>✓</Box>
                            <Typography variant="h3" gutterBottom sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                                Payment Successful!
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#2e7d32', mb: 2 }}>
                                Your booking has been confirmed
                            </Typography>
                            <Typography variant="body1">
                                A confirmation email has been sent to your registered email address.
                            </Typography>
                        </Box>

                        {/* Booking Summary */}
                        {renderBookingSummary()}

                        {/* Action Buttons */}
                        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #ddd', display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleGoToBookings}
                                sx={{
                                    bgcolor: color.firstColor,
                                    '&:hover': { bgcolor: color.firstColor, opacity: 0.9 },
                                    px: 6,
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontSize: '1rem',
                                }}
                            >
                                View My Bookings
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => window.print()}
                                sx={{
                                    borderColor: color.firstColor,
                                    color: color.firstColor,
                                    px: 6,
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontSize: '1rem',
                                }}
                            >
                                Print Confirmation
                            </Button>
                            <Button
                                variant="text"
                                size="large"
                                onClick={() => navigate('/')}
                                sx={{
                                    px: 6,
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontSize: '1rem',
                                }}
                            >
                                Back to Home
                            </Button>
                        </Box>
                    </Box>
                )}

                {paymentStatus === 'failed' && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Box sx={{ fontSize: 80, color: '#f44336', mb: 2 }}>✗</Box>
                        <Typography variant="h3" gutterBottom sx={{ color: '#f44336', fontWeight: 'bold' }}>
                            Payment Failed
                        </Typography>

                        {errorMessage && (
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 4,
                                    maxWidth: 600,
                                    mx: 'auto',
                                    '& .MuiAlert-message': { fontSize: '1rem' }
                                }}
                            >
                                {errorMessage}
                            </Alert>
                        )}

                        <Typography variant="h6" sx={{ mb: 4 }}>
                            There was an issue processing your payment. Please try again.
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleRetry}
                                sx={{
                                    bgcolor: color.firstColor,
                                    '&:hover': { bgcolor: color.firstColor },
                                    px: 6,
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontSize: '1rem',
                                }}
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => navigate('/')}
                                sx={{
                                    borderColor: color.firstColor,
                                    color: color.firstColor,
                                    px: 6,
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontSize: '1rem',
                                }}
                            >
                                Go to Home
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default PaymentReturn;