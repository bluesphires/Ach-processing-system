export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">CSS Test Page</h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Tailwind CSS Test</h2>
          <p className="text-gray-600 mb-4">This page tests various Tailwind CSS classes to ensure styling is working properly.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800">Primary Colors</h3>
              <p className="text-blue-600">Blue background with text</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="font-medium text-green-800">Success Colors</h3>
              <p className="text-green-600">Green background with text</p>
            </div>
          </div>
          
          <div className="flex space-x-4 mb-6">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
              Primary Button
            </button>
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors">
              Secondary Button
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Form Elements</h4>
            <input 
              type="text" 
              placeholder="Test input field" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="text-center text-gray-500">
          <p>If you can see styled elements above, Tailwind CSS is working correctly!</p>
        </div>
      </div>
    </div>
  );
}
