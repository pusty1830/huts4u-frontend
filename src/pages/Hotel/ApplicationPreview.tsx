import { Cancel, CheckCircle } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import color from "../../components/color";
import CustomButton from "../../components/CustomButton";
import { CustomTextField } from "../../components/style";
import { editHotel, getMyAllHotelswithBelongsTo } from "../../services/services";
import { useNavigate, useParams } from "react-router-dom";
import { getUserRole } from "../../services/axiosClient";
import { toast } from "react-toastify";

const commonStyles = {
  label: { fontWeight: "bold", color: "#333" },
  value: { color: "#555" },
};

const EXCLUDED_KEYS = [
  "id",
  "hotelId",
  "createdAt",
  "updatedAt",
  "deleted",
  "userId",
];

// Helper function to render values properly
const renderValue = (value: any) => {
  if (value === null || value === undefined) {
    return "N/A";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "N/A";
  }
  return value.toString();
};

// Function to check if URL is valid and displayable
const isValidImageUrl = (url: any) => {
  if (!url || typeof url !== "string") return false;
  // Check if it's a base64 string or a URL
  return url.startsWith('http') || url.startsWith('data:image') || url.startsWith('/') || url.includes('image');
};

// Function to check if a key contains image-related terms
const isImageKey = (key: string) => {
  const imageKeywords = ['image', 'Image', 'img', 'Img', 'picture', 'Picture', 'photo', 'Photo', 'certificate', 'Certificate'];
  return imageKeywords.some(keyword => key.toLowerCase().includes(keyword.toLowerCase()));
};

