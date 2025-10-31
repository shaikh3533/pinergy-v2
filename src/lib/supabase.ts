import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profile_pic?: string;
  rating_points: number;
  level: 'Noob' | 'Level 3' | 'Level 2' | 'Level 1' | 'Top Player';
  total_hours_played: number;
  approved: boolean;
  role?: 'admin' | 'player';
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  table_type: string; // Now using display_name from table_names
  table_id?: string; // 'table_a' or 'table_b'
  slot_duration: 30 | 60;
  coaching: boolean;
  date: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
  price: number;
  whatsapp_sent?: boolean;
  created_at: string;
  user?: User;
}

export interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  video_url?: string;
  played_on: string;
  rating_points_awarded: number;
  player1?: User;
  player2?: User;
  winner?: User;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  image?: string;
  link?: string;
  created_at: string;
}

export interface Suggestion {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'suggestion' | 'complaint' | 'feedback';
  subject: string;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

export interface TableName {
  id: string;
  table_id: 'table_a' | 'table_b';
  display_name: string;
  full_name: string;
  specs?: string;
  image_url?: string;
  active: boolean;
  display_order: number;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  table_type: 'table_a' | 'table_b';
  duration_minutes: 30 | 60;
  coaching: boolean;
  price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClubSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  updated_at: string;
  updated_by?: string;
}

