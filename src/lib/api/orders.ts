import { supabase, isSupabaseConfigured } from '../supabase';
import type {
  MenuItem,
  MenuCategory,
  TableOrder,
  TableOrderStatus,
  TableCall,
  StaffMember,
  TableSession,
  DailyCashClose,
  CorporateOrder,
  RestaurantTable,
  RestaurantTableStatus,
  KitchenStation,
  StaffShift,
  ManagerRetentionCoupon,
  ManagerShiftReport,
  Feedback,
  Restaurant,
} from '../../types';
import { STORAGE_KEYS, getLocalItem, setLocalItem, sanitizeSupabasePayload } from './core';

/**
 * POL-009 (Regla 1 y 2): Aislamiento estricto multi-organización.
 * Una organización o sucursal jamás tiene acceso a los datos ni configuraciones de otra organización.
 */
export function isSameOrganizationAccessAllowed(
  sourceOrganizationId: string | null | undefined,
  targetOrganizationId: string | null | undefined
): boolean {
  if (!sourceOrganizationId || !targetOrganizationId) return false;
  return sourceOrganizationId.trim() === targetOrganizationId.trim();
}

/**
 * Filtra el listado de sucursales para devolver únicamente las que pertenecen a la misma organización
 * de la sucursal activa (aislamiento de sucursal y organización).
 */
export function filterBranchesBySameOrganization(
  branches: Restaurant[],
  activeBranchId: string
): Restaurant[] {
  if (!branches || branches.length === 0) return [];
  const current = branches.find((b) => b.id === activeBranchId) || branches[0];
  if (!current) return [];
  if (!current.organization_id) {
    return [current];
  }
  return branches.filter((b) =>
    isSameOrganizationAccessAllowed(current.organization_id, b.organization_id)
  );
}

export function getDefaultStationsForRole(role: StaffMember['role']): KitchenStation[] {
  if (role === 'kitchen') return ['cocina'];
  if (role === 'barista') return ['barra', 'postres'];
  if (role === 'cashier') return ['pickup'];
  if (role === 'employee' || role === 'empleado') return ['all'];
  return ['all'];
}

export const ordersApi = {
async getMenuItems(restaurantId?: string): Promise<MenuItem[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('menu_items').select('*').order('name');
        if (restaurantId && restaurantId !== 'res-1') {
          query = query.eq('restaurant_id', restaurantId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as MenuItem[];
        }
      } catch (err) {
        console.warn('Fallo al obtener menu_items de Supabase, usando respaldo local:', err);
      }
    }

    const defaultItems: MenuItem[] = [
      {
        id: 'menu-1',
        restaurant_id: restaurantId || 'res-1',
        category: 'entradas',
        name: 'Carpaccio de Res Trufado',
        description: 'Láminas finas de lomo de res con vinagreta de trufa negra, alcaparras y lascas de parmesano reggiano.',
        price: 185,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 8,
      },
      {
        id: 'menu-2',
        restaurant_id: restaurantId || 'res-1',
        category: 'entradas',
        name: 'Bruschetta Pomodoro Clásica',
        description: 'Pan rústico al horno de leña, jitomate cherry macerado en aceite de oliva virgen extra y albahaca fresca.',
        price: 130,
        image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 6,
      },
      {
        id: 'menu-3',
        restaurant_id: restaurantId || 'res-1',
        category: 'principales',
        name: 'Pizza Margherita al Horno de Leña',
        description: 'Salsa de tomate San Marzano, mozzarella fior di latte, albahaca fresca y aceite de oliva virgen extra.',
        price: 240,
        image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 12,
      },
      {
        id: 'menu-4',
        restaurant_id: restaurantId || 'res-1',
        category: 'principales',
        name: 'Fettuccine Alfredo con Camarones',
        description: 'Pasta fresca hecha en casa salteada en mantequilla infusionada, crema ligera y camarones a las hierbas finas.',
        price: 295,
        image_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 15,
      },
      {
        id: 'menu-5',
        restaurant_id: restaurantId || 'res-1',
        category: 'principales',
        name: 'Corte Rib Eye Prime 400g',
        description: 'Corte premium al grill con sal de mar de Colima, acompañado de espárragos asados y papas al romero.',
        price: 420,
        image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 20,
      },
      {
        id: 'menu-6',
        restaurant_id: restaurantId || 'res-1',
        category: 'bebidas',
        name: 'Copa de Vino Tinto Chianti Reserva',
        description: 'Selección de la casa con notas de frutos rojos y madera. Ideal para maridar con carnes y pastas.',
        price: 160,
        image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 3,
      },
      {
        id: 'menu-7',
        restaurant_id: restaurantId || 'res-1',
        category: 'bebidas',
        name: 'Cerveza Artesanal IPA Mexicana 355ml',
        description: 'Cerveza de cuerpo medio con amargor balanceado y notas cítricas florales.',
        price: 95,
        image_url: 'https://images.unsplash.com/photo-1608270191544-774f3261a868?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 2,
      },
      {
        id: 'menu-8',
        restaurant_id: restaurantId || 'res-1',
        category: 'bebidas',
        name: 'Limonada Natural Menta & Jengibre',
        description: 'Refrescante limonada preparada al momento con jarabe natural, hojas de menta maceradas y toque de jengibre.',
        price: 65,
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 4,
      },
      {
        id: 'menu-9',
        restaurant_id: restaurantId || 'res-1',
        category: 'postres',
        name: 'Tiramisú Tradicional de Mascarpone',
        description: 'Capas de soletas remojadas en café espresso y licor amaretto con crema sedosa de queso mascarpone y cacao.',
        price: 145,
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 5,
      },
      {
        id: 'menu-10',
        restaurant_id: restaurantId || 'res-1',
        category: 'postres',
        name: 'Panna Cotta con Coulis de Frutos Rojos',
        description: 'Clásico postre italiano de crema aromatizada con vaina de vainilla y coulis artesanal de frambuesas y zarzamoras.',
        price: 120,
        image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 5,
      },
    ];

    const current = getLocalItem<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, defaultItems);
    if (!restaurantId) return current;
    return current.filter((m) => m.restaurant_id === restaurantId || m.restaurant_id === 'res-1');
  },

async saveMenuItem(item: Partial<MenuItem>): Promise<{ success: boolean; data?: MenuItem }> {
    if (isSupabaseConfigured) {
      try {
        if (item.id && !item.id.startsWith('menu-')) {
          const { data, error } = await supabase
            .from('menu_items')
            .update(item)
            .eq('id', item.id)
            .select()
            .single();
          if (!error && data) return { success: true, data: data as MenuItem };
        } else {
          const payload = { ...item };
          if (payload.id && payload.id.startsWith('menu-')) delete payload.id;
          const { data, error } = await supabase
            .from('menu_items')
            .insert([payload])
            .select()
            .single();
          if (!error && data) return { success: true, data: data as MenuItem };
        }
      } catch (err) {
        console.warn('Fallo al guardar menu_item en Supabase, usando respaldo local:', err);
      }
    }

    const current = await ordersApi.getMenuItems();
    if (item.id) {
      const updated = current.map((m) => (m.id === item.id ? ({ ...m, ...item } as MenuItem) : m));
      setLocalItem(STORAGE_KEYS.MENU_ITEMS, updated);
      return { success: true, data: updated.find((m) => m.id === item.id) };
    } else {
      const created: MenuItem = {
        id: 'menu-' + Date.now(),
        restaurant_id: item.restaurant_id || 'res-1',
        category: item.category || 'principales',
        name: item.name || 'Nuevo Platillo',
        description: item.description || '',
        price: item.price || 150,
        image_url: item.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
        is_available: item.is_available ?? true,
        preparation_time_mins: item.preparation_time_mins || 10,
      };
      setLocalItem(STORAGE_KEYS.MENU_ITEMS, [created, ...current]);
      return { success: true, data: created };
    }
  },

  async deleteMenuItem(itemId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
        if (error) console.warn('Error eliminando menu_item en Supabase:', error.message);
      } catch (err: any) {
        console.warn('Fallo al eliminar menu_item en Supabase:', err.message);
      }
    }
    const current = await ordersApi.getMenuItems();
    const updated = current.filter((m) => m.id !== itemId);
    setLocalItem(STORAGE_KEYS.MENU_ITEMS, updated);
    return { success: true };
  },

  async toggleMenuItemAvailability(itemId: string, isAvailable: boolean): Promise<{ success: boolean }> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('menu_items').update({ is_available: isAvailable }).eq('id', itemId);
      } catch (err) {
        // Fallback local
      }
    }
    const current = await ordersApi.getMenuItems();
    const updated = current.map((m) => (m.id === itemId ? { ...m, is_available: isAvailable } : m));
    setLocalItem(STORAGE_KEYS.MENU_ITEMS, updated);
    return { success: true };
  },

  async getMenuCategories(restaurantId?: string): Promise<MenuCategory[]> {
    const defaultCategories: MenuCategory[] = [
      { id: 'cat-1', name: 'Entradas', slug: 'entradas', sort_order: 1 },
      { id: 'cat-2', name: 'Principales', slug: 'principales', sort_order: 2 },
      { id: 'cat-3', name: 'Bebidas', slug: 'bebidas', sort_order: 3 },
      { id: 'cat-4', name: 'Postres', slug: 'postres', sort_order: 4 },
    ];

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('menu_categories').select('*').order('sort_order', { ascending: true });
        if (restaurantId && restaurantId !== 'res-1') {
          query = query.or(`restaurant_id.eq.${restaurantId},restaurant_id.is.null`);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as MenuCategory[];
        }
      } catch (err) {
        // Fallback local
      }
    }

    const current = getLocalItem<MenuCategory[]>(STORAGE_KEYS.MENU_CATEGORIES, defaultCategories);
    return current;
  },

  async saveMenuCategory(category: Partial<MenuCategory>): Promise<{ success: boolean; data?: MenuCategory }> {
    if (isSupabaseConfigured) {
      try {
        if (category.id && !category.id.startsWith('cat-')) {
          const { data, error } = await supabase
            .from('menu_categories')
            .update(category)
            .eq('id', category.id)
            .select()
            .single();
          if (!error && data) return { success: true, data: data as MenuCategory };
        } else {
          const payload = { ...category };
          if (payload.id && payload.id.startsWith('cat-')) delete payload.id;
          const { data, error } = await supabase
            .from('menu_categories')
            .insert([payload])
            .select()
            .single();
          if (!error && data) return { success: true, data: data as MenuCategory };
        }
      } catch (err) {
        // Fallback local
      }
    }

    const current = await ordersApi.getMenuCategories();
    if (category.id) {
      const updated = current.map((c) =>
        c.id === category.id ? ({ ...c, ...category } as MenuCategory) : c
      );
      setLocalItem(STORAGE_KEYS.MENU_CATEGORIES, updated);
      return { success: true, data: updated.find((c) => c.id === category.id) };
    } else {
      const slug = (category.slug || category.name || 'categoria')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      const created: MenuCategory = {
        id: 'cat-' + Date.now(),
        name: category.name || 'Nueva Categoría',
        slug: slug || 'cat-' + Date.now(),
        sort_order: category.sort_order || current.length + 1,
        restaurant_id: category.restaurant_id,
      };
      const updated = [...current, created];
      setLocalItem(STORAGE_KEYS.MENU_CATEGORIES, updated);
      return { success: true, data: created };
    }
  },

  async deleteMenuCategory(categoryId: string): Promise<{ success: boolean }> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('menu_categories').delete().eq('id', categoryId);
      } catch (err) {
        // Fallback local
      }
    }
    const current = await ordersApi.getMenuCategories();
    const updated = current.filter((c) => c.id !== categoryId);
    setLocalItem(STORAGE_KEYS.MENU_CATEGORIES, updated);
    return { success: true };
  },

