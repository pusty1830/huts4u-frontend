import { Box, Typography } from "@mui/material";
import React, { Suspense, lazy } from "react";
import color from "../../components/color";
import { useScreenSize } from "../../components/style";
import { bgHero,konarkHero } from "../../Image/Image";
const SearchSection = lazy(() => import("./SearchSection"));

const HeroSection: React.FC = () => {
  const { isBelow400px } = useScreenSize();

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxHeight: { xs: "100vh", md: "700px" },
        background: `url('${bgHero}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          background: color.thirdColor,
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          opacity: { xs: 0, md: 0.84 },
        }}
      ></Box>

      <div
        style={{
          flex: 1,
          minWidth: "50vw",
          color: color.firstColor,
          zIndex: 2,
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: isBelow400px ? "5%" : { xs: "10%", md: "14%" },
            left: "10%",
          }}
        >
          <Typography
            sx={{
              background: color.firstColor,
              color: color.thirdColor,
              p: 1,
              py: 0.5,
              width: "fit-content",
              mb: 2,
              fontSize: isBelow400px ? "14px" : { xs: "16px", md: "24px" },
              borderRadius: "4px",
            }}
          >
            Quick Stays Great Rates
          </Typography>
          <Typography
            sx={{
              lineHeight: 1.2,
              fontSize: isBelow400px ? "24px" : { xs: "32px", md: "48px" },
              fontFamily: "CustomFontB",
            }}
          >
            Stay a while feel <br /> alive
          </Typography>
        </Box>
      </div>

      <Box
        sx={{
          display: { xs: "none", md: "block" },
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

     <Box
  sx={{
    width: { xs: "90%", md: "80%" },
    position: "absolute",
    bottom: isBelow400px ? "4%" : "12%",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 3,
  }}
>
  <Suspense
    fallback={
      <Box
        sx={{
          height: 120,
          background: "rgba(255,255,255,0.6)",
          borderRadius: "12px",
        }}
      />
    }
  >
    <SearchSection />
  </Suspense>
</Box>

    </Box>
  );
};

export default HeroSection;