import AcUnitIcon from "@mui/icons-material/AcUnit";
import AirportShuttleIcon from "@mui/icons-material/AirportShuttle";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CasinoIcon from "@mui/icons-material/Casino";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import FireExtinguisherIcon from "@mui/icons-material/FireExtinguisher";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import FreeBreakfastIcon from "@mui/icons-material/FreeBreakfast";
import KingBedIcon from "@mui/icons-material/KingBed";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import LocalLaundryServiceIcon from "@mui/icons-material/LocalLaundryService";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import NightlifeIcon from "@mui/icons-material/Nightlife";
import OutdoorGrillIcon from "@mui/icons-material/OutdoorGrill";
import PetsIcon from "@mui/icons-material/Pets";
import PoolIcon from "@mui/icons-material/Pool";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import SpaIcon from "@mui/icons-material/Spa";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import TvIcon from "@mui/icons-material/Tv";
import WifiIcon from "@mui/icons-material/Wifi";

export const amenityIcons: { [key: string]: JSX.Element } = {
  "Swimming Pool": <PoolIcon fontSize="small" />,
  Gym: <FitnessCenterIcon fontSize="small" />,
  "Free WiFi": <WifiIcon fontSize="small" />,
  "Private Beach": <BeachAccessIcon fontSize="small" />,
  Breakfast: <FreeBreakfastIcon fontSize="small" />,
  Parking: <LocalParkingIcon fontSize="small" />,
  Spa: <SpaIcon fontSize="small" />,
  Restaurant: <LocalDiningIcon fontSize="small" />,
  "Airport Shuttle": <AirportShuttleIcon fontSize="small" />,
  "Business Center": <BusinessCenterIcon fontSize="small" />,
  "Pet Friendly": <PetsIcon fontSize="small" />,
  Bar: <LocalBarIcon fontSize="small" />,
  "Room Service": <RoomServiceIcon fontSize="small" />,
  TV: <TvIcon fontSize="small" />,
  "Air Conditioning": <AcUnitIcon fontSize="small" />,
  "Laundry Service": <LocalLaundryServiceIcon fontSize="small" />,
  "Child Care": <ChildCareIcon fontSize="small" />,
  "King Bed": <KingBedIcon fontSize="small" />,
  Casino: <CasinoIcon fontSize="small" />,
  "Car Rental": <DirectionsCarIcon fontSize="small" />,
  "Night Club": <NightlifeIcon fontSize="small" />,
  "Tennis Court": <SportsTennisIcon fontSize="small" />,
  "BBQ Facilities": <OutdoorGrillIcon fontSize="small" />,
  "Fire Safety": <FireExtinguisherIcon fontSize="small" />,
};


export const amenitiesOptions = [
  "Swimming Pool",
  "Gym",
  "Free WiFi",
  "Private Beach",
  "Breakfast",
  "Parking",
  "Spa",
  "Restaurant",
  "Airport Shuttle",
  "Business Center",
  "Pet Friendly",
  "Bar",
  "Room Service",
  "TV",
  "Air Conditioning",
  "Laundry Service",
  "Child Care",
  "King Bed",
  "Casino",
  "Car Rental",
  "Night Club",
  "Tennis Court",
  "BBQ Facilities",
  "Fire Safety",
];


export const roomTypes = [
  /* ================= BASIC ROOMS ================= */
  {
    value: "Single Non-AC Room",
    label: "Single Non-AC Room",
    details: "A basic room with a single bed and fan cooling, ideal for solo travelers.",
  },
  {
    value: "Single AC Room",
    label: "Single AC Room",
    details: "An air-conditioned room with a single bed, ideal for solo travelers.",
  },
  {
    value: "Double Non-AC Room",
    label: "Double Non-AC Room",
    details: "A non air-conditioned room with a double or twin bed, suitable for two guests.",
  },
  {
    value: "Double AC Room",
    label: "Double AC Room",
    details: "An air-conditioned room with a double or twin bed, suitable for two guests.",
  },
  {
    value: "Triple Non-AC Room",
    label: "Triple Non-AC Room",
    details: "A non air-conditioned room designed for three guests, with an extra bed.",
  },
  {
    value: "Triple AC Room",
    label: "Triple AC Room",
    details: "An air-conditioned room designed for three guests, with an extra bed or sofa bed.",
  },

  /* ================= PREMIUM ROOMS ================= */
  {
    value: "Deluxe Non-AC Room",
    label: "Deluxe Non-AC Room",
    details: "A spacious non air-conditioned room with upgraded interiors and comfort amenities.",
  },
  {
    value: "Deluxe AC Room",
    label: "Deluxe AC Room",
    details: "A spacious air-conditioned room with upgraded interiors and enhanced comfort.",
  },
  {
    value: "Executive AC Room",
    label: "Executive AC Room",
    details: "Designed for business travelers with a work desk, premium amenities, and air conditioning.",
  },
  {
    value: "Club AC Room",
    label: "Club AC Room",
    details: "Premium category offering lounge access, complimentary breakfast, and AC comfort.",
  },

  /* ================= SUITES ================= */
  {
    value: "Suite Room",
    label: "Suite Room",
    details: "A large room with a separate living area, suitable for families or executives.",
  },
  {
    value: "Presidential Suite",
    label: "Presidential Suite",
    details: "A luxury suite with multiple rooms, high-end furnishings, and personalized services.",
  },
  {
    value: "Royal Suite",
    label: "Royal Suite",
    details: "Inspired by Indian royalty, featuring grand interiors and luxury amenities.",
  },
  {
    value: "Heritage Room",
    label: "Heritage Room",
    details: "Traditional décor and antique furnishings, commonly found in heritage hotels.",
  },

  /* ================= SPECIAL STAYS ================= */
  {
    value: "Cottage/Villa",
    label: "Cottage/Villa",
    details: "Standalone accommodation with private spaces, often available in resorts.",
  },
  {
    value: "Treehouse Room",
    label: "Treehouse Room",
    details: "Elevated rooms offering a unique stay experience in nature-focused retreats.",
  },
  {
    value: "Houseboat Room",
    label: "Houseboat Room",
    details: "Floating hotel rooms offering a unique stay experience in backwaters.",
  },
  {
    value: "Studio Apartment",
    label: "Studio Apartment",
    details: "A self-contained unit with a kitchenette, suitable for extended stays.",
  },
  {
    value: "Serviced Apartment",
    label: "Serviced Apartment",
    details: "Fully furnished apartments with hotel-like services and amenities.",
  },
];
