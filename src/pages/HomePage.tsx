import { Box, Button, Container, Typography, Grid, Card, CardMedia, CardContent, Stack, Chip } from "@mui/material";
import { lazy, Suspense } from "react";
import SectionHeader from "../components/SectionHeader";
import FAQSection from "./Home Section/FAQSection";
import ImageGridLayout from "./Home Section/FeaturesGridLayout";
import HeroSection from "./Home Section/HeroSection";
import ImageGallery from "./Home Section/ImageGallery";
import TestimonialsCarousel from "./Home Section/TestimonialsCarousel";
import { Helmet } from "react-helmet-async";
import { blogPosts } from "../components/blog";
import { Link } from "react-router-dom";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';


const LazyHotelCardCarousel = lazy(() => import("./Home Section/HotelCardCarousel"));
const LazyBlogPage=lazy(()=>import("./BlogPage"))



const HomePage = () => {
  const latestThree = blogPosts.slice(0, 3);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Box sx={{overflowY:"hidden"}}>
      <Helmet>
        <title>Hourly Hotel Stays in Bhubaneswar | Huts4u</title>
        <meta
          name="description"
          content="Hourly hotel stays in Bhubaneswar with comfortable rooms at great prices and flexible booking options."
        />
        <link rel="canonical" href="https://www.huts4u.com/" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Hotel",
              "name": "Huts4u",
              "url": "https://www.huts4u.com",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Bhubaneswar",
                "addressCountry": "IN"
              },
              "priceRange": "₹₹",
              "amenityFeature": {
                "@type": "LocationFeatureSpecification",
                "name": "Hourly Hotel Booking",
                "value": true
              }
            }
          `}
        </script>
      </Helmet>

      <HeroSection></HeroSection>
      {/* <ContentSection/> */}

      <Container sx={{ maxWidth: "1500px !important", overflow: "hidden" }}>
        <ImageGallery></ImageGallery>

        <SectionHeader
          primaryText={"Discover Top Rooms"}
          subText={"Raising Comfort To The Highest Level"}
        ></SectionHeader>

        {/* Wrap the lazy-loaded component in Suspense */}
        <Suspense fallback={<div>Loading hotels...</div>}>
          <LazyHotelCardCarousel />
        </Suspense>

        <ImageGridLayout></ImageGridLayout>

        <SectionHeader
          primaryText={"What They Are Saying"}
          subText={"Our Genuine Customer Reviews"}
        ></SectionHeader>
        <TestimonialsCarousel></TestimonialsCarousel>


      <Suspense fallback={<div>Loading Blog...</div>}>
          <LazyBlogPage />
        </Suspense>
        

        <SectionHeader
          primaryText={"Frequently Asked Questions"}
          subText={"Answers to Your Most Common Questions"}
        ></SectionHeader>

        <FAQSection></FAQSection>
      </Container>
    </Box>
  );
};

export default HomePage;