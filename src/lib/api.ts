import { organizationsApi } from './api/organizations';
import { restaurantsApi } from './api/restaurants';
import { tagsApi } from './api/tags';
import { adsApi } from './api/ads';
import { feedbackApi } from './api/feedback';
import { couponsApi } from './api/coupons';
import { ordersApi } from './api/orders';
import { financesApi } from './api/finances';
import { hardwareApi } from './api/hardware';
import { salesApi } from './api/sales';
import { eventsApi } from './api/events';
import { tiersApi } from './api/tiers';

// Constantes y modelos compartidos
export * from './api/core';

// Módulos de dominio individuales
export * from './api/organizations';
export * from './api/restaurants';
export * from './api/tags';
export * from './api/ads';
export * from './api/feedback';
export * from './api/coupons';
export * from './api/orders';
export * from './api/finances';
export * from './api/hardware';
export * from './api/sales';
export * from './api/events';
export * from './api/tiers';

/**
 * Fachada API Unificada (Facade Pattern)
 * Agrupa los módulos de dominio preservando 100% de compatibilidad regresiva con la suite de pantallas y componentes.
 */
export const api = {
  ...organizationsApi,
  ...restaurantsApi,
  ...tagsApi,
  ...adsApi,
  ...feedbackApi,
  ...couponsApi,
  ...ordersApi,
  ...financesApi,
  ...hardwareApi,
  ...salesApi,
  ...eventsApi,
  ...tiersApi,
};
