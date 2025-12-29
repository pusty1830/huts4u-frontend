import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Box, IconButton, Popover, Typography } from "@mui/material";
import { useState } from "react";
import color from "./color";
import CustomButton from "./CustomButton";

interface RoomGuestSelectProps {
  label: string;
  rooms: number;
  adults: number;
  children: number;
  setRooms: (value: number) => void;
  setAdults: (value: number) => void;
  setChildren: (value: number) => void;
}

const RoomGuestSelect: React.FC<RoomGuestSelectProps> = ({
  label,
  rooms,
  adults,
  children,
  setRooms,
  setAdults,
  setChildren,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

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
        minWidth: "200px",
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
      <Box sx={{ cursor: "pointer", px: 1 }} onClick={handleClick}>
        <Typography
          sx={{
            fontSize: { xs: "18px", md: "20px" },

            fontFamily: "CustomFontB",
          }}
        >
          {rooms} Room, {adults} Adults
        </Typography>
      </Box>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box
          sx={{ p: 2, bgcolor: color.thirdColor, borderRadius: 2, width: 250 }}
        >
          {["Rooms", "Adults", "Children"].map((label, index) => {
            const value = index === 0 ? rooms : index === 1 ? adults : children;
            const setValue =
              index === 0 ? setRooms : index === 1 ? setAdults : setChildren;
            return (
              <Box
                key={label}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  my: 1,
                }}
              >
                <Typography fontWeight={600}>{label}</Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <IconButton onClick={() => setValue(Math.max(0, value - 1))}>
                    <RemoveIcon />
                  </IconButton>
                  <Typography fontWeight={600} sx={{ mx: 2 }}>
                    {value}
                  </Typography>
                  <IconButton onClick={() => setValue(value + 1)}>
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>
            );
          })}

          <CustomButton
            customStyles={{
              padding: "6px",
              width: "100%",
              marginTop: "15px",
              fontSize: "16px",
            }}
            onClick={handleClose}
            variant="contained"
          >
            Confirm
          </CustomButton>
        </Box>
      </Popover>
    </Box>
  );
};

export default RoomGuestSelect;
