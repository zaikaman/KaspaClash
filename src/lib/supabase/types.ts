/**
 * Supabase Database Types
 * Auto-generated types for database tables
 * To regenerate: npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          address: string;
          display_name: string | null;
          wins: number;
          losses: number;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          address: string;
          display_name?: string | null;
          wins?: number;
          losses?: number;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          address?: string;
          display_name?: string | null;
          wins?: number;
          losses?: number;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      characters: {
        Row: {
          id: string;
          name: string;
          theme: string;
          portrait_url: string;
          sprite_config: Json;
        };
        Insert: {
          id: string;
          name: string;
          theme: string;
          portrait_url: string;
          sprite_config: Json;
        };
        Update: {
          id?: string;
          name?: string;
          theme?: string;
          portrait_url?: string;
          sprite_config?: Json;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          room_code: string | null;
          player1_address: string;
          player2_address: string | null;
          player1_character_id: string | null;
          player2_character_id: string | null;
          format: string;
          status: string;
          winner_address: string | null;
          player1_rounds_won: number;
          player2_rounds_won: number;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          room_code?: string | null;
          player1_address: string;
          player2_address?: string | null;
          player1_character_id?: string | null;
          player2_character_id?: string | null;
          format?: string;
          status?: string;
          winner_address?: string | null;
          player1_rounds_won?: number;
          player2_rounds_won?: number;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          room_code?: string | null;
          player1_address?: string;
          player2_address?: string | null;
          player1_character_id?: string | null;
          player2_character_id?: string | null;
          format?: string;
          status?: string;
          winner_address?: string | null;
          player1_rounds_won?: number;
          player2_rounds_won?: number;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_player1_address_fkey";
            columns: ["player1_address"];
            referencedRelation: "players";
            referencedColumns: ["address"];
          },
          {
            foreignKeyName: "matches_player2_address_fkey";
            columns: ["player2_address"];
            referencedRelation: "players";
            referencedColumns: ["address"];
          },
          {
            foreignKeyName: "matches_player1_character_id_fkey";
            columns: ["player1_character_id"];
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_player2_character_id_fkey";
            columns: ["player2_character_id"];
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_winner_address_fkey";
            columns: ["winner_address"];
            referencedRelation: "players";
            referencedColumns: ["address"];
          }
        ];
      };
      rounds: {
        Row: {
          id: string;
          match_id: string;
          round_number: number;
          player1_move: string | null;
          player2_move: string | null;
          player1_damage_dealt: number | null;
          player2_damage_dealt: number | null;
          player1_health_after: number | null;
          player2_health_after: number | null;
          winner_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          round_number: number;
          player1_move?: string | null;
          player2_move?: string | null;
          player1_damage_dealt?: number | null;
          player2_damage_dealt?: number | null;
          player1_health_after?: number | null;
          player2_health_after?: number | null;
          winner_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          round_number?: number;
          player1_move?: string | null;
          player2_move?: string | null;
          player1_damage_dealt?: number | null;
          player2_damage_dealt?: number | null;
          player1_health_after?: number | null;
          player2_health_after?: number | null;
          winner_address?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rounds_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rounds_winner_address_fkey";
            columns: ["winner_address"];
            referencedRelation: "players";
            referencedColumns: ["address"];
          }
        ];
      };
      moves: {
        Row: {
          id: string;
          round_id: string;
          player_address: string;
          move_type: string;
          tx_id: string | null;
          tx_confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          player_address: string;
          move_type: string;
          tx_id?: string | null;
          tx_confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          player_address?: string;
          move_type?: string;
          tx_id?: string | null;
          tx_confirmed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moves_round_id_fkey";
            columns: ["round_id"];
            referencedRelation: "rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moves_player_address_fkey";
            columns: ["player_address"];
            referencedRelation: "players";
            referencedColumns: ["address"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

/**
 * Helper type for table rows.
 */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/**
 * Helper type for table inserts.
 */
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

/**
 * Helper type for table updates.
 */
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
