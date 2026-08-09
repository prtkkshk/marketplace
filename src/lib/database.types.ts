export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ListingCategory =
  | 'cycles'
  | 'books'
  | 'electronics'
  | 'room_essentials'
  | 'lab_gear'
  | 'other'

export type ItemCondition = 'brand_new' | 'like_new' | 'good' | 'fair'

export type ListingStatus = 'active' | 'sold' | 'hidden' | 'expired'

export type RequestStatus = 'open' | 'fulfilled' | 'hidden' | 'expired'

export type ReportReason =
  | 'spam_scam'
  | 'prohibited'
  | 'offensive'
  | 'wrong_category'
  | 'already_sold'
  | 'harassment'
  | 'other'

export type ReportStatus = 'pending' | 'actioned' | 'dismissed'

export type AnnouncementType = 'info' | 'warning' | 'success'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          roll_number: string | null
          hall_of_residence: string | null
          whatsapp_number: string | null
          is_profile_complete: boolean
          is_admin: boolean
          is_banned: boolean
          banned_reason: string | null
          last_active_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          roll_number?: string | null
          hall_of_residence?: string | null
          whatsapp_number?: string | null
          is_profile_complete?: boolean
          is_admin?: boolean
          is_banned?: boolean
          banned_reason?: string | null
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          roll_number?: string | null
          hall_of_residence?: string | null
          whatsapp_number?: string | null
          is_profile_complete?: boolean
          is_admin?: boolean
          is_banned?: boolean
          banned_reason?: string | null
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: ListingCategory
          price: number
          is_negotiable: boolean
          condition: ItemCondition
          photo_paths: string[]
          hall_of_residence: string
          status: ListingStatus
          is_pinned: boolean
          view_count: number
          sold_at: string | null
          deleted_at: string | null
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: ListingCategory
          price: number
          is_negotiable?: boolean
          condition: ItemCondition
          photo_paths: string[]
          hall_of_residence: string
          status?: ListingStatus
          is_pinned?: boolean
          view_count?: number
          sold_at?: string | null
          deleted_at?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: ListingCategory
          price?: number
          is_negotiable?: boolean
          condition?: ItemCondition
          photo_paths?: string[]
          hall_of_residence?: string
          status?: ListingStatus
          is_pinned?: boolean
          view_count?: number
          sold_at?: string | null
          deleted_at?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      wanted_requests: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: ListingCategory
          max_budget: number | null
          hall_of_residence: string
          status: RequestStatus
          is_pinned: boolean
          fulfilled_at: string | null
          deleted_at: string | null
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: ListingCategory
          max_budget?: number | null
          hall_of_residence: string
          status?: RequestStatus
          is_pinned?: boolean
          fulfilled_at?: string | null
          deleted_at?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: ListingCategory
          max_budget?: number | null
          hall_of_residence?: string
          status?: RequestStatus
          is_pinned?: boolean
          fulfilled_at?: string | null
          deleted_at?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          user_id: string
          listing_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          listing_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          listing_id?: string
          created_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          listing_id: string | null
          request_id: string | null
          reason: ReportReason
          details: string | null
          status: ReportStatus
          resolved_by: string | null
          resolved_at: string | null
          resolution_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          listing_id?: string | null
          request_id?: string | null
          reason: ReportReason
          details?: string | null
          status?: ReportStatus
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          listing_id?: string | null
          request_id?: string | null
          reason?: ReportReason
          details?: string | null
          status?: ReportStatus
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          message: string
          type: AnnouncementType
          starts_at: string
          ends_at: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          message: string
          type?: AnnouncementType
          starts_at?: string
          ends_at?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          message?: string
          type?: AnnouncementType
          starts_at?: string
          ends_at?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          target_table: string | null
          target_id: string | null
          reason: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          target_table?: string | null
          target_id?: string | null
          reason?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          target_table?: string | null
          target_id?: string | null
          reason?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      contact_events: {
        Row: {
          id: string
          actor_id: string
          listing_id: string | null
          request_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id: string
          listing_id?: string | null
          request_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string
          listing_id?: string | null
          request_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_active_student: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_contact_number: {
        Args: { p_listing_id: string }
        Returns: string
      }
      get_requester_number: {
        Args: { p_request_id: string }
        Returns: string
      }
      increment_listing_view: {
        Args: { p_listing_id: string }
        Returns: void
      }
      get_admin_kpis: {
        Args: Record<PropertyKey, never>
        Returns: {
          dau: number
          wau: number
          listings_per_day: { date: string; count: number }[]
          view_to_contact_rate: number
          wanted_fulfillment_rate: number
        }
      }
      get_my_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          full_name: string | null
          roll_number: string | null
          hall_of_residence: string | null
          whatsapp_number: string | null
          is_profile_complete: boolean
          is_admin: boolean
          is_banned: boolean
          banned_reason: string | null
          last_active_at: string
          created_at: string
          updated_at: string
        }
      }
      get_admin_user_list: {
        Args: { p_search: string | null; p_limit: number; p_offset: number }
        Returns: {
          id: string
          email: string
          full_name: string | null
          roll_number: string | null
          hall_of_residence: string | null
          whatsapp_number: string | null
          is_profile_complete: boolean
          is_admin: boolean
          is_banned: boolean
          banned_reason: string | null
          last_active_at: string
          created_at: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      listing_category: ListingCategory
      item_condition: ItemCondition
      listing_status: ListingStatus
      request_status: RequestStatus
      report_reason: ReportReason
      report_status: ReportStatus
      announcement_type: AnnouncementType
    }
  }
}
