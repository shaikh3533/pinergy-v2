import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ================================================================
// DATABASE TYPES
// ================================================================

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
  table_type: string;
  table_id?: string;
  slot_duration: 30 | 60;
  coaching: boolean;
  date: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
  price: number;
  whatsapp_sent?: boolean;
  booking_source?: 'whatsapp' | 'phone' | 'walkin' | 'online';
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

// ================================================================
// GALLERY TYPES
// ================================================================

export type MediaType = 'image' | 'video';
export type GalleryCategory = 'general' | 'match' | 'event' | 'club' | 'tournament';

export type ObjectFitType = 'cover' | 'contain' | 'fill' | 'none';
export type AspectRatioType = 'square' | 'video' | 'portrait' | 'wide';

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  media_type: MediaType;
  media_url: string;
  thumbnail_url?: string;
  category: GalleryCategory;
  is_featured: boolean;
  display_order: number;
  uploaded_by?: string;
  // Image display options
  object_fit?: ObjectFitType;
  object_position?: string; // e.g., 'center', 'top', 'bottom', '50% 30%'
  aspect_ratio?: AspectRatioType;
  grid_size?: 'small' | 'medium' | 'large'; // For masonry layout
  created_at: string;
  updated_at: string;
}

// ================================================================
// TOURNAMENT / LEAGUE TYPES
// ================================================================

// Tournament Types:
// - round_robin: Every player plays every other player (best for small groups, 4-8 players)
// - round_robin_knockouts: Round robin stage then knockout stage (most common)
// - group_stage_knockouts: Players divided into groups, top from each group advance to knockouts
// - single_elimination: Direct knockout bracket (no second chances)
// - double_elimination: Knockout with losers bracket (second chance)
export type LeagueType = 'round_robin' | 'round_robin_knockouts' | 'group_stage_knockouts' | 'single_elimination' | 'double_elimination';
export type LeagueStatus = 'upcoming' | 'registration' | 'group_stage' | 'round_robin' | 'knockouts' | 'completed' | 'cancelled';
export type MatchType = 'round_robin' | 'group_stage' | 'quarterfinal' | 'semifinal' | 'final' | 'third_place' | 'losers_bracket';
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'walkover';
export type PlayerLeagueStatus = 'active' | 'withdrawn' | 'disqualified';

