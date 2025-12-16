export interface Deck {
  id: number;
  name: string;
  description?: string;
  created_at: number;
  card_count?: number;
  due_count?: number;
  new_count?: number;
  learned_count?: number;
}

export interface Card {
  id: number;
  deck_id: number;
  front_text: string;
  front_image?: Uint8Array | null; 
  back_text: string;
  back_image?: Uint8Array | null;
  created_at: number;
  next_review_due: number; // Timestamp
  interval: number; // Days
  ease_factor: number;
  reviews: number;
}

export interface ReviewLog {
  id: number;
  card_id: number;
  rating: number; // 1=Again, 2=Hard, 3=Good, 4=Easy
  reviewed_at: number;
}

// Helper type for images in UI
export interface CardFormData {
  frontText: string;
  backText: string;
  frontImage: File | null;
  backImage: File | null;
}