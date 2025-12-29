import { Geolocation } from '@capacitor/geolocation';

export const getCurrentLocation = async () => {
    try {
        if (navigator.geolocation) {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        resolve({ latitude, longitude });
                    },
                    (error) => {
                        reject(new Error(error.message));
                    },
                    { enableHighAccuracy: true }
                );
            });
        } else {
            const permission = await Geolocation.requestPermissions({
                permissions: ['location'],
            });
            if (permission.location === 'granted') {
                const coordinates = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                });
                return coordinates.coords;
            } else {
                return null;
            }
        }
    } catch (err: any) {
        return null;
    }
};

export const getPlaceDetails = async (latitude: any, longitude: any) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.address) {
            const placeName = data.display_name;
            const city = data.address.city || data.address.town || data.address.village;
            const state = data.address.state || data.address.region;
            const country = data.address.country;
            const zipcode = data.address.postcode;

            return {
                placeName,
                city,
                state,
                country,
                zipcode,
            };
        } else {
            throw new Error('No results found');
        }
    } catch (error) {
        console.error('Error fetching place details:', error);
        throw error;
    }
};
