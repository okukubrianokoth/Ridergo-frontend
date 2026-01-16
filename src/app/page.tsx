
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">RiderGo</h1>
      <p className="text-xl text-gray-600 mb-8 text-center">Kenya's Fastest Delivery Platform</p>
      <div className="space-y-4">
        <a href="/client/login" className="block w-full bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600">
          Client Login
        </a>
        <a href="/rider/login" className="block w-full bg-green-500 text-white py-2 px-4 rounded text-center hover:bg-green-600">
          Rider Login
        </a>
        <a href="/client/register" className="block w-full bg-gray-500 text-white py-2 px-4 rounded text-center hover:bg-gray-600">
          Client Register
        </a>
        <a href="/rider/register" className="block w-full bg-gray-500 text-white py-2 px-4 rounded text-center hover:bg-gray-600">
          Rider Register
        </a>
      </div>
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <p>1. Post your delivery request and pay via M-Pesa.</p>
        <p>2. Nearest verified rider accepts the job.</p>
        <p>3. Track in real-time and pay cash on delivery.</p>
      </div>
    </div>
  )
}
