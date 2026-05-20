export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  tier: 'free' | 'coaching' | 'premium';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  cal_booking_id: string;
  cal_event_type: string;
  starts_at: string;
  ends_at: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed';
  meeting_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface TrainerNote {
  id: string;
  user_id: string;
  author_id: string;
  body: string;
  attachments: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealOrder {
  id: string;
  user_id: string;
  items: { sku: string; name: string; qty: number; price_cents: number }[];
  subtotal_cents: number;
  stripe_session_id: string | null;
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled';
  created_at: string;
}

export interface IdealNutritionMeal {
  id: string;
  name: string;
  subtitle: string;
  price_cents: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  image_url: string | null;
  product_url: string;
  tags: string[];
}

export interface AppSettings {
  trainer_phone: string | null;
  trainer_name: string;
  cancellation_policy_hours: number;
  meal_prep_enabled: boolean;
  doordash_partner_url: string | null;
  updated_at: string;
}
