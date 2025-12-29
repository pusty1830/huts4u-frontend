import { Box, Grid, styled, Typography } from "@mui/material";
import color from "../../components/color";
import { feature1, feature2, feature3, feature4 } from "../../Image/Image";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import dayjs from "dayjs";

type HoveredItemType = 
  | "personalized" 
  | "couples" 
  | "budget-premium-luxury" 
  | "secure-booking" 
  | null;

const ImageGridLayout = () => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<HoveredItemType>(null);

 const handleSearchClick = () => {
  const searchData = {
    bookingType: "fullDay", // ✅ full day
    location: "Bhubaneswar, Odisha, India",
    rooms: 1,
    adults: 2,
    children: 0,
    nights: 1,
    checkinDate: dayjs().format("YYYY-MM-DD"),
    minBudget: 100,
    maxBudget: 20000,
    sortBy: "all",
    page: 1,
  };

  const queryString = Object.entries(searchData)
    .filter(([_, value]) => value !== "" && value !== null && value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");

  console.log("Navigating to search with params:", queryString);
  navigate(`/search?${queryString}`);
};

  return (
    <Box sx={{ height: "600px", mt: 4 }}>
      <Grid container sx={{ width: "100%", height: "100%" }}>
        {/* Personalized Experience Section */}
        <Grid item xs={12} md={8}>
          <Grid container sx={{ width: "100%", height: "100%" }}>
            <Grid item xs={6}>
              <ClickableImageBox
                onMouseEnter={() => setHoveredItem("personalized")}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={handleSearchClick}
                sx={{
                  position: "relative",
                  height: "100%",
                  background: `url('${feature1}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  cursor: "pointer",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  transform: hoveredItem === "personalized" ? "scale(1.02)" : "scale(1)",
                  boxShadow: hoveredItem === "personalized" ? "0 10px 30px rgba(0,0,0,0.3)" : "none",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.3)",
                    transition: "background 0.3s ease",
                    zIndex: 1,
                  },
                  "&:hover::before": {
                    background: "rgba(0,0,0,0.2)",
                  }
                }}
              >
                <OverlayBox />
                <StyledTypography>
                  <span>Personalized</span>
                  <br /> Experience
                  {hoveredItem === "personalized" && (
                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.9)",
                        fontWeight: 400,
                        mt: 1,
                        animation: "fadeIn 0.3s ease"
                      }}
                    >
                      Click to explore hotels
                    </Typography>
                  )}
                </StyledTypography>
              </ClickableImageBox>
            </Grid>
            
            {/* Couples Friendly Section */}
            <Grid item xs={6}>
              <ClickableImageBox
                onMouseEnter={() => setHoveredItem("couples")}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={handleSearchClick}
                sx={{
                  position: "relative",
                  height: "100%",
                  background: `url('${feature2}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  cursor: "pointer",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  transform: hoveredItem === "couples" ? "scale(1.02)" : "scale(1)",
                  boxShadow: hoveredItem === "couples" ? "0 10px 30px rgba(0,0,0,0.3)" : "none",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.3)",
                    transition: "background 0.3s ease",
                    zIndex: 1,
                  },
                  "&:hover::before": {
                    background: "rgba(0,0,0,0.2)",
                  }
                }}
              >
                <OverlayBox />
                <StyledTypography>
                  <span>Couples</span>
                  <br /> Friendly
                  {hoveredItem === "couples" && (
                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.9)",
                        fontWeight: 400,
                        mt: 1,
                        animation: "fadeIn 0.3s ease"
                      }}
                    >
                      Click to explore hotels
                    </Typography>
                  )}
                </StyledTypography>
              </ClickableImageBox>
            </Grid>
            
            {/* Budget, Premium & Luxury Properties Section */}
            <Grid item xs={12}>
              <ClickableImageBox
                onMouseEnter={() => setHoveredItem("budget-premium-luxury")}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={handleSearchClick}
                sx={{
                  position: "relative",
                  height: "100%",
                  background: `url('${feature3}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                  cursor: "pointer",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  transform: hoveredItem === "budget-premium-luxury" ? "scale(1.02)" : "scale(1)",
                  boxShadow: hoveredItem === "budget-premium-luxury" ? "0 10px 30px rgba(0,0,0,0.3)" : "none",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.3)",
                    transition: "background 0.3s ease",
                    zIndex: 1,
                  },
                  "&:hover::before": {
                    background: "rgba(0,0,0,0.2)",
                  }
                }}
              >
                <OverlayBox />
                <StyledTypography>
                  <span>Budget, premium and luxury</span>
                  <br /> Properties
                  {hoveredItem === "budget-premium-luxury" && (
                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.9)",
                        fontWeight: 400,
                        mt: 1,
                        animation: "fadeIn 0.3s ease"
                      }}
                    >
                      Click to explore hotels
                    </Typography>
                  )}
                </StyledTypography>
              </ClickableImageBox>
            </Grid>
          </Grid>
        </Grid>

        {/* Fast & Secure Booking Section */}
        <Grid item xs={12} md={4}>
          <ClickableImageBox
            onMouseEnter={() => setHoveredItem("secure-booking")}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={handleSearchClick}
            sx={{
              position: "relative",
              height: "100%",
              background: `url('${feature4}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              cursor: "pointer",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              transform: hoveredItem === "secure-booking" ? "scale(1.02)" : "scale(1)",
              boxShadow: hoveredItem === "secure-booking" ? "0 10px 30px rgba(0,0,0,0.3)" : "none",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.3)",
                transition: "background 0.3s ease",
                zIndex: 1,
              },
              "&:hover::before": {
                background: "rgba(0,0,0,0.2)",
              }
            }}
          >
            <StyledTypography style={{ top: 26, bottom: "auto" }}>
              <span>Fast & Secure Booking</span>
              <br /> Guarantee
              {hoveredItem === "secure-booking" && (
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 400,
                    mt: 1,
                    animation: "fadeIn 0.3s ease"
                  }}
                >
                  Click to explore hotels
                </Typography>
              )}
            </StyledTypography>
          </ClickableImageBox>
        </Grid>
      </Grid>
    </Box>
  );
};

// Reusable components
const ClickableImageBox = styled(Box)({
  position: "relative",
  height: "100%",
});

const OverlayBox = styled(Box)({
  zIndex: 1,
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "linear-gradient(to top, rgba(0, 0, 0, 0.47), rgba(0, 0, 0, 0))",
});

const StyledTypography = styled(Typography)(({ theme }) => ({
  width: "100%",
  position: "absolute",
  bottom: 26,
  left: "50%",
  transform: "translateX(-50%)",
  color: color.thirdColor,
  textAlign: "center",
  lineHeight: 1.2,
  zIndex: 2,
  transition: "transform 0.3s ease",

  "& span": {
    fontWeight: 600,
    fontSize: { xs: "20px", md: "22px" },
  },

  "&:hover": {
    transform: "translateX(-50%) translateY(-5px)",
  },

  // Animation for the subtitle
  "@keyframes fadeIn": {
    from: { opacity: 0, transform: "translateY(10px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
}));

export default ImageGridLayout;