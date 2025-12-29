import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Chip,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import color from "../components/color";
import {
  // getAllPayoutsWithDetails, // this can return only payout; we will still use it
  updatePayout,
  updateMypayment,
} from "../services/services";
import { toast } from "react-toastify";

// ---------- TYPES ----------
interface InvoiceItem {
  slNo: number;
  description: string;
  hsnSac: string;
  quantity: string;
  rate: string;
  per: string;
  amount: number;
}

interface TaxRow {
  hsnSac: string;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalTaxAmount: number;
}

interface Invoice {
  id: string | number;
  invoiceNo: string;
  date: string;
  buyerName: string;
  buyerAddress: string;
  buyerGstin?: string;
  totalAmount: number;
  baseAmount: number;
  convFeeAmount: number;
  totalTaxAmount: number;
  amountInWords: string;
  taxAmountInWords: string;
  items: InvoiceItem[];
  taxRows: TaxRow[];
  // extra meta for actions
  status: string;
  bookingId?: number;
  paymentId?: string;
}

// helper: convert number → Indian currency words (simple version)
const numberToWords = (amount: number): string => {
  return `INR ${amount.toFixed(2)} Only`;
};

// ---------- DEMO HELPERS (replace later with real API calls) ----------
const demoFetchHotelById = async (hotelId: number) => {
  // TODO: replace with real `getHotelById(hotelId)` service
  return {
    id: hotelId,
    propertyName: `Demo Hotel #${hotelId}`,
    address:
      "Ground Floor, Plot No. 370/10537, New Pokhran Village, Chandrasekharpur, Bhubaneswar, Odisha – 751016, India",
    city: "Bhubaneswar",
    gstNumber: "21AASFH3550L1Z7",
  };
};

const demoFetchUserById = async (userId: number) => {
  // TODO: replace with real `getUserById(userId)` service
  return {
    id: userId,
    fullName: `Demo Guest #${userId}`,
    email: "guest@example.com",
    phone: "9999999999",
  };
};

const demoFetchBookingById = async (bookingId: number) => {
  // TODO: replace with real `getBookingById(bookingId)` service
  return {
    id: bookingId,
    bookingId: `BK-${bookingId.toString().padStart(5, "0")}`,
    checkInDate: new Date().toISOString(),
    checkOutDate: new Date().toISOString(),
    bookingType: "fullDay",
    pricingDetails: null,
    paymentId: `PAY-${bookingId.toString().padStart(6, "0")}`,
  };
};

