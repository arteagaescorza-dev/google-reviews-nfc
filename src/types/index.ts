export interface DayOperatingSchedule {
  key: string;
  name: string;
  isOpen: boolean;
  open: string;
  close: string;
}

export type WeeklyOperatingHours = Record<string, DayOperatingSchedule>;

export type BusinessType =
  | 'restaurant'
  | 'barberia'
  | 'dental'
  | 'gym'
  | 'spa'
  | 'cafeteria'
  | 'general'
  | (string & {});

export interface VerticalFeatureItem {
  id: string;
  name: string;
  description?: string;
  category?: 'reputacion' | 'operacion' | 'marketing' | 'personalizado';
}

export interface VerticalStationItem {
  id: string;
  name: string;
  roleName?: string;
  description?: string;
}

export interface BusinessVertical {
  id: string;
  slug: string;
  name: string;
  unit_label: string;
  unit_plural: string;
  show_kds: boolean;
  show_floor_staff: boolean;
  show_hostess: boolean;
  available_features?: VerticalFeatureItem[];
  available_stations?: VerticalStationItem[];
  catalog_title?: string;
  catalog_subtitle?: string;
  action_primary?: string;
  action_secondary?: string;
  feedback_question?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrganizationBrand {
  id: string;
  organization_id: string;
  name: string;
  vertical_id?: string | null;
  vertical_slug: string;
  logo_url?: string | null;
  brand_color: string;
  created_at: string;
}

export interface BusinessVerticalConfig {
  unitLabel: string;
  unitPlural: string;
  catalogTitle: string;
  catalogSubtitle: string;
  actionPrimary: string;
  actionSecondary: string;
  showKds: boolean;
  showFloorStaff: boolean;
  feedbackQuestion: string;
}

export const VERTICAL_CONFIG: Record<string, BusinessVerticalConfig> = {
  restaurant: {
    unitLabel: 'Mesa',
    unitPlural: 'Mesas',
    catalogTitle: 'Menú & Pedir en Mesa',
    catalogSubtitle: 'Envía tus platillos directo a cocina',
    actionPrimary: 'Llamar Mesero',
    actionSecondary: 'Pedir la Cuenta',
    showKds: true,
    showFloorStaff: true,
    feedbackQuestion: '¿Cómo estuvo tu experiencia hoy?',
  },
  barberia: {
    unitLabel: 'Sillón / Estación',
    unitPlural: 'Sillones',
    catalogTitle: 'Catálogo de Cortes & Barba',
    catalogSubtitle: 'Estilos, bebidas de cortesía y productos',
    actionPrimary: 'Solicitar Bebida / Asistencia',
    actionSecondary: 'Agendar Próxima Cita',
    showKds: false,
    showFloorStaff: true,
    feedbackQuestion: '¿Cómo quedó tu corte y servicio hoy?',
  },
  cafeteria: {
    unitLabel: 'Mesa / Barra',
    unitPlural: 'Mesas & Barra',
    catalogTitle: 'Carta de Café & Repostería',
    catalogSubtitle: 'Pide tu café de especialidad y pan recién horneado',
    actionPrimary: 'Llamar Barista',
    actionSecondary: 'Pedir la Cuenta',
    showKds: true,
    showFloorStaff: true,
    feedbackQuestion: '¿Qué te pareció tu café y postre hoy?',
  },
  gym: {
    unitLabel: 'Máquina / Zona',
    unitPlural: 'Equipos & Zonas',
    catalogTitle: 'Guías de Rutinas & Clases',
    catalogSubtitle: 'Videos de técnica y horarios en vivo',
    actionPrimary: 'Reportar Equipo',
    actionSecondary: 'Conexión Wi-Fi',
    showKds: false,
    showFloorStaff: false,
    feedbackQuestion: '¿Cómo estuvo tu entrenamiento hoy?',
  },
  dental: {
    unitLabel: 'Gabinete / Consultorio',
    unitPlural: 'Consultorios',
    catalogTitle: 'Cuidados Post-Atención',
    catalogSubtitle: 'Indicaciones médicas y medicamentos',
    actionPrimary: 'Asistencia en Recepción',
    actionSecondary: 'WhatsApp Urgencias',
    showKds: false,
    showFloorStaff: false,
    feedbackQuestion: '¿Cómo fue tu atención médica hoy?',
  },
  spa: {
    unitLabel: 'Cabina / Sillón',
    unitPlural: 'Cabinas',
    catalogTitle: 'Catálogo de Tratamientos',
    catalogSubtitle: 'Servicios, masajes y faciales',
    actionPrimary: 'Llamar Terapeuta',
    actionSecondary: 'Pagar Servicio',
    showKds: false,
    showFloorStaff: false,
    feedbackQuestion: '¿Cómo te sentiste con tu tratamiento hoy?',
  },
  general: {
    unitLabel: 'Estación / Punto',
    unitPlural: 'Puntos de Atención',
    catalogTitle: 'Catálogo de Servicios',
    catalogSubtitle: 'Promociones y enlaces de contacto',
    actionPrimary: 'Solicitar Asistencia',
    actionSecondary: 'Contacto WhatsApp',
    showKds: false,
    showFloorStaff: false,
    feedbackQuestion: '¿Cómo calificarías nuestro servicio hoy?',
  },
};

export type TierType = 1 | 2 | 3 | 4 | 5 | number;

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
  trial_tier?: TierType | null;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  trial_days?: 7 | 14 | 28 | null;
  created_at: string;
}