async getTableOrders(restaurantId?: string): Promise<TableOrder[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('table_orders').select('*').order('created_at', { ascending: false });
        if (restaurantId && restaurantId !== 'res-1') {
          query = query.eq('restaurant_id', restaurantId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as TableOrder[];
        }
      } catch (err) {
        console.warn('Fallo al obtener table_orders de Supabase, usando respaldo local:', err);
      }
    }

    const now = Date.now();
    const defaultOrders: TableOrder[] = [
      {
        id: 'ord-1',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-004',
        table_number: 'Mesa 4',
        items: [
          { menu_item_id: 'menu-3', name: 'Pizza Margherita al Horno', price: 240, quantity: 2, notes: 'Orilla crujiente' },
          { menu_item_id: 'menu-7', name: 'Cerveza Artesanal IPA', price: 95, quantity: 2 },
        ],
        total_amount: 670,
        status: 'preparing',
        customer_name: 'Alejandro G.',
        created_at: new Date(now - 8 * 60 * 1000).toISOString(),
        updated_at: new Date(now - 7 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-2',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-002',
        table_number: 'Mesa 2',
        items: [
          { menu_item_id: 'menu-4', name: 'Fettuccine Alfredo con Camarones', price: 295, quantity: 1, notes: 'Sin queso rallado extra' },
          { menu_item_id: 'menu-6', name: 'Copa de Vino Chianti Reserva', price: 160, quantity: 1 },
        ],
        total_amount: 455,
        status: 'ready',
        customer_name: 'Mariana Soto',
        created_at: new Date(now - 14 * 60 * 1000).toISOString(),
        updated_at: new Date(now - 2 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-3',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-007',
        table_number: 'Mesa 7',
        items: [
          { menu_item_id: 'menu-1', name: 'Carpaccio de Res Trufado', price: 185, quantity: 1 },
          { menu_item_id: 'menu-8', name: 'Limonada Menta & Jengibre', price: 65, quantity: 2, notes: 'Poco hielo' },
        ],
        total_amount: 315,
        status: 'pending',
        customer_name: 'Comensal Mesa 7',
        created_at: new Date(now - 2 * 60 * 1000).toISOString(),
        updated_at: new Date(now - 2 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-4',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-001',
        table_number: 'Mesa 1',
        items: [
          { menu_item_id: 'menu-5', name: 'Corte Rib Eye Prime 400g', price: 420, quantity: 1, notes: 'Término medio' },
          { menu_item_id: 'menu-9', name: 'Tiramisú Tradicional', price: 145, quantity: 1 },
        ],
        total_amount: 565,
        status: 'delivered',
        customer_name: 'Carlos Mendoza',
        created_at: new Date(now - 38 * 60 * 1000).toISOString(),
        updated_at: new Date(now - 10 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-5',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'PICKUP-01',
        table_number: 'Mostrador Pick Up 101',
        items: [
          { menu_item_id: 'menu-3', name: 'Pizza Cuatro Quesos para Llevar', price: 260, quantity: 1 },
          { menu_item_id: 'menu-8', name: 'Refresco Artesanal', price: 55, quantity: 2 },
        ],
        total_amount: 370,
        status: 'delivered',
        customer_name: 'David R. (Pick Up)',
        created_at: new Date(now - 86400000 * 1).toISOString(),
        updated_at: new Date(now - 86400000 * 1 + 6 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-6',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-003',
        table_number: 'Mesa 3',
        items: [
          { menu_item_id: 'menu-5', name: 'Hamburguesa Gourmet con Papas Trufadas', price: 280, quantity: 2 },
          { menu_item_id: 'menu-7', name: 'Cerveza de Barril', price: 85, quantity: 2 },
        ],
        total_amount: 730,
        status: 'delivered',
        customer_name: 'Fernando V.',
        created_at: new Date(now - 86400000 * 2).toISOString(),
        updated_at: new Date(now - 86400000 * 2 + 18 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-7',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-005',
        table_number: 'Mesa 5',
        items: [
          { menu_item_id: 'menu-1', name: 'Ensalada César con Pollo al Grill', price: 175, quantity: 1 },
          { menu_item_id: 'menu-6', name: 'Vino Tinto Copa', price: 150, quantity: 1 },
        ],
        total_amount: 325,
        status: 'delivered',
        customer_name: 'Lucía M.',
        created_at: new Date(now - 86400000 * 4).toISOString(),
        updated_at: new Date(now - 86400000 * 4 + 12 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-8',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-002',
        table_number: 'Mesa 2',
        items: [
          { menu_item_id: 'menu-4', name: 'Lasagna Bolognese al Horno de Piedra', price: 270, quantity: 2 },
          { menu_item_id: 'menu-9', name: 'Café Espresso Doble', price: 55, quantity: 2 },
        ],
        total_amount: 650,
        status: 'delivered',
        customer_name: 'Gabriel T.',
        created_at: new Date(now - 86400000 * 6).toISOString(),
        updated_at: new Date(now - 86400000 * 6 + 15 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-9',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-006',
        table_number: 'Mesa 6 Barra',
        items: [
          { menu_item_id: 'menu-5', name: 'Corte New York Prime 350g', price: 390, quantity: 1 },
          { menu_item_id: 'menu-6', name: 'Vino Tinto Reserva Botella', price: 780, quantity: 1 },
        ],
        total_amount: 1170,
        status: 'delivered',
        customer_name: 'Esteban C.',
        created_at: new Date(now - 86400000 * 12).toISOString(),
        updated_at: new Date(now - 86400000 * 12 + 22 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-10',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-001',
        table_number: 'Mesa 1',
        items: [
          { menu_item_id: 'menu-3', name: 'Risotto de Hongos Portobello', price: 290, quantity: 1 },
          { menu_item_id: 'menu-8', name: 'Agua San Pellegrino 500ml', price: 75, quantity: 1 },
        ],
        total_amount: 365,
        status: 'delivered',
        customer_name: 'Patricia B.',
        created_at: new Date(now - 86400000 * 18).toISOString(),
        updated_at: new Date(now - 86400000 * 18 + 14 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-11',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'PICKUP-02',
        table_number: 'Mostrador Pick Up 102',
        items: [
          { menu_item_id: 'menu-3', name: 'Pizza Prosciutto Arugula', price: 285, quantity: 1 },
        ],
        total_amount: 285,
        status: 'delivered',
        customer_name: 'Arturo N. (Llevar)',
        created_at: new Date(now - 86400000 * 25).toISOString(),
        updated_at: new Date(now - 86400000 * 25 + 7 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-12',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-004',
        table_number: 'Mesa 4',
        items: [
          { menu_item_id: 'menu-5', name: 'Picaña Brasileña a las Brasas', price: 340, quantity: 2 },
          { menu_item_id: 'menu-7', name: 'Cerveza Modelo Especial', price: 70, quantity: 4 },
        ],
        total_amount: 960,
        status: 'delivered',
        customer_name: 'Héctor S.',
        created_at: new Date(now - 86400000 * 35).toISOString(),
        updated_at: new Date(now - 86400000 * 35 + 20 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-13',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-007',
        table_number: 'Mesa 7',
        items: [
          { menu_item_id: 'menu-1', name: 'Tabla de Quesos y Carnes Frías', price: 320, quantity: 1 },
          { menu_item_id: 'menu-6', name: 'Vino Blanco Sauvignon Blanc', price: 540, quantity: 1 },
        ],
        total_amount: 860,
        status: 'delivered',
        customer_name: 'Sonia G.',
        created_at: new Date(now - 86400000 * 42).toISOString(),
        updated_at: new Date(now - 86400000 * 42 + 16 * 60 * 1000).toISOString(),
      },
    ];

    const rawOrders = getLocalItem<TableOrder[]>(STORAGE_KEYS.TABLE_ORDERS, defaultOrders);
    const current = rawOrders.length <= 4 ? defaultOrders : rawOrders;
    if (!restaurantId) return current;
    return current.filter((o) => o.restaurant_id === restaurantId || o.restaurant_id === 'res-1');
  },

async createTableOrder(order: Partial<TableOrder>): Promise<{ success: boolean; data?: TableOrder; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const payload = {
          restaurant_id: order.restaurant_id || 'res-1',
          tag_code: order.tag_code || 'TAG-ROM-001',
          table_number: order.table_number || 'Mesa 1',
          items: order.items || [],
          total_amount: order.total_amount || 0,
          status: 'pending',
          customer_name: order.customer_name || 'Comensal en Mesa',
        };
        const { data, error } = await supabase
          .from('table_orders')
          .insert([payload])
          .select()
          .single();
        if (!error && data) {
          return { success: true, data: data as TableOrder };
        }
      } catch (err) {
        console.warn('Fallo al crear table_order en Supabase, usando respaldo local:', err);
      }
    }

    const current = await ordersApi.getTableOrders();
    const created: TableOrder = {
      id: 'ord-' + Date.now(),
      restaurant_id: order.restaurant_id || 'res-1',
      tag_code: order.tag_code || 'TAG-ROM-001',
      table_number: order.table_number || 'Mesa 1',
      items: order.items || [],
      total_amount: order.total_amount || 0,
      status: 'pending',
      customer_name: order.customer_name || 'Comensal en Mesa',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.TABLE_ORDERS, [created, ...current]);
    return { success: true, data: created };
  },

async updateTableOrderStatus(orderId: string, status: TableOrderStatus): Promise<{ success: boolean; data?: TableOrder }> {
    if (isSupabaseConfigured && !orderId.startsWith('ord-')) {
      try {
        const { data, error } = await supabase
          .from('table_orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .select()
          .single();
        if (!error && data) return { success: true, data: data as TableOrder };
      } catch (err) {
        console.warn('Fallo al actualizar table_order en Supabase:', err);
      }
    }

    const current = await ordersApi.getTableOrders();
    const updated = current.map((o) => (o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o));
    setLocalItem(STORAGE_KEYS.TABLE_ORDERS, updated);
    return { success: true, data: updated.find((o) => o.id === orderId) };
  },

async getTableCalls(restaurantId?: string): Promise<TableCall[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        let query = supabase.from('table_calls').select('*').order('created_at', { ascending: false });
        if (restaurantId && !restaurantId.startsWith('res-')) {
          query = query.eq('restaurant_id', restaurantId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as TableCall[];
        }
      } catch (err) {
        console.warn('Fallo al obtener table_calls de Supabase, usando respaldo local:', err);
      }
    }

    const now = Date.now();
    const defaultCalls: TableCall[] = [
      {
        id: 'call-1',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-005',
        table_number: 'Mesa 5',
        call_type: 'bill_card',
        status: 'active',
        created_at: new Date(now - 3 * 60 * 1000).toISOString(),
      },
      {
        id: 'call-2',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-003',
        table_number: 'Mesa 3',
        call_type: 'waiter',
        status: 'active',
        created_at: new Date(now - 1 * 60 * 1000).toISOString(),
      },
    ];

    const current = getLocalItem<TableCall[]>(STORAGE_KEYS.TABLE_CALLS, defaultCalls);
    if (!restaurantId) return current;
    return current.filter((c) => c.restaurant_id === restaurantId || c.restaurant_id === 'res-1');
  },

async createTableCall(call: Partial<TableCall>): Promise<{ success: boolean; data?: TableCall }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const targetResId = call.restaurant_id || 'res-1';
    if (!isDemo && isSupabaseConfigured && !targetResId.startsWith('res-')) {
      try {
        const payload = {
          restaurant_id: targetResId,
          tag_code: call.tag_code || 'TAG-MES-001',
          table_number: call.table_number || 'Mesa',
          call_type: call.call_type || 'waiter',
          status: 'active',
        };
        const { data, error } = await supabase
          .from('table_calls')
          .insert([payload])
          .select()
          .single();
        if (!error && data) return { success: true, data: data as TableCall };
      } catch (err) {
        console.warn('Fallo al crear table_call en Supabase, usando respaldo local:', err);
      }
    }

    const current = await ordersApi.getTableCalls();
    const created: TableCall = {
      id: 'call-' + Date.now(),
      restaurant_id: call.restaurant_id || 'res-1',
      tag_code: call.tag_code || 'TAG-MES-001',
      table_number: call.table_number || 'Mesa',
      call_type: call.call_type || 'waiter',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.TABLE_CALLS, [created, ...current]);
    return { success: true, data: created };
  },

async resolveTableCall(callId: string, staffName = 'Mesero en Turno'): Promise<{ success: boolean; data?: TableCall }> {
    let resolvedCall: TableCall | undefined;

    if (isSupabaseConfigured && !callId.startsWith('call-')) {
      try {
        const { data, error } = await supabase
          .from('table_calls')
          .update({
            status: 'attended',
            attended_at: new Date().toISOString(),
            attended_by: staffName,
          })
          .eq('id', callId)
          .select()
          .single();
        if (!error && data) {
          resolvedCall = data as TableCall;
        }
      } catch (err) {
        console.warn('Fallo al resolver table_call en Supabase:', err);
      }
    }

    const current = await ordersApi.getTableCalls();
    const updated = current.map((c) =>
      c.id === callId
        ? { ...c, status: 'attended' as const, attended_at: new Date().toISOString(), attended_by: staffName }
        : c
    );
    setLocalItem(STORAGE_KEYS.TABLE_CALLS, updated);
    if (!resolvedCall) {
      resolvedCall = updated.find((c) => c.id === callId);
    }

    // Si era una solicitud de limpieza ('cleaning') enviada por Hostess, liberar automáticamente la mesa a estado 'libre'
    if (resolvedCall && resolvedCall.call_type === 'cleaning') {
      try {
        const tables = await ordersApi.getRestaurantTables(resolvedCall.restaurant_id);
        const matchingTable = tables.find(
          (t) =>
            t.table_number.trim().toLowerCase() === resolvedCall!.table_number.trim().toLowerCase() ||
            `mesa ${t.table_number}`.trim().toLowerCase() === resolvedCall!.table_number.trim().toLowerCase()
        );
        if (matchingTable) {
          await ordersApi.updateRestaurantTableStatus(matchingTable.id, 'libre', 0);
        }
      } catch (err) {
        console.warn('No se pudo actualizar estado de mesa tras limpieza:', err);
      }
    }

    return { success: true, data: resolvedCall };
  },

  async getStaffMembers(restaurantId?: string): Promise<StaffMember[]> {
    const defaultStaff: StaffMember[] = [
      {
        id: 'staff-1',
        restaurant_id: restaurantId || 'res-1',
        name: 'Marco Antonio (Mesero)',
        role: 'waiter',
        pin_code: '1234',
        is_active: true,
        allowed_stations: ['all'],
        created_at: new Date().toISOString(),
      },
      {
        id: 'staff-2',
        restaurant_id: restaurantId || 'res-1',
        name: 'Chef Roberto (Jefe de Cocina)',
        role: 'kitchen',
        pin_code: '4321',
        is_active: true,
        allowed_stations: ['cocina'],
        created_at: new Date().toISOString(),
      },
      {
        id: 'staff-3',
        restaurant_id: restaurantId || 'res-1',
        name: 'Sofía Valdés (Capitana de Piso)',
        role: 'manager',
        pin_code: '9999',
        is_active: true,
        allowed_stations: ['all'],
        created_at: new Date().toISOString(),
      },
      {
        id: 'staff-4',
        restaurant_id: restaurantId || 'res-1',
        name: 'Valeria Montes (Hostess)',
        role: 'hostess',
        pin_code: '1111',
        is_active: true,
        allowed_stations: ['all'],
        created_at: new Date().toISOString(),
      },
      {
        id: 'staff-5',
        restaurant_id: restaurantId || 'res-1',
        name: 'Diego Herrera (Barista & Barra)',
        role: 'barista',
        pin_code: '2222',
        is_active: true,
        allowed_stations: ['barra', 'postres'],
        created_at: new Date().toISOString(),
      },
    ];

    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';

    if (!isDemo && isSupabaseConfigured) {
      try {
        let query = supabase.from('restaurant_staff').select('*').order('created_at', { ascending: true });
        const isUUID =
          typeof restaurantId === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantId);

        if (isUUID) {
          query = query.eq('restaurant_id', restaurantId);
        } else if (restaurantId === 'res-1') {
          const localStored = getLocalItem<StaffMember[]>(STORAGE_KEYS.STAFF_MEMBERS, defaultStaff);
          return localStored.filter((s) => s.restaurant_id === 'res-1');
        } else if (restaurantId) {
          // Si tiene un formato no-UUID y no es demo general, no coincide en BD relacional
          return [];
        }

        const { data, error } = await query;
        if (!error && data) {
          const remoteList = (data as StaffMember[]).map((s) => ({
            ...s,
            allowed_stations:
              s.allowed_stations && s.allowed_stations.length > 0
                ? s.allowed_stations
                : getDefaultStationsForRole(s.role),
          }));

          return remoteList;
        }
      } catch (err) {
        console.warn('Fallo al obtener restaurant_staff de Supabase, usando respaldo local:', err);
      }
    }

    const stored = getLocalItem<StaffMember[]>(STORAGE_KEYS.STAFF_MEMBERS, defaultStaff);
    const normalized = stored.map((s) => ({
      ...s,
      allowed_stations:
        s.allowed_stations && s.allowed_stations.length > 0
          ? s.allowed_stations
          : getDefaultStationsForRole(s.role),
    }));
    if (restaurantId && restaurantId !== 'res-1') {
      const branchFiltered = normalized.filter((s) => s.restaurant_id === restaurantId);
      if (branchFiltered.length > 0) return branchFiltered;
      // Si la sucursal de la misma organización aún no tiene plantilla propia en demo, devolver copia base si no hay empleados de otra org
      const anyCustomForBranch = stored.some((s) => s.restaurant_id === restaurantId);
      if (anyCustomForBranch) return [];
    }
    return normalized;
  },

  /**
   * Obtiene todo el personal operativo perteneciente a las sucursales de una misma organización,
   * aislando estrictamente cualquier dato de otras organizaciones.
   */
  async getOrganizationStaffMembers(
    organizationId: string,
    sameOrgBranchIds: string[]
  ): Promise<StaffMember[]> {
    if (!organizationId || sameOrgBranchIds.length === 0) return [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('restaurant_staff')
          .select('*')
          .in('restaurant_id', sameOrgBranchIds);
        if (!error && data && data.length > 0) {
          return (data as StaffMember[]).map((s) => ({
            ...s,
            allowed_stations:
              s.allowed_stations && s.allowed_stations.length > 0
                ? s.allowed_stations
                : getDefaultStationsForRole(s.role),
          }));
        }
      } catch (err) {
        console.warn('Error consultando personal de la organización en Supabase:', err);
      }
    }

    const allStored = await ordersApi.getStaffMembers();
    return allStored.filter(
      (s) => sameOrgBranchIds.includes(s.restaurant_id) || (organizationId === 'org-1' && s.restaurant_id === 'res-1')
    );
  },

  /**
   * POL-009 (Regla 3): Todo el personal operativo puede iniciar sesión con su PIN en otras sucursales
   * de su MISMA organización para cubrir su turno ahí, pero nunca en sucursales de otra organización.
   */
  async loginStaffWithPin(
    restaurantId: string,
    pin: string,
    sameOrgBranchIds?: string[]
  ): Promise<{
    success: boolean;
    staff?: StaffMember;
    isInterBranchShift?: boolean;
    homeBranchId?: string;
    error?: string;
  }> {
    let allowedBranchIds = sameOrgBranchIds ? [...sameOrgBranchIds] : [];
    if (allowedBranchIds.length === 0) {
      const storedRests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, []);
      if (storedRests.length > 0) {
        const sameOrg = filterBranchesBySameOrganization(storedRests, restaurantId);
        allowedBranchIds = sameOrg.map((r) => r.id);
      }
    }
    if (!allowedBranchIds.includes(restaurantId)) {
      allowedBranchIds.push(restaurantId);
    }

    // Obtener plantilla completa para validar tanto pertenencia como aislamiento entre organizaciones
    const allStaff = await ordersApi.getStaffMembers();
    const isDemo = !isSupabaseConfigured || (typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true');

    // 1. Buscar primero en la sucursal actual
    const directMatch = allStaff.find(
      (s) =>
        s.is_active &&
        s.restaurant_id === restaurantId &&
        (s.pin_code === pin || (isDemo && pin === '1234'))
    );
    if (directMatch) {
      return {
        success: true,
        staff: directMatch,
        isInterBranchShift: false,
        homeBranchId: directMatch.restaurant_id,
      };
    }

    // 2. Buscar en otras sucursales de la MISMA organización (movilidad inter-sucursal permitida)
    const interBranchMatch = allStaff.find(
      (s) =>
        s.is_active &&
        allowedBranchIds.includes(s.restaurant_id) &&
        (s.pin_code === pin || (isDemo && pin === '1234'))
    );
    if (interBranchMatch) {
      return {
        success: true,
        staff: interBranchMatch,
        isInterBranchShift: interBranchMatch.restaurant_id !== restaurantId,
        homeBranchId: interBranchMatch.restaurant_id,
      };
    }

    // 3. Verificar si el PIN existe en otra organización distinta para emitir rechazo explícito de aislamiento
    const crossOrgMatch = allStaff.find(
      (s) => s.is_active && !allowedBranchIds.includes(s.restaurant_id) && s.pin_code === pin
    );
    if (crossOrgMatch) {
      return {
        success: false,
        error: 'Acceso denegado: Este colaborador pertenece a otra organización y no tiene acceso a esta sucursal.',
      };
    }

    return {
      success: false,
      error: isDemo ? 'PIN incorrecto. En modo demo puedes usar 1234.' : 'PIN de acceso inválido.',
    };
  },

  /**
   * POL-009 (Regla 4): Entre gerentes pueden hacer movimientos de personal entre sucursales
   * de su misma organización y dejarlo asentado en la planeación de turnos (staff_shifts).
   */
  async scheduleInterBranchStaffShift(params: {
    sourceBranchId: string;
    targetBranchId: string;
    organizationId: string;
    allowedBranchIds: string[];
    shift: Omit<StaffShift, 'id' | 'created_at' | 'restaurant_id'>;
  }): Promise<{ success: boolean; data?: StaffShift; error?: string }> {
    const { sourceBranchId, targetBranchId, allowedBranchIds, shift } = params;
    if (!allowedBranchIds.includes(sourceBranchId) || !allowedBranchIds.includes(targetBranchId)) {
      return {
        success: false,
        error: 'Acceso denegado: No se permiten movimientos de personal hacia o desde sucursales de otra organización.',
      };
    }

    const isInterBranch = sourceBranchId !== targetBranchId;
    const prefixNote = isInterBranch
      ? `[Movimiento Inter-Sucursal: ${sourceBranchId} -> ${targetBranchId}]`
      : '';
    const combinedNotes = [prefixNote, shift.notes || ''].filter(Boolean).join(' ').trim() || null;

    return ordersApi.createStaffShift({
      ...shift,
      restaurant_id: targetBranchId,
      notes: combinedNotes,
    });
  },
  async createStaffMember(staff: Omit<StaffMember, 'id' | 'created_at'>): Promise<{ success: boolean; data?: StaffMember; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const isUUID =
      typeof staff.restaurant_id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(staff.restaurant_id);

    if (!isDemo && isSupabaseConfigured && isUUID) {
      try {
        const clean = sanitizeSupabasePayload(staff, true);
        const { data, error } = await supabase.from('restaurant_staff').insert([clean]).select().single();
        if (error) throw error;
        return { success: true, data: data as StaffMember };
      } catch (err: any) {
        console.error('Error insertando restaurant_staff en Supabase:', err.message);
        return { success: false, error: err.message };
      }
    }

    const current = await ordersApi.getStaffMembers(staff.restaurant_id);
    const newStaff: StaffMember = {
      ...staff,
      id: 'staff-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.STAFF_MEMBERS, [newStaff, ...current]);
    return { success: true, data: newStaff };
  },

  async updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<{ success: boolean; data?: StaffMember; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const isUUID =
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isDemo && isSupabaseConfigured && isUUID) {
      try {
        const clean = sanitizeSupabasePayload(updates, false);
        const { data, error } = await supabase
          .from('restaurant_staff')
          .update(clean)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) {
          return { success: true, data: data as StaffMember };
        }
      } catch (err: any) {
        console.error('Error actualizando restaurant_staff en Supabase:', err.message);
        return { success: false, error: err.message };
      }
    }

    const local = getLocalItem<StaffMember[]>(STORAGE_KEYS.STAFF_MEMBERS, []);
    const updated = local.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setLocalItem(STORAGE_KEYS.STAFF_MEMBERS, updated);
    return { success: true, data: updated.find((s) => s.id === id) };
  },

  async toggleStaffMemberActive(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    return ordersApi.updateStaffMember(id, { is_active: isActive });
  },

  async deleteStaffMember(id: string): Promise<{ success: boolean; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const isUUID =
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isDemo && isSupabaseConfigured && isUUID) {
      try {
        const { error } = await supabase.from('restaurant_staff').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        console.error('Error eliminando restaurant_staff de Supabase:', err.message);
        return { success: false, error: err.message };
      }
    }

    const local = getLocalItem<StaffMember[]>(STORAGE_KEYS.STAFF_MEMBERS, []);
    const updated = local.filter((s) => s.id !== id);
    setLocalItem(STORAGE_KEYS.STAFF_MEMBERS, updated);
    return { success: true };
  },

  // ==========================================
  // MÓDULO DT-12: COMANDAS COLABORATIVAS & SPLIT BILL
  // ==========================================
  async getTableSessions(restaurantId?: string): Promise<TableSession[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        let query = supabase.from('table_sessions').select('*').order('opened_at', { ascending: false });
        if (restaurantId && !restaurantId.startsWith('res-')) {
          query = query.eq('restaurant_id', restaurantId);
        }
        const { data, error } = await query;
        if (!error && data) return data as TableSession[];
      } catch (err: any) {
        console.warn('Error obteniendo table_sessions de Supabase:', err.message);
      }
    }
    const defaultSessions: TableSession[] = [
      { id: 'sess-1', restaurant_id: restaurantId || 'res-1', table_number: 1, opened_at: new Date(Date.now() - 3600000 * 2).toISOString(), closed_at: new Date(Date.now() - 3600000 * 1.3).toISOString(), status: 'closed', total_amount: 850, paid_amount: 850, participants: [] },
      { id: 'sess-2', restaurant_id: restaurantId || 'res-1', table_number: 4, opened_at: new Date(Date.now() - 3600000 * 3).toISOString(), closed_at: new Date(Date.now() - 3600000 * 2.2).toISOString(), status: 'closed', total_amount: 1450, paid_amount: 1450, participants: [] },
      { id: 'sess-3', restaurant_id: restaurantId || 'res-1', table_number: 2, opened_at: new Date(Date.now() - 86400000 * 2).toISOString(), closed_at: new Date(Date.now() - 86400000 * 2 + 3600000 * 0.8).toISOString(), status: 'closed', total_amount: 620, paid_amount: 620, participants: [] },
      { id: 'sess-4', restaurant_id: restaurantId || 'res-1', table_number: 5, opened_at: new Date(Date.now() - 86400000 * 5).toISOString(), closed_at: new Date(Date.now() - 86400000 * 5 + 3600000 * 0.7).toISOString(), status: 'closed', total_amount: 980, paid_amount: 980, participants: [] },
      { id: 'sess-5', restaurant_id: restaurantId || 'res-1', table_number: 3, opened_at: new Date(Date.now() - 86400000 * 15).toISOString(), closed_at: new Date(Date.now() - 86400000 * 15 + 3600000 * 0.75).toISOString(), status: 'closed', total_amount: 1150, paid_amount: 1150, participants: [] },
      { id: 'sess-6', restaurant_id: restaurantId || 'res-1', table_number: 7, opened_at: new Date(Date.now() - 86400000 * 35).toISOString(), closed_at: new Date(Date.now() - 86400000 * 35 + 3600000 * 0.9).toISOString(), status: 'closed', total_amount: 1300, paid_amount: 1300, participants: [] },
    ];
    const rawSessions = getLocalItem<TableSession[]>(STORAGE_KEYS.TABLE_SESSIONS, defaultSessions);
    const sessions = rawSessions.length === 0 ? defaultSessions : rawSessions;
    return restaurantId ? sessions.filter((s) => s.restaurant_id === restaurantId || s.restaurant_id === 'res-1') : sessions;
  },

  async getTableSession(restaurantId: string, tableNumber: number): Promise<TableSession | null> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('table_sessions')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('table_number', tableNumber)
          .neq('status', 'closed')
          .order('opened_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) return data as TableSession;
      } catch (err: any) {
        console.warn('Error obteniendo table_session de Supabase:', err.message);
      }
    }

    const sessions = getLocalItem<TableSession[]>(STORAGE_KEYS.TABLE_SESSIONS, []);
    return sessions.find(
      (s) => s.restaurant_id === restaurantId && s.table_number === tableNumber && s.status !== 'closed'
    ) || null;
  },

  async joinOrCreateTableSession(
    restaurantId: string,
    tableNumber: number,
    guestName: string,
    guestToken?: string
  ): Promise<TableSession> {
    const token = guestToken || 'guest-' + Date.now();
    const existing = await ordersApi.getTableSession(restaurantId, tableNumber);

    if (existing) {
      const alreadyJoined = existing.participants.some((p) => p.guest_token === token);
      if (!alreadyJoined) {
        const updatedParticipants = [
          ...existing.participants,
          { guest_token: token, guest_name: guestName, joined_at: new Date().toISOString() },
        ];
        return ordersApi.updateTableSession(existing.id, { participants: updatedParticipants });
      }
      return existing;
    }

    // Crear nueva sesión de mesa
    const newSession: TableSession = {
      id: 'sess-' + Date.now(),
      restaurant_id: restaurantId,
      table_number: tableNumber,
      status: 'open',
      participants: [
        { guest_token: token, guest_name: guestName, joined_at: new Date().toISOString() },
      ],
      total_amount: 0,
      paid_amount: 0,
      opened_at: new Date().toISOString(),
      closed_at: null,
    };

    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('table_sessions')
          .insert([sanitizeSupabasePayload(newSession)])
          .select()
          .single();

        if (!error && data) return data as TableSession;
      } catch (err: any) {
        console.warn('Error creando table_session en Supabase:', err.message);
      }
    }

    const current = getLocalItem<TableSession[]>(STORAGE_KEYS.TABLE_SESSIONS, []);
    setLocalItem(STORAGE_KEYS.TABLE_SESSIONS, [newSession, ...current]);
    return newSession;
  },

  async updateTableSession(id: string, updates: Partial<TableSession>): Promise<TableSession> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured && !id.startsWith('sess-')) {
      try {
        const { data, error } = await supabase
          .from('table_sessions')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) return data as TableSession;
      } catch (err: any) {
        console.warn('Error actualizando table_session en Supabase:', err.message);
      }
    }

    const current = getLocalItem<TableSession[]>(STORAGE_KEYS.TABLE_SESSIONS, []);
    const updated = current.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setLocalItem(STORAGE_KEYS.TABLE_SESSIONS, updated);
    return updated.find((s) => s.id === id)!;
  },

  // ==========================================
  // MÓDULO DT-13: CORTES DE CAJA Y ARQUEO Z
  // ==========================================
  async getDailyCashCloses(restaurantId: string): Promise<DailyCashClose[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('daily_cash_closes')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('shift_date', { ascending: false });

        if (!error && data) return data as DailyCashClose[];
      } catch (err: any) {
        console.warn('Error obteniendo daily_cash_closes de Supabase:', err.message);
      }
    }

    const closes = getLocalItem<DailyCashClose[]>(STORAGE_KEYS.DAILY_CASH_CLOSES, []);
    return closes.filter((c) => c.restaurant_id === restaurantId);
  },

  async submitDailyCashClose(
    closeData: Omit<DailyCashClose, 'id' | 'created_at'>
  ): Promise<{ success: boolean; data?: DailyCashClose; error?: string }> {
    const newClose: DailyCashClose = {
      ...closeData,
      id: 'close-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('daily_cash_closes')
          .insert([sanitizeSupabasePayload(newClose)])
          .select()
          .single();

        if (!error && data) return { success: true, data: data as DailyCashClose };
        if (error) throw error;
      } catch (err: any) {
        console.warn('Error guardando daily_cash_close en Supabase:', err.message);
      }
    }

    const current = getLocalItem<DailyCashClose[]>(STORAGE_KEYS.DAILY_CASH_CLOSES, []);
    setLocalItem(STORAGE_KEYS.DAILY_CASH_CLOSES, [newClose, ...current]);
    return { success: true, data: newClose };
  },

  // ==========================================
  // MÓDULO DT-17 & DT-19: PEDIDOS CORPORATIVOS
  // ==========================================
  async getCorporateOrders(restaurantId: string): Promise<CorporateOrder[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('corporate_orders')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false });

        if (!error && data) return data as CorporateOrder[];
      } catch (err: any) {
        console.warn('Error obteniendo corporate_orders de Supabase:', err.message);
      }
    }

    const orders = getLocalItem<CorporateOrder[]>(STORAGE_KEYS.CORPORATE_ORDERS, []);
    return orders.filter((o) => o.restaurant_id === restaurantId);
  },

  async createCorporateOrder(
    orderData: Omit<CorporateOrder, 'id' | 'created_at'>
  ): Promise<{ success: boolean; data?: CorporateOrder; error?: string }> {
    const newOrder: CorporateOrder = {
      ...orderData,
      id: 'corp-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('corporate_orders')
          .insert([sanitizeSupabasePayload(newOrder)])
          .select()
          .single();

        if (!error && data) return { success: true, data: data as CorporateOrder };
        if (error) throw error;
      } catch (err: any) {
        console.warn('Error guardando corporate_order en Supabase:', err.message);
      }
    }

    const current = getLocalItem<CorporateOrder[]>(STORAGE_KEYS.CORPORATE_ORDERS, []);
    setLocalItem(STORAGE_KEYS.CORPORATE_ORDERS, [newOrder, ...current]);
    return { success: true, data: newOrder };
  },

  // ==========================================
  // MÓDULO HOSTESS: MESAS POR SUCURSAL Y SOLICITUD DE LIMPIEZA
  // ==========================================
  async getRestaurantTables(restaurantId?: string): Promise<RestaurantTable[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        let query = supabase.from('restaurant_tables').select('*').order('table_number', { ascending: true });
        if (restaurantId && restaurantId !== 'res-1') {
          query = query.eq('restaurant_id', restaurantId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as RestaurantTable[];
        }
      } catch (err: any) {
        console.warn('Error obteniendo restaurant_tables de Supabase, usando respaldo local:', err.message);
      }
    }

    const nowIso = new Date().toISOString();
    const targetResId = restaurantId || 'res-1';
    const defaultTables: RestaurantTable[] = [
      {
        id: 'tbl-1',
        restaurant_id: targetResId,
        table_number: 'Mesa 1',
        capacity: 4,
        current_guests: 2,
        status: 'ocupada',
        assigned_waiter_name: 'Marco Antonio (Mesero)',
        notes: 'Ventana principal',
        updated_at: nowIso,
        created_at: nowIso,
      },
      {
        id: 'tbl-2',
        restaurant_id: targetResId,
        table_number: 'Mesa 2',
        capacity: 2,
        current_guests: 2,
        status: 'ocupada',
        assigned_waiter_name: 'Marco Antonio (Mesero)',
        notes: 'Pareja terraza',
        updated_at: nowIso,
        created_at: nowIso,
      },
      {
        id: 'tbl-3',
        restaurant_id: targetResId,
        table_number: 'Mesa 3',
        capacity: 4,
        current_guests: 0,
        status: 'libre',
        assigned_waiter_name: 'Marco Antonio (Mesero)',
        notes: 'Pasillo central',
        updated_at: nowIso,
        created_at: nowIso,
      },
      {
        id: 'tbl-4',
        restaurant_id: targetResId,
        table_number: 'Mesa 4',
        capacity: 6,
        current_guests: 4,
        status: 'ocupada',
        assigned_waiter_name: 'Marco Antonio (Mesero)',
        notes: 'Grupo familiar',
        updated_at: nowIso,
        created_at: nowIso,
      },
      {
        id: 'tbl-5',
        restaurant_id: targetResId,
        table_number: 'Mesa 5',
        capacity: 4,
        current_guests: 0,
        status: 'en_limpieza',
        assigned_waiter_name: 'Marco Antonio (Mesero)',
        notes: 'Recién desocupada',
        updated_at: nowIso,
        created_at: nowIso,
      },
      {
        id: 'tbl-6',
        restaurant_id: targetResId,
        table_number: 'Mesa 6',
        capacity: 8,
        current_guests: 0,
        status: 'libre',
        assigned_waiter_name: 'Sofía Valdés (Capitana de Piso)',
        notes: 'Mesa privada / VIP',
        updated_at: nowIso,
        created_at: nowIso,
      },
    ];

    const current = getLocalItem<RestaurantTable[]>(STORAGE_KEYS.RESTAURANT_TABLES, defaultTables);
    if (!restaurantId) return current;
    const filtered = current.filter((t) => t.restaurant_id === restaurantId || t.restaurant_id === 'res-1');
    return filtered.length > 0 ? filtered : defaultTables;
  },

  async saveRestaurantTable(
    table: Partial<RestaurantTable>
  ): Promise<{ success: boolean; data?: RestaurantTable; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const nowIso = new Date().toISOString();

    if (!isDemo && isSupabaseConfigured) {
      try {
        if (table.id && !table.id.startsWith('tbl-')) {
          const payload = sanitizeSupabasePayload({ ...table, updated_at: nowIso }, false);
          const { data, error } = await supabase
            .from('restaurant_tables')
            .update(payload)
            .eq('id', table.id)
            .select()
            .single();
          if (!error && data) return { success: true, data: data as RestaurantTable };
        } else {
          const insertPayload = sanitizeSupabasePayload(
            {
              restaurant_id: table.restaurant_id || 'res-1',
              table_number: table.table_number || 'Mesa Nueva',
              capacity: Number(table.capacity) || 4,
              current_guests: Number(table.current_guests) || 0,
              status: table.status || 'libre',
              assigned_waiter_name: table.assigned_waiter_name || null,
              notes: table.notes || null,
            },
            true
          );
          const { data, error } = await supabase
            .from('restaurant_tables')
            .insert([insertPayload])
            .select()
            .single();
          if (!error && data) return { success: true, data: data as RestaurantTable };
        }
      } catch (err: any) {
        console.warn('Error guardando restaurant_table en Supabase, usando respaldo local:', err.message);
      }
    }

    const current = await ordersApi.getRestaurantTables();
    if (table.id) {
      const updated = current.map((t) =>
        t.id === table.id ? ({ ...t, ...table, updated_at: nowIso } as RestaurantTable) : t
      );
      setLocalItem(STORAGE_KEYS.RESTAURANT_TABLES, updated);
      return { success: true, data: updated.find((t) => t.id === table.id) };
    }

    const created: RestaurantTable = {
      id: 'tbl-' + Date.now(),
      restaurant_id: table.restaurant_id || 'res-1',
      table_number: table.table_number || `Mesa ${current.length + 1}`,
      capacity: Number(table.capacity) || 4,
      current_guests: Number(table.current_guests) || 0,
      status: table.status || 'libre',
      assigned_waiter_name: table.assigned_waiter_name || null,
      notes: table.notes || null,
      updated_at: nowIso,
      created_at: nowIso,
    };
    setLocalItem(STORAGE_KEYS.RESTAURANT_TABLES, [...current, created]);
    return { success: true, data: created };
  },

  async updateRestaurantTableStatus(
    tableId: string,
    status: RestaurantTableStatus,
    currentGuests?: number,
    assignedWaiterName?: string
  ): Promise<{ success: boolean; data?: RestaurantTable; error?: string }> {
    const updates: Partial<RestaurantTable> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (currentGuests !== undefined) {
      updates.current_guests = currentGuests;
    } else if (status === 'libre' || status === 'en_limpieza' || status === 'desactivada') {
      updates.current_guests = 0;
    }
    if (assignedWaiterName !== undefined) {
      updates.assigned_waiter_name = assignedWaiterName;
    }
    return ordersApi.saveRestaurantTable({ id: tableId, ...updates });
  },

  async deleteRestaurantTable(tableId: string): Promise<{ success: boolean; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured && !tableId.startsWith('tbl-')) {
      try {
        const { error } = await supabase.from('restaurant_tables').delete().eq('id', tableId);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        console.warn('Error eliminando restaurant_table en Supabase:', err.message);
      }
    }

    const current = await ordersApi.getRestaurantTables();
    const updated = current.filter((t) => t.id !== tableId);
    setLocalItem(STORAGE_KEYS.RESTAURANT_TABLES, updated);
    return { success: true };
  },

  async requestTableCleaning(
    restaurantId: string,
    table: RestaurantTable
  ): Promise<{ success: boolean; table?: RestaurantTable; call?: TableCall }> {
    const tableRes = await ordersApi.updateRestaurantTableStatus(table.id, 'en_limpieza', 0);

    // Verificar si ya existe una solicitud de limpieza activa para esta mesa para no duplicar alertas
    const existingCalls = await ordersApi.getTableCalls(restaurantId);
    const activeCleaningCall = existingCalls.find(
      (c) =>
        c.status === 'active' &&
        c.call_type === 'cleaning' &&
        c.table_number.trim().toLowerCase() === table.table_number.trim().toLowerCase()
    );

    if (activeCleaningCall) {
      return { success: true, table: tableRes.data, call: activeCleaningCall };
    }

    const callRes = await ordersApi.createTableCall({
      restaurant_id: restaurantId,
      tag_code: `HOSTESS-${table.table_number.replace(/\s+/g, '-').toUpperCase()}`,
      table_number: table.table_number,
      call_type: 'cleaning',
      status: 'active',
    });

    return {
      success: true,
      table: tableRes.data,
      call: callRes.data,
    };
  },

  // ==========================================
  // MÓDULO FASE C: GERENTE DE TIENDA — TURNOS (HASTA 2 MESES), CUPONES CON LÍMITE MENSUAL Y CORTES DE TURNO
  // ==========================================
  async getStaffShifts(restaurantId?: string): Promise<StaffShift[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        let query = supabase.from('staff_shifts').select('*').order('shift_date', { ascending: true });
        if (restaurantId && !restaurantId.startsWith('res-')) {
          query = query.eq('restaurant_id', restaurantId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as StaffShift[];
        }
      } catch (e) {
        console.warn('Error obteniendo staff_shifts de Supabase:', e);
      }
    }

    const todayDate = new Date();
    const dayAgoStr = (days: number) => {
      const d = new Date(todayDate.getTime() - days * 86400000);
      return d.toISOString().slice(0, 10);
    };
    const todayStr = dayAgoStr(0);
    // tomorrowStr reserved
    const targetResId = restaurantId || 'res-1';

    const defaultShifts: StaffShift[] = [
      { id: 'shift-1', restaurant_id: targetResId, staff_id: 'staff-1', staff_name: 'Marco Antonio (Mesero)', staff_role: 'waiter', shift_date: todayStr, shift_type: 'matutino', start_time: '08:00', end_time: '16:00', assigned_station: 'all', assigned_tables: ['Mesa 1', 'Mesa 2', 'Mesa 3'], notes: 'Salón principal', created_by_manager: 'Lic. Mauricio Salinas', created_at: new Date().toISOString() },
      { id: 'shift-2', restaurant_id: targetResId, staff_id: 'staff-2', staff_name: 'Chef Roberto (Jefe de Cocina)', staff_role: 'kitchen', shift_date: todayStr, shift_type: 'completo', start_time: '09:00', end_time: '18:00', assigned_station: 'cocina', assigned_tables: [], notes: 'Estación Cocina Caliente KDS', created_by_manager: 'Lic. Mauricio Salinas', created_at: new Date().toISOString() },
      { id: 'shift-3', restaurant_id: targetResId, staff_id: 'staff-3', staff_name: 'Sarah Mendoza (Mesero)', staff_role: 'waiter', shift_date: dayAgoStr(1), shift_type: 'vespertino', start_time: '15:00', end_time: '23:00', assigned_station: 'all', assigned_tables: ['Mesa 4', 'Mesa 5'], created_by_manager: 'Lic. Mauricio Salinas', created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
      { id: 'shift-4', restaurant_id: targetResId, staff_id: 'staff-1', staff_name: 'Marco Antonio (Mesero)', staff_role: 'waiter', shift_date: dayAgoStr(3), shift_type: 'matutino', start_time: '08:00', end_time: '16:00', assigned_station: 'all', assigned_tables: ['Mesa 1', 'Mesa 2'], created_by_manager: 'Lic. Mauricio Salinas', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: 'shift-5', restaurant_id: targetResId, staff_id: 'staff-3', staff_name: 'Sarah Mendoza (Mesero)', staff_role: 'waiter', shift_date: dayAgoStr(5), shift_type: 'matutino', start_time: '08:00', end_time: '16:00', assigned_station: 'all', assigned_tables: ['Mesa 3', 'Mesa 4'], created_by_manager: 'Lic. Mauricio Salinas', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: 'shift-6', restaurant_id: targetResId, staff_id: 'staff-1', staff_name: 'Marco Antonio (Mesero)', staff_role: 'waiter', shift_date: dayAgoStr(10), shift_type: 'vespertino', start_time: '15:00', end_time: '23:00', assigned_station: 'all', assigned_tables: ['Mesa 1', 'Mesa 2'], created_by_manager: 'Lic. Mauricio Salinas', created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
      { id: 'shift-7', restaurant_id: targetResId, staff_id: 'staff-3', staff_name: 'Sarah Mendoza (Mesero)', staff_role: 'waiter', shift_date: dayAgoStr(15), shift_type: 'vespertino', start_time: '15:00', end_time: '23:00', assigned_station: 'all', assigned_tables: ['Mesa 4', 'Mesa 5'], created_by_manager: 'Lic. Mauricio Salinas', created_at: new Date(Date.now() - 86400000 * 15).toISOString() },
      { id: 'shift-8', restaurant_id: targetResId, staff_id: 'staff-1', staff_name: 'Marco Antonio (Mesero)', staff_role: 'waiter', shift_date: dayAgoStr(22), shift_type: 'matutino', start_time: '08:00', end_time: '16:00', assigned_station: 'all', assigned_tables: ['Mesa 1', 'Mesa 2'], created_by_manager: 'Lic. Mauricio Salinas', created_at: new Date(Date.now() - 86400000 * 22).toISOString() },
      { id: 'shift-9', restaurant_id: targetResId, staff_id: 'staff-3', staff_name: 'Sarah Mendoza (Mesero)', staff_role: 'waiter', shift_date: dayAgoStr(28), shift_type: 'vespertino', start_time: '15:00', end_time: '23:00', assigned_station: 'all', assigned_tables: ['Mesa 3', 'Mesa 4'], created_by_manager: 'Lic. Mauricio Salinas', created_at: new Date(Date.now() - 86400000 * 28).toISOString() },
      { id: 'shift-10', restaurant_id: targetResId, staff_id: 'staff-1', staff_name: 'Marco Antonio (Mesero)', staff_role: 'waiter', shift_date: dayAgoStr(38), shift_type: 'vespertino', start_time: '15:00', end_time: '23:00', assigned_station: 'all', assigned_tables: ['Mesa 1', 'Mesa 2'], created_by_manager: 'Lic. Mauricio Salinas', created_at: new Date(Date.now() - 86400000 * 38).toISOString() },
      { id: 'shift-11', restaurant_id: targetResId, staff_id: 'staff-3', staff_name: 'Sarah Mendoza (Mesero)', staff_role: 'waiter', shift_date: dayAgoStr(45), shift_type: 'matutino', start_time: '08:00', end_time: '16:00', assigned_station: 'all', assigned_tables: ['Mesa 4', 'Mesa 5'], created_by_manager: 'Lic. Mauricio Salinas', created_at: new Date(Date.now() - 86400000 * 45).toISOString() },
    ];

    const rawShifts = getLocalItem<StaffShift[]>(STORAGE_KEYS.STAFF_SHIFTS, defaultShifts);
    const list = rawShifts.length <= 4 ? defaultShifts : rawShifts;
    if (!restaurantId) return list;
    return list.filter((s) => s.restaurant_id === restaurantId || s.restaurant_id === 'res-1');
  },

  async createStaffShift(
    shift: Omit<StaffShift, 'id' | 'created_at'>
  ): Promise<{ success: boolean; data?: StaffShift; error?: string }> {
    // Validar que la fecha del turno no exceda los 62 días (2 meses de anticipación)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(`${shift.shift_date}T00:00:00`);
    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 62) {
      return {
        success: false,
        error: 'Los turnos solo pueden programarse con un máximo de 2 meses (60 días) de anticipación.',
      };
    }

    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const resId = shift.restaurant_id || 'res-1';
    if (!isDemo && isSupabaseConfigured && !resId.startsWith('res-')) {
      try {
        const clean = sanitizeSupabasePayload(shift, true);
        const { data, error } = await supabase
          .from('staff_shifts')
          .insert([clean])
          .select()
          .single();
        if (!error && data) return { success: true, data: data as StaffShift };
      } catch (err: any) {
        console.warn('Error insertando staff_shift en Supabase, usando respaldo local:', err.message);
      }
    }

    const current = await ordersApi.getStaffShifts();
    const created: StaffShift = {
      ...shift,
      id: 'shift-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.STAFF_SHIFTS, [...current, created]);
    return { success: true, data: created };
  },

  async deleteStaffShift(shiftId: string): Promise<{ success: boolean }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured && !shiftId.startsWith('shift-')) {
      try {
        await supabase.from('staff_shifts').delete().eq('id', shiftId);
      } catch (e) {
        console.warn('Error eliminando staff_shift en Supabase:', e);
      }
    }
    const current = await ordersApi.getStaffShifts();
    setLocalItem(
      STORAGE_KEYS.STAFF_SHIFTS,
      current.filter((s) => s.id !== shiftId)
    );
    return { success: true };
  },

  async getManagerRetentionCoupons(restaurantId?: string): Promise<ManagerRetentionCoupon[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        let query = supabase
          .from('manager_retention_coupons')
          .select('*')
          .order('created_at', { ascending: false });
        if (restaurantId && !restaurantId.startsWith('res-')) {
          query = query.eq('restaurant_id', restaurantId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as ManagerRetentionCoupon[];
        }
      } catch (e) {
        console.warn('Error obteniendo manager_retention_coupons de Supabase:', e);
      }
    }

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const targetResId = restaurantId || 'res-1';
    const defaultCoupons: ManagerRetentionCoupon[] = [
      {
        id: 'mcoup-1',
        restaurant_id: targetResId,
        manager_name: 'Lic. Mauricio Salinas',
        coupon_code: 'GERENCIA-20',
        title: 'Descuento de Cortesía por Servicio (20% OFF)',
        discount_description: '20% de descuento en cuenta actual o próxima visita',
        discount_percentage: 20,
        monthly_limit: 15,
        used_this_month: 3,
        month_key: currentMonthKey,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'mcoup-2',
        restaurant_id: targetResId,
        manager_name: 'Lic. Mauricio Salinas',
        coupon_code: 'POSTRE-VIP',
        title: 'Postre o Coctel de Cortesía en Próxima Visita',
        discount_description: '1 Postre o Coctel sin costo autorizado por Gerencia',
        discount_percentage: 100,
        monthly_limit: 25,
        used_this_month: 5,
        month_key: currentMonthKey,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    const list = getLocalItem<ManagerRetentionCoupon[]>(
      STORAGE_KEYS.MANAGER_RETENTION_COUPONS,
      defaultCoupons
    );
    if (!restaurantId) return list;
    return list.filter((c) => c.restaurant_id === restaurantId || c.restaurant_id === 'res-1');
  },

  async createManagerRetentionCoupon(
    coupon: Omit<ManagerRetentionCoupon, 'id' | 'created_at' | 'used_this_month' | 'month_key'>
  ): Promise<{ success: boolean; data?: ManagerRetentionCoupon; error?: string }> {
    const monthKey = new Date().toISOString().slice(0, 7);
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const resId = coupon.restaurant_id || 'res-1';

    if (!isDemo && isSupabaseConfigured && !resId.startsWith('res-')) {
      try {
        const clean = sanitizeSupabasePayload(
          {
            ...coupon,
            used_this_month: 0,
            month_key: monthKey,
          },
          true
        );
        const { data, error } = await supabase
          .from('manager_retention_coupons')
          .insert([clean])
          .select()
          .single();
        if (!error && data) return { success: true, data: data as ManagerRetentionCoupon };
      } catch (err: any) {
        console.warn('Error insertando manager_retention_coupon en Supabase:', err.message);
      }
    }

    const current = await ordersApi.getManagerRetentionCoupons();
    const created: ManagerRetentionCoupon = {
      ...coupon,
      id: 'mcoup-' + Date.now(),
      used_this_month: 0,
      month_key: monthKey,
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.MANAGER_RETENTION_COUPONS, [created, ...current]);
    return { success: true, data: created };
  },

  async updateManagerRetentionCoupon(
    couponId: string,
    updates: Partial<ManagerRetentionCoupon>
  ): Promise<{ success: boolean; data?: ManagerRetentionCoupon }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured && !couponId.startsWith('mcoup-')) {
      try {
        await supabase
          .from('manager_retention_coupons')
          .update(sanitizeSupabasePayload(updates, false))
          .eq('id', couponId);
      } catch (e) {
        console.warn('Error actualizando manager_retention_coupon en Supabase:', e);
      }
    }
    const current = await ordersApi.getManagerRetentionCoupons();
    const updated = current.map((c) => (c.id === couponId ? { ...c, ...updates } : c));
    setLocalItem(STORAGE_KEYS.MANAGER_RETENTION_COUPONS, updated);
    return { success: true, data: updated.find((c) => c.id === couponId) };
  },

  async deleteManagerRetentionCoupon(couponId: string): Promise<{ success: boolean; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured && !couponId.startsWith('mcoup-')) {
      try {
        await supabase
          .from('manager_retention_coupons')
          .delete()
          .eq('id', couponId);
      } catch (e: any) {
        console.warn('Error eliminando manager_retention_coupon en Supabase:', e.message);
      }
    }
    const current = await ordersApi.getManagerRetentionCoupons();
    const updated = current.filter((c) => c.id !== couponId);
    setLocalItem(STORAGE_KEYS.MANAGER_RETENTION_COUPONS, updated);
    return { success: true };
  },

  async authorizeComplaintDiscountOrCoupon(params: {
    feedbackId: string;
    restaurantId: string;
    couponId?: string;
    customDiscountText?: string;
    managerName: string;
  }): Promise<{ success: boolean; error?: string; coupon?: ManagerRetentionCoupon }> {
    const allCoupons = await ordersApi.getManagerRetentionCoupons(params.restaurantId);
    let selectedCoupon: ManagerRetentionCoupon | undefined;

    if (params.couponId) {
      selectedCoupon = allCoupons.find((c) => c.id === params.couponId);
      if (!selectedCoupon) {
        return { success: false, error: 'El cupón seleccionado no existe.' };
      }
      if (selectedCoupon.used_this_month >= selectedCoupon.monthly_limit) {
        return {
          success: false,
          error: `Se alcanzó el límite mensual (${selectedCoupon.monthly_limit}) para el cupón ${selectedCoupon.coupon_code}.`,
        };
      }

      const nextUsed = selectedCoupon.used_this_month + 1;
      selectedCoupon = { ...selectedCoupon, used_this_month: nextUsed };

      const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
      if (!isDemo && isSupabaseConfigured && !selectedCoupon.id.startsWith('mcoup-')) {
        try {
          await supabase
            .from('manager_retention_coupons')
            .update({ used_this_month: nextUsed })
            .eq('id', selectedCoupon.id);
        } catch (e) {
          console.warn('Error actualizando contador de cupón en Supabase:', e);
        }
      }

      const fullList = await ordersApi.getManagerRetentionCoupons();
      const updatedCoupons = fullList.map((c) =>
        c.id === selectedCoupon!.id ? selectedCoupon! : c
      );
      setLocalItem(STORAGE_KEYS.MANAGER_RETENTION_COUPONS, updatedCoupons);
    }

    const authorizationSummary = selectedCoupon
      ? `Autorizado por Gerente (${params.managerName}): Cupón ${selectedCoupon.coupon_code} - ${selectedCoupon.discount_description}`
      : `Autorizado por Gerente (${params.managerName}): ${params.customDiscountText || 'Descuento directo en cuenta'}`;

    // Actualizar estado de la queja a resuelta con nota de autorización del gerente
    const feedbacks = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, []);
    const updatedFeedbacks = feedbacks.map((f) =>
      f.id === params.feedbackId
        ? {
            ...f,
            status: 'resolved' as const,
            internal_notes: authorizationSummary,
          }
        : f
    );
    setLocalItem(STORAGE_KEYS.FEEDBACK, updatedFeedbacks);

    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured && !params.feedbackId.startsWith('fb-')) {
      try {
        await supabase
          .from('feedbacks')
          .update({ status: 'resolved', internal_notes: authorizationSummary })
          .eq('id', params.feedbackId);
      } catch (e) {
        console.warn('Error actualizando feedback en Supabase:', e);
      }
    }

    return { success: true, coupon: selectedCoupon };
  },

  async getManagerShiftReports(
    restaurantId?: string,
    organizationId?: string
  ): Promise<ManagerShiftReport[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        let query = supabase
          .from('manager_shift_reports')
          .select('*')
          .order('created_at', { ascending: false });
        if (restaurantId && !restaurantId.startsWith('res-')) {
          query = query.eq('restaurant_id', restaurantId);
        } else if (organizationId && !organizationId.startsWith('org-')) {
          query = query.eq('organization_id', organizationId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as ManagerShiftReport[];
        }
      } catch (e) {
        console.warn('Error obteniendo manager_shift_reports de Supabase:', e);
      }
    }

    const todayDate = new Date();
    const dayAgoStr = (days: number) => {
      const d = new Date(todayDate.getTime() - days * 86400000);
      return d.toISOString().slice(0, 10);
    };
    const todayStr = dayAgoStr(0);

    const defaultReports: ManagerShiftReport[] = [
      {
        id: 'mrep-1',
        organization_id: organizationId || 'org-1',
        restaurant_id: restaurantId || 'res-1',
        branch_name: 'Sucursal Principal',
        manager_name: 'Lic. Mauricio Salinas',
        waiter_name: 'Marco Antonio (Mesero)',
        shift_type: 'matutino',
        shift_date: todayStr,
        tables_served: 14,
        total_sales: 8450,
        cash_sales: 2950,
        card_sales: 5500,
        tips_collected: 1180,
        discounts_authorized: 190,
        table_metrics: [
          { table_number: 'Mesa 1', orders_count: 4, total_amount: 2450, average_ticket: 612 },
          { table_number: 'Mesa 2', orders_count: 3, total_amount: 1850, average_ticket: 616 },
          { table_number: 'Mesa 4', orders_count: 7, total_amount: 4150, average_ticket: 592 },
        ],
        employee_metrics: [
          { staff_name: 'Marco Antonio (Mesero)', role: 'waiter', tables_served: 14, sales_generated: 8450, tips_estimated: 1180, calls_attended: 19 },
          { staff_name: 'Chef Roberto (Jefe de Cocina)', role: 'kitchen', tables_served: 14, sales_generated: 5900, tips_estimated: 0, calls_attended: 14 },
          { staff_name: 'Diego Herrera (Barista & Barra)', role: 'barista', tables_served: 11, sales_generated: 2550, tips_estimated: 0, calls_attended: 11 },
        ],
        sent_to_owner: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'mrep-2',
        organization_id: organizationId || 'org-1',
        restaurant_id: restaurantId || 'res-1',
        branch_name: 'Sucursal Principal',
        manager_name: 'Lic. Mauricio Salinas',
        waiter_name: 'Sarah Mendoza (Mesero)',
        shift_type: 'vespertino',
        shift_date: dayAgoStr(1),
        tables_served: 20,
        total_sales: 12600,
        cash_sales: 3800,
        card_sales: 8800,
        tips_collected: 1750,
        discounts_authorized: 250,
        sent_to_owner: true,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      
        table_metrics: [],
        employee_metrics: [],},
      {
        id: 'mrep-3',
        organization_id: organizationId || 'org-1',
        restaurant_id: restaurantId || 'res-1',
        branch_name: 'Sucursal Principal',
        manager_name: 'Carlos Montes (Cajero)',
        shift_type: 'matutino',
        shift_date: dayAgoStr(3),
        tables_served: 24,
        total_sales: 15400,
        cash_sales: 4200,
        card_sales: 11200,
        tips_collected: 2150,
        discounts_authorized: 320,
        sent_to_owner: true,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      
        waiter_name: 'Carlos Montes (Cajero)',
        table_metrics: [],
        employee_metrics: [],},
      {
        id: 'mrep-4',
        organization_id: organizationId || 'org-1',
        restaurant_id: restaurantId || 'res-1',
        branch_name: 'Sucursal Principal',
        manager_name: 'Lic. Mauricio Salinas',
        waiter_name: 'Marco Antonio (Mesero)',
        shift_type: 'matutino',
        shift_date: dayAgoStr(5),
        tables_served: 18,
        total_sales: 11800,
        cash_sales: 3600,
        card_sales: 8200,
        tips_collected: 1650,
        discounts_authorized: 180,
        sent_to_owner: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      
        table_metrics: [],
        employee_metrics: [],},
      {
        id: 'mrep-5',
        organization_id: organizationId || 'org-1',
        restaurant_id: restaurantId || 'res-1',
        branch_name: 'Sucursal Principal',
        manager_name: 'Sarah Mendoza (Mesero)',
        shift_type: 'vespertino',
        shift_date: dayAgoStr(10),
        tables_served: 22,
        total_sales: 14200,
        cash_sales: 4300,
        card_sales: 9900,
        tips_collected: 1980,
        discounts_authorized: 220,
        sent_to_owner: true,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      
        waiter_name: 'Sarah Mendoza (Mesero)',
        table_metrics: [],
        employee_metrics: [],},
      {
        id: 'mrep-6',
        organization_id: organizationId || 'org-1',
        restaurant_id: restaurantId || 'res-1',
        branch_name: 'Sucursal Principal',
        manager_name: 'Lic. Mauricio Salinas',
        waiter_name: 'Marco Antonio (Mesero)',
        shift_type: 'vespertino',
        shift_date: dayAgoStr(15),
        tables_served: 26,
        total_sales: 16900,
        cash_sales: 4900,
        card_sales: 12000,
        tips_collected: 2360,
        discounts_authorized: 280,
        sent_to_owner: true,
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      
        table_metrics: [],
        employee_metrics: [],},
      {
        id: 'mrep-7',
        organization_id: organizationId || 'org-1',
        restaurant_id: restaurantId || 'res-1',
        branch_name: 'Sucursal Principal',
        manager_name: 'Carlos Montes (Cajero)',
        shift_type: 'matutino',
        shift_date: dayAgoStr(22),
        tables_served: 21,
        total_sales: 13500,
        cash_sales: 4100,
        card_sales: 9400,
        tips_collected: 1890,
        discounts_authorized: 210,
        sent_to_owner: true,
        created_at: new Date(Date.now() - 86400000 * 22).toISOString(),
      
        waiter_name: 'Carlos Montes (Cajero)',
        table_metrics: [],
        employee_metrics: [],},
      {
        id: 'mrep-8',
        organization_id: organizationId || 'org-1',
        restaurant_id: restaurantId || 'res-1',
        branch_name: 'Sucursal Principal',
        manager_name: 'Lic. Mauricio Salinas',
        waiter_name: 'Sarah Mendoza (Mesero)',
        shift_type: 'vespertino',
        shift_date: dayAgoStr(28),
        tables_served: 28,
        total_sales: 17800,
        cash_sales: 5300,
        card_sales: 12500,
        tips_collected: 2490,
        discounts_authorized: 340,
        sent_to_owner: true,
        created_at: new Date(Date.now() - 86400000 * 28).toISOString(),
      
        table_metrics: [],
        employee_metrics: [],},
      {
        id: 'mrep-9',
        organization_id: organizationId || 'org-1',
        restaurant_id: restaurantId || 'res-1',
        branch_name: 'Sucursal Principal',
        manager_name: 'Lic. Mauricio Salinas',
        waiter_name: 'Marco Antonio (Mesero)',
        shift_type: 'vespertino',
        shift_date: dayAgoStr(38),
        tables_served: 30,
        total_sales: 19200,
        cash_sales: 5700,
        card_sales: 13500,
        tips_collected: 2680,
        discounts_authorized: 380,
        sent_to_owner: true,
        created_at: new Date(Date.now() - 86400000 * 38).toISOString(),
      
        table_metrics: [],
        employee_metrics: [],},
      {
        id: 'mrep-10',
        organization_id: organizationId || 'org-1',
        restaurant_id: restaurantId || 'res-1',
        branch_name: 'Sucursal Principal',
        manager_name: 'Carlos Montes (Cajero)',
        shift_type: 'matutino',
        shift_date: dayAgoStr(45),
        tables_served: 29,
        total_sales: 18500,
        cash_sales: 5500,
        card_sales: 13000,
        tips_collected: 2590,
        discounts_authorized: 310,
        sent_to_owner: true,
        created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
      
        waiter_name: 'Carlos Montes (Cajero)',
        table_metrics: [],
        employee_metrics: [],},
    ];

    const rawList = getLocalItem<ManagerShiftReport[]>(
      STORAGE_KEYS.MANAGER_SHIFT_REPORTS,
      defaultReports
    );
    const list = rawList.length <= 1 ? defaultReports : rawList;
    if (restaurantId) {
      return list.filter((r) => r.restaurant_id === restaurantId || r.restaurant_id === 'res-1');
    }
    return list;
  },

  async createManagerShiftReport(
    report: Omit<ManagerShiftReport, 'id' | 'created_at'>
  ): Promise<{ success: boolean; data?: ManagerShiftReport; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const resId = report.restaurant_id || 'res-1';

    if (!isDemo && isSupabaseConfigured && !resId.startsWith('res-')) {
      try {
        const clean = sanitizeSupabasePayload(report, true);
        const { data, error } = await supabase
          .from('manager_shift_reports')
          .insert([clean])
          .select()
          .single();
        if (!error && data) return { success: true, data: data as ManagerShiftReport };
      } catch (err: any) {
        console.warn('Error insertando manager_shift_report en Supabase:', err.message);
      }
    }

    const current = await ordersApi.getManagerShiftReports();
    const created: ManagerShiftReport = {
      ...report,
      id: 'mrep-' + Date.now(),
      sent_to_owner: true,
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.MANAGER_SHIFT_REPORTS, [created, ...current]);
    return { success: true, data: created };
  },
};
