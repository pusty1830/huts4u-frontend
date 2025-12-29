import React from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import { Mail } from "@mui/icons-material";
import SectionHeader from "../components/SectionHeader";
import color from "../components/color";

const TermsAndConditions: React.FC = () => {
  return (
    <Container
      className="terms-root"
      style={{ background: "white", padding: 16, paddingTop: 0 }}
    >
      <SectionHeader
        primaryText={"Terms & Conditions"}
        subText={"Please read these Terms and Conditions carefully before using our service."}
      />

      {/* ---------------------- MAIN TERMS START ---------------------- */}

      <Box sx={{ mt: 1 }} className="terms-section">
        <Typography variant="h5" className="terms-subtitle">
          HUTS4U – CUSTOMER TERMS & CONDITIONS
        </Typography>

        <Typography variant="body1" className="terms-paragraph" sx={{ mt: 1 }}>
          Welcome to Huts4u, your flexible stay partner. By booking through our website/app,
          you agree to the following Terms & Conditions. These guidelines ensure clarity,
          fairness, and a smooth experience for both you and our partner hotels.
        </Typography>
      </Box>

      {/* SECTION 1 */}
      <Box className="terms-section">
        <Typography variant="h5">1. Booking & Confirmation</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {`1.1. A booking is confirmed only after successful payment or approval by Huts4u.
1.2. Guests must provide accurate details (name, phone number, ID proof). Incorrect details may lead to cancellation without refund.
1.3. Hourly and full-day booking availability depends on each property.
1.4. Prices and availability may change based on hotel inventory.`}
        </Typography>
      </Box>

      {/* SECTION 2 */}
      <Box className="terms-section">
        <Typography variant="h5">2. Check-In Requirements</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {`2.1. A valid government-issued ID (Aadhaar, DL, Passport) is mandatory for all guests.

2.2. Hotels may deny check-in due to:
• Local ID restrictions
• Unmarried couple policies
• Age restrictions
• Safety or behavioural concerns
Huts4u is not responsible for denial caused by hotel rules.

2.3. Alcohol & Smoking Rules:
• Some hotels strictly prohibit alcohol.
• Some are non-smoking or have designated smoking areas.
• Violations may result in fines or check-in denial.

2.4. Guests must follow all hotel policies; penalties for rule violations must be settled directly with the property.`}
        </Typography>
      </Box>

      {/* SECTION 3 */}
      <Box className="terms-section">
        <Typography variant="h5">3. Cancellation & Refund Policy</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {`Huts4u maintains a transparent cancellation system to ensure fairness.

3.1 Standard Cancellation
1. Free Cancellation: Cancel 24+ hours before check-in.
2. Late Cancellation: Within 24 hours = non-refundable.
3. No-Show: No refund.
4. Refund Timeline: 7–10 business days.
5. Same-Channel Cancellation: Must cancel on the booking platform.
6. Internal Approval: Refund is based on Huts4u’s internal policies.

3.2 Non-Refundable Bookings
1. No refund at any time.
2. Full prepayment required.
3. No modifications.
4. Clearly marked as “Non-Refundable”.

3.3 Hourly Bookings
1. Bookings made within 24 hours of check-in are non-refundable.
2. Same-day hourly bookings are non-refundable.

3.4 Group Bookings (3+ rooms)
Group Cancellation:
• Cancel at least 7 days before check-in.
• 25% deposit is non-refundable.
• Cancelling within 7 days = 50% charges.
Partial Cancellation:
• At least 7 days prior.
• Deposit adjusts to remaining rooms.
• Cancelled rooms incur 50% fee.

3.5 Special Circumstances
Medical Emergencies:
• Valid medical proof required.
• Fee may be waived after verification.
• Refund minus platform fees.

Natural Disasters (Force Majeure):
• No penalties.
• Refund (minus platform fees) or rebooking.

3.6 Refund Process
• Refunds go to original payment method.
• Email confirmation once processed.
• Partial cancellations refunded proportionately.
• Special cases need management approval.`}
        </Typography>
      </Box>

      {/* SECTION 4 */}
      <Box className="terms-section">
        <Typography variant="h5">4. Hotel Responsibilities</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {`• Hotels must honour confirmed bookings.
• If a hotel cannot provide a room, they must arrange similar or better accommodation at no extra cost.
• Huts4u assists but is not liable for hotel-side issues.`}
        </Typography>
      </Box>

      {/* SECTION 5 */}
      <Box className="terms-section">
        <Typography variant="h5">5. Customer Conduct</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {`• Guests must follow hotel rules.
• Damage must be compensated by the guest.
• Illegal activities result in eviction and no refund.`}
        </Typography>
      </Box>

      {/* SECTION 6 */}
      <Box className="terms-section">
        <Typography variant="h5">6. Pricing & Payment</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {`• Prices vary by demand and availability.
• Taxes apply as listed.
• Secure online payment.
• Offers cannot be combined unless stated.`}
        </Typography>
      </Box>

      {/* SECTION 7 */}
      <Box className="terms-section">
        <Typography variant="h5">7. Platform Usage</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {`• Fraudulent activities will result in account suspension.
• Fake bookings and misuse are strictly prohibited.`}
        </Typography>
      </Box>

      {/* SECTION 8 */}
      <Box className="terms-section">
        <Typography variant="h5">8. Liability Limitation</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {`Huts4u is a booking platform, not a hotel operator.
We are not responsible for:
• Hotel cleanliness or staff behaviour
• Safety or security issues
• Loss of belongings
• Hotel rule-based denial of check-in
• Penalties for smoking/alcohol violations`}
        </Typography>
      </Box>

      {/* SECTION 9 */}
      <Box className="terms-section">
        <Typography variant="h5">9. Customer Support</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {`📞 18001212560
📧 help@huts4u.com`}
        </Typography>
      </Box>

      {/* SECTION 10 */}
      <Box className="terms-section">
        <Typography variant="h5">10. Governing Law</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {`These Terms follow the laws of India.
Jurisdiction: Bhubaneswar, Odisha, India.`}
        </Typography>
      </Box>

      {/* ---------------------- MAIN TERMS END ---------------------- */}

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2">
          If you have any questions, please contact:
        </Typography>

        <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
          <Mail style={{ marginTop: -3 }} />
          <a href="mailto:help@huts4u.com" style={{ color: color.secondColor }}>
            help@huts4u.com
          </a>
        </Typography>
      </Box>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={() => window.print()} variant="contained" sx={{ backgroundColor: color.secondColor }}>
          Print
        </Button>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="textSecondary">
          Effective date: Nov 12 2025
        </Typography>
      </Box>
    </Container>
  );
};

export default TermsAndConditions;
