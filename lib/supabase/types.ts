import { UserRole } from "../types/database";

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
      users: {
        Row: {
          id: string;
          email: string;
          user_metadata: {
            name?: string;
            avatar_url?: string;
          } | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          user_metadata?: {
            name?: string;
            avatar_url?: string;
          } | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          user_metadata?: {
            name?: string;
            avatar_url?: string;
          } | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      otp_verifications: {
        Row: {
          id: string;
          user_id: string;
          otp_code: string;
          otp_hash: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          otp_code: string;
          otp_hash: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          otp_code?: string;
          otp_hash?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      registration_requests: {
        Row: {
          id: string;
          email: string;
          name: string;
          status: "pending" | "approved" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 