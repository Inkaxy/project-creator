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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      departments: {
        Row: {
          color: string | null
          created_at: string
          id: string
          location_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_functions: {
        Row: {
          certified_by: string | null
          certified_date: string | null
          created_at: string
          employee_id: string
          function_id: string
          id: string
          is_active: boolean | null
          notes: string | null
          proficiency_level: string
          updated_at: string
        }
        Insert: {
          certified_by?: string | null
          certified_date?: string | null
          created_at?: string
          employee_id: string
          function_id: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          proficiency_level?: string
          updated_at?: string
        }
        Update: {
          certified_by?: string | null
          certified_date?: string | null
          created_at?: string
          employee_id?: string
          function_id?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          proficiency_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_functions_certified_by_fkey"
            columns: ["certified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_functions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_functions_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
        ]
      }
      functions: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          default_break_minutes: number | null
          default_end: string | null
          default_start: string | null
          department_id: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_staff: number | null
          min_staff: number | null
          name: string
          short_name: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          default_break_minutes?: number | null
          default_end?: string | null
          default_start?: string | null
          department_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_staff?: number | null
          min_staff?: number | null
          name: string
          short_name?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          default_break_minutes?: number | null
          default_end?: string | null
          default_start?: string | null
          department_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_staff?: number | null
          min_staff?: number | null
          name?: string
          short_name?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "functions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          gps_lat: number | null
          gps_lng: number | null
          gps_radius: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          gps_radius?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          gps_radius?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          email: string
          employee_type: Database["public"]["Enums"]["employee_type"] | null
          full_name: string
          function_id: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          pin_code: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          employee_type?: Database["public"]["Enums"]["employee_type"] | null
          full_name: string
          function_id?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          pin_code?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          employee_type?: Database["public"]["Enums"]["employee_type"] | null
          full_name?: string
          function_id?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          pin_code?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          actual_break_minutes: number | null
          actual_end: string | null
          actual_start: string | null
          created_at: string
          created_by: string | null
          date: string
          employee_id: string | null
          function_id: string | null
          id: string
          internal_notes: string | null
          is_holiday: boolean | null
          is_night_shift: boolean | null
          is_weekend: boolean | null
          notes: string | null
          planned_break_minutes: number | null
          planned_end: string
          planned_start: string
          published_at: string | null
          published_by: string | null
          shift_type: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_break_minutes?: number | null
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          employee_id?: string | null
          function_id?: string | null
          id?: string
          internal_notes?: string | null
          is_holiday?: boolean | null
          is_night_shift?: boolean | null
          is_weekend?: boolean | null
          notes?: string | null
          planned_break_minutes?: number | null
          planned_end: string
          planned_start: string
          published_at?: string | null
          published_by?: string | null
          shift_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_break_minutes?: number | null
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          employee_id?: string | null
          function_id?: string | null
          id?: string
          internal_notes?: string | null
          is_holiday?: boolean | null
          is_night_shift?: boolean | null
          is_weekend?: boolean | null
          notes?: string | null
          planned_break_minutes?: number | null
          planned_end?: string
          planned_start?: string
          published_at?: string | null
          published_by?: string | null
          shift_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_department_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "superadmin" | "daglig_leder" | "avdelingsleder" | "ansatt"
      employee_type:
        | "fast"
        | "deltid"
        | "tilkalling"
        | "vikar"
        | "laerling"
        | "sesong"
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
    Enums: {
      app_role: ["superadmin", "daglig_leder", "avdelingsleder", "ansatt"],
      employee_type: [
        "fast",
        "deltid",
        "tilkalling",
        "vikar",
        "laerling",
        "sesong",
      ],
    },
  },
} as const
