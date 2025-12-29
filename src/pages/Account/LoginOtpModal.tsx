/* LoginOtpModal.tsx */
import { Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Grid,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import color from "../../components/color";
import {
  verifyOTP,
  resendOTP,
  sendOTP, // ✅ NEW OTP fallback API
} from "../../services/services";
import {
  setCurrentAccessToken,
  setCurrentUser,
} from "../../services/axiosClient";

import "./Login.css";

interface LoginOtpModalProps {
  open: boolean;
  onClose: () => void;
  onVerificationSuccess: () => void;
  phone: string;
  name?: string; // Made optional since UserLogin doesn't pass it anymore
  email?: string; // Made optional since UserLogin doesn't pass it anymore
  token?: string; // sessionId (optional now)
}

const OTP_LENGTH = 4;
const RESEND_TIME = 60;

const LoginOtpModal = ({
  open,
  onClose,
  onVerificationSuccess,
  phone,
  name = "",
  email = "",
  token,
}: LoginOtpModalProps) => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendTimer, setResendTimer] = useState<number>(RESEND_TIME);
  const [isResending, setIsResending] = useState<boolean>(false);

  // ✅ local sessionId (can change if NEW OTP is generated)
  const [sessionId, setSessionId] = useState<string | undefined>(token);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is coming from /user-login page
  const isFromUserLogin = location.pathname.includes("/user-login");

  /* ---------------- Close modal ---------------- */
  const handleClose = () => {
    const searchParams = new URLSearchParams(location.search);
    ["login", "phone", "name", "email", "token"].forEach((p) =>
      searchParams.delete(p)
    );

    navigate(`${location.pathname}?${searchParams.toString()}`, {
      replace: true,
      state: { ...location.state },
    });

    onClose();
  };

  /* ---------------- Init ---------------- */
  useEffect(() => {
    if (!open) return;

    setOtp(Array(OTP_LENGTH).fill(""));
    setResendTimer(RESEND_TIME);
    setSessionId(token); // reset to incoming token

    setTimeout(() => {
      otpRefs.current[0]?.focus();
      otpRefs.current[0]?.select();
    }, 100);
  }, [open, token]);

  /* ---------------- Timer ---------------- */
  useEffect(() => {
    if (!open || resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [open, resendTimer]);

  /* ---------------- OTP Logic ---------------- */
  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return;

    const newOtp = [...otp];
    let i = index;

    for (const d of digits) {
      if (i >= OTP_LENGTH) break;
      newOtp[i++] = d;
    }

    setOtp(newOtp);
    if (i < OTP_LENGTH) otpRefs.current[i]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement | HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    handleOtpChange(index, e.clipboardData.getData("text"));
  };

  /* ---------------- Verify ---------------- */
  const handleOtpSubmit = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== OTP_LENGTH) {
      toast.error("Please enter complete OTP");
      return;
    }

    if (!sessionId) {
      toast.error("Session expired. Please resend OTP.");
      return;
    }

    try {
      const res = await verifyOTP({
        otp: otpValue,
        sessionId,
        phone,
        name,
        email,
      });

      setCurrentAccessToken(res?.data?.data?.token);
      setCurrentUser(res?.data?.data?.user);

      toast.success("OTP verified successfully");
      
      // Check if user is coming from /user-login page
      if (isFromUserLogin) {
        // Redirect to home page
        window.location.href = '/';
      } else {
        // Call the original success handler for other pages
        onVerificationSuccess();
        handleClose();
      }
    } catch {
      toast.error("Invalid or expired OTP");
    }
  };

  /* ---------------- Resend / Fallback ---------------- */
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;

    try {
      setIsResending(true);

      // ✅ CASE 1: sessionId exists → RESEND OTP
      if (sessionId) {
        await resendOTP({ phone, sessionId });
        toast.success("OTP resent successfully");
      }
      // ✅ CASE 2: sessionId missing → SEND NEW OTP
      else {
        const res = await sendOTP({ phone, name, email });
        const newSessionId = res?.data?.data; // assuming backend returns Details/sessionId

        if (!newSessionId) {
          throw new Error("Failed to generate new OTP");
        }

        setSessionId(newSessionId);
        toast.success("New OTP sent successfully");
      }

      setOtp(Array(OTP_LENGTH).fill(""));
      setResendTimer(RESEND_TIME);
      otpRefs.current[0]?.focus();
    } catch {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Box
          className="subscribe"
          sx={{
            background: color.background,
            color: "#fff",
            borderRadius: "16px",
            position: "relative",
            height: "100%",
            p: 2,
          }}
        >
          <Typography variant="h6" sx={{color:"white"}}>Enter OTP</Typography>

          <Typography variant="body2" sx={{ mb: 1,color:"white" }}>
            Sent to: +91 {phone}
            <Button
              size="small"
              onClick={handleClose}
              sx={{
                ml: 1,
                p: 0,
                minWidth: 0,
                textTransform: "none",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              <Edit sx={{ fontSize: 14 }} /> Edit
            </Button>
          </Typography>

          {/* OTP Inputs */}
          <Grid container spacing={1.5} justifyContent="center" mt={2}>
            {otp.map((val, index) => (
              <Grid item key={index}>
                <TextField
                  value={val}
                  inputRef={(el) => (otpRefs.current[index] = el)}
                  onChange={(e) =>
                    handleOtpChange(index, e.target.value)
                  }
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => handlePaste(e, index)}
                  inputProps={{
                    maxLength: 1,
                    inputMode: "numeric",
                    type: "tel",
                    style: {
                      textAlign: "center",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#111",
                    },
                  }}
                  sx={{
                    width: 52,
                    bgcolor: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                    "& fieldset": { border: "none" },
                  }}
                />
              </Grid>
            ))}
          </Grid>

          {/* Resend */}
          <Box sx={{ mt: 2, textAlign: "center" }}>
            {resendTimer > 0 ? (
              <Typography variant="body2">
                Resend OTP in <b>{resendTimer}s</b>
              </Typography>
            ) : (
              <Button
                size="small"
                onClick={handleResendOtp}
                disabled={isResending}
                sx={{
                  textTransform: "none",
                  color: "#fff",
                  fontWeight: "bold",
                  textDecoration: "underline",
                }}
              >
                Didn't get OTP? Send again
              </Button>
            )}
          </Box>

          {/* Verify */}
          <Button
            onClick={handleOtpSubmit}
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              py: 2,
              borderRadius: "0 0 16px 16px",
              background: "#fff",
              color: color.firstColor,
              fontWeight: "bold",
              textTransform: "none",
            }}
          >
            Verify OTP
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: 400,
  width: "90%",
  height: 320,
};

export default LoginOtpModal;