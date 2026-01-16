const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const api = {
  async request(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })
    return response.json()
  },
  
  // Rider endpoints
  rider: {
    login: (data: any) => api.request("/api/rider/login", { method: "POST", body: JSON.stringify(data) }),
    register: (data: any) => api.request("/api/rider/register", { method: "POST", body: JSON.stringify(data) }),
    paySubscription: () => api.request("/api/rider/subscription/pay", { method: "POST" }),
    getSubscriptionStatus: () => api.request("/api/rider/subscription/status"),
  },
  
  // Client endpoints
  client: {
    postDelivery: (data: any) => api.request("/api/client/delivery", { method: "POST", body: JSON.stringify(data) }),
  },
}
