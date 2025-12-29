import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Alert,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import { sendOTP } from "../services/services";
import { isLoggedIn } from "../services/axiosClient";
import LoginOtpModal from "./Account/LoginOtpModal";
import color from "../components/color";
import CustomButton from "../components/CustomButton";

const UserLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || "/";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [phoneNumber, setPhoneNumber] = useState("91");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState({ phone: "", token: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoggedIn()) navigate(redirectPath);
  }, [navigate, redirectPath]);

  const handlePhoneChange = (value: any) => {
    setPhoneNumber(value);
    setError("");
  };

  const validateForm = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const phoneWithoutCountryCode = phoneNumber.slice(2);
      const response = await sendOTP({ phone: phoneWithoutCountryCode });

      if (response?.data?.data) {
        setOtpData({
          phone: phoneWithoutCountryCode,
          token: response.data.data,
        });
        setShowOtpModal(true);
        toast.success("OTP sent successfully");
      } else {
        throw new Error();
      }
    } catch {
      setError("Failed to send OTP. Please try again.");
      toast.error("OTP failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <Box
      sx={{
        margin: "auto",
        minHeight: "calc(100vh - 64px)",
        background: color.thirdColor,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Card
        elevation={8}
        sx={{
          maxWidth: 500,
          width: "100%",
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0px 10px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Box
          sx={{
            background: color.firstColor,
            py: 3,
            textAlign: "center",
          }}
        >
          <Typography
            variant={isMobile ? "h5" : "h4"}
            fontWeight="bold"
            color="white"
            sx={{
              fontFamily: "CustomFontB",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            USER LOGIN
          </Typography>
          <Typography
            variant="body1"
            color="white"
            sx={{
              opacity: 0.9,
              fontSize: { xs: "0.875rem", sm: "1rem" },
              mt: 1,
            }}
          >
            Login securely using your mobile number
          </Typography>
        </Box>

        <CardContent
          sx={{
            p: { xs: 3, sm: 4 },
          }}
        >
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: "12px",
              }}
            >
              {error}
            </Alert>
          )}

          {/* Phone Input */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: "#666666",
                mb: 1,
                fontSize: "14px",
                ml: 0.5,
              }}
            >
              Mobile Number
            </Typography>

            <Box
              sx={{
                "& .react-tel-input": {
                  width: "100%",
                  "& .form-control": {
                    width: "100%",
                    height: "36px",
                    borderRadius: "12px",
                    border: "1px solid #cccccc",
                    fontSize: "15px",
                    fontWeight: 500,
                    backgroundColor: "#ffffff",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      borderColor: color.firstColor,
                    },
                    "&:focus": {
                      borderColor: color.firstColor,
                      borderWidth: "2px",
                      boxShadow: "none",
                    },
                  },
                  "& .flag-dropdown": {
                    borderRadius: "12px 0 0 12px",
                    border: "1px solid #cccccc",
                    backgroundColor: "#ffffff",
                    "&:hover": {
                      backgroundColor: "#ffffff",
                      borderColor: "#cccccc",
                    },
                    "&.open": {
                      backgroundColor: "#ffffff",
                    },
                  },
                  "& .selected-flag": {
                    borderRadius: "12px 0 0 12px",
                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                    "&.open": {
                      backgroundColor: "transparent",
                    },
                  },
                },
              }}
            >
              <PhoneInput
                country="in"
                value={phoneNumber}
                onChange={handlePhoneChange}
                disabled={loading}
                inputProps={{ 
                  onKeyPress: handleKeyPress,
                  style: {
                    width: "90%",
                    padding: "12px 14px",
                    fontSize: "14px",
                    color: "#333333",
                  }
                }}
              />
            </Box>
          </Box>

          {/* Continue Button */}
          <CustomButton
            customStyles={{
              width: "100%",
              height: "50px",
              borderRadius: "12px",
              background: color.firstColor,
              color: "white",
              fontWeight: "bold",
              fontSize: "1rem",
              textTransform: "none",
              marginTop: "10px",
              // "&:hover": {
              //   background: color.secondColor,
              //   transform: "translateY(-2px)",
              //   boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
              // },
              // "&:disabled": {
              //   background: "#cccccc",
              // },
            }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress
                size={24}
                sx={{ color: "white" }}
              />
            ) : (
              "Send OTP"
            )}
          </CustomButton>
          {/* Terms and Privacy */}
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 3,
              color: "#999",
              fontSize: "12px",
              lineHeight: 1.4,
            }}
          >
            By continuing, you agree to our{" "}
            <Box
              component="span"
              sx={{
                color: color.firstColor,
                cursor: "pointer",
                fontWeight: 500,
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Terms
            </Box>{" "}
            &{" "}
            <Box
              component="span"
              sx={{
                color: color.firstColor,
                cursor: "pointer",
                fontWeight: 500,
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Privacy Policy
            </Box>
          </Typography>
        </CardContent>
      </Card>

      {/* OTP Modal */}
      <LoginOtpModal
        open={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerificationSuccess={() => navigate(redirectPath)}
        phone={otpData.phone}
        token={otpData.token}
        name=""
        email=""
      />
    </Box>
  );
};

export default UserLogin;