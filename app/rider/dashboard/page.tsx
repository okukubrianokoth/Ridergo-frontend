'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

export default function RiderDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.get('http://localhost:5000/api/rider/profile', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setProfile(res.data.rider))

      axios.get('http://localhost:5000/api/rider/subscription/status', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setSubscription(res.data))
    }
  }, [])

  const paySubscription = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.post('http://localhost:5000/api/rider/subscription/pay', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Payment initiated. Check your phone for M-Pesa prompt.')
    } catch (error: any) {
      alert('Payment failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Rider Dashboard</h1>
        {profile ? (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <p>Phone: {profile.phone}</p>
            <p>Verified: {profile.isVerified ? 'Yes' : 'No'}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
          {subscription ? (
            <div>
              <p>Status: {subscription.active ? 'Active' : 'Expired'}</p>
              <p>Expires: {new Date(subscription.expiresAt).toLocaleDateString()}</p>
              {!subscription.active && (
                <button onClick={paySubscription} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                  Pay KES 1000 Subscription
                </button>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        <button onClick={logout} className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600">
          Logout
        </button>
      </div>
    </div>
  )
}
