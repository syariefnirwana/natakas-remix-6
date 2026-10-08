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
      account_status: {
        Row: {
          frozen: boolean
          reason: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          frozen?: boolean
          reason?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          frozen?: boolean
          reason?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_audit: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          detail: string | null
          id: string
          target: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          detail?: string | null
          id?: string
          target?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          detail?: string | null
          id?: string
          target?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          recipient_count: number
          status: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string
          id?: string
          recipient_count?: number
          status?: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          recipient_count?: number
          status?: string
          subject?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_desktop: string | null
          image_mobile: string | null
          link_url: string | null
          published: boolean
          sort_order: number
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_desktop?: string | null
          image_mobile?: string | null
          link_url?: string | null
          published?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_desktop?: string | null
          image_mobile?: string | null
          link_url?: string | null
          published?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          kind: Database["public"]["Enums"]["tx_type"]
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          kind: Database["public"]["Enums"]["tx_type"]
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["tx_type"]
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          provider: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          provider?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          provider?: string | null
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          enabled: boolean
          id: number
          message: string
          remind_time: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: number
          message?: string
          remind_time?: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: number
          message?: string
          remind_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          id: string
          note: string | null
          occurred_at: string
          receipt_path: string | null
          to_wallet_id: string | null
          type: Database["public"]["Enums"]["tx_type"]
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          occurred_at?: string
          receipt_path?: string | null
          to_wallet_id?: string | null
          type: Database["public"]["Enums"]["tx_type"]
          updated_at?: string
          user_id?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          occurred_at?: string
          receipt_path?: string | null
          to_wallet_id?: string | null
          type?: Database["public"]["Enums"]["tx_type"]
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
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
      wallets: {
        Row: {
          color: string | null
          created_at: string
          id: string
          initial_balance: number
          name: string
          template: string | null
          type: Database["public"]["Enums"]["wallet_type"]
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          initial_balance?: number
          name: string
          template?: string | null
          type: Database["public"]["Enums"]["wallet_type"]
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          initial_balance?: number
          name?: string
          template?: string | null
          type?: Database["public"]["Enums"]["wallet_type"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_accounts: {
        Args: never
        Returns: {
          created_at: string
          email: string
          frozen: boolean
          is_admin: boolean
          last_sign_in_at: string
          providers: string
          user_id: string
        }[]
      }
      admin_set_admin: {
        Args: { _make: boolean; _user: string }
        Returns: undefined
      }
      admin_set_frozen: {
        Args: { _frozen: boolean; _reason: string; _user: string }
        Returns: undefined
      }
      admin_user_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active: { Args: { _uid: string }; Returns: boolean }
      my_account_state: {
        Args: never
        Returns: {
          frozen: boolean
          is_admin: boolean
          reason: string
        }[]
      }
      recent_activity: {
        Args: { _limit?: number }
        Returns: {
          created_at: string
          initial: string
        }[]
      }
      wallet_balances: {
        Args: never
        Returns: {
          balance: number
          tx_count: number
          wallet_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      tx_type: "income" | "expense" | "transfer"
      wallet_type: "cash" | "bank" | "ewallet" | "custom"
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
      app_role: ["admin", "user"],
      tx_type: ["income", "expense", "transfer"],
      wallet_type: ["cash", "bank", "ewallet", "custom"],
    },
  },
} as const
