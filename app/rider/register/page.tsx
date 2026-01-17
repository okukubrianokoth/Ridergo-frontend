'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'

export default function RiderRegister() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [riderId, setRiderId] = useState<string | null>(null)
  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null })

  const [formData, setFormData] = useState<any>({
    // Step 1: Basic Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // Step 2: OTP Verification
    otp: '',

    // Step 3: KYC Documents
    idNumber: '',
    idImage: null,
    licenseImage: null,

    // Step 4: Vehicle Information
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    numberPlate: '',
    vehicleImage: null,

    // Step 5: Additional Info
    emergencyContact: '',
    emergencyPhone: '',
    workExperience: '',
    availability: 'full-time'
  })

  // Get GPS location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.log('GPS access denied or unavailable')
        }
      )
    }
  }, [])

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: any) => {
    const { name, files } = e.target
    setFormData(prev => ({ ...prev, [name]: files[0] }))
  }

  const registerRider = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      setMessage('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post('http://localhost:5000/api/rider/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      })

      setRiderId(response.data.riderId)
      setMessage('OTP sent to your email! Check your inbox.')
      setCurrentStep(2)
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Registration failed')
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    if (!formData.otp) {
      setMessage('Please enter OTP')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('http://localhost:5000/api/rider/verify', {
        riderId: riderId,
        otp: formData.otp
      })

      // Store token for subsequent requests
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userType', 'rider')
      localStorage.setItem('userData', JSON.stringify(res.data.rider))

      setMessage('Phone verified successfully!')
      setCurrentStep(3)
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Invalid OTP')
    }
    setLoading(false)
  }

  const submitKyc = async () => {
    if (!formData.idNumber || !formData.idImage) {
      setMessage('Please provide ID number and ID image')
      return
    }

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('idNumber', formData.idNumber)
      if (formData.idImage) formDataToSend.append('idImage', formData.idImage)
      if (formData.licenseImage) formDataToSend.append('licenseImage', formData.licenseImage)

      const token = localStorage.getItem('token')
      await axios.put('http://localhost:5000/api/rider/profile', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setMessage('KYC documents uploaded successfully!')
      setCurrentStep(4)
    } catch (error: any) {
      setMessage('Error uploading documents')
    }
    setLoading(false)
  }

  const submitVehicleInfo = async () => {
    if (!formData.vehicleType || !formData.numberPlate) {
      setMessage('Please fill in vehicle type and number plate')
      return
    }

    setLoading(true)
    try {
      const vehicleData = new FormData()
      vehicleData.append('vehicleType', formData.vehicleType)
      vehicleData.append('vehicleMake', formData.vehicleMake)
      vehicleData.append('vehicleModel', formData.vehicleModel)
      vehicleData.append('vehicleYear', formData.vehicleYear)
      vehicleData.append('numberPlate', formData.numberPlate)
      if (formData.vehicleImage) vehicleData.append('vehicleImage', formData.vehicleImage)

      const token = localStorage.getItem('token')
      await axios.put('http://localhost:5000/api/rider/profile', vehicleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setMessage('Vehicle information saved!')
      setCurrentStep(5)
    } catch (error: any) {
      setMessage('Error saving vehicle information')
    }
    setLoading(false)
  }

  const completeRegistration = async () => {
    setLoading(true)
    try {
      const additionalData = {
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        workExperience: formData.workExperience,
        availability: formData.availability,
        location: location
      }

      const token = localStorage.getItem('token')
      await axios.put('http://localhost:5000/api/rider/profile', additionalData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setMessage('Registration completed successfully!')
      setTimeout(() => {
        window.location.href = '/rider/dashboard'
      }, 2000)
    } catch (error: any) {
      setMessage('Error completing registration')
    }
    setLoading(false)
  }

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Personal details' },
    { number: 2, title: 'Verify Email', description: 'OTP verification' },
    { number: 3, title: 'KYC Documents', description: 'ID and license' },
    { number: 4, title: 'Vehicle Info', description: 'Vehicle details' },
    { number: 5, title: 'Additional Info', description: 'Emergency contacts' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a RiderGo Rider</h1>
          <p className="text-gray-600">Complete your registration to start earning</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.number}
                </div>
                <div className="ml-2 hidden sm:block">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Personal Information</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+254XXXXXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Min 6 characters"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>

              <button
                onClick={registerRider}
                disabled={loading || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Sending OTP...' : 'Create Account & Send OTP'}
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Verify Your Email</h2>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  We've sent an OTP to <strong>{formData.email}</strong>.
                  Please check your email (and spam folder) for the verification code.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={verifyOtp}
                  disabled={loading || !formData.otp}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: KYC Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">KYC Verification</h2>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  All documents are required for verification. Your information is kept secure and confidential.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your ID number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Photo</label>
                <input
                  type="file"
                  name="idImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Upload a clear photo of your ID card</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Driver's License (Optional)</label>
                <input
                  type="file"
                  name="licenseImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Upload a photo of your driver's license</p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={submitKyc}
                  disabled={loading || !formData.idNumber || !formData.idImage}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Uploading...' : 'Upload & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Vehicle Information */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Vehicle Information</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number Plate</label>
                  <input
                    type="text"
                    name="numberPlate"
                    value={formData.numberPlate}
                    onChange={handleInputChange}
                    placeholder="e.g., KCB 123A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                  <input
                    type="text"
                    name="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={handleInputChange}
                    placeholder="e.g., Honda"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleInputChange}
                    placeholder="e.g., CB300R"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <input
                    type="number"
                    name="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={handleInputChange}
                    placeholder="2020"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Photo</label>
                <input
                  type="file"
                  name="vehicleImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Upload a clear photo of your vehicle</p>
              </div>

              {location.latitude && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800 text-sm">
                    ✓ GPS location detected: {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={submitVehicleInfo}
                  disabled={loading || !formData.vehicleType || !formData.numberPlate}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Additional Information */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Additional Information</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    placeholder="+254XXXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Experience</label>
                <textarea
                  name="workExperience"
                  value={formData.workExperience}
                  onChange={handleInputChange}
                  placeholder="Tell us about your delivery or driving experience..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="weekends">Weekends Only</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Start Earning!</h3>
                <p className="text-blue-800 text-sm">
                  Once you complete registration, you'll be able to accept delivery requests and start earning immediately.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={completeRegistration}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Completing...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/rider/login" className="text-blue-600 hover:text-blue-800 font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
