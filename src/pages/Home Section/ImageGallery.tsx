import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Dhauli } from "../../Image/Image";
import { useNavigate } from "react-router-dom";

const OfferSection = () => {
  const navigate = useNavigate();
  return (
    <>
      {/* 🔁 RUNNING OFFER BANNER */}
      <Box
        sx={{
          width: "100%",
          background: "#4B2AAD",
          overflow: "hidden",
          py: 1,
          mt: 2,
        }}
      >
        <Box
          sx={{
            display: "inline-block",
            whiteSpace: "nowrap",
            animation: "scroll 15s linear infinite",
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: { xs: "14px", md: "16px" },
              px: 4,
            }}
          >
            🎉 Get upto <span style={{ color: "#FFD54F" }}>15% </span>discount on all bookings at <b>Huts4u</b> • Hourly & Full Day Stays • Book Now 🎉
          </Typography>
        </Box>

        <style>
          {`
            @keyframes scroll {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
          `}
        </style>
      </Box>

      {/* 🟣 DISCOUNT PROMO CARD */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 2, md: 0 },
          mt: 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0px 14px 32px rgba(0,0,0,0.25)",
            background: "#fff",
          }}
        >
          {/* LEFT IMAGE */}
          <Box
            sx={{
              width: { xs: "100%", md: "45%" },
              height: { xs: 200, md: 260 },
              backgroundImage: `url(https://image2url.com/images/1766224738544-0ec13b3e-aa37-49f4-a781-da500411b52e.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* RIGHT CONTENT */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 2.5, md: 4 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              sx={{
                color: "#4B2AAD",
                fontWeight: 900,
                fontSize: { xs: "26px", md: "36px" },
                lineHeight: 1.1,
              }}
            >
              Get upto 15% discount on all bookings at Huts4u <br />
              {/* <span style={{ color: "#FF5722" }}>15% on all bookings at Huts4u</span> */}
            </Typography>

            <Typography
              sx={{
                mt: 1,
                fontSize: "15px",
                color: "#555",
                maxWidth: 420,
              }}
            >
              On bookings at <b>Huts4u</b>. Enjoy affordable hourly and full-day
              stays with exclusive discounts.
            </Typography>

            <Button
              onClick={() => navigate('/search')}
              sx={{
                mt: 3,
                width: "fit-content",
                background: "#4B2AAD",
                color: "#fff",
                fontWeight: 600,
                px: 4,
                py: 1.2,
                borderRadius: "12px",
                textTransform: "none",
                "&:hover": {
                  background: "#3A2090",
                },
              }}
            >
              Book Now
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default OfferSection;
