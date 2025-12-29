import { Box, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import color from "./color";
import { useScreenSize } from "./style";

interface TimePickerProps {
  primaryText: string;
  subText: string;
}

const SectionHeader: React.FC<TimePickerProps> = ({ primaryText, subText }) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [textWidth, setTextWidth] = useState(0);
  const { isBelow400px } = useScreenSize();

  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.offsetWidth);
    }
  }, []);
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      textAlign="center"
      my={4}
    >
      <Box
        display="flex"
        alignItems="center"
        // width={textWidth + 40}
        justifyContent="space-between"
      >
        <Box
          flex="1"
          width="100px"
          bgcolor={color.firstColor}
          sx={{ height: { xs: "4px", md: "8px" } }}
        />
        <Typography
          ref={textRef}
          fontWeight="bold"
          color={color.firstColor}
          mx={2}
          fontFamily={"CustomFontB"}
          sx={{
            fontSize: isBelow400px ? "18px" : { xs: "22px", md: "44px" },
            maxWidth: "80%",
          }}
        >
          {primaryText}
        </Typography>
        <Box
          flex="1"
          width="100px"
          bgcolor={color.firstColor}
          sx={{ height: { xs: "4px", md: "8px" } }}
        />
      </Box>
      <Typography
        variant="body2"
        color={color.firstColor}
        fontFamily={"CustomFontB"}
        sx={{
          textTransform: "uppercase",
          fontSize: isBelow400px ? "8px" : { xs: "10px", md: "14px" },
        }}
      >
        {subText}
      </Typography>
    </Box>
  );
};

export default SectionHeader;
