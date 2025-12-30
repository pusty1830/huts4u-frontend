import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import color from "../components/color";
import SectionHeader from "../components/SectionHeader";
import TestimonialsCarousel from "./Home Section/TestimonialsCarousel";
import { Community, feature2, konarkHero, Mission } from "../Image/Image";
import { Helmet } from "react-helmet-async";

const AboutUs = () => {
  // Data for team members
  const teamMembers = [
    {
      name: "Alice Johnson",
      position: "General Manager",
      image: "https://picsum.photos/200/300?random=1",
    },
    {
      name: "Bob Smith",
      position: "Head Chef",
      image: "https://picsum.photos/200/300?random=2",
    },
    {
      name: "Charlie Davis",
      position: "Sous Chef",
      image: "https://picsum.photos/200/300?random=3",
    },
  ];


  const sections = [
    {
      title: "Company Overview",
      content:
        "Huts4u is a travel-tech startup based in Odisha, built to solve a common problem faced by travellers — the lack of flexible hotel booking options. We provide a digital platform that allows users to book hotel rooms for 3 hours, 6 hours, 12 hours, or full-day stays, based on their convenience.",
      image: konarkHero,
    },
    {
      title: "Our Mission & Vision",
      content:
        "Our mission is to enable flexible, affordable, and hassle-free stays across Odisha, while helping hotels unlock untapped potential.\n\nOur vision is to become Odisha’s most trusted hotel booking platform and eventually expand across India as the go-to app for custom-duration hotel bookings.",
      image: Mission,
    },
    {
      title: "Why Choose Us",
      content:
        "• Flexible booking hours and diverse accommodations.\n• Reliable local support – real people, real help, whenever you need it.\n• Transparent pricing – fair, simple, and built for long-term partnerships.",
      image: Community,
    },
    {
      title: "Ready to Book Your Stay?",
      content:
        "Explore our rooms and make a reservation today to experience comfort like never before. Whether you’re here for business or leisure, our tailored services and state-of-the-art facilities ensure a memorable stay. Join us and discover why our guests return time and time again.",
      image: feature2,
    },
  ];



  return (
    <Box sx={{ background: color.thirdColor }}>
      <Helmet>
        <title>About Us | Huts4u</title>
        <meta
          name="description"
          content="Learn about Huts4u, the best platform for hourly hotel stays in Bhubaneswar."
        />
        <link rel="canonical" href="https://www.huts4u.com/about-us" />
        <script type="application/ld+json">
          {`
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "About Us",
        "url": "https://www.huts4u.com/about-us"
      }
    `}
        </script>
      </Helmet>

      <Container >
        <SectionHeader
          primaryText={" Welcome to Huts4u"}
          subText={
            ""
          }
        ></SectionHeader>

        {sections.map((section, index) => (
          <AlternatingSection
            key={index}
            title={section.title}
            content={section.content}
            image={section.image}
            reverse={index % 2 !== 0}
          />
        ))}

        {/* <SectionHeader
        primaryText={"Team Member"}
        subText={"Meet the team behind our success"}
      ></SectionHeader>
      <Grid container spacing={4}>
        {teamMembers.map((member, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                boxShadow: "none",
                background: color.thirdColor,
                borderRadius: "12px",
              }}
            >
              <CardContent>
                <Avatar
                  src={member.image}
                  alt={member.name}
                  sx={{ width: 100, height: 100, margin: "auto" }}
                />
                <Typography
                  variant="h6"
                  align="center"
                  fontWeight={"bold"}
                  sx={{ color: color.secondColor, mt: 1 }}
                >
                  {member.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  align="center"
                >
                  {member.position}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid> */}

        <SectionHeader
          primaryText={"What They Are Saying"}
          subText={"Our Genuine Customer Reviews"}
        ></SectionHeader>
        <TestimonialsCarousel></TestimonialsCarousel>
      </Container>
    </Box>
  );
};

export default AboutUs;

const AlternatingSection = ({
  title,
  content,
  image,
  reverse = false,
}: any) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: reverse ? "row-reverse" : "row" },
        alignItems: "center",
        textAlign: "left",
        my: 4,
        gap: 2,
        //   border:'solid 2px',
        borderColor: color.firstColor,
        p: 2,
        borderRadius: 2,
        boxShadow: "4px 4px 10px rgba(104, 39, 184, 0.17)",
      }}
    >
      <CardMedia
        component="img"
        sx={{
          height: 200,
          width: { xs: "100%", md: 300 },
          minHeight: 200,
          minWidth: 300,
          borderRadius: 2,
        }}
        image={image}
        alt={title}
      />
      <Box mt={1}>
        <Typography
          variant="h4"
          gutterBottom
          fontWeight={"bold"}
          sx={{ color: color.firstColor }}
        >
          {title}
        </Typography>
        <Typography variant="body1" textAlign={"left"}>
          {content}
        </Typography>
      </Box>
    </Box>
  );
};