// ---------- INVOICE VIEW COMPONENT ----------
const InvoiceView: React.FC<{ invoice: Invoice }> = ({ invoice }) => {
  return (
    <Box
      sx={{
        p: 2,
        fontSize: "12px",
        color: "#000",
        minWidth: "700px",
        maxWidth: "800px",
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Tax Invoice
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>HUTS4U</Typography>
          <Typography fontSize={11}>
            Plot No. 370/10537, Ground Floor, New Pokhran Village,
          </Typography>
          <Typography fontSize={11}>
            Near Anupama Residency, Chandrasekharpur, Bhubaneswar, Khordha
          </Typography>
          <Typography fontSize={11}>
            GSTIN/UIN: 21AASFH3550L1Z7
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography>
            <b>Invoice No.:</b> {invoice.invoiceNo}
          </Typography>
          <Typography>
            <b>Dated:</b> {dayjs(invoice.date).format("DD/MM/YYYY")}
          </Typography>
          <Typography fontSize={11}>
            <b>Delivery Note:</b> -
          </Typography>
          <Typography fontSize={11}>
            <b>Mode/Terms of Payment:</b> Online
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Consignee / Buyer */}
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Typography fontSize={12} sx={{ fontWeight: 600 }}>
            Consignee (Ship to)
          </Typography>
          <Typography fontSize={11}>{invoice.buyerName}</Typography>
          <Typography fontSize={11}>{invoice.buyerAddress}</Typography>
          <Typography fontSize={11}>
            GSTIN/UIN: {invoice.buyerGstin || "N/A"}
          </Typography>
          <Typography fontSize={11}>
            State Name : Odisha, Code : 21
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography fontSize={12} sx={{ fontWeight: 600 }}>
            Buyer (Bill to)
          </Typography>
          <Typography fontSize={11}>{invoice.buyerName}</Typography>
          <Typography fontSize={11}>{invoice.buyerAddress}</Typography>
          <Typography fontSize={11}>
            GSTIN/UIN: {invoice.buyerGstin || "N/A"}
          </Typography>
          <Typography fontSize={11}>
            State Name : Odisha, Code : 21
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 1 }} />

      {/* Items Table */}
      <Table size="small" sx={{ border: "1px solid #ccc" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ border: "1px solid #ccc" }}>Sl. No.</TableCell>
            <TableCell sx={{ border: "1px solid #ccc" }}>
              Description of Goods
            </TableCell>
            <TableCell sx={{ border: "1px solid #ccc" }}>HSN/SAC</TableCell>
            <TableCell sx={{ border: "1px solid #ccc" }}>Quantity</TableCell>
            <TableCell sx={{ border: "1px solid #ccc" }}>Rate</TableCell>
            <TableCell sx={{ border: "1px solid #ccc" }}>Per</TableCell>
            <TableCell sx={{ border: "1px solid #ccc" }} align="right">
              Amount
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoice.items.map((item) => (
            <TableRow key={item.slNo}>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                {item.slNo}
              </TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                {item.description}
              </TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                {item.hsnSac}
              </TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                {item.quantity}
              </TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                {item.rate}
              </TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                {item.per}
              </TableCell>
              <TableCell
                sx={{ border: "1px solid #ccc" }}
                align="right"
              >
                {item.amount.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}

          <TableRow>
            <TableCell
              colSpan={6}
              sx={{ border: "1px solid #ccc" }}
              align="right"
            >
              <b>Total</b>
            </TableCell>
            <TableCell
              sx={{ border: "1px solid #ccc" }}
              align="right"
            >
              {invoice.totalAmount.toFixed(2)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Box mt={1}>
        <Typography fontSize={11}>
          <b>Amount Chargeable (in words): </b>
          {invoice.amountInWords}
        </Typography>
      </Box>

      {/* GST Table */}
      <Box mt={2}>
        <Table size="small" sx={{ border: "1px solid #ccc", mb: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: "1px solid #ccc" }}>HSN/SAC</TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                Taxable Value
              </TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                CGST Rate
              </TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                CGST Amount
              </TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                SGST Rate
              </TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                SGST Amount
              </TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}>
                Total Tax Amount
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.taxRows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ border: "1px solid #ccc" }}>
                  {row.hsnSac}
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc" }}>
                  {row.taxableValue.toFixed(2)}
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc" }}>
                  {row.cgstRate}%
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc" }}>
                  {row.cgstAmount.toFixed(2)}
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc" }}>
                  {row.sgstRate}%
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc" }}>
                  {row.sgstAmount.toFixed(2)}
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc" }}>
                  {row.totalTaxAmount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell
                colSpan={6}
                sx={{ border: "1px solid #ccc" }}
                align="right"
              >
                <b>Total</b>
              </TableCell>
              <TableCell
                sx={{ border: "1px solid #ccc" }}
                align="left"
              >
                {invoice.totalTaxAmount.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Typography fontSize={11}>
          <b>Tax Amount (in words): </b>
          {invoice.taxAmountInWords}
        </Typography>
      </Box>

      <Box mt={3} display="flex" justifyContent="space-between">
        <Box>
          <Typography fontSize={11}>
            <b>Declaration</b>
          </Typography>
          <Typography fontSize={11}>
            We declare that this invoice shows the actual price of the goods
            described and that all particulars are true and correct.
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography fontSize={11}>for HUTS4U</Typography>
          <Box height={40} />
          <Typography fontSize={11}>Authorised Signatory</Typography>
        </Box>
      </Box>

      <Box mt={2} textAlign="center">
        <Typography fontSize={10}>
          This is a Computer Generated Invoice
        </Typography>
      </Box>
    </Box>
  );
};

// ---------- MAIN BILLING SECTION ----------
const BillingSection: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [open, setOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  // Fetch payouts → get hotel/user/booking via IDs (demo now)
  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        // setLoading(true);

        // const payload = {
        //   page: 0,
        //   pageSize: 20, // max 20
        //   // no status filter here – backend can still filter or return all
        // };

        // const res = await getAllPayoutsWithDetails(payload);
        // const rows = res?.data?.data?.rows || [];

        // // For demo: if no rows, make few dummy payouts
        // const payouts =
        //   rows.length > 0
        //     ? rows
        //     : [
        //         {
        //           id: 1,
        //           hotelId: 101,
        //           userId: 501,
        //           bookingId: 9001,
        //           amountPaise: 123965, // 1239.65
        //           feePaise: 18965, // just example
        //           netAmountPaise: 105000,
        //           status: "completed",
        //           createdAt: new Date().toISOString(),
        //         },
        //       ];

        // const toRupees = (paise: number) =>
        //   Number((Number(paise || 0) / 100).toFixed(2));

        // // For each payout, fetch hotel/user/booking details (demo helpers)
        // const mapped: Invoice[] = await Promise.all(
        //   payouts.map(async (p: any) => {
        //     const [hotel, user, booking] = await Promise.all([
        //       demoFetchHotelById(Number(p.hotelId)),
        //       demoFetchUserById(Number(p.userId)),
        //       demoFetchBookingById(Number(p.bookingId)),
        //     ]);

        //     const totalAmount = toRupees(p.amountPaise);
        //     const feeAmount = toRupees(p.feePaise);
        //     const netAmount = toRupees(p.netAmountPaise);

        //     // One simple split: base = net, fee = feeAmount
        //     const baseAmount = netAmount;
        //     const convFeeAmount = feeAmount;

        //     const itemList: InvoiceItem[] = [
        //       {
        //         slNo: 1,
        //         description: "Base Price (Reimbursement)",
        //         hsnSac: "9985",
        //         quantity: "",
        //         rate: "",
        //         per: "",
        //         amount: baseAmount,
        //       },
        //       {
        //         slNo: 2,
        //         description: "Service Charges",
        //         hsnSac: "996111",
        //         quantity: "",
        //         rate: "",
        //         per: "",
        //         amount: convFeeAmount,
        //       },
        //     ];

        //     // tax only on service charges (example)
        //     const cgstAmount = convFeeAmount * 0.09;
        //     const sgstAmount = convFeeAmount * 0.09;
        //     const taxRow: TaxRow = {
        //       hsnSac: "996111",
        //       taxableValue: convFeeAmount,
        //       cgstRate: 9,
        //       cgstAmount,
        //       sgstRate: 9,
        //       sgstAmount,
        //       totalTaxAmount: cgstAmount + sgstAmount,
        //     };

        //     const taxRows: TaxRow[] = [taxRow];

        //     return {
        //       id: p.id,
        //       invoiceNo:
        //         booking.bookingId || p.id.toString().padStart(5, "0"),
        //       date: p.createdAt || new Date().toISOString(),
        //       buyerName: user.fullName || hotel.propertyName || "Guest",
        //       buyerAddress:
        //         hotel.address ||
        //         `${hotel.city || ""}` ||
        //         "Address not available",
        //       buyerGstin: hotel.gstNumber || "",
        //       totalAmount,
        //       baseAmount: baseAmount,
        //       convFeeAmount,
        //       totalTaxAmount: taxRows.reduce(
        //         (sum, t) => sum + t.totalTaxAmount,
        //         0
        //       ),
        //       amountInWords: numberToWords(totalAmount),
        //       taxAmountInWords: numberToWords(
        //         taxRows.reduce((sum, t) => sum + t.totalTaxAmount, 0)
        //       ),
        //       items: itemList,
        //       taxRows,
        //       status: p.status || "completed",
        //       bookingId: booking.id,
        //       paymentId: booking.paymentId,
        //     };
        //   })
        // );

        // setInvoices(mapped);
      } catch (err: any) {
        console.error("fetchPayouts error:", err);
        toast.error("Failed to load billing data");
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, []);

  const handleOpenInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedInvoice(null);
  };

  // PDF Download
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !selectedInvoice) return;

    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${selectedInvoice.invoiceNo}.pdf`);
  };

  // Word Download (HTML → .doc)
  const handleDownloadWord = () => {
    if (!invoiceRef.current || !selectedInvoice) return;

    const content = invoiceRef.current.innerHTML;
    const html =
      "<html><head><meta charset='utf-8'><title>Invoice</title></head><body>" +
      content +
      "</body></html>";

    const blob = new Blob(["\ufeff", html], {
      type: "application/msword",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedInvoice.invoiceNo}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Optional: mark payout as completed
  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      await updatePayout(invoice.id, {
        status: "completed",
        processedAt: new Date(),
      });

      if (invoice.bookingId) {
        await updateMypayment(invoice.bookingId, {
          status: "PaidToHotel",
        });
      }

      toast.success("Payout marked as completed");
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id ? { ...inv, status: "completed" } : inv
        )
      );
    } catch (err: any) {
      console.error("handleMarkAsPaid error:", err);
      toast.error("Failed to update payout");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, background: color.thirdColor }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Billing & Invoices
      </Typography>

      {loading && <Typography>Loading invoices...</Typography>}

      <Grid container spacing={2}>
        {invoices.map((invoice) => (
          <Grid item xs={12} md={4} key={invoice.id}>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: "0px 2px 10px rgba(0,0,0,0.08)",
                border: `1px solid ${color.firstColor}22`,
              }}
            >
              <CardHeader
                avatar={<ReceiptLongIcon sx={{ color: color.firstColor }} />}
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ fontWeight: 600 }}>
                      Invoice #{invoice.invoiceNo}
                    </Typography>
                    <Chip
                      size="small"
                      label={invoice.status}
                      color={
                        invoice.status === "completed"
                          ? "success"
                          : invoice.status === "failed"
                          ? "error"
                          : "warning"
                      }
                    />
                  </Box>
                }
                subheader={
                  <Typography fontSize={12}>
                    Date: {dayjs(invoice.date).format("DD MMM YYYY")}
                  </Typography>
                }
              />
              <CardContent>
                <Typography fontSize={13} sx={{ mb: 0.5 }}>
                  <b>Billed To:</b> {invoice.buyerName}
                </Typography>
                <Typography fontSize={12} sx={{ mb: 1 }}>
                  {invoice.buyerAddress}
                </Typography>
                <Typography fontSize={13} sx={{ mb: 0.5 }}>
                  <b>Total Amount:</b> ₹{invoice.totalAmount.toFixed(2)}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  (Incl. all taxes & convenience fees)
                </Typography>

                <Box mt={2} display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenInvoice(invoice)}
                  >
                    View Invoice
                  </Button>

                  {invoice.status !== "completed" && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleMarkAsPaid(invoice)}
                    >
                      Mark as Paid
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* INVOICE DIALOG */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          Tax Invoice - {selectedInvoice?.invoiceNo}
        </DialogTitle>
        <DialogContent dividers>
          <div ref={invoiceRef}>
            {selectedInvoice && <InvoiceView invoice={selectedInvoice} />}
          </div>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Box>
            <Button
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPDF}
            >
              Download PDF
            </Button>
            <Button
              startIcon={<DescriptionIcon />}
              onClick={handleDownloadWord}
            >
              Download Word
            </Button>
          </Box>
          <Button onClick={handleClose} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingSection;
