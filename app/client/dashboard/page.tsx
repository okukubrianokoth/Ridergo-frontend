'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function ClientDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    pickup: '',
    dropoff: '',
    packageType: '',
    instructions: '',
    estimatedValue: ''
  })
  const [chatOpen, setChatOpen] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mapView, setMapView] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  const quickReplies = ["Where are you?", "I'm at the pickup point", "Please call me", "Ok, thanks"]

  const fetchDeliveries = () => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.get('http://localhost:5000/api/client/deliveries', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setDeliveries(res.data.deliveries || []))
      .catch(err => console.error("Failed to fetch deliveries", err))
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.get('http://localhost:5000/api/client/profile', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setProfile(res.data.client))
      .catch(err => console.error("Failed to fetch profile", err))

      fetchDeliveries()
    }
  }, [])

  // Poll for messages when chat is open
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (chatOpen) {
      fetchMessages(chatOpen)
      interval = setInterval(() => fetchMessages(chatOpen), 3000)
    }
    return () => clearInterval(interval)
  }, [chatOpen])

  const postDelivery = async () => {
    const token = localStorage.getItem('token')

    if (!profile?._id) {
      alert('Profile not fully loaded. Please refresh the page.')
      return
    }

    const payload = {
      pickup: form.pickup,
      dropoff: form.dropoff,
      packageType: form.packageType,
      instructions: form.instructions,
      estimatedValue: form.estimatedValue,
      clientId: profile._id
    }
    console.log('Sending Payload:', payload)

    try {
      await axios.post('http://localhost:5000/api/client/delivery', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Delivery posted successfully!')
      setShowForm(false)
      setForm({ pickup: '', dropoff: '', packageType: '', instructions: '', estimatedValue: '' })
      fetchDeliveries()
    } catch (error: any) {
      console.error('Post Error:', error)
      const message = error.response?.data?.message || error.response?.data?.error || 'Error posting delivery'
      alert(`Failed: ${message}`)
    }
  }

  const fetchMessages = async (tripId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/trip/messages/${tripId}`)
      setMessages(res.data.messages)
    } catch (error) {
      console.error("Failed to fetch messages", error)
    }
  }

  const sendMessage = async (tripId: string) => {
    if (!newMessage.trim()) return
    try {
      await axios.post('http://localhost:5000/api/trip/message', {
        tripId,
        sender: 'client',
        text: newMessage
      })
      setNewMessage('')
      fetchMessages(tripId)
    } catch (error) {
      console.error("Failed to send message", error)
      alert("Could not send message. Please try again.")
    }
  }

  const openTrackingMap = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    window.open(url, '_blank')
  }

  const viewLiveRoute = (lat: number, lng: number, destination: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(destination)}&travelmode=driving`
    window.open(url, '_blank')
  }

  const shareTrip = (trip: any) => {
    const text = `Track my delivery on RiderGo!\nStatus: ${trip.status}\nRider: ${trip.riderId?.firstName} (${trip.riderId?.phone})\nTrack here: https://maps.google.com/maps?q=${trip.currentLocation?.lat},${trip.currentLocation?.lng}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Delivery Tracking',
        text: text,
        url: `https://maps.google.com/maps?q=${trip.currentLocation?.lat},${trip.currentLocation?.lng}`
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Tracking info copied to clipboard!'))
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  const filteredDeliveries = deliveries.filter(d => 
    activeTab === 'active' 
      ? ['pending', 'accepted', 'in_progress', 'assigned'].includes(d.status)
      : ['completed', 'cancelled', 'rejected'].includes(d.status)
  )

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 font-medium flex items-center">
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Client Dashboard</h1>
        </div>
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
            <input
              type="number"
              placeholder="Offer Price (KES)"
              value={form.estimatedValue}
              onChange={(e) => setForm({...form, estimatedValue: e.target.value})}
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

        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-6">
          <button 
            className={`py-2 px-4 font-semibold ${activeTab === 'active' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Deliveries
          </button>
          <button 
            className={`py-2 px-4 font-semibold ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map(d => (
            <div key={d._id} className="bg-white p-4 rounded-lg shadow-md mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">{d.pickupLocation?.address || d.pickup} → {d.dropoffLocation?.address || d.dropoff}</p>
                  <p className="text-sm text-gray-600">Status: <span className="font-bold uppercase text-blue-600">{d.status.replace('_', ' ')}</span></p>
                  <p className="text-sm text-gray-500">Type: {d.packageDescription}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">KES {d.estimatedValue}</p>
                </div>
              </div>

              {/* Rider Details Section */}
              {d.riderId && (
                <div className="mt-4 border-t pt-4 bg-blue-50 p-3 rounded">
                  <h3 className="font-bold text-gray-800">Rider Assigned</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold">{d.riderId.firstName} {d.riderId.lastName}</p>
                      <p className="text-blue-800 font-bold mt-1">🚲 {d.riderId.vehicleMake} {d.riderId.vehicleModel} - <span className="bg-white px-2 py-1 rounded border border-blue-200">{d.riderId.numberPlate}</span></p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <a href={`tel:${d.riderId.phone.replace(/\s+/g, '')}`} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center text-sm">
                        📞 Call Rider
                      </a>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => shareTrip(d)}
                          className="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 flex items-center justify-center text-sm font-semibold"
                        >
                          🔗 Share Trip
                        </button>

                        {d.currentLocation ? (
                          <>
                          <button 
                            onClick={() => setMapView(mapView === d._id ? null : d._id)}
                            className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 flex items-center justify-center text-sm font-semibold"
                          >
                            {mapView === d._id ? 'Hide Map' : '🗺️ Track on Map'}
                          </button>
                          <button
                            onClick={() => viewLiveRoute(d.currentLocation.lat, d.currentLocation.lng, d.status === 'in_progress' ? (d.dropoffLocation?.address || d.dropoff) : (d.pickupLocation?.address || d.pickup))}
                            className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded hover:bg-indigo-200 flex items-center justify-center text-sm font-semibold"
                          >
                            📍 View Route
                          </button>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500 text-center italic">Waiting for rider GPS...</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {d.currentLocation && <p className="text-xs text-green-600 mt-2 animate-pulse">● Live Location Updating</p>}

                  {/* Embedded Live Map */}
                  {mapView === d._id && d.currentLocation && (
                    <div className="mt-3 w-full h-64 rounded-lg overflow-hidden border border-gray-200 shadow-inner relative">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${d.currentLocation.lat},${d.currentLocation.lng}&z=15&output=embed`}
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}

                  {/* Chat Button */}
                  <button onClick={() => { setChatOpen(chatOpen === d._id ? null : d._id); fetchMessages(d._id); }} className="mt-2 text-blue-600 underline text-sm">
                    {chatOpen === d._id ? 'Close Chat' : 'Message Rider'}
                  </button>

                  {/* Chat Box */}
                  {chatOpen === d._id && (
                    <div className="mt-2 bg-white border rounded p-2">
                      <div className="h-32 overflow-y-auto mb-2 bg-gray-50 p-2 rounded">
                        {messages.map((m, i) => (
                          <div key={i} className={`text-sm mb-1 ${m.sender === 'client' ? 'text-right text-blue-600' : 'text-left text-gray-800'}`}>
                            <span className="font-bold">{m.sender === 'client' ? 'Me' : 'Rider'}:</span> {m.text}
                          </div>
                        ))}
                      </div>
                      {/* Quick Replies */}
                      <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                        {quickReplies.map(reply => (
                          <button key={reply} onClick={() => setNewMessage(reply)} className="text-xs bg-gray-100 border border-gray-300 px-2 py-1 rounded-full hover:bg-gray-200 whitespace-nowrap text-gray-700">
                            {reply}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          className="border p-1 flex-1 rounded" 
                          value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." 
                        />
                        <button onClick={() => sendMessage(d._id)} className="bg-blue-500 text-white px-3 rounded">Send</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
