import { Box, Typography } from "@mui/material";
import { LocalizationProvider, MobileTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import color from "./color";

interface TimePickerProps {
  time: Dayjs | null;
  setTime: (value: Dayjs | null) => void;
  label: string;
  bookingType?: string;
  checkinDate?: Dayjs | null;
}

const CustomTimePicker: React.FC<TimePickerProps> = ({
  time,
  setTime,
  label,
  bookingType = "hourly",
  checkinDate = null,
}) => {
  const handleTimeChange = (newValue: Dayjs | null) => {
    // Simply set the time without any restrictions
    setTime(newValue);
  };

  // Remove the shouldDisableTime function entirely
  // Users can select any time they want

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          bgcolor: color.thirdColor,
          borderRadius: 2,
          p: 1,
          textAlign: "left",
          color: color.firstColor,
          minWidth: { xs: "80%", md: "auto" },
        }}
      >
        <Typography
          sx={{
            px: "10px",
            fontSize: { xs: "14px", md: "16px" },
            fontFamily: "CustomFontM",
          }}
        >
          {label}
        </Typography>
        <MobileTimePicker
          value={time}
          onChange={handleTimeChange}
          views={["hours"]}
          // REMOVED: shouldDisableTime prop
          // REMOVED: minTime prop
          // REMOVED: maxTime prop
          slotProps={{
            textField: {
              sx: {
                bgcolor: color.thirdColor,
                borderRadius: 2,
                width: "100%",
                border: "none",
                outline: "none",
                boxShadow: "none",
                "& fieldset": {
                  border: "none",
                },
                "&:hover": {
                  bgcolor: "#f5f5f5",
                },
                "& .MuiInputBase-input": {
                  padding: "0px 10px",
                  color: color.firstColor,
                  fontFamily: "CustomFontB",
                  fontSize: { xs: "18px", md: "20px" },
                },
              },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default CustomTimePicker;