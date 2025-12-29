import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  TextField,
} from "@mui/material";
import { useFormik } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import CustomButton from "../../components/CustomButton";
import { SignIn } from "../../services/services";
import { setCurrentAccessToken } from "../../services/axiosClient";
import { toast } from "react-toastify";
import color from "../../components/color";
const CustomTextField = ({ label, ...props }: any) => (
  <Box sx={{ mb: 2 }}>
    {label && (
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
        {label}
      </Typography>
    )}
    <TextField
      fullWidth
      size="medium"
      variant="outlined"
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "#cccccc",
            borderWidth: "1px",
            borderRadius: "12px",
          },
          "&:hover fieldset": {
            borderColor: color.firstColor,
          },
          "&.Mui-focused fieldset": {
            borderColor: color.firstColor,
            borderWidth: "2px",
          },
          "& input": {
            color: "#333333",
            padding: "12px 14px",
            fontSize: "14px",
          },
          "& .MuiInputAdornment-root .MuiSvgIcon-root": {
            color: "#666666",
          },
        },
        "& .MuiFormHelperText-root": {
          color: "#d32f2f",
          fontSize: "0.75rem",
          ml: 1,
          mt: 0.5,
        },
      }}
      {...props}
    />
  </Box>
);

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email format")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      setLoading(true);
      setSubmitting(true);
      const payLoad = {
        email: values.email,
        password: values.password,
      };

      try {
        const res = await SignIn(payLoad);

        if (res?.data?.data?.accessToken) {
          setCurrentAccessToken(res?.data?.data?.accessToken);
        }

        const successMsg = res?.data?.msg || "Login successful!";
        toast.success(successMsg);

        // Handle navigation based on role
        if (res?.data?.data?.role === "Hotel") {
          window.location.href = "/dashboard";
        } else if (res?.data?.data?.role === "customercare") {
          window.location.href = "/";
        } else if (res?.data?.data?.role === "User") {
          window.location.href = "/";
        } else {
          window.location.assign("/admin-homepage");
        }

      } catch (err: any) {
        const errorMessage =
          err.response?.data?.msg ||
          err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again.";

        const fieldErrors = err?.response?.data?.errors;
        if (fieldErrors && typeof fieldErrors === "object") {
          setErrors(fieldErrors);
        }

        toast.error(errorMessage);
        console.error("Login error:", err);
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  // Custom TextField style


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
            LOGIN
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
            Enter your credentials to access your account
          </Typography>
        </Box>

        <CardContent
          sx={{
            p: { xs: 3, sm: 4 },
          }}
        >
          <form onSubmit={formik.handleSubmit}>
            {/* Email Field */}
            <CustomTextField
              label="Email Address"
              placeholder="Enter your email address"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />

            {/* Password Field */}
            <Box sx={{ mb: 2 }}>
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
                Password
              </Typography>
              <TextField
                fullWidth
                size="medium"
                variant="outlined"
                placeholder="Enter your password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#cccccc",
                      borderWidth: "1px",
                      borderRadius: "12px",
                    },
                    "&:hover fieldset": {
                      borderColor: color.firstColor,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: color.firstColor,
                      borderWidth: "2px",
                    },
                    "& input": {
                      color: "#333333",
                      padding: "12px 14px",
                      fontSize: "14px",
                      paddingRight: "50px",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "#d32f2f",
                    fontSize: "0.75rem",
                    ml: 1,
                    mt: 0.5,
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{
                          color: "#666666",
                          "&:hover": {
                            color: color.firstColor,
                            backgroundColor: "rgba(104, 39, 184, 0.1)",
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: "right", mb: 3 }}>
              <Button
                sx={{
                  textTransform: "none",
                  color: color.firstColor,
                  fontSize: "14px",
                  fontWeight: 500,
                  p: 0,
                  minWidth: "auto",
                  "&:hover": {
                    backgroundColor: "transparent",
                    textDecoration: "underline",
                  },
                }}
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </Button>
            </Box>

            {/* Login Button */}
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
              type="submit"
              variant="contained"
              disabled={loading || formik.isSubmitting}
            >
              {loading ? (
                <CircularProgress
                  size={24}
                  sx={{ color: "white" }}
                />
              ) : (
                "Sign In"
              )}
            </CustomButton>

            {/* Divider */}
            <Box sx={{ my: 4, position: "relative" }}>
              <Box sx={{ height: "1px", backgroundColor: "#e0e0e0" }} />
              <Typography
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "white",
                  px: 2,
                  color: "#999",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                OR
              </Typography>
            </Box>

            {/* Bottom Links */}
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <Button
                fullWidth
                sx={{
                  textTransform: "none",
                  color: color.firstColor,
                  border: `1px solid ${color.firstColor}`,
                  borderRadius: "12px",
                  py: 1.5,
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: "rgba(104, 39, 184, 0.05)",
                    borderColor: color.secondColor,
                  },
                }}
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
              <Button
                fullWidth
                sx={{
                  textTransform: "none",
                  color: color.firstColor,
                  border: `1px solid ${color.firstColor}`,
                  borderRadius: "12px",
                  py: 1.5,
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: "rgba(104, 39, 184, 0.05)",
                    borderColor: color.secondColor,
                  },
                }}
                onClick={() => navigate("/signup")}
              >
                Create Account
              </Button>
            </Box>

            {/* Footer Note */}
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
              By signing in, you agree to our Terms of Service and Privacy Policy.
              Contact support if you need assistance.
            </Typography>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;