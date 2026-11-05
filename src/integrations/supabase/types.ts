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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          body: string
          class_name: string | null
          created_at: string
          id: string
          title: string
        }
        Insert: {
          author_id?: string
          body: string
          class_name?: string | null
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          author_id?: string
          body?: string
          class_name?: string | null
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          class_name: string
          created_at: string
          entry_date: string
          id: string
          teacher_id: string
          topics: string
        }
        Insert: {
          class_name: string
          created_at?: string
          entry_date?: string
          id?: string
          teacher_id?: string
          topics: string
        }
        Update: {
          class_name?: string
          created_at?: string
          entry_date?: string
          id?: string
          teacher_id?: string
          topics?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string
          event_date: string
          id: string
          place: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string
          event_date: string
          id?: string
          place?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          event_date?: string
          id?: string
          place?: string
          title?: string
        }
        Relationships: []
      }
      fees: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          paid_on: string | null
          payment_method: string | null
          receipt_no: string | null
          status: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          paid_on?: string | null
          payment_method?: string | null
          receipt_no?: string | null
          status?: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          paid_on?: string | null
          payment_method?: string | null
          receipt_no?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          attachment_name: string | null
          attachment_path: string | null
          class_name: string
          created_at: string
          due_date: string
          id: string
          instructions: string
          published: boolean
          subject: string
          teacher_id: string
          title: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_path?: string | null
          class_name: string
          created_at?: string
          due_date: string
          id?: string
          instructions?: string
          published?: boolean
          subject: string
          teacher_id?: string
          title: string
        }
        Update: {
          attachment_name?: string | null
          attachment_path?: string | null
          class_name?: string
          created_at?: string
          due_date?: string
          id?: string
          instructions?: string
          published?: boolean
          subject?: string
          teacher_id?: string
          title?: string
        }
        Relationships: []
      }
      marks: {
        Row: {
          assessment: string
          comment: string | null
          created_at: string
          id: string
          max_score: number
          published: boolean
          score: number
          student_id: string
          subject: string
          teacher_id: string
          term: string
        }
        Insert: {
          assessment: string
          comment?: string | null
          created_at?: string
          id?: string
          max_score?: number
          published?: boolean
          score: number
          student_id: string
          subject: string
          teacher_id?: string
          term: string
        }
        Update: {
          assessment?: string
          comment?: string | null
          created_at?: string
          id?: string
          max_score?: number
          published?: boolean
          score?: number
          student_id?: string
          subject?: string
          teacher_id?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          active: boolean
          class_name: string
          created_at: string
          full_name: string
          guardian_user_id: string | null
          id: string
          student_user_id: string | null
        }
        Insert: {
          active?: boolean
          class_name?: string
          created_at?: string
          full_name: string
          guardian_user_id?: string | null
          id?: string
          student_user_id?: string | null
        }
        Update: {
          active?: boolean
          class_name?: string
          created_at?: string
          full_name?: string
          guardian_user_id?: string | null
          id?: string
          student_user_id?: string | null
        }
        Relationships: []
      }
      teacher_assignments: {
        Row: {
          class_name: string
          created_at: string
          id: string
          subject: string
          teacher_id: string
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          subject: string
          teacher_id: string
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          subject?: string
          teacher_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      can_manage_teacher: { Args: { _target: string }; Returns: boolean }
      can_view_student: { Args: { _student_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      in_my_class: { Args: { _class: string }; Returns: boolean }
      is_staff: { Args: { _uid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student" | "parent" | "head_teacher"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "teacher", "student", "parent", "head_teacher"],
    },
  },
} as const
