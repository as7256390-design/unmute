export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          emotional_state: string | null
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emotional_state?: string | null
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emotional_state?: string | null
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      counseling_sessions: {
        Row: {
          counselor_id: string
          counselor_notes: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          scheduled_at: string
          status: string | null
          student_feedback: string | null
          student_user_id: string
          updated_at: string
        }
        Insert: {
          counselor_id: string
          counselor_notes?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          scheduled_at: string
          status?: string | null
          student_feedback?: string | null
          student_user_id: string
          updated_at?: string
        }
        Update: {
          counselor_id?: string
          counselor_notes?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          student_feedback?: string | null
          student_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counseling_sessions_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
        ]
      }
      counselor_availability: {
        Row: {
          counselor_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
        }
        Insert: {
          counselor_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
        }
        Update: {
          counselor_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "counselor_availability_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
        ]
      }
      counselors: {
        Row: {
          bio: string | null
          created_at: string
          experience_years: number | null
          id: string
          is_available: boolean | null
          name: string
          qualifications: string | null
          session_duration_minutes: number | null
          specialization: string[] | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          is_available?: boolean | null
          name: string
          qualifications?: string | null
          session_duration_minutes?: number | null
          specialization?: string[] | null
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          is_available?: boolean | null
          name?: string
          qualifications?: string | null
          session_duration_minutes?: number | null
          specialization?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      crisis_alerts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_reviewed: boolean | null
          keywords_matched: string[] | null
          reviewed_at: string | null
          severity: string
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_reviewed?: boolean | null
          keywords_matched?: string[] | null
          reviewed_at?: string | null
          severity: string
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_reviewed?: boolean | null
          keywords_matched?: string[] | null
          reviewed_at?: string | null
          severity?: string
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      institution_members: {
        Row: {
          id: string
          institution_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          institution_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          institution_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_members_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_mood_stats: {
        Row: {
          avg_mood_score: number | null
          created_at: string
          crisis_alerts_count: number | null
          date: string
          id: string
          institution_id: string
          stress_high_count: number | null
          stress_low_count: number | null
          stress_medium_count: number | null
          total_checkins: number | null
        }
        Insert: {
          avg_mood_score?: number | null
          created_at?: string
          crisis_alerts_count?: number | null
          date: string
          id?: string
          institution_id: string
          stress_high_count?: number | null
          stress_low_count?: number | null
          stress_medium_count?: number | null
          total_checkins?: number | null
        }
        Update: {
          avg_mood_score?: number | null
          created_at?: string
          crisis_alerts_count?: number | null
          date?: string
          id?: string
          institution_id?: string
          stress_high_count?: number | null
          stress_low_count?: number | null
          stress_medium_count?: number | null
          total_checkins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_mood_stats_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          admin_user_id: string
          code: string
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          code: string
          created_at?: string
          id?: string
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          created_at: string
          energy_level: number | null
          id: string
          logged_at: string
          mood_score: number
          notes: string | null
          stress_level: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_level?: number | null
          id?: string
          logged_at?: string
          mood_score: number
          notes?: string | null
          stress_level?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          energy_level?: number | null
          id?: string
          logged_at?: string
          mood_score?: number
          notes?: string | null
          stress_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      peer_listeners: {
        Row: {
          certified_at: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_certified: boolean | null
          rating: number | null
          total_sessions: number | null
          user_id: string
        }
        Insert: {
          certified_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_certified?: boolean | null
          rating?: number | null
          total_sessions?: number | null
          user_id: string
        }
        Update: {
          certified_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_certified?: boolean | null
          rating?: number | null
          total_sessions?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      program_days: {
        Row: {
          created_at: string
          day_number: number
          description: string
          duration_minutes: number | null
          exercise_content: Json
          exercise_type: string
          id: string
          program_id: string
          title: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string
          day_number: number
          description: string
          duration_minutes?: number | null
          exercise_content: Json
          exercise_type: string
          id?: string
          program_id: string
          title: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string
          day_number?: number
          description?: string
          duration_minutes?: number | null
          exercise_content?: Json
          exercise_type?: string
          id?: string
          program_id?: string
          title?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "wellness_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      relaxation_content: {
        Row: {
          audio_url: string | null
          category: string
          content_text: string | null
          created_at: string
          description: string
          duration_minutes: number | null
          id: string
          is_premium: boolean | null
          play_count: number | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          audio_url?: string | null
          category: string
          content_text?: string | null
          created_at?: string
          description: string
          duration_minutes?: number | null
          id?: string
          is_premium?: boolean | null
          play_count?: number | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          audio_url?: string | null
          category?: string
          content_text?: string | null
          created_at?: string
          description?: string
          duration_minutes?: number | null
          id?: string
          is_premium?: boolean | null
          play_count?: number | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      room_memberships: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "support_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "support_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          scheduled_for: string
          sent_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          scheduled_for: string
          sent_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      support_rooms: {
        Row: {
          category: string
          created_at: string
          description: string
          emoji: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          emoji: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      training_modules: {
        Row: {
          badge_id: string | null
          content: Json
          created_at: string
          description: string
          duration_minutes: number | null
          id: string
          is_required: boolean | null
          order_index: number
          title: string
        }
        Insert: {
          badge_id?: string | null
          content: Json
          created_at?: string
          description: string
          duration_minutes?: number | null
          id?: string
          is_required?: boolean | null
          order_index: number
          title: string
        }
        Update: {
          badge_id?: string | null
          content?: Json
          created_at?: string
          description?: string
          duration_minutes?: number | null
          id?: string
          is_required?: boolean | null
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content_history: {
        Row: {
          completed: boolean | null
          content_id: string
          id: string
          played_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          content_id: string
          id?: string
          played_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          content_id?: string
          id?: string
          played_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_content_history_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "relaxation_content"
            referencedColumns: ["id"]
          },
        ]
      }
      user_day_completions: {
        Row: {
          completed_at: string
          id: string
          notes: string | null
          program_day_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          notes?: string | null
          program_day_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          notes?: string | null
          program_day_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_day_completions_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string
          current_streak: number | null
          id: string
          last_activity_date: string | null
          level: number | null
          longest_streak: number | null
          total_breathing_exercises: number | null
          total_chat_sessions: number | null
          total_checkins: number | null
          total_grounding_exercises: number | null
          total_journal_entries: number | null
          updated_at: string
          user_id: string
          xp_points: number | null
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          total_breathing_exercises?: number | null
          total_chat_sessions?: number | null
          total_checkins?: number | null
          total_grounding_exercises?: number | null
          total_journal_entries?: number | null
          updated_at?: string
          user_id: string
          xp_points?: number | null
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          total_breathing_exercises?: number | null
          total_chat_sessions?: number | null
          total_checkins?: number | null
          total_grounding_exercises?: number | null
          total_journal_entries?: number | null
          updated_at?: string
          user_id?: string
          xp_points?: number | null
        }
        Relationships: []
      }
      user_program_progress: {
        Row: {
          completed_at: string | null
          current_day: number | null
          id: string
          program_id: string
          started_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_day?: number | null
          id?: string
          program_id: string
          started_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_day?: number | null
          id?: string
          program_id?: string
          started_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_program_progress_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "wellness_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_training_progress: {
        Row: {
          completed_at: string | null
          id: string
          module_id: string
          quiz_score: number | null
          started_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          module_id: string
          quiz_score?: number | null
          started_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          module_id?: string
          quiz_score?: number | null
          started_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_programs: {
        Row: {
          category: string
          created_at: string
          description: string
          difficulty: string | null
          duration_days: number
          icon: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          difficulty?: string | null
          duration_days: number
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          difficulty?: string | null
          duration_days?: number
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_crisis_moderator: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
