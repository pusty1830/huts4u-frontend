import React, { useState, useEffect } from "react";
import { bookingConfirm, createHotelPayment, createMyPayment, getOneRoomData, postBooking, verifyPayment } from "../../services/services";
import { R_KEY_ID } from "../../services/Secret";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";
import color from "../color";
import { toast } from "react-toastify";
import { getUserId, getUserName } from "../../services/axiosClient";
import dayjs from "dayjs";

interface BookingDetails {
    hotel: any;
    room: any;
    guestInfo: {
        name: string;
        email: string;
        phoneNumber: string;
    };
    timing: {
        checkInDate: string;
        checkInTime: string;
        checkOutDate: string;
        checkOutTime: string;
        duration: string;
    };
    pricingDetails: any;
    bookingType: string | null;
    rooms: string | null;
    adults: string | null;
    children: string | null;
}

interface RenderRazorpayProps {
    orderDetails: any;
    amount: any;
    bookingDetails:any;
}

const RenderRazorpay: React.FC<RenderRazorpayProps> = ({
    orderDetails,
    bookingDetails
}) => {
    const [checkedInTimes, setCheckInTimes] = useState("");
    const [checkedOutTimes, setCheckOutTimes] = useState("");
    const navigate = useNavigate();
    const [open, setOpen] = useState(true);
    console.log(bookingDetails)

    useEffect(() => {
        // Fetch check-in/check-out times only for non-hourly bookings
        if (bookingDetails?.bookingType !== "hourly") {
            getOneRoomData(bookingDetails?.room?.id).then((res) => {
                setCheckInTimes(res?.data?.data?.checkInTime || "");
                setCheckOutTimes(res?.data?.data?.checkOutTime || "");
            });
        }
    }, [bookingDetails]);

    // Helper function to get final check-in/check-out times
    const getTimingDetails = () => {
        if (bookingDetails?.bookingType === "hourly") {
            // For hourly booking: use the times provided in bookingDetails
            return {
                checkInTime: bookingDetails?.timing?.checkInTime,
                checkOutTime: bookingDetails?.timing?.checkOutTime
            };
        } else {
            // For daily booking: use times from database if available, otherwise fallback
            return {
                checkInTime: checkedInTimes || bookingDetails?.timing?.checkInTime,
                checkOutTime: checkedOutTimes || bookingDetails?.timing?.checkOutTime
            };
        }
    };

    const loadScript = (src: string): Promise<boolean> =>
        new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });

    const displayRazorpay = async () => {
        const isScriptLoaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!isScriptLoaded || !(window as any).Razorpay) {
            alert("Failed to load Razorpay SDK.");
            return;
        }

        const timingDetails = getTimingDetails();

        const options = {
            key: R_KEY_ID || "",
            amount: orderDetails.data.amount,
            currency: orderDetails.data.currency,
            order_id: orderDetails.data.id,
            prefill: {
                name: bookingDetails?.guestInfo?.name,
                email: bookingDetails?.guestInfo?.email,
                contact: bookingDetails?.guestInfo?.phoneNumber,
            },
            
            handler: async (response: any) => {
                try {
                    const res = await verifyPayment({
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                    });
                    
                    console.log(res);
                    alert("Payment Successful");
                    
                    const payLoad = {
                        userId: getUserId(),
                        hotelId: bookingDetails?.hotel?.id,
                        roomId: bookingDetails?.room?.id,
                        geustName: bookingDetails?.guestInfo?.name,
                        amountPaid: orderDetails.data.amount,
                        checkInDate: bookingDetails?.timing?.checkInDate,
                        checkInTime: timingDetails.checkInTime, // Use the calculated timing
                        checkOutTime: timingDetails.checkOutTime, // Use the calculated timing
                        checkOutDate: bookingDetails?.timing?.checkOutDate,
                        bookingType: bookingDetails?.bookingType,
                        geustDetails: bookingDetails?.guestInfo,
                        adults: bookingDetails?.adults,
                        children: bookingDetails?.children,
                        hotelName: bookingDetails?.hotel?.propertyName,
                        status: 'pending',
                        paymentId: res?.data?.data?.id,
                        rooms: bookingDetails?.rooms,
                         ...(bookingDetails?.gstDetails && {
    GstDetail: bookingDetails.gstDetails,
  }),
                    };
                    
                    console.log(payLoad);

                    postBooking(payLoad).then((res) => {
                        const payoutPayLoad = {
                            userId: getUserId(),
                            paymentId: res?.data?.data?.id,
                            hotelId: bookingDetails?.hotel?.id,
                            roomId: bookingDetails?.room?.id,
                            bookingId: res?.data?.data?.id,
                            amountPaise: orderDetails.data.amount,
                            feePaise: (bookingDetails?.pricingDetails?.platformFee + bookingDetails?.pricingDetails?.gstOnPlatform) * 100,
                            netAmountPaise: (bookingDetails?.pricingDetails?.basePrice + bookingDetails?.pricingDetails?.gstOnBase) * 100,
                            currency: "INR",
                            bookingsIncluded: [{
                                id: res?.data?.data?.id,
                                bookingDate: res?.data?.data?.checkInDate
                            }],
                            scheduledAt: dayjs(bookingDetails?.timing?.checkInDate, "DD MMM YYYY").toDate(),
                            status: "pending",
                            transactionRef: null,
                            gatewayResponse: null,
                            failureReason: null,
                            processedBy: null,
                            note: "Daily PayOut ",
                             ...(bookingDetails?.gstDetails && {
    GstDetail: bookingDetails.gstDetails,
  }),
                        };

                        const mypaymentPayload = {
                            userId: getUserId(),
                            paymentId: res?.data?.data?.id,
                            hotelId: bookingDetails?.hotel?.id,
                            bookingId: res?.data?.data?.id,
                            roomId: bookingDetails?.room?.id,
                            amountPaise: orderDetails.data.amount,
                            feePaise: (bookingDetails?.pricingDetails?.platformFee + bookingDetails?.pricingDetails?.gstOnPlatform) * 100,
                            netmyAmountPaise: (bookingDetails?.pricingDetails?.platformFee + bookingDetails?.pricingDetails?.gstOnPlatform) * 100,
                            currency: "INR",
                            bookingsIncluded: [res?.data?.data?.id],
                            scheduledAt: dayjs(bookingDetails?.timing?.checkInDate, "DD MMM YYYY").toDate(),
                            initiatedAt: new Date(),
                            processedAt: null,
                            status: "pending",
                            transactionRef: null,
                            gatewayResponse: null,
                            failureReason: null,
                            processedBy: null,
                            note: "Auto payout settlement",
                             ...(bookingDetails?.gstDetails && {
    GstDetail: bookingDetails.gstDetails,
  }),
                        };
                        
                        console.log(mypaymentPayload);
                        
                        createMyPayment(mypaymentPayload).then((res) => {
                            console.log("My Payment is scheduled");
                        }).catch((err) => {
                            console.log("error while creating the mypayment", err);
                        });
                        
                        console.log(payoutPayLoad);
                        
                        createHotelPayment(payoutPayLoad).then((res) => {
                            console.log("My Payout is scheduled");
                        }).catch((err) => {
                            console.log("error while creating the PayOut ", err);
                        });

                        toast(res?.data?.msg);
                        
                        const messagetamplet = {
                            guestName: bookingDetails?.guestInfo?.name,
                            location: bookingDetails?.hotel?.address,
                            hotelName: bookingDetails?.hotel?.propertyName,
                            checkInDate: dayjs(bookingDetails?.timing?.checkInDate, "DD MMM YYYY").format("DD MMM YYYY"),
                            checkInTime: timingDetails.checkInTime, // Use the calculated timing
                            phone: bookingDetails?.guestInfo?.phoneNumber,
                            amountPaid: (bookingDetails?.pricingDetails?.basePrice + bookingDetails?.pricingDetails?.gstOnBase),
                            basePrice: bookingDetails?.pricingDetails?.basePrice,
                            gstOnBase: bookingDetails?.pricingDetails?.gstOnBase,
                            razorpayfee: (bookingDetails?.pricingDetails?.gstTotal - (bookingDetails?.pricingDetails?.gstOnBase + bookingDetails?.pricingDetails?.gstOnPlatform)),
                            platformFee: bookingDetails?.pricingDetails?.platformFee,
                            gstOnPlatform: bookingDetails?.pricingDetails?.gstOnPlatform,
                            totalPrice: bookingDetails?.pricingDetails?.totalPrice,
                            adults: bookingDetails?.adults,
                            children: bookingDetails?.children,
                            rooms: 1,
                            checkOutTime: timingDetails.checkOutTime, // Use the calculated timing
                            checkOutDate: dayjs(bookingDetails?.timing?.checkOutDate, "DD MMM YYYY").format("DD MMM YYYY"),
                            hotelEmail: bookingDetails?.hotel?.receptionEmail,
                            receptionistPhone: bookingDetails?.hotel?.receptionMobile,
                        };

                        console.log(messagetamplet);
                        
                        bookingConfirm(messagetamplet).then((res) => {
                            console.log("message send to the wp", res);
                        }).catch((err) => {
                            console.log(err);
                        });

                        window.location.href="/my-bookings"

                    }).catch((err) => {
                        console.log(err);
                    });

                } catch (error) {
                    alert("Payment verification failed. Please try again.");
                }
            },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <div>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="xs"
                fullWidth
                sx={{
                    "& .MuiPaper-root": {
                        padding: "8px",
                        borderRadius: "16px",
                    },
                }}
            >
                <DialogTitle>Complete Your Payment</DialogTitle>
                <DialogContent>
                    <p>Ensure your payment details are correct before proceeding.</p>
                </DialogContent>
                <DialogActions style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        style={{
                            textTransform: "none",
                            color: "black",
                        }}
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={displayRazorpay}
                        variant="contained"
                        style={{
                            background: color.firstColor,
                            fontSize: "18px",
                            textTransform: "none",
                            border: "solid 1px white",
                        }}
                        sx={{
                            padding: "2px 10px",
                            transition: "all 0.4s ease",
                            "&:hover": {
                                paddingRight: "20px",
                            },
                        }}
                    >
                        Proceed to Pay
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default RenderRazorpay;