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
      absence_requests: {
        Row: {
          absence_type_id: string
          approved_at: string | null
          approved_by: string | null
          comment: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          overlapping_shift_action: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          absence_type_id: string
          approved_at?: string | null
          approved_by?: string | null
          comment?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          overlapping_shift_action?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          total_days: number
          updated_at?: string
        }
        Update: {
          absence_type_id?: string
          approved_at?: string | null
          approved_by?: string | null
          comment?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          overlapping_shift_action?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absence_requests_absence_type_id_fkey"
            columns: ["absence_type_id"]
            isOneToOne: false
            referencedRelation: "absence_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      absence_types: {
        Row: {
          affects_salary: boolean | null
          color: string | null
          created_at: string
          from_account: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_documentation: boolean | null
          updated_at: string
        }
        Insert: {
          affects_salary?: boolean | null
          color?: string | null
          created_at?: string
          from_account?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_documentation?: boolean | null
          updated_at?: string
        }
        Update: {
          affects_salary?: boolean | null
          color?: string | null
          created_at?: string
          from_account?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_documentation?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      account_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "employee_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          request_type: string
          requestor_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          target_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          request_type: string
          requestor_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          target_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          request_type?: string
          requestor_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          target_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_requestor_id_fkey"
            columns: ["requestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_type: string
          created_at: string | null
          document_url: string | null
          employee_id: string
          expiry_date: string | null
          id: string
          issued_date: string | null
          issuer: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          certificate_type: string
          created_at?: string | null
          document_url?: string | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          issuer?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          certificate_type?: string
          created_at?: string | null
          document_url?: string | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          issuer?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_completions: {
        Row: {
          completed_at: string
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          shift_id: string | null
          status: string | null
          template_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          shift_id?: string | null
          status?: string | null
          template_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          shift_id?: string | null
          status?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_completions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_critical: boolean | null
          item_type: string | null
          max_value: number | null
          min_value: number | null
          sort_order: number | null
          template_id: string
          title: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_critical?: boolean | null
          item_type?: string | null
          max_value?: number | null
          min_value?: number | null
          sort_order?: number | null
          template_id: string
          title: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_critical?: boolean | null
          item_type?: string | null
          max_value?: number | null
          min_value?: number | null
          sort_order?: number | null
          template_id?: string
          title?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_responses: {
        Row: {
          checked: boolean | null
          completion_id: string
          created_at: string
          id: string
          is_flagged: boolean | null
          item_id: string
          notes: string | null
          photo_url: string | null
          value: string | null
        }
        Insert: {
          checked?: boolean | null
          completion_id: string
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          item_id: string
          notes?: string | null
          photo_url?: string | null
          value?: string | null
        }
        Update: {
          checked?: boolean | null
          completion_id?: string
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          item_id?: string
          notes?: string | null
          photo_url?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_responses_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "checklist_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_responses_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          category: string | null
          created_at: string
          department_id: string | null
          description: string | null
          frequency: string | null
          function_id: string | null
          id: string
          inspection_categories: string[] | null
          is_active: boolean | null
          is_required_for_clock_out: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          frequency?: string | null
          function_id?: string | null
          id?: string
          inspection_categories?: string[] | null
          is_active?: boolean | null
          is_required_for_clock_out?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          frequency?: string | null
          function_id?: string | null
          id?: string
          inspection_categories?: string[] | null
          is_active?: boolean | null
          is_required_for_clock_out?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_templates_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          certificate_expires_at: string | null
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          current_module_id: string | null
          employee_id: string
          id: string
          progress_percent: number | null
          score: number | null
          started_at: string | null
          updated_at: string
        }
        Insert: {
          certificate_expires_at?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          current_module_id?: string | null
          employee_id: string
          id?: string
          progress_percent?: number | null
          score?: number | null
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          certificate_expires_at?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          current_module_id?: string | null
          employee_id?: string
          id?: string
          progress_percent?: number | null
          score?: number | null
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_current_module_id_fkey"
            columns: ["current_module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          content: Json | null
          content_type: string
          course_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          sort_order: number | null
          title: string
        }
        Insert: {
          content?: Json | null
          content_type?: string
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          sort_order?: number | null
          title: string
        }
        Update: {
          content?: Json | null
          content_type?: string
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          certificate_valid_months: number | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          external_url: string | null
          id: string
          is_active: boolean | null
          is_external: boolean | null
          is_required: boolean | null
          required_for_functions: string[] | null
          required_for_roles: string[] | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          certificate_valid_months?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          is_required?: boolean | null
          required_for_functions?: string[] | null
          required_for_roles?: string[] | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          certificate_valid_months?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          is_required?: boolean | null
          required_for_functions?: string[] | null
          required_for_roles?: string[] | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      deviation_comments: {
        Row: {
          comment: string
          created_at: string
          created_by: string | null
          deviation_id: string
          id: string
        }
        Insert: {
          comment: string
          created_at?: string
          created_by?: string | null
          deviation_id: string
          id?: string
        }
        Update: {
          comment?: string
          created_at?: string
          created_by?: string | null
          deviation_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deviation_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviation_comments_deviation_id_fkey"
            columns: ["deviation_id"]
            isOneToOne: false
            referencedRelation: "deviations"
            referencedColumns: ["id"]
          },
        ]
      }
      deviations: {
        Row: {
          assigned_to: string | null
          category: string
          closed_at: string | null
          closed_by: string | null
          confirmation_image_url: string | null
          confirmation_notes: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          corrective_action: string | null
          created_at: string
          department_id: string | null
          description: string | null
          due_date: string | null
          id: string
          image_url: string | null
          inspection_category: string | null
          is_anonymous: boolean | null
          location: string | null
          preventive_action: string | null
          reported_by: string | null
          require_clock_out_confirmation: boolean | null
          root_cause: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          closed_by?: string | null
          confirmation_image_url?: string | null
          confirmation_notes?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          corrective_action?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          inspection_category?: string | null
          is_anonymous?: boolean | null
          location?: string | null
          preventive_action?: string | null
          reported_by?: string | null
          require_clock_out_confirmation?: boolean | null
          root_cause?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          closed_by?: string | null
          confirmation_image_url?: string | null
          confirmation_notes?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          corrective_action?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          inspection_category?: string | null
          is_anonymous?: boolean | null
          location?: string | null
          preventive_action?: string | null
          reported_by?: string | null
          require_clock_out_confirmation?: boolean | null
          root_cause?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deviations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_accounts: {
        Row: {
          account_type: string
          balance: number | null
          carried_over: number | null
          created_at: string
          employee_id: string
          id: string
          updated_at: string
          used: number | null
          year: number
        }
        Insert: {
          account_type: string
          balance?: number | null
          carried_over?: number | null
          created_at?: string
          employee_id: string
          id?: string
          updated_at?: string
          used?: number | null
          year: number
        }
        Update: {
          account_type?: string
          balance?: number | null
          carried_over?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          updated_at?: string
          used?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_accounts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_details: {
        Row: {
          accumulated_hours: number | null
          allow_mobile_clock: boolean | null
          competence_level: string | null
          contracted_hours_per_month: number | null
          contracted_hours_per_week: number | null
          created_at: string
          current_seniority_level: number | null
          employee_id: string
          employment_percentage: number | null
          end_date: string | null
          fixed_monthly_salary: number | null
          full_time_hours: number | null
          gps_required: boolean | null
          has_first_aid_course: boolean | null
          id: string
          included_night_hours: number | null
          is_fire_safety_leader: boolean | null
          is_food_safety_responsible: boolean | null
          is_safety_representative: boolean | null
          probation_end_date: string | null
          salary_type: string
          updated_at: string
          wage_ladder_id: string | null
        }
        Insert: {
          accumulated_hours?: number | null
          allow_mobile_clock?: boolean | null
          competence_level?: string | null
          contracted_hours_per_month?: number | null
          contracted_hours_per_week?: number | null
          created_at?: string
          current_seniority_level?: number | null
          employee_id: string
          employment_percentage?: number | null
          end_date?: string | null
          fixed_monthly_salary?: number | null
          full_time_hours?: number | null
          gps_required?: boolean | null
          has_first_aid_course?: boolean | null
          id?: string
          included_night_hours?: number | null
          is_fire_safety_leader?: boolean | null
          is_food_safety_responsible?: boolean | null
          is_safety_representative?: boolean | null
          probation_end_date?: string | null
          salary_type?: string
          updated_at?: string
          wage_ladder_id?: string | null
        }
        Update: {
          accumulated_hours?: number | null
          allow_mobile_clock?: boolean | null
          competence_level?: string | null
          contracted_hours_per_month?: number | null
          contracted_hours_per_week?: number | null
          created_at?: string
          current_seniority_level?: number | null
          employee_id?: string
          employment_percentage?: number | null
          end_date?: string | null
          fixed_monthly_salary?: number | null
          full_time_hours?: number | null
          gps_required?: boolean | null
          has_first_aid_course?: boolean | null
          id?: string
          included_night_hours?: number | null
          is_fire_safety_leader?: boolean | null
          is_food_safety_responsible?: boolean | null
          is_safety_representative?: boolean | null
          probation_end_date?: string | null
          salary_type?: string
          updated_at?: string
          wage_ladder_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_details_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_details_wage_ladder_id_fkey"
            columns: ["wage_ladder_id"]
            isOneToOne: false
            referencedRelation: "wage_ladders"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          category: string
          created_at: string
          employee_id: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_signed: boolean | null
          name: string
          notes: string | null
          signed_at: string | null
          signed_by: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          employee_id: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_signed?: boolean | null
          name: string
          notes?: string | null
          signed_at?: string | null
          signed_by?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          employee_id?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_signed?: boolean | null
          name?: string
          notes?: string | null
          signed_at?: string | null
          signed_by?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      equipment_inspections: {
        Row: {
          equipment_id: string
          id: string
          image_url: string | null
          inspected_at: string
          inspected_by: string | null
          inspection_type: string
          notes: string | null
          status: string
        }
        Insert: {
          equipment_id: string
          id?: string
          image_url?: string | null
          inspected_at?: string
          inspected_by?: string | null
          inspection_type?: string
          notes?: string | null
          status?: string
        }
        Update: {
          equipment_id?: string
          id?: string
          image_url?: string | null
          inspected_at?: string
          inspected_by?: string | null
          inspection_type?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_inspections_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "fire_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_inspections_inspected_by_fkey"
            columns: ["inspected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fire_drills: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          drill_type: string
          duration_minutes: number | null
          evacuation_time_seconds: number | null
          evaluation: string | null
          id: string
          improvement_points: string | null
          meeting_point: string | null
          notes: string | null
          participants_count: number | null
          responsible: string | null
          scheduled_date: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          drill_type?: string
          duration_minutes?: number | null
          evacuation_time_seconds?: number | null
          evaluation?: string | null
          id?: string
          improvement_points?: string | null
          meeting_point?: string | null
          notes?: string | null
          participants_count?: number | null
          responsible?: string | null
          scheduled_date: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          drill_type?: string
          duration_minutes?: number | null
          evacuation_time_seconds?: number | null
          evaluation?: string | null
          id?: string
          improvement_points?: string | null
          meeting_point?: string | null
          notes?: string | null
          participants_count?: number | null
          responsible?: string | null
          scheduled_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fire_drills_responsible_fkey"
            columns: ["responsible"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fire_equipment: {
        Row: {
          created_at: string
          equipment_type: string
          id: string
          last_inspected_at: string | null
          last_service_at: string | null
          location: string
          name: string
          next_inspection_date: string | null
          next_service_date: string | null
          notes: string | null
          qr_code: string | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_type: string
          id?: string
          last_inspected_at?: string | null
          last_service_at?: string | null
          location: string
          name: string
          next_inspection_date?: string | null
          next_service_date?: string | null
          notes?: string | null
          qr_code?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_type?: string
          id?: string
          last_inspected_at?: string | null
          last_service_at?: string | null
          location?: string
          name?: string
          next_inspection_date?: string | null
          next_service_date?: string | null
          notes?: string | null
          qr_code?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      inspection_reports: {
        Row: {
          created_at: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          inspection_type: string
          metadata: Json | null
          notes: string | null
          pdf_url: string | null
          period_from: string
          period_to: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          inspection_type: string
          metadata?: Json | null
          notes?: string | null
          pdf_url?: string | null
          period_from: string
          period_to: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          inspection_type?: string
          metadata?: Json | null
          notes?: string | null
          pdf_url?: string | null
          period_from?: string
          period_to?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_visits: {
        Row: {
          created_at: string | null
          deadline: string | null
          findings: Json | null
          id: string
          inspection_type: string
          inspector_name: string | null
          remarks: string | null
          report_url: string | null
          result: string | null
          updated_at: string | null
          visit_date: string
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          findings?: Json | null
          id?: string
          inspection_type: string
          inspector_name?: string | null
          remarks?: string | null
          report_url?: string | null
          result?: string | null
          updated_at?: string | null
          visit_date: string
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          findings?: Json | null
          id?: string
          inspection_type?: string
          inspector_name?: string | null
          remarks?: string | null
          report_url?: string | null
          result?: string | null
          updated_at?: string | null
          visit_date?: string
        }
        Relationships: []
      }
      inspections: {
        Row: {
          authority: string
          completed_date: string | null
          created_at: string
          id: string
          inspection_type: string
          inspector_name: string | null
          notes: string | null
          outcome: string | null
          report_url: string | null
          scheduled_date: string | null
          updated_at: string
        }
        Insert: {
          authority: string
          completed_date?: string | null
          created_at?: string
          id?: string
          inspection_type: string
          inspector_name?: string | null
          notes?: string | null
          outcome?: string | null
          report_url?: string | null
          scheduled_date?: string | null
          updated_at?: string
        }
        Update: {
          authority?: string
          completed_date?: string | null
          created_at?: string
          id?: string
          inspection_type?: string
          inspector_name?: string | null
          notes?: string | null
          outcome?: string | null
          report_url?: string | null
          scheduled_date?: string | null
          updated_at?: string
        }
        Relationships: []
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          department_id: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          employee_number: string | null
          employee_type: Database["public"]["Enums"]["employee_type"] | null
          full_name: string
          function_id: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          pin_code: string | null
          postal_code: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_number?: string | null
          employee_type?: Database["public"]["Enums"]["employee_type"] | null
          full_name: string
          function_id?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          pin_code?: string | null
          postal_code?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_number?: string | null
          employee_type?: Database["public"]["Enums"]["employee_type"] | null
          full_name?: string
          function_id?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          pin_code?: string | null
          postal_code?: string | null
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
      risk_assessments: {
        Row: {
          category: string | null
          consequence: number
          created_at: string
          created_by: string | null
          current_measures: string | null
          description: string | null
          id: string
          planned_measures: string | null
          probability: number
          responsible: string | null
          review_date: string | null
          risk_score: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          consequence?: number
          created_at?: string
          created_by?: string | null
          current_measures?: string | null
          description?: string | null
          id?: string
          planned_measures?: string | null
          probability?: number
          responsible?: string | null
          review_date?: string | null
          risk_score?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          consequence?: number
          created_at?: string
          created_by?: string | null
          current_measures?: string | null
          description?: string | null
          id?: string
          planned_measures?: string | null
          probability?: number
          responsible?: string | null
          review_date?: string | null
          risk_score?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_responsible_fkey"
            columns: ["responsible"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_round_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          finding: string | null
          id: string
          image_url: string | null
          round_id: string
          sort_order: number | null
          status: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          finding?: string | null
          id?: string
          image_url?: string | null
          round_id: string
          sort_order?: number | null
          status?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          finding?: string | null
          id?: string
          image_url?: string | null
          round_id?: string
          sort_order?: number | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_round_items_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "safety_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_rounds: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          notes: string | null
          scheduled_date: string
          signature_url: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          scheduled_date: string
          signature_url?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string
          signature_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_rounds_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_rounds_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_rounds_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_applicants: {
        Row: {
          applied_at: string
          employee_id: string
          id: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shift_id: string
          status: string
        }
        Insert: {
          applied_at?: string
          employee_id: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_id: string
          status?: string
        }
        Update: {
          applied_at?: string
          employee_id?: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_applicants_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_applicants_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_applicants_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_swap_requests: {
        Row: {
          colleague_approved_at: string | null
          created_at: string
          id: string
          manager_approved_at: string | null
          manager_approved_by: string | null
          original_shift_id: string
          reason: string | null
          requester_id: string
          status: string
          swap_type: string
          target_employee_id: string | null
          target_shift_id: string | null
          updated_at: string
        }
        Insert: {
          colleague_approved_at?: string | null
          created_at?: string
          id?: string
          manager_approved_at?: string | null
          manager_approved_by?: string | null
          original_shift_id: string
          reason?: string | null
          requester_id: string
          status?: string
          swap_type: string
          target_employee_id?: string | null
          target_shift_id?: string | null
          updated_at?: string
        }
        Update: {
          colleague_approved_at?: string | null
          created_at?: string
          id?: string
          manager_approved_at?: string | null
          manager_approved_by?: string | null
          original_shift_id?: string
          reason?: string | null
          requester_id?: string
          status?: string
          swap_type?: string
          target_employee_id?: string | null
          target_shift_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_manager_approved_by_fkey"
            columns: ["manager_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_original_shift_id_fkey"
            columns: ["original_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_employee_id_fkey"
            columns: ["target_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_shift_id_fkey"
            columns: ["target_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      temperature_logs: {
        Row: {
          created_at: string
          deviation_action: string | null
          id: string
          is_deviation: boolean | null
          logged_at: string
          logged_by: string | null
          source: string | null
          temperature: number
          unit_id: string
        }
        Insert: {
          created_at?: string
          deviation_action?: string | null
          id?: string
          is_deviation?: boolean | null
          logged_at?: string
          logged_by?: string | null
          source?: string | null
          temperature: number
          unit_id: string
        }
        Update: {
          created_at?: string
          deviation_action?: string | null
          id?: string
          is_deviation?: boolean | null
          logged_at?: string
          logged_by?: string | null
          source?: string | null
          temperature?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "temperature_logs_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temperature_logs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "temperature_units"
            referencedColumns: ["id"]
          },
        ]
      }
      temperature_units: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_iot: boolean | null
          location: string | null
          max_temp: number
          min_temp: number
          name: string
          sensor_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_iot?: boolean | null
          location?: string | null
          max_temp?: number
          min_temp?: number
          name: string
          sensor_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_iot?: boolean | null
          location?: string | null
          max_temp?: number
          min_temp?: number
          name?: string
          sensor_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      template_shifts: {
        Row: {
          break_minutes: number
          created_at: string
          day_of_week: number
          employee_id: string | null
          end_time: string
          function_id: string
          id: string
          start_time: string
          template_id: string
        }
        Insert: {
          break_minutes?: number
          created_at?: string
          day_of_week: number
          employee_id?: string | null
          end_time: string
          function_id: string
          id?: string
          start_time: string
          template_id: string
        }
        Update: {
          break_minutes?: number
          created_at?: string
          day_of_week?: number
          employee_id?: string | null
          end_time?: string
          function_id?: string
          id?: string
          start_time?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_shifts_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_shifts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          break_minutes: number | null
          clock_in: string | null
          clock_in_location: Json | null
          clock_out: string | null
          clock_out_location: Json | null
          created_at: string
          date: string
          deviation_minutes: number | null
          deviation_reason: string | null
          employee_id: string
          id: string
          manager_notes: string | null
          shift_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          clock_in?: string | null
          clock_in_location?: Json | null
          clock_out?: string | null
          clock_out_location?: Json | null
          created_at?: string
          date?: string
          deviation_minutes?: number | null
          deviation_reason?: string | null
          employee_id: string
          id?: string
          manager_notes?: string | null
          shift_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          clock_in?: string | null
          clock_in_location?: Json | null
          clock_out?: string | null
          clock_out_location?: Json | null
          created_at?: string
          date?: string
          deviation_minutes?: number | null
          deviation_reason?: string | null
          employee_id?: string
          id?: string
          manager_notes?: string | null
          shift_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
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
      wage_adjustments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          difference_per_hour: number
          employee_id: string
          id: string
          ladder_history_id: string | null
          new_rate: number
          old_rate: number
          period_end: string
          period_start: string
          status: string | null
          total_adjustment: number
          total_hours: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          difference_per_hour: number
          employee_id: string
          id?: string
          ladder_history_id?: string | null
          new_rate: number
          old_rate: number
          period_end: string
          period_start: string
          status?: string | null
          total_adjustment: number
          total_hours?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          difference_per_hour?: number
          employee_id?: string
          id?: string
          ladder_history_id?: string | null
          new_rate?: number
          old_rate?: number
          period_end?: string
          period_start?: string
          status?: string | null
          total_adjustment?: number
          total_hours?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wage_adjustments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wage_adjustments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wage_adjustments_ladder_history_id_fkey"
            columns: ["ladder_history_id"]
            isOneToOne: false
            referencedRelation: "wage_ladder_history"
            referencedColumns: ["id"]
          },
        ]
      }
      wage_ladder_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          effective_from: string
          id: string
          ladder_id: string
          level: number
          new_hourly_rate: number
          old_hourly_rate: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          effective_from: string
          id?: string
          ladder_id: string
          level: number
          new_hourly_rate: number
          old_hourly_rate?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          id?: string
          ladder_id?: string
          level?: number
          new_hourly_rate?: number
          old_hourly_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wage_ladder_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wage_ladder_history_ladder_id_fkey"
            columns: ["ladder_id"]
            isOneToOne: false
            referencedRelation: "wage_ladders"
            referencedColumns: ["id"]
          },
        ]
      }
      wage_ladder_levels: {
        Row: {
          created_at: string
          effective_from: string | null
          hourly_rate: number
          id: string
          ladder_id: string
          level: number
          max_hours: number | null
          min_hours: number
        }
        Insert: {
          created_at?: string
          effective_from?: string | null
          hourly_rate: number
          id?: string
          ladder_id: string
          level: number
          max_hours?: number | null
          min_hours?: number
        }
        Update: {
          created_at?: string
          effective_from?: string | null
          hourly_rate?: number
          id?: string
          ladder_id?: string
          level?: number
          max_hours?: number | null
          min_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "wage_ladder_levels_ladder_id_fkey"
            columns: ["ladder_id"]
            isOneToOne: false
            referencedRelation: "wage_ladders"
            referencedColumns: ["id"]
          },
        ]
      }
      wage_ladders: {
        Row: {
          competence_level: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          competence_level?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          competence_level?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      wage_supplements: {
        Row: {
          amount: number
          applies_to: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          supplement_type: string
          time_end: string | null
          time_start: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          applies_to: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          supplement_type: string
          time_end?: string | null
          time_start?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          applies_to?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          supplement_type?: string
          time_end?: string | null
          time_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      work_time_rules: {
        Row: {
          averaging_period_weeks: number
          break_required_after_hours: number
          break_required_after_hours_long: number
          created_at: string
          id: string
          is_active: boolean
          max_hours_per_day: number
          max_hours_per_day_extended: number
          max_hours_per_week: number
          max_hours_per_week_average: number
          max_overtime_per_week: number
          max_overtime_per_year: number
          min_break_minutes: number
          min_break_minutes_long: number
          min_rest_between_shifts: number
          name: string
          overtime_threshold_100_daily: number
          overtime_threshold_daily: number
          require_sunday_off: boolean
          sunday_off_frequency_weeks: number
          updated_at: string
          warn_at_percent_of_max: number
        }
        Insert: {
          averaging_period_weeks?: number
          break_required_after_hours?: number
          break_required_after_hours_long?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_hours_per_day?: number
          max_hours_per_day_extended?: number
          max_hours_per_week?: number
          max_hours_per_week_average?: number
          max_overtime_per_week?: number
          max_overtime_per_year?: number
          min_break_minutes?: number
          min_break_minutes_long?: number
          min_rest_between_shifts?: number
          name?: string
          overtime_threshold_100_daily?: number
          overtime_threshold_daily?: number
          require_sunday_off?: boolean
          sunday_off_frequency_weeks?: number
          updated_at?: string
          warn_at_percent_of_max?: number
        }
        Update: {
          averaging_period_weeks?: number
          break_required_after_hours?: number
          break_required_after_hours_long?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_hours_per_day?: number
          max_hours_per_day_extended?: number
          max_hours_per_week?: number
          max_hours_per_week_average?: number
          max_overtime_per_week?: number
          max_overtime_per_year?: number
          min_break_minutes?: number
          min_break_minutes_long?: number
          min_rest_between_shifts?: number
          name?: string
          overtime_threshold_100_daily?: number
          overtime_threshold_daily?: number
          require_sunday_off?: boolean
          sunday_off_frequency_weeks?: number
          updated_at?: string
          warn_at_percent_of_max?: number
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
