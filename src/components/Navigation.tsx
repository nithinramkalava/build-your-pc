// src/components/Navigation.tsx
import Link from "next/link";
import { Monitor, MessageSquare, Wrench, Home, ArrowLeft } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 transition-colors">
            <Monitor className="w-8 h-8" />
            <span className="text-xl font-bold">PC Builder</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            
            <Link 
              href="/recommend" 
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-blue-100 transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Smart Assistant</span>
            </Link>
            
            <Link 
              href="/skilled" 
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-purple-100 transition-all duration-200"
            >
              <Wrench className="w-4 h-4" />
              <span>Expert Builder</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden border-t border-gray-200">
          <div className="py-2 space-y-1">
            <Link 
              href="/" 
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            
            <Link 
              href="/recommend" 
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-blue-100 transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Smart Assistant</span>
            </Link>
            
            <Link 
              href="/skilled" 
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-purple-100 transition-all duration-200"
            >
              <Wrench className="w-4 h-4" />
              <span>Expert Builder</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
