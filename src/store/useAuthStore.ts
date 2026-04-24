import { create } from "zustand";
import { supabase } from "../lib/supabase";

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  role: string;
};

type AuthState = {
  user: { id: string; email: string; name: string; avatar_url?: string } | null;
  profile: Profile | null;
  setUser: (user: AuthState["user"]) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  
  setUser: (user) => {
    set({ user });
    if (user) {
      get().fetchProfile();
    } else {
      set({ profile: null });
    }
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      set({ profile: data });
    }
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...updates,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error updating profile:", error);
    } else {
      // Refresh profile after update
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) set({ profile: data });
    }
  }
}));
