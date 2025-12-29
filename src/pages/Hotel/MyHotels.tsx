import {
  Add,
  AddCircleOutline,
  Cancel,
  CheckCircle,
  HourglassBottomRounded,
  Whatshot,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import color from "../../components/color";
import CustomButton from "../../components/CustomButton";
import { amenityIcons } from "../../components/data";
import { getUserId, getUserRole } from "../../services/axiosClient";
import {
  getMyAllHotelswithBelongsTo
} from "../../services/services";



const MyHotels = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [pendinghotel, setPendingHotel] = useState<any[]>([]);
  const [rejecthotel, setRejectHotel] = useState<any[]>([]);
  const [aprovedhotel, setAprovedHotel] = useState<any[]>([]);
  // const [count, setCount] = useState<any>("");
  useEffect(() => {
    if (getUserRole() === "Hotel") {


      getMyAllHotelswithBelongsTo({
        userId: getUserId(),
        // status: 'Aproved',
        secondTable: "Room",
      }).then((res) => {
        const data = res?.data?.data;
        if (data) {
          const pendingHotels = data.filter(
            (hotel: any) => hotel.status === "Pending"
          );
          const approvedHotels = data.filter(
            (hotel: any) => hotel.status === "Approved"
          );
          const rejectedHotels = data.filter(
            (hotel: any) => hotel.status === "Reject"
          );
          setPendingHotel(pendingHotels);
          setAprovedHotel(approvedHotels);
          setRejectHotel(rejectedHotels);

          // console.log('Pending:', pendingHotels);
          // console.log('Approved:', approvedHotels);
          // console.log('Rejected:', rejectedHotels);
        }
      });
    } else {
      getMyAllHotelswithBelongsTo({
        secondTable: "Room",
      }).then((res) => {
        const data = res?.data?.data;
        if (data) {
          const pendingHotels = data.filter(
            (hotel: any) => hotel.status === "Pending"
          );
          const approvedHotels = data.filter(
            (hotel: any) => hotel.status === "Approved"
          );
          const rejectedHotels = data.filter(
            (hotel: any) => hotel.status === "Reject"
          );
          setPendingHotel(pendingHotels);
          setAprovedHotel(approvedHotels);
          setRejectHotel(rejectedHotels);


        }
      });
    }
  }, []);

  const renderUrl = () => {
    switch (location.pathname) {
      case "/hotel-applications":
        return "application";
      case "/my-hotels":
        return "hotel";
      default:
        return "";
    }
  };



  const displayHotels =
    renderUrl() === "application"
      ? [...aprovedhotel, ...pendinghotel, ...rejecthotel]
      : aprovedhotel;

  console.log(displayHotels)
  const displayHotelsLength =
    renderUrl() === "application"
      ? [...aprovedhotel, ...pendinghotel, ...rejecthotel].length
      : aprovedhotel.length;
  // console.log(displayHotels);
  return (
    <Box
      sx={{
        background: color.thirdColor,
        px: { xs: 2, md: 4 },
        py: 4,
      }}
    >
      <Grid container spacing={2} mt={-3}>
        <Grid
          item
          xs={12}
          md={12}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          mb={1}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "16px", md: "20px" },
            }}
          >
            {displayHotelsLength}{" "}
            {renderUrl() === "hotel" ? "Properties" : "Applications"}
          </Typography>

          <CustomButton
            customStyles={{
              fontSize: "14px",
            }}
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              navigate("/property-registration");
            }}
          >
            Add Hotel
          </CustomButton>
        </Grid>

        <Grid item xs={12} md={12}>
          {displayHotels.map((hotel) => {
            const maxAmenities = isMobile ? 2 : 5;
            const visibleAmenities = hotel?.rooms[0]?.amenities?.slice(
              0,
              maxAmenities
            );
            const remainingAmenities =
              hotel?.rooms[0]?.amenities?.length - maxAmenities;
            return (
              <Card
                onClick={() => {
                  renderUrl() === "hotel"
                    ? navigate(`/hotel-details/${hotel.id}`)
                    : navigate(`/hotel-application/${hotel.id}`);
                }}
                key={hotel.id}
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  pb: { xs: 2, md: 0 },
                  mb: 2,
                  background: color.thirdColor,
                  boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.12)",
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  border: "solid 1px transparent",
                  height: {
                    xs: "fit-content",
                    md: renderUrl() === "hotel" ? 180 : 200,
                  },
                  "&:hover": {
                    transform: "scale(1.02)",
                    borderColor: color.firstColor,
                  },
                }}
              >
                <CardMedia
                  component="img"
                  sx={{ width: { xs: "100%", md: 280 }, height: "100%" }}
                  image={hotel?.propertyImages[0]}
                  alt={hotel.propertyName}
                />
                <CardContent
                  style={{
                    padding: "0px 10px",
                    position: "relative",
                    width: "100%",
                    minHeight: "185px",
                  }}
                >
                  {renderUrl() === "hotel" ? (
                    <Box
                      sx={{
                        position: "absolute",
                        top: { xs: 10, md: 10 },
                        right: { xs: 30, md: 10 },
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={color.firstColor}
                        lineHeight={1}
                        sx={{
                          fontSize: { xs: "12px", md: "14px" },
                        }}
                      >
                        Excellent <br />{" "}
                        <span style={{ fontSize: "10px" }}>
                          ({hotel.reviews} reviews)
                        </span>
                      </Typography>

                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={color.thirdColor}
                        sx={{
                          background: color.background,
                          px: 1,
                          borderRadius: "4px",
                          fontSize: { xs: "14px", md: "18px" },
                        }}
                      >
                        {hotel?.ratings?.rating}
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        position: "absolute",
                        top: { xs: 5, md: 0 },
                        right: { xs: 25, md: 0 },
                        background:
                          hotel?.status === "Approved"
                            ? "Green"
                            : hotel?.status === "Pending"
                              ? "Yellow"
                              : "Red",
                        color: "white",
                        px: 2,
                        borderRadius: { xs: "4px", md: "0 4px 0 4px" },
                        py: 0.5,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                      }}
                    >
                      {hotel?.status}{" "}
                      {hotel?.status === "Approved" ? (
                        <CheckCircle
                          sx={{
                            fontSize: "18px",
                          }}
                        />
                      ) : hotel?.status === "Pending" ? (
                        <HourglassBottomRounded
                          sx={{
                            fontSize: "18px",
                          }}
                        />
                      ) : (
                        <Cancel
                          sx={{
                            fontSize: "18px",
                          }}
                        />
                      )}
                    </Box>
                  )}
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: color.thirdColor,
                      width: "fit-content",
                      px: 1,
                      py: 0.2,
                      borderRadius: "4px",
                      fontSize: "8px",
                      my: 1,
                      mt: { xs: 1.6, md: 1.5 },
                      background: color.background,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Whatshot
                      style={{ fontSize: "10px", marginRight: "2px" }}
                    />{" "}
                    HUTS4U PREMIUM
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: color.firstColor,
                      mt: { xs: 1.5, md: 1 },
                      display: "-webkit-box",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {hotel?.propertyName}
                  </Typography>
                  <Typography
                    color="textSecondary"
                    sx={{
                      fontFamily: "CustomFontSB",
                      fontSize: { xs: "12px", md: "14px" },
                      display: "-webkit-box",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {hotel?.address}
                  </Typography>

                  <Box
                    sx={{
                      display: { xs: "none", md: "flex" },
                      gap: 2,
                      mt: 1.5,
                    }}
                  >
                    <Typography
                      color="textSecondary"
                      sx={{
                        fontFamily: "CustomFontSB",
                        fontSize: "12px",
                        border: "solid 1px",
                        width: "fit-content",
                        px: 1,
                        borderRadius: "4px",
                      }}
                    >
                      {renderUrl() === "hotel"
                        ? "Couple Friendly"
                        : `Reception Mobile: ${hotel?.receptionMobile}`}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      sx={{
                        fontFamily: "CustomFontSB",
                        fontSize: "12px",
                        border: "solid 1px",
                        width: "fit-content",
                        px: 1,
                        borderRadius: "4px",
                      }}
                    >
                      {renderUrl() === "hotel"
                        ? "Pet Friendly"
                        : `Reception Email:${hotel?.receptionEmail} `}
                    </Typography>
                  </Box>

                  {renderUrl() === "hotel" &&
                    hotel?.rooms[0]?.amenities?.length ? (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        flexWrap: "wrap",
                        mt: 2,
                        maxWidth: { xs: "50%", md: "80%" },
                      }}
                    >
                      {visibleAmenities.map((amenity: any, index: any) => (
                        <Chip
                          key={index}
                          label={amenity}
                          icon={amenityIcons[amenity] || <AddCircleOutline />}
                          size="small"
                          sx={{ bgcolor: "transparent", fontSize: "10px" }}
                        />
                      ))}

                      {/* {remainingAmenities > 0 && (
                        <Chip
                          label={`+${remainingAmenities} more`}
                          size="small"
                          sx={{ bgcolor: "#eee", fontSize: "10px" }}
                        />
                      )} */}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 2,
                        maxWidth: "70%",
                        mt: 2,
                      }}
                    >
                      <Typography
                        fontWeight={"bold"}
                        fontSize={"14px"}
                        sx={{
                          background: color.background,
                          color: "white",
                          borderRadius: "4px",
                          px: 1,
                          width: "fit-content",
                        }}
                      >
                        Property Type: {hotel.propertyType}
                      </Typography>
                      <Typography
                        fontWeight={"bold"}
                        fontSize={"14px"}
                        sx={{
                          background: color.background,
                          color: "white",
                          borderRadius: "4px",
                          px: 1,
                          width: "fit-content",
                        }}
                      >
                        Stay type: {hotel?.rooms[0]?.stayType}
                      </Typography>

                      <Typography
                        fontWeight={"bold"}
                        fontSize={"14px"}
                        sx={{
                          background: color.background,
                          color: "white",
                          borderRadius: "4px",
                          px: 1,
                          width: "fit-content",
                        }}
                      >
                        Gst No: {hotel.gstNo}
                      </Typography>

                      <Typography
                        fontWeight={"bold"}
                        fontSize={"14px"}
                        sx={{
                          background: color.background,
                          color: "white",
                          borderRadius: "4px",
                          px: 1,
                          width: "fit-content",
                        }}
                      >
                        PAN No: {hotel.panNo}
                      </Typography>

                      <Typography
                        fontWeight={"bold"}
                        fontSize={"14px"}
                        sx={{
                          background: color.background,
                          color: "white",
                          borderRadius: "4px",
                          px: 1,
                          width: "fit-content",
                        }}
                      >
                        Applied on :{new Date(hotel.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}

                  {/* <Box
                    sx={{
                      position: { xs: "absolute", md: "absolute" },
                      maxWidth: "200px",
                      minWidth: "120px",
                      mr: { xs: 3, md: 0 },
                      bottom: { xs: -16, md: 0 },
                      right: { xs: -8, md: 0 },
                      borderRadius: "12px 0px 12px 0px",
                      p: 1,
                      background: color.background,
                      color: color.thirdColor,
                      textAlign: "end",
                      border: "solid 1px",
                      borderColor: color.firstColor,
                      pt: 4,
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        borderRadius: "12px 0px 12px 0px",
                        p: 1,
                        background: color.thirdColor,
                        color: color.firstColor,
                        fontSize: "8px",
                        fontWeight: 600,
                      }}
                    >
                      Limited Time Offer
                    </Box>

                    {
                      hotel.rooms[0].stayType === 'Overnight' ? (<>
                        <Typography
                          sx={{
                            textDecoration: "line-through",
                            fontSize: { xs: "10px", md: "12px" },
                          }}
                        >
                          ₹{hotel?.rooms[0]?.rateFor1Night}
                        </Typography>
                        <Typography sx={{ fontSize: "18px" }}>
                          ₹{hotel?.rooms[0]?.rateFor1Night}
                        </Typography>
                      </>) : (<>

                        <Typography
                          sx={{
                            textDecoration: "line-through",
                            fontSize: { xs: "10px", md: "12px" },
                          }}
                        >
                          ₹{hotel?.rooms[0]?.rateFor3Hour}
                        </Typography>
                        <Typography sx={{ fontSize: "18px" }}>
                          ₹{hotel?.rooms[0]?.rateFor3Hour}
                        </Typography>
                      </>)
                    }


                    <Typography
                      sx={{ fontSize: { xs: "10px", md: "12px" } }}
                      variant="body2"
                    >
                      + ₹{hotel?.rooms[0]?.taxRate} taxes & fees
                    </Typography>
                  </Box> */}
                </CardContent>
              </Card>
            );
          })}
        </Grid>
      </Grid>
    </Box>
  );
};

export default MyHotels;
