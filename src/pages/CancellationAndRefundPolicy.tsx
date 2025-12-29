
import React from "react";
import { Box, Container, Typography, Button,Link} from "@mui/material";
import SectionHeader from "../components/SectionHeader";
import color from "../components/color";

const CancellationAndRefundPolicy: React.FC = () => {
  return (
    <Container
      className="cancellation-root"
      style={{ background: "white", padding: 16, paddingTop: 0 }}
    >
      <SectionHeader
        primaryText={"Cancellation & Refund Policy"}
        subText={"Our cancellation and refund rules"}
      />

      <Box sx={{ mt: 1 }} className="cancellation-section">
        <Typography variant="h5" className="cancellation-subtitle">
          Overview
        </Typography>
        <Typography variant="body1" className="cancellation-paragraph" sx={{ mt: 1 }}>
          HUTS4U believes in helping its customers as far as possible, and has therefore adopted a
          liberal cancellation policy. Under this policy we aim to be fair to both guests and
          hotels while providing clear timelines for refunds.
        </Typography>
      </Box>

      <Box className="cancellation-section">
        <Typography variant="h5" className="cancellation-subtitle">
          Order Cancellation
        </Typography>
        <Typography variant="body1" className="cancellation-paragraph">
          Cancellations will be considered only if the request is made within <strong>2 days</strong>{" "}
          of placing the order. However, the cancellation request may not be entertained if the
          orders have already been communicated to the vendors/merchants and they have initiated the
          shipping process.
        </Typography>
      </Box>

      <Box className="cancellation-section">
        <Typography variant="h5" className="cancellation-subtitle">
          Non-Cancellable Items
        </Typography>
        <Typography variant="body1" className="cancellation-paragraph">
          HUTS4U does not accept cancellation requests for perishable items such as flowers, food
          items, or other similar goods. However, refund/replacement requests may be considered if
          the customer proves that the quality of the delivered product was unsatisfactory.
        </Typography>
      </Box>

      <Box className="cancellation-section">
        <Typography variant="h5" className="cancellation-subtitle">
          Damaged or Defective Products
        </Typography>
        <Typography variant="body1" className="cancellation-paragraph">
          In the event of receiving damaged or defective items, please report the issue to our
          Customer Service team. The request will be processed only after the merchant verifies and
          confirms the issue from their end. Such reports must be submitted within <strong>2 days</strong>{" "}
          of receiving the product.
        </Typography>
      </Box>

      <Box className="cancellation-section">
        <Typography variant="h5" className="cancellation-subtitle">
          Refund Timeline
        </Typography>
        <Typography variant="body1" className="cancellation-paragraph">
          For any refunds approved by HUTS4U, the refund process will be initiated within{" "}
          <strong>3-5 business days</strong>. The amount will be credited to the original payment
          method used by the customer.
        </Typography>
      </Box>

      {/* ---------------------- HOTEL BOOKING CANCELLATION POLICY ---------------------- */}

      <Box sx={{ mt: 4 }} className="cancellation-section">
        <Typography variant="h4">Hotel Booking Cancellation Policy</Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          I. Introduction
        </Typography>

        <Typography variant="subtitle1" sx={{ mt: 1 }}>
          A. Purpose
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          The purpose of this policy is to outline the procedures and guidelines for handling hotel
          room cancellations at HUTS4U. It aims to provide clarity and fairness for both the hotel
          and its guests, ensuring a smooth and transparent process.
        </Typography>

        <Typography variant="subtitle1">B. Scope</Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          This policy applies to all reservations made at HUTS4U, including online bookings. It
          covers individual and group bookings and addresses various scenarios and exceptions that
          may arise.
        </Typography>

        <Typography variant="subtitle1">C. Principles</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`The policy is based on principles of fairness, transparency, and customer service excellence:
1. Fairness: Cancellation fees and policies are reasonable and proportionate.
2. Transparency: Cancellation terms are communicated at the time of booking.
3. Flexibility: Accommodations for special circumstances (medical emergencies, natural disasters).
4. Consistency: Policy is applied uniformly to all guests.`}
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          II. General Cancellation Policy
        </Typography>

        <Typography variant="subtitle1" sx={{ mt: 1 }}>
          A. Standard Cancellation
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Cancellation Period: Guests must cancel their reservations at least 24 hours before check-in.
2. Cancellation Fee: If cancelled within 24 hours of check-in a fee equivalent to one night's stay will be charged.
3. Refund Process: Refunds (if applicable) are processed within 7-10 business days.
4. Notification Method: Cancellations must be made through the same channel as booking.
5. No-Show Policy: No-show = one night's stay charged.
*Approval of refunds is subject to HUTS4U internal policies.`}
        </Typography>

        <Typography variant="subtitle1">B. Non-Refundable Reservations</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Non-Refundable Terms: Guests who book non-refundable rates are not eligible for refunds.
2. Payment Requirements: Full payment required at booking.
3. Modification Restrictions: Non-refundable reservations cannot be modified.
4. Communication: Non-refundable nature must be clearly communicated at booking.`}
        </Typography>

        <Typography variant="subtitle1">C. Hourly Room Booking Cancellation</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Reservations made less than 24 hours prior to check-in are not eligible for refund.
