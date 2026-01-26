import { client } from "./axiosClient";

export function sendOTP(payLoad: any) {
    return client.post('/auth/send-otp', payLoad);
}
export function resendOTP(payLoad: any) {
    return client.post('/auth/resend-otp', payLoad);
}

export function verifyOTP(payLoad: any) {
    return client.post('/auth/verify-otp', payLoad);
}

export function forgotPassword(payLoad: any) {
    return client.post('/auth/forgot-password', payLoad);
}

export function resetPassword(payLoad: any) {
    return client.post('/auth/reset-password', payLoad);
}

export function Signup(payLoad: any) {
    return client.post('/auth/create', payLoad);
}

export function getPortfolioDetails(phoneNumber: any) {
    return client.get(`/User/search-one-record`, { params: { phoneNumber } });
}

export function verifyPayment(payload: any) {
    return client.post(`/razorpay/verify`, payload);
}

export function createOrder(payload: any) {
    return client.post(`/razorpay/orders`, payload);
}

export function hotelRegister(payLoad: any) {
    return client.post('/auth/register', payLoad);
}

export function SignIn(payLoad: any) {
    return client.post('/auth/login', payLoad);
}

export function hotelPost(payLoad: any) {
    return client.post('/Hotel/create', payLoad);
}

export function roomPost(payLoad: any) {
    return client.post('/Room/insertMany', payLoad);
}

export function docsUpload(payLoad: any) {
    return client.post("/auth/upload-doc", payLoad);
}

export function getMyAllHotels(payLoad: any) {
    return client.post('/Hotel/search-record', payLoad);
}

export function getMyAllHotelswithBelongsTo(payLoad: any) {
    return client.post('/Hotel/get-all-record-with-belongs-to', payLoad);
}

export function getProfile() {
    return client.get('/auth/profile');
}

export function getAllHotels(payLoad: any) {
    return client.post('/Hotel/search-record', payLoad);
}

export function getAllRooms(payLoad: any) {
    return client.post('/Room/search-record', payLoad);
}

export function updateRooms(id: any, payLoad: any) {
    return client.patch(`/Room/update-record/${id}`, payLoad);
}

export function getAllBookingsofMyHotel(payLoad: any) {
    return client.post('/Booking/search-record', payLoad);
}

export function getAllUser(payLoad: any) {
    return client.post('/User/search-record', payLoad);
}

export function deleteUser(id: any) {
    return client.delete(`/User/delete-record/${id}`);
}

export function editUser(payLoad: any) {
    return client.patch('/auth/update-profile', payLoad);
}

export function editHotel(id: any, payLoad: any) {
    return client.patch(`/Hotel/update-record/${id}`, payLoad);
}

export function getHotel(id: any) {
    return client.get(`/Hotel/search-one-record`, { params: { id } });
}

export function editRoom(id: any, payLoad: any) {
    return client.patch(`/Room/update-record/${id}`, payLoad);
}

export function postBooking(payLoad: any) {
    return client.post('/Booking/create', payLoad);
}

export function updateBookings(id: any, payLoad: any) {
    return client.patch(`/Booking/update-record/${id}`, payLoad);
}

export function getAllMyBookings(payLoad: any) {
    return client.post('/Booking/search-record', payLoad);
}

export function deleteHotel(id: any) {
    return client.delete(`/Hotel/delete-record/${id}`);
}

export function createContact(payLoad: any) {
    return client.post('/Contact/create', payLoad);
}

export function getAllMessage(payLoad: any) {
    return client.post('/Contact/search-record', payLoad);
}

export function getUserProfile(id: any) {
    return client.get(`/User/get-one-record/${id}`);
}

export function getHotelByUser(userId: any) {
    return client.get(`/Hotel/search-one-record`, { params: { userId } });
}

export function addAgreement(payLoad: any) {
    return client.post('/Agreement/create', payLoad);
}

export function getAllAgrement(payLoad: any) {
    return client.post('/Agreement/search-record', payLoad);
}

export function createMyPayment(payLoad: any) {
    return client.post('/MyPayment/create', payLoad);
}

export function createHotelPayment(payLoad: any) {
    return client.post('/Payout/create', payLoad);
}

export function createRating(payLoad: any) {
    return client.post('/Rating/create', payLoad);
}

export function getAllRatings(payLoad: any) {
    return client.post('/Rating/search-record', payLoad);
}

