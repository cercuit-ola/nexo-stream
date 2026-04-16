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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_code: string
          bank_name: string
          created_at: string | null
          id: string
          is_default: boolean | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          account_name: string
          account_number: string
          bank_code: string
          bank_name: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_code?: string
          bank_name?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      gift_card_redemptions: {
        Row: {
          actioned_at: string | null
          actioned_by: string | null
          brand: string
          card_code: string
          card_currency: string
          card_pin: string | null
          card_value: number
          commission_amount: number
          commission_rate: number | null
          created_at: string | null
          id: string
          reference_number: string | null
          rejection_reason: string | null
          status: string | null
          submitted_at: string | null
          usdt_payout: number
          user_email: string | null
          user_id: string
        }
        Insert: {
          actioned_at?: string | null
          actioned_by?: string | null
          brand: string
          card_code: string
          card_currency: string
          card_pin?: string | null
          card_value: number
          commission_amount: number
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          reference_number?: string | null
          rejection_reason?: string | null
          status?: string | null
          submitted_at?: string | null
          usdt_payout: number
          user_email?: string | null
          user_id: string
        }
        Update: {
          actioned_at?: string | null
          actioned_by?: string | null
          brand?: string
          card_code?: string
          card_currency?: string
          card_pin?: string | null
          card_value?: number
          commission_amount?: number
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          reference_number?: string | null
          rejection_reason?: string | null
          status?: string | null
          submitted_at?: string | null
          usdt_payout?: number
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduler_positions: {
        Row: {
          created_at: string | null
          escrow_pubkey: string | null
          escrow_secret: string | null
          id: string
          num_weeks: number | null
          reference_number: string | null
          start_date: string | null
          status: string | null
          stellar_network: string | null
          total_amount: number
          type: string
          user_id: string
          weekly_amount: number | null
        }
        Insert: {
          created_at?: string | null
          escrow_pubkey?: string | null
          escrow_secret?: string | null
          id?: string
          num_weeks?: number | null
          reference_number?: string | null
          start_date?: string | null
          status?: string | null
          stellar_network?: string | null
          total_amount: number
          type: string
          user_id: string
          weekly_amount?: number | null
        }
        Update: {
          created_at?: string | null
          escrow_pubkey?: string | null
          escrow_secret?: string | null
          id?: string
          num_weeks?: number | null
          reference_number?: string | null
          start_date?: string | null
          status?: string | null
          stellar_network?: string | null
          total_amount?: number
          type?: string
          user_id?: string
          weekly_amount?: number | null
        }
        Relationships: []
      }
      scheduler_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          position_id: string
          stellar_tx_hash: string | null
          submitted: boolean | null
          submitted_at: string | null
          tx_envelope: string | null
          unlock_timestamp: number
          user_id: string
          week_number: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          position_id: string
          stellar_tx_hash?: string | null
          submitted?: boolean | null
          submitted_at?: string | null
          tx_envelope?: string | null
          unlock_timestamp: number
          user_id: string
          week_number: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          position_id?: string
          stellar_tx_hash?: string | null
          submitted?: boolean | null
          submitted_at?: string | null
          tx_envelope?: string | null
          unlock_timestamp?: number
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "scheduler_transactions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "scheduler_positions"
            referencedColumns: ["id"]
          },
        ]
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
      users: {
        Row: {
          bvn: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          kyc_rejection_reason: string | null
          kyc_status: string | null
          nin: string | null
          phone: string | null
          usdc_balance: number | null
          wallet_address: string | null
        }
        Insert: {
          bvn?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          kyc_rejection_reason?: string | null
          kyc_status?: string | null
          nin?: string | null
          phone?: string | null
          usdc_balance?: number | null
          wallet_address?: string | null
        }
        Update: {
          bvn?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          kyc_rejection_reason?: string | null
          kyc_status?: string | null
          nin?: string | null
          phone?: string | null
          usdc_balance?: number | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      vault_positions: {
        Row: {
          apy_rate: number
          created_at: string | null
          deposit_date: string
          id: string
          lock_tier: string
          principal_amount: number
          reference_number: string | null
          simulation_mode: boolean | null
          status: string | null
          unlock_date: string
          user_id: string
        }
        Insert: {
          apy_rate: number
          created_at?: string | null
          deposit_date?: string
          id?: string
          lock_tier: string
          principal_amount: number
          reference_number?: string | null
          simulation_mode?: boolean | null
          status?: string | null
          unlock_date: string
          user_id: string
        }
        Update: {
          apy_rate?: number
          created_at?: string | null
          deposit_date?: string
          id?: string
          lock_tier?: string
          principal_amount?: number
          reference_number?: string | null
          simulation_mode?: boolean | null
          status?: string | null
          unlock_date?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_name: string
          account_number: string
          admin_note: string | null
          bank_code: string
          bank_name: string
          completed_at: string | null
          created_at: string | null
          exchange_rate: number
          id: string
          ngn_amount: number
          paystack_reference: string | null
          reference_number: string | null
          status: string | null
          usdc_amount: number
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          admin_note?: string | null
          bank_code: string
          bank_name: string
          completed_at?: string | null
          created_at?: string | null
          exchange_rate: number
          id?: string
          ngn_amount: number
          paystack_reference?: string | null
          reference_number?: string | null
          status?: string | null
          usdc_amount: number
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          admin_note?: string | null
          bank_code?: string
          bank_name?: string
          completed_at?: string | null
          created_at?: string | null
          exchange_rate?: number
          id?: string
          ngn_amount?: number
          paystack_reference?: string | null
          reference_number?: string | null
          status?: string | null
          usdc_amount?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
