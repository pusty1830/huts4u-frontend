import React from "react";
import { blogPosts } from "../components/blog";
import { Link, useLocation,LinkProps } from "react-router-dom";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { styled } from "@mui/material/styles";
import { ButtonProps } from "@mui/material/Button";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { Helmet } from "react-helmet-async";
import color from "../components/color";


const BlogPage: React.FC = () => {
  const location = useLocation();
  const isHomepage = location.pathname === "/";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const displayedPosts = isHomepage ? blogPosts.slice(0, 3) : blogPosts;
  const { firstColor, secondColor, forthColor } = color;

  // Color helpers
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "60,0,105";
  };

  const darkenColor = (colorHex: string, percent: number): string => {
    const num = parseInt(colorHex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return "#" + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  };

  // Styled Components
  const StyledCard = styled(Card)(() => ({
    height: "480px",
    display: "flex",
    flexDirection: "column",
    borderRadius: "20px",
    overflow: "hidden",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    boxShadow: `0 8px 25px rgba(${hexToRgb(firstColor)}, 0.08)`,
    border: `1px solid rgba(${hexToRgb(firstColor)}, 0.08)`,
    backgroundColor: "#ffffff",
    '&:hover': {
      transform: "translateY(-12px) scale(1.01)",
      boxShadow: `0 25px 50px rgba(${hexToRgb(firstColor)}, 0.2)`,
      borderColor: firstColor,
      '& .read-more-btn': {
        backgroundColor: darkenColor(firstColor, 15),
        paddingRight: "32px",
        '& .arrow-icon': {
          transform: "translateX(8px)",
          opacity: 1
        }
      },
      '& .card-image': {
        transform: "scale(1.1)"
      }
    }
  }));

  const CategoryChip = styled(Chip)(() => ({
    position: "absolute",
    top: "20px",
    left: "20px",
    background: `linear-gradient(135deg, ${firstColor} 0%, ${secondColor} 100%)`,
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "0.7rem",
    height: "26px",
    zIndex: 2,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    '& .MuiChip-label': {
      padding: "0 14px"
    }
  }));

  type ReadMoreButtonProps = ButtonProps & LinkProps;

  const ReadMoreButton = styled(Button)<ReadMoreButtonProps>(({ theme }) => ({
    background: `linear-gradient(135deg, ${firstColor} 0%, ${secondColor} 100%)`,
    color: "#ffffff",
    fontWeight: "700",
    padding: "12px 28px",
    borderRadius: "50px",
    textTransform: "none",
    fontSize: "0.95rem",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "auto",
    width: "fit-content",
    boxShadow: `0 4px 15px rgba(${hexToRgb(firstColor)}, 0.3)`,
    '&:hover': {
      background: `linear-gradient(135deg, ${darkenColor(firstColor, 10)} 0%, ${darkenColor(secondColor, 10)} 100%)`,
      boxShadow: `0 8px 25px rgba(${hexToRgb(firstColor)}, 0.4)`,
      transform: "translateY(-2px)"
    }
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getReadTime = (content: string) => {
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  return (
    <>
      {/* Page Title */}
      <Helmet>
        <title>{isHomepage ? "Latest Travel Tips | Huts4u Blog" : "Huts4u Blog | Hourly Hotel Guides & Travel Tips"}</title>
      </Helmet>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        {/* Homepage Section Title */}
        {isHomepage && (
          <Box sx={{ mb: { xs: 4, md: 8 }, textAlign: "center" }}>
            <Typography
              variant="h2"
              sx={{ fontWeight: 800, color: firstColor, mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}
            >
              Latest Travel Insights
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: forthColor, maxWidth: "700px", mx: "auto", mb: 4, fontSize: { xs: '1rem', md: '1.25rem' }, lineHeight: 1.6 }}
            >
              Discover expert tips, hotel guides, and travel hacks for your next stay in Bhubaneswar
            </Typography>
          </Box>
        )}

        {/* Blog Page Header (for /blog page) */}
        {!isHomepage && (
          <Box sx={{ mb: { xs: 4, md: 6 }, textAlign: "center" }}>
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, color: firstColor, mb: 2, fontSize: { xs: '1.75rem', md: '2.5rem' } }}
            >
              Our Blog
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: forthColor, maxWidth: "700px", mx: "auto", mb: 4, fontSize: { xs: '0.95rem', md: '1.1rem' }, lineHeight: 1.6 }}
            >
              Explore all our latest articles, hotel guides, travel tips, and insights to make your stays more comfortable and enjoyable.
            </Typography>
          </Box>
        )}

        {/* Blog Posts Grid */}
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {displayedPosts.map(post => (
            <Grid item xs={12} md={6} lg={isHomepage ? 4 : 4} key={post.id}>
              <StyledCard>
                <Box sx={{ position: "relative", overflow: "hidden" }}>
                  <Box sx={{ height: "220px", overflow: "hidden" }}>
                    <CardMedia
                      component="img"
                      height="220"
                      image={post.image}
                      alt={post.title}
                      title={post.title}
                      sx={{ objectFit: "cover", transition: "transform 0.6s ease", width: "100%" }}
                      loading="lazy"
                    />
                  </Box>
                  <CategoryChip label={post.category || "Travel Guide"} size="small" />
                  <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "80px", background: `linear-gradient(to top, rgba(${hexToRgb(firstColor)}, 0.3), transparent)` }} />
                </Box>

                <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: { xs: 2.5, md: 3.5 } }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", color: firstColor, backgroundColor: `${firstColor}10`, padding: "4px 12px", borderRadius: "20px" }}>
                      <CalendarTodayIcon sx={{ fontSize: 14, mr: 1 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.7rem" }}>{formatDate(post.publishedDate)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", color: secondColor, backgroundColor: `${secondColor}10`, padding: "4px 12px", borderRadius: "20px" }}>
                      <AccessTimeIcon sx={{ fontSize: 14, mr: 1 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.7rem" }}>{getReadTime(post.content)}</Typography>
                    </Box>
                  </Stack>

                  <Typography component="h3" variant="h6" sx={{ fontWeight: 800, mb: 2, color: firstColor, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    {post.title}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 3.5, color: forthColor, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.7, fontSize: "0.9rem" }}>
                    {post.summary}
                  </Typography>

                  <ReadMoreButton
                    variant="contained"
                    component={Link}
                    to={`/blog/${post.slug}`}
                    aria-label={`Read more about ${post.title}`}
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
                  >
                    Continue Reading
                  </ReadMoreButton>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>

        {/* Homepage “View All” Button */}
        {isHomepage && blogPosts.length > 3 && (
          <Box sx={{ textAlign: "center", mt: { xs: 4, md: 8 } }}>
            <Button
              component={Link}
              to="/blog"
              variant="outlined"
              sx={{
                borderColor: firstColor,
                color: firstColor,
                borderWidth: 2,
                borderRadius: "50px",
                padding: { xs: "10px 32px", md: "14px 48px" },
                fontSize: { xs: "0.95rem", md: "1.1rem" },
                fontWeight: 800,
                textTransform: "none",
                transition: "all 0.3s ease",
                '&:hover': {
                  borderColor: darkenColor(firstColor, 20),
                  backgroundColor: `${firstColor}08`,
                  transform: "translateY(-3px)"
                }
              }}
              endIcon={<ArrowForwardIcon />}
            >
              Explore All Articles
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
};

export default BlogPage;
