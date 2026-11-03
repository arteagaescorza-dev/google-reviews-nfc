import { supabase, isSupabaseConfigured } from '../supabase';
import type {
  Organization,
  OrganizationMember,
  MemberRole,
  Restaurant,
  BusinessVertical,
  OrganizationBrand,
  OrganizationManager,
  StoreManagerRole,
} from '../../types';
import { STORAGE_KEYS, INITIAL_DEMO_DATA, getLocalItem, setLocalItem, sanitizeSupabasePayload } from './core';

export const organizationsApi = {
async getOrganizations(): Promise<Organization[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Error cargando organizaciones de Supabase:', e);
      }
    }
    return getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_DEMO_DATA.organizations);
  },

/**
   * Da de alta una nueva organización en Visita 1 (Alta Express en Calle en 30s)
   */
  async createOrganization(org: Omit<Organization, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Organization; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const clean = sanitizeSupabasePayload(org, true);
        const { data, error } = await supabase.from('organizations').insert([clean]).select().single();
        if (error) throw error;
        return { success: true, data };
      } catch (err: any) {
        console.warn('Error insertando en Supabase, aplicando fallback local:', err.message);
      }
    }

    const orgs = getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_DEMO_DATA.organizations);
    const newOrg: Organization = {
      ...org,
      id: 'org-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.ORGANIZATIONS, [newOrg, ...orgs]);
    return { success: true, data: newOrg };
  },

async updateOrganization(id: string, updates: Partial<Organization>): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const clean = sanitizeSupabasePayload(updates, false);
        const { error } = await supabase.from('organizations').update(clean).eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const orgs = getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_DEMO_DATA.organizations);
    const updated = orgs.map((o) => (o.id === id ? { ...o, ...updates } : o));
    setLocalItem(STORAGE_KEYS.ORGANIZATIONS, updated);
    return { success: true };
  },

  /**
   * Elimina una organización matriz y limpia sus marcas y sucursales supeditadas
   */
  async deleteOrganization(id: string): Promise<{ success: boolean; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured && !id.startsWith('org-')) {
      try {
        const { error } = await supabase.from('organizations').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Modo local / demo: purga en cascada
    const orgs = getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_DEMO_DATA.organizations);
    setLocalItem(STORAGE_KEYS.ORGANIZATIONS, orgs.filter((o) => o.id !== id));

    const brands = getLocalItem<OrganizationBrand[]>(STORAGE_KEYS.ORGANIZATION_BRANDS, INITIAL_DEMO_DATA.organizationBrands);
    setLocalItem(STORAGE_KEYS.ORGANIZATION_BRANDS, brands.filter((b) => b.organization_id !== id));

    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    setLocalItem(STORAGE_KEYS.RESTAURANTS, rests.filter((r) => r.organization_id !== id));

    return { success: true };
  },

async getMyMembership(): Promise<{ organization: Organization; member: OrganizationMember } | null> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_portal_demo_auth') === 'true';

    if (isSupabaseConfigured && !isDemo) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Buscar membresía
      const { data: member } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (member && member.organization) {
        return {
          organization: member.organization as Organization,
          member: {
            id: member.id,
            organization_id: member.organization_id,
            user_id: member.user_id,
            role: member.role,
            created_at: member.created_at,
            user_email: user.email,
          },
        };
      }

      // Si es el Superadmin (arteagaescorza@gmail.com) navegando al portal para probar:
      if (user.email === 'arteagaescorza@gmail.com') {
        const { data: orgs } = await supabase.from('organizations').select('*').limit(1);
        if (orgs && orgs.length > 0) {
          return {
            organization: orgs[0] as Organization,
            member: {
              id: 'superadmin-membership',
              organization_id: orgs[0].id,
              user_id: user.id,
              role: 'owner',
              created_at: new Date().toISOString(),
              user_email: user.email,
            },
          };
        }
      }

      return null;
    }

    // Modo Demo
    const orgs = getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_DEMO_DATA.organizations);
    if (orgs.length > 0) {
      return {
        organization: orgs[0],
        member: {
          id: 'demo-member-1',
          organization_id: orgs[0].id,
          user_id: 'demo-user-1',
          role: 'owner',
          created_at: new Date().toISOString(),
          user_email: orgs[0].owner_email || 'demo@restaurante.com',
        },
      };
    }
    return null;
  },

