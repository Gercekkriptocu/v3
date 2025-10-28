'use client'

import { GitHubVerification } from '@/components/GitHubVerification'

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Base Logo Background */}
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url(https://raw.githubusercontent.com/base/brand-kit/main/logo.webp)',
          backgroundSize: '600px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/50 via-transparent to-blue-950/50 pointer-events-none" />
      
      <div className="relative z-10">
        <GitHubVerification />
      </div>
  
