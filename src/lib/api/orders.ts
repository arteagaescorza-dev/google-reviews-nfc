import { supabase, isSupabaseConfigured } from '../supabase';
import type { MenuItem, TableOrder, TableOrderStatus, TableCall, StaffMember } from '../../types';
import { STORAGE_KEYS, getLocalItem, setLocalItem } from './core';

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
    ];

    const current = getLocalItem<TableOrder[]>(STORAGE_KEYS.TABLE_ORDERS, defaultOrders);
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
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('table_calls').select('*').order('created_at', { ascending: false });
        if (restaurantId && restaurantId !== 'res-1') {
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
    if (isSupabaseConfigured) {
      try {
        const payload = {
          restaurant_id: call.restaurant_id || 'res-1',
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
        if (!error && data) return { success: true, data: data as TableCall };
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
    return { success: true, data: updated.find((c) => c.id === callId) };
  },

async getStaffMembers(restaurantId?: string): Promise<StaffMember[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('restaurant_staff').select('*');
        if (restaurantId && restaurantId !== 'res-1') {
          query = query.eq('restaurant_id', restaurantId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as StaffMember[];
        }
      } catch (err) {
        console.warn('Fallo al obtener restaurant_staff de Supabase, usando respaldo local:', err);
      }
    }

    const defaultStaff: StaffMember[] = [
      {
        id: 'staff-1',
        restaurant_id: restaurantId || 'res-1',
        name: 'Marco Antonio (Mesero)',
        role: 'waiter',
        pin_code: '1234',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'staff-2',
        restaurant_id: restaurantId || 'res-1',
        name: 'Chef Roberto (Jefe Cocina)',
        role: 'kitchen',
        pin_code: '4321',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'staff-3',
        restaurant_id: restaurantId || 'res-1',
        name: 'Sofía Valdés (Capitana Sala)',
        role: 'manager',
        pin_code: '9999',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    return getLocalItem<StaffMember[]>(STORAGE_KEYS.STAFF_MEMBERS, defaultStaff);
  },

async loginStaffWithPin(restaurantId: string, pin: string): Promise<{ success: boolean; staff?: StaffMember; error?: string }> {
    const staffList = await ordersApi.getStaffMembers(restaurantId);
    const isDemo = !isSupabaseConfigured || (typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true');
    const matched = staffList.find((s) => s.is_active && (s.pin_code === pin || (isDemo && pin === '1234')));
    if (matched) {
      return { success: true, staff: matched };
    }
    return {
      success: false,
      error: isDemo ? 'PIN incorrecto. En modo demo puedes usar 1234.' : 'PIN de acceso inválido.',
    };
  }
};
