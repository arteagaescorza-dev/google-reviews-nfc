export type TierType = 1 | 2 | 3 | 4;

export type LinkType = 'menu' | 'instagram' | 'facebook' | 'tiktok' | 'whatsapp' | 'wifi' | 'website' | 'other';

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: LinkType;
}

export interface Organization {
  id: string;
  name: string;
  owner_name: string;
  owner_email?: string | null;
  owner_phone?: string | null;
  notify_negative_feedback: boolean;
  created_at: string;
}

export interface Restaurant {
  id: string;
  organization_id?: string | null;
  brand_name: string;
  branch_name: string;
  slug: string;
  name: string;
  google_review_url: string;
  logo_url?: string | null;
  tier: TierType;
  is_ad_free: boolean;
  brand_color: string;
  links: LinkItem[];
  address?: string | null;
  manager_phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relación opcional
  organization?: Organization;
}

export interface Tag {
  id: string;
  tag_code: string;
  restaurant_id?: string | null;
  table_identifier?: string | null;
  custom_ad_id?: string | null;
  scan_count: number;
  last_scanned_at?: string | null;
  is_active: boolean;
  created_at: string;
  // Relación opcional
  restaurant?: Restaurant;
}

export type AdPlacement = 'bottom_banner' | 'interstitial';
export type AdTargetType = 'all' | 'specific_restaurants' | 'specific_tags';

export interface Ad {
  id: string;
  title: string;
  advertiser_name: string;
  banner_url: string;
  destination_url: string;
  placement_type: AdPlacement;
  target_type: AdTargetType;
  target_restaurant_ids: string[];
  target_tag_codes: string[];
  is_active: boolean;
  impressions_count: number;
  clicks_count: number;
  created_at: string;
}

export type FeedbackStatus = 'new' | 'reviewed' | 'contacted';

export interface Feedback {
  id: string;
  restaurant_id: string;
  tag_code?: string | null;
  rating: 1 | 2 | 3;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  comments: string;
  status: FeedbackStatus;
  notified_to_owner: boolean;
  created_at: string;
  // Relación opcional
  restaurant?: Restaurant;
}
