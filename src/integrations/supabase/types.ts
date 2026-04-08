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
      budget_templates: {
        Row: {
          arv: number | null
          category_budgets: Json
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          purchase_price: number | null
          sqft: number | null
          total_budget: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          arv?: number | null
          category_budgets?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          purchase_price?: number | null
          sqft?: number | null
          total_budget?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          arv?: number | null
          category_budgets?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          purchase_price?: number | null
          sqft?: number | null
          total_budget?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          includes_tax: boolean
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          project_id: string | null
          receipt_url: string | null
          tax_amount: number | null
          updated_at: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          includes_tax?: boolean
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id?: string | null
          receipt_url?: string | null
          tax_amount?: number | null
          updated_at?: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          includes_tax?: boolean
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id?: string | null
          receipt_url?: string | null
          tax_amount?: number | null
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          checklist: Json | null
          completed_at: string | null
          created_at: string
          end_date: string
          event_category: string
          expected_date: string | null
          id: string
          is_completed: boolean
          is_critical_path: boolean
          lead_time_days: number | null
          linked_task_id: string | null
          notes: string | null
          project_id: string
          recurrence_group_id: string | null
          recurrence_rule: string | null
          recurrence_until: string | null
          start_date: string
          title: string
          trade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string
          end_date: string
          event_category: string
          expected_date?: string | null
          id?: string
          is_completed?: boolean
          is_critical_path?: boolean
          lead_time_days?: number | null
          linked_task_id?: string | null
          notes?: string | null
          project_id: string
          recurrence_group_id?: string | null
          recurrence_rule?: string | null
          recurrence_until?: string | null
          start_date: string
          title: string
          trade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string
          end_date?: string
          event_category?: string
          expected_date?: string | null
          id?: string
          is_completed?: boolean
          is_critical_path?: boolean
          lead_time_days?: number | null
          linked_task_id?: string | null
          notes?: string | null
          project_id?: string
          recurrence_group_id?: string | null
          recurrence_rule?: string | null
          recurrence_until?: string | null
          start_date?: string
          title?: string
          trade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_linked_task_id_fkey"
            columns: ["linked_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          logo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_date: string
          activity_type: string
          contact_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          outcome: string | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type?: string
          contact_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          contact_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_calendar_events: {
        Row: {
          contact_id: string
          created_at: string
          duration_minutes: number | null
          event_date: string
          event_type: string
          id: string
          notes: string | null
          reminder: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          duration_minutes?: number | null
          event_date: string
          event_type?: string
          id?: string
          notes?: string | null
          reminder?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          duration_minutes?: number | null
          event_date?: string
          event_type?: string
          id?: string
          notes?: string | null
          reminder?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_calendar_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          asking_price: number | null
          bathrooms: number | null
          bedrooms: number | null
          contact_type: string
          contact_type_other: string | null
          created_at: string
          email: string | null
          estimated_arv: number | null
          estimated_repair: number | null
          first_name: string
          has_liens: string | null
          id: string
          is_dnc: boolean
          is_occupied: string | null
          last_contacted_at: string | null
          last_name: string
          mortgage_balance: number | null
          motivation_level: number | null
          next_followup_at: string | null
          notes: string | null
          offer_amount: number | null
          phone: string
          phone_secondary: string | null
          previous_wholesale_attempts: boolean
          previous_wholesale_details: string | null
          priority: string | null
          property_address: string | null
          property_city: string | null
          property_notes: string | null
          property_state: string | null
          property_type: string | null
          property_zip: string | null
          reason_for_selling: string[] | null
          selling_timeline: string | null
          source: string
          source_other: string | null
          sqft: number | null
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
          year_built: number | null
        }
        Insert: {
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          contact_type?: string
          contact_type_other?: string | null
          created_at?: string
          email?: string | null
          estimated_arv?: number | null
          estimated_repair?: number | null
          first_name: string
          has_liens?: string | null
          id?: string
          is_dnc?: boolean
          is_occupied?: string | null
          last_contacted_at?: string | null
          last_name: string
          mortgage_balance?: number | null
          motivation_level?: number | null
          next_followup_at?: string | null
          notes?: string | null
          offer_amount?: number | null
          phone?: string
          phone_secondary?: string | null
          previous_wholesale_attempts?: boolean
          previous_wholesale_details?: string | null
          priority?: string | null
          property_address?: string | null
          property_city?: string | null
          property_notes?: string | null
          property_state?: string | null
          property_type?: string | null
          property_zip?: string | null
          reason_for_selling?: string[] | null
          selling_timeline?: string | null
          source?: string
          source_other?: string | null
          sqft?: number | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
          year_built?: number | null
        }
        Update: {
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          contact_type?: string
          contact_type_other?: string | null
          created_at?: string
          email?: string | null
          estimated_arv?: number | null
          estimated_repair?: number | null
          first_name?: string
          has_liens?: string | null
          id?: string
          is_dnc?: boolean
          is_occupied?: string | null
          last_contacted_at?: string | null
          last_name?: string
          mortgage_balance?: number | null
          motivation_level?: number | null
          next_followup_at?: string | null
          notes?: string | null
          offer_amount?: number | null
          phone?: string
          phone_secondary?: string | null
          previous_wholesale_attempts?: boolean
          previous_wholesale_details?: string | null
          priority?: string | null
          property_address?: string | null
          property_city?: string | null
          property_notes?: string | null
          property_state?: string | null
          property_type?: string | null
          property_zip?: string | null
          reason_for_selling?: string[] | null
          selling_timeline?: string | null
          source?: string
          source_other?: string | null
          sqft?: number | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          year_built?: number | null
        }
        Relationships: []
      }
      crm_offers: {
        Row: {
          contact_id: string
          counter_amount: number | null
          created_at: string
          id: string
          method: string
          notes: string | null
          offer_amount: number
          offer_date: string
          response: string
          user_id: string
        }
        Insert: {
          contact_id: string
          counter_amount?: number | null
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          offer_amount?: number
          offer_date?: string
          response?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          counter_amount?: number | null
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          offer_amount?: number
          offer_date?: string
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_offers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_tasks: {
        Row: {
          created_at: string
          daily_log_id: string
          description: string
          id: string
          is_complete: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_log_id: string
          description: string
          id?: string
          is_complete?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_log_id?: string
          description?: string
          id?: string
          is_complete?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_tasks_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
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
      document_folders: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_project_id_fkey"
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
          category_id: string | null
          cost_type: string
          created_at: string
          date: string
          description: string | null
          expense_type: string | null
          id: string
          includes_tax: boolean
          is_hidden: boolean
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
          qb_expense_id: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["expense_status"]
          tax_amount: number | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          cost_type?: string
          created_at?: string
          date?: string
          description?: string | null
          expense_type?: string | null
          id?: string
          includes_tax?: boolean
          is_hidden?: boolean
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
          qb_expense_id?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          tax_amount?: number | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          cost_type?: string
          created_at?: string
          date?: string
          description?: string | null
          expense_type?: string | null
          id?: string
          includes_tax?: boolean
          is_hidden?: boolean
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id?: string
          qb_expense_id?: string | null
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
      loan_draws: {
        Row: {
          created_at: string
          date_funded: string | null
          draw_amount: number
          draw_number: number
          draw_percentage: number | null
          expected_date: string | null
          id: string
          loan_id: string
          milestone_name: string | null
          notes: string | null
          status: string
        }
        Insert: {
          created_at?: string
          date_funded?: string | null
          draw_amount?: number
          draw_number?: number
          draw_percentage?: number | null
          expected_date?: string | null
          id?: string
          loan_id: string
          milestone_name?: string | null
          notes?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          date_funded?: string | null
          draw_amount?: number
          draw_number?: number
          draw_percentage?: number | null
          expected_date?: string | null
          id?: string
          loan_id?: string
          milestone_name?: string | null
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_draws_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          expense_id: string | null
          id: string
          interest_portion: number | null
          late_fee: number | null
          loan_id: string | null
          notes: string | null
          payment_type: string
          principal_portion: number | null
          project_id: string
          source: string
          updated_at: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description?: string | null
          expense_id?: string | null
          id?: string
          interest_portion?: number | null
          late_fee?: number | null
          loan_id?: string | null
          notes?: string | null
          payment_type?: string
          principal_portion?: number | null
          project_id: string
          source?: string
          updated_at?: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          expense_id?: string | null
          id?: string
          interest_portion?: number | null
          late_fee?: number | null
          loan_id?: string | null
          notes?: string | null
          payment_type?: string
          principal_portion?: number | null
          project_id?: string
          source?: string
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_presets: {
        Row: {
          closing_costs_percent: number | null
          created_at: string | null
          id: string
          interest_only: boolean | null
          interest_rate: number
          is_default: boolean | null
          loan_term_months: number
          name: string
          points: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          closing_costs_percent?: number | null
          created_at?: string | null
          id?: string
          interest_only?: boolean | null
          interest_rate: number
          is_default?: boolean | null
          loan_term_months: number
          name: string
          points: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          closing_costs_percent?: number | null
          created_at?: string | null
          id?: string
          interest_only?: boolean | null
          interest_rate?: number
          is_default?: boolean | null
          loan_term_months?: number
          name?: string
          points?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          amortization_period_months: number | null
          collateral_description: string | null
          collateral_type: string | null
          created_at: string
          custom_draw_terms: string | null
          draw_structure: string | null
          extension_fee: number | null
          extension_terms: string | null
          first_payment_date: string | null
          has_draws: boolean
          has_personal_guarantee: boolean
          has_prepayment_penalty: boolean
          id: string
          interest_calc_method: string
          interest_rate: number
          lender_contact: string | null
          lender_name: string
          loan_term_months: number
          loan_type: string
          loan_type_other: string | null
          ltv_at_origination: number | null
          maturity_date: string
          monthly_payment: number | null
          nickname: string | null
          notes: string | null
          original_amount: number
          origination_fee_dollars: number | null
          origination_fee_points: number | null
          other_closing_costs: number | null
          outstanding_balance: number
          payment_frequency: string
          payment_frequency_custom: string | null
          prepayment_penalty_terms: string | null
          project_id: string | null
          rate_type: string
          start_date: string
          status: string
          total_draw_amount: number | null
          updated_at: string
          user_id: string
          variable_adjustment_frequency: string | null
          variable_index: string | null
          variable_margin: number | null
          variable_rate_cap: number | null
          variable_rate_floor: number | null
        }
        Insert: {
          amortization_period_months?: number | null
          collateral_description?: string | null
          collateral_type?: string | null
          created_at?: string
          custom_draw_terms?: string | null
          draw_structure?: string | null
          extension_fee?: number | null
          extension_terms?: string | null
          first_payment_date?: string | null
          has_draws?: boolean
          has_personal_guarantee?: boolean
          has_prepayment_penalty?: boolean
          id?: string
          interest_calc_method?: string
          interest_rate?: number
          lender_contact?: string | null
          lender_name: string
          loan_term_months?: number
          loan_type?: string
          loan_type_other?: string | null
          ltv_at_origination?: number | null
          maturity_date?: string
          monthly_payment?: number | null
          nickname?: string | null
          notes?: string | null
          original_amount?: number
          origination_fee_dollars?: number | null
          origination_fee_points?: number | null
          other_closing_costs?: number | null
          outstanding_balance?: number
          payment_frequency?: string
          payment_frequency_custom?: string | null
          prepayment_penalty_terms?: string | null
          project_id?: string | null
          rate_type?: string
          start_date?: string
          status?: string
          total_draw_amount?: number | null
          updated_at?: string
          user_id: string
          variable_adjustment_frequency?: string | null
          variable_index?: string | null
          variable_margin?: number | null
          variable_rate_cap?: number | null
          variable_rate_floor?: number | null
        }
        Update: {
          amortization_period_months?: number | null
          collateral_description?: string | null
          collateral_type?: string | null
          created_at?: string
          custom_draw_terms?: string | null
          draw_structure?: string | null
          extension_fee?: number | null
          extension_terms?: string | null
          first_payment_date?: string | null
          has_draws?: boolean
          has_personal_guarantee?: boolean
          has_prepayment_penalty?: boolean
          id?: string
          interest_calc_method?: string
          interest_rate?: number
          lender_contact?: string | null
          lender_name?: string
          loan_term_months?: number
          loan_type?: string
          loan_type_other?: string | null
          ltv_at_origination?: number | null
          maturity_date?: string
          monthly_payment?: number | null
          nickname?: string | null
          notes?: string | null
          original_amount?: number
          origination_fee_dollars?: number | null
          origination_fee_points?: number | null
          other_closing_costs?: number | null
          outstanding_balance?: number
          payment_frequency?: string
          payment_frequency_custom?: string | null
          prepayment_penalty_terms?: string | null
          project_id?: string | null
          rate_type?: string
          start_date?: string
          status?: string
          total_draw_amount?: number | null
          updated_at?: string
          user_id?: string
          variable_adjustment_frequency?: string | null
          variable_index?: string | null
          variable_margin?: number | null
          variable_rate_cap?: number | null
          variable_rate_floor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          entity_id: string | null
          event_type: string
          id: string
          is_read: boolean
          owner_id: string
          payload: Json
        }
        Insert: {
          actor_id: string
          created_at?: string
          entity_id?: string | null
          event_type: string
          id?: string
          is_read?: boolean
          owner_id: string
          payload?: Json
        }
        Update: {
          actor_id?: string
          created_at?: string
          entity_id?: string | null
          event_type?: string
          id?: string
          is_read?: boolean
          owner_id?: string
          payload?: Json
        }
        Relationships: []
      }
      operation_codes: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          is_pinned: boolean | null
          order_index: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          is_pinned?: boolean | null
          order_index?: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          is_pinned?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      owner_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          recipient_id: string | null
          sender_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          recipient_id?: string | null
          sender_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          recipient_id?: string | null
          sender_id?: string
          team_id?: string
        }
        Relationships: []
      }
      pending_receipts: {
        Row: {
          created_at: string
          id: string
          match_confidence: number | null
          matched_at: string | null
          matched_qb_id: string | null
          purchase_date: string
          raw_text: string | null
          receipt_image_url: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_confidence?: number | null
          matched_at?: string | null
          matched_qb_id?: string | null
          purchase_date: string
          raw_text?: string | null
          receipt_image_url?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id: string
          vendor_name: string
        }
        Update: {
          created_at?: string
          id?: string
          match_confidence?: number | null
          matched_at?: string | null
          matched_qb_id?: string | null
          purchase_date?: string
          raw_text?: string | null
          receipt_image_url?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          vendor_name?: string
        }
        Relationships: []
      }
      procurement_bundles: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_bundles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_item_bundles: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          item_id: string
          quantity: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          item_id: string
          quantity?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          item_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "procurement_item_bundles_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "procurement_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurement_item_bundles_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "procurement_items"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_items: {
        Row: {
          bulk_discount_eligible: boolean | null
          bundle_id: string | null
          category: string | null
          category_id: string | null
          created_at: string
          finish: string | null
          id: string
          image_url: string | null
          includes_tax: boolean
          is_pack_price: boolean
          lead_time_days: number | null
          model_number: string | null
          name: string
          notes: string | null
          phase: string | null
          project_id: string | null
          quantity: number
          source_store: string | null
          source_url: string | null
          status: string | null
          tax_rate: number | null
          unit_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bulk_discount_eligible?: boolean | null
          bundle_id?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          finish?: string | null
          id?: string
          image_url?: string | null
          includes_tax?: boolean
          is_pack_price?: boolean
          lead_time_days?: number | null
          model_number?: string | null
          name: string
          notes?: string | null
          phase?: string | null
          project_id?: string | null
          quantity?: number
          source_store?: string | null
          source_url?: string | null
          status?: string | null
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bulk_discount_eligible?: boolean | null
          bundle_id?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          finish?: string | null
          id?: string
          image_url?: string | null
          includes_tax?: boolean
          is_pack_price?: boolean
          lead_time_days?: number | null
          model_number?: string | null
          name?: string
          notes?: string | null
          phase?: string | null
          project_id?: string | null
          quantity?: number
          source_store?: string | null
          source_url?: string | null
          status?: string | null
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procurement_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "procurement_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurement_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "project_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurement_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_order_request_items: {
        Row: {
          created_at: string
          id: string
          item_image_url: string | null
          item_name: string
          item_source_store: string | null
          item_source_url: string | null
          order_request_id: string
          owner_decision: string | null
          owner_notes: string | null
          procurement_item_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_image_url?: string | null
          item_name: string
          item_source_store?: string | null
          item_source_url?: string | null
          order_request_id: string
          owner_decision?: string | null
          owner_notes?: string | null
          procurement_item_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_image_url?: string | null
          item_name?: string
          item_source_store?: string | null
          item_source_url?: string | null
          order_request_id?: string
          owner_decision?: string | null
          owner_notes?: string | null
          procurement_item_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "procurement_order_request_items_order_request_id_fkey"
            columns: ["order_request_id"]
            isOneToOne: false
            referencedRelation: "procurement_order_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_order_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          status: string
          submitted_by: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          submitted_by: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          submitted_by?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          budget_presets: Json | null
          city: string | null
          created_at: string
          detail_tab_order: Json | null
          first_name: string | null
          hidden_project_tabs: Json | null
          id: string
          last_name: string | null
          project_tab_order: Json | null
          settings_data: Json | null
          starred_projects: Json | null
          state: string | null
          subscription_tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_presets?: Json | null
          city?: string | null
          created_at?: string
          detail_tab_order?: Json | null
          first_name?: string | null
          hidden_project_tabs?: Json | null
          id?: string
          last_name?: string | null
          project_tab_order?: Json | null
          settings_data?: Json | null
          starred_projects?: Json | null
          state?: string | null
          subscription_tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_presets?: Json | null
          city?: string | null
          created_at?: string
          detail_tab_order?: Json | null
          first_name?: string | null
          hidden_project_tabs?: Json | null
          id?: string
          last_name?: string | null
          project_tab_order?: Json | null
          settings_data?: Json | null
          starred_projects?: Json | null
          state?: string | null
          subscription_tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      project_documents: {
        Row: {
          category: string
          created_at: string
          document_date: string | null
          file_name: string
          file_path: string
          file_size: number
          folder_id: string | null
          id: string
          notes: string | null
          project_id: string
          title: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          document_date?: string | null
          file_name: string
          file_path: string
          file_size?: number
          folder_id?: string | null
          id?: string
          notes?: string | null
          project_id: string
          title?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          document_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          folder_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_info: {
        Row: {
          created_at: string
          custom_fields: Json
          drain_line_material: string | null
          electrical_status: string | null
          foundation_status: string | null
          gas_electric: string | null
          hvac_condenser: string | null
          hvac_furnace: string | null
          hvac_year: string | null
          id: string
          plumbing_status: string | null
          project_id: string
          roof_type: string | null
          roof_year: string | null
          updated_at: string
          user_id: string
          window_status: string | null
        }
        Insert: {
          created_at?: string
          custom_fields?: Json
          drain_line_material?: string | null
          electrical_status?: string | null
          foundation_status?: string | null
          gas_electric?: string | null
          hvac_condenser?: string | null
          hvac_furnace?: string | null
          hvac_year?: string | null
          id?: string
          plumbing_status?: string | null
          project_id: string
          roof_type?: string | null
          roof_year?: string | null
          updated_at?: string
          user_id: string
          window_status?: string | null
        }
        Update: {
          created_at?: string
          custom_fields?: Json
          drain_line_material?: string | null
          electrical_status?: string | null
          foundation_status?: string | null
          gas_electric?: string | null
          hvac_condenser?: string | null
          hvac_furnace?: string | null
          hvac_year?: string | null
          id?: string
          plumbing_status?: string | null
          project_id?: string
          roof_type?: string | null
          roof_year?: string | null
          updated_at?: string
          user_id?: string
          window_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_info_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
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
          photo_date: string | null
          project_id: string
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string
          file_path: string
          id?: string
          photo_date?: string | null
          project_id: string
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string
          file_path?: string
          id?: string
          photo_date?: string | null
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
      project_procurement_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          project_id: string
          quantity: number
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          project_id: string
          quantity?: number
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          project_id?: string
          quantity?: number
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_procurement_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "procurement_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_procurement_items_project_id_fkey"
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
          line_items: Json
          notes: string | null
          project_id: string
          scheduled_date: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_items?: Json
          notes?: string | null
          project_id: string
          scheduled_date?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          line_items?: Json
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
          annual_hoa: number | null
          annual_insurance: number | null
          annual_property_taxes: number | null
          arv: number | null
          cashflow_hoa_period: string | null
          cashflow_insurance_period: string | null
          cashflow_maintenance_period: string | null
          cashflow_rehab_mode: string | null
          cashflow_rehab_override: number | null
          cashflow_tax_period: string | null
          closing_costs_flat: number | null
          closing_costs_mode: string
          closing_costs_pct: number | null
          completed_date: string | null
          cover_photo_path: string | null
          cover_photo_position: string | null
          created_at: string
          est_labor_budget: number | null
          est_materials_budget: number | null
          hm_closing_costs: number | null
          hm_interest_only: boolean | null
          hm_interest_rate: number | null
          hm_loan_amount: number | null
          hm_loan_start_date: string | null
          hm_loan_term_months: number | null
          hm_points: number | null
          hm_use_to_date: boolean | null
          holding_costs_flat: number | null
          holding_costs_mode: string
          holding_costs_pct: number | null
          id: string
          interest_rate: number | null
          loan_amount: number | null
          loan_term_years: number | null
          management_rate: number | null
          monthly_maintenance: number | null
          monthly_rent: number | null
          name: string
          pending_budget: Json | null
          project_type: Database["public"]["Enums"]["project_type"]
          purchase_price: number | null
          start_date: string
          status: Database["public"]["Enums"]["project_status"]
          total_budget: number
          updated_at: string
          user_id: string
          vacancy_rate: number | null
        }
        Insert: {
          address: string
          annual_hoa?: number | null
          annual_insurance?: number | null
          annual_property_taxes?: number | null
          arv?: number | null
          cashflow_hoa_period?: string | null
          cashflow_insurance_period?: string | null
          cashflow_maintenance_period?: string | null
          cashflow_rehab_mode?: string | null
          cashflow_rehab_override?: number | null
          cashflow_tax_period?: string | null
          closing_costs_flat?: number | null
          closing_costs_mode?: string
          closing_costs_pct?: number | null
          completed_date?: string | null
          cover_photo_path?: string | null
          cover_photo_position?: string | null
          created_at?: string
          est_labor_budget?: number | null
          est_materials_budget?: number | null
          hm_closing_costs?: number | null
          hm_interest_only?: boolean | null
          hm_interest_rate?: number | null
          hm_loan_amount?: number | null
          hm_loan_start_date?: string | null
          hm_loan_term_months?: number | null
          hm_points?: number | null
          hm_use_to_date?: boolean | null
          holding_costs_flat?: number | null
          holding_costs_mode?: string
          holding_costs_pct?: number | null
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          loan_term_years?: number | null
          management_rate?: number | null
          monthly_maintenance?: number | null
          monthly_rent?: number | null
          name: string
          pending_budget?: Json | null
          project_type?: Database["public"]["Enums"]["project_type"]
          purchase_price?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          total_budget?: number
          updated_at?: string
          user_id: string
          vacancy_rate?: number | null
        }
        Update: {
          address?: string
          annual_hoa?: number | null
          annual_insurance?: number | null
          annual_property_taxes?: number | null
          arv?: number | null
          cashflow_hoa_period?: string | null
          cashflow_insurance_period?: string | null
          cashflow_maintenance_period?: string | null
          cashflow_rehab_mode?: string | null
          cashflow_rehab_override?: number | null
          cashflow_tax_period?: string | null
          closing_costs_flat?: number | null
          closing_costs_mode?: string
          closing_costs_pct?: number | null
          completed_date?: string | null
          cover_photo_path?: string | null
          cover_photo_position?: string | null
          created_at?: string
          est_labor_budget?: number | null
          est_materials_budget?: number | null
          hm_closing_costs?: number | null
          hm_interest_only?: boolean | null
          hm_interest_rate?: number | null
          hm_loan_amount?: number | null
          hm_loan_start_date?: string | null
          hm_loan_term_months?: number | null
          hm_points?: number | null
          hm_use_to_date?: boolean | null
          holding_costs_flat?: number | null
          holding_costs_mode?: string
          holding_costs_pct?: number | null
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          loan_term_years?: number | null
          management_rate?: number | null
          monthly_maintenance?: number | null
          monthly_rent?: number | null
          name?: string
          pending_budget?: Json | null
          project_type?: Database["public"]["Enums"]["project_type"]
          purchase_price?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          total_budget?: number
          updated_at?: string
          user_id?: string
          vacancy_rate?: number | null
        }
        Relationships: []
      }
      quarterly_goals: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          due_date: string | null
          id: string
          quarter: string
          start_date: string | null
          target_value: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          due_date?: string | null
          id?: string
          quarter: string
          start_date?: string | null
          target_value: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          due_date?: string | null
          id?: string
          quarter?: string
          start_date?: string | null
          target_value?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_expenses: {
        Row: {
          account_name: string | null
          amount: number
          category_id: string | null
          cost_type: string
          created_at: string
          date: string
          description: string | null
          expense_type: string | null
          hidden_at: string | null
          id: string
          is_hidden: boolean
          is_imported: boolean
          notes: string | null
          original_amount: number | null
          payment_method: string | null
          project_id: string | null
          qb_id: string
          receipt_url: string | null
          updated_at: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          account_name?: string | null
          amount: number
          category_id?: string | null
          cost_type?: string
          created_at?: string
          date: string
          description?: string | null
          expense_type?: string | null
          hidden_at?: string | null
          id?: string
          is_hidden?: boolean
          is_imported?: boolean
          notes?: string | null
          original_amount?: number | null
          payment_method?: string | null
          project_id?: string | null
          qb_id: string
          receipt_url?: string | null
          updated_at?: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          account_name?: string | null
          amount?: number
          category_id?: string | null
          cost_type?: string
          created_at?: string
          date?: string
          description?: string | null
          expense_type?: string | null
          hidden_at?: string | null
          id?: string
          is_hidden?: boolean
          is_imported?: boolean
          notes?: string | null
          original_amount?: number | null
          payment_method?: string | null
          project_id?: string | null
          qb_id?: string
          receipt_url?: string | null
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
      receipt_line_items: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          item_name: string
          notes: string | null
          project_id: string | null
          quantity: number | null
          receipt_id: string
          suggested_category: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          item_name: string
          notes?: string | null
          project_id?: string | null
          quantity?: number | null
          receipt_id: string
          suggested_category?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          item_name?: string
          notes?: string | null
          project_id?: string | null
          quantity?: number | null
          receipt_id?: string
          suggested_category?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipt_line_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "project_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_line_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "pending_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string
          sender_role: string
          subject: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string
          sender_role?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          sender_role?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          daily_log_id: string | null
          description: string | null
          due_date: string | null
          end_time: string | null
          id: string
          is_daily: boolean
          is_scheduled: boolean
          photo_urls: string[] | null
          priority_level: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          scheduled_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_log_id?: string | null
          description?: string | null
          due_date?: string | null
          end_time?: string | null
          id?: string
          is_daily?: boolean
          is_scheduled?: boolean
          photo_urls?: string[] | null
          priority_level?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_log_id?: string | null
          description?: string | null
          due_date?: string | null
          end_time?: string | null
          id?: string
          is_daily?: boolean
          is_scheduled?: boolean
          photo_urls?: string[] | null
          priority_level?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          email: string
          expires_at: string | null
          id: string
          invited_at: string
          role: string
          status: string
          team_id: string
          token: string | null
        }
        Insert: {
          email: string
          expires_at?: string | null
          id?: string
          invited_at?: string
          role?: string
          status?: string
          team_id: string
          token?: string | null
        }
        Update: {
          email?: string
          expires_at?: string | null
          id?: string
          invited_at?: string
          role?: string
          status?: string
          team_id?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_role_permissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string | null
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          owner_id?: string
        }
        Relationships: []
      }
      vendor_folder_assignments: {
        Row: {
          created_at: string | null
          folder_id: string
          id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id: string
          id?: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string
          id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_folder_assignments_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "vendor_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_folder_assignments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_folders: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
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
          name: string
          notes: string | null
          phone: string | null
          pricing_model: Database["public"]["Enums"]["pricing_model"] | null
          reliability_rating: number | null
          trades: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          has_w9?: boolean
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          reliability_rating?: number | null
          trades?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          has_w9?: boolean
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          reliability_rating?: number | null
          trades?: string[]
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
      accept_invitation_by_token: {
        Args: { p_email: string; p_token: string; p_user_id: string }
        Returns: Json
      }
      accept_pending_invitations: {
        Args: { p_email: string; p_user_id: string }
        Returns: undefined
      }
      add_budget_category: { Args: { new_value: string }; Returns: undefined }
      get_actor_display_name: { Args: { p_user_id: string }; Returns: string }
      get_team_owner_id: { Args: { p_user_id: string }; Returns: string }
      get_user_team_id: { Args: { p_user_id: string }; Returns: string }
      is_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
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
        | "cloud_storage"
        | "continuing_education"
        | "crm_software"
        | "gas_mileage"
        | "internet_phone"
        | "tech_equipment"
        | "licensing_fees"
        | "marketing_advertising"
        | "meals_entertainment"
        | "office_supplies"
        | "online_courses"
        | "postage_shipping"
        | "professional_dues"
        | "subscriptions"
        | "tools_equipment_business"
        | "travel_expenses"
        | "cleaning_final_punch"
        | "closing_costs"
        | "driveway_concrete"
        | "food"
        | "hoa"
        | "insurance_project"
        | "railing"
        | "staging"
        | "taxes"
        | "tile"
        | "utilities"
        | "variable"
        | "drain_line_repair"
        | "wholesale_fee"
        | "final_punch"
        | "cleaning"
        | "rehab_filler"
        | "permits"
        | "inspections"
        | "test"
        | "foundation"
        | "water"
        | "gas"
        | "electric"
        | "insurance"
        | "property_tax"
        | "lawn_care"
        | "pool_maintenance"
        | "internet_cable"
        | "trash_recycling"
        | "security_alarm"
        | "trims"
        | "loan_costs"
        | "architect"
        | "survey"
      expense_status: "estimate" | "actual"
      payment_method: "cash" | "check" | "card" | "transfer" | "financed"
      pricing_model: "flat" | "hourly"
      project_status: "active" | "complete" | "on_hold"
      project_type:
        | "fix_flip"
        | "rental"
        | "new_construction"
        | "wholesaling"
        | "contractor"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed"
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
        | "cleaning_final_punch"
        | "driveway_concrete"
        | "railing"
        | "staging"
        | "tile"
        | "drain_line_repair"
        | "permits"
        | "inspections"
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
        "cloud_storage",
        "continuing_education",
        "crm_software",
        "gas_mileage",
        "internet_phone",
        "tech_equipment",
        "licensing_fees",
        "marketing_advertising",
        "meals_entertainment",
        "office_supplies",
        "online_courses",
        "postage_shipping",
        "professional_dues",
        "subscriptions",
        "tools_equipment_business",
        "travel_expenses",
        "cleaning_final_punch",
        "closing_costs",
        "driveway_concrete",
        "food",
        "hoa",
        "insurance_project",
        "railing",
        "staging",
        "taxes",
        "tile",
        "utilities",
        "variable",
        "drain_line_repair",
        "wholesale_fee",
        "final_punch",
        "cleaning",
        "rehab_filler",
        "permits",
        "inspections",
        "test",
        "foundation",
        "water",
        "gas",
        "electric",
        "insurance",
        "property_tax",
        "lawn_care",
        "pool_maintenance",
        "internet_cable",
        "trash_recycling",
        "security_alarm",
        "trims",
        "loan_costs",
        "architect",
        "survey",
      ],
      expense_status: ["estimate", "actual"],
      payment_method: ["cash", "check", "card", "transfer", "financed"],
      pricing_model: ["flat", "hourly"],
      project_status: ["active", "complete", "on_hold"],
      project_type: [
        "fix_flip",
        "rental",
        "new_construction",
        "wholesaling",
        "contractor",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed"],
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
        "cleaning_final_punch",
        "driveway_concrete",
        "railing",
        "staging",
        "tile",
        "drain_line_repair",
        "permits",
        "inspections",
      ],
    },
  },
} as const
