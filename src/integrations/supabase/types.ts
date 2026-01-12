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
      daily_logs: {
        Row: {
          contractors_on_site: string[] | null
          created_at: string
          date: string
          id: string
          issues: string | null
          photo_urls: string[] | null
          project_id: string
          updated_at: string
          work_performed: string | null
        }
        Insert: {
          contractors_on_site?: string[] | null
          created_at?: string
          date?: string
          id?: string
          issues?: string | null
          photo_urls?: string[] | null
          project_id: string
          updated_at?: string
          work_performed?: string | null
        }
        Update: {
          contractors_on_site?: string[] | null
          created_at?: string
          date?: string
          id?: string
          issues?: string | null
          photo_urls?: string[] | null
          project_id?: string
          updated_at?: string
          work_performed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          includes_tax: boolean
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
          receipt_url: string | null
          status: Database["public"]["Enums"]["expense_status"]
          tax_amount: number | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          includes_tax?: boolean
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          tax_amount?: number | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          includes_tax?: boolean
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id?: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          tax_amount?: number | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "project_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_categories: {
        Row: {
          category: Database["public"]["Enums"]["budget_category"]
          created_at: string
          estimated_budget: number
          id: string
          project_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          estimated_budget?: number
          id?: string
          project_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          estimated_budget?: number
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_reminder: boolean | null
          project_id: string
          reminder_date: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_reminder?: boolean | null
          project_id: string
          reminder_date?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_reminder?: boolean | null
          project_id?: string
          reminder_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_photos: {
        Row: {
          caption: string | null
          category: string | null
          created_at: string
          file_path: string
          id: string
          project_id: string
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string
          file_path: string
          id?: string
          project_id: string
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string
          file_path?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_vendors: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          project_id: string
          scheduled_date: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          scheduled_date?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          scheduled_date?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_vendors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string
          arv: number | null
          created_at: string
          id: string
          name: string
          purchase_price: number | null
          start_date: string
          status: Database["public"]["Enums"]["project_status"]
          total_budget: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          arv?: number | null
          created_at?: string
          id?: string
          name: string
          purchase_price?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          total_budget?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          arv?: number | null
          created_at?: string
          id?: string
          name?: string
          purchase_price?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          total_budget?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_expenses: {
        Row: {
          account_name: string | null
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          is_imported: boolean
          payment_method: string | null
          project_id: string | null
          qb_id: string
          updated_at: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          account_name?: string | null
          amount: number
          category_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_imported?: boolean
          payment_method?: string | null
          project_id?: string | null
          qb_id: string
          updated_at?: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          account_name?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_imported?: boolean
          payment_method?: string | null
          project_id?: string | null
          qb_id?: string
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "project_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quickbooks_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          realm_id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          realm_id: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          realm_id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          created_at: string
          email: string | null
          has_w9: boolean
          id: string
          insurance_expiry: string | null
          name: string
          phone: string | null
          pricing_model: Database["public"]["Enums"]["pricing_model"] | null
          reliability_rating: number | null
          trade: Database["public"]["Enums"]["vendor_trade"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          has_w9?: boolean
          id?: string
          insurance_expiry?: string | null
          name: string
          phone?: string | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          reliability_rating?: number | null
          trade: Database["public"]["Enums"]["vendor_trade"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          has_w9?: boolean
          id?: string
          insurance_expiry?: string | null
          name?: string
          phone?: string | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          reliability_rating?: number | null
          trade?: Database["public"]["Enums"]["vendor_trade"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      budget_category:
        | "plumbing"
        | "roofing"
        | "misc"
        | "flooring"
        | "painting"
        | "garage"
        | "foundation_repair"
        | "hvac"
        | "drywall"
        | "main_bathroom"
        | "carpentry"
        | "light_fixtures"
        | "appliances"
        | "natural_gas"
        | "permits_inspections"
        | "landscaping"
        | "dumpsters_trash"
        | "windows"
        | "cabinets"
        | "countertops"
        | "bathroom"
        | "electrical"
        | "kitchen"
        | "demolition"
        | "fencing"
        | "doors"
        | "water_heater"
        | "brick_siding_stucco"
        | "framing"
        | "hardware"
        | "insulation"
        | "pest_control"
        | "pool"
      expense_status: "estimate" | "actual"
      payment_method: "cash" | "check" | "card" | "transfer"
      pricing_model: "flat" | "hourly"
      project_status: "active" | "complete" | "on_hold"
      vendor_trade:
        | "plumbing"
        | "roofing"
        | "misc"
        | "flooring"
        | "painting"
        | "garage"
        | "foundation_repair"
        | "hvac"
        | "drywall"
        | "main_bathroom"
        | "carpentry"
        | "light_fixtures"
        | "appliances"
        | "natural_gas"
        | "permits_inspections"
        | "landscaping"
        | "dumpsters_trash"
        | "windows"
        | "cabinets"
        | "countertops"
        | "bathroom"
        | "electrical"
        | "kitchen"
        | "demolition"
        | "fencing"
        | "doors"
        | "water_heater"
        | "brick_siding_stucco"
        | "framing"
        | "hardware"
        | "insulation"
        | "pest_control"
        | "pool"
        | "general"
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
      budget_category: [
        "plumbing",
        "roofing",
        "misc",
        "flooring",
        "painting",
        "garage",
        "foundation_repair",
        "hvac",
        "drywall",
        "main_bathroom",
        "carpentry",
        "light_fixtures",
        "appliances",
        "natural_gas",
        "permits_inspections",
        "landscaping",
        "dumpsters_trash",
        "windows",
        "cabinets",
        "countertops",
        "bathroom",
        "electrical",
        "kitchen",
        "demolition",
        "fencing",
        "doors",
        "water_heater",
        "brick_siding_stucco",
        "framing",
        "hardware",
        "insulation",
        "pest_control",
        "pool",
      ],
      expense_status: ["estimate", "actual"],
      payment_method: ["cash", "check", "card", "transfer"],
      pricing_model: ["flat", "hourly"],
      project_status: ["active", "complete", "on_hold"],
      vendor_trade: [
        "plumbing",
        "roofing",
        "misc",
        "flooring",
        "painting",
        "garage",
        "foundation_repair",
        "hvac",
        "drywall",
        "main_bathroom",
        "carpentry",
        "light_fixtures",
        "appliances",
        "natural_gas",
        "permits_inspections",
        "landscaping",
        "dumpsters_trash",
        "windows",
        "cabinets",
        "countertops",
        "bathroom",
        "electrical",
        "kitchen",
        "demolition",
        "fencing",
        "doors",
        "water_heater",
        "brick_siding_stucco",
        "framing",
        "hardware",
        "insulation",
        "pest_control",
        "pool",
        "general",
      ],
    },
  },
} as const
