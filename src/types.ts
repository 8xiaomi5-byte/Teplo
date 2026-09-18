export interface Icebreaker {
  id: string;
  question: string;
  answer: string;
}

export interface ValueItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  city: string;
  profession: string;
  isVerified: boolean;
  isOnline: boolean;
  isEditorChoice: boolean;
  completionPercentage: number;
  avatarUrl: string;
  heroPhoto: string;
  gallery: string[];
  compatibility: number;
  psychotype: string;
  compatibilityNote: string;
  valuesMatch: number;
  rhythmMatch: number;
  voiceNote: {
    duration: string;
    durationSeconds: number;
    description: string;
    audioPlaceholder?: string;
  };
  bioParagraphs: string[];
  highlightQuote: string;
  facts: {
    height: string;
    profession: string;
    education: string;
    smoking: string;
    pets: string;
    languages: string;
  };
  icebreakers: Icebreaker[];
  values: ValueItem[];
  interests: {
    name: string;
    icon: string;
    isPrimary?: boolean;
  }[];
  preferences: {
    ageRange: string;
    locationNote: string;
    goals: string[];
  };
}

export interface UserAccountData {
  uid: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  city?: string;
  createdAt?: string;
  isVerified?: boolean;
  // Verification and payment fields
  verified?: boolean;
  verifiedAt?: string | null;
  paymentStatus?: 'none' | 'pending' | 'paid' | 'failed' | 'refunded';
  verificationProvider?: 'stripe' | null;
  verificationPaymentId?: string | null;
  verificationAmount?: number;
  verificationCurrency?: string;
  uniqueProfilesViewedCount?: number;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  timestamp: string;
  isVoice?: boolean;
  voiceDuration?: string;
  isDateProposal?: boolean;
  dateVenue?: {
    name: string;
    address: string;
    time: string;
    category: string;
  };
}

export interface MatchItem {
  id: string;
  profileId: string;
  matchedAt: string;
  compatibility: number;
  lastMessage?: string;
  unreadCount?: number;
}

export interface WarmEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  address: string;
  description: string;
  image: string;
  price: string;
  attendeesCount: number;
  tags: string[];
  recommendedFor: string;
}
