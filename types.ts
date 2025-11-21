
export interface Story {
  id: string;
  title: string;
  preview: string;
  category: 'Mythology' | 'History' | 'Folklore';
  imageUrl: string;
}

export interface SectionItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  lat?: number;
  lng?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isAudio?: boolean;
}

export enum AppSection {
  HOME = 'HOME',
  TEMPLES = 'TEMPLES',
  GODS = 'GODS',
  TEXTS = 'TEXTS',
  CHAT = 'CHAT',
}

export interface TopicDetailData {
  title: string;
  subtitle: string;
  heroImagePrompt: string;
  introduction: string;
  sections: {
    title: string;
    content: string;
  }[];
  facts: string[];
  location?: {
    name: string;
    googleMapsUri: string;
    lat?: number;
    lng?: number;
  };
  galleryPrompts?: string[];
}

export interface TTSState {
  isPlaying: boolean;
  isLoading: boolean;
}
