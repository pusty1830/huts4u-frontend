import React, { lazy, Suspense } from "react";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import { Helmet } from "react-helmet-async";

import SectionHeader from "../components/SectionHeader";
import FAQSection from "./Home Section/FAQSection";
import ImageGridLayout from "./Home Section/FeaturesGridLayout";
import HeroSection from "./Home Section/HeroSection";
import ImageGallery from "./Home Section/ImageGallery";
import TestimonialsCarousel from "./Home Section/TestimonialsCarousel";




const LazyHotelCardCarousel = lazy(() => import("./Home Section/HotelCardCarousel"));
const LazyBlogPage = lazy(() => import("./BlogPage"))



const HomePage = () => {


  return (
    <Box sx={{ overflowY: "hidden" }}>
      <Helmet>
        <title>Huts4U: Hourly & Full Day Hotel Stays in Bhubaneswar</title>

        <meta
          name="description"
          content="Book hourly and overnight hotel stays in Bhubaneswar with Huts4U. Clean rooms, flexible check-ins, and best prices."
        />

        <link rel="canonical" href="https://huts4u.com/" />

        {/* Website Schema – REQUIRED for sitelinks */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://huts4u.com/#website",
            "url": "https://huts4u.com",
            "name": "Huts4U",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://huts4u.com/search?location={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>

        {/* Organization Schema – fixes logo & brand */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://huts4u.com/#organization",
            "name": "Huts4U",
            "url": "https://huts4u.com",
            "logo": "https://huts44u.s3.ap-south-1.amazonaws.com/hutlogo-removebg-preview.png",
            "sameAs": [
              "https://www.instagram.com/huts4u",
              "https://www.facebook.com/huts4u"
            ]
          })}
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