import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,

  setUser: (user) => set({ user, isAdmin: user?.role === 'admin' }),
  
  setSession: (session) => set({ session }),

  fetchUserProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      get().setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    if (data.user) {
      await get().fetchUserProfile(data.user.id);
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // This gets stored in raw_user_meta_data
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) throw error;

    // User profile is automatically created by database trigger
    // No need to manually insert into users table
    if (data.user) {
      // Wait a moment for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch the newly created profile
      await get().fetchUserProfile(data.user.id);
    }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAdmin: false });
  },

  updateProfile: async (updates: Partial<User>) => {
    const user = get().user;
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    set({ user: { ...user, ...updates } });
  },
}));

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setSession(session);
  if (session?.user) {
    useAuthStore.getState().fetchUserProfile(session.user.id);
  } else {
    useAuthStore.setState({ loading: false });
  }
});

supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session);
  if (session?.user) {
    useAuthStore.getState().fetchUserProfile(session.user.id);
  } else {
    useAuthStore.getState().setUser(null);
    useAuthStore.setState({ loading: false });
  }
});

