import type {
  Restaurant,
  Tag,
  Ad,
  Feedback,
  Organization,
  SupportTicket,
  Coupon,
} from '../../types';
import { VIRAL_SEED_CONFIG } from '../constants';

export const STORAGE_KEYS = {
  ORGANIZATIONS: 'nfc_demo_organizations',
  ORGANIZATION_MEMBERS: 'nfc_demo_organization_members',
  RESTAURANTS: 'nfc_demo_restaurants',
  TAGS: 'nfc_demo_tags',
  ADS: 'nfc_demo_ads',
  FEEDBACK: 'nfc_demo_feedback',
  SUPPORT_TICKETS: 'nfc_demo_support_tickets',
  COUPONS: 'nfc_demo_coupons',
  MENU_ITEMS: 'nfc_demo_menu_items',
  TABLE_ORDERS: 'nfc_demo_table_orders',
  TABLE_CALLS: 'nfc_demo_table_calls',
  STAFF_MEMBERS: 'nfc_demo_staff_members',
};

export const VIRAL_SEED_AD: Ad = {
  id: 'ad-viral-seed',
  title: `${VIRAL_SEED_CONFIG.headline} ${VIRAL_SEED_CONFIG.subheadline}`,
  advertiser_name: VIRAL_SEED_CONFIG.brandName,
  banner_url: VIRAL_SEED_CONFIG.bannerImageUrl,
  destination_url: `https://wa.me/${VIRAL_SEED_CONFIG.whatsappNumber}?text=${encodeURIComponent(VIRAL_SEED_CONFIG.whatsappMessage)}`,
  placement_type: 'bottom_banner',
  target_type: 'all',
  target_restaurant_ids: [],
  target_tag_codes: [],
  is_active: true,
  impressions_count: 0,
  clicks_count: 0,
  created_at: new Date().toISOString(),
};

