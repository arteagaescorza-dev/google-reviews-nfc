export type TierType = 1 | 2 | 3 | 4;

export type LinkType = 'menu' | 'instagram' | 'facebook' | 'tiktok' | 'whatsapp' | 'wifi' | 'website' | 'other';

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: LinkType;
}

export interface BillingInfo {
  tax_name?: string;
  tax_id?: string;
  tax_regime?: string;
  tax_zip?: string;
  billing_email?: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_name: string;
  owner_email?: string | null;
  owner_phone?: string | null;
  notify_negative_feedback: boolean;
  billing_info?: BillingInfo | null;
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
  blocked_ad_ids?: string[];
  last_veto_date?: string | null;
  ad_credit_balance?: number;
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
  coupon_code?: string | null;
  coupon_description?: string | null;
  coupon_discount?: string | null;
  budget_amount?: number;
  max_impressions?: number;
  is_renewal_sent?: boolean;
  created_at: string;
}

export type FeedbackStatus = 'new' | 'reviewed' | 'contacted' | 'resolved';

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
  internal_notes?: string | null;
  notified_to_owner: boolean;
  created_at: string;
  // Relación opcional
  restaurant?: Restaurant;
}

export type MemberRole = 'owner' | 'manager';

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  user_email?: string | null;
}

export type SupportCategory = 'plate_damaged' | 'billing' | 'more_plates' | 'general';
export type SupportStatus = 'pending' | 'in_progress' | 'resolved';

export interface SupportTicket {
  id: string;
  organization_id: string;
  restaurant_id?: string | null;
  category: SupportCategory;
  subject: string;
  message: string;
  status: SupportStatus;
  admin_reply?: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones opcionales
  organization?: Organization;
  restaurant?: Restaurant;
}


export type CouponStatus = 'active' | 'redeemed' | 'expired';

export interface Coupon {
  id: string;
  ad_id: string;
  restaurant_id?: string | null;
  tag_code?: string | null;
  customer_phone?: string | null;
  customer_name?: string | null;
  coupon_code: string;
  title: string;
  advertiser_name: string;
  discount_description: string;
  status: CouponStatus;
  ticket_amount?: number | null;
  redeemed_at?: string | null;
  redeemed_by?: string | null;
  expires_at: string;
  created_at: string;
  // Relaciones opcionales
  ad?: Ad;
  restaurant?: Restaurant;
}


export interface FinancialMetrics {
  mrr: number;
  adRevenue: number;
  hardwareRevenue: number;
  grossRevenue: number;
  cogsHardware: number;
  gatewayFees: number;
  cloudCost: number;
  whatsappCost: number;
  totalDirectCosts: number;
  ebitda: number;
  ebitdaMargin: number;
  stripeBalance: number;
  payingLocations: number;
  totalLocations: number;
  collectionRate: number;
  activeCampaigns: number;
  campaignsAtRisk: number;
}


// ==========================================
// Módulos de Operación de Sala y Cocina
// ==========================================

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category: 'entradas' | 'principales' | 'bebidas' | 'postres';
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  preparation_time_mins?: number;
}

export type KitchenStation = 'cocina' | 'barra' | 'postres' | 'all';

export interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  category?: 'entradas' | 'principales' | 'bebidas' | 'postres';
  station_status?: 'pending' | 'preparing' | 'ready';
}

export type TableOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface TableOrder {
  id: string;
  restaurant_id: string;
  tag_code: string;
  table_number: string;
  items: OrderItem[];
  total_amount: number;
  status: TableOrderStatus;
  customer_name?: string;
  created_at: string;
  updated_at: string;
  // Relación opcional
  restaurant?: Restaurant;
}

export type TableCallType = 'waiter' | 'bill_cash' | 'bill_card' | 'help';
export type TableCallStatus = 'active' | 'attended';

export interface TableCall {
  id: string;
  restaurant_id: string;
  tag_code: string;
  table_number: string;
  call_type: TableCallType;
  status: TableCallStatus;
  created_at: string;
  attended_at?: string;
  attended_by?: string;
}

export type StaffRole = 'waiter' | 'kitchen' | 'manager';

export interface StaffMember {
  id: string;
  restaurant_id: string;
  name: string;
  role: StaffRole;
  pin_code: string; // 4 dígitos para login rápido en sala
  is_active: boolean;
  assigned_tables?: string[];
  zone_name?: string;
  created_at: string;
}

export interface TerritoryZone {
  id: string;
  name: string;
  city: string;
  active_restaurants: number;
  target_restaurants: number;
  total_scans: number;
  density_percent: number;
  lat: number;
  lng: number;
}

export interface TerritoryMetric {
  totalGoal: number;
  activeLocations: number;
  coveragePercent: number;
  zones: TerritoryZone[];
  hourlyHeatmap: { hour: string; scans: number; peak: boolean }[];
}
