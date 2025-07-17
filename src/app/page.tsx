// src/app/page.tsx
import Link from 'next/link'
import { Monitor, Zap, MessageSquare, Wrench, ArrowRight, Star, Users, Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-white/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-700 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Build Your Dream PC
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
              PC Builder
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Made Simple
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Whether you're a first-time builder or a seasoned expert, we'll help you create the perfect PC for your needs and budget.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Smart Recommendations</h3>
            <p className="text-gray-600">AI-powered chat that understands your needs and suggests perfect components</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Wrench className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Expert Tools</h3>
            <p className="text-gray-600">Advanced selection tools for experienced builders who know exactly what they want</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Compatibility Check</h3>
            <p className="text-gray-600">Automatic compatibility verification to ensure all parts work together perfectly</p>
          </div>
        </div>

        {/* Path Selection */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Path</h2>
            <p className="text-gray-600 text-lg">Select the experience that matches your comfort level</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Beginner Path */}
            <Link 
              href="/recommend"
              className="group relative p-8 bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 rounded-2xl hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Smart Assistant</h3>
                      <p className="text-blue-600 font-medium">Perfect for beginners</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-500 group-hover:text-blue-600 transition-colors" />
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-700 text-lg">
                    Have a friendly conversation about your needs, and our AI will recommend the perfect PC build for you.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      Natural conversation interface
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      Budget-aware recommendations
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      No technical knowledge required
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-blue-200">
                  <span className="text-blue-600 font-medium group-hover:text-blue-700">
                    Start chatting →
                  </span>
                </div>
              </div>
            </Link>

            {/* Expert Path */}
            <Link 
              href="/skilled"
              className="group relative p-8 bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200 rounded-2xl hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Expert Builder</h3>
                      <p className="text-purple-600 font-medium">For experienced users</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-500 group-hover:text-purple-600 transition-colors" />
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-700 text-lg">
                    Take full control with our advanced component selection interface. Perfect for those who know what they want.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      Direct component selection
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      Advanced filtering options
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      Detailed specifications
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-purple-200">
                  <span className="text-purple-600 font-medium group-hover:text-purple-700">
                    Start building →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              © 2025 Nithin Ram Kalava. Crafted with passion for PC builders.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}