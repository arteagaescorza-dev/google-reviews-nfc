import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza enlaces de imágenes, convirtiendo enlaces compartidos de Google Drive o Dropbox
 * a enlaces de imagen directa que el navegador puede renderizar.
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Google Drive: https://drive.google.com/file/d/FILE_ID/view... o ?id=FILE_ID
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  // Dropbox: https://www.dropbox.com/s/.../foto.png?dl=0 -> raw=1
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace('dl=0', 'raw=1');
  }

  return trimmed;
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

