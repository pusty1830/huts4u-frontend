import React from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import SectionHeader from "../components/SectionHeader";
import color from "../components/color";

const ShippingAndDeliveryPolicy: React.FC = () => {
    return (
        <Container
            className="shipping-root"
            style={{ background: "white", padding: 16, paddingTop: 0 }}
        >
            <SectionHeader
                primaryText={"Shipping Policy"}
                subText={"Understanding our service process"}
            />

            {/* Overview */}
            <Box sx={{ mt: 1 }} className="shipping-section">
                <Typography variant="h5" className="shipping-subtitle">
                    Overview
                </Typography>
                <Typography variant="body1" className="shipping-paragraph">
                    HUTS4U is an online hotel and room booking service platform. 
                    We do not sell or ship any physical products. 
                    All bookings made through HUTS4U are service-based and 
                    processed digitally.
                </Typography>
            </Box>

            {/* Shipping Not Applicable */}
            <Box className="shipping-section">
                <Typography variant="h5" className="shipping-subtitle">
                    Shipping & Delivery
                </Typography>
                <Typography variant="body1" className="shipping-paragraph">
                    There is no physical shipping or courier delivery involved 
                    in the services provided by HUTS4U.  
                    Bookings, invoices, and confirmations are sent only through 
                    digital communication channels.
                </Typography>
            </Box>

            {/* Booking Confirmation */}
            <Box className="shipping-section">
                <Typography variant="h5" className="shipping-subtitle">
                    Booking Confirmation
                </Typography>
                <Typography variant="body1" className="shipping-paragraph">
                    Once a booking is completed, confirmation details are delivered 
                    to the customer's registered email ID and/or phone number.  
                    No printed documents or postal items will be shipped.
                </Typography>
            </Box>

            {/* Delivery Address */}
            <Box className="shipping-section">
                <Typography variant="h5" className="shipping-subtitle">
                    Delivery Address Requirement
                </Typography>
                <Typography variant="body1" className="shipping-paragraph">
                    A postal delivery address is not required since no physical 
                    delivery occurs. Customers must provide a valid email address 
                    and phone number to receive booking confirmation details.
                </Typography>
            </Box>

            {/* Customer Support */}
            <Box className="shipping-section">
                <Typography variant="h5" className="shipping-subtitle">
                    Support & Assistance
                </Typography>
                <Typography variant="body1" className="shipping-paragraph">
                    For any booking-related inquiries or support, contact us at:
                    <br />
                    Phone: <strong>18001212560</strong>
                    <br />
                    Email:{" "}
                    <a
                        href="mailto:help@huts4u.com"
                        style={{ color: color.secondColor }}
                    >
                        help@huts4u.com
                    </a>
                </Typography>
            </Box>

            {/* Print Button */}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button
                    onClick={() => window.print()}
                    variant="contained"
                    sx={{ backgroundColor: color.secondColor }}
                >
                    Print
                </Button>
            </Box>

            {/* Effective Date */}
            <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="textSecondary">
                    Effective date: Nov 12 2025
                </Typography>
            </Box>
        </Container>
    );
};

export default ShippingAndDeliveryPolicy;
