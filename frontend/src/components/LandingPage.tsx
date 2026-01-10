import React from 'react';
import { Download, Zap, Shield, Globe, ArrowRight, Star } from 'lucide-react';
import PlatformIcon from './PlatformIcon';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Download media in seconds with our optimized processing"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your links and downloads are processed securely"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Universal Support",
      description: "Works with all major social media platforms"
    }
  ];

  const platforms = [
    { name: 'Instagram', platform: 'instagram' as const, color: 'text-pink-500' },
    { name: 'YouTube', platform: 'youtube' as const, color: 'text-red-500' },
    { name: 'Spotify', platform: 'spotify' as const, color: 'text-green-500' },
    { name: 'X/Twitter', platform: 'x' as const, color: 'text-blue-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-96 h-96 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 -right-4 w-96 h-96 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-200 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-8 shadow-2xl animate-in zoom-in duration-700 delay-300">
            <Download className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 dark:text-white mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-in slide-in-from-bottom-4 duration-1000 delay-500">
            Welcome to UMD 
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed animate-in slide-in-from-bottom-4 duration-1000 delay-700">
            Download media from Instagram, YouTube, Spotify, and X/Twitter with just one click. 
            Fast, secure, and completely free.
          </p>

          <div className="flex items-center justify-center space-x-2 mb-12 animate-in slide-in-from-bottom-4 duration-1000 delay-900">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
            <span className="text-gray-600 dark:text-gray-300 ml-2 font-medium">
              100% Secure & Trusrted 
            </span>
          </div>

          <button
            onClick={onGetStarted}
            className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 animate-in slide-in-from-bottom-4 duration-1000 delay-1100"
          >
            <span className="mr-3">Get Started Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        {/* Supported Platforms */}
        <div className="mb-20 animate-in slide-in-from-bottom-6 duration-1000 delay-1300">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
            Supported Platforms
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {platforms.map((platform, index) => (
              <div
                key={platform.platform}
                className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${1500 + index * 100}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${platform.color} bg-current/10 group-hover:scale-110 transition-transform duration-300`}>
                  <PlatformIcon platform={platform.platform} className={`w-8 h-8 ${platform.color}`} />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  {platform.name}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-20 animate-in slide-in-from-bottom-6 duration-1000 delay-1700">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
            Why Choose Us?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${1900 + index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white animate-in slide-in-from-bottom-6 duration-1000 delay-2200">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Download?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who trust our platform daily
          </p>
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="mr-3">Start Downloading Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
}