import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Grid,
    Typography
} from "@mui/material";
import React, { useState } from "react";
import color from "../../components/color";

const faqData = [
  {
    category: "General",
    questions: [
      {
        question: "How do I book a hotel room?",
        answer:
          "You can book a hotel room by searching for available hotels and selecting your preferred dates.",
      },
      {
        question: "Can I cancel my booking?",
        answer:
          "Yes, you can cancel your booking through the 'My Bookings' section, but cancellation policies may apply.",
      },
      {
        question: "What payment methods are accepted?",
        answer:
          "We accept credit cards, and other online payment methods.",
      },
      {
        question: "How do I change my account email address?",
        answer: "You can change your email by going to your account settings.",
      },
    ],
  },
  {
    category: "Billing & Support",
    questions: [
      {
        question: "How does billing work?",
        answer:
          "Billing is processed upon confirmation of your booking. You will receive an email receipt.",
      },
      {
        question: "Can I get a refund?",
        answer:
          "Refund policies depend on the hotel's cancellation policy. Please check the booking details.",
      },
      {
        question: "Can I request an invoice?",
        answer:
          "Yes, invoices can be requested through the billing section in your account.",
      },
      {
        question: "How do I contact support?",
        answer:
          "You can contact our support team through the help section in the app or via email.",
      },
    ],
  },
];

const FAQSection = () => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Box sx={{ maxWidth: 1200, margin: "auto", padding: 3, pb: 2, pt: 1 }}>
      <Grid container spacing={3}>
        {faqData.map((section, index) => (
          <Grid item xs={12} sm={6} key={index}>
            {section.questions.map((faq, idx) => (
              <Accordion
                key={idx}
                expanded={expanded === `${index}-${idx}`}
                onChange={handleChange(`${index}-${idx}`)}
                sx={{
                  boxShadow: "none",
                  background: color.thirdColor,
                  mb: 1,
                  border: "1.5px solid",
                  borderColor: color.secondColor,
                }}
                style={{
                  borderRadius: "6px",
                  // border: "none",
                  boxShadow: "none",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography
                    sx={{
                      fontFamily: "CustomFontB",
                      color: color.secondColor,
                      py: 0.5,
                    }}
                  >
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
        ))}
      </Grid>
      {/* <Box sx={{ mt: 2, fontSize: 14 }}>
        <Typography>
          Need more help? Visit our <Link href="#">support page</Link>.
        </Typography>
      </Box> */}
    </Box>
  );
};

export default FAQSection;
