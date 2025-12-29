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
} from "@mui/material";
import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import CustomButton from "../../components/CustomButton";
import { LoginTextField } from "../../components/style";
import { hotelRegister } from "../../services/services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import color from "../../components/color";

const StyledTextField = ({ ...props }) => (
    <LoginTextField
      {...props}
      sx={{
        "& .MuiInputLabel-root": {
          color: "#666666 !important",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: color.firstColor,
        },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "#cccccc !important",
            borderWidth: "1px",
          },
          "&:hover fieldset": {
            borderColor: `${color.firstColor} !important`,
          },
          "&.Mui-focused fieldset": {
            borderColor: `${color.firstColor} !important`,
            borderWidth: "2px",
          },
          "& input": {
            color: "#333333 !important",
          },
          "& .MuiInputAdornment-root .MuiSvgIcon-root": {
            color: "#666666 !important",
          },
        },
        "& .MuiFormHelperText-root": {
          color: "#d32f2f !important",
          fontSize: "0.75rem",
        },
        mb: 2,
      }}
    />
  );
  
const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required("Full Name is required"),
      email: Yup.string()
        .email("Invalid email format")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
        .matches(/[a-z]/, "Password must contain at least one lowercase letter")
        .matches(/\d/, "Password must contain at least one number")
        .matches(
          /[!@#$%^&*(),.?":{}|<>]/,
          "Password must contain at least one special character"
        )
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), undefined], "Passwords must match")
        .required("Confirm Password is required"),
      phone: Yup.string()
        .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
        .required("Phone number is required"),
    }),
    onSubmit: async (values, { setSubmitting, setErrors, resetForm }) => {
      setLoading(true);
      setSubmitting(true);
      try {
        const payLoad = {
          userName: values.fullName,
          email: values.email,
          phoneNumber: values.phone,
          password: values.password,
          role: "Hotel",
        };

        const res = await hotelRegister(payLoad);
        const successMsg = res?.data?.msg || "Registered successfully";
        toast.success(successMsg);

        resetForm();
        navigate("/login");
      } catch (err: any) {
        const serverMsg =
          err?.response?.data?.msg ||
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong. Please try again.";

        const fieldErrors = err?.response?.data?.errors;
        if (fieldErrors && typeof fieldErrors === "object") {
          setErrors(fieldErrors);
        }

        toast.error(serverMsg);
        console.error("Signup error:", err);
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  // Updated LoginTextField with proper colors for light background
  

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
            CREATE ACCOUNT
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
            Join us today! Sign up to get started
          </Typography>
        </Box>

        <CardContent
          sx={{
            p: { xs: 3, sm: 4 },
          }}
        >
          <form onSubmit={formik.handleSubmit}>
            <StyledTextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fullName && Boolean(formik.errors.fullName)}
              helperText={formik.touched.fullName && formik.errors.fullName}
            />

            <StyledTextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />

            <StyledTextField
              fullWidth
              label="Phone Number"
              name="phone"
              type="text"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
            />

            <StyledTextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
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

            <StyledTextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.confirmPassword &&
                Boolean(formik.errors.confirmPassword)
              }
              helperText={
                formik.touched.confirmPassword && formik.errors.confirmPassword
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                      sx={{
                        color: "#666666",
                        "&:hover": {
                          color: color.firstColor,
                          backgroundColor: "rgba(104, 39, 184, 0.1)",
                        },
                      }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

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
                "Sign Up"
              )}
            </CustomButton>

            <Button
              fullWidth
              sx={{
                textTransform: "none",
                mt: 3,
                color: color.firstColor,
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: "rgba(104, 39, 184, 0.05)",
                },
              }}
              onClick={() => navigate("/login")}
              disabled={loading}
            >
              Already have an account?{" "}
              <Box component="span" sx={{ fontWeight: "bold", ml: 0.5 }}>
                Login here
              </Box>
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Signup;