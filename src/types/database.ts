export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          post_id: string | null
          application_id: string | null
          creator_id: string
          counterparty_id: string
          contract_type: string
          payment_type: string | null
          price: number | null
          revenue_share_percentage: number | null
          exchange_service: string | null
          contract_content: string
          custom_clauses: string | null
          status: string | null
          agreement_confirmed: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          post_id?: string | null
          application_id?: string | null
          creator_id: string
          counterparty_id: string
          contract_type: string
          payment_type?: string | null
          price?: number | null
          revenue_share_percentage?: number | null
          exchange_service?: string | null
          contract_content: string
          custom_clauses?: string | null
          status?: string | null
          agreement_confirmed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string | null
          application_id?: string | null
          creator_id?: string
          counterparty_id?: string
          contract_type?: string
          payment_type?: string | null
          price?: number | null
          revenue_share_percentage?: number | null
          exchange_service?: string | null
          contract_content?: string
          custom_clauses?: string | null
          status?: string | null
          agreement_confirmed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          bio: string | null
          location: string | null
          birth_date: string | null
          contract_full_name: string | null
          contract_email: string | null
          contract_phone: string | null
          contract_city: string | null
          contract_country: string | null
          contract_siren: string | null
          contract_signature: string | null
          contract_default_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          location?: string | null
          birth_date?: string | null
          contract_full_name?: string | null
          contract_email?: string | null
          contract_phone?: string | null
          contract_city?: string | null
          contract_country?: string | null
          contract_siren?: string | null
          contract_signature?: string | null
          contract_default_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          location?: string | null
          birth_date?: string | null
          contract_full_name?: string | null
          contract_email?: string | null
          contract_phone?: string | null
          contract_city?: string | null
          contract_country?: string | null
          contract_siren?: string | null
          contract_signature?: string | null
          contract_default_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          category_id: string
          title: string
          description: string
          price: number | null
          contract_type: string | null
          work_schedule: string | null
          responsibilities: string | null
          required_skills: string | null
          benefits: string | null
          location: string | null
          images: string[] | null
          video: string | null
          delivery_available: boolean
          status: string
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          title: string
          description: string
          price?: number | null
          contract_type?: string | null
          work_schedule?: string | null
          responsibilities?: string | null
          required_skills?: string | null
          benefits?: string | null
          location?: string | null
          images?: string[] | null
          video?: string | null
          delivery_available?: boolean
          status?: string
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          title?: string
          description?: string
          price?: number | null
          contract_type?: string | null
          work_schedule?: string | null
          responsibilities?: string | null
          required_skills?: string | null
          benefits?: string | null
          location?: string | null
          images?: string[] | null
          video?: string | null
          delivery_available?: boolean
          status?: string
          views_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          post_id: string | null
          user1_id: string
          user2_id: string
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          user1_id: string
          user2_id: string
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          user1_id?: string
          user2_id?: string
          last_message_at?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          read_at?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: string | null
          related_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          content?: string | null
          related_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          content?: string | null
          related_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          post1_id: string | null
          post2_id: string | null
          status: string
          matched_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          post1_id?: string | null
          post2_id?: string | null
          status?: string
          matched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          post1_id?: string | null
          post2_id?: string | null
          status?: string
          matched_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      interests: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      ignored_posts: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          is_active: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          is_active?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          is_active?: boolean
          joined_at?: string
        }
      }
    }
  }
}
