import React, { useState } from 'react';
import { ChannelProfile, CommentData } from '../types';
import { generateReply } from '../services/geminiService';
import { useAuth } from './AuthProvider';
import { Send, Copy, RotateCcw, CheckCircle, Clock, UploadCloud, User, LogOut, History, Plus, Link as LinkIcon, Trash2, Loader2 } from 'lucide-react';

interface ReplyGeneratorProps {
  profile: ChannelProfile;
}

export const ReplyGenerator: React.FC<ReplyGeneratorProps> = ({ profile }) => {
  const { user, login, logout, isLoading: isAuthLoading } = useAuth();

  // Start empty for a "Real App" feel
  const [inbox, setInbox] = useState<CommentData[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  
  // Input State
  const [selectedCommentId, setSelectedCommentId] = useState<string>('new');
  const [newCommentText, setNewCommentText] = useState('');
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // AI & API State
  const [generatedReply, setGeneratedReply] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Helper to get the object being worked on
  const activeComment = selectedCommentId === 'new' 
    ? { 
        id: 'new', 
        author: newAuthorName || 'Viewer', 
        text: newCommentText, 
        videoUrl: newVideoUrl,
        timestamp: 'Now', 
        status: 'pending', 
        sentiment: 'neutral' 
      } as CommentData
    : inbox.find(c => c.id === selectedCommentId);

  // --- Actions ---

  const handleClearSession = () => {
    if(window.confirm("Clear all session history?")) {
      setInbox([]);
      setGeneratedReply(null);
      setSelectedCommentId('new');
    }
  };

  const handleGenerate = async () => {
    if (!activeComment || !activeComment.text.trim()) return;
    setIsLoading(true);
    setGeneratedReply(null);
    try {
      const reply = await generateReply(profile, activeComment);
      setGeneratedReply(reply);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostReply = async () => {
    if (!generatedReply || !activeComment) return;
    
    // Real Auth Check
    if (!user) {
        login();
        return;
    }

    setIsPosting(true);
    // Note: Here we would call the actual YouTube API using the access token stored in AuthProvider
    // For now, we simulate the network request duration, but we are using the REAL user profile.
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalizedComment: CommentData = {
        ...activeComment,
        id: activeComment.id === 'new' ? Date.now().toString() : activeComment.id,
        reply: generatedReply,
        status: 'replied',
        timestamp: 'Just now'
    };

    if (activeComment.id === 'new') {
        // Add new item to history
        setInbox(prev => [finalizedComment, ...prev]);
        // Reset input form
        setNewCommentText('');
        setNewAuthorName('');
        // Keep video URL as user might be replying to multiple comments on same video
        setGeneratedReply(null);
    } else {
        // Update existing
        setInbox(prev => prev.map(c => c.id === activeComment.id ? finalizedComment : c));
        setSelectedCommentId('new'); // Go back to 'new' mode
        setGeneratedReply(null);
    }
    
    setIsPosting(false);
    setActiveTab('history');
  };

  // --- Filtering ---
  const displayedComments = inbox.filter(c => 
    activeTab === 'pending' ? c.status === 'pending' : c.status === 'replied'
  );

  return (
    <>
      <div className="flex h-full gap-6">
        
        {/* LEFT: Session Inbox */}
        <div className="w-1/3 bg-[#1e1e1e] border border-[#3e3e3e] rounded-xl flex flex-col overflow-hidden shadow-xl">
          
          {/* Inbox Header */}
          <div className="p-4 border-b border-[#3e3e3e] flex flex-col gap-3">
              <div className="flex justify-between items-center">
                  <h3 className="text-white font-bold flex items-center gap-2">
                      <History className="w-5 h-5 text-red-500" />
                      Session History
                  </h3>
                  {inbox.length > 0 && (
                    <button 
                      onClick={handleClearSession}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
              </div>

              {/* Tabs */}
              <div className="flex bg-[#111] p-1 rounded-lg">
                <button
                   onClick={() => setActiveTab('pending')}
                   className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex justify-center items-center gap-2 ${
                     activeTab === 'pending' ? 'bg-[#333] text-white shadow' : 'text-gray-500 hover:text-gray-300'
                   }`}
                >
                   Drafts
                </button>
                <button
                   onClick={() => setActiveTab('history')}
                   className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex justify-center items-center gap-2 ${
                     activeTab === 'history' ? 'bg-[#333] text-white shadow' : 'text-gray-500 hover:text-gray-300'
                   }`}
                >
                   Replied
                   <span className="bg-green-900 text-green-300 text-[10px] px-1.5 rounded-full">
                     {inbox.filter(c => c.status === 'replied').length}
                   </span>
                </button>
              </div>

              {/* User / Auth Bar */}
              {user ? (
                 <div className="flex items-center justify-between bg-[#2a2a2a] px-3 py-2 rounded-lg border border-[#3e3e3e]">
                    <div className="flex items-center gap-2">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-[10px] font-bold text-white">
                                {user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-semibold text-white truncate max-w-[100px]">{user.name}</span>
                            <span className="text-[10px] text-green-500 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Connected
                            </span>
                        </div>
                    </div>
                    <button onClick={logout} className="text-gray-500 hover:text-white" title="Sign out">
                        <LogOut className="w-4 h-4" />
                    </button>
                 </div>
              ) : (
                 <button 
                    onClick={login}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                 >
                    <User className="w-3.5 h-3.5" />
                    {isAuthLoading ? 'Connecting...' : 'Connect YouTube Account'}
                 </button>
              )}
          </div>
          
          {/* List Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              
              {/* "New Reply" Button - Always available */}
              <div 
                  onClick={() => { setSelectedCommentId('new'); setGeneratedReply(null); }}
                  className={`p-4 border-b border-[#2a2a2a] cursor-pointer hover:bg-[#252525] transition-colors ${selectedCommentId === 'new' ? 'bg-[#2a2a2a] border-l-4 border-l-red-600' : 'border-l-4 border-l-transparent'}`}
              >
                  <div className="flex items-center gap-2 mb-1">
                      <Plus className="w-4 h-4 text-green-400" />
                      <span className="font-semibold text-sm text-gray-200">New Reply</span>
                  </div>
                  <p className="text-xs text-gray-500">Paste a new comment to process...</p>
              </div>

              {displayedComments.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">
                   {activeTab === 'pending' ? 'No saved drafts.' : 'No replies sent in this session.'}
                </div>
              )}

              {displayedComments.map(comment => (
                  <div 
                      key={comment.id}
                      onClick={() => { setSelectedCommentId(comment.id); setGeneratedReply(comment.reply || null); }}
                      className={`p-4 border-b border-[#2a2a2a] cursor-pointer hover:bg-[#252525] transition-colors ${selectedCommentId === comment.id ? 'bg-[#2a2a2a] border-l-4 border-l-red-600' : 'border-l-4 border-l-transparent'}`}
                  >
                      <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm text-gray-200">{comment.author}</span>
                          <span className="text-[10px] text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{comment.text}</p>
                      {comment.status === 'replied' && (
                          <div className="mt-2 text-xs text-gray-500 italic border-l-2 border-[#444] pl-2 line-clamp-1">
                              You: {comment.reply}
                          </div>
                      )}
                  </div>
              ))}
          </div>
        </div>

        {/* RIGHT: Input / Work Area */}
        <div className="flex-1 flex flex-col gap-4">
          
          <div className="flex-1 bg-[#1e1e1e] border border-[#3e3e3e] rounded-xl p-6 shadow-xl flex flex-col relative overflow-hidden">
              
              {/* Input Form */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  
                  {/* Header for Current Task */}
                  <div className="mb-6 flex items-center justify-between">
                     <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {selectedCommentId === 'new' ? 'Drafting New Reply' : 'Editing Draft'}
                     </h2>
                     {selectedCommentId !== 'new' && (
                        <span className="text-xs bg-yellow-900/30 text-yellow-500 px-2 py-1 rounded">Draft Mode</span>
                     )}
                  </div>

                  {/* Comment Input Section */}
                  <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Viewer Name</label>
                            <input
                                type="text"
                                value={selectedCommentId === 'new' ? newAuthorName : activeComment?.author}
                                onChange={(e) => selectedCommentId === 'new' && setNewAuthorName(e.target.value)}
                                disabled={selectedCommentId !== 'new'}
                                className="w-full bg-[#0f0f0f] border border-[#3e3e3e] text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-red-600 outline-none placeholder-gray-600 disabled:opacity-50"
                                placeholder="e.g. John Doe"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                Video URL <span className="text-[10px] text-gray-600 normal-case">(Optional context)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={selectedCommentId === 'new' ? newVideoUrl : activeComment?.videoUrl || ''}
                                    onChange={(e) => selectedCommentId === 'new' && setNewVideoUrl(e.target.value)}
                                    disabled={selectedCommentId !== 'new'}
                                    className="w-full bg-[#0f0f0f] border border-[#3e3e3e] text-white rounded-lg px-3 py-2 pl-8 text-sm focus:ring-1 focus:ring-red-600 outline-none placeholder-gray-600 disabled:opacity-50"
                                    placeholder="https://youtube.com/watch?v=..."
                                />
                                <LinkIcon className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                            </div>
                          </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Comment Text</label>
                        <textarea
                            value={selectedCommentId === 'new' ? newCommentText : activeComment?.text}
                            onChange={(e) => selectedCommentId === 'new' && setNewCommentText(e.target.value)}
                            disabled={selectedCommentId !== 'new'}
                            rows={3}
                            className="w-full bg-[#0f0f0f] border border-[#3e3e3e] text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all resize-none placeholder-gray-600 disabled:opacity-50"
                            placeholder="Paste the comment here..."
                        />
                      </div>
                  </div>

                  {/* AI Output Section */}
                  <div className="border-t border-[#333] pt-6">
                      <div className="flex gap-3">
                          {user ? (
                              user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="You" className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                    {user.name?.[0]?.toUpperCase() || 'Y'}
                                </div>
                              )
                          ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                                  ?
                              </div>
                          )}
                          
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-xs text-white bg-[#333] px-2 py-0.5 rounded-full">
                                      {user?.name || profile.name || 'You'}
                                  </span>
                              </div>
                              
                              {generatedReply || activeComment?.reply ? (
                                  <div className="group relative">
                                      <textarea
                                          value={generatedReply || activeComment?.reply}
                                          onChange={(e) => setGeneratedReply(e.target.value)}
                                          rows={4}
                                          disabled={activeComment?.status === 'replied'}
                                          className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg p-3 text-gray-100 text-sm focus:ring-1 focus:ring-red-600 resize-none leading-relaxed disabled:opacity-60"
                                          placeholder="Generated reply will appear here..."
                                      />
                                      {activeComment?.status !== 'replied' && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <button 
                                                onClick={() => navigator.clipboard.writeText(generatedReply || "")}
                                                className="text-xs flex items-center gap-1 text-gray-500 hover:text-white transition-colors"
                                            >
                                                <Copy className="w-3 h-3" /> Copy
                                            </button>
                                            <button 
                                                onClick={handleGenerate}
                                                className="text-xs flex items-center gap-1 text-gray-500 hover:text-white transition-colors"
                                            >
                                                <RotateCcw className="w-3 h-3" /> Regenerate
                                            </button>
                                        </div>
                                      )}
                                  </div>
                              ) : (
                                  <div className="text-sm text-gray-500 italic py-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a] border-dashed text-center">
                                      {newVideoUrl 
                                        ? "AI will watch the video to generate a relevant reply..." 
                                        : "Ready to generate..."}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 mt-4 border-t border-[#333] flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                      {activeComment?.status === 'replied' ? 'Reply recorded in session history.' : 'Review generated reply before sending.'}
                  </span>
                  <div className="flex gap-3">
                      {!generatedReply && activeComment?.status !== 'replied' && (
                          <button
                              onClick={handleGenerate}
                              disabled={isLoading || (selectedCommentId === 'new' && !newCommentText)}
                              className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                              {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              Generate
                          </button>
                      )}
                      
                      {generatedReply && activeComment?.status !== 'replied' && (
                          <button
                              onClick={handlePostReply}
                              disabled={isPosting}
                              className={`px-6 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all flex items-center gap-2 ${
                                  user
                                  ? 'bg-red-600 text-white hover:bg-red-500' 
                                  : 'bg-white text-black hover:bg-gray-200'
                              }`}
                          >
                              {isPosting ? (
                                  <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Posting...
                                  </>
                              ) : (
                                  <>
                                      <UploadCloud className="w-4 h-4" />
                                      {user ? 'Post Reply' : 'Login & Post'}
                                  </>
                              )}
                          </button>
                      )}

                      {activeComment?.status === 'replied' && (
                          <button disabled className="bg-green-600/20 text-green-500 px-6 py-2 rounded-full text-sm font-bold border border-green-600/50 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Sent
                          </button>
                      )}
                  </div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};
