import type { SupportCategory, SupportStatus } from '../types';

export const TIERS = {
  1: {
    id: 1,
    name: 'Tier 1: Enlace Directo (Etapa 1 - Siembra)',
    description: 'Redirección a Google Reseñas con bucle viral propio de placas a $100 MXN.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  2: {
    id: 2,
    name: 'Tier 2: Filtro de Reputación (Cliente Fundador)',
    description: 'Estrellas interactivas: 4-5 a Google, 1-3 a buzón privado del locatario.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  3: {
    id: 3,
    name: 'Tier 3: Menú Digital + Linktree + WiFi',
    description: 'Filtro de satisfacción + botones de menú, redes sociales y conexión WiFi con 1 toque.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  4: {
    id: 4,
    name: 'Tier 4: Red Publicitaria & Analíticas',
    description: 'Bolsa de impresiones, cupones locales y métricas avanzadas por mesa.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
} as const;

export const DEFAULT_BRAND_COLOR = '#2563eb';

export const VIRAL_SEED_CONFIG = {
  brandName: 'NFC Google Reseñas',
  tagPrice: 100,
  whatsappNumber: '525512345678',
  whatsappMessage: 'Hola, vi la placa NFC en la mesa y me interesa adquirir placas inteligentes de $100 MXN para mi negocio.',
  headline: '¿Tienes un negocio o restaurante?',
  subheadline: 'Multiplica tus reseñas de 5 estrellas con placas inteligentes para mesa por solo $100 MXN c/u.',
  ctaText: 'Pedir placas por WhatsApp',
  bannerImageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80',
};

export const SUPPORT_CATEGORIES: Record<SupportCategory, { label: string; badge: string; description: string }> = {
  plate_damaged: {
    label: 'Placa dañada / despegada',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Reportar adhesivo despegado, placa rayada o falla física en mesa.',
  },
  billing: {
    label: 'Dudas o cambio de facturación',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Actualización de datos fiscales o aclaraciones de cobro.',
  },
  more_plates: {
    label: 'Solicitar más placas ($100 c/u)',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Ampliación de mesas o nuevas sucursales con entrega de placas adicionales.',
  },
  general: {
    label: 'Soporte técnico / General',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Dudas sobre el portal, enlaces, WiFi o configuración.',
  },
};

export const SUPPORT_STATUSES: Record<SupportStatus, { label: string; badge: string }> = {
  pending: {
    label: 'Pendiente',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  in_progress: {
    label: 'En Proceso',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  resolved: {
    label: 'Resuelto',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
};

// ==========================================
// Catálogo Maestro de Tiers, Servicios y Pantallas Operativas
// ==========================================

export interface MasterFeatureItem {
  id: string;
  name: string;
  description: string;
}

export interface MasterStationItem {
  id: string;
  name: string;
  roleName: string;
  description: string;
  urlPath: string;
}

export const MASTER_TIER_FEATURES: MasterFeatureItem[] = [
  {
    id: 'feat_redirect',
    name: 'Enlace Directo a Google Reviews',
    description: 'Redirección instantánea a Google Reviews sin intermediarios.',
  },
  {
    id: 'feat_viral_seeds',
    name: 'Bucle Viral de Placas en Mesa ($100 MXN)',
    description: 'Semillero viral integrado para captar prospectos B2B desde la mesa.',
  },
  {
    id: 'feat_reputation_shield',
    name: 'Filtro Inteligente de Reputación (Escudo 1 a 3 Estrellas)',
    description: 'Calificaciones de 4-5 estrellas van a Google; quejas de 1-3 estrellas van a buzón privado.',
  },
  {
    id: 'feat_complaints_inbox',
    name: 'Buzón Privado de Quejas para el Dueño',
    description: 'Recepción, trazabilidad y seguimiento confidencial de incidencias de mesa.',
  },
  {
    id: 'feat_manager_coupons',
    name: 'Cupones de Retención del Gerente con Tope Mensual',
    description: 'Emisión de cupones de descuento por quejas con límite presupuestal mensual.',
  },
  {
    id: 'feat_digital_menu',
    name: 'Menú Digital Interactivo con Carrito a Cocina',
    description: 'Carta digital multimedia con fotos, precios y envío de comandas directas.',
  },
  {
    id: 'feat_linktree',
    name: 'Botonera Linktree (Redes Sociales, Contacto & Reservas)',
    description: 'Acceso directo a WhatsApp, Instagram, Facebook, TikTok y reservaciones.',
  },
  {
    id: 'feat_wifi',
    name: 'Conexión Wi-Fi 1-Toque Automática',
    description: 'Conexión automática a la red Wi-Fi de la sucursal vía NFC o código QR.',
  },
  {
    id: 'feat_ad_network',
    name: 'Red de Anuncios Cruzados ($500 MXN Pauta Local)',
    description: 'Bolsa publicitaria mensual y cupones cruzados en comercios aliados.',
  },
  {
    id: 'feat_analytics_heatmaps',
    name: 'Mapa de Calor & Analítica por Mesa',
    description: 'Reportes de afluencia, horas pico y volumen de escaneos por cada placa física.',
  },
  {
    id: 'feat_ad_free',
    name: 'Escudo Marca Blanca (Ad-Free • 0% Anuncios)',
    description: 'Bloquea toda publicidad de terceros en las pantallas de las mesas.',
  },
];

export const MASTER_TIER_STATIONS: MasterStationItem[] = [
  {
    id: 'station_manager',
    name: 'Consola Operativa de Gerente & Capitán de Piso',
    roleName: 'Gerente de Tienda & Capitán de Piso',
    description: 'Gestión de turnos (60 días), cortes de caja, quejas y cupones.',
    urlPath: '#/portal/gerente',
  },
  {
    id: 'station_hostess',
    name: 'Pantalla de Hostess & Recepción',
    roleName: 'Hostess & Recepción',
    description: 'Gestión de mesas, aforo de comensales y alertas de limpieza.',
    urlPath: '#/portal/hostess',
  },
  {
    id: 'station_waiter',
    name: 'Terminal Móvil de Sala para Meseros',
    roleName: 'Mesero / Garrotero',
    description: 'Llamadas de cuenta, platos listos de cocina y solicitudes de limpieza.',
    urlPath: '#/portal/mesero',
  },
  {
    id: 'station_kds_general',
    name: 'Monitor Maestro KDS General',
    roleName: 'Jefe de Cocina',
    description: 'Comandas globales en tiempo real con alerta SLA 15 min.',
    urlPath: '#/portal/cocina?station=all',
  },
  {
    id: 'station_kds_cocina',
    name: 'Estación Cocina Caliente KDS',
    roleName: 'Jefe de Cocina',
    description: 'Filtra únicamente entradas y platos fuertes al grill/horno.',
    urlPath: '#/portal/cocina?station=cocina',
  },
  {
    id: 'station_kds_barra',
    name: 'Estación Barra & Coctelería KDS',
    roleName: 'Barista & Mixólogo',
    description: 'Filtra bebidas, vinos, cervezas y mixología.',
    urlPath: '#/portal/cocina?station=barra',
  },
  {
    id: 'station_kds_postres',
    name: 'Estación Repostería & Café KDS',
    roleName: 'Barista & Repostería',
    description: 'Filtra postres, digestivos y cafetería.',
    urlPath: '#/portal/cocina?station=postres',
  },
  {
    id: 'station_turnero',
    name: 'Turnero Público 4K (Food Court)',
    roleName: 'Jefe de Cocina',
    description: 'Pantalla para comensales con estado En Preparación / Listo para Recoger.',
    urlPath: '#/portal/turnero',
  },
  {
    id: 'station_pickup',
    name: 'Estación Pick Up & Collect (Despacho & Delivery)',
    roleName: 'Cajero / Despachador de Mostrador',
    description: 'Entrega de pedidos para llevar, mostrador y repartidores Uber/Rappi.',
    urlPath: '#/portal/pickup',
  },
];

export interface MasterCategoryItem {
  id: number;
  name: string;
  badgeLabel: string;
  description: string;
}

export const MASTER_TIER_CATEGORIES: MasterCategoryItem[] = [
  {
    id: 3,
    name: 'Cat 3: Pantallas Operativas KDS',
    badgeLabel: 'KDS & Estaciones',
    description: 'Cocina caliente, barra, repostería, turnero 4K, hostess y despacho pick up.',
  },
  {
    id: 4,
    name: 'Cat 4: Personal Operativo & Turnos (60 Días)',
    badgeLabel: 'Personal & Roles',
    description: 'Gestión de personal operativo con PIN, puestos y calendario de turnos a 60 días.',
  },
  {
    id: 5,
    name: 'Cat 5: Gerencia & Cortes de Turno',
    badgeLabel: 'Gerencia & Cortes',
    description: 'Consola de gerente de tienda, cortes de turno al dueño y autorización de cupones.',
  },
  {
    id: 6,
    name: 'Cat 6: Métricas & Analítica por Sucursal',
    badgeLabel: 'Analítica & Reportes',
    description: 'Tablero de satisfacción, afluencia por mesa, ticket promedio y reportes temporales.',
  },
];

export const DEFAULT_CUSTOM_TIERS = [
  {
    tier: 1 as const,
    name: 'Tier 1: Enlace Directo (Etapa 1 - Siembra)',
    badge_label: 'Tier 1',
    price_mxn: 100,
    description: 'Redirección instantánea a Google Reviews con semillero viral de placas.',
    included_features: ['feat_redirect', 'feat_viral_seeds'],
    included_stations: [] as string[],
    client_visible_features: ['feat_redirect', 'feat_viral_seeds'],
    client_visible_stations: [] as string[],
    allowed_categories: [1, 2],
  },
  {
    tier: 2 as const,
    name: 'Tier 2: Filtro de Reputación (Cliente Fundador)',
    badge_label: 'Tier 2',
    price_mxn: 399,
    description: 'Calificaciones de 4-5 estrellas van a Google; 1-3 a buzón privado con cupones de gerente.',
    included_features: ['feat_redirect', 'feat_viral_seeds', 'feat_reputation_shield', 'feat_complaints_inbox', 'feat_manager_coupons'],
    included_stations: ['station_manager'],
    client_visible_features: ['feat_redirect', 'feat_viral_seeds', 'feat_reputation_shield', 'feat_complaints_inbox', 'feat_manager_coupons'],
    client_visible_stations: ['station_manager'],
    allowed_categories: [1, 2, 5, 6],
  },
  {
    tier: 3 as const,
    name: 'Tier 3: Menú Digital, Linktree & KDS Operativo',
    badge_label: 'Tier 3',
    price_mxn: 899,
    description: 'Menú digital con carrito a cocina, Linktree, Wi-Fi 1-toque, estaciones KDS y terminales de sala.',
    included_features: [
      'feat_redirect',
      'feat_viral_seeds',
      'feat_reputation_shield',
      'feat_complaints_inbox',
      'feat_manager_coupons',
      'feat_digital_menu',
      'feat_linktree',
      'feat_wifi',
    ],
    included_stations: [
      'station_manager',
      'station_hostess',
      'station_waiter',
      'station_kds_general',
      'station_kds_cocina',
      'station_kds_barra',
      'station_kds_postres',
      'station_pickup',
    ],
    client_visible_features: [
      'feat_redirect',
      'feat_viral_seeds',
      'feat_reputation_shield',
      'feat_complaints_inbox',
      'feat_manager_coupons',
      'feat_digital_menu',
      'feat_linktree',
      'feat_wifi',
    ],
    client_visible_stations: [
      'station_manager',
      'station_hostess',
      'station_waiter',
      'station_kds_general',
      'station_kds_cocina',
      'station_kds_barra',
      'station_kds_postres',
      'station_pickup',
    ],
    allowed_categories: [1, 2, 3, 4, 5, 6],
  },
  {
    tier: 4 as const,
    name: 'Tier 4: Red Publicitaria, Turnero 4K & Analítica',
    badge_label: 'Tier 4',
    price_mxn: 1499,
    description: 'Bolsa publicitaria local ($500 MXN), mapa de calor por mesa, turnero público 4K y suite completa.',
    included_features: [
      'feat_redirect',
      'feat_viral_seeds',
      'feat_reputation_shield',
      'feat_complaints_inbox',
      'feat_manager_coupons',
      'feat_digital_menu',
      'feat_linktree',
      'feat_wifi',
      'feat_ad_network',
      'feat_analytics_heatmaps',
    ],
    included_stations: [
      'station_manager',
      'station_hostess',
      'station_waiter',
      'station_kds_general',
      'station_kds_cocina',
      'station_kds_barra',
      'station_kds_postres',
      'station_turnero',
      'station_pickup',
    ],
    client_visible_features: [
      'feat_redirect',
      'feat_viral_seeds',
      'feat_reputation_shield',
      'feat_complaints_inbox',
      'feat_manager_coupons',
      'feat_digital_menu',
      'feat_linktree',
      'feat_wifi',
      'feat_ad_network',
      'feat_analytics_heatmaps',
    ],
    client_visible_stations: [
      'station_manager',
      'station_hostess',
      'station_waiter',
      'station_kds_general',
      'station_kds_cocina',
      'station_kds_barra',
      'station_kds_postres',
      'station_turnero',
      'station_pickup',
    ],
    allowed_categories: [1, 2, 3, 4, 5, 6],
  },
  {
    tier: 'addon' as const,
    name: 'Add-On: Escudo Marca Blanca (Ad-Free • 0% Anuncios)',
    badge_label: 'Add-On',
    price_mxn: 299,
    description: 'Bloquea toda publicidad de terceros en las pantallas de las mesas de la sucursal.',
    included_features: ['feat_ad_free'],
    included_stations: [] as string[],
    client_visible_features: ['feat_ad_free'],
    client_visible_stations: [] as string[],
    allowed_categories: [1, 2],
  },
];
