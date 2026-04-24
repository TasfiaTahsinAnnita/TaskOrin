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

