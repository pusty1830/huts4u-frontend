import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/services';
import CustomButton from '../components/CustomButton';
import color from '../components/color';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const payLoad = { email };
      const response = await forgotPassword(payLoad);
      
      setMessage(response?.msg || "Password reset link has been sent to your email!");
      setEmail('');

      setTimeout(() => {
        navigate('/login');
      }, 5000);

    } catch (err) {
      console.error('Forgot password error:', err);
      setError(
        err?.response?.data?.msg ||
        err?.response?.data?.error ||
        "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
            FORGOT PASSWORD
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
            Enter your email to reset your password
          </Typography>
        </Box>

        <CardContent
          sx={{
            p: { xs: 3, sm: 4 },
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Success Message */}
            {message && (
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  borderRadius: "12px",
                  "& .MuiAlert-message": {
                    width: "100%",
                  }
                }}
              >
                {message}
                <Typography 
                  variant="caption" 
                  display="block" 
                  sx={{ 
                    mt: 1,
                    fontWeight: 500,
                  }}
                >
                  Redirecting to login page in 5 seconds...
                </Typography>
              </Alert>
            )}

            {/* Error Message */}
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

            {/* Email Field */}
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
                Email Address
              </Typography>
              <Box
                component="input"
                fullWidth
                placeholder="Enter your email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{
                  width: "90%",
                  padding: "12px 14px",
                  border: error && error.includes("email") 
                    ? "1px solid #d32f2f" 
                    : "1px solid #cccccc",
                  borderRadius: "12px",
                  fontSize: "14px",
                  color: "#333333",
                  backgroundColor: "white",
                  outline: "none",
                  "&:focus": {
                    borderColor: error && error.includes("email") 
                      ? "#d32f2f" 
                      : color.firstColor,
                    borderWidth: "2px",
                  },
                  "&:hover": {
                    borderColor: error && error.includes("email") 
                      ? "#d32f2f" 
                      : color.firstColor,
                  },
                  "&:disabled": {
                    backgroundColor: "#f5f5f5",
                    cursor: "not-allowed",
                  },
                }}
              />
            </Box>

            {/* Submit Button */}
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
                "&:hover": {
                  background: color.secondColor,
                  transform: "translateY(-2px)",
                  boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
                },
                "&:disabled": {
                  background: "#cccccc",
                },
              }}
              type="submit"
              variant="contained"
              disabled={loading || !email}
            >
              {loading ? (
                <CircularProgress
                  size={24}
                  sx={{ color: "white" }}
                />
              ) : (
                "Send Reset Link"
              )}
            </CustomButton>

            {/* Back to Login Link */}
            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Button
                sx={{
                  textTransform: "none",
                  color: color.firstColor,
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: "transparent",
                    textDecoration: "underline",
                  },
                }}
                onClick={() => navigate('/login')}
                disabled={loading}
              >
                ← Back to Login
              </Button>
            </Box>

            {/* Security Notice */}
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                mt: 4,
                color: "#999",
                fontSize: "12px",
                lineHeight: 1.4,
              }}
            >
              For security reasons, the reset link will expire in 1 hour.
              <br />
              Didn't receive an email? Check your spam folder or {' '}
              <Box
                component="span"
                sx={{
                  color: color.firstColor,
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: 500,
                  "&:hover": {
                    textDecoration: "none",
                  },
                }}
                onClick={() => {
                  setMessage('');
                  setError('');
                }}
              >
                try again
              </Box>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;