export interface Restaurant {
  id: string;
  organization_id?: string | null;
  brand_id?: string | null;
  brand_name: string;
  branch_name: string;
  business_type?: BusinessType;
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
  opening_time?: string | null;
  closing_time?: string | null;
  operating_days?: string | null;
  daily_operating_hours?: WeeklyOperatingHours | string | null;
  trial_tier?: TierType | null;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  trial_days?: 7 | 14 | 28 | null;
  is_active: boolean;
  blocked_ad_ids?: string[];
  last_veto_date?: string | null;
  ad_credit_balance?: number;
  has_digital_menu?: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones opcionales
  organization?: Organization;
  brand?: OrganizationBrand;
}

export type TagPhysicalCondition = 'nuevo' | 'instalado' | 'desgastado' | 'danado' | 'reemplazado';

export interface Tag {
  id: string;
  tag_code: string;
  restaurant_id?: string | null;
  table_identifier?: string | null;
  custom_ad_id?: string | null;
  scan_count: number;
  nfc_scans_count?: number;
  qr_scans_count?: number;
  last_scanned_at?: string | null;
  is_active: boolean;
  batch_id?: string | null;
  nfc_chip_model?: string;
  physical_condition?: TagPhysicalCondition;
  installer_name?: string | null;
  installed_at?: string | null;
  replaced_by_tag_code?: string | null;
  replacement_reason?: string | null;
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

export type ReplacementTrackingStatus = 'no_aplica' | 'solicitado' | 'aprobado' | 'en_reparto' | 'instalado';

export interface SupportTicket {
  id: string;
  organization_id: string;
  restaurant_id?: string | null;
  category: SupportCategory;
  subject: string;
  message: string;
  status: SupportStatus;
  admin_reply?: string | null;
  affected_tag_code?: string | null;
  replacement_status?: ReplacementTrackingStatus;
  replacement_tag_code?: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones opcionales
  organization?: Organization;
  restaurant?: Restaurant;
}

// ==========================================
// Módulos Fase 6: Hardware, Imprenta y Ventas B2B
// ==========================================

export type InventoryCategory = 'nfc_chip' | 'vinyl_sticker' | 'acrylic_stand' | 'installation_tool' | 'packaging';

export interface HardwareInventoryItem {
  id: string;
  sku: string;
  item_name: string;
  category: InventoryCategory;
  stock_available: number;
  stock_allocated: number;
  stock_min_threshold: number;
  unit_cost_mxn: number;
  supplier_info?: Record<string, any>;
  last_restocked_at?: string;
  updated_at: string;
}

export type PrintBatchStatus = 'generado' | 'en_imprenta' | 'recibido_en_bodega' | 'en_uso' | 'agotado';

export interface PrintBatch {
  id: string;
  batch_number: string;
  supplier_name: string;
  total_units: number;
  prefix: string;
  range_start: number;
  range_end: number;
  status: PrintBatchStatus;
  cost_total_mxn: number;
  specifications?: Record<string, any>;
  pdf_vector_url?: string | null;
  created_at: string;
  received_at?: string | null;
}

export type SalesLeadStage = 
  | 'prospeccion' 
  | 'demo_agendada' 
  | 'demo_realizada' 
  | 'cotizacion_enviada' 
  | 'cierre_ganado' 
  | 'instalacion_pendiente' 
  | 'instalado_activo' 
  | 'cerrado_perdido';

export interface SalesLead {
  id: string;
  restaurant_name: string;
  business_type?: BusinessType;
  contact_name: string;
  contact_role?: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  estimated_tables: number;
  stage: SalesLeadStage;
  deal_mrr_mxn: number;
  hardware_kit_fee_mxn: number;
  assigned_sales_rep: string;
  next_follow_up?: string | null;
  notes?: string | null;
  lost_reason?: string | null;
  converted_organization_id?: string | null;
  converted_restaurant_id?: string | null;
  created_at: string;
  updated_at: string;
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

export interface MenuCategory {
  id: string;
  restaurant_id?: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  preparation_time_mins?: number;
  station?: KitchenStation;
}

export type KitchenStation = 'cocina' | 'barra' | 'postres' | 'barista' | 'turnero' | 'pickup' | 'all';

export interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  category?: string;
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

export type TableCallType = 'waiter' | 'bill_cash' | 'bill_card' | 'help' | 'cleaning';
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

export type StaffRole = 'waiter' | 'kitchen' | 'barista' | 'hostess' | 'manager' | 'cashier' | 'employee' | (string & {});

export interface TierFeatureItem {
  id: string;
  name: string;
  description: string;
  category: 'feature' | 'station';
}

export interface CustomTierDefinition {
  id?: string;
  tier: TierType | 'addon';
  name: string;
  badge_label: string;
  vertical_slug?: string;
  vertical_id?: string | null;
  is_archived?: boolean;
  price_mxn: number;
  description: string;
  included_features: string[]; // IDs de funcionalidades
  included_stations: string[]; // IDs de pantallas operativas
  client_visible_features?: string[]; // IDs de funcionalidades visibles para dueños de local
  client_visible_stations?: string[]; // IDs de pantallas visibles para dueños de local
  allowed_categories?: number[]; // Categorías habilitadas en panel de control: [1, 2, 3, 4, 5, 6]
  client_visible_categories?: number[]; // Categorías que se muestran en el desglose del plan al cliente
}

export interface StaffMember {
  id: string;
  restaurant_id: string;
  name: string;
  role: StaffRole;
  pin_code: string; // 4 dígitos para login rápido en sala
  is_active: boolean;
  assigned_tables?: string[];
  zone_name?: string;
  allowed_stations?: KitchenStation[];
  created_at: string;
}

export type RestaurantTableStatus = 'libre' | 'ocupada' | 'en_limpieza' | 'desactivada';

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  current_guests: number;
  status: RestaurantTableStatus;
  assigned_waiter_name?: string | null;
  notes?: string | null;
  updated_at: string;
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


// ==========================================
// Módulos Fase 2: Split Bill & Corte Z
// ==========================================

export type SplitMode = 'equal' | 'itemized' | 'custom';
export type TableSessionStatus = 'open' | 'payment_pending' | 'partially_paid' | 'closed';

export interface TableSessionParticipant {
  guest_token: string;
  guest_name: string;
  joined_at: string;
  paid_amount?: number;
  payment_method?: 'cash' | 'card' | 'digital';
}

export interface TableSession {
  id: string;
  restaurant_id: string;
  table_number: number;
  status: TableSessionStatus;
  participants: TableSessionParticipant[];
  split_mode?: SplitMode;
  total_amount: number;
  paid_amount: number;
  opened_at: string;
  closed_at?: string | null;
}

export type DailyCashCloseStatus = 'balanced' | 'with_discrepancy' | 'reviewed_by_owner';

export interface DailyCashClose {
  id: string;
  restaurant_id: string;
  shift_date: string;
  closed_by_staff_id?: string | null;
  closed_by_name: string;
  initial_cash_float: number;
  gross_sales: number;
  net_sales: number;
  cash_sales: number;
  card_sales: number;
  discounts_total: number;
  tips_total: number;
  cash_counted: number;
  cash_difference: number;
  discrepancy_reason?: string | null;
  status: DailyCashCloseStatus;
  created_at: string;
}

export type CorporateOrderStatus = 'pending' | 'confirmed' | 'cooking' | 'in_transit' | 'delivered' | 'cancelled' | 'no_show';
export type CorporatePaymentMethod = 'cash' | 'card' | 'digital';

export interface CorporateOrder {
  id: string;
  restaurant_id: string;
  folio: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_mode: 'pickup' | 'office_delivery';
  building_name?: string | null;
  floor_office?: string | null;
  delivery_instructions?: string | null;
  handshake_pin: string;
  payment_method: CorporatePaymentMethod;
  cash_change_for?: number | null;
  items: OrderItem[];
  total_amount: number;
  status: CorporateOrderStatus;
  verified_at?: string | null;
  created_at: string;
}

// ==========================================
// Módulos Fase 4: Portal Comensal, CFDI & Cashback
// ==========================================

export type TaxRegimeCFDI40 =
  | '601' // General de Ley Personas Morales
  | '605' // Sueldos y Salarios
  | '606' // Arrendamiento
  | '612' // Personas Físicas con Actividades Empresariales y Profesionales
  | '621' // Incorporación Fiscal
  | '626'; // Régimen Simplificado de Confianza (RESICO)

export type UseCFDI40 =
  | 'G01' // Adquisición de mercancías
  | 'G03' // Gastos en general
  | 'S01' // Sin efectos fiscales
  | 'CP01'; // Pagos

export interface TaxProfileCFDI40 {
  rfc: string;
  legal_name: string;
  zip_code: string;
  tax_regime: TaxRegimeCFDI40;
  use_cfdi: UseCFDI40;
  email: string;
}

export interface CashbackTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'redeemed';
  order_folio?: string;
  restaurant_name: string;
  created_at: string;
}

export interface CashbackAccount {
  phone: string;
  balance: number;
  total_earned: number;
  vip_level: 'bronce' | 'plata' | 'oro' | 'diamante';
  transactions: CashbackTransaction[];
}

export interface FoodieFavorite {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  item_name: string;
  price: number;
  order_count: number;
  last_ordered_at: string;
}

// ==========================================
// Módulos Fase C: Gerente de Tienda, Capitán de Piso, Turnos (60 Días) y Cupones con Límite Mensual
// ==========================================

export type StoreManagerRole = 'gerente_tienda' | 'capitan_piso';

export interface OrganizationManager {
  id: string;
  organization_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  pin_code: string;
  manager_role: StoreManagerRole;
  assigned_branch_ids: string[];
  branch_roles?: Record<string, StoreManagerRole | 'sin_acceso'>;
  is_active: boolean;
  created_at: string;
}

export type StaffShiftType = 'matutino' | 'vespertino' | 'nocturno_cierre' | 'completo';

export interface StaffShift {
  id: string;
  restaurant_id: string;
  staff_id: string;
  staff_name: string;
  staff_role: StaffRole;
  shift_date: string; // YYYY-MM-DD (hasta 60 días de anticipación)
  shift_type: StaffShiftType;
  start_time: string;
  end_time: string;
  assigned_station?: KitchenStation;
  assigned_tables?: string[];
  notes?: string | null;
  created_by_manager?: string | null;
  created_at: string;
}

export interface ManagerRetentionCoupon {
  id: string;
  organization_id?: string;
  restaurant_id: string;
  manager_id?: string;
  manager_name: string;
  coupon_code: string;
  title: string;
  discount_description: string;
  discount_percentage: number;
  monthly_limit: number;
  used_this_month: number;
  month_key: string; // YYYY-MM
  is_active: boolean;
  created_at: string;
}

export interface TableShiftMetric {
  table_number: string;
  orders_count: number;
  total_amount: number;
  average_ticket: number;
}

export interface EmployeeShiftMetric {
  staff_name: string;
  role: StaffRole;
  tables_served: number;
  sales_generated: number;
  tips_estimated: number;
  calls_attended: number;
}

export interface ManagerShiftReport {
  id: string;
  organization_id?: string | null;
  restaurant_id: string;
  branch_name: string;
  manager_name: string;
  waiter_name: string;
  shift_type: StaffShiftType;
  shift_date: string;
  tables_served: number;
  total_sales: number;
  cash_sales: number;
  card_sales: number;
  tips_collected: number;
  discounts_authorized: number;
  table_metrics: TableShiftMetric[];
  employee_metrics: EmployeeShiftMetric[];
  sent_to_owner: boolean;
  created_at: string;
}

