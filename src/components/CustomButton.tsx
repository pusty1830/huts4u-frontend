import React from "react";
import { Button, ButtonProps } from "@mui/material";
import color from "./color";

interface CustomButtonProps extends ButtonProps {
  customStyles?: React.CSSProperties;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  customStyles,
  children,
  onClick,
  ...props
}) => {
  return (
    <Button
      onClick={onClick}
      style={{
        width: "fit-content",
        background: color.background,
        textTransform: "none",
        fontFamily: "CustomFontB",
        padding: "10px 25px",
        borderRadius: "8px",
        boxShadow: "-4px -4px 10px rgba(255, 255, 255, 0.36) inset",
        ...customStyles,
      }}
      sx={{
        fontSize: { xs: "16px", md: "18px" },
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default CustomButton;
