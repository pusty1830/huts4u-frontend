import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import color from "../color";
import Sidebar from "./Sidebar";

function HotelLayout(props: any) {
  return (
    <Box sx={{ position: "relative" }}>
      <Box
        sx={{
          display: "flex",
          position: "relative",
          minHeight: "90vh",
          background: color.thirdColor,
        }}
      >
        <Sidebar />

        <Box
          sx={{
            flexGrow: 1,
            position: "relative",
            zIndex: 1,
            marginBottom: "0px",
            "@media (max-width: 600px)": {
              marginBottom: "50px",
            },
          }}
        >
          <Box
            sx={{
              overflow: "hidden",
              maxWidth: "100vw",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default HotelLayout;