2. Same-day hourly bookings are non-refundable.`}
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          III. Group Bookings
        </Typography>

        <Typography variant="subtitle1">A. Definition and Scope</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Group Size: A group booking is 3 or more rooms.
2. Advance Notice: Group cancellations must be made at least 7 days in advance.
3. Deposit Policy: 25% non-refundable deposit at reservation.
4. Cancellation Fee: Cancelling within 7 days = 50% of total booking cost.`}
        </Typography>

        <Typography variant="subtitle1">B. Partial Cancellations</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Partial cancellations must be made at least 7 days prior.
2. Deposit is adjusted based on remaining rooms.
3. Fee: 50% of the cancelled rooms' cost.
4. Communication: Group leader should notify via the original booking channel.`}
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          IV. Special Circumstances
        </Typography>

        <Typography variant="subtitle1">A. Medical Emergencies</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Documentation required.
2. Cancellation fee may be waived after verification.
3. Refunds processed within 7-10 business days excluding platform & convenience fees.
4. Contact HUTS4U directly to discuss.`}
        </Typography>

        <Typography variant="subtitle1">B. Natural Disasters</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Force Majeure: Natural disasters exempt both guest and hotel from penalties.
2. Refunds/rebooking: Full refund excluding platform & convenience fees or rebooking offered.
3. Communication: Hotel will communicate promptly.
4. Safety is the priority.`}
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          V. Refund Process
        </Typography>

        <Typography variant="subtitle1">A. Processing Time</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Time Frame: Refunds processed within 7-10 business days from cancellation.
2. Payment Method: Refunds issued to original payment method excluding platform & convenience fees.
3. Communication: Guests receive confirmation once processed.
4. Partial Refunds: Calculated proportionately.`}
        </Typography>

        <Typography variant="subtitle1">B. Exceptions</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Special circumstances (medical/natural disasters) may get exceptions.
2. Manager approval required.
3. Documentation may be requested.
4. Each case reviewed on merit.`}
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          VI. Communication and Support
        </Typography>

        <Typography variant="subtitle1">A. Customer Service</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Contact: Phone, email or online chat.
2. Support Hours: 24/7 assistance.
3. Staff Training: Regular training on policies.
4. Feedback: Guests encouraged to share feedback.`}
        </Typography>

        <Typography variant="subtitle1">B. Communication Channels</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Booking Confirmation: Policy included in confirmation email.
2. Reminders: Sent near check-in.
3. Website: Policy available online.
4. Accessibility: Policy accessible to guests and staff.`}
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          VII. Dispute Resolution
        </Typography>

        <Typography variant="subtitle1">A. Handling Disputes</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`Steps for disputes:
1. Initial Contact: Guest contacts customer service (within 24 hours).
2. Escalation: If unresolved, escalate to manager (within 48 hours).
3. Mediation: Offer mediation within 5 business days.
4. Final Decision: Management decides within 10 business days if mediation fails.`}
        </Typography>

        <Typography variant="subtitle1">B. Documentation</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Record Keeping: All communications recorded.
2. Guest Documentation: Guests may be asked for proof.
3. Policy References: Use relevant policy documents during resolution.
4. Resolution Records: Outcomes documented for reference.`}
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          VIII. Payment Methods
        </Typography>

        <Typography variant="subtitle1">A. Accepted Methods</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`Accepted payment methods include:
• Credit/Debit Cards (Visa, MasterCard, Amex)
• Online Payment (PayPal, Apple Pay, Google Wallet)
• Bank Transfer (for group bookings)
• Cash (at hotel front desk for in-person payments)`} 
        </Typography>

        <Typography variant="subtitle1">B. Security Measures</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Encryption: Online payments secured via encryption.
2. PCI Compliance: Adhere to PCI DSS where applicable.
3. Fraud Detection: Systems to monitor suspicious transactions.
4. Secure Storage: Payment data accessible only to authorized staff.`}
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          IX. Review and Update
        </Typography>

        <Typography variant="subtitle1">A. Policy Review</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Scheduled Reviews: Annual policy review.
2. Stakeholder Feedback: Include guests, staff feedback.
3. Compliance Audit: Conduct occasional audits.
4. Benchmarking: Compare against industry best practices.`}
        </Typography>

        <Typography variant="subtitle1">B. Policy Update</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Change Management: Manage changes with training and communication.
2. Approval Process: Updates approved by senior management.
3. Documentation: Keep records of changes.
4. Communication: Notify all stakeholders.`}
        </Typography>

        <Typography variant="subtitle1">C. Implementation</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Training: Regular staff training.
2. Monitoring: Ongoing checks for compliance.
3. Support Systems: Tools and resources for staff.
4. Continuous Improvement: Update policy based on feedback.`}
        </Typography>

        <Typography variant="subtitle1">D. Communication Plan</Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {`1. Internal Communication: Meetings and emails for staff updates.
2. Guest Communication: Policy details visible on website and booking confirmations.
3. Feedback Mechanisms: Encourage suggestions and improvements.
4. Documentation and Access: Policy available online.`}
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1">Contact & Support</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            For assistance with cancellations, refunds, or disputes, contact our customer support:
          </Typography>
       
<Typography variant="body1" sx={{ mt: 1 }}>
  📞{" "}
  <Link
    href="tel:18001212560"
    underline="hover"
    color="inherit"
    sx={{ fontWeight: 500 }}
  >
    18001212560
  </Link>
  {" | "}
  📧{" "}
  <Link
    href="mailto:help@huts4u.com"
    underline="hover"
    color="inherit"
    sx={{ fontWeight: 500 }}
  >
    help@huts4u.com
  </Link>
</Typography>
        </Box>
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

export default CancellationAndRefundPolicy;