async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      const { data } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      return data || [];
    }

    const all = getLocalItem<OrganizationMember[]>(STORAGE_KEYS.ORGANIZATION_MEMBERS, []);
    return all.filter((m) => m.organization_id === organizationId);
  },

async createOrganizationMember(
    organizationId: string,
    email: string,
    password: string,
    role: MemberRole = 'owner'
  ): Promise<{ success: boolean; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        // Registro estándar en Supabase Auth con confirmación por correo
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              organization_id: organizationId,
              role,
            },
          },
        });

        if (error) throw error;
        if (!data.user) throw new Error('No se pudo crear el usuario');

        // Insertar en organization_members
        const { error: memberErr } = await supabase.from('organization_members').insert([
          {
            organization_id: organizationId,
            user_id: data.user.id,
            role,
          },
        ]);

        if (memberErr) {
          // Si ya existía la membresía
          if (!memberErr.message.includes('unique')) throw memberErr;
        }

        // Activación Segundo Caballo de Troya (Visita 2): Elevar sucursales de Tier 1 a Tier 2 (Filtro de Reseñas Gratis)
        await supabase
          .from('restaurants')
          .update({ tier: 2 })
          .eq('organization_id', organizationId)
          .eq('tier', 1);

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Modo Demo
    const all = getLocalItem<OrganizationMember[]>(STORAGE_KEYS.ORGANIZATION_MEMBERS, []);
    const newMember: OrganizationMember = {
      id: 'member-' + Date.now(),
      organization_id: organizationId,
      user_id: 'user-' + Date.now(),
      role,
      created_at: new Date().toISOString(),
      user_email: email,
    };
    setLocalItem(STORAGE_KEYS.ORGANIZATION_MEMBERS, [newMember, ...all]);

    // Activación Segundo Caballo de Troya (Visita 2): Elevar sucursales de Tier 1 a Tier 2 (Filtro de Reseñas Gratis)
    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    const updatedRests = rests.map((r) =>
      r.organization_id === organizationId && r.tier === 1 ? { ...r, tier: 2 as const } : r
    );
    setLocalItem(STORAGE_KEYS.RESTAURANTS, updatedRests);

    return { success: true };
  }
