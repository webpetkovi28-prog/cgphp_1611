import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is available
export const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

// Create Supabase client only if environment variables are available
export const supabase = isSupabaseEnabled 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Log Supabase status for debugging
if (isSupabaseEnabled) {
  console.log('Supabase client initialized successfully');
} else {
  console.warn('Supabase is disabled - environment variables VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are missing');
}

// Database types (auto-generated from your schema)
export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          price: number;
          currency: string;
          transaction_type: 'sale' | 'rent';
          property_type: string;
          city_region: string;
          district: string | null;
          address: string | null;
          area: number;
          bedrooms: number;
          bathrooms: number;
          floors: number | null;
          floor_number: number | null;
          terraces: number;
          construction_type: string | null;
          condition_type: string | null;
          heating: string | null;
          exposure: string | null;
          year_built: number | null;
          furnishing_level: string | null;
          has_elevator: boolean;
          has_garage: boolean;
          has_southern_exposure: boolean;
          new_construction: boolean;
          featured: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          price: number;
          currency?: string;
          transaction_type: 'sale' | 'rent';
          property_type: string;
          city_region: string;
          district?: string | null;
          address?: string | null;
          area: number;
          bedrooms?: number;
          bathrooms?: number;
          floors?: number | null;
          floor_number?: number | null;
          terraces?: number;
          construction_type?: string | null;
          condition_type?: string | null;
          heating?: string | null;
          exposure?: string | null;
          year_built?: number | null;
          furnishing_level?: string | null;
          has_elevator?: boolean;
          has_garage?: boolean;
          has_southern_exposure?: boolean;
          new_construction?: boolean;
          featured?: boolean;
          active?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          transaction_type?: 'sale' | 'rent';
          property_type?: string;
          city_region?: string;
          district?: string | null;
          address?: string | null;
          area?: number;
          bedrooms?: number;
          bathrooms?: number;
          floors?: number | null;
          floor_number?: number | null;
          terraces?: number;
          construction_type?: string | null;
          condition_type?: string | null;
          heating?: string | null;
          exposure?: string | null;
          year_built?: number | null;
          furnishing_level?: string | null;
          has_elevator?: boolean;
          has_garage?: boolean;
          has_southern_exposure?: boolean;
          new_construction?: boolean;
          featured?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          image_url: string;
          image_path: string | null;
          thumbnail_url: string | null;
          alt_text: string | null;
          sort_order: number;
          is_main: boolean;
          file_size: number | null;
          mime_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          image_url: string;
          image_path?: string | null;
          thumbnail_url?: string | null;
          alt_text?: string | null;
          sort_order?: number;
          is_main?: boolean;
          file_size?: number | null;
          mime_type?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string;
          image_url?: string;
          image_path?: string | null;
          thumbnail_url?: string | null;
          alt_text?: string | null;
          sort_order?: number;
          is_main?: boolean;
          file_size?: number | null;
          mime_type?: string | null;
          created_at?: string;
        };
      };
      pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content: string;
          meta_description: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          content: string;
          meta_description?: string | null;
          active?: boolean;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          content?: string;
          meta_description?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          title: string;
          description: string;
          icon: string;
          color: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          icon: string;
          color: string;
          sort_order?: number;
          active?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          icon?: string;
          color?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string | null;
          role: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name?: string | null;
          role?: string;
          active?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string | null;
          role?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Export typed client
export type SupabaseClient = typeof supabase;