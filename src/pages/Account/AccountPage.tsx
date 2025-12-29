import { Edit } from "@mui/icons-material";
import { Avatar, Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import color from "../../components/color";
import EditProfileForm from "./EditProfileForm";
import { editUser, getProfile } from "../../services/services";
import { getUserName } from "../../services/axiosClient";
import { toast } from "react-toastify";

const AccountPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<any>({});
  const [profile, setProfile] = useState<any>({
    name: "",
    email: "",
    phone: "",
  });

  // Fetch user data
  useEffect(() => {
    getProfile().then((res) => {
      setUser(res?.data?.data);
    });
  }, []);

  // Update profile state when user data changes
  useEffect(() => {
    if (user.userName || user.email || user.phoneNumber) {
      setProfile({
        name: user.userName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
      });
    }
  }, [user]); // Dependency on `user`





  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleFormSubmit = (values: any) => {
    setProfile(values);
    const payLoad = {
      userName: values.name,
      email: values.email,
      phoneNumber: values.phone
    }
    console.log(values)
    console.log(payLoad)
    editUser(payLoad)
      .then((res) => {
        console.log(res)
        toast(res?.data?.msg)
      })
      .catch((err) => {
        console.error("Error updating profile:", err);
      });
    setIsEditing(false);
  };

  return (
    <Box
      sx={{
        margin: "auto",
        minHeight: "fit-content",
        p: 4,
        background: "url('/assets/bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        position: "relative",
      }}
    >
      <Box
        sx={{
          height: "100%",
          width: "100%",
          top: 0,
          left: 0,
          position: "absolute",
          zIndex: 1,
          backdropFilter: "blur(2px)",
        }}
      ></Box>

      {isEditing ? (
        <EditProfileForm
          initialValues={profile}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 600,
            margin: "auto",
            zIndex: 2,
            position: "relative",
          }}
        >
          <Box>
            <div
              style={{
                padding: "32px",
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
                borderRadius: "12px",
                position: "relative",
                overflow: "hidden",
                backdropFilter: "blur(10px)",
                background: "#f6f6f6",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  boxShadow: "0px 0px 30px rgba(0, 0, 0, 0.38)",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "column",
                  py: 2,
                  height: "120px",
                  zIndex: 100,
                  background: color.background,
                  color: "white",
                }}
              >
                <Avatar sx={{ height: "64px", width: "64px" }}></Avatar>
                <Typography variant="h5" fontWeight="bold" my={2}>
                  Hi, {user.userName}
                </Typography>
              </Box>

              <Box
                sx={{
                  mt: "150px",
                  width: "100%",
                  borderRadius: "8px",
                  color: color.firstColor,
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  Your Basic Information
                </Typography>
                <Typography fontSize={"12px"} mt={0.5}>
                  Make sure this information matches your travel ID, like your
                  passport or licence.
                </Typography>

                <Box
                  sx={{
                    marginTop: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  <Typography variant="body1" sx={typoStyle}>
                    <strong>Name:</strong> {profile.name}{" "}
                  </Typography>
                  <Typography variant="body1" sx={typoStyle}>
                    <strong>Phone No:</strong> {profile.phone}{" "}
                  </Typography>
                  <Typography variant="body1" sx={typoStyle}>
                    <strong>Email:</strong> {profile.email}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  onClick={handleEditClick}
                  sx={{
                    marginTop: 4,
                    background: "transparent",
                    border: "solid 2px",
                    color: color.firstColor,
                    borderColor: color.firstColor,
                    borderRadius: "44px",
                    textTransform: "none",
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Edit sx={{ mr: 1 }}></Edit>
                  Edit profile
                </Button>
              </Box>
            </div>
          </Box>
        </div>
      )}
    </Box>
  );
};

export default AccountPage;

const typoStyle = {
  borderRadius: "52px",
  boxShadow: "4px 4px 10px rgba(104, 39, 184, 0.17)",
  color: color.firstColor,
  background: "white",
  p: 2,
  mb: 1,
};