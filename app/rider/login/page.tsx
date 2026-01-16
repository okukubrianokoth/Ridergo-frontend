'use client'

import { useState } from 'react'
import axios from 'axios'

export default function RiderLogin() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const sendOtp = async () => {
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:5000/api/rider/login', { phone })
      setMessage('OTP sent to WhatsApp')
      setStep(2)
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error sending OTP')
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:5000/api/rider/verify', { phone, otp })
      setMessage('Login successful')
      window.location.href = '/rider/profile'
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Invalid OTP')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Rider Login</h1>
        {message && <p className="text-center mb-4 text-red-500">{message}</p>}
        {step === 1 ? (
          <div>
            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <button
              onClick={verifyOtp}
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
