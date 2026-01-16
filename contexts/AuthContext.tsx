"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface User {
  id: string
  phone: string
  name?: string
  role: "rider" | "client"
}

interface AuthContextType {
  user: User | null
  login: (phone: string, otp: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("ridergo_user")
    const token = localStorage.getItem("ridergo_token")
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (phone: string, otp: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rider/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }
      
      // Store user and token
      localStorage.setItem("ridergo_user", JSON.stringify(data.user))
      localStorage.setItem("ridergo_token", data.token)
      setUser(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rider/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || "Registration failed")
      }
      
      // Registration successful, now login
      await login(data.phone, data.otp)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("ridergo_user")
    localStorage.removeItem("ridergo_token")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
