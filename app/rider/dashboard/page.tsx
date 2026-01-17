'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function RiderDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [trips, setTrips] = useState<any[]>([])
  const [activeTrips, setActiveTrips] = useState<any[]>([])
  const [historyTrips, setHistoryTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard')

  const quickReplies = ["I'm on my way", "I have arrived", "Stuck in traffic", "I'm at the drop-off", "Ok, thanks"]

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/rider/login')
      return
    }

    const fetchData = async () => {
      try {
        // 1. Get Profile
        const profileRes = await axios.get('http://localhost:5000/api/rider/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setProfile(profileRes.data.rider)

        // 2. Get Subscription Status
        const subRes = await axios.get('http://localhost:5000/api/rider/subscription/status', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setSubscription(subRes.data)

        // 3. Get Available Trips (only if subscribed or trial)
        if (subRes.data.subscriptionActive || subRes.data.isTrialActive) {
          fetchTrips(token)
          fetchActiveTrips(token)
          fetchHistoryTrips(token)
        }
      } catch (error) {
        console.error('Error fetching dashboard data', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Poll for messages when chat is open
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (chatOpen) {
      fetchMessages(chatOpen)
      interval = setInterval(() => fetchMessages(chatOpen), 3000)
    }
    return () => clearInterval(interval)
  }, [chatOpen])

  // GPS Tracking Logic
  useEffect(() => {
    let watchId: number;
    const token = localStorage.getItem('token');

    // Track ALL active trips, not just the first one found
    const tripsInProgress = activeTrips.filter(t => ['accepted', 'in_progress'].includes(t.status));

    if (tripsInProgress.length > 0 && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Send location to backend for EACH active trip
          tripsInProgress.forEach(trip => {
            axios.post('http://localhost:5000/api/trip/location', {
              tripId: trip._id,
              latitude,
              longitude
            }, { headers: { Authorization: `Bearer ${token}` } })
            .catch(err => console.error("Loc update failed", err));
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeTrips]);

  const fetchTrips = async (token: string) => {
    // Get current location to sort trips
    let query = '';
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        query = `?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`;
        executeFetch(token, query);
      }, () => executeFetch(token, '')); // Fallback if no GPS
    } else { executeFetch(token, ''); }
  }
  const executeFetch = async (token: string, query: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/trip/available${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTrips(res.data.trips)
    } catch (error) {
      console.error('Error fetching trips', error)
    }
  }

  const fetchActiveTrips = async (token: string) => {
    try {
      const res = await axios.get('http://localhost:5000/api/trip/active', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setActiveTrips(res.data.trips)
    } catch (error) {
      console.error('Error fetching active trips', error)
    }
  }

  const fetchHistoryTrips = async (token: string) => {
    try {
      const res = await axios.get('http://localhost:5000/api/trip/history', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistoryTrips(res.data.trips)
    } catch (error) {
      console.error('Error fetching history trips', error)
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
        sender: 'rider',
        text: newMessage
      })
      setNewMessage('')
      fetchMessages(tripId)
    } catch (error) {
      console.error("Failed to send message", error)
      alert("Could not send message. Please try again.")
    }
  }

  const openGoogleMaps = (address: string) => {
    if (!address) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`
    window.open(url, '_blank')
  }

  const handlePaySubscription = async () => {
    setPaymentLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('http://localhost:5000/api/rider/subscription/pay', 
        { amount: 100 }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert(res.data.message)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Payment initiation failed')
    } finally {
      setPaymentLoading(false)
    }
  }

  const acceptTrip = async (tripId: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:5000/api/trip/accept', 
        { tripId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Trip accepted!')
      fetchTrips(token!) // Refresh list
      fetchActiveTrips(token!) // Add to active list
      setActiveTab('dashboard')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to accept trip')
    }
  }

  const updateTripStatus = async (tripId: string, status: 'start' | 'end') => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://localhost:5000/api/trip/${status}`, 
        { tripId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert(`Trip ${status === 'start' ? 'started' : 'completed'}!`)
      fetchActiveTrips(token!)
      if (status === 'end') fetchHistoryTrips(token!)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to accept trip')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    router.push('/rider/login')
  }

  if (loading) return <div className="p-8">Loading dashboard...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header & Profile */}
        <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
          <div>
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm mb-2 flex items-center">
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Rider Dashboard</h1>
            {profile && (
              <div className="text-gray-600 mt-1">
                <p>{profile.firstName} {profile.lastName}</p>
                <p>{profile.phone}</p>
                <p className={`text-sm font-semibold ${profile.isVerified ? 'text-green-600' : 'text-red-500'}`}>
                  Verified: {profile.isVerified ? 'Yes' : 'No'}
                </p>
              </div>
            )}
          </div>
          <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">
            Logout
          </button>
        </div>

        {/* Subscription Status */}
        {subscription && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                {subscription.isTrialActive ? (
                  <div className="text-green-600 font-bold text-lg">
                    Free Trial Active
                    <span className="block text-sm font-normal text-gray-500">
                      Expires: {new Date(subscription.trialExpiresAt).toLocaleDateString()}
                    </span>
                  </div>
                ) : subscription.subscriptionActive ? (
                  <div className="text-green-600 font-bold text-lg">
                    Active
                    <span className="block text-sm font-normal text-gray-500">
                      Expires: {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                ) : (
                  <div className="text-red-600 font-bold text-lg">
                    Expired
                    <span className="block text-sm font-normal text-gray-500">
                      Expired on: {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                )}
              </div>

              {(!subscription.subscriptionActive && !subscription.isTrialActive) && (
                <button 
                  onClick={handlePaySubscription}
                  disabled={paymentLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {paymentLoading ? 'Processing...' : 'Pay KES 100 Subscription'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-4">
          <button 
            className={`py-2 px-4 font-semibold ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`py-2 px-4 font-semibold ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <>
        {/* My Active Jobs */}
        {activeTrips.length > 0 && (
          <div className="bg-blue-50 p-6 rounded-lg shadow border border-blue-200">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">My Active Deliveries</h2>
            <div className="space-y-4">
              {activeTrips.map((trip) => (
                <div key={trip._id} className="bg-white p-4 rounded shadow-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold text-lg">{trip.pickupLocation?.address} → {trip.dropoffLocation?.address}</p>
                      <p className="text-gray-600">Client: {trip.clientId?.firstName}</p>
                      <p className="text-sm font-semibold mt-1">Status: <span className="uppercase text-blue-600">{trip.status.replace('_', ' ')}</span></p>
                      <p className="text-lg font-bold text-green-600 mt-1">Collect Cash: KES {trip.estimatedValue}</p>
                      
                      {/* Navigation Buttons */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {trip.status === 'accepted' && (
                          <button 
                            onClick={() => openGoogleMaps(trip.pickupLocation?.address)}
                            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm flex items-center hover:bg-indigo-200 font-semibold"
                          >
                            📍 Navigate to Pickup
                          </button>
                        )}
                        {trip.status === 'in_progress' && (
                          <button 
                            onClick={() => openGoogleMaps(trip.dropoffLocation?.address)}
                            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm flex items-center hover:bg-indigo-200 font-semibold"
                          >
                            📍 Navigate to Dropoff
                          </button>
                        )}
                        <a href={`tel:${trip.clientId?.phone?.replace(/\s+/g, '')}`} className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm flex items-center hover:bg-gray-300 font-semibold">📞 Call Client</a>
                      </div>
                      <button onClick={() => { setChatOpen(chatOpen === trip._id ? null : trip._id); fetchMessages(trip._id); }} className="text-blue-600 underline text-sm">Message</button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {trip.status === 'accepted' && (
                        <button 
                          onClick={() => updateTripStatus(trip._id, 'start')}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          Start Trip
                        </button>
                      )}
                      {trip.status === 'in_progress' && (
                        <button 
                          onClick={() => updateTripStatus(trip._id, 'end')}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Complete Trip
                        </button>
                      )}
                    </div>
                  </div>
                  {trip.status === 'in_progress' && (
                    <div className="mt-2 text-xs text-green-600 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      Sharing live location with client...
                    </div>
                  )}
                  
                  {/* Chat Box */}
                  {chatOpen === trip._id && (
                    <div className="mt-2 bg-white border rounded p-2">
                      <div className="h-32 overflow-y-auto mb-2 bg-gray-50 p-2 rounded">
                        {messages.map((m, i) => (
                          <div key={i} className={`text-sm mb-1 ${m.sender === 'rider' ? 'text-right text-blue-600' : 'text-left text-gray-800'}`}>
                            <span className="font-bold">{m.sender === 'rider' ? 'Me' : 'Client'}:</span> {m.text}
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
                        <button onClick={() => sendMessage(trip._id)} className="bg-blue-500 text-white px-3 rounded">Send</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Jobs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Available Deliveries</h2>
          
          {(!subscription?.subscriptionActive && !subscription?.isTrialActive) ? (
            <p className="text-gray-500 italic">Please activate your subscription to view jobs.</p>
          ) : trips.length === 0 ? (
            <p className="text-gray-500">No jobs available at the moment.</p>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => (
                <div key={trip._id} className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg text-gray-800">
                        {trip.pickupLocation?.address || 'Unknown Pickup'} 
                        <span className="text-gray-400 mx-2">→</span> 
                        {trip.dropoffLocation?.address || 'Unknown Dropoff'}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: <span className="capitalize">{trip.packageDescription || trip.serviceType}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Client: {trip.clientId?.firstName} ({trip.clientId?.rating || 'New'})
                      </p>
                      {trip.specialInstructions && (
                        <p className="text-xs text-gray-500 mt-2 bg-yellow-50 p-2 rounded">
                          Note: {trip.specialInstructions}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-lg">KES {trip.estimatedValue || 'Negotiable'}</p>
                      <button 
                        onClick={() => acceptTrip(trip._id)}
                        className="mt-2 bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600"
                      >
                        Accept Job
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        ) : (
          /* History Tab */
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Delivery History</h2>
            {historyTrips.length === 0 ? (
              <p className="text-gray-500">No completed deliveries yet.</p>
            ) : (
              <div className="space-y-4">
                {historyTrips.map((trip) => (
                  <div key={trip._id} className="border border-gray-200 rounded p-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{trip.pickupLocation?.address} → {trip.dropoffLocation?.address}</p>
                        <p className="text-sm text-gray-600">Client: {trip.clientId?.firstName}</p>
                        <p className="text-xs text-gray-500">{new Date(trip.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">KES {trip.estimatedValue}</p>
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded uppercase">{trip.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}