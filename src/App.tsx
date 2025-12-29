import { ThemeProvider } from "@mui/material";
import React, { Suspense, useEffect } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import Footer from "./components/Shared/Footer";
import Header from "./components/Shared/Header";
import "./styles/global.css";
import theme from "./theme";
import PrivateRoute from "./components/PrivateRoute";
import { ToastContainer } from "react-toastify";
import { Box, CircularProgress } from "@mui/material";
import color from "./components/color";
import { logo } from "./Image/Image";
import Agreement from "./pages/Admin/Agreement";
import NewAgreement from "./pages/Admin/NewAgreement";
import TermsAndConditions from "./pages/TermsAndConditions";
import CancellationAndRefundPolicy from "./pages/CancellationAndRefundPolicy";
import ShippingAndDeliveryPolicy from "./pages/ShippingAndDeliveryPolicy";
import InventoryPage from "./pages/Hotel/Inventory";
import HotelBookingsPage from "./pages/Hotel/HotelBookingsPage";
import HotelPaymentsPage from "./pages/Hotel/HotelPaymentsPage";
import HotelReviewsPage from "./pages/Hotel/HotelReviewsPage";
import AdminRevenuePage from "./pages/Admin/AdminRevenue";
import BillingSection from "./pages/BillingSection";
import AllHotelBookingsPage from "./pages/Admin/AdminBookingPage";
import BookingDetails from "./pages/BookingDetails";
import PriceUpdatePage from "./pages/Hotel/PriceUpdate";
import UserLogin from "./pages/UserLogin";
import PrivateRoute1 from "./components/PrivateRoute1";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import HourlyInventoryManagement from "./pages/HourlyInventoriesManagement";
import HotelPriceUpdatePage from "./pages/Admin/HotelPriceUpdate";
import NotFound from "./pages/NotFound";

// Lazy load all pages
const HomePage = React.lazy(() => import("./pages/HomePage"));
const HotelDetails = React.lazy(() => import("./pages/HotelDetails"));
const SearchResults = React.lazy(() => import("./pages/SearchResults"));
const AccountPage = React.lazy(() => import("./pages/Account/AccountPage"));
const BookingSummary = React.lazy(() => import("./pages/BookingSummary"));
const AboutUs = React.lazy(() => import("./pages/AboutUs"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const ContactUs = React.lazy(() => import("./pages/ContactUs"));
const PropertyForm = React.lazy(() => import("./pages/Hotel/PropertyForm"));
const Login = React.lazy(() => import("./pages/Account/Login"));
const Signup = React.lazy(() => import("./pages/Account/Signup"));
const HotelLayout = React.lazy(() => import("./components/Shared/HotelLayout"));
const Dashboard = React.lazy(() => import("./pages/Hotel/Dashboard"));
const MyHotels = React.lazy(() => import("./pages/Hotel/MyHotels"));
const MyHotelDetails = React.lazy(() => import("./pages/Hotel/MyHotelDetails"));
const ApplicationPreview = React.lazy(
  () => import("./pages/Hotel/ApplicationPreview")
);
const MyBookings = React.lazy(() => import("./pages/MyBookings"));
const AdminHomepage = React.lazy(() => import("./pages/Admin/AdminHomepage"));
const AdminDashboard = React.lazy(() => import("./pages/Admin/AdminDashboard"));
const Messages = React.lazy(() => import("./pages/Admin/Messages"));

// Custom loader component with your logo
const Loader = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 2,
      }}
    >
      <img
        src={logo}
        alt="Huts4U Logo"
        style={{ width: "150px", height: "auto" }}
      />
      {/* <CircularProgress sx={{ color: color.firstColor }} /> */}
    </Box>
  );
};

const App: React.FC = () => {
  const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);

    return null;
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <ScrollToTop />
        <Header />
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
           
            <Route path="/search" element={<SearchResults />} />
            <Route path="/hotel/:id" element={<HotelDetails />} />
            <Route path="/user-login" element={<UserLogin/>} />
            <Route path="/booking-summary/:id" element={<BookingSummary />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/contact-us" element={<ContactUs />} />             
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/cancellation" element={<CancellationAndRefundPolicy />} />
            <Route path="/shipping" element={<ShippingAndDeliveryPolicy />} />

             <Route path="/account" element={
               <PrivateRoute1 component={AccountPage}  allowedRoles={["User"]}/>}/>
            
            <Route path="/booking/:id"element={
                <PrivateRoute1
                  component={BookingDetails}
                  allowedRoles={["User"]}
                />
              }  />
            <Route path="/my-bookings" element={<PrivateRoute1
                  component={MyBookings }
                  allowedRoles={["User"]}
                /> } />
            <Route path="/billing" element={<PrivateRoute1
                  component={BillingSection}
                  allowedRoles={["User"]}/>} />
            
            

          
            <Route path="*" element={<NotFound />} />

           
            
           
           
            
            
            
           
        
           
            
              
              
              
              
          </Routes>
        </Suspense>
        <Footer />
      </Router>
      <ToastContainer />
    </ThemeProvider>
  );
};

export default App;
