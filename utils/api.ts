import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ridergo_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("ridergo_token")
      localStorage.removeItem("ridergo_user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api

// Rider API functions
export const riderAPI = {
  login: (phone: string, otp: string) =>
    api.post("/api/rider/login", { phone, otp }),
  
  register: (data: any) =>
    api.post("/api/rider/register", data),
  
  getProfile: () =>
    api.get("/api/rider/profile"),
  
  updateProfile: (data: any) =>
    api.put("/api/rider/profile", data),
  
  getTrips: () =>
    api.get("/api/rider/trips"),
  
  updateLocation: (location: { lat: number; lng: number }) =>
    api.put("/api/rider/location", location),
  
  acceptTrip: (tripId: string) =>
    api.put(`/api/rider/trips/${tripId}/accept`),
  
  completeTrip: (tripId: string) =>
    api.put(`/api/rider/trips/${tripId}/complete`),
}

// Client API functions
export const clientAPI = {
  login: (phone: string, otp: string) =>
    api.post("/api/client/login", { phone, otp }),
  
  register: (data: any) =>
    api.post("/api/client/register", data),
  
  getProfile: () =>
    api.get("/api/client/profile"),
  
  updateProfile: (data: any) =>
    api.put("/api/client/profile", data),
  
  createTrip: (data: any) =>
    api.post("/api/client/trips", data),
  
  getTrips: () =>
    api.get("/api/client/trips"),
  
  getTrip: (tripId: string) =>
    api.get(`/api/client/trips/${tripId}`),
}

// M-Pesa API functions
export const mpesaAPI = {
  initiatePayment: (data: any) =>
    api.post("/api/mpesa/stkpush", data),
  
  checkPaymentStatus: (checkoutRequestId: string) =>
    api.get(`/api/mpesa/status/${checkoutRequestId}`),
}

// Wallet API functions
export const walletAPI = {
  getBalance: () =>
    api.get("/api/wallet/balance"),
  
  getTransactions: () =>
    api.get("/api/wallet/transactions"),
  
  withdraw: (amount: number) =>
    api.post("/api/wallet/withdraw", { amount }),
}

// OTP API functions
export const otpAPI = {
  sendOTP: (phone: string) =>
    api.post("/api/otp/send", { phone }),
  
  verifyOTP: (phone: string, otp: string) =>
    api.post("/api/otp/verify", { phone, otp }),
}
