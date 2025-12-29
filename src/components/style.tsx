/* eslint-disable jsx-a11y/img-redundant-alt */
import { ArrowBackIos, ArrowForwardIos, Close, ExpandLess, ExpandMore, FiberManualRecord } from "@mui/icons-material";
import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Modal,
  Radio,
  RadioProps,
  styled,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import color from "./color";
import { useState } from "react";

export const BoxStyle = {
  p: 2,
  px: 4,
  boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.18)",
  borderRadius: "12px",
  my: 4,
};

export function BpRadio(props: RadioProps) {
  return (
    <Radio
      style={{ padding: "6px" }}
      disableRipple
      color="default"
      checkedIcon={<BpCheckedIcon />}
      icon={<BpIcon />}
      {...props}
    />
  );
}

export const BpIcon = styled("span")(({ theme }) => ({
  borderRadius: "50%",
  width: 18,
  height: 18,
  boxShadow:
    "inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)",
  backgroundColor: "#f5f8fa",
  backgroundImage:
    "linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))",
  ".Mui-focusVisible &": {
    outline: "2px auto rgba(41, 91, 122, 0.6)",
    outlineOffset: 2,
  },
  "input:hover ~ &": {
    backgroundColor: "#ebf1f5",
    ...theme.applyStyles("dark", {
      backgroundColor: "#30404d",
    }),
  },
  "input:disabled ~ &": {
    boxShadow: "none",
    background: "rgba(206,217,224,.5)",
    ...theme.applyStyles("dark", {
      background: "rgba(57,75,89,.5)",
    }),
  },
  ...theme.applyStyles("dark", {
    boxShadow: "0 0 0 1px rgb(16 22 26 / 40%)",
    backgroundColor: "#394b59",
    backgroundImage:
      "linear-gradient(180deg,hsla(0,0%,100%,.05),hsla(0,0%,100%,0))",
  }),
}));

export const BpCheckedIcon = styled(BpIcon)({
  backgroundColor: color.secondColor,
  backgroundImage:
    "linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))",
  "&::before": {
    display: "block",
    width: 18,
    height: 18,
    backgroundImage: "radial-gradient(#fff,#fff 28%,transparent 32%)",
    content: '""',
  },
  "input:hover ~ &": {
    backgroundColor: color.secondColor,
  },
});

export const StyledLabel = styled(FormControlLabel)(
  ({ theme, checked }: { theme?: any; checked?: boolean }) => ({
    color: checked ? color.thirdColor : color.firstColor,
    background: checked
      ? color.firstColor
      : "transparent",
    borderRadius: " 2px 8px 8px 2px",
    display: "flex",
    alignItems: "center",
    transition: "0.3s",
    paddingLeft: checked ? "30px" : "auto",
    marginLeft: checked ? "-40px" : "-10px",
    paddingRight: "10px",
    fontSize: checked ? "1rem" : "0.95rem",
  })
);

export const CustomRadio = styled(Radio)({
  color: color.firstColor,
  "&.Mui-checked": {
    color: color.thirdColor,
  },
});

export const CustomPrevArrow = (props: any) => {
  const { onClick } = props;
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        left: "0px",
        top: "50%",
        transform: "translateY(-50%)",
        background: color.background,
        color: "white",
        zIndex: 2,
        "&:hover": { background: color.firstColor },
      }}
    >
      <ArrowBackIos />
    </IconButton>
  );
};

export const CustomNextArrow = (props: any) => {
  const { onClick } = props;
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        right: "0px",
        top: "50%",
        transform: "translateY(-50%)",
        background: color.background,
        color: "white",
        zIndex: 2,
        "&:hover": { background: color.firstColor },
      }}
    >
      <ArrowForwardIos />
    </IconButton>
  );
};

export const CustomTextField = styled(TextField)({
  marginBottom: "10px",
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      border: "none",
      borderRadius: "52px",
      boxShadow: "4px 4px 10px rgba(104, 39, 184, 0.17)",
      color: color.firstColor,
    },
    "&:hover fieldset": {
      border: "solid 1px",
    },
    "&.Mui-focused fieldset": {
      border: "solid 1px",
    },
  },
  "& .MuiInputBase-input": {
    color: color.firstColor,
  },
  "& .MuiInputLabel-root": {
    color: color.firstColor,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: color.firstColor,
  },
});

export const LoginTextField = styled(TextField)({
  marginBottom: "20px",
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      border: "solid 1px white",
      boxShadow: "-4px -4px 10px rgba(255, 255, 255, 0.36) inset",
      color: "white",
      borderRadius: "12px",
    },
    "&:hover fieldset": {
      border: "solid 1px",
    },
    "&.Mui-focused fieldset": {
      border: "solid 1px",
    },
  },
  "& .MuiInputBase-input": {
    color: "white",
  },
  "& .MuiInputLabel-root": {
    color: "white",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "white",
  },
});

export const useScreenSize = () => {
  const theme = useTheme();
  const isBelow400px = useMediaQuery(theme.breakpoints.down(400));
  return { isBelow400px };
};

export const inputSx = {
  border: "none",
  borderRadius: "52px",
  boxShadow: "4px 4px 10px rgba(104, 39, 184, 0.17)",
  color: color.firstColor,
  padding: "0px",
  marginTop: "0px",
  width: "100%",
  boxSizing: "border-box",
  "& .MuiOutlinedInput-root": {
    padding: "0px",
    borderBottom: "4px solid",
    borderColor: color.firstColor,
    "& fieldset": {
      border: "none",
    },
    "&:hover fieldset": {
      border: "none",
    },
    "&.Mui-focused fieldset": {
      border: "none",
    },
    "& .MuiInputLabel-root": {
      color: color.firstColor,
    },
  },
};


