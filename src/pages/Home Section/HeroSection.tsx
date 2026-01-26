import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import color from "../../components/color";
import { useScreenSize } from "../../components/style";
import { bgHero, konarkHero } from "../../Image/Image";
import SearchSection from "./SearchSection";

const HeroSection: React.FC = () => {
  const { isBelow400px } = useScreenSize();

  return (
    <Box
      sx={{
        height: { xs: "calc(100vh - 64px)", sm: "calc(100vh - 70px)", md: "calc(100vh - 80px)" },
        maxHeight: { xs: "100vh", sm: "600px", md: "700px" },
        background: `url('${bgHero}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
      }}
    >
      {/* Overlay */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          background: color.thirdColor,
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          opacity: { xs: 0.3, sm: 0.4, md: 0.84 },
        }}
      ></Box>

      {/* Left Content Section */}
      <Box
        sx={{
          flex: 1,
          minWidth: { xs: "100vw", sm: "60vw", md: "50vw" },
          color: color.firstColor,
          zIndex: 2,
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: isBelow400px ? "5%" : { xs: "8%", sm: "10%", md: "14%" },
            left: { xs: "5%", sm: "8%", md: "10%" },
            right: { xs: "5%", sm: "auto" },
          }}
        >
          <Typography
            sx={{
              background: color.firstColor,
              color: color.thirdColor,
              p: { xs: 0.75, sm: 1 },
              py: { xs: 0.25, sm: 0.5 },
              width: "fit-content",
              mb: { xs: 1.5, sm: 2 },
              fontSize: isBelow400px ? "12px" : { xs: "14px", sm: "18px", md: "24px" },
              borderRadius: "4px",
            }}
          >
            Quick Stays Great Rates
          </Typography>
          <Typography
            sx={{
              lineHeight: 1.2,
              fontSize: isBelow400px ? "20px" : { xs: "24px", sm: "32px", md: "48px" },
              fontFamily: "CustomFontB",
            }}
          >
            Stay a while feel <br /> alive
          </Typography>
        </Box>
      </Box>

      {/* Right Image Section */}
      <Box
        sx={{
          display: { xs: "none", sm: "block" },
          flex: 1,
          height: "100%",
          background: `url('${konarkHero}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 2,
          position: "relative",
          backgroundRepeat: "no-repeat",
        }}
      ></Box>

      {/* Search Section */}
      <Box
        sx={{
          width: { xs: "95%", sm: "90%", md: "80%" },
          position: "absolute",
          bottom: isBelow400px ? "4%" : { xs: "6%", sm: "8%", md: "12%" },
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 3,
        }}
      >
        <SearchSection />
      </Box>
    </Box>
  );
};

export default HeroSection;