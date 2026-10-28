import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza y valida una URL asegurando que tenga protocolo http/https
 */
export function ensureAbsoluteUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Extrae el código de tag desde window.location (query param o hash)
 * Soporta ?t=NFC-001 o #/t/NFC-001 o ?tag=NFC-001
 */
export function extractTagCodeFromUrl(): string | null {
  const searchParams = new URLSearchParams(window.location.search);
  const tagFromSearch = searchParams.get('t') || searchParams.get('tag');
  if (tagFromSearch) return tagFromSearch.trim();

  // Si viene en el hash: #/t/NFC-001 o #/?t=NFC-001
  const hash = window.location.hash;
  const hashMatch = hash.match(/\/t\/([^/?#]+)/i);
  if (hashMatch && hashMatch[1]) {
    return decodeURIComponent(hashMatch[1]).trim();
  }

  const hashQueryMatch = hash.match(/\?t=([^&#]+)/i);
  if (hashQueryMatch && hashQueryMatch[1]) {
    return decodeURIComponent(hashQueryMatch[1]).trim();
  }

  return null;
}

