import { ThemeProvider, Box } from "@mui/material";
import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Shared/Header";
import Footer from "./components/Shared/Footer";
import { ToastContainer } from "react-toastify";
import "./styles/global.css";
import theme from "./theme";
import color from "./components/color";
import { logo } from "./Image/Image";
import PrivateRoute1 from "./components/PrivateRoute1";

// Small static pages (import normally for faster load)
import TermsAndConditions from "./pages/TermsAndConditions";
import CancellationAndRefundPolicy from "./pages/CancellationAndRefundPolicy";
import ShippingAndDeliveryPolicy from "./pages/ShippingAndDeliveryPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactUs from "./pages/ContactUs";
import UserLogin from "./pages/UserLogin";
import BillingSection from "./pages/BillingSection";
import NotFound from "./pages/NotFound";
import PaymentReturn from "./pages/PaymentReturn";

// Lazy-loaded pages (large or less frequent)
const HomePage = React.lazy(() => import("./pages/HomePage"));
const HotelDetails = React.lazy(() => import("./pages/HotelDetails"));
const SearchResults = React.lazy(() => import("./pages/SearchResults"));
const AccountPage = React.lazy(() => import("./pages/Account/AccountPage"));
const BookingSummary = React.lazy(() => import("./pages/BookingSummary"));
const AboutUs = React.lazy(() => import("./pages/AboutUs"));
const BlogPage = React.lazy(() => import("./pages/BlogPage"));
const BlogDetailPage = React.lazy(() => import("./pages/BlogDetailsPage"));
const BookingDetails = React.lazy(() => import("./pages/BookingDetails"));
const MyBookings = React.lazy(() => import("./pages/MyBookings"));

// Minimal Loader component for mobile speed
const Loader = () => (
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
    <img loading="lazy" src={logo} alt="Huts4U Logo" style={{ width: "120px", height: "auto" }} />
  </Box>
);

const App: React.FC = () => {
  // Scroll to top on route change
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
            {/* Public Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/hotel/:id" element={<HotelDetails />} />
            <Route path="/user-login" element={<UserLogin />} />
            <Route path="/booking-summary/:id" element={<BookingSummary />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/cancellation" element={<CancellationAndRefundPolicy />} />
            <Route path="/shipping" element={<ShippingAndDeliveryPolicy />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />

            {/* Private User Pages */}
            <Route
              path="/account"
              element={<PrivateRoute1 component={AccountPage} allowedRoles={["User"]} />}
            />
            <Route path="/payment/return" element={<PaymentReturn />} />
            <Route
              path="/booking/:id"
              element={<PrivateRoute1 component={BookingDetails} allowedRoles={["User"]} />}
            />
            <Route
              path="/my-bookings"
              element={<PrivateRoute1 component={MyBookings} allowedRoles={["User"]} />}
            />
            <Route
              path="/billing"
              element={<PrivateRoute1 component={BillingSection} allowedRoles={["User"]} />}
            />

            {/* 404 Page */}
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
