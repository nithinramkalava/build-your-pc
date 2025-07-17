import React from "react";
import { Cpu, Monitor, Zap, Wrench } from "lucide-react";

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        {/* Main Animation */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="w-32 h-32 border-4 border-blue-200 rounded-full animate-spin">
            <div className="absolute top-0 left-1/2 w-6 h-6 bg-blue-600 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          </div>
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-0 w-32 h-32 border-4 border-purple-200 rounded-full animate-pulse">
            <div className="absolute top-1/4 right-0 w-4 h-4 bg-purple-600 rounded-full translate-x-1/2 -translate-y-1/2"></div>
          </div>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Cpu className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Building Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Perfect PC
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Our AI is analyzing thousands of components to create the ideal build for your needs
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Time estimate */}
        <p className="text-gray-500 text-sm">
          This usually takes 10-15 seconds
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
