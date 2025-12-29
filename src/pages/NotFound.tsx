import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { logo } from "../Image/Image";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #f3e9ff 0%, #ffffff 60%)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={4} alignItems="center" textAlign="center">
          {/* Logo */}
          <Box
            component="img"
            src={logo}
            alt="Huts4u"
            sx={{
              height: 70,
              mb: 1,
            }}
          />

          {/* 404 */}
          <Typography
            sx={{
              fontSize: { xs: "80px", md: "140px" },
              fontWeight: 900,
              lineHeight: 1,
              background:
                "linear-gradient(90deg, #6a1b9a, #9c27b0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            404
          </Typography>

          {/* Message */}
          <Typography variant="h5" fontWeight={700}>
            Looks like you’re off the map
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 520 }}
          >
            The page you’re searching for doesn’t exist or may have been moved.
            Let’s guide you back to discovering amazing stays with{" "}
            <b>Huts4u</b>.
          </Typography>

          {/* Buttons */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              sx={{
                px: 5,
                py: 1.4,
                borderRadius: "40px",
                background:
                  "linear-gradient(90deg, #6a1b9a, #8e24aa)",
                boxShadow: "0 10px 25px rgba(106,27,154,0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(90deg, #4a148c, #7b1fa2)",
                },
              }}
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>

            <Button
              variant="outlined"
              size="large"
              sx={{
                px: 5,
                py: 1.4,
                borderRadius: "40px",
                borderColor: "#6a1b9a",
                color: "#6a1b9a",
                "&:hover": {
                  backgroundColor: "rgba(106,27,154,0.05)",
                },
              }}
              onClick={() => navigate("/contact")}
            >
              Contact Support
            </Button>
          </Stack>

          {/* Footer line */}
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Huts4u · Find your perfect stay
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default NotFound;