interface ImageGridProps {
  propertyImages: string[];
}

export const ImageGrid: React.FC<ImageGridProps> = ({ propertyImages }) => {
  const maxImages = Math.min(propertyImages.length, 7);
  const displayImages = propertyImages.slice(0, maxImages);
  const hasMore = propertyImages.length > 7;
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 900px)");

  return (
    <Box
      sx={{
        display: { xs: "block", md: "grid" },
        gap: { xs: 0, md: 1 },
        width: "100%",
        height: "300px",
        gridTemplateColumns:
          displayImages.length > 5 ? "40% 20% 20% 20%" : "60% 20% 20%",
        gridTemplateRows: "auto",
        "& img": {
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "8px",
        },
        position: "relative",
      }}
    >
      <Box
        onClick={() => setOpen(true)}
        sx={{
          gridColumn: { xs: "auto", md: "span 1" },
          gridRow: { xs: "auto", md: "span 2" },
          height: "300px",
          width: { xs: "100%", md: "auto" },
          display: { xs: "block", md: "grid" },
        }}
      >
        <img style={{height:'300px'}} src={displayImages[0]} alt="Main" />
      </Box>

      {!isMobile &&
        displayImages.slice(1).map((src, index) => {
          if (index % 2 === 0) {
            return (
              <Box
                onClick={() => setOpen(true)}
                key={index}
                display="grid"
                sx={{
                  gridTemplateRows: "146px 146px",
                  height: "300px",
                  gap: "8px",
                }}
              >
                <img
                  src={src}
                  alt={`Image ${index + 2}`}
                  style={{ height: "100%", width: "100%", objectFit: "cover" }}
                />

                {displayImages[index + 2] && (
                  <img
                    src={displayImages[index + 2]}
                    alt={`Image ${index + 3}`}
                    style={{
                      height: "100%",
                      width: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </Box>
            );
          }
          return null;
        })}

      {hasMore && (
        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            right: 10,
            background: color.background,
            color: "white",
            borderRadius: "8px",
            p: 1,
            textAlign: "center",
            cursor: "pointer",
            boxShadow:
              "-4px -4px 10px rgba(32, 32, 32, 0.28) inset, 0px 0px 10px rgba(32, 32, 32, 0.28)",
          }}
        >
          <Typography variant="body2">
            + {isMobile ? propertyImages.length - 1 : propertyImages.length - 7} More
          </Typography>
        </Box>
      )}

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            height: "80%",
            bgcolor: "white",
            boxShadow: 24,
            p: 2,
            overflowY: "auto",
            borderRadius: "8px",
          }}
        >
          <Typography variant="h6" textAlign="center" mb={2}>
            All Images
          </Typography>

          <Close
            onClick={() => setOpen(false)}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
            }}
          ></Close>
          <Box
            display="grid"
            gap={2}
            sx={{
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            }}
          >
            {propertyImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Image ${index + 1}`}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            ))}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};



  
export const RoomAmenities = ({
  room,
}: {
  room: { propertyName: string; amenities: string[] };
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayedAmenities = showAll
    ? room.amenities
    : room.amenities.slice(0, 6);
  const halfIndex = Math.ceil(displayedAmenities.length / 2);
  const firstColumn = displayedAmenities.slice(0, halfIndex);
  const secondColumn = displayedAmenities.slice(halfIndex);

  return (
    <>
      <Box sx={{ mt: { xs: 1, md: 0 } }}>
        <Grid container spacing={{ xs: 1, md: 0 }}>
          {[firstColumn, secondColumn].map((column, colIndex) => (
            <Grid item xs={6} md={12} key={colIndex}>
              <List disablePadding>
                {column.map((amenity, index) => {
                  const isLastItem =
                    colIndex === 1 &&
                    index === column.length - 1 &&
                    room.amenities.length > 6;

                  return (
                    <ListItem
                      key={index}
                      sx={{
                        py: 0.2,
                        px: { xs: 0, md: 2 },
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: "20px", mt: 0.5 }}>
                          <FiberManualRecord sx={{ fontSize: "8px" }} />
                        </ListItemIcon>
                        <ListItemText
                          style={{ margin: 0 }}
                          primary={amenity}
                          primaryTypographyProps={{
                            style: { fontSize: "12px" },
                          }}
                        />
                      </div>

                      {isLastItem && (
                        <>
                          <Button
                            onClick={() => setShowAll(!showAll)}
                            sx={{
                              textTransform: "none",
                              fontSize: "14px",
                              ml: "auto",
                              p: 0,
                              color: color.firstColor,
                              fontWeight: "bold",
                            }}
                          >
                            {showAll ? "Show Less" : "... Show All"}
                          </Button>
                          {showAll ? <ExpandLess /> : <ExpandMore />}
                        </>
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};

export const getRatingText = (rating: number) => {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Good";
  if (rating >= 2.5) return "Average";
  if (rating >= 1.5) return "Poor";
  return "Very Poor";
};

export const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return "#46b648";
  if (rating >= 3.5) return "#b4d137"; 
  if (rating >= 2.5) return "#fed018"; 
  if (rating >= 1.5) return "#f7921e"; 
  return "#e91d26"; 
};