const ApplicationPreview = () => {
  const [remark, setRemark] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { id } = useParams();
  const [hotelData1, setHotelData1] = useState<any>({});
  const [roomData, setRoomData] = useState<any>([]);

  useEffect(() => {
    getMyAllHotelswithBelongsTo({
      id: id,
      secondTable: "Room",
    })
      .then((res) => {
        const hotel = res?.data?.data?.[0] || {};
        const filteredHotelData = Object.fromEntries(
          Object.entries(hotel).filter(
            ([key]) => !EXCLUDED_KEYS.includes(key)
          )
        );

        // Process rooms to filter excluded keys and handle pricing logic
        const filteredRoomData = Array.isArray(hotel?.rooms)
          ? hotel.rooms.map((room: any) => {
              const filteredRoom = Object.fromEntries(
                Object.entries(room).filter(([key]) => !EXCLUDED_KEYS.includes(key))
              );
              
              // Filter pricing based on room type
              const finalRoom: any = {};
              
              Object.entries(filteredRoom).forEach(([key, value]) => {
                // Handle pricing fields
                if (key === 'pricePerHour' && filteredRoom.roomFor === 'Overnight') {
                  // Skip hourly price for overnight rooms
                  return;
                }
                if (key === 'pricePerNight' && filteredRoom.roomFor === 'Hourly') {
                  // Skip nightly price for hourly rooms
                  return;
                }
                finalRoom[key] = value;
              });
              
              return finalRoom;
            })
          : [];

        setHotelData1({ ...filteredHotelData, rooms: filteredRoomData });
      })
      .catch((err) => console.log(err));
  }, [id]);

  const handleSubmit = () => {
    console.log("Submitting application with remark:", remark);
  };

  const handleActionClick = (type: "approve" | "reject") => {
    if (type === "reject" && !remark.trim()) {
      alert("Remark is required for rejection.");
      return;
    }
    setActionType(type);
    setOpenDialog(true);
  };

  const navigate = useNavigate();

  const handleConfirmAction = () => {
    if (!actionType) return;

    const payLoad = {
      status: actionType === "approve" ? "Approved" : "Reject",
      ...(actionType === "reject" && { remarks: remark.trim() })
    };

    editHotel(id, payLoad)
      .then((res) => {
        toast.success(`Application ${actionType === "approve" ? "Approved" : "Rejected"} successfully`);
        setOpenDialog(false);
        navigate(-1);
      })
      .catch((err) => {
        toast.error(`Error while ${actionType === "approve" ? "approving" : "rejecting"} application`);
      });
  };

  // Function to render image fields
  const renderImageField = (key: string, value: any) => {
    if (isImageKey(key) && isValidImageUrl(value)) {
      return (
        <Box mt={1}>
          <img
            src={value as string}
            alt={key}
            width={150}
            height={120}
            style={{ 
              borderRadius: 8,
              objectFit: 'contain',
              border: '1px solid #ddd'
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        m: 3,
        borderRadius: "12px",
        backgroundColor: color.thirdColor,
        boxShadow: "0px 0px 14px rgba(0, 0, 0, 0.14)",
      }}
    >
      <Typography variant="h5" gutterBottom fontWeight={"bold"}>
        Property Application Preview
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {/* Render Hotel Data */}
        {Object.entries(hotelData1).map(
          ([key, value]) =>
            key !== "rooms" && (
              <Grid
                item
                xs={12}
                md={
                  key === "propertyImages" || (Array.isArray(value) && value.every(isValidImageUrl))
                    ? 12
                    : isImageKey(key)
                      ? 4
                      : 4
                }
                key={key}
              >
                <Typography sx={commonStyles.label}>
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .trim()
                    .replace(/^./, (str) => str.toUpperCase())}
                  :
                </Typography>

                {Array.isArray(value) ? (
                  // Handle arrays (like propertyImages)
                  value.every(isValidImageUrl) ? (
                    // If all items are images, display as image gallery
                    <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                      {value.map((img, index) =>
                        isValidImageUrl(img) ? (
                          <img
                            key={index}
                            src={img}
                            alt={`${key} ${index + 1}`}
                            width={100}
                            height={100}
                            style={{ 
                              borderRadius: 8, 
                              objectFit: 'cover',
                              border: '1px solid #ddd'
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Box
                            key={index}
                            width={100}
                            height={100}
                            sx={{
                              borderRadius: 8,
                              border: '1px dashed #ddd',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f5f5f5'
                            }}
                          >
                            <Typography variant="caption" color="textSecondary">
                              {key} {index + 1}
                            </Typography>
                          </Box>
                        )
                      )}
                    </Box>
                  ) : (
                    // If array contains non-images
                    <Typography sx={commonStyles.value}>
                      {value.join(", ")}
                    </Typography>
                  )
                ) : (
                  // Handle single values
                  <>
                    {renderImageField(key, value)}
                    {!isImageKey(key) || !isValidImageUrl(value) ? (
                      <Typography sx={commonStyles.value}>{renderValue(value)}</Typography>
                    ) : null}
                  </>
                )}
              </Grid>
            )
        )}

        {/* Render Room Data */}
        {hotelData1?.rooms?.length > 0 && (
          <Grid item xs={12}>
            <Typography sx={commonStyles.label}>Rooms:</Typography>
          </Grid>
        )}

        {hotelData1?.rooms?.map((room: any, idx: any) => (
          <Grid item xs={12} md={6} key={idx}>
            <Paper
              sx={{
                p: 2,
                my: 1,
                backgroundColor: color.thirdColor,
                boxShadow: "0px 0px 14px rgba(0, 0, 0, 0.14)",
                borderRadius: "12px",
              }}
            >
              {/* Display all image fields from room */}
              {Object.entries(room)
                .filter(([roomKey, roomValue]) => 
                  isImageKey(roomKey) && isValidImageUrl(roomValue)
                )
                .map(([roomKey, roomValue]) => (
                  <Box key={roomKey} mt={1} mb={2}>
                    <Typography sx={commonStyles.label}>
                      {roomKey.replace(/([A-Z])/g, " $1").trim()}:
                    </Typography>
                    <img
                      src={roomValue as string}
                      alt={roomKey}
                      width={200}
                      height={150}
                      style={{ 
                        borderRadius: 8,
                        objectFit: 'cover',
                        border: '1px solid #ddd'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </Box>
                ))}
              
              {/* Display non-image room data */}
              {Object.entries(room)
                .filter(([roomKey, roomValue]) => 
                  !isImageKey(roomKey) || !isValidImageUrl(roomValue)
                )
                .map(([roomKey, roomValue]) => (
                  <Box key={roomKey} mb={1}>
                    <Typography sx={commonStyles.value}>
                      <strong>
                        {roomKey.replace(/([A-Z])/g, " $1").trim()}:
                      </strong>{" "}
                      {renderValue(roomValue)}
                    </Typography>
                  </Box>
                ))}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {getUserRole() === "Admin" && (
        <>
          <Typography mt={1} sx={commonStyles.label}>
            Remark:
          </Typography>

          <CustomTextField
            sx={{
              "& .MuiInputBase-input": { resize: "vertical" },
              "& textarea": { resize: "vertical" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  border: "none",
                  borderRadius: "12px",
                },
              },
              mt: 2,
            }}
            fullWidth
            label="Application Remark"
            multiline
            rows={4}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />

          <Box mt={2} display="flex" justifyContent="flex-end">
            <CustomButton
              variant="contained"
              customStyles={{ fontSize: "14px" }}
              onClick={handleSubmit}
            >
              Submit
            </CustomButton>
          </Box>

          <Box sx={{ width: "100%", display: "flex", gap: 1 }} mt={4}>
            <CustomButton
              customStyles={{ fontSize: "14px", background: "red", width: "100%" }}
              variant="contained"
              onClick={() => handleActionClick("reject")}
            >
              Reject <Cancel sx={{ ml: 1, fontSize: "18px" }} />
            </CustomButton>
            <CustomButton
              customStyles={{
                fontSize: "14px",
                background: "green",
                width: "100%",
              }}
              variant="contained"
              onClick={() => handleActionClick("approve")}
            >
              Approve <CheckCircle sx={{ ml: 1, fontSize: "18px" }} />
            </CustomButton>
          </Box>

          <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            sx={{ textAlign: "center" }}
          >
            {actionType === "approve" ? (
              <CheckCircle
                sx={{ margin: "auto", fontSize: "84px", color: "green", mt: 2 }}
              />
            ) : (
              <Cancel
                sx={{ margin: "auto", fontSize: "84px", color: "red", mt: 2 }}
              />
            )}

            <DialogTitle sx={{ fontSize: "20px", m: 0, pb: 1 }}>
              {actionType === "approve"
                ? "Confirm Approval?"
                : "Confirm Rejection?"}
            </DialogTitle>
            <DialogContent sx={{ fontSize: "14px" }}>
              Are you sure you want to {actionType} this application?
            </DialogContent>
            <DialogActions
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Button
                sx={{ textTransform: "none", background: "grey" }}
                variant="contained"
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
              <Button
                sx={{
                  textTransform: "none",
                  background: actionType === "approve" ? "green" : "red",
                }}
                variant="contained"
                onClick={handleConfirmAction}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Paper>
  );
};

export default ApplicationPreview;