export interface League {
  id: string;
  name: string;
  league_type: LeagueType;
  schedule_days: string[];
  frequency: string;
  date?: string; // Single date for the league (1-day tournament)
  start_date?: string; // Legacy field
  end_date?: string; // Legacy field
  status: LeagueStatus;
  rules?: string;
  max_players: number;
  // Match format settings (best of X sets)
  group_stage_sets: number; // Sets for group/round robin matches
  round_robin_sets: number; // Legacy - same as group_stage_sets
  quarterfinal_sets: number;
  semifinal_sets: number;
  final_sets: number;
  // Qualification settings
  top_qualifiers: number; // For round robin - how many qualify for knockouts
  // Group stage settings
  num_groups?: number; // Number of groups (for group_stage_knockouts)
  qualifiers_per_group?: number; // How many from each group advance
  // Knockout settings
  has_third_place_match?: boolean; // Whether to play 3rd place match
  has_quarterfinals?: boolean; // Whether knockout stage includes quarterfinals
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaguePlayer {
  id: string;
  league_id: string;
  player_id: string;
  registration_date: string;
  status: PlayerLeagueStatus;
  seed_number?: number;
  group_number?: number; // Which group the player is in (for group stage tournaments)
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  point_difference: number;
  group_rank?: number; // Rank within group
  final_rank?: number;
  is_eliminated?: boolean; // For knockout stages
  created_at: string;
  player?: User;
}

export interface LeagueMatch {
  id: string;
  league_id: string;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  match_type: MatchType;
  match_number?: number;
  round_number: number;
  group_number?: number; // Which group this match belongs to (for group stage)
  bracket_position?: string; // Position in bracket (e.g., "W1", "L2" for double elimination)
  sets_to_win: number;
  player1_sets_won: number;
  player2_sets_won: number;
  status: MatchStatus;
  scheduled_date?: string;
  scheduled_time?: string;
  played_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  player1?: User;
  player2?: User;
  winner?: User;
  league?: League;
  sets?: LeagueMatchSet[];
}

export interface LeagueMatchSet {
  id: string;
  match_id: string;
  set_number: number;
  player1_score: number;
  player2_score: number;
  winner_id?: string;
  created_at: string;
}

export interface PlayerTournamentStats {
  id: string;
  player_id: string;
  total_leagues_played: number;
  total_matches_played: number;
  total_wins: number;
  total_losses: number;
  total_points_for: number;
  total_points_against: number;
  total_point_difference: number;
  total_championships: number;
  total_runner_ups: number;
  total_top_4_finishes: number;
  total_top_6_finishes: number;
  rating_points: number;
  win_percentage: number;
  avg_point_difference: number;
  updated_at: string;
  player?: User;
}

export interface PlayerHeadToHead {
  id: string;
  player1_id: string;
  player2_id: string;
  player1_wins: number;
  player2_wins: number;
  player1_sets_won: number;
  player2_sets_won: number;
  player1_points_for: number;
  player2_points_for: number;
  total_matches: number;
  last_match_date?: string;
  updated_at: string;
}

// View types
export interface LeagueStanding {
  league_id: string;
  player_id: string;
  player_name: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  point_difference: number;
  final_rank?: number;
  calculated_rank: number;
}

export interface GlobalPlayerRanking {
  player_id: string;
  player_name: string;
  rating_points: number;
  total_leagues_played: number;
  total_wins: number;
  total_losses: number;
  win_percentage: number;
  avg_point_difference: number;
  total_championships: number;
  total_runner_ups: number;
  global_rank: number;
}

// ================================================================
// COACHES TYPES
// ================================================================

export type SessionType = 'one_on_one' | 'group';
export type DayType = 'weekday' | 'weekend' | 'all';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';
export type CoachMediaType = 'photo' | 'video';

export interface Coach {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profile_pic?: string;
  experience_years: number;
  specializations: string[];
  achievements: string[];
  contact_phone?: string;
  contact_email?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CoachMedia {
  id: string;
  coach_id: string;
  media_type: CoachMediaType;
  media_url: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  event_name?: string;
  event_date?: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export interface CoachingSession {
  id: string;
  coach_id: string;
  session_name: string;
  session_type: SessionType;
  duration_minutes: number;
  fee_pkr: number;
  max_participants: number;
  day_type: DayType;
  available_days: string[];
  available_times: string[];
  description?: string;
  skill_level: SkillLevel;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  coach?: Coach;
}

// ================================================================
// STORE TYPES
// ================================================================

export type ProductCategory = 'balls' | 'blades' | 'rubbers' | 'accessories';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';

export interface ProductSpecifications {
  speed?: number; // 1-10 rating
  spin?: number; // 1-10 rating
  control?: number; // 1-10 rating
  weight?: string; // e.g., "85g", "Medium"
  thickness?: string; // For rubbers e.g., "2.0mm"
  ply?: string; // For blades e.g., "5-ply", "7-ply"
  material?: string; // e.g., "Carbon", "Wood"
  color?: string;
  quantity?: string; // e.g., "3 balls/pack"
  [key: string]: string | number | undefined; // Allow custom specs
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: ProductCategory;
  brand?: string;
  description?: string;
  specifications: ProductSpecifications;
  price: number;
  sale_price?: number;
  currency: string;
  stock_quantity: number;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id?: string;
  session_id?: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_category: ProductCategory;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  notes?: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

// ================================================================
// DAVIS CUP / SPECIAL EVENTS TYPES
// ================================================================

export interface DCTournament {
  id: string;
  name: string;
  date?: string;
  status: LeagueStatus;
  group_stage_rubbers: number;
  knockout_rubbers: number;
  num_groups: number;
  qualifiers_per_group: number;
  created_at: string;
  updated_at: string;
}

export interface DCTeam {
  id: string;
  tournament_id: string;
  name: string;
  group_number?: number;
  seed_number?: number;
  wins: number;
  losses: number;
  rubbers_won: number;
  rubbers_lost: number;
  sets_won: number;
  sets_lost: number;
  points_for: number;
  points_against: number;
  created_at: string;
  players?: DCTeamPlayer[];
}

export interface DCTeamPlayer {
  id: string;
  team_id: string;
  player_id: string;
  created_at: string;
  player?: User;
}

export interface DCTie {
  id: string;
  tournament_id: string;
  team1_id: string;
  team2_id: string;
  winner_id?: string;
  tie_type: MatchType;
  group_number?: number;
  bracket_position?: string;
  status: MatchStatus;
  team1_rubbers_won: number;
  team2_rubbers_won: number;
  created_at: string;
  team1?: DCTeam;
  team2?: DCTeam;
  winner?: DCTeam;
  matches?: DCMatch[];
}

export interface DCMatch {
  id: string;
  tie_id: string;
  match_number: number;
  rubber_type: 'singles' | 'doubles';
  status: MatchStatus;
  team1_player1_id?: string;
  team1_player2_id?: string;
  team2_player1_id?: string;
  team2_player2_id?: string;
  sets_to_win: number;
  team1_sets_won: number;
  team2_sets_won: number;
  winner_team_id?: string;
  created_at: string;
  team1_player1?: User;
  team1_player2?: User;
  team2_player1?: User;
  team2_player2?: User;
  sets?: DCMatchSet[];
}

export interface DCMatchSet {
  id: string;
  match_id: string;
  set_number: number;
  team1_score: number;
  team2_score: number;
  winner_team_id?: string;
  created_at: string;
}