export function getOneRatings(bookingId: any) {
    return client.get(`/Rating/search-one-record`, { params: { bookingId } });
}

export function updateRatings(id: any, payLoad: any) {
    return client.patch(`/Rating/update-record/${id}`, payLoad);
}

export function getAllHotelRevenue(payLoad: any) {
    return client.post('/Payout/search-record', payLoad);
}

export function getAllMyRevenue(payLoad: any) {
    return client.post('/MyPayment/search-record', payLoad);
}

export function bookingConfirm(payLoad: any) {
    return client.post('/booking/confirm', payLoad);
}

export function cancelBooking(payLoad: any) {
    return client.post('/razorpay/refund', payLoad);
}

export function createCancel(payLoad: any) {
    return client.post('/Cancel/create', payLoad);
}

export function updatePayoutStatus(id: any, payLoad: any) {
    return client.patch(`/Payout/update-record/${id}`, payLoad);
}

export function updatePayout(id: any, payLoad: any) {
    return client.patch(`/Payout/update-record/${id}`, payLoad);
}

export function updateMypayment(id: any, payLoad: any) {
    return client.patch(`/MyPayment/update-record/${id}`, payLoad);
}

// Inventory Services

export function createInventory(payload: any) {
    return client.post(`/Inventory/create`,payload );
}
export function getAllInventories( payload: any) {
    return client.post(`/Inventory/search-record`,payload );
}



export function udateInventory(id: any, payload: any) {
    return client.patch(`/Inventory/update-record/${id}`,payload );
}

export function deletInventory(id: any, payload: any) {
    return client.delete(`/Inventory/delete-record/${id}`,payload );
}


// Daily Inventory Services




export function bulkUpdateHourlyInventory(roomId: any, payload: any) {
    return client.post(`/inventory/hourly/bulk`, { roomId, ...payload });
}

export function getHourlyInventory(roomId: any, date: any, hour: any) {
    return client.get(`/inventory/hourly`, {
        params: { roomId, date, hour }
    });
}

export function getHourlyInventoryByDate(roomId: any, date: any) {
    return client.get(`/inventory/hourly/date`, {
        params: { roomId, date }
    });
}

// Availability Services
export function checkAvailability(payload: any) {
    return client.post(`/inventory/check-availability`, payload);
}

export function updateBookingInventory(payload: any) {
    return client.post(`/inventory/update-booking`, payload);
}

// Block/Unblock Services
export function blockInventory(payload: any, p0: { reason: string; }) {
    return client.post(`/inventory/block`, payload);
}

export function unblockInventory(payload: any, p0: { reason: string; }) {
    return client.post(`/inventory/unblock`, payload);
}

// CREATE INVENTORY FOR DATE RANGE - Missing function
export function createInventoryForDateRange(roomId: any, startDate: any, endDate: any) {
    return client.post(`/inventory/create-range`, { roomId, startDate, endDate });
}

// Add these to your services file
export function createInventoryForSpecificDate(roomId: any, date: any, payload: any) {
    return client.post(`/inventory/create-specific`, { roomId, date, ...payload });
}

export function bulkCreateInventory(roomId: any, inventories: any[]) {
    return client.post(`/inventory/bulk-create`, { roomId, inventories });
}

export function getAllInventory(payLoad:any){
return client.post('/Inventory/search-record', payLoad);
}

export function getOneRoomData(id:any){
return client.get(`/Room/get-one-record/${id}`);
}



//otp
export function createGST(payLoad:any){
    return client.post('/gst/create',payLoad);
}


export function getOneGSTByID(id:any){
return client.get(`/gst/get-one-record/${id}`);
}

export function getAllGSTByUserId(userId:any){
    return client.get(`/gst/get-all-record-by-user/${userId}`)
}

export function updateGST(id:any,payLoad:any){
    return client.patch(`/gst/update-record/${id}`,payLoad);
}

export function deleteGST(id: any, userId: any) {
  return client.delete(`/gst/delete-record/${id}`, {
    params: {
      userId,
    },
  });
}

export function getHotelMeals(payLoad:any){
    return client.post(`/Meal/search-record/`,payLoad)
}

export function  getHourlyClosures(payLoad:any){
    return client.post(`/HotelHourly/search-record/`,payLoad)
}

export function  getHotelDiscount(payLoad:any){
    return client.post(`/HotelDiscount/search-record/`,payLoad)
}


