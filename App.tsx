import React, { useState } from 'react';
import { ChannelSetup } from './components/ChannelSetup';
import { ReplyGenerator } from './components/ReplyGenerator';
import { AuthProvider } from './components/AuthProvider';
import { ChannelProfile } from './types';
import { Youtube, MonitorPlay, Zap } from 'lucide-react';

const INITIAL_PROFILE: ChannelProfile = {
  name: '',
  description: '',
  styleKeywords: [],
  tone: 'Friendly',
};

const AppContent: React.FC = () => {
  const [profile, setProfile] = useState<ChannelProfile>(INITIAL_PROFILE);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-[#2a2a2a] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">TubeReply AI</h1>
              <p className="text-xs text-gray-500 font-medium">Smart Comment Assistant</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-6">
             <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-[#1f1f1f] px-3 py-1.5 rounded-full border border-[#333]">
                <MonitorPlay className="w-3.5 h-3.5" />
                <span>Gemini 2.5 Flash</span>
             </div>
             <a href="#" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Docs</a>
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-purple-600" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
        
        {/* Intro / Empty State Check */}
        {!process.env.API_KEY ? (
             <div className="flex items-center justify-center h-[50vh]">
                <div className="text-center max-w-md p-8 bg-[#1e1e1e] rounded-2xl border border-red-900/30 shadow-2xl">
                    <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">API Key Missing</h2>
                    <p className="text-gray-400">Please ensure the Gemini API key is configured in the environment to use TubeReply AI.</p>
                </div>
             </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
            
            {/* Left Column: Configuration */}
            <div className="lg:col-span-4 h-full">
                <ChannelSetup profile={profile} onUpdate={setProfile} />
            </div>

            {/* Right Column: Interaction */}
            <div className="lg:col-span-8 h-full">
                <ReplyGenerator profile={profile} />
            </div>
            </div>
        )}
      </main>
      
      {/* Mobile Footer Spacing for scrolling */}
      <div className="h-6 md:hidden"></div>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
