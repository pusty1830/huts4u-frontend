import {
  AccountCircle,
  ChevronRightRounded,
  ContactMail,
  CorporateFare,
  Home,
  Hotel,
  HotelOutlined,
  Info,
  Logout,
  Menu,
  PersonOutline,
  Login,
} from "@mui/icons-material";
import {
  AppBar,
  Button,
  CardMedia,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Popover,
  Toolbar,
  useMediaQuery,
  Box,
  Divider,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  getUserName,
  getUserRole,
  isLoggedIn,
  logout,
} from "../../services/axiosClient";
import color from "../color";
import CustomButton from "../CustomButton";
import { getProfile } from "../../services/services";
import { logo, logoBg } from "../../Image/Image";
import { Inventory } from "@mui/icons-material";
import dayjs from "dayjs";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "user-popover" : undefined;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const userRoll = getUserRole();
  
  // Default location for search
  const DEFAULT_LOCATION = "Bhubaneswar, Odisha";
  
  // Function to navigate to search page with default parameters
  const navigateToSearch = () => {
    const today = dayjs().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, 'day').format("YYYY-MM-DD");
    
    // For non-hourly bookings (fullDay/villa)
    const searchParams = new URLSearchParams({
      bookingType: "fullDay",
      location: DEFAULT_LOCATION,
      checkinDate: today,
      checkOutDate: tomorrow,
      rooms: "1",
      adults: "2",
      children: "0",
      nights: "1"
    });
    
    navigate(`/search?${searchParams.toString()}`);
  };

  const navLinks =
    userRoll === "Hotel"
      ? [
        { label: "Home", icon: <CorporateFare />, path: "/my-hotels" },
        { label: "Reviews", icon: <ContactMail />, path: "/review" },
        { label: "Bookings", icon: <Inventory />, path: "/booking" },
        { label: "Fullday Inventory", icon: <Inventory />, path: "/inventory" },
        { label: "Hourly Inventory", icon: <Inventory />, path: "/hourly-inventory" },
        { label: "Revenue Generated", icon: <Inventory />, path: "/hotel-payment" },
        { label: "Price Update", icon: <Inventory />, path: "/price" },
      ] : userRoll === "customercare" ? [
        { label: "Home", icon: <CorporateFare />, path: "/" },
        { label: "Messages", icon: <Info />, path: "/messages" },
        { label: " All Bookings", icon: <Inventory />, path: "/all-booking" },
      ]
        : userRoll === "Admin"
          ? [
            {
              label: "Home",
              icon: <CorporateFare />,
              path: "/admin-homepage",
            },
            { label: " All Bookings", icon: <Inventory />, path: "/all-booking" },
            {
              label: "Admin Dashboard",
              icon: <PersonOutline />,
              path: "/admin-dashboard",
            },
            {
              label: "Admin Revenue",
              icon: <PersonOutline />,
              path: "/admin/revenue",
            },
            {
              label: "Booking Hotels",
              icon: <Hotel />,
              onClick: navigateToSearch,
            },
            { label: "Hotel Applications", icon: <Hotel />, path: "/hotel-applications" },
            { label: "Hotel Price Update", icon: <Inventory />, path: "/hotel-price" },
            { label: "Add Hotel", icon: <Hotel />, path: "/signup" },
            { label: "Messages", icon: <Info />, path: "/messages" },
            { label: "Agreement", icon: <Info />, path: "/agreement" },
          ]
          : [
            { label: "Home", icon: <Home />, path: "/" },
            { label: "Hotels", icon: <Hotel />, onClick: navigateToSearch },
            { label: "Contact", icon: <ContactMail />, path: "/contact-us" },
            { label: "About", icon: <Info />, path: "/about-us" },
          ];

  const location = useLocation();
  const isHotelDetailPage = matchPath("/hotel/:id", location.pathname);

  const [user, setUser] = useState<any>({})
  useEffect(() => {
    if (isLoggedIn()) {
      getProfile().then((res) => {
        setUser(res?.data?.data)
      }).catch((err) => {
        console.log(err)
      })
    }
  }, [])

  const loggedIn = isLoggedIn();

  return (
    <AppBar
      sx={{
        background: color.background,
        p: 0,
        zIndex: 100,
        position: isHotelDetailPage ? "relative" : "sticky",
        boxShadow: "none",
        top: 0,
      }}
    >
      <Toolbar
        style={{
          padding: 0,
          display: "flex",
          justifyContent: "space-between",
          color: color.thirdColor,
        }}
      >
        <div style={{ width: "fit-content", display: "flex" }}>
          <CardMedia
            component="img"
            sx={{
              height: "64px",
              width: "120px",
            }}
            image={logoBg}
          />
          <CardMedia
            onClick={() => {
              navigate("/");
            }}
            component="img"
            sx={{
              height: "70px",
              width: "100px",
              objectFit: "contain",
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
            }}
            image={logo}
          />

          {!isMobile &&
            navLinks.map((link) => (
              <Button
                id="button"
                key={link.label}
                color="inherit"
                onClick={link.onClick ? link.onClick : () => navigate(link.path!)}
              >
                {link.label}
              </Button>
            ))}
        </div>

        <div style={{ marginRight: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {loggedIn ? (
              // Logged in user section
              <>
                {!isMobile && getUserRole() === "Hotel" && (
                  <CustomButton
                    onClick={() => {
                      navigate("/property-registration");
                    }}
                    variant="contained"
                    customStyles={{
                      fontSize: "12px",
                      marginRight: "20px",
                    }}
                  >
                    Join as hotelier
                  </CustomButton>
                )}
                <IconButton
                  style={{
                    background: color.thirdColor,
                    color: color.firstColor,
                    borderRadius: '50%',
                    height: '40px',
                    width: '40px'
                  }}
                  color="inherit"
                  onClick={handleClick}
                >
                  {getUserName() ? getUserName().charAt(0).toUpperCase() : <PersonOutline />}
                </IconButton>
              </>
            ) : (
              // Not logged in user section (DESKTOP ONLY)
              <>
                {!isMobile && (
                  <>
                    <CustomButton
                      variant="contained"
                      onClick={() => navigate("/user-login")}
                      customStyles={{
                        fontSize: "12px",
                      }}
                      startIcon={<Login />}
                    >
                      Login
                    </CustomButton>
                  </>
                )}
              </>
            )}

            {isMobile && (
              <IconButton color="inherit" onClick={toggleDrawer(true)}>
                <Menu />
              </IconButton>
            )}
          </div>

          {/* Drawer for mobile navigation */}
          <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
            <Box
              sx={{
                width: 280,
                background: color.thirdColor,
                height: "100%",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Logo Section */}
              <Box sx={{ p: 2, textAlign: "center", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                <CardMedia
                  onClick={() => {
                    navigate("/");
                    setDrawerOpen(false);
                  }}
                  component="img"
                  sx={{
                    height: "60px",
                    width: "100px",
                    objectFit: "contain",
                    margin: "0 auto",
                    cursor: "pointer"
                  }}
                  image={logo}
                />
              </Box>

              {/* Login Button at TOP (only when NOT logged in) */}
              {!loggedIn && (
                <Box sx={{ p: 2, pb: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      navigate('/user-login');
                      setDrawerOpen(false);
                    }}
                    sx={{
                      background: color.background,
                      color: color.thirdColor,
                      borderRadius: "8px",
                      py: 1.5,
                      fontSize: "15px",
                      fontWeight: "600",
                      textTransform: "none",
                      mb: 2,
                      '&:hover': {
                        background: color.firstColor,
                      }
                    }}
                    startIcon={<Login />}
                  >
                    Login
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      window.location.href="https://hotel.huts4u.com/signup"
                      setDrawerOpen(false);
                    }}
                    sx={{
                      borderColor: color.background,
                      color: color.background,
                      borderRadius: "8px",
                      py: 1.5,
                      fontSize: "15px",
                      fontWeight: "600",
                      textTransform: "none",
                      '&:hover': {
                        borderColor: color.firstColor,
                        color: color.firstColor,
                        background: "rgba(75, 42, 173, 0.05)"
                      }
                    }}
                    startIcon={<HotelOutlined />}
                  >
                    Join As Hotel
                  </Button>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Navigation Links */}
              <List sx={{ flex: 1, overflowY: "auto", p: 0 }}>
                {navLinks.map((link) => (
                  <ListItem key={link.label} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        if (link.onClick) {
                          link.onClick();
                        } else {
                          navigate(link.path!);
                        }
                        setDrawerOpen(false);
                      }}
                      sx={{
                        py: 1.5,
                        px: 2,
                        borderBottom: "1px solid rgba(0,0,0,0.05)"
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          mr: 2,
                          p: 0.5,
                          background: color.background,
                          borderRadius: "50%",
                          color: color.thirdColor,
                          width: "32px",
                          height: "32px",
                          minWidth: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {link.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={link.label}
                        primaryTypographyProps={{
                          fontSize: "15px",
                          fontWeight: "500"
                        }}
                      />
                      <ChevronRightRounded sx={{ color: "#666" }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>

              {/* Logout option at bottom (only when logged in) */}
              {loggedIn && (
                <Box sx={{ p: 2, borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      logout();
                      setDrawerOpen(false);
                    }}
                    sx={{
                      borderColor: "#dc3545",
                      color: "#dc3545",
                      borderRadius: "8px",
                      py: 1.5,
                      fontSize: "15px",
                      fontWeight: "600",
                      textTransform: "none",
                      '&:hover': {
                        borderColor: "#c82333",
                        color: "#c82333",
                        background: "rgba(220, 53, 69, 0.05)"
                      }
                    }}
                    startIcon={<Logout />}
                  >
                    Logout
                  </Button>
                </Box>
              )}
            </Box>
          </Drawer>

          {/* User Popover */}
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            style={{ marginTop: "12px", borderRadius: "12px" }}
          >
            <MenuList
              style={{
                borderRadius: "12px",
                padding: "10px",
                fontSize: "14px",
                background: color.thirdColor,
                boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.11)",
              }}
            >
              <MenuItem
                sx={{
                  fontSize: "18px",
                  fontWeight: "600",
                  borderBottom: "solid 1px rgba(0, 0, 0, 0.22)",
                  mb: 1,
                  pb: 1,
                }}
              >
                Hi, {user.userName}
              </MenuItem>
              <MenuItem
                style={{ fontSize: "inherit", borderRadius: "52px" }}
                onClick={() => {
                  navigate("/account");
                  handleClose();
                }}
              >
                <AccountCircle
                  sx={{
                    mr: 1,
                    p: 0.5,
                    background: color.background,
                    borderRadius: "50%",
                    color: "white",
                  }}
                />
                Your Profile
              </MenuItem>
              {getUserRole() === 'User' && (
                <MenuItem
                  style={{ fontSize: "inherit", borderRadius: "52px" }}
                  onClick={() => {
                    navigate("/my-bookings");
                    handleClose();
                  }}
                >
                  <CorporateFare
                    sx={{
                      mr: 1,
                      background: color.background,
                      borderRadius: "50%",
                      color: "white",
                      p: 0.5,
                    }}
                  />
                  My Bookings
                </MenuItem>
              )}
              <MenuItem
                style={{ fontSize: "inherit", borderRadius: "52px" }}
                onClick={() => logout()}
              >
                <Logout
                  sx={{
                    mr: 1,
                    background: color.background,
                    borderRadius: "50%",
                    color: "white",
                    p: 0.5,
                  }}
                />
                Logout
              </MenuItem>
            </MenuList>
          </Popover>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;