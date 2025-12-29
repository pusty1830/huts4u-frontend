import EmailIcon from "@mui/icons-material/Email";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";
import LanguageIcon from "@mui/icons-material/Language";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import color from "../components/color";
import CustomButton from "../components/CustomButton";
import { CustomTextField } from "../components/style";
import { getUserId, getUserRole, isLoggedIn } from "../services/axiosClient";
import { createContact } from "../services/services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  subject: Yup.string().required("Subject is required"),
  message: Yup.string()
    .required("Message is required")
    .min(10, "Message must be at least 10 characters"),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
});

const ContactUs = ({ open, handleClose }: any) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const initialValues = {
    name: "",
    email: "",
    subject: "",
    message: "",
    phone: "",
  };

  const handleSubmit = (values: any, { setSubmitting, resetForm }: any) => {
    if (isLoggedIn()) {
      const payLoad = {
        userId: getUserId(),
        userType: getUserRole(),
        ...values,
      };
      createContact(payLoad)
        .then((res) => {
          toast.success("Message sent successfully to admin!");
          resetForm();
          if (getUserRole() === "Hotel") {
            navigate("/dashboard");
          } else {
            navigate("/");
          }
        })
        .catch((error) => {
          console.error("Error sending message:", error);
          toast.error("Error occurred while sending message. Please try again.");
        })
        .finally(() => {
          setSubmitting(false);
          if (handleClose) handleClose();
        });
    } else {
      toast.warning("Please login first or book your first hotel!");
      setSubmitting(false);
    }
  };

  const contactDetails = [
    {
      icon: <LanguageIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      title: "Our Address",
      info: "Ground Floor, Plot No. 370/10537, New Pokhran Village, Chandrasekharpur, Bhubaneswar, Odisha – 751016, India",
      href: null,
    },
    {
      icon: <EmailIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      title: "Official Mail",
      info: "help@huts4u.com",
      href: "mailto:help@huts4u.com",
    },
    {
      icon: <HeadsetMicIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      title: "Official Phone",
      info: "18001212560",
      href: "tel:18001212560",
    },
  ];

  return (
    <Box
      sx={{
        background: color.thirdColor,
        minHeight: "100vh",
        py: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Header */}
        <Typography
          variant={isMobile ? "h5" : isTablet ? "h4" : "h4"}
          fontWeight="bold"
          color="white"
          fontFamily="CustomFontB"
          textAlign="center"
          sx={{
            background: color.firstColor,
            width: "fit-content",
            px: { xs: 3, sm: 4 },
            py: { xs: 1, sm: 1.5 },
            borderRadius: "8px",
            margin: "0 auto",
            mb: { xs: 3, sm: 4, md: 5 },
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
          }}
        >
          Contact Us
        </Typography>

        {/* Contact Details Cards */}
        <Grid
          container
          spacing={{ xs: 2, sm: 3, md: 4 }}
          justifyContent="center"
          sx={{ mb: { xs: 4, sm: 5, md: 6 } }}
        >
          {contactDetails.map((item, index) => (
            <Grid
              item
              key={index}
              xs={12}
              sm={6}
              md={4}
              sx={{
                display: "flex",
                height: { xs: "auto", sm: "100%" },
              }}
            >
              <Card
                elevation={2}
                sx={{
                  textAlign: "center",
                  padding: { xs: 2, sm: 2.5, md: 3 },
                  borderRadius: "12px",
                  boxShadow: "4px 4px 10px rgba(104, 39, 184, 0.17)",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "6px 6px 15px rgba(104, 39, 184, 0.25)",
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: { xs: 1, sm: 2 },
                    "&:last-child": { pb: { xs: 1, sm: 2 } },
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        marginBottom: { xs: 1.5, sm: 2 },
                        color: color.firstColor,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography
                      variant="subtitle1"
                      color="textSecondary"
                      sx={{
                        mb: 1,
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        fontWeight: 600,
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      variant={isMobile ? "body1" : "h6"}
                      fontWeight="bold"
                      sx={{
                        wordBreak: "break-word",
                        fontSize: {
                          xs: "0.875rem",
                          sm: "1rem",
                          md: "1.125rem",
                        },
                        lineHeight: 1.4,
                      }}
                    >
                      {item.href ? (
                        <a
                          href={item.href}
                          style={{
                            textDecoration: "none",
                            color: "inherit",
                            cursor: "pointer",
                            transition: "color 0.3s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = color.firstColor)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "inherit")
                          }
                        >
                          {item.info}
                        </a>
                      ) : (
                        item.info
                      )}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Contact Form */}
        <Box
          sx={{
            bgcolor: "background.paper",
            p: { xs: 3, sm: 4, md: 5 },
            borderRadius: "16px",
            boxShadow: "4px 4px 10px rgba(104, 39, 184, 0.17)",
            maxWidth: "100%",
            mx: "auto",
          }}
        >
          <Box
            sx={{
              mb: { xs: 3, sm: 4 },
              textAlign: "center",
            }}
          >
            <Typography
              variant={isMobile ? "h5" : "h4"}
              fontWeight="bold"
              color={color.firstColor}
              fontFamily="CustomFontB"
              sx={{
                mb: 1,
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
              }}
            >
              Send a Message
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              We'll get back to you within 24 hours
            </Typography>
          </Box>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({
              isSubmitting,
              touched,
              errors,
              handleBlur,
              handleChange,
              values,
            }) => (
              <Form>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {/* Name and Phone */}
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      as={TextField}
                      label="Name"
                      name="name"
                      fullWidth
                      variant="outlined"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.name}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      as={TextField}
                      label="Phone Number"
                      name="phone"
                      fullWidth
                      variant="outlined"
                      error={touched.phone && Boolean(errors.phone)}
                      helperText={touched.phone && errors.phone}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.phone}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>

                  {/* Email and Subject */}
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      as={TextField}
                      label="Email"
                      name="email"
                      type="email"
                      fullWidth
                      variant="outlined"
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.email}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      as={TextField}
                      label="Subject"
                      name="subject"
                      fullWidth
                      variant="outlined"
                      error={touched.subject && Boolean(errors.subject)}
                      helperText={touched.subject && errors.subject}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.subject}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>

                  {/* Message */}
                  <Grid item xs={12}>
                    <CustomTextField
                      as={TextField}
                      label="Message"
                      name="message"
                      multiline
                      rows={isMobile ? 4 : 6}
                      fullWidth
                      variant="outlined"
                      error={touched.message && Boolean(errors.message)}
                      helperText={touched.message && errors.message}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.message}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mt: { xs: 1, sm: 2 },
                      }}
                    >
                      <CustomButton
                        variant="contained"
                        color="primary"
                        type="submit"
                        disabled={isSubmitting}
                        sx={{
                          px: { xs: 4, sm: 6 },
                          py: { xs: 1.5, sm: 1.75 },
                          fontSize: { xs: "0.875rem", sm: "1rem" },
                          minWidth: { xs: "140px", sm: "160px" },
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        {isSubmitting ? "Sending..." : "Submit Message"}
                      </CustomButton>
                    </Box>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>

        {/* Additional Info */}
        <Box
          sx={{
            mt: { xs: 4, sm: 5 },
            textAlign: "center",
            px: { xs: 2, sm: 3 },
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
          >
            By submitting this form, you agree to our privacy policy and terms of service.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            Typically respond within 1-2 business days
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ContactUs;