export const INITIAL_DEMO_DATA = {
  organizations: [
    {
      id: 'org-1',
      name: 'Grupo Gastronómico Gourmet',
      owner_name: 'Carlos Mendoza',
      owner_email: 'carlos@grupogourmet.com',
      owner_phone: '+525512345678',
      notify_negative_feedback: true,
      created_at: new Date().toISOString(),
    }
  ] as Organization[],
  restaurants: [
    {
      id: 'res-1',
      organization_id: 'org-1',
      brand_name: 'La Parrilla Argentina',
      branch_name: 'Sucursal Centro',
      slug: 'parrilla-centro',
      name: 'La Parrilla Argentina - Centro',
      google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      logo_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80',
      tier: 1,
      is_ad_free: false,
      brand_color: '#dc2626',
      links: [],
      address: 'Av. Juárez 102, Centro',
      manager_phone: '+525598765431',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'res-2',
      organization_id: 'org-1',
      brand_name: 'Tacos El Pastorcito',
      branch_name: 'Sucursal Norte',
      slug: 'tacos-pastorcito-norte',
      name: 'Tacos El Pastorcito - Norte',
      google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      logo_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&auto=format&fit=crop&q=80',
      tier: 2,
      is_ad_free: false,
      brand_color: '#ea580c',
      links: [],
      address: 'Blvd. del Norte 450, Col. Palmas',
      manager_phone: '+525598765432',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'res-3',
      organization_id: 'org-1',
      brand_name: 'Café Macchiato & Bistro',
      branch_name: 'Sucursal Polanco',
      slug: 'cafe-macchiato-polanco',
      name: 'Café Macchiato & Bistro',
      google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80',
      tier: 3,
      is_ad_free: true,
      brand_color: '#7c3aed',
      links: [
        { id: '1', title: 'Menú Digital & Postres', url: 'https://ejemplo.com/menu', icon: 'menu' },
        { id: '2', title: 'Síguenos en Instagram', url: 'https://instagram.com', icon: 'instagram' },
        { id: '3', title: 'Conectar a Wi-Fi Clientes', url: 'WIFI:S:CafeClientes;T:WPA;P:cafe1234;;', icon: 'wifi' },
        { id: '4', title: 'Reservaciones por WhatsApp', url: 'https://wa.me/525512345678?text=Hola,%20quiero%20reservar', icon: 'whatsapp' }
      ],
      address: 'Masaryk 310, Polanco',
      manager_phone: '+525598765433',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ] as Restaurant[],
  tags: [
    {
      id: 'tag-1',
      tag_code: 'NFC-001',
      restaurant_id: 'res-1',
      table_identifier: 'Mesa 1 (Centro)',
      scan_count: 12,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tag-2',
      tag_code: 'NFC-002',
      restaurant_id: 'res-2',
      table_identifier: 'Mesa 4 (Terraza)',
      scan_count: 28,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tag-3',
      tag_code: 'NFC-003',
      restaurant_id: 'res-3',
      table_identifier: 'Mesa Barra 2',
      scan_count: 45,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tag-4',
      tag_code: 'NFC-DEMO',
      restaurant_id: 'res-2',
      table_identifier: 'Mesa de Demostración',
      scan_count: 99,
      is_active: true,
      created_at: new Date().toISOString(),
    }
  ] as Tag[],
  ads: [
    {
      id: 'ad-1',
      title: '20% de Descuento en Limpieza Dental',
      advertiser_name: 'Clínica DentalPro',
      banner_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
      destination_url: 'https://ejemplo.com/dentalpro',
      placement_type: 'bottom_banner',
      target_type: 'all',
      target_restaurant_ids: [],
      target_tag_codes: [],
      is_active: true,
      impressions_count: 4120,
      max_impressions: 5000,
      budget_amount: 2500,
      is_renewal_sent: true,
      clicks_count: 168,
      coupon_code: 'DENTAL-20',
      coupon_description: '20% off en profilaxis',
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
      id: 'ad-2',
      title: 'Semana de Prueba Gratis en IronFit Gym',
      advertiser_name: 'IronFit Gym & Fitness',
      banner_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
      destination_url: 'https://ejemplo.com/ironfit',
      placement_type: 'bottom_banner',
      target_type: 'all',
      target_restaurant_ids: [],
      target_tag_codes: [],
      is_active: true,
      impressions_count: 2450,
      max_impressions: 5000,
      budget_amount: 1500,
      is_renewal_sent: false,
      clicks_count: 112,
      coupon_code: 'IRON-7D',
      coupon_description: 'Pase 7 días gratis',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    }
  ] as Ad[],
  feedback: [
    {
      id: 'fb-1',
      restaurant_id: 'res-2',
      tag_code: 'NFC-002',
      rating: 2,
      customer_name: 'Raúl Sánchez',
      customer_phone: '+525544332211',
      customer_email: 'raul@ejemplo.com',
      comments: 'La carne al pastor estaba fría y tardaron 25 minutos en traer las bebidas.',
      status: 'new',
      notified_to_owner: false,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'fb-2',
      restaurant_id: 'res-2',
      tag_code: 'NFC-002',
      rating: 3,
      customer_name: 'Mariana López',
      customer_phone: '+525588776655',
      customer_email: 'mariana@ejemplo.com',
      comments: 'El mesero fue muy amable pero la música estaba excesivamente alta.',
      status: 'reviewed',
      notified_to_owner: true,
      created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    }
  ] as Feedback[],
  supportTickets: [
    {
      id: 'ticket-1',
      organization_id: 'org-1',
      restaurant_id: 'res-2',
      category: 'plate_damaged',
      subject: 'Placa despegada en Mesa 4',
      message: 'Se despegó la placa NFC de la mesa 4 por limpieza constante. ¿Me pueden reponer el adhesivo o la placa física?',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'ticket-2',
      organization_id: 'org-1',
      restaurant_id: 'res-1',
      category: 'more_plates',
      subject: 'Solicitud de 5 placas adicionales para terraza',
      message: 'Abrimos una nueva terraza con 5 mesas. Necesitamos 5 placas de $100 MXN para entregarse esta misma semana.',
      status: 'in_progress',
      admin_reply: 'Excelente Carlos, ya están programadas tus 5 placas con el logo de La Parrilla. Pasamos mañana a entregarlas.',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    }
  ] as SupportTicket[],
  coupons: [
    {
      id: 'cpn-1',
      ad_id: 'ad-1',
      restaurant_id: 'res-1',
      tag_code: 'NFC-001',
      customer_phone: '+525512345678',
      customer_name: 'Alejandro Morales',
      coupon_code: 'DENTAL-20',
      title: '20% de Descuento en Limpieza Dental',
      advertiser_name: 'Clínica DentalPro',
      discount_description: '20% off en profilaxis o blanqueamiento dental presentando este cupón digital.',
      status: 'active',
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'cpn-2',
      ad_id: 'ad-2',
      restaurant_id: 'res-2',
      tag_code: 'NFC-002',
      customer_phone: '+525512345678',
      customer_name: 'Alejandro Morales',
      coupon_code: 'IRON-7D',
      title: 'Pase de 7 Días Gratis',
      advertiser_name: 'IronFit Gym & Fitness',
      discount_description: 'Acceso total a pesas, cardio y clases durante una semana completa.',
      status: 'active',
      expires_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'cpn-3',
      ad_id: 'ad-1',
      restaurant_id: 'res-1',
      customer_phone: '+525588776655',
      customer_name: 'Sofía Valenzuela',
      coupon_code: 'DENTAL-USADO',
      title: '20% de Descuento en Limpieza Dental',
      advertiser_name: 'Clínica DentalPro',
      discount_description: '20% off en profilaxis presentando cupón.',
      status: 'redeemed',
      ticket_amount: 650,
      redeemed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 3).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    }
  ] as Coupon[],
};

export function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error guardando en localStorage:', e);
  }
}

export function sanitizeSupabasePayload(obj: Record<string, any>, isInsert = false): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  if (isInsert || !clean.id) {
    delete clean.id;
  }
  return clean;
}
