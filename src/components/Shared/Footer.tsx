// src/components/Footer.tsx
import React from "react";
import {
  Email,
  Facebook,
  Instagram,
  LocationOn,
  Phone,
  Send,
} from "@mui/icons-material";
import {
  Box,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Link as MuiLink,
  Button,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import color from "../color";
import { FooterImage } from "../../Image/Image";
import HotelIcon from '@mui/icons-material/Hotel';

const Footer: React.FC = () => {
  const location = useLocation();

  const renderColor = () => {
    switch (location.pathname) {
      case "/search":
        return color.thirdColor;
      default:
        return "white";
    }
  };

  return (
    <Box sx={{ background: renderColor(), pt: { xs: 3, md: 4 } }}>
      {/* ================= DISCOUNT BANNER ================= */}
      {location.pathname === "/search" && (
        <Box
          sx={{
            background: "linear-gradient(90deg, #ffb347, #ffcc33)",
            color: "#000",
            py: 2,
            px: 2,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            textAlign: "center",
          }}
        >
          <Typography fontWeight={700} fontSize={{ xs: 13, md: 16 }}>
            🎉 Get upto  <strong> 15% discount </strong> on all bookings at Huts4u
          </Typography>

          <Button
            variant="contained"
            size="small"
            sx={{
              backgroundColor: color.firstColor,
              color: "white",
              fontWeight: 600,
              px: 2.5,
              "&:hover": { backgroundColor: "#4a2f63" },
            }}
          >
            Discount Applied Automatically
          </Button>
        </Box>
      )}

      {/* ================= FOOTER ================= */}
      <Box
        sx={{
          backgroundColor: color.firstColor,
          color: "white",
          position: "relative",
          pt: { xs: 4, md: 6 },
        }}
      >
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          px={{ xs: 2, md: 4 }}
          sx={{
            fontFamily: "CustomFontM",
            backgroundImage: { xs: "none", md: `url('${FooterImage}')` },
            backgroundRepeat: "no-repeat",
            backgroundSize: "30%",
            backgroundPosition: "bottom left",
          }}
        >
          {/* ================= ABOUT ================= */}
          <Grid item xs={12} md={4.5}>
            <Typography mb={1.5} variant="h6" fontWeight="bold">
              About
            </Typography>

            <Typography fontSize={13} sx={{ opacity: 0.85 }}>
              Huts4u is a next-generation OTA platform offering flexible hotel
              bookings with hourly and full-day stay options.
            </Typography>

            <TextField
              placeholder="Email Address"
              fullWidth
              size="small"
              sx={{
                mt: 2,
                backgroundColor: "#ddd",
                borderRadius: 1,
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton sx={{ color: "#5c3b78" }}>
                      <Send />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <IconButton
                component="a"
                href="https://www.facebook.com/share/1ABjmZHZzV/"
                target="_blank"
                sx={{
                  color: "white",
                  backgroundColor: "#5c3b78",
                  "&:hover": { backgroundColor: "#4a2f63" },
                }}
              >
                <Facebook />
              </IconButton>

              <IconButton
                component="a"
                href="https://www.instagram.com/huts4u"
                target="_blank"
                sx={{
                  color: "white",
                  backgroundColor: "#5c3b78",
                  "&:hover": { backgroundColor: "#4a2f63" },
                }}
              >
                <Instagram />
              </IconButton>
            </Box>
          </Grid>

          {/* ================= LINKS ================= */}
          <Grid item xs={12} md={3}>
            <Typography mb={1.5} variant="h6" fontWeight="bold">
              Links
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {[
                { label: "Privacy Policy", path: "/privacy-policy" },
                { label: "Terms & Conditions", path: "/terms" },
                { label: "Cancellation & Refund Policy", path: "/cancellation" },
                { label: "Shipping & Delivery Policy", path: "/shipping" },
              ].map((link) => (
                <MuiLink
                  key={link.path}
                  component={RouterLink}
                  to={link.path}
                  color="inherit"
                  sx={{
                    py: 1,
                    fontSize: 14,
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Box>
          </Grid>

          {/* ================= CONTACT ================= */}
          <Grid item xs={12} md={4.5}>
            <Typography mb={1.5} variant="h6" fontWeight="bold">
              Contact
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <LocationOn />
                <Typography fontSize={13}>
                  Ground Floor, Plot No. 370/10537, New Pokhran Village, Chandrasekharpur, Bhubaneswar, Odisha – 751016, India
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Phone />
                <MuiLink href="tel:18001212560" color="inherit">
                  18001212560
                </MuiLink>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Email />
                <MuiLink href="mailto:help@huts4u.com" color="inherit">
                  help@huts4u.com
                </MuiLink>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <HotelIcon/>
                <MuiLink href="https://hotel.huts4u.com/signup" color="inherit">
                  Join As a Hotel
                </MuiLink>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ================= COPYRIGHT ================= */}
        <Box
          sx={{
            mt: 4,
            mb:2,
            background: color.thirdColor,
            textAlign: "center",
            color: color.firstColor,
            py: 1,
            fontSize: 13,
            fontFamily: "CustomFontB",
          }}
        >
          © {new Date().getFullYear()} HUTS4U. All Rights Reserved.
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
