import React, { useState } from 'react';
import { ChannelProfile } from '../types';
import { Sparkles, Hash, Type, Search, Loader2, Link as LinkIcon } from 'lucide-react';
import { analyzeChannelProfile } from '../services/geminiService';

interface ChannelSetupProps {
  profile: ChannelProfile;
  onUpdate: (profile: ChannelProfile) => void;
}

const TONES = ['Friendly', 'Professional', 'Humorous', 'Sarcastic', 'Hype'] as const;

export const ChannelSetup: React.FC<ChannelSetupProps> = ({ profile, onUpdate }) => {
  const [keywordInput, setKeywordInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onUpdate({ ...profile, [name]: value });
  };

  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      if (!profile.styleKeywords.includes(keywordInput.trim())) {
        onUpdate({
          ...profile,
          styleKeywords: [...profile.styleKeywords, keywordInput.trim()]
        });
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    onUpdate({
      ...profile,
      styleKeywords: profile.styleKeywords.filter(k => k !== keyword)
    });
  };

  const handleAnalyze = async () => {
    if (!profile.name) return;
    setIsAnalyzing(true);
    try {
      // profile.name currently holds the user input (URL, ID, or Name)
      const result = await analyzeChannelProfile(profile.name);
      onUpdate({
        ...profile,
        ...result, // This will update 'name' to the actual channel name found by AI
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#3e3e3e] rounded-xl p-6 h-full flex flex-col gap-6 shadow-xl">
      <div className="flex items-center gap-2 mb-2 border-b border-[#3e3e3e] pb-4">
        <div className="p-2 bg-red-600 rounded-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Channel Persona</h2>
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
        
        {/* Channel Name & Analysis */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Channel URL, ID, or Name
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                className="w-full bg-[#0f0f0f] border border-[#3e3e3e] text-white rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all placeholder-gray-600"
                placeholder="youtube.com/@handle or Channel ID"
              />
              <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !profile.name}
              className={`px-4 rounded-lg font-medium flex items-center gap-2 transition-all ${
                isAnalyzing || !profile.name
                  ? 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
              }`}
              title="Analyze channel content from link"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
            Paste your channel link. The AI will scan your <strong>video titles and descriptions</strong> to understand your content style.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Channel Content Summary
          </label>
          <textarea
            name="description"
            value={profile.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full bg-[#0f0f0f] border border-[#3e3e3e] text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all resize-none placeholder-gray-600"
            placeholder="Auto-filled after analysis..."
          />
        </div>

        {/* Tone Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Primary Tone
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => onUpdate({ ...profile, tone: t })}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  profile.tone === t
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/50'
                    : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Style Keywords
          </label>
          <div className="relative">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleAddKeyword}
              className="w-full bg-[#0f0f0f] border border-[#3e3e3e] text-white rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all placeholder-gray-600"
              placeholder="Add keyword + Enter"
            />
            <Hash className="absolute right-3 top-3.5 w-4 h-4 text-gray-500" />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.styleKeywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1 bg-[#2a2a2a] text-gray-200 px-2 py-1 rounded text-xs border border-[#3e3e3e] group"
              >
                #{keyword}
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="ml-1 text-gray-500 hover:text-red-400 focus:outline-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
