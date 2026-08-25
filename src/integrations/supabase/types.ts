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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          analyzed_at: string | null
          audience: string | null
          auto_reply_template: string | null
          auto_reply_tone: string
          created_at: string
          facebook_connected: boolean
          id: string
          industry: string | null
          instagram_connected: boolean
          name: string
          offer: string | null
          onboarded_at: string | null
          palette: Json
          positioning: string | null
          tone: string | null
          updated_at: string
          vibe_keywords: string[]
          website: string | null
          whatsapp_connected: boolean
        }
        Insert: {
          analyzed_at?: string | null
          audience?: string | null
          auto_reply_template?: string | null
          auto_reply_tone?: string
          created_at?: string
          facebook_connected?: boolean
          id?: string
          industry?: string | null
          instagram_connected?: boolean
          name: string
          offer?: string | null
          onboarded_at?: string | null
          palette?: Json
          positioning?: string | null
          tone?: string | null
          updated_at?: string
          vibe_keywords?: string[]
          website?: string | null
          whatsapp_connected?: boolean
        }
        Update: {
          analyzed_at?: string | null
          audience?: string | null
          auto_reply_template?: string | null
          auto_reply_tone?: string
          created_at?: string
          facebook_connected?: boolean
          id?: string
          industry?: string | null
          instagram_connected?: boolean
          name?: string
          offer?: string | null
          onboarded_at?: string | null
          palette?: Json
          positioning?: string | null
          tone?: string | null
          updated_at?: string
          vibe_keywords?: string[]
          website?: string | null
          whatsapp_connected?: boolean
        }
        Relationships: []
      }
      content_items: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string
          hashtags: string[]
          hook: string | null
          id: string
          notes: string | null
          path: string
          pattern: string | null
          script: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string
          hashtags?: string[]
          hook?: string | null
          id?: string
          notes?: string | null
          path?: string
          pattern?: string | null
          script?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string
          hashtags?: string[]
          hook?: string | null
          id?: string
          notes?: string | null
          path?: string
          pattern?: string | null
          script?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_messages: {
        Row: {
          automated: boolean
          body: string
          created_at: string
          direction: string
          id: string
          lead_id: string
        }
        Insert: {
          automated?: boolean
          body: string
          created_at?: string
          direction?: string
          id?: string
          lead_id: string
        }
        Update: {
          automated?: boolean
          body?: string
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          business_id: string
          channel: string
          created_at: string
          handle: string
          id: string
          intent_summary: string | null
          last_message_at: string
          name: string | null
          reason: string | null
          score: number
          source_content_id: string | null
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          business_id: string
          channel?: string
          created_at?: string
          handle: string
          id?: string
          intent_summary?: string | null
          last_message_at?: string
          name?: string | null
          reason?: string | null
          score?: number
          source_content_id?: string | null
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          channel?: string
          created_at?: string
          handle?: string
          id?: string
          intent_summary?: string | null
          last_message_at?: string
          name?: string | null
          reason?: string | null
          score?: number
          source_content_id?: string | null
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_content_id_fkey"
            columns: ["source_content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          ad_budget: number
          audience_notes: string | null
          business_id: string
          content_item_id: string | null
          created_at: string
          id: string
          platform: string
          publish_at: string
          status: string
          updated_at: string
        }
        Insert: {
          ad_budget?: number
          audience_notes?: string | null
          business_id: string
          content_item_id?: string | null
          created_at?: string
          id?: string
          platform?: string
          publish_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          ad_budget?: number
          audience_notes?: string | null
          business_id?: string
          content_item_id?: string | null
          created_at?: string
          id?: string
          platform?: string
          publish_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      shoot_requests: {
        Row: {
          brief: string | null
          business_id: string
          content_item_id: string | null
          created_at: string
          id: string
          location: string | null
          partner: string
          preferred_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          brief?: string | null
          business_id: string
          content_item_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          partner?: string
          preferred_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          brief?: string | null
          business_id?: string
          content_item_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          partner?: string
          preferred_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shoot_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shoot_requests_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
