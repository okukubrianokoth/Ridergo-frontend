'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ClientDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    pickup: '',
    dropoff: '',
    packageType: '',
    instructions: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.get('http://localhost:5000/api/client/profile', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setProfile(res.data.client))

      // Assume there's an endpoint for deliveries
      axios.get('http://localhost:5000/api/client/deliveries', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setDeliveries(res.data.deliveries || []))
    }
  }, [])

  const postDelivery = async () => {
    const token = localStorage.getItem('token')
    try {
      await axios.post('http://localhost:5000/api/client/delivery', form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Delivery posted!')
      setShowForm(false)
      // Refresh deliveries
    } catch (error: any) {
      alert('Error posting delivery')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Client Dashboard</h1>
        {profile ? (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <p>Phone: {profile.phone}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}

        <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mb-4">
          {showForm ? 'Cancel' : 'Post New Delivery'}
        </button>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Post Delivery</h2>
            <input
              type="text"
              placeholder="Pickup Location"
              value={form.pickup}
              onChange={(e) => setForm({...form, pickup: e.target.value})}
              className="w-full p-2 border rounded mb-4"
            />
            <input
              type="text"
              placeholder="Dropoff Location"
              value={form.dropoff}
              onChange={(e) => setForm({...form, dropoff: e.target.value})}
              className="w-full p-2 border rounded mb-4"
            />
            <input
              type="text"
              placeholder="Package Type"
              value={form.packageType}
              onChange={(e) => setForm({...form, packageType: e.target.value})}
              className="w-full p-2 border rounded mb-4"
            />
            <textarea
              placeholder="Instructions"
              value={form.instructions}
              onChange={(e) => setForm({...form, instructions: e.target.value})}
              className="w-full p-2 border rounded mb-4"
            />
            <button onClick={postDelivery} className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">
              Post Delivery
            </button>
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-4">Your Deliveries</h2>
        {deliveries.length > 0 ? (
          deliveries.map(d => (
            <div key={d._id} className="bg-white p-4 rounded-lg shadow-md mb-4">
              <p>Pickup: {d.pickup}</p>
              <p>Dropoff: {d.dropoff}</p>
              <p>Status: {d.status}</p>
            </div>
          ))
        ) : (
          <p>No deliveries yet.</p>
        )}

        <button onClick={logout} className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600">
          Logout
        </button>
      </div>
    </div>
  )
}
