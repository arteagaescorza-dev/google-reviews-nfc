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
