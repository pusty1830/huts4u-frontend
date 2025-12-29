import { Autocomplete, TextField } from "@mui/material";
import { Box, Typography } from "@mui/material";
import color from "./color";

interface SingleSelectProps {
  options: string[];
  value: string | null;
  setValue: (value: string | null) => void;
  label: string;
}

const CustomSingleSelect: React.FC<SingleSelectProps> = ({
  options,
  value,
  setValue,
  label,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: color.thirdColor,
        borderRadius: 2,
        p: 1,
        textAlign: "left",
        color: color.firstColor,
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
      <Autocomplete
        style={{ padding: 0 }}
        value={value}
        onChange={(_, newValue) => setValue(newValue)}
        options={options}
        renderInput={(params) => (
          <TextField
            placeholder="location"
            {...params}
            InputProps={{
              ...params.InputProps,
              style: { padding: 0 },
            }}
            inputProps={{
              ...params.inputProps,
              style: { padding: "0px 10px" },
            }}
            sx={{
              bgcolor: color.thirdColor,
              borderRadius: 2,
              minWidth: "200px",
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
                color: color.firstColor,
                fontFamily: "CustomFontB",
                fontSize: { xs: "18px", md: "20px" },
              },
            }}
          />
        )}
      />
    </Box>
  );
};

export default CustomSingleSelect;
