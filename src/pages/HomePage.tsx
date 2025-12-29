import { Box, Container } from "@mui/material";
import { lazy, Suspense } from "react";
import SectionHeader from "../components/SectionHeader";
import FAQSection from "./Home Section/FAQSection";
import ImageGridLayout from "./Home Section/FeaturesGridLayout";
import HeroSection from "./Home Section/HeroSection";
import ImageGallery from "./Home Section/ImageGallery";
import TestimonialsCarousel from "./Home Section/TestimonialsCarousel";


const LazyHotelCardCarousel = lazy(() => import("./Home Section/HotelCardCarousel"));

const HomePage = () => {
  return (
    <Box>
      <HeroSection></HeroSection>

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