,
async deleteOrganizationMember(organizationId: string, memberId: string): Promise<{ success: boolean; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('organization_members')
          .delete()
          .eq('id', memberId)
          .eq('organization_id', organizationId);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        console.warn('Error eliminando miembro de Supabase, aplicando fallback local:', err.message);
      }
    }

    const all = getLocalItem<OrganizationMember[]>(STORAGE_KEYS.ORGANIZATION_MEMBERS, []);
    const updated = all.filter((m) => m.id !== memberId);
    setLocalItem(STORAGE_KEYS.ORGANIZATION_MEMBERS, updated);
    return { success: true };
  },

  /**
   * Obtiene el catálogo universal de giros comerciales (business_verticals)
   */
  async getBusinessVerticals(): Promise<BusinessVertical[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('business_verticals')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Error cargando giros comerciales de Supabase:', e);
      }
    }
    return getLocalItem<BusinessVertical[]>(
      STORAGE_KEYS.BUSINESS_VERTICALS,
      INITIAL_DEMO_DATA.businessVerticals
    );
  },

  /**
   * Da de alta un nuevo giro comercial en la tabla universal (business_verticals)
   */
  async createBusinessVertical(payload: {
    name: string;
    slug?: string;
    unit_label?: string;
    unit_plural?: string;
    show_kds?: boolean;
    show_floor_staff?: boolean;
    show_hostess?: boolean;
  }): Promise<{ success: boolean; data?: BusinessVertical; error?: string }> {
    const cleanName = payload.name.trim();
    const generatedSlug =
      payload.slug?.trim() ||
      cleanName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') ||
      `giro-${Date.now()}`;

    const isFoodOrGastro = /restauran|taquer|pizz|sushi|bar|cafe|cocina|bistro|hamburgues|marisc/i.test(
      cleanName
    );

    const verticalRow = {
      slug: generatedSlug,
      name: cleanName,
      unit_label: payload.unit_label || (isFoodOrGastro ? 'Mesa' : 'Estación / Punto'),
      unit_plural: payload.unit_plural || (isFoodOrGastro ? 'Mesas' : 'Puntos de Atención'),
      show_kds: payload.show_kds ?? isFoodOrGastro,
      show_floor_staff: payload.show_floor_staff ?? true,
      show_hostess: payload.show_hostess ?? isFoodOrGastro,
    };

    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('business_verticals')
          .insert([verticalRow])
          .select()
          .single();
        if (error) throw error;
        return { success: true, data };
      } catch (err: any) {
        console.warn('Error insertando giro en Supabase, aplicando fallback local:', err.message);
      }
    }

    const list = getLocalItem<BusinessVertical[]>(
      STORAGE_KEYS.BUSINESS_VERTICALS,
      INITIAL_DEMO_DATA.businessVerticals
    );
    const existing = list.find(
      (v) => v.slug === generatedSlug || v.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      return { success: true, data: existing };
    }

    const newVertical: BusinessVertical = {
      ...verticalRow,
      id: 'vert-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.BUSINESS_VERTICALS, [...list, newVertical]);
    return { success: true, data: newVertical };
  },

  /**
   * Obtiene las marcas comerciales registradas (todas o filtradas por organización)
   */
  async getOrganizationBrands(organizationId?: string): Promise<OrganizationBrand[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        let query = supabase
          .from('organization_brands')
          .select('*')
          .order('created_at', { ascending: true });
        if (organizationId) {
          query = query.eq('organization_id', organizationId);
        }
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (e) {
        console.warn('Error cargando marcas de Supabase:', e);
      }
    }

    const brands = getLocalItem<OrganizationBrand[]>(
      STORAGE_KEYS.ORGANIZATION_BRANDS,
      INITIAL_DEMO_DATA.organizationBrands
    );
    if (organizationId) {
      return brands.filter((b) => b.organization_id === organizationId);
    }
    return brands;
  },

  /**
   * Da de alta una nueva marca comercial dentro de una organización
   */
  async createOrganizationBrand(
    brand: Omit<OrganizationBrand, 'id' | 'created_at'>
  ): Promise<{ success: boolean; data?: OrganizationBrand; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const clean = sanitizeSupabasePayload(brand, true);
        const { data, error } = await supabase
          .from('organization_brands')
          .insert([clean])
          .select()
          .single();
        if (error) throw error;
        return { success: true, data };
      } catch (err: any) {
        console.warn('Error insertando marca en Supabase, aplicando fallback local:', err.message);
      }
    }

    const brands = getLocalItem<OrganizationBrand[]>(
      STORAGE_KEYS.ORGANIZATION_BRANDS,
      INITIAL_DEMO_DATA.organizationBrands
    );
    const newBrand: OrganizationBrand = {
      ...brand,
      id: 'brand-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.ORGANIZATION_BRANDS, [...brands, newBrand]);
    return { success: true, data: newBrand };
  },

  /**
   * Elimina una marca comercial de la organización.
   */
  async deleteOrganizationBrand(brandId: string): Promise<{ success: boolean; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured && !brandId.startsWith('brand-')) {
      try {
        const { error } = await supabase.from('organization_brands').delete().eq('id', brandId);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const brands = getLocalItem<OrganizationBrand[]>(
      STORAGE_KEYS.ORGANIZATION_BRANDS,
      INITIAL_DEMO_DATA.organizationBrands
    );
    const updated = brands.filter((b) => b.id !== brandId);
    setLocalItem(STORAGE_KEYS.ORGANIZATION_BRANDS, updated);
    return { success: true };
  },

  // ==========================================
  // MÓDULO FASE C: TABLA DE GERENTES POR ORGANIZACIÓN Y ASIGNACIÓN POR SUCURSAL
  // ==========================================
  async getOrganizationManagers(organizationId?: string): Promise<OrganizationManager[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const deletedIds = new Set(getLocalItem<string[]>(STORAGE_KEYS.DELETED_MANAGER_IDS, []));
    const nowIso = new Date().toISOString();
    const targetOrgId = organizationId || 'org-1';
    const defaultManagers: OrganizationManager[] = ([
      {
        id: 'mgr-1',
        organization_id: targetOrgId,
        name: 'Lic. Mauricio Salinas (Gerente General de Sucursal)',
        email: 'mauricio.gerente@restaurante.mx',
        phone: '+525544332211',
        pin_code: '8888',
        manager_role: 'gerente_tienda' as StoreManagerRole,
        assigned_branch_ids: ['res-1', 'res-2'],
        branch_roles: {
          'res-1': 'gerente_tienda' as StoreManagerRole,
          'res-2': 'gerente_tienda' as StoreManagerRole,
        },
        is_active: true,
        created_at: nowIso,
      },
      {
        id: 'mgr-2',
        organization_id: targetOrgId,
        name: 'Sofía Valdés (Capitana / Gerente de Piso)',
        email: 'sofia.piso@restaurante.mx',
        phone: '+525566778899',
        pin_code: '9999',
        manager_role: 'capitan_piso' as StoreManagerRole,
        assigned_branch_ids: ['res-1'],
        branch_roles: {
          'res-1': 'capitan_piso' as StoreManagerRole,
        },
        is_active: true,
        created_at: nowIso,
      },
    ] as OrganizationManager[]).filter((m) => !deletedIds.has(m.id));

    if (!isDemo && isSupabaseConfigured) {
      try {
        let query = supabase
          .from('organization_managers')
          .select('*')
          .order('created_at', { ascending: true });
        if (organizationId && !organizationId.startsWith('org-')) {
          query = query.eq('organization_id', organizationId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const localItems = getLocalItem<OrganizationManager[]>(STORAGE_KEYS.ORGANIZATION_MANAGERS, [])
            .filter((m) => !deletedIds.has(m.id));
          const mergedMap = new Map<string, OrganizationManager>();
          (data as OrganizationManager[])
            .filter((m) => !deletedIds.has(m.id))
            .forEach((m) => mergedMap.set(m.id, m));
          localItems.forEach((m) => {
            if (!mergedMap.has(m.id)) {
              if (!organizationId || m.organization_id === organizationId || m.organization_id === 'org-1') {
                mergedMap.set(m.id, m);
              }
            }
          });
          // Asegurar gerentes demo si la consulta es para org demo o sin ID
          if (!organizationId || organizationId === 'org-1' || organizationId.startsWith('org-')) {
            defaultManagers.forEach((m) => {
              if (!mergedMap.has(m.id) && !deletedIds.has(m.id)) {
                mergedMap.set(m.id, m);
              }
            });
          }
          return Array.from(mergedMap.values());
        }
      } catch (e) {
        console.warn('Error cargando organization_managers de Supabase:', e);
      }
    }

    const list = getLocalItem<OrganizationManager[]>(
      STORAGE_KEYS.ORGANIZATION_MANAGERS,
      defaultManagers
    ).filter((m) => !deletedIds.has(m.id));
    if (!organizationId) return list;
    const filtered = list.filter(
      (m) => m.organization_id === organizationId || m.organization_id === 'org-1'
    );
    return filtered;
  },

  async saveOrganizationManager(
    manager: Partial<OrganizationManager>
  ): Promise<{ success: boolean; data?: OrganizationManager; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const orgId = manager.organization_id || 'org-1';

    if (!isDemo && isSupabaseConfigured && !orgId.startsWith('org-')) {
      try {
        if (manager.id && !manager.id.startsWith('mgr-')) {
          const clean = sanitizeSupabasePayload(manager, false);
          const { data, error } = await supabase
            .from('organization_managers')
            .update(clean)
            .eq('id', manager.id)
            .select()
            .single();
          if (!error && data) return { success: true, data: data as OrganizationManager };
        } else {
          const clean = sanitizeSupabasePayload(
            {
              organization_id: orgId,
              name: manager.name || 'Nuevo Gerente',
              email: manager.email || null,
              phone: manager.phone || null,
              pin_code: manager.pin_code || '8888',
              manager_role: manager.manager_role || 'gerente_tienda',
              assigned_branch_ids: manager.assigned_branch_ids || [],
              branch_roles: manager.branch_roles || {},
              is_active: manager.is_active ?? true,
            },
            true
          );
          const { data, error } = await supabase
            .from('organization_managers')
            .insert([clean])
            .select()
            .single();
          if (!error && data) return { success: true, data: data as OrganizationManager };
        }
      } catch (err: any) {
        console.warn('Error guardando organization_manager en Supabase, usando respaldo local:', err.message);
      }
    }

    const current = await organizationsApi.getOrganizationManagers();
    if (manager.id) {
      const updated = current.map((m) =>
        m.id === manager.id ? ({ ...m, ...manager } as OrganizationManager) : m
      );
      setLocalItem(STORAGE_KEYS.ORGANIZATION_MANAGERS, updated);
      return { success: true, data: updated.find((m) => m.id === manager.id) };
    }

    const created: OrganizationManager = {
      id: 'mgr-' + Date.now(),
      organization_id: orgId,
      name: manager.name || 'Gerente de Tienda',
      email: manager.email || null,
      phone: manager.phone || null,
      pin_code: manager.pin_code || '8888',
      manager_role: manager.manager_role || 'gerente_tienda',
      assigned_branch_ids: manager.assigned_branch_ids || [],
      branch_roles: manager.branch_roles || {},
      is_active: manager.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.ORGANIZATION_MANAGERS, [...current, created]);
    return { success: true, data: created };
  },

  async assignManagerToBranch(
    managerId: string,
    branchId: string,
    role: StoreManagerRole | 'sin_acceso',
    organizationId?: string
  ): Promise<{ success: boolean; data?: OrganizationManager }> {
    const allManagers = await organizationsApi.getOrganizationManagers(organizationId);
    const target = allManagers.find((m) => m.id === managerId);
    if (!target) return { success: false };

    const nextBranchRoles = { ...(target.branch_roles || {}), [branchId]: role };
    const nextAssignedBranches =
      role === 'sin_acceso'
        ? (target.assigned_branch_ids || []).filter((id) => id !== branchId)
        : Array.from(new Set([...(target.assigned_branch_ids || []), branchId]));

    return organizationsApi.saveOrganizationManager({
      ...target,
      manager_role: role === 'sin_acceso' ? target.manager_role : role,
      assigned_branch_ids: nextAssignedBranches,
      branch_roles: nextBranchRoles,
    });
  },

  async deleteOrganizationManager(managerId: string): Promise<{ success: boolean }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured && !managerId.startsWith('mgr-')) {
      try {
        await supabase.from('organization_managers').delete().eq('id', managerId);
      } catch (e) {
        console.warn('Error eliminando organization_manager en Supabase:', e);
      }
    }
    // Registrar en IDs eliminados para evitar resurrección de gerentes default o de Supabase
    const deletedIds = getLocalItem<string[]>(STORAGE_KEYS.DELETED_MANAGER_IDS, []);
    if (!deletedIds.includes(managerId)) {
      setLocalItem(STORAGE_KEYS.DELETED_MANAGER_IDS, [...deletedIds, managerId]);
    }
    const current = getLocalItem<OrganizationManager[]>(STORAGE_KEYS.ORGANIZATION_MANAGERS, []);
    setLocalItem(
      STORAGE_KEYS.ORGANIZATION_MANAGERS,
      current.filter((m) => m.id !== managerId)
    );
    return { success: true };
  },
  _noop() {
    return null;
  },
};