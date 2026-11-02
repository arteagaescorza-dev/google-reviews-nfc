import { supabase, isSupabaseConfigured } from '../supabase';
import type {
  Organization,
  OrganizationMember,
  MemberRole,
  Restaurant,
  BusinessVertical,
  OrganizationBrand,
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
};