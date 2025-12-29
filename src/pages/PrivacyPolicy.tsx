
import { Box, Container, Typography } from "@mui/material";
import color from "../components/color";
import { Mail } from "@mui/icons-material";
import SectionHeader from "../components/SectionHeader";

const PrivacyPolicy = () => {
  return (
    <Container
      className="privacy-policy-root"
      style={{ background: "white", padding: "16px",paddingTop:0 }}
    >
      <SectionHeader
        primaryText={"Privacy Policy"}
        subText={
          "We are committed to protecting your personal information and ensuring your privacy throughout your stay."
        }
      ></SectionHeader>


      <Box sx={{ mt: 1 }} className="privacy-policy-section">
        <Typography variant="h5" className="privacy-policy-subtitle">
          1. Introduction
        </Typography>
        <Typography variant="body1" className="privacy-policy-paragraph">
          Welcome to{" "}
          <span className="privacy-policy-highlight">Huts4U</span>
          . We are committed to protecting your privacy and ensuring that your
          personal information is handled in a safe and responsible manner.
        </Typography>
      </Box>

      <Box className="privacy-policy-section">
        <Typography variant="h5" className="privacy-policy-subtitle">
          2. Information We Collect
        </Typography>
        <Typography variant="body1" className="privacy-policy-paragraph">
          We may collect the following types of personal information when you
          visit our site, register, or use our services:
        </Typography>
        <ul>
          <li className="privacy-policy-paragraph">
            Personal Identification Information: Name, email address, mailing
            address, phone number, etc.
          </li>
          <li className="privacy-policy-paragraph">
            Non-Personal Identification Information: Browser type, Internet
            Service Provider (ISP), referring/exit pages, date/time stamp, and
            clickstream data.
          </li>
        </ul>
      </Box>

      <Box className="privacy-policy-section">
        <Typography variant="h5" className="privacy-policy-subtitle">
          3. How We Use Your Information
        </Typography>
        <Typography variant="body1" className="privacy-policy-paragraph">
          We may use the information we collect for the following purposes:
        </Typography>
        <ul>
          <li className="privacy-policy-paragraph">
            To provide, operate, and maintain our website.
          </li>
          <li className="privacy-policy-paragraph">
            To improve, personalize, and expand our site.
          </li>
          <li className="privacy-policy-paragraph">
            To communicate with you, either directly or through one of our
            partners, including for customer service, to provide updates and
            other information related to the website.
          </li>
          <li className="privacy-policy-paragraph">
            To process your transactions and send you relevant information.
          </li>
        </ul>
      </Box>

      {/* Section 4 */}
      <Box className="privacy-policy-section">
        <Typography variant="h5" className="privacy-policy-subtitle">
          4. Disclosure of Your Information
        </Typography>
        <Typography variant="body1" className="privacy-policy-paragraph">
          We do not sell or trade your personal identification information to
          third parties. We may share generic aggregated demographic information
          not linked to any personal identification information regarding
          visitors and users with our business partners, trusted affiliates, and
          advertisers for the purposes outlined above.
        </Typography>
      </Box>

      {/* Section 5 */}
      <Box className="privacy-policy-section">
        <Typography variant="h5" className="privacy-policy-subtitle">
          5. Security of Your Information
        </Typography>
        <Typography variant="body1" className="privacy-policy-paragraph">
          We use commercially acceptable means to protect your personal
          information, but remember that no method of transmission over the
          internet, or method of electronic storage, is 100% secure.
        </Typography>
      </Box>

      {/* Section 6 */}
      <Box className="privacy-policy-section">
        <Typography variant="h5" className="privacy-policy-subtitle">
          6. Third-Party Services
        </Typography>
        <Typography variant="body1" className="privacy-policy-paragraph">
          Our site may contain links to third-party websites that are not
          operated by us. We have no control over, and assume no responsibility
          for, the content, privacy policies, or practices of any third-party
          sites or services.
        </Typography>
      </Box>

      {/* Section 7 */}
      <Box className="privacy-policy-section">
        <Typography variant="h5" className="privacy-policy-subtitle">
          7. Your Rights
        </Typography>
        <Typography variant="body1" className="privacy-policy-paragraph">
          Depending on your location, you may have the following rights
          regarding your personal information:
        </Typography>
        <ul>
          <li className="privacy-policy-paragraph">
            The right to access, update, or delete the information we have on
            you.
          </li>
          <li className="privacy-policy-paragraph">
            The right to rectification.
          </li>
          <li className="privacy-policy-paragraph">The right to object.</li>
          <li className="privacy-policy-paragraph">
            The right of restriction.
          </li>
          <li className="privacy-policy-paragraph">
            The right to data portability.
          </li>
        </ul>
      </Box>

      {/* Section 8 */}
      <Box className="privacy-policy-section">
        <Typography variant="h5" className="privacy-policy-subtitle">
          8. Changes to This Privacy Policy
        </Typography>
        <Typography variant="body1" className="privacy-policy-paragraph">
          We may update our Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page.
        </Typography>
      </Box>

      {/* Section 9 */}
      <Box className="privacy-policy-section">
        <Typography variant="h5" className="privacy-policy-subtitle">
          9. Contact Us
        </Typography>
        <Typography
          variant="body1"
          className="privacy-policy-paragraph"
          sx={{ display: "flex", gap: "10px" }}
        >
          If you have any questions about this Privacy Policy, please contact us
          at:
          <a
            href="mailto:help@huts4u.com"
            style={{
              // textDecoration: "none",
              color: color.secondColor,
              display: "flex",
              alignItems: "center",
            }}
          >
         <Mail
              style={{ marginTop: "-3px", marginRight: "5px" }}
              />
            help@huts4u.com
          </a>
        </Typography>
      </Box>
    </Container>
  );
};

export default PrivacyPolicy;
