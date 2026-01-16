'use client'

import { useState } from 'react'
import axios from 'axios'

export default function RiderProfile() {
  const [form, setForm] = useState({
    idImage: null,
    licenseImage: null,
    vehicleImage: null,
    numberPlate: '',
    vehicleType: ''
  })

  const handleFileChange = (e: any) => {
    setForm({...form, [e.target.name]: e.target.files[0]})
  }

  const updateProfile = async () => {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    if (form.idImage) formData.append('idImage', form.idImage)
    if (form.licenseImage) formData.append('licenseImage', form.licenseImage)
    if (form.vehicleImage) formData.append('vehicleImage', form.vehicleImage)
    formData.append('numberPlate', form.numberPlate)
    formData.append('vehicleType', form.vehicleType)

    try {
      await axios.put('http://localhost:5000/api/rider/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      alert('Profile updated!')
      window.location.href = '/rider/dashboard'
    } catch (error: any) {
      alert('Update failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Complete Your Profile</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block mb-2">ID Image</label>
            <input type="file" name="idImage" onChange={handleFileChange} className="border p-2 w-full" />
          </div>
          <div className="mb-4">
            <label className="block mb-2">License Image</label>
            <input type="file" name="licenseImage" onChange={handleFileChange} className="border p-2 w-full" />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Vehicle Image</label>
            <input type="file" name="vehicleImage" onChange={handleFileChange} className="border p-2 w-full" />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Number Plate</label>
            <input type="text" value={form.numberPlate} onChange={(e) => setForm({...form, numberPlate: e.target.value})} className="border p-2 w-full" />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Vehicle Type</label>
            <input type="text" value={form.vehicleType} onChange={(e) => setForm({...form, vehicleType: e.target.value})} className="border p-2 w-full" />
          </div>
          <button onClick={updateProfile} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  )
}
