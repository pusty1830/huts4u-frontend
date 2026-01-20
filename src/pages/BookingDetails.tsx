import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
  CircularProgress,
  Container,
} from "@mui/material";
import { useLocation, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import color from "../components/color";
import { getAllMyBookings } from "../services/services";
import { toast } from "react-toastify";
import { getUserName } from "../services/axiosClient";

// small helpers
const safeNumber = (v: any): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  if (isNaN(n)) return 0;
  return n;
};

const normalizeAmountToRupees = (val: any) => {
  const n = safeNumber(val);
  if (Math.abs(n) > 1000) return n / 100;
  return n;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// Calculate invoice breakdown based on the example image structure
const calculateInvoiceBreakdown = (finalAmount: number) => {
  const discountPercentage = 0.05; // 5% discount
  const serviceChargePercentage = 0.13; // 13% of Base Price WITH GST
  const convenienceFeePercentage = 0.02; // 2% convenience fee

  // Step 1: Calculate subtotal before discount
  const subtotalBeforeDiscount = round2(finalAmount / (1 - discountPercentage));
  const discountAmount = round2(subtotalBeforeDiscount * discountPercentage);

  // Step 2: We need to find Base Price (x) that satisfies:
  const basePriceExclGST = round2(subtotalBeforeDiscount / 1.23965);

  // Now calculate all components
  // Base Price with 5% GST
  const baseCGST = round2(basePriceExclGST * 0.025);
  const baseSGST = round2(basePriceExclGST * 0.025);
  const baseTotal = round2(basePriceExclGST + baseCGST + baseSGST);

  // Service Charges (13% of Base Total) with 18% GST
  const serviceChargesExclGST = round2(baseTotal * serviceChargePercentage);
  const serviceCGST = round2(serviceChargesExclGST * 0.09);
  const serviceSGST = round2(serviceChargesExclGST * 0.09);
  const serviceTotal = round2(serviceChargesExclGST + serviceCGST + serviceSGST);

  // Convenience Fee (2% of core) with 18% GST
  const coreTotal = baseTotal + serviceTotal;
  const convenienceFeeExclGST = round2(coreTotal * convenienceFeePercentage);
  const convenienceCGST = round2(convenienceFeeExclGST * 0.09);
  const convenienceSGST = round2(convenienceFeeExclGST * 0.09);
  const convenienceTotal = round2(convenienceFeeExclGST + convenienceCGST + convenienceSGST);

  // Recalculate subtotal to ensure accuracy
  const calculatedSubtotal = round2(baseTotal + serviceTotal + convenienceTotal);
  const calculatedDiscount = round2(calculatedSubtotal * discountPercentage);
  const calculatedFinal = round2(calculatedSubtotal - calculatedDiscount);

  return {
    basePrice: basePriceExclGST,
    baseCGST: baseCGST,
    baseSGST: baseSGST,
    baseTotal: baseTotal,
    serviceCharges: serviceChargesExclGST,
    serviceCGST: serviceCGST,
    serviceSGST: serviceSGST,
    serviceTotal: serviceTotal,
    convenienceFee: convenienceFeeExclGST,
    convenienceCGST: convenienceCGST,
    convenienceSGST: convenienceSGST,
    convenienceTotal: convenienceTotal,
    subtotalBeforeDiscount: calculatedSubtotal,
    discountAmount: calculatedDiscount,
    finalAmount: calculatedFinal,
    totalCGST: round2(baseCGST + serviceCGST + convenienceCGST),
    totalSGST: round2(baseSGST + serviceSGST + convenienceSGST),
    totalGST: round2(baseCGST + baseSGST + serviceCGST + serviceSGST + convenienceCGST + convenienceSGST),
    totalTaxable: round2(basePriceExclGST + serviceChargesExclGST + convenienceFeeExclGST),
  };
};

const numberToWords = (amount: number) => {
  const single = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
    "Eighty", "Ninety"
  ];

  const toWords = (n: number): string => {
    let word = "";
    if (n >= 10000000) {
      word += toWords(Math.floor(n / 10000000)) + " Crore ";
      n = n % 10000000;
    }
    if (n >= 100000) {
      word += toWords(Math.floor(n / 100000)) + " Lakh ";
      n = n % 100000;
    }
    if (n >= 1000) {
      word += toWords(Math.floor(n / 1000)) + " Thousand ";
      n = n % 1000;
    }
    if (n >= 100) {
      word += toWords(Math.floor(n / 100)) + " Hundred ";
      n = n % 100;
    }
    if (n > 0) {
      if (n < 20) word += single[n] + " ";
      else {
        word += tens[Math.floor(n / 10)] + " " + single[n % 10] + " ";
      }
    }
    return word.trim() + " ";
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = "";
  if (rupees > 0) result += toWords(rupees) + "Rupees";
  if (paise > 0) {
    if (result) result += " and ";
    result += toWords(paise) + "Paise";
  }
  if (!result) result = "Zero Rupees";
  result += " Only";
  return result.replace(/\s+/g, " ").trim();
};

// Simple GST Info Section - Only shows essential user GST details
const UserGstInfoSection: React.FC<{
  gstDetails: any;
  invoiceNumber: string;
  dated: string;
  bookingId: string;
}> = ({ gstDetails, invoiceNumber, dated, bookingId }) => {
  const gstNumber = gstDetails.gstNumber || gstDetails.gstin || "";
  const legalName = gstDetails.legalName || gstDetails.companyName || "";

  if (!gstNumber || !legalName) return null;

  return (
    <Box sx={{
      mb: 3,
      p: 2,
      backgroundColor: "#f5f5f5",
      borderRadius: "4px",
      fontSize: "11px"
    }}>
      <Grid container spacing={1}>
        <Grid item xs={6} sm={3}>
          <Typography sx={{ fontWeight: 700 }}>Booking ID</Typography>
          <Typography>{bookingId || "-"}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography sx={{ fontWeight: 700 }}>Invoice No.</Typography>
          <Typography>{invoiceNumber}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography sx={{ fontWeight: 700 }}>Date</Typography>
          <Typography>{dated}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography sx={{ fontWeight: 700 }}>Place of Supply</Typography>
          <Typography>Odisha</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography sx={{ fontWeight: 700 }}>GSTIN</Typography>
          <Typography>{gstNumber}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography sx={{ fontWeight: 700 }}>Company Legal Name</Typography>
          <Typography>{legalName}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography sx={{ fontWeight: 700 }}>Company Address</Typography>
          <Typography>{gstDetails.address || gstDetails.companyAddress || ""}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

const BookingDetails: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState<any>(location.state || null);
  const [loading, setLoading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const loadBookingIfNeeded = async () => {
      if (booking) return;
      if (!id) return;
      setLoading(true);
      try {
        const Payload = {
          data: { filter: "", bookingId: id },
          page: 0,
          pageSize: 1,
          order: [["createdAt", "DESC"]]
        };
        const res = await getAllMyBookings(Payload);
        const row = res?.data?.data?.rows?.[0];
        if (row) setBooking(row);
        else toast.error("Booking not found");
      } catch (err) {
        console.error("Failed to fetch booking", err);
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };
    loadBookingIfNeeded();
  }, [id, booking]);

  const UserName = getUserName();

  const formatCurrency = (amount: number | string) => {
    if (amount === null || amount === undefined) return "₹0.00";
    const rupees = normalizeAmountToRupees(amount);
    return rupees.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    });
  };

  const downloadInvoice = async () => {
    if (!invoiceRef.current) return;
    setGeneratingPdf(true);
    try {
      const invoiceElement = invoiceRef.current;
      const clone = invoiceElement.cloneNode(true) as HTMLElement;

      clone.style.width = "800px";
      clone.style.margin = "0 auto";
      clone.style.padding = "20px";
      clone.style.backgroundColor = "white";
      clone.style.color = "black";
      clone.style.fontFamily = "'Arial', sans-serif";

      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 5;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      pdf.save(`HUTS4U-Invoice-${booking?.id || id}.pdf`);
      toast.success("Invoice downloaded successfully!");
    } catch (err) {
      console.error("Failed to generate PDF", err);
      toast.error("Failed to generate invoice PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading || !booking) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calculate invoice amounts
  const finalAmount = round2(booking.amountPaid ?? booking.amount ?? 0);
  const breakdown = calculateInvoiceBreakdown(finalAmount);

  // Get GST details from booking object - handle both camelCase and PascalCase
  const gstDetails = booking.gstDetail || booking.GstDetail || {};
  const gstNumber = gstDetails.gstNumber || gstDetails.gstin || "";
  const legalName = gstDetails.legalName || gstDetails.companyName || "";
  const gstAddress = gstDetails.address || gstDetails.companyAddress || "";

  // Check if we have GST details
  const hasGstDetails = gstNumber && legalName;

  const invoiceNumber = booking.invoiceNo || `HUTS-${booking.id}`;
  const dated = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");
  const amountInWords = booking.amountInWords || numberToWords(breakdown.finalAmount);
  const logoUrl = "https://huts44u.s3.ap-south-1.amazonaws.com/hutlogo-removebg-preview.png";

  // Company information (HUTS4U company info)
  const companyInfo = {
    name: "HUTS4U",
    address: "Ground Floor, Plot No. 370/10537, New Pokhran Village, Chandrasekharpur, Bhubaneswar, Odisha – 751016, India",
    gstin: "21AASFH3550L1Z7"
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        onClick={() => window.history.back()}
        sx={{ mb: 3, textTransform: "none" }}
      >
        ← Back to Bookings
      </Button>

      <Grid container spacing={3}>
        {/* Booking Summary Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: color.firstColor }}>
                Booking Details
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ mb: 1 }}>
                    <strong>Property:</strong> {booking.hotelName || booking.propertyName || "-"}
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    <strong>Guest:</strong> {UserName}
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    <strong>Booking ID:</strong> {booking.id}
                  </Typography>
                  {hasGstDetails && (
                    <>
                      <Typography sx={{ mb: 1 }}>
                        <strong>Company Name:</strong> {legalName}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        <strong>GSTIN:</strong> {gstNumber}
                      </Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ mb: 1 }}>
                    <strong>Check-in:</strong> {booking.checkInDate ?? "-"} {booking.checkInTime ?? ""}
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    <strong>Check-out:</strong> {booking.checkOutDate ?? "-"} {booking.checkOutTime ?? ""}
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    <strong>Status:</strong> {booking.status || "Confirmed"}
                  </Typography>
                  {hasGstDetails && gstAddress && (
                    <Typography sx={{ mb: 1 }}>
                      <strong>Company Address:</strong> {gstAddress.substring(0, 50)}...
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Total Amount Paid
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: color.firstColor }}>
                  {formatCurrency(finalAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {hasGstDetails ? "GST Invoice" : "Regular Invoice"}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  onClick={downloadInvoice}
                  disabled={generatingPdf}
                  sx={{
                    background: color.firstColor,
                    textTransform: "none",
                    px: 3,
                    py: 1,
                    "&:hover": {
                      background: color.firstColor,
                      opacity: 0.9
                    }
                  }}
                >
                  {generatingPdf ? "Generating PDF..." : "Download Invoice (PDF)"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.print()}
                  sx={{ textTransform: "none" }}
                >
                  Print
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Invoice Summary Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: 2, height: "90%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Invoice Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Invoice Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {invoiceNumber}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Invoice Date
                </Typography>
                <Typography variant="body1">
                  {dated}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Guest Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {UserName}
                </Typography>
              </Box>

              {hasGstDetails && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    GST Details
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Company Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {legalName}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      GSTIN
                    </Typography>
                    <Typography variant="body2">
                      {gstNumber}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Invoice Preview for PDF */}
        <Grid item xs={12}>
          <Box
            ref={invoiceRef}
            sx={{
              background: "#fff",
              p: { xs: 2, md: 4 },
              color: "#000",
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              maxWidth: "800px",
              margin: "0 auto",
              '@media print': {
                border: 'none',
                padding: 0
              }
            }}
          >
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <img
                  src={logoUrl}
                  alt="HUTS4U logo"
                  crossOrigin="anonymous"
                  style={{
                    maxHeight: "60px",
                    objectFit: "contain",
                    marginBottom: "8px"
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "16px" }}>
                  {companyInfo.name}
                </Typography>
                <Typography sx={{ fontSize: "11px", lineHeight: 1.2, maxWidth: "200px" }}>
                  {companyInfo.address}
                </Typography>
                <Typography sx={{ fontSize: "11px", mt: 1 }}>
                  GSTIN/UIN: {companyInfo.gstin}
                </Typography>
              </Box>

              <Box sx={{ textAlign: "right", flex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "14px" }}>
                  {hasGstDetails ? "TAX INVOICE" : "INVOICE"}
                </Typography>
                <Typography sx={{ fontSize: "12px", mt: 1 }}>
                  <strong>Invoice No:</strong> {invoiceNumber}
                </Typography>
                <Typography sx={{ fontSize: "12px" }}>
                  <strong>Date:</strong> {dated}
                </Typography>
                <Typography sx={{ fontSize: "12px", mt: 2 }}>
                  <strong>Booking ID:</strong> {booking.id}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderWidth: 1 }} />

            {/* User GST Information Section - Only show basic user GST details */}
            {hasGstDetails && (
              <>
                <UserGstInfoSection
                  gstDetails={gstDetails}
                  invoiceNumber={invoiceNumber}
                  dated={dated}
                  bookingId={booking.id}
                />
                <Divider sx={{ my: 2 }} />
              </>
            )}

            {/* Bill To Section */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1 }}>
                Bill To:
              </Typography>
              <Typography sx={{ fontSize: "12px", mb: 1 }}>
                {UserName}
              </Typography>
              {hasGstDetails && (
                <>
                  <Typography sx={{ fontSize: "12px", mb: 1 }}>
                    <strong>GSTIN/UIN:</strong> {gstNumber}
                  </Typography>
                  <Typography sx={{ fontSize: "12px", mb: 1 }}>
                    <strong>Company:</strong> {legalName}
                  </Typography>
                  {gstAddress && (
                    <Typography sx={{ fontSize: "12px", mb: 1 }}>
                      <strong>Address:</strong> {gstAddress}
                    </Typography>
                  )}
                </>
              )}
              <Typography sx={{ fontSize: "12px" }}>
                <strong>Property:</strong> {booking.hotelName || booking.propertyName || "-"}
              </Typography>
              <Typography sx={{ fontSize: "12px" }}>
                <strong>Check-in:</strong> {booking.checkInDate ?? "-"} {booking.checkInTime ?? ""}
              </Typography>
              <Typography sx={{ fontSize: "12px" }}>
                <strong>Check-out:</strong> {booking.checkOutDate ?? "-"} {booking.checkOutTime ?? ""}
              </Typography>
            </Box>

            {/* Price Breakdown Table */}
            <Box sx={{ mb: 3 }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px"
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5f5f5" }}>
                    <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>#</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Description</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Base Price */}
                  <tr>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>1</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      Base Price
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
                      {formatCurrency(breakdown.baseTotal)}
                    </td>
                  </tr>

                  {/* Service Charges */}
                  <tr>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>2</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      Service Charges (HSN 99611)
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
                      {formatCurrency(breakdown.serviceCharges)}
                    </td>
                  </tr>

                  {/* CGST on Service */}
                  <tr>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", paddingLeft: "32px" }}>
                      CGST @ 9% on Service
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
                      {formatCurrency(breakdown.serviceCGST)}
                    </td>
                  </tr>

                  {/* SGST on Service */}
                  <tr>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", paddingLeft: "32px" }}>
                      SGST @ 9% on Service
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
                      {formatCurrency(breakdown.serviceSGST)}
                    </td>
                  </tr>

                  {/* Convenience Fees */}
                  <tr>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>3</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      Convenience Fees (Incl. GST)
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
                      {formatCurrency(breakdown.convenienceTotal)}
                    </td>
                  </tr>

                  {/* Subtotal */}
                  <tr>
                    <td colSpan={2} style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right", fontWeight: 700 }}>
                      Subtotal before discount:
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right", fontWeight: 700 }}>
                      {formatCurrency(breakdown.subtotalBeforeDiscount)}
                    </td>
                  </tr>

                  {/* Discount */}
                  <tr>
                    <td colSpan={2} style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right", fontWeight: 700, color: "green" }}>
                      Huts4u Discount:
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right", fontWeight: 700, color: "green" }}>
                      -{formatCurrency(breakdown.discountAmount)}
                    </td>
                  </tr>

                  {/* Grand Total */}
                  <tr style={{ backgroundColor: "#f0f8ff" }}>
                    <td colSpan={2} style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right", fontWeight: 800 }}>
                      GRAND TOTAL:
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right", fontWeight: 800, fontSize: "14px" }}>
                      {formatCurrency(finalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>

            {/* GST Summary - Show in BOTH GST and non-GST invoices (This is HUTS4U's GST) */}
            <Box sx={{ mb: 3, overflowX: 'auto' }}>
              <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1 }}>
                GST Summary:
              </Typography>
              <Box sx={{
                minWidth: '650px',
                '@media (max-width: 600px)': {
                  minWidth: '650px'
                }
              }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "11px"
                }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th style={{ border: "1px solid #ddd", padding: "6px", whiteSpace: 'nowrap' }}>HSN/SAC</th>
                      <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>Taxable Value</th>
                      <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>CGST Rate</th>
                      <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>CGST Amt</th>
                      <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>SGST Rate</th>
                      <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>SGST Amt</th>
                      <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid #ddd", padding: "6px", whiteSpace: 'nowrap' }}>99611</td>
                      <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>
                        {formatCurrency(breakdown.serviceCharges)}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>
                        9%
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>
                        {formatCurrency(breakdown.serviceCGST)}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>
                        9%
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>
                        {formatCurrency(breakdown.serviceSGST)}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", whiteSpace: 'nowrap' }}>
                        {formatCurrency(breakdown.serviceCGST + breakdown.serviceSGST)}
                      </td>
                    </tr>

                    <tr style={{ backgroundColor: "#f0f8ff" }}>
                      <td style={{ border: "1px solid #ddd", padding: "6px", fontWeight: 700, whiteSpace: 'nowrap' }}>Total</td>
                      <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatCurrency(breakdown.serviceCharges)}
                      </td>
                      <td></td>
                      <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatCurrency(breakdown.serviceCGST)}
                      </td>
                      <td></td>
                      <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatCurrency(breakdown.serviceSGST)}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "right", fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatCurrency(breakdown.serviceCGST + breakdown.serviceSGST)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Box>
            </Box>

            {/* Amount in Words */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
              <Typography sx={{ fontSize: "11px", fontWeight: 700, mb: 1 }}>
                Amount Chargeable (in words):
              </Typography>
              <Typography sx={{ fontSize: "12px", fontStyle: "italic" }}>
                {amountInWords}
              </Typography>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 4, pt: 2, borderTop: "1px solid #ddd" }}>
              <Typography sx={{ fontSize: "10px", mb: 1 }}>
                Declaration: We declare that this invoice shows the actual price of the goods described
                and that all particulars are true and correct.
              </Typography>
              <Typography sx={{ fontSize: "10px", mb: 3 }}>
                E. & O.E.
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box>
                  <Typography sx={{ fontSize: "10px", color: "#666" }}>
                    For {companyInfo.name}
                  </Typography>
                  <Typography sx={{ fontSize: "10px", color: "#666", mt: 2 }}>
                    This is a Computer Generated Invoice
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "11px", fontWeight: 700, mb: 1 }}>
                    Authorised Signatory
                  </Typography>
                  <Box sx={{ height: "40px", width: "120px", borderBottom: "1px solid #000" }}></Box>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              {hasGstDetails
                ? "GST Invoice Preview - Shows how the GST invoice will appear in the PDF"
                : "Regular Invoice Preview - Shows how the invoice will appear in the PDF"}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BookingDetails;