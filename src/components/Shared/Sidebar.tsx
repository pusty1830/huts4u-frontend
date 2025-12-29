import {
  BusinessRounded,
  DashboardRounded,
  HeadsetMicRounded,
  PendingActions
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Drawer,
  List,
  ListItem,
  Tooltip,
  Typography,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import color from "../color";
// import { getUserName } from '../../services/axiosClient';

const icons = [
  {
    to: "/dashboard",
    icon: <DashboardRounded style={{ width: "30px" }} />,
    title: "Dashboard",
  },
  {
    to: "/my-hotels",
    icon: <BusinessRounded style={{ width: "30px" }} />,
    title: "Hotel(s)",
  },
  {
    to: "/hotel-applications",
    icon: <PendingActions style={{ width: "30px" }} />,
    title: "Applications",
  },
  {
    to: "/contact-us",
    icon: <HeadsetMicRounded style={{ width: "30px" }} />,
    title: "Contact",
  },
];

const Sidebar = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {!isMobile ? (
        <Drawer
          variant="permanent"
          sx={{
            zIndex: 2,
            width: 80,
            background: "transparent",
            flexShrink: 0,
            overflow: "visible",
            transition: "width 0.3s ease",
            "& .MuiDrawer-paper": {
              width: isHovered ? 160 : 75,
              background: "transparent",
              boxSizing: "border-box",
              border: "none",
              overflow: "visible",
              transition: "width 0.3s ease",
            },
          }}
        >
          <div style={{ height: "64px" }}></div>
          <List
            sx={{
              boxShadow: isHovered
                ? "40px 0px 165px rgba(255, 255, 255,0.9), 10px -5px 15px rgba(0, 0, 0, 0.158) inset"
                : "0px 0px 15px rgba(0,0,0,0.1),10px -5px 15px rgba(0, 0, 0, 0.158) inset",
              padding: "5px",
              paddingRight: 0,
              paddingTop: 2,
              paddingBottom: 0,
              color: "white",
              height: "fit-content",
              overflow: "hidden",
              margin: "30px 6px",
              borderRadius: "16px",
              background: color.thirdColor,
              position: "relative",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {icons.map(({ to, icon, title }, index: number) => (
              // <Tooltip
              //   key={to}
              //   title={title}
              //   placement="right"
              //   arrow
              //   componentsProps={{
              //     tooltip: {
              //       sx: {
              //         background: color.thirdColor,
              //         color: color.firstColor,
              //         fontWeight: 'bold',
              //         fontSize: '14px',
              //         boxShadow: '0px 0px 5px rgba(0,0,0,0.1)',
              //         '& .MuiTooltip-arrow': { color: 'white' },
              //       },
              //     },
              //   }}
              // >
              <ListItem
                key={index}
                component={Link}
                to={to}
                sx={{
                  marginBottom: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  paddingBottom: 1.2,
                  paddingRight: "10px",
                  paddingLeft: "10px",
                  justifyContent: "flex-start",
                  color:
                    location.pathname === to
                      ? color.thirdColor
                      : color.firstColor,
                  background:
                    location.pathname === to ? color.background : "transparent",
                  boxShadow:
                    location.pathname === to
                      ? "-5px 0px 10px rgba(0, 0, 0, 0.158) inset, 0px 0px 10px rgba(255, 255, 255, 0.158)"
                      : "none",
                  borderRadius: "16px",
                  borderTopRightRadius: "0px",
                  borderBottomRightRadius: "0px",
                  transition: "0.05s ease",

                  "&:hover": {
                    background: color.background,
                    color: color.thirdColor,
                    boxShadow:
                      "-5px 0px 10px rgba(0, 0, 0, 0.158) inset, 0px 0px 10px rgba(255, 255, 255, 0.458)",
                  },
                }}
              >
                {icon}
                {isHovered && (
                  <span
                    style={{
                      marginLeft: "10px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    &nbsp;{title}
                  </span>
                )}
              </ListItem>
              // </Tooltip>
            ))}
          </List>

          <a href="/account">
            <div
              style={{
                height: "67px",
                position: "absolute",
                bottom: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                padding: "17px",
              }}
            >
              {/* <Avatar
                sx={{
                  background: color.firstColor,
                  boxShadow: "5px -5px 15px rgba(0, 0, 0, 0.358) inset",
                }}
              >
                {/* {getUserName()[0]} */}
              {/* </Avatar> */}
              <Typography
                style={{
                  fontWeight: "bold",
                  fontSize: "12px",
                  color: color.firstColor,
                }}
              >
                {/* {getUserName()} */}
              </Typography>
            </div>
          </a>
        </Drawer>
      ) : (
        <AppBar
          position="fixed"
          sx={{
            zIndex: 1300,
            top: "auto",
            bottom: 0,
            background: "white",

            "& .MuiAppBar-root": {
              background: "#0d78be",
            },
          }}
        >
          <Box
            sx={{
              overflowX: "auto",
              display: "flex",
              justifyContent: "flex-start",
              padding: "5px 0px 5px 0",
              "&::-webkit-scrollbar": {
                height: "2px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#0d78be",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f1f1",
                borderRadius: "4px",
              },
            }}
          >
            {icons.map(({ to, icon, title }) => (
              <Tooltip
                key={to}
                title={title}
                placement="top"
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      background: color.thirdColor,
                      color: color.firstColor,
                      fontWeight: "bold",
                      fontSize: "14px",
                      boxShadow: "0px 0px 5px rgba(0,0,0,0.1)",
                      "& .MuiTooltip-arrow": { color: "white" },
                    },
                  },
                }}
              >
                <ListItem
                  //   button
                  component={Link}
                  to={to}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    fontSize: "8px",
                    justifyContent: "center",
                    margin: "10px",
                    marginTop: "0px",
                    marginBottom: "0px",
                    borderRadius: "8px",
                    minWidth: "56px",
                    color:
                      location.pathname !== to
                        ? color.firstColor
                        : color.thirdColor,
                    background:
                      location.pathname !== to
                        ? color.thirdColor
                        : color.background,
                  }}
                >
                  {icon} {title}
                </ListItem>
              </Tooltip>
            ))}
          </Box>
        </AppBar>
      )}
    </>
  );
};

export default Sidebar;
