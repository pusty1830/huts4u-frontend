import {
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  Popper,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  ListItemIcon,
  IconButton,
  InputAdornment,
} from "@mui/material";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { getCurrentLocation } from "../GeoLocations";
import color from "./color";
import { GOOGLE_MAPS_API_KEY1, MAPBOX_ACCESS_TOKEN } from "../services/Secret";
import { getAllHotels } from "../services/services";
import {
  LocationOn,
  Hotel,
  Place,
  Business,
  Home,
  Villa,
  Close,
} from "@mui/icons-material";

const GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY1;

// Define PlaceResult type for TypeScript
interface PlaceResult {
  formatted_address?: string;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  place_id?: string;
  name?: string;
}

// Define Hotel interface
interface HotelType {
  id: string;
  propertyName: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
}

interface AutocompleteProps {
  label: string;
  onSelect: (place: any) => void;
  value: string;
  setValue: (value: string | null) => void;
}

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const LocationPicker: React.FC<AutocompleteProps> = ({
  label,
  onSelect,
  value,
  setValue,
}) => {
  // Track if it's initial load
  const initialLoadRef = useRef(true);
  const [input, setInput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [hotelSuggestions, setHotelSuggestions] = useState<HotelType[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentLocationLoading, setCurrentLocationLoading] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<boolean>(true);
  const [showPermissionDialog, setShowPermissionDialog] = useState<boolean>(false);
  const [permissionRequested, setPermissionRequested] = useState<boolean>(false);
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [isHotelsLoaded, setIsHotelsLoaded] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const scriptLoadedRef = useRef<boolean>(false);
  const mapboxToken = MAPBOX_ACCESS_TOKEN;

  // Fetch all hotels on component mount
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const hotelPayload = {
          data: { filter: "", status: "Approved" },
          page: 0,
          pageSize: 1000,
          order: [["createdAt", "ASC"]],
        };
        const hotelRes = await getAllHotels(hotelPayload);
        const hotelData = hotelRes?.data?.data?.rows || [];
        
        // Extract hotel names and locations
        const formattedHotels: HotelType[] = hotelData.map((hotel: any) => ({
          id: hotel.id,
          propertyName: hotel.propertyName || "",
          address: hotel.address || "",
          city: hotel.city || "",
          latitude: hotel.latitude || 0,
          longitude: hotel.longitude || 0,
          propertyType: hotel.propertyType || "",
        }));
        
        setHotels(formattedHotels);
        setIsHotelsLoaded(true);
        console.log("Hotels loaded for search:", formattedHotels.length);
      } catch (error) {
        console.error("Error fetching hotels:", error);
      }
    };
    
    fetchHotels();
  }, []);

  // Set default "Bhubaneswar" on initial load only
  useEffect(() => {
    if (initialLoadRef.current) {
      // Only set Bhubaneswar if no value is provided from parent
      if (!value) {
        setInput("Bhubaneswar");
        setValue("Bhubaneswar");
        
        // Set default Bhubaneswar location
        onSelect({
          display_name: "Bhubaneswar",
          lat: 20.2961,
          lon: 85.8245,
          place_id: null,
          name: "Bhubaneswar",
          type: 'location',
        });
      } else {
        setInput(value);
      }
      initialLoadRef.current = false;
    }
  }, [value, setValue, onSelect]);

  // Function to dynamically load Google Maps script
  const loadGoogleMapsScript = useCallback((callback: () => void) => {
    if (scriptLoadedRef.current) {
      callback();
      return;
    }

    // Check if script is already in the DOM
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      scriptLoadedRef.current = true;
      // Wait for script to initialize
      setTimeout(callback, 100);
      return;
    }

    setLoading(true);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Global callback function
    window.initMap = () => {
      console.log('Google Maps initialized');
      scriptLoadedRef.current = true;
      setLoading(false);
      callback();
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      setLoading(false);
    };

    document.head.appendChild(script);
  }, []);

  // Function to check if device is mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Function to request location permission properly
  const requestLocationPermission = async () => {
    // On mobile, we need to use the browser's geolocation API properly
    if (isMobileDevice() && 'geolocation' in navigator) {
      try {
        // This will trigger the browser's native permission prompt on mobile
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        // If we get here, permission was granted
        setLocationPermission(true);
        setShowPermissionDialog(false);
        // Now fetch the location with our function
        fetchCurrentLocation();
        return true;
      } catch (error: any) {
        console.error("Mobile location permission error:", error);
        
        // Different error handling for mobile
        if (error.code === 1) {
          // PERMISSION_DENIED on mobile
          setLocationPermission(false);
          setShowPermissionDialog(true);
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          console.warn("Position unavailable on mobile");
          setLocationPermission(false);
        } else if (error.code === 3) {
          // TIMEOUT
          console.warn("Location request timed out on mobile");
        }
        return false;
      }
    } else {
      // For desktop/laptop, show our dialog
      setShowPermissionDialog(true);
      return false;
    }
  };

  // Function to fetch current location using Mapbox
  const fetchCurrentLocation = async () => {
    setCurrentLocationLoading(true);
    try {
      const loc = await getCurrentLocation();

      // Type guard to safely check the structure
      let lat: number | undefined;
      let lng: number | undefined;

      if (loc && typeof loc === 'object') {
        // Check for possible location object structures
        if ('latitude' in loc && 'longitude' in loc) {
          // Your custom LocationData structure
          lat = (loc as any).latitude;
          lng = (loc as any).longitude;
        } else if ('coords' in loc && loc.coords) {
          // Standard GeolocationPosition structure
          lat = (loc as any).coords.latitude;
          lng = (loc as any).coords.longitude;
        } else if ('lat' in loc && 'lng' in loc) {
          // Alternative structure
          lat = (loc as any).lat;
          lng = (loc as any).lng;
        }
      }

      if (lat !== undefined && lng !== undefined) {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
          );
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            // Extract just the locality/area name without city
            let currentLocation = data.features[0].place_name;
            
            // Try to get a more specific name (just the locality)
            const feature = data.features[0];
            if (feature.text) {
              // Use the primary text (usually the most specific name)
              currentLocation = feature.text;
              
              // If there's context, check if it's a locality
              if (feature.context) {
                const localityContext = feature.context.find((ctx: any) => 
                  ctx.id.includes('locality') || ctx.id.includes('place')
                );
                if (localityContext) {
                  currentLocation = localityContext.text;
                }
              }
            }
            
            setInput(currentLocation);
            setValue(currentLocation);
            
            // Pass the location data to parent
            onSelect({
              display_name: currentLocation,
              lat: lat,
              lon: lng,
              place_id: null,
              name: data.features[0].text,
              geometry: {
                location: {
                  lat: () => lat as number,
                  lng: () => lng as number,
                }
              }
            });
          }
        } catch (error) {
          console.error("Error fetching current location name:", error);
        }
      } else {
        console.warn("Could not extract coordinates from location:", loc);
        setLocationPermission(false);
        // Only show dialog on desktop, not mobile
        if (!isMobileDevice() && !permissionRequested) {
          setShowPermissionDialog(true);
        }
      }
    } catch (error: any) {
      console.error("Error getting current location:", error);
      setLocationPermission(false);
      
      // Check if it's a permission denied error
      const isPermissionDenied = error.code === 1 || 
                                 error.message?.includes('permission') || 
                                 error.message?.includes('denied');
      
      if (isPermissionDenied) {
        setPermissionRequested(true);
        // On mobile, we need to trigger the browser's native permission prompt
        if (isMobileDevice()) {
          // For mobile, we'll show a message but not our dialog
          console.log("Mobile location permission denied - user must enable in browser settings");
        } else {
          // For desktop, show our custom dialog
          setShowPermissionDialog(true);
        }
      }
    } finally {
      setCurrentLocationLoading(false);
    }
  };

  // Handle permission dialog actions
  const handlePermissionGrant = () => {
    setShowPermissionDialog(false);
    
    if (isMobileDevice()) {
      // On mobile, we need to use the browser API to trigger permission
      requestLocationPermission();
    } else {
      // On desktop, just try again
      fetchCurrentLocation();
    }
  };

  const handlePermissionDeny = () => {
    setShowPermissionDialog(false);
    setLocationPermission(false);
  };

  // Initialize Google Places Service once script is loaded
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;

    loadGoogleMapsScript(() => {
      // Check if Google Maps library is available
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.error('Google Maps Places library not available');
        return;
      }

      try {
        // Create a dummy div for Places Service
        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
        console.log('Google Places Service initialized successfully');
      } catch (error) {
        console.error('Error initializing Google Places Service:', error);
      }
    });

    // Cleanup on unmount
    return () => {
      placesServiceRef.current = null;
    };
  }, [loadGoogleMapsScript]);

  // Search hotels by name (property name only)
  const searchHotels = (query: string): HotelType[] => {
    if (!query.trim() || !isHotelsLoaded) return [];
    
    const searchTerm = query.toLowerCase().trim();
    
    return hotels.filter(hotel => {
      // Search in property name only (not address or city)
      const nameMatch = hotel.propertyName.toLowerCase().includes(searchTerm);
      
      // Only return hotels that match by property name
      return nameMatch;
    }).slice(0, 10); // Limit to 10 results for better UX
  };

  // Fetch Google Places suggestions
  const fetchGooglePlacesSuggestions = async (query: string) => {
    if (!placesServiceRef.current || !query.trim()) {
      return [];
    }

    return new Promise<any[]>((resolve) => {
      const request = {
        query: query,
        location: new google.maps.LatLng(20.2961, 85.8245), // Bhubaneswar coordinates
        radius: 50000, // 50km radius
      };

      placesServiceRef.current?.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const formattedResults = results.map((place: any) => {
            // Clean the address to remove "Bhubaneswar" suffix
            let cleanAddress = place.formatted_address || "";
            // Remove ", Bhubaneswar" and variations from the end
            cleanAddress = cleanAddress.replace(/,\s*Bhubaneswar.*$/i, '').trim();
            
            return {
              place_id: place.place_id,
              formatted_address: cleanAddress || place.name,
              name: place.name,
              geometry: place.geometry,
              types: place.types || [],
            };
          });
          resolve(formattedResults);
        } else {
          console.log('Google Places search status:', status);
          resolve([]);
        }
      });
    });
  };

  // Handle manual input changes
  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInput(newValue);
    setAnchorEl(event.currentTarget);

    if (!newValue.trim()) {
      setValue("");
      setSuggestions([]);
      setHotelSuggestions([]);
    } else if (newValue.length > 1) {
      // Search hotels by property name only
      const foundHotels = searchHotels(newValue);
      setHotelSuggestions(foundHotels);
      
      // Fetch Google Places suggestions
      if (placesServiceRef.current) {
        try {
          const googleSuggestions = await fetchGooglePlacesSuggestions(newValue);
          setSuggestions(googleSuggestions);
        } catch (error) {
          console.error('Error fetching Google Places suggestions:', error);
          // Fallback to Mapbox if Google fails
          if (!scriptLoadedRef.current || !window.google) {
            fetchMapboxSuggestions(newValue);
          }
        }
      } else {
        // Fallback to Mapbox if Google isn't loaded
        if (!scriptLoadedRef.current || !window.google) {
          fetchMapboxSuggestions(newValue);
        }
      }
    } else {
      setSuggestions([]);
      setHotelSuggestions([]);
    }
  };

  // Mapbox fallback suggestions
  const fetchMapboxSuggestions = async (query: string) => {
    try {
      // Bhubaneswar bounding box (approximate coordinates)
      const bbox = "85.74,20.21,85.9,20.32"; // min Long, min Lat, max Long, max Lat

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxToken}&autocomplete=true&bbox=${bbox}&limit=10&proximity=85.8245,20.2961`
      );
      const data = await response.json();
      const formattedData = data.features?.map((feature: any) => {
        // Clean the place name to remove "Bhubaneswar" suffix
        let cleanPlaceName = feature.place_name || "";
        // Remove ", Bhubaneswar" and variations from the end
        cleanPlaceName = cleanPlaceName.replace(/,\s*Bhubaneswar.*$/i, '').trim();
        
        return {
          place_id: feature.id,
          formatted_address: cleanPlaceName || feature.text,
          name: feature.text,
          geometry: {
            location: {
              lat: () => feature.center[1],
              lng: () => feature.center[0],
            }
          }
        };
      }) || [];
      setSuggestions(formattedData);
    } catch (error) {
      console.error("Error fetching Mapbox suggestions:", error);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (place: any) => {
    const displayName = place.formatted_address || place.place_name;
    setInput(displayName);
    setSuggestions([]);
    setHotelSuggestions([]);
    setValue(displayName);
    
    onSelect({
      display_name: displayName,
      lat: place.geometry?.location?.lat() || (place.center ? place.center[1] : 0),
      lon: place.geometry?.location?.lng() || (place.center ? place.center[0] : 0),
      place_id: place.place_id,
      name: place.name,
      type: 'location',
    });
  };

  const handleHotelSuggestionClick = (hotel: HotelType) => {
    const displayName = hotel.propertyName;
    setInput(displayName);
    setHotelSuggestions([]);
    setSuggestions([]);
    setValue(displayName);
    
    onSelect({
      display_name: displayName,
      lat: hotel.latitude || 0,
      lon: hotel.longitude || 0,
      place_id: null,
      name: hotel.propertyName,
      hotelId: hotel.id,
      address: hotel.address,
      city: hotel.city,
      type: 'hotel',
    });
  };

  const handleManualLocationClick = () => {
    fetchCurrentLocation();
  };

  // Clear all text - EMPTY the field, don't set to Bhubaneswar
  const handleClearText = () => {
    setInput("");
    setValue("");
    setSuggestions([]);
    setHotelSuggestions([]);
    
    // Don't reset to Bhubaneswar, let field be empty
    // User can type or select something new
  };

  // Function to reset to Bhubaneswar (if needed elsewhere)
  const resetToBhubaneswar = () => {
    setInput("Bhubaneswar");
    setValue("Bhubaneswar");
    
    onSelect({
      display_name: "Bhubaneswar",
      lat: 20.2961,
      lon: 85.8245,
      place_id: null,
      name: "Bhubaneswar",
      type: 'location',
    });
  };

  // Get icon based on property type or place type
  const getIcon = (item: any) => {
    if (item.type === 'hotel') {
      const propertyType = item.data.propertyType?.toLowerCase();
      switch(propertyType) {
        case 'hotel':
          return <Hotel sx={{ color: "#1976d2" }} />;
        case 'villa':
          return <Villa sx={{ color: "#4caf50" }} />;
        case 'resort':
          return <Business sx={{ color: "#ff9800" }} />;
        case 'apartment':
          return <Home sx={{ color: "#9c27b0" }} />;
        default:
          return <Hotel sx={{ color: "#757575" }} />;
      }
    } else {
      // For locations, check Google place types
      const placeTypes = item.data.types || [];
      if (placeTypes.includes('hotel') || placeTypes.includes('lodging')) {
        return <Hotel sx={{ color: "#2196f3" }} />;
      } else if (placeTypes.includes('restaurant') || placeTypes.includes('food')) {
        return <Place sx={{ color: "#4caf50" }} />;
      } else if (placeTypes.includes('shopping_mall') || placeTypes.includes('store')) {
        return <Business sx={{ color: "#ff9800" }} />;
      } else {
        return <LocationOn sx={{ color: "#f44336" }} />;
      }
    }
  };

  // Combine all suggestions into single list
  const allSuggestions = [
    ...hotelSuggestions.map(hotel => ({
      type: 'hotel',
      data: hotel,
      displayText: hotel.propertyName,
      address: hotel.address,
      city: hotel.city,
      propertyType: hotel.propertyType,
    })),
    ...suggestions.map(place => ({
      type: 'location',
      data: place,
      displayText: place.formatted_address || place.name,
      address: place.formatted_address,
      name: place.name,
      types: place.types || [],
    }))
  ];

  // Sort suggestions: hotels first, then locations
  const sortedSuggestions = allSuggestions.sort((a, b) => {
    // Hotels first
    if (a.type === 'hotel' && b.type !== 'hotel') return -1;
    if (b.type === 'hotel' && a.type !== 'hotel') return 1;
    
    // Then sort by relevance to search term
    const aText = a.displayText.toLowerCase();
    const bText = b.displayText.toLowerCase();
    const searchTerm = input.toLowerCase();
    
    // Exact match gets highest priority
    if (aText === searchTerm && bText !== searchTerm) return -1;
    if (bText === searchTerm && aText !== searchTerm) return 1;
    
    // Starts with search term
    if (aText.startsWith(searchTerm) && !bText.startsWith(searchTerm)) return -1;
    if (bText.startsWith(searchTerm) && !aText.startsWith(searchTerm)) return 1;
    
    // Contains search term
    if (aText.includes(searchTerm) && !bText.includes(searchTerm)) return -1;
    if (bText.includes(searchTerm) && !aText.includes(searchTerm)) return 1;
    
    // Alphabetical order
    return aText.localeCompare(bText);
  });

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          bgcolor: color.thirdColor,
          borderRadius: 2,
          p: 1,
          textAlign: "left",
          color: color.firstColor,
          position: "relative",
        }}
      >
        <Typography
          sx={{
            px: "10px",
            fontSize: { xs: "14px", md: "16px" },
            fontFamily: "CustomFontM",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {label}
          {loading && " (loading Google Maps...)"}
          {currentLocationLoading && " (getting your location...)"}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: color.firstColor,
            borderRadius: 2,
            minWidth: { xs: "250px", md: "300px" },
            position: "relative",
          }}
        >
          <TextField
            variant="standard"
            InputProps={{ 
              disableUnderline: true,
              endAdornment: input && input.trim() !== "" && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClearText}
                    size="small"
                    sx={{
                      color: color.firstColor,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              // Add this to disable native autocomplete
              inputProps: {
                autoComplete: "off",
                role: "combobox",
                "aria-autocomplete": "list",
                "aria-expanded": sortedSuggestions.length > 0,
                "aria-controls": "location-suggestions-list",
              }
            }}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Search hotels or locations in Bhubaneswar..."
            inputRef={inputRef}
            fullWidth
            sx={{
              bgcolor: color.thirdColor,
              borderRadius: 2,
              width: "100%",
              border: "none",
              outline: "none",
              boxShadow: "none",
              "& fieldset": {
                border: "none",
              },
              "&:hover": {
                bgcolor: "#f5f5f5",
              },
              "& .MuiInputBase-input": {
                color: color.firstColor,
                fontFamily: "CustomFontB",
                fontSize: { xs: "18px", md: "20px" },
                width: "100%",
                paddingRight: "40px", // Make room for clear button
                // Disable native autocomplete
                "&:-webkit-autofill": {
                  WebkitBoxShadow: "0 0 0 100px white inset",
                  WebkitTextFillColor: color.firstColor,
                },
              },
            }}
          />
        </Box>

        {/* Manual current location button */}
        {!currentLocationLoading && !locationPermission && (
          <Box sx={{ mt: 1, px: "10px" }}>
            <Typography
              onClick={() => {
                if (isMobileDevice()) {
                  alert("Please enable location services in your browser settings to use this feature.");
                } else {
                  fetchCurrentLocation();
                }
              }}
              sx={{
                color: "primary.main",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "12px",
                fontFamily: "CustomFontB",
                display: "inline-block",
              }}
            >
              Use my current location
            </Typography>
          </Box>
        )}

        {/* Custom combined suggestions dropdown */}
        {sortedSuggestions.length > 0 && (
          <Popper
            open={sortedSuggestions.length > 0}
            anchorEl={anchorEl}
            placement="bottom-start"
            modifiers={[
              {
                name: 'preventOverflow',
                enabled: true,
                options: {
                  altAxis: true,
                  altBoundary: true,
                  tether: true,
                  rootBoundary: 'document',
                  padding: 8,
                },
              },
              {
                name: 'offset',
                options: {
                  offset: [0, 8],
                },
              },
            ]}
            style={{ 
              zIndex: 9999, // Very high z-index to ensure it's on top
              position: 'absolute',
            }}
            sx={{ 
              width: 'fit-content',
              maxWidth: '90vw',
              minWidth: { xs: 'calc(100vw - 32px)', sm: '400px', md: '500px' },
              translate: { xs: "0 0", md: "-40px 10px" }
            }}
          >
            <Paper
              id="location-suggestions-list"
              sx={{
                width: '100%',
                maxHeight: '400px',
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            >
              <List dense sx={{ py: 0 }}>
                {/* Show total count */}
                <ListItem sx={{ 
                  bgcolor: '#f8f9fa',
                  borderBottom: '1px solid #e9ecef',
                  py: 0.75,
                  px: 2,
                }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#6c757d' }}>
                          {hotelSuggestions.length > 0 && suggestions.length > 0 
                            ? `${hotelSuggestions.length} hotels & ${suggestions.length} locations found`
                            : hotelSuggestions.length > 0 
                              ? `${hotelSuggestions.length} hotels found`
                              : `${suggestions.length} locations found`
                          }
                        </Typography>
                        <Typography sx={{ fontSize: '10px', color: '#adb5bd' }}>
                          Press ⬆⬇ to navigate, ↵ to select
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>

                {/* Combined list of hotels and locations */}
                {sortedSuggestions.map((item, index) => (
                  <ListItem
                    component="li"
                    key={`${item.type}-${index}-${item.data.id || item.data.place_id}`}
                    onClick={() => {
                      if (item.type === 'hotel') {
                        handleHotelSuggestionClick(item.data as HotelType);
                      } else {
                        handleSuggestionClick(item.data);
                      }
                    }}
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: "rgba(0, 0, 0, 0.04)",
                      },
                      borderBottom: index < sortedSuggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                      py: 1.5,
                      px: 2,
                      transition: 'background-color 0.2s',
                      '&:active': {
                        bgcolor: "rgba(0, 0, 0, 0.08)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 44, color: '#666' }}>
                      {getIcon(item)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography
                              sx={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#212529',
                                lineHeight: 1.2,
                              }}
                            >
                              {item.displayText}
                            </Typography>
                            {item.type === 'hotel' ? (
                              <Typography
                                component="span"
                                sx={{
                                  fontSize: '10px',
                                  bgcolor: item.data.propertyType === 'Hotel' ? '#e3f2fd' : 
                                           item.data.propertyType === 'Villa' ? '#e8f5e9' :
                                           item.data.propertyType === 'Resort' ? '#fff3e0' : 
                                           item.data.propertyType === 'Apartment' ? '#f3e5f5' : '#f5f5f5',
                                  color: item.data.propertyType === 'Hotel' ? '#1976d2' : 
                                         item.data.propertyType === 'Villa' ? '#4caf50' :
                                         item.data.propertyType === 'Resort' ? '#ff9800' : 
                                         item.data.propertyType === 'Apartment' ? '#9c27b0' : '#757575',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                {item.data.propertyType || 'Property'}
                              </Typography>
                            ) : (
                              <Typography
                                component="span"
                                sx={{
                                  fontSize: '10px',
                                  bgcolor: '#f0f0f0',
                                  color: '#666',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: '4px',
                                  fontWeight: 500,
                                  textTransform: 'capitalize',
                                }}
                              >
                                {item.data.types?.includes('hotel') || item.data.types?.includes('lodging') 
                                  ? 'Hotel' 
                                  : item.data.types?.includes('restaurant') 
                                    ? 'Restaurant' 
                                    : item.data.types?.includes('shopping_mall') 
                                      ? 'Shopping'
                                      : 'Location'
                                }
                              </Typography>
                            )}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: '12px',
                              color: '#6c757d',
                              mt: 0.5,
                              lineHeight: 1.3,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 0.5,
                            }}
                          >
                            <Place sx={{ fontSize: '12px', mt: '1px', flexShrink: 0 }} />
                            {item.type === 'hotel' 
                              ? `${item.data.address || ''}${item.data.city ? `, ${item.data.city}` : ''}`.trim()
                              : item.data.formatted_address || item.data.name
                            }
                          </Typography>
                        </Box>
                      }
                      sx={{
                        '& .MuiListItemText-primary': {
                          marginBottom: 0,
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Popper>
        )}

        {!GOOGLE_MAPS_API_KEY && (
          <Typography color="error" fontSize="12px" mt={1} px="10px">
            Error: Google Maps API key is missing
          </Typography>
        )}
      </Box>

      {/* Permission Dialog */}
      <Dialog
        open={showPermissionDialog && !isMobileDevice()}
        onClose={handlePermissionDeny}
      >
        <DialogTitle>Location Access Required</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This app needs access to your location to provide better service. 
            Would you like to enable location services?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePermissionDeny} color="primary">
            No, thanks
          </Button>
          <Button onClick={handlePermissionGrant} color="primary" variant="contained" autoFocus>
            Enable Location
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LocationPicker;