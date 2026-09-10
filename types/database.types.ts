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
      action_fee_orders: {
        Row: {
          action_type: string
          amount: number
          created_at: string | null
          id: string
          metadata: Json | null
          payment_id: string | null
          payment_order_id: string
          payment_status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_order_id: string
          payment_status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_order_id?: string
          payment_status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          admin_id: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          note: string
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          note: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          note?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_avatar: string | null
          author_name: string
          author_role: string
          canonical_url: string | null
          category: string
          content: string
          cover_image: string
          created_at: string
          excerpt: string
          featured: boolean
          format: string | null
          id: string
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          published_at: string
          reading_time_minutes: number
          slug: string
          status: string
          subtitle: string | null
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string
          author_role?: string
          canonical_url?: string | null
          category?: string
          content: string
          cover_image: string
          created_at?: string
          excerpt: string
          featured?: boolean
          format?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          published_at?: string
          reading_time_minutes?: number
          slug: string
          status?: string
          subtitle?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          author_role?: string
          canonical_url?: string | null
          category?: string
          content?: string
          cover_image?: string
          created_at?: string
          excerpt?: string
          featured?: boolean
          format?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          published_at?: string
          reading_time_minutes?: number
          slug?: string
          status?: string
          subtitle?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      auth_otps: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          otp_hash: string
          phone: string
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          otp_hash: string
          phone: string
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_hash?: string
          phone?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          property_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          property_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          property_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_guests: {
        Row: {
          booking_id: string | null
          created_at: string
          email: string | null
          guest_index: number
          guest_profile_id: string | null
          id: string
          is_primary: boolean | null
          name: string | null
          paid_at: string | null
          payment_amount: number | null
          payment_id: string | null
          payment_order_id: string | null
          payment_status: string | null
          phone: string | null
          verification_status: string | null
          verification_token: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          email?: string | null
          guest_index: number
          guest_profile_id?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_id?: string | null
          payment_order_id?: string | null
          payment_status?: string | null
          phone?: string | null
          verification_status?: string | null
          verification_token?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          email?: string | null
          guest_index?: number
          guest_profile_id?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_id?: string | null
          payment_order_id?: string | null
          payment_status?: string | null
          phone?: string | null
          verification_status?: string | null
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_guests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_guests_guest_profile_id_fkey"
            columns: ["guest_profile_id"]
            isOneToOne: false
            referencedRelation: "guest_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          additional_guest_fee_per_night: number | null
          additional_guest_payment_mode: string | null
          additional_guest_total_amount: number | null
          additional_guests_count: number | null
          base_price: number | null
          booking_status: string | null
          check_in: string
          check_out: string
          created_at: string | null
          default_guests: number | null
          extracted_metadata: Json | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guests: number
          id: string
          id_verification_status: string | null
          is_screenshot_verified: boolean | null
          payment_method: string | null
          payment_order_id: string | null
          payment_status: string | null
          platform: string | null
          proof_screenshots: string[] | null
          space_id: string | null
          status: string | null
          total_price: number
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_guest_fee_per_night?: number | null
          additional_guest_payment_mode?: string | null
          additional_guest_total_amount?: number | null
          additional_guests_count?: number | null
          base_price?: number | null
          booking_status?: string | null
          check_in: string
          check_out: string
          created_at?: string | null
          default_guests?: number | null
          extracted_metadata?: Json | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests: number
          id?: string
          id_verification_status?: string | null
          is_screenshot_verified?: boolean | null
          payment_method?: string | null
          payment_order_id?: string | null
          payment_status?: string | null
          platform?: string | null
          proof_screenshots?: string[] | null
          space_id?: string | null
          status?: string | null
          total_price: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_guest_fee_per_night?: number | null
          additional_guest_payment_mode?: string | null
          additional_guest_total_amount?: number | null
          additional_guests_count?: number | null
          base_price?: number | null
          booking_status?: string | null
          check_in?: string
          check_out?: string
          created_at?: string | null
          default_guests?: number | null
          extracted_metadata?: Json | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests?: number
          id?: string
          id_verification_status?: string | null
          is_screenshot_verified?: boolean | null
          payment_method?: string | null
          payment_order_id?: string | null
          payment_status?: string | null
          platform?: string | null
          proof_screenshots?: string[] | null
          space_id?: string | null
          status?: string | null
          total_price?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_sources: {
        Row: {
          created_at: string | null
          id: string
          inbound_ical_url: string
          is_active: boolean | null
          last_synced_at: string | null
          platform: string
          space_id: string
          sync_error: string | null
          sync_status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inbound_ical_url: string
          is_active?: boolean | null
          last_synced_at?: string | null
          platform: string
          space_id: string
          sync_error?: string | null
          sync_status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inbound_ical_url?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          platform?: string
          space_id?: string
          sync_error?: string | null
          sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_sources_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chatflows: {
        Row: {
          channel: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          response_template: string
          trigger_event: string
          trigger_keyword: string | null
          updated_at: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          response_template: string
          trigger_event: string
          trigger_keyword?: string | null
          updated_at?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          response_template?: string
          trigger_event?: string
          trigger_keyword?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_content_blocks: {
        Row: {
          block_key: string
          body: string | null
          cta_link: string | null
          cta_text: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          block_key: string
          body?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          block_key?: string
          body?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_reply: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          replied_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          replied_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          replied_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          channel: string
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          sender_id: string | null
          sender_name: string | null
          sender_type: string
          status: string | null
        }
        Insert: {
          channel: string
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
          sender_name?: string | null
          sender_type: string
          status?: string | null
        }
        Update: {
          channel?: string
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
          sender_name?: string | null
          sender_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          active_flow: string | null
          assigned_to: string | null
          booking_id: string | null
          created_at: string | null
          flow_context: Json | null
          flow_step: string | null
          guest_profile_id: string | null
          id: string
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          active_flow?: string | null
          assigned_to?: string | null
          booking_id?: string | null
          created_at?: string | null
          flow_context?: Json | null
          flow_step?: string | null
          guest_profile_id?: string | null
          id?: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          active_flow?: string | null
          assigned_to?: string | null
          booking_id?: string | null
          created_at?: string | null
          flow_context?: Json | null
          flow_step?: string | null
          guest_profile_id?: string | null
          id?: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_guest_profile_id_fkey"
            columns: ["guest_profile_id"]
            isOneToOne: false
            referencedRelation: "guest_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_topics: {
        Row: {
          created_at: string | null
          event_id: string
          group_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          group_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_topics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "sanctuary_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_topics_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      external_blocked_dates: {
        Row: {
          created_at: string | null
          end_date: string
          external_uid: string | null
          id: string
          source_id: string
          space_id: string
          start_date: string
          summary: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          external_uid?: string | null
          id?: string
          source_id: string
          space_id: string
          start_date: string
          summary?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          external_uid?: string | null
          id?: string
          source_id?: string
          space_id?: string
          start_date?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_blocked_dates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "calendar_sync_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_blocked_dates_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          gateway_transaction_id: string | null
          id: string
          payment_gateway: string | null
          status: string
          transaction_type: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          gateway_transaction_id?: string | null
          id?: string
          payment_gateway?: string | null
          status: string
          transaction_type: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          gateway_transaction_id?: string | null
          id?: string
          payment_gateway?: string | null
          status?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_leads: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          experience: string | null
          id: string
          investment_budget: string | null
          message: string | null
          name: string
          phone: string | null
          property_location: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          experience?: string | null
          id?: string
          investment_budget?: string | null
          message?: string | null
          name: string
          phone?: string | null
          property_location?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          experience?: string | null
          id?: string
          investment_budget?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          property_location?: string | null
          status?: string | null
        }
        Relationships: []
      }
      gathering_vettings: {
        Row: {
          attendee_id: string
          created_at: string | null
          event_id: string | null
          id: string
          marshall_alias: string | null
          marshall_id: string
          notes: string | null
          verification_method: string | null
          verified_at: string | null
        }
        Insert: {
          attendee_id: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          marshall_alias?: string | null
          marshall_id: string
          notes?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Update: {
          attendee_id?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          marshall_alias?: string | null
          marshall_id?: string
          notes?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gathering_vettings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "sanctuary_events"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          approved_at: string | null
          created_at: string | null
          group_id: string
          id: string
          joined_at: string | null
          kinkster_id: string
          role: string | null
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          group_id: string
          id?: string
          joined_at?: string | null
          kinkster_id: string
          role?: string | null
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          group_id?: string
          id?: string
          joined_at?: string | null
          kinkster_id?: string
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_kinkster_id_fkey"
            columns: ["kinkster_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          category: string | null
          cover_url: string | null
          created_at: string | null
          description: string
          display_order: number | null
          id: string
          is_canonical: boolean
          members_count: number | null
          moderation_state: string | null
          name: string
          owner_id: string | null
          rules: string | null
          slug: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          description: string
          display_order?: number | null
          id?: string
          is_canonical?: boolean
          members_count?: number | null
          moderation_state?: string | null
          name: string
          owner_id?: string | null
          rules?: string | null
          slug: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string
          display_order?: number | null
          id?: string
          is_canonical?: boolean
          members_count?: number | null
          moderation_state?: string | null
          name?: string
          owner_id?: string | null
          rules?: string | null
          slug?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_profiles: {
        Row: {
          created_at: string
          dob: string | null
          document_number: string | null
          face_id_score: number | null
          face_id_vetted: boolean | null
          face_id_vetted_at: string | null
          full_name: string
          id: string
          id_back_url: string | null
          id_document_type: string | null
          id_document_url: string | null
          id_front_url: string | null
          in_person_vetted: boolean | null
          in_person_vetted_at: string | null
          is_foreign_national: boolean | null
          is_in_person_vetted: boolean | null
          is_prestored: boolean | null
          is_verified: boolean | null
          live_face_angles: Json | null
          live_face_url: string | null
          nationality: string | null
          permanent_address: string | null
          phone: string | null
          phone_number: string | null
          photo_url: string | null
          police_register_status: string | null
          prestored_from_booking_id: string | null
          prestored_metadata: Json | null
          user_id: string | null
          verification_expires_at: string | null
          verification_timestamp: string | null
          visa_number: string | null
        }
        Insert: {
          created_at?: string
          dob?: string | null
          document_number?: string | null
          face_id_score?: number | null
          face_id_vetted?: boolean | null
          face_id_vetted_at?: string | null
          full_name: string
          id?: string
          id_back_url?: string | null
          id_document_type?: string | null
          id_document_url?: string | null
          id_front_url?: string | null
          in_person_vetted?: boolean | null
          in_person_vetted_at?: string | null
          is_foreign_national?: boolean | null
          is_in_person_vetted?: boolean | null
          is_prestored?: boolean | null
          is_verified?: boolean | null
          live_face_angles?: Json | null
          live_face_url?: string | null
          nationality?: string | null
          permanent_address?: string | null
          phone?: string | null
          phone_number?: string | null
          photo_url?: string | null
          police_register_status?: string | null
          prestored_from_booking_id?: string | null
          prestored_metadata?: Json | null
          user_id?: string | null
          verification_expires_at?: string | null
          verification_timestamp?: string | null
          visa_number?: string | null
        }
        Update: {
          created_at?: string
          dob?: string | null
          document_number?: string | null
          face_id_score?: number | null
          face_id_vetted?: boolean | null
          face_id_vetted_at?: string | null
          full_name?: string
          id?: string
          id_back_url?: string | null
          id_document_type?: string | null
          id_document_url?: string | null
          id_front_url?: string | null
          in_person_vetted?: boolean | null
          in_person_vetted_at?: string | null
          is_foreign_national?: boolean | null
          is_in_person_vetted?: boolean | null
          is_prestored?: boolean | null
          is_verified?: boolean | null
          live_face_angles?: Json | null
          live_face_url?: string | null
          nationality?: string | null
          permanent_address?: string | null
          phone?: string | null
          phone_number?: string | null
          photo_url?: string | null
          police_register_status?: string | null
          prestored_from_booking_id?: string | null
          prestored_metadata?: Json | null
          user_id?: string | null
          verification_expires_at?: string | null
          verification_timestamp?: string | null
          visa_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_profiles_prestored_from_booking_id_fkey"
            columns: ["prestored_from_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      housekeeping_tasks: {
        Row: {
          ai_cleanliness_score: number | null
          ai_inspection_result: Json | null
          assigned_to: string | null
          booking_id: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          inspection_image_url: string | null
          notes: string | null
          scheduled_date: string | null
          space_id: string
          status: string | null
          task_type: string
          updated_at: string | null
        }
        Insert: {
          ai_cleanliness_score?: number | null
          ai_inspection_result?: Json | null
          assigned_to?: string | null
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          inspection_image_url?: string | null
          notes?: string | null
          scheduled_date?: string | null
          space_id: string
          status?: string | null
          task_type: string
          updated_at?: string | null
        }
        Update: {
          ai_cleanliness_score?: number | null
          ai_inspection_result?: Json | null
          assigned_to?: string | null
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          inspection_image_url?: string | null
          notes?: string | null
          scheduled_date?: string | null
          space_id?: string
          status?: string | null
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_property_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_co_stay_invites: {
        Row: {
          created_at: string | null
          description: string | null
          host_kinkster_id: string
          id: string
          is_active: boolean | null
          preferred_dates_description: string | null
          space_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          host_kinkster_id: string
          id?: string
          is_active?: boolean | null
          preferred_dates_description?: string | null
          space_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          host_kinkster_id?: string
          id?: string
          is_active?: boolean | null
          preferred_dates_description?: string | null
          space_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_co_stay_invites_host_kinkster_id_fkey"
            columns: ["host_kinkster_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_co_stay_invites_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          is_hidden: boolean | null
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          status: string | null
          unread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "kinkster_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_conversations: {
        Row: {
          context_data: Json | null
          context_id: string | null
          context_type: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          last_message_at: string | null
          last_message_id: string | null
          last_message_preview: string | null
          retention_policy: string | null
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          context_data?: Json | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          last_message_preview?: string | null
          retention_policy?: string | null
          title?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          context_data?: Json | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          last_message_preview?: string | null
          retention_policy?: string | null
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_direct_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          is_view_once: boolean | null
          media_url: string | null
          message: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_view_once?: boolean | null
          media_url?: string | null
          message: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_view_once?: boolean | null
          media_url?: string | null
          message?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_ephemeral_messages: {
        Row: {
          burn_countdown_seconds: number | null
          burnt_at: string | null
          chamber_token: string
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_burnt: boolean | null
          media_url: string | null
          message_type: string | null
          sender_id: string
        }
        Insert: {
          burn_countdown_seconds?: number | null
          burnt_at?: string | null
          chamber_token: string
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_burnt?: boolean | null
          media_url?: string | null
          message_type?: string | null
          sender_id: string
        }
        Update: {
          burn_countdown_seconds?: number | null
          burnt_at?: string | null
          chamber_token?: string
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_burnt?: boolean | null
          media_url?: string | null
          message_type?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_ephemeral_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_event_rsvps: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          kinkster_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          kinkster_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          kinkster_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "kinkster_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_event_rsvps_kinkster_id_fkey"
            columns: ["kinkster_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_events: {
        Row: {
          created_at: string | null
          description: string
          event_date: string
          host_kinkster_id: string
          id: string
          is_admin_approved: boolean | null
          location_name: string | null
          max_capacity: number | null
          space_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          event_date: string
          host_kinkster_id: string
          id?: string
          is_admin_approved?: boolean | null
          location_name?: string | null
          max_capacity?: number | null
          space_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          event_date?: string
          host_kinkster_id?: string
          id?: string
          is_admin_approved?: boolean | null
          location_name?: string | null
          max_capacity?: number | null
          space_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_events_host_kinkster_id_fkey"
            columns: ["host_kinkster_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_health_reports: {
        Row: {
          created_at: string | null
          hiv_status: string | null
          id: string
          is_verified: boolean | null
          kinkster_id: string
          raw_ai_analysis: Json | null
          report_image_url: string
          sti_status: string | null
          test_date: string | null
        }
        Insert: {
          created_at?: string | null
          hiv_status?: string | null
          id?: string
          is_verified?: boolean | null
          kinkster_id: string
          raw_ai_analysis?: Json | null
          report_image_url: string
          sti_status?: string | null
          test_date?: string | null
        }
        Update: {
          created_at?: string | null
          hiv_status?: string | null
          id?: string
          is_verified?: boolean | null
          kinkster_id?: string
          raw_ai_analysis?: Json | null
          report_image_url?: string
          sti_status?: string | null
          test_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_health_reports_kinkster_id_fkey"
            columns: ["kinkster_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_kinks: {
        Row: {
          category: string
          description: string | null
          icon_name: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          description?: string | null
          icon_name?: string | null
          id: string
          name: string
        }
        Update: {
          category?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      kinkster_messages: {
        Row: {
          burn_countdown_seconds: number | null
          burnt_at: string | null
          content: string
          context_data: Json | null
          context_id: string | null
          context_type: string | null
          conversation_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          idempotency_key: string | null
          is_burnt: boolean | null
          is_view_once: boolean | null
          media_metadata: Json | null
          media_url: string | null
          message_type: string | null
          sender_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          burn_countdown_seconds?: number | null
          burnt_at?: string | null
          content?: string
          context_data?: Json | null
          context_id?: string | null
          context_type?: string | null
          conversation_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          is_burnt?: boolean | null
          is_view_once?: boolean | null
          media_metadata?: Json | null
          media_url?: string | null
          message_type?: string | null
          sender_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          burn_countdown_seconds?: number | null
          burnt_at?: string | null
          content?: string
          context_data?: Json | null
          context_id?: string | null
          context_type?: string | null
          conversation_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          is_burnt?: boolean | null
          is_view_once?: boolean | null
          media_metadata?: Json | null
          media_url?: string | null
          message_type?: string | null
          sender_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "kinkster_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          kinkster_id: string
          post_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          kinkster_id: string
          post_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          kinkster_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_post_comments_kinkster_id_fkey"
            columns: ["kinkster_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "kinkster_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_post_likes: {
        Row: {
          created_at: string | null
          id: string
          kinkster_id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kinkster_id: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kinkster_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_post_likes_kinkster_id_fkey"
            columns: ["kinkster_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "kinkster_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_posts: {
        Row: {
          caption: string | null
          city: string | null
          country: string | null
          created_at: string | null
          group_id: string | null
          id: string
          kinkster_id: string
          likes_count: number | null
          media_type: string
          media_url: string
          region: string | null
        }
        Insert: {
          caption?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          kinkster_id: string
          likes_count?: number | null
          media_type: string
          media_url: string
          region?: string | null
        }
        Update: {
          caption?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          kinkster_id?: string
          likes_count?: number | null
          media_type?: string
          media_url?: string
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_posts_kinkster_id_fkey"
            columns: ["kinkster_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_preferences: {
        Row: {
          id: string
          intensity: number | null
          kink_id: string
          kinkster_id: string
        }
        Insert: {
          id?: string
          intensity?: number | null
          kink_id: string
          kinkster_id: string
        }
        Update: {
          id?: string
          intensity?: number | null
          kink_id?: string
          kinkster_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_preferences_kink_id_fkey"
            columns: ["kink_id"]
            isOneToOne: false
            referencedRelation: "kinkster_kinks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_preferences_kinkster_id_fkey"
            columns: ["kinkster_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_profiles: {
        Row: {
          admin_notes: string | null
          alias: string
          audio_vibe_url: string | null
          avatar_url: string | null
          bio: string | null
          confidentiality_agreed: boolean | null
          confidentiality_agreed_at: string | null
          cover_url: string | null
          created_at: string | null
          discovery_location_city: string | null
          discovery_location_country: string | null
          discovery_location_enabled: boolean | null
          discovery_location_region: string | null
          face_id_vetted: boolean | null
          guest_profile_id: string | null
          health_badges: Json | null
          id: string
          id_verified_at: string | null
          in_person_vetted: boolean | null
          in_person_vetted_at: string | null
          interests: string[] | null
          is_activated: boolean | null
          is_id_verified: boolean | null
          is_in_person_vetted: boolean | null
          is_trusted_host: boolean | null
          live_face_url: string | null
          messaging_privacy: string | null
          onboarding_answers: Json | null
          read_receipts_enabled: boolean | null
          stay_verification_data: Json | null
          stay_verification_source: string | null
          stay_verified: boolean | null
          stay_verified_at: string | null
          typing_indicators_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          alias: string
          audio_vibe_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          confidentiality_agreed?: boolean | null
          confidentiality_agreed_at?: string | null
          cover_url?: string | null
          created_at?: string | null
          discovery_location_city?: string | null
          discovery_location_country?: string | null
          discovery_location_enabled?: boolean | null
          discovery_location_region?: string | null
          face_id_vetted?: boolean | null
          guest_profile_id?: string | null
          health_badges?: Json | null
          id: string
          id_verified_at?: string | null
          in_person_vetted?: boolean | null
          in_person_vetted_at?: string | null
          interests?: string[] | null
          is_activated?: boolean | null
          is_id_verified?: boolean | null
          is_in_person_vetted?: boolean | null
          is_trusted_host?: boolean | null
          live_face_url?: string | null
          messaging_privacy?: string | null
          onboarding_answers?: Json | null
          read_receipts_enabled?: boolean | null
          stay_verification_data?: Json | null
          stay_verification_source?: string | null
          stay_verified?: boolean | null
          stay_verified_at?: string | null
          typing_indicators_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          alias?: string
          audio_vibe_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          confidentiality_agreed?: boolean | null
          confidentiality_agreed_at?: string | null
          cover_url?: string | null
          created_at?: string | null
          discovery_location_city?: string | null
          discovery_location_country?: string | null
          discovery_location_enabled?: boolean | null
          discovery_location_region?: string | null
          face_id_vetted?: boolean | null
          guest_profile_id?: string | null
          health_badges?: Json | null
          id?: string
          id_verified_at?: string | null
          in_person_vetted?: boolean | null
          in_person_vetted_at?: string | null
          interests?: string[] | null
          is_activated?: boolean | null
          is_id_verified?: boolean | null
          is_in_person_vetted?: boolean | null
          is_trusted_host?: boolean | null
          live_face_url?: string | null
          messaging_privacy?: string | null
          onboarding_answers?: Json | null
          read_receipts_enabled?: boolean | null
          stay_verification_data?: Json | null
          stay_verification_source?: string | null
          stay_verified?: boolean | null
          stay_verified_at?: string | null
          typing_indicators_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      kinkster_ratings: {
        Row: {
          communication_score: number | null
          created_at: string | null
          discretion_score: number | null
          feedback_text: string | null
          id: string
          rater_id: string
          respect_score: number | null
          target_id: string
        }
        Insert: {
          communication_score?: number | null
          created_at?: string | null
          discretion_score?: number | null
          feedback_text?: string | null
          id?: string
          rater_id: string
          respect_score?: number | null
          target_id: string
        }
        Update: {
          communication_score?: number | null
          created_at?: string | null
          discretion_score?: number | null
          feedback_text?: string | null
          id?: string
          rater_id?: string
          respect_score?: number | null
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_ratings_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reporter_id: string | null
          status: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          status?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          status?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_resonances: {
        Row: {
          chamber_token: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_mutual: boolean | null
          matched_at: string | null
          sender_id: string
          tags: string[] | null
          target_id: string
        }
        Insert: {
          chamber_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_mutual?: boolean | null
          matched_at?: string | null
          sender_id: string
          tags?: string[] | null
          target_id: string
        }
        Update: {
          chamber_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_mutual?: boolean | null
          matched_at?: string | null
          sender_id?: string
          tags?: string[] | null
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_resonances_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_resonances_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinkster_spice_requests: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kinkster_spice_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinkster_spice_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "kinkster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          bytes: number | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          folder: string | null
          format: string | null
          height: number | null
          id: string
          metadata: Json | null
          original_filename: string | null
          public_id: string
          resource_type: string | null
          secure_url: string
          updated_at: string | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          bytes?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          folder?: string | null
          format?: string | null
          height?: number | null
          id?: string
          metadata?: Json | null
          original_filename?: string | null
          public_id: string
          resource_type?: string | null
          secure_url: string
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          bytes?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          folder?: string | null
          format?: string | null
          height?: number | null
          id?: string
          metadata?: Json | null
          original_filename?: string | null
          public_id?: string
          resource_type?: string | null
          secure_url?: string
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string | null
          channel: string
          content: string
          created_at: string | null
          direction: string
          guest_profile_id: string | null
          id: string
          read_by_admin: boolean | null
          status: string | null
        }
        Insert: {
          booking_id?: string | null
          channel: string
          content: string
          created_at?: string | null
          direction: string
          guest_profile_id?: string | null
          id?: string
          read_by_admin?: boolean | null
          status?: string | null
        }
        Update: {
          booking_id?: string | null
          channel?: string
          content?: string
          created_at?: string | null
          direction?: string
          guest_profile_id?: string | null
          id?: string
          read_by_admin?: boolean | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_guest_profile_id_fkey"
            columns: ["guest_profile_id"]
            isOneToOne: false
            referencedRelation: "guest_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          admin_contact_email: string | null
          ai_system_prompt: string | null
          base_tax_rate_percent: number | null
          cancellation_policy_text: string | null
          cashfree_app_id: string | null
          cashfree_secret_key: string | null
          default_check_in_time: string | null
          default_check_out_time: string | null
          default_security_deposit: number | null
          fee_id_verification: number | null
          fee_kinkster_activation: number | null
          fee_partner_onboarding: number | null
          frontend_banner_active: boolean | null
          frontend_banner_text: string | null
          gemini_api_key: string | null
          id: string
          maintenance_mode: boolean | null
          max_advance_booking_days: number | null
          min_advance_booking_days: number | null
          nvidia_api_key: string | null
          payu_client_id: string | null
          payu_client_secret: string | null
          payu_env: string | null
          payu_key: string | null
          payu_salt: string | null
          resend_api_key: string | null
          updated_at: string | null
          updated_by: string | null
          whatsapp_api_key: string | null
        }
        Insert: {
          admin_contact_email?: string | null
          ai_system_prompt?: string | null
          base_tax_rate_percent?: number | null
          cancellation_policy_text?: string | null
          cashfree_app_id?: string | null
          cashfree_secret_key?: string | null
          default_check_in_time?: string | null
          default_check_out_time?: string | null
          default_security_deposit?: number | null
          fee_id_verification?: number | null
          fee_kinkster_activation?: number | null
          fee_partner_onboarding?: number | null
          frontend_banner_active?: boolean | null
          frontend_banner_text?: string | null
          gemini_api_key?: string | null
          id?: string
          maintenance_mode?: boolean | null
          max_advance_booking_days?: number | null
          min_advance_booking_days?: number | null
          nvidia_api_key?: string | null
          payu_client_id?: string | null
          payu_client_secret?: string | null
          payu_env?: string | null
          payu_key?: string | null
          payu_salt?: string | null
          resend_api_key?: string | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_api_key?: string | null
        }
        Update: {
          admin_contact_email?: string | null
          ai_system_prompt?: string | null
          base_tax_rate_percent?: number | null
          cancellation_policy_text?: string | null
          cashfree_app_id?: string | null
          cashfree_secret_key?: string | null
          default_check_in_time?: string | null
          default_check_out_time?: string | null
          default_security_deposit?: number | null
          fee_id_verification?: number | null
          fee_kinkster_activation?: number | null
          fee_partner_onboarding?: number | null
          frontend_banner_active?: boolean | null
          frontend_banner_text?: string | null
          gemini_api_key?: string | null
          id?: string
          maintenance_mode?: boolean | null
          max_advance_booking_days?: number | null
          min_advance_booking_days?: number | null
          nvidia_api_key?: string | null
          payu_client_id?: string | null
          payu_client_secret?: string | null
          payu_env?: string | null
          payu_key?: string | null
          payu_salt?: string | null
          resend_api_key?: string | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_api_key?: string | null
        }
        Relationships: []
      }
      post_topics: {
        Row: {
          created_at: string | null
          group_id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_topics_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_topics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "kinkster_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctuary_event_applications: {
        Row: {
          ai_applicant_answers: Json | null
          ai_evaluation_summary: string | null
          ai_generated_questions: Json | null
          ai_trust_score: number | null
          category: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          event_id: string
          id: string
          payment_deadline: string | null
          payment_order_id: string | null
          qr_secret_token: string | null
          status: string | null
          ticket_price_paid: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_applicant_answers?: Json | null
          ai_evaluation_summary?: string | null
          ai_generated_questions?: Json | null
          ai_trust_score?: number | null
          category?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          payment_deadline?: string | null
          payment_order_id?: string | null
          qr_secret_token?: string | null
          status?: string | null
          ticket_price_paid?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_applicant_answers?: Json | null
          ai_evaluation_summary?: string | null
          ai_generated_questions?: Json | null
          ai_trust_score?: number | null
          category?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          payment_deadline?: string | null
          payment_order_id?: string | null
          qr_secret_token?: string | null
          status?: string | null
          ticket_price_paid?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanctuary_event_applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "sanctuary_events"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctuary_events: {
        Row: {
          consent_marshall_name: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string
          dress_code: string | null
          end_time: string | null
          event_date: string
          group_id: string | null
          id: string
          location_revealed_hours_before: number | null
          max_couples: number | null
          max_females: number | null
          max_males: number | null
          max_nonbinary: number | null
          price_couples: number | null
          price_females: number | null
          price_males: number | null
          price_nonbinary: number | null
          requires_munch_vetting: boolean | null
          secret_location_address: string | null
          secret_location_coordinates: string | null
          secret_location_instructions: string | null
          space_id: string | null
          status: string | null
          tagline: string | null
          tier: string | null
          title: string
          updated_at: string | null
          venue_notes: string | null
        }
        Insert: {
          consent_marshall_name?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description: string
          dress_code?: string | null
          end_time?: string | null
          event_date: string
          group_id?: string | null
          id?: string
          location_revealed_hours_before?: number | null
          max_couples?: number | null
          max_females?: number | null
          max_males?: number | null
          max_nonbinary?: number | null
          price_couples?: number | null
          price_females?: number | null
          price_males?: number | null
          price_nonbinary?: number | null
          requires_munch_vetting?: boolean | null
          secret_location_address?: string | null
          secret_location_coordinates?: string | null
          secret_location_instructions?: string | null
          space_id?: string | null
          status?: string | null
          tagline?: string | null
          tier?: string | null
          title: string
          updated_at?: string | null
          venue_notes?: string | null
        }
        Update: {
          consent_marshall_name?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string
          dress_code?: string | null
          end_time?: string | null
          event_date?: string
          group_id?: string | null
          id?: string
          location_revealed_hours_before?: number | null
          max_couples?: number | null
          max_females?: number | null
          max_males?: number | null
          max_nonbinary?: number | null
          price_couples?: number | null
          price_females?: number | null
          price_males?: number | null
          price_nonbinary?: number | null
          requires_munch_vetting?: boolean | null
          secret_location_address?: string | null
          secret_location_coordinates?: string | null
          secret_location_instructions?: string | null
          space_id?: string | null
          status?: string | null
          tagline?: string | null
          tier?: string | null
          title?: string
          updated_at?: string | null
          venue_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sanctuary_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanctuary_events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctuary_pass_settings: {
        Row: {
          ai_vetting_enabled: boolean | null
          created_at: string | null
          default_ratio_couples: number | null
          default_ratio_females: number | null
          default_ratio_males: number | null
          id: string
          one_time_pass_price: number | null
          updated_at: string | null
        }
        Insert: {
          ai_vetting_enabled?: boolean | null
          created_at?: string | null
          default_ratio_couples?: number | null
          default_ratio_females?: number | null
          default_ratio_males?: number | null
          id?: string
          one_time_pass_price?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_vetting_enabled?: boolean | null
          created_at?: string | null
          default_ratio_couples?: number | null
          default_ratio_females?: number | null
          default_ratio_males?: number | null
          id?: string
          one_time_pass_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sanctuary_passes: {
        Row: {
          admin_notes: string | null
          amount_paid: number | null
          created_at: string | null
          expires_at: string | null
          guest_profile_id: string | null
          id: string
          order_id: string | null
          pass_tier: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_paid?: number | null
          created_at?: string | null
          expires_at?: string | null
          guest_profile_id?: string | null
          id?: string
          order_id?: string | null
          pass_tier?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_paid?: number | null
          created_at?: string | null
          expires_at?: string | null
          guest_profile_id?: string | null
          id?: string
          order_id?: string | null
          pass_tier?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      spaces: {
        Row: {
          active: boolean | null
          additional_guest_fee: number
          airbnb_ical_url: string | null
          airbnb_listing_id: string | null
          amenities: Json | null
          area: string
          bathrooms: number | null
          bedrooms: number | null
          check_in_time: string | null
          check_out_time: string | null
          city: string
          cleaner_name: string | null
          cleaner_phone: string | null
          cleaning_fee: number
          coordinates: Json | null
          country: string | null
          created_at: string | null
          default_guests: number
          description: string
          featured: boolean | null
          featured_image: string | null
          id: string
          images: string[] | null
          key_instructions: string | null
          max_additional_guests: number
          max_guests: number
          nightly_price: number
          post_checkout_feedback_template: string | null
          pre_arrival_template: string | null
          rules: string | null
          slug: string
          state: string | null
          title: string
        }
        Insert: {
          active?: boolean | null
          additional_guest_fee?: number
          airbnb_ical_url?: string | null
          airbnb_listing_id?: string | null
          amenities?: Json | null
          area: string
          bathrooms?: number | null
          bedrooms?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          city: string
          cleaner_name?: string | null
          cleaner_phone?: string | null
          cleaning_fee?: number
          coordinates?: Json | null
          country?: string | null
          created_at?: string | null
          default_guests?: number
          description: string
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          images?: string[] | null
          key_instructions?: string | null
          max_additional_guests?: number
          max_guests: number
          nightly_price: number
          post_checkout_feedback_template?: string | null
          pre_arrival_template?: string | null
          rules?: string | null
          slug: string
          state?: string | null
          title: string
        }
        Update: {
          active?: boolean | null
          additional_guest_fee?: number
          airbnb_ical_url?: string | null
          airbnb_listing_id?: string | null
          amenities?: Json | null
          area?: string
          bathrooms?: number | null
          bedrooms?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string
          cleaner_name?: string | null
          cleaner_phone?: string | null
          cleaning_fee?: number
          coordinates?: Json | null
          country?: string | null
          created_at?: string | null
          default_guests?: number
          description?: string
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          images?: string[] | null
          key_instructions?: string | null
          max_additional_guests?: number
          max_guests?: number
          nightly_price?: number
          post_checkout_feedback_template?: string | null
          pre_arrival_template?: string | null
          rules?: string | null
          slug?: string
          state?: string | null
          title?: string
        }
        Relationships: []
      }
      web_push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_email_hook: { Args: { event: Json }; Returns: Json }
      purge_expired_ephemeral_messages: { Args: never; Returns: number }
      purge_old_guest_ids: { Args: never; Returns: undefined }
      sync_phone_auth_user: {
        Args: { p_password: string; p_phone: string }
        Returns: Json
      }
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
    Enums: {},
  },
} as const
