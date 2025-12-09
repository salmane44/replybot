export interface ChannelProfile {
  name: string;
  description: string;
  styleKeywords: string[];
  tone: 'Friendly' | 'Professional' | 'Humorous' | 'Sarcastic' | 'Hype';
}

export interface CommentData {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  videoUrl?: string; // New: Context for the specific video
  status: 'pending' | 'replied';
  reply?: string;
  sentiment?: 'positive' | 'negative' | 'question' | 'neutral';
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface GeneratedReply {
  text: string;
  timestamp: number;
}

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}
