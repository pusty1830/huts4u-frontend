import React from "react";
import {
  Box,
  Button,
  RadioGroup,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import dayjs from "dayjs";
import CustomButton from "../../components/CustomButton";
import color from "../../components/color";
import { BpRadio, CustomTextField } from "../../components/style";
import ImageUploader from "../../components/ImageUploader";

interface FormValues {
  name: string;
  // bio: string;
  // dob: string | null;
  // gender: string;
  email: string;
  phone: string;
}

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  // bio: Yup.string().max(200, "Bio must be less than 200 characters"),
  // dob: Yup.string().required("Date of birth is required"),
  // gender: Yup.string().required("Please select a gender"),
  // email: Yup.string()
  //   .email("Invalid email address")
  //   .required("Email is required"),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
});


const EditProfileForm = ({
  initialValues,
  onSubmit,
  onCancel,
}: {
  initialValues: FormValues;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ errors, touched, handleChange, setFieldValue, values }) => (
        <Form>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxWidth: 600,
              margin: "auto",
              padding: 3,
              background: "#f6f6f6",
              boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.11) inset",
              borderRadius: 2,
              minHeight: "fit-content",
              zIndex: 2,
              position: "relative",
            }}
          >
            <Typography variant="h5" fontWeight="bold" mb={1}>
              Edit Profile
            </Typography>


            {/* <ImageUploader
              label="Profile Image"
              onFileSelect={(file) =>
                                // handleFileChange(file as any, (value) =>
                                //   formik.setFieldValue("gstCertificate", value)
                                )
                              }
            /> */}

            <CustomTextField
              label="Name"
              name="name"
              value={values.name}
              onChange={handleChange}
              error={touched.name && Boolean(errors.name)}
              helperText={touched.name && errors.name}
              fullWidth
            />

            <CustomTextField
              label="Phone Number"
              name="phone"
              value={values.phone}
              onChange={handleChange}
              error={touched.phone && Boolean(errors.phone)}
              helperText={touched.phone && errors.phone}
              fullWidth
            />

            <CustomTextField
              label="Email"
              name="email"
              value={values.email}
              onChange={handleChange}
              error={touched.email && Boolean(errors.email)}
              helperText={touched.email && errors.email}
              fullWidth
            />

            {/* MUI Date Picker */}
            {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date of Birth"
                value={values.dob ? dayjs(values.dob) : null}
                onChange={(date) =>
                  setFieldValue("dob", date ? date.format("YYYY-MM-DD") : null)
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: touched.dob && Boolean(errors.dob),
                    helperText: touched.dob && errors.dob,
                    sx: {
                      border: "none", // Remove border
                      outline: "none", // Remove focus outline
                      borderRadius: "52px",
                      boxShadow: "4px 4px 10px rgba(104, 39, 184, 0.17)",
                      color: color.firstColor,
                      "& fieldset": {
                        border: "none",
                      },
                      "&:hover": {
                        border: "none",
                      },
                      "& .MuiInputBase-input": {
                        color: color.firstColor, // Change text color
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>

            <CustomTextField
              label="Bio"
              name="bio"
              value={values.bio}
              onChange={handleChange}
              error={touched.bio && Boolean(errors.bio)}
              helperText={touched.bio && errors.bio}
              multiline
              rows={3}
              fullWidth
            />

            <Typography variant="subtitle1" fontWeight="bold">
              Gender
            </Typography>
            <RadioGroup
              name="gender"
              value={values.gender}
              onChange={handleChange}
              row
            >
              <FormControlLabel
                value="female"
                control={<BpRadio />}
                label="Female"
              />
              <FormControlLabel
                value="male"
                control={<BpRadio />}
                label="Male"
              />
              <FormControlLabel
                value="unspecified"
                control={<BpRadio />}
                label="Unspecified (X)"
              />
              <FormControlLabel
                value="undisclosed"
                control={<BpRadio />}
                label="Undisclosed (U)"
              />
            </RadioGroup> */}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 2,
              }}
            >
              <CustomButton variant="contained" color="primary" type="submit">
                Save
              </CustomButton>
              <Button
                style={{ color: color.firstColor, textTransform: "none" }}
                variant="outlined"
                color="secondary"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

export default EditProfileForm;
