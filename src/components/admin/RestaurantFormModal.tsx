import React, { useState, useEffect, useRef } from 'react';
import type {
  Restaurant,
  LinkItem,
  LinkType,
  Organization,
  OrganizationBrand,
  BusinessVertical,
  TierType,
} from '../../types';
import { api } from '../../lib/api';
import { TIERS } from '../../lib/constants';
import { normalizeImageUrl } from '../../lib/utils';
import {
  X,
  Plus,
  Trash2,
  Store,
  Check,
  ExternalLink,
  Wifi,
  Building2,
  Tag as TagIcon,
  Search,
  Layers,
  Clock,
} from 'lucide-react';
import { NewOrganizationModal } from './NewOrganizationModal';
import { PhoneInputWithCountry } from '../common/PhoneInputWithCountry';

interface DayScheduleItem {
  key: string;
  name: string;
  isOpen: boolean;
  open: string;
  close: string;
}

const INITIAL_WEEKLY_SCHEDULE: DayScheduleItem[] = [
  { key: 'lunes', name: 'Lunes', isOpen: true, open: '08:00', close: '23:00' },
  { key: 'martes', name: 'Martes', isOpen: true, open: '08:00', close: '23:00' },
  { key: 'miercoles', name: 'Miércoles', isOpen: true, open: '08:00', close: '23:00' },
  { key: 'jueves', name: 'Jueves', isOpen: true, open: '08:00', close: '23:00' },
  { key: 'viernes', name: 'Viernes', isOpen: true, open: '08:00', close: '23:00' },
  { key: 'sabado', name: 'Sábado', isOpen: true, open: '09:00', close: '23:30' },
  { key: 'domingo', name: 'Domingo', isOpen: true, open: '09:00', close: '22:00' },
];

interface RestaurantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  restaurant?: Restaurant | null;
  organizations: Organization[];
  onOrganizationCreated?: (org: Organization) => void;
  preselectedOrgId?: string;
  preselectedBrandId?: string;
}

function parseWifiString(url: string): { ssid: string; pass: string } {
  if (!url) return { ssid: '', pass: '' };
  const ssidMatch = url.match(/S:([^;]+)/i);
  const passMatch = url.match(/P:([^;]*)/i);
  return {
    ssid: ssidMatch ? ssidMatch[1] : '',
    pass: passMatch ? passMatch[1] : url.startsWith('WIFI:') ? '' : url,
  };
}

function buildWifiString(ssid: string, pass: string): string {
  const cleanSsid = ssid.trim();
  const cleanPass = pass.trim();
  if (!cleanSsid && !cleanPass) return '';
  if (cleanSsid && !cleanPass) {
    return `WIFI:S:${cleanSsid};T:nopass;P:;;`;
  }
  return `WIFI:S:${cleanSsid};T:WPA;P:${cleanPass};;`;
}

export const RestaurantFormModal: React.FC<RestaurantFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  restaurant,
  organizations,
  onOrganizationCreated,
  preselectedOrgId,
  preselectedBrandId,
}) => {
  const [localOrgs, setLocalOrgs] = useState<Organization[]>(organizations);
  const [allBrands, setAllBrands] = useState<OrganizationBrand[]>([]);
  const [verticals, setVerticals] = useState<BusinessVertical[]>([]);
  const [verticalSearch, setVerticalSearch] = useState('');
  const [isVerticalDropdownOpen, setIsVerticalDropdownOpen] = useState(false);
  const [isCreatingVertical, setIsCreatingVertical] = useState(false);
  const verticalDropdownRef = useRef<HTMLDivElement>(null);

  const [showNewOrgModal, setShowNewOrgModal] = useState(false);
  const [organizationId, setOrganizationId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [businessType, setBusinessType] = useState<string>('restaurant');
  const [branchName, setBranchName] = useState('Principal');
  const [slug, setSlug] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tier, setTier] = useState<TierType>(2);
  const [isAdFree, setIsAdFree] = useState(false);
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [address, setAddress] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState<DayScheduleItem[]>(INITIAL_WEEKLY_SCHEDULE);

  const handleCopyMondayHoursToAll = () => {
    const monday = weeklySchedule.find((d) => d.key === 'lunes') || weeklySchedule[0];
    setWeeklySchedule((prev) =>
      prev.map((d) => ({
        ...d,
        open: monday.open,
        close: monday.close,
        isOpen: true,
      }))
    );
  };
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReviewUrlChange = (val: string) => {
    const trimmed = val.trim();
    if (/^ChIJ[a-zA-Z0-9_-]+$/i.test(trimmed)) {
      setGoogleReviewUrl(`https://search.google.com/local/writereview?placeid=${trimmed}`);
      return;
    }
    const placeIdMatch = trimmed.match(/[?&](?:query_place_id|placeid)=([a-zA-Z0-9_-]+)/i);
    if (placeIdMatch && placeIdMatch[1]) {
      setGoogleReviewUrl(
        `https://search.google.com/local/writereview?placeid=${placeIdMatch[1]}`
      );
      return;
    }
    setGoogleReviewUrl(val);
  };

  useEffect(() => {
    setLocalOrgs(organizations);
  }, [organizations]);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([api.getOrganizationBrands(), api.getBusinessVerticals()]).then(
      ([bList, vList]) => {
        setAllBrands(bList);
        setVerticals(vList);
      }
    );
  }, [isOpen]);

  useEffect(() => {
    if (restaurant) {
      setBrandName(restaurant.brand_name || '');
      setBrandId(restaurant.brand_id || '');
      setBusinessType(restaurant.business_type || 'restaurant');
      setBranchName(restaurant.branch_name || 'Principal');
      setSlug(restaurant.slug || '');
      setGoogleReviewUrl(restaurant.google_review_url || '');
      setLogoUrl(restaurant.logo_url || '');
      setTier((restaurant.tier as TierType) || 2);
      setIsAdFree(restaurant.is_ad_free || false);
      setBrandColor(restaurant.brand_color || '#2563eb');
      setAddress(restaurant.address || '');
      setManagerPhone(restaurant.manager_phone || '');
      if (restaurant.daily_operating_hours) {
        try {
          const parsed = typeof restaurant.daily_operating_hours === 'string'
            ? JSON.parse(restaurant.daily_operating_hours)
            : restaurant.daily_operating_hours;
          if (Array.isArray(parsed)) {
            setWeeklySchedule(parsed);
          } else if (typeof parsed === 'object') {
            setWeeklySchedule(
              INITIAL_WEEKLY_SCHEDULE.map((d) => ({
                ...d,
                ...(parsed[d.key] || {}),
              }))
            );
          }
        } catch {
          setWeeklySchedule(INITIAL_WEEKLY_SCHEDULE);
        }
      } else if (restaurant.opening_time && restaurant.closing_time) {
        const oTime = restaurant.opening_time;
        const cTime = restaurant.closing_time;
        const daysText = (restaurant.operating_days || 'Lun - Dom').toLowerCase();
        setWeeklySchedule(
          INITIAL_WEEKLY_SCHEDULE.map((d) => ({
            ...d,
            open: oTime,
            close: cTime,
            isOpen: !daysText.includes('mar - dom') || d.key !== 'lunes',
          }))
        );
      } else {
        setWeeklySchedule(INITIAL_WEEKLY_SCHEDULE);
      }
      setOrganizationId(restaurant.organization_id || '');
      setLinks(restaurant.links || []);
    } else {
      const targetOrgId =
        preselectedOrgId || localOrgs[0]?.id || organizations[0]?.id || '';
      setOrganizationId(targetOrgId);
      setBrandId(preselectedBrandId || '');
      setBrandName('');
      setBusinessType('restaurant');
      setBranchName('Principal');
      setSlug('');
      setGoogleReviewUrl('');
      setLogoUrl('');
      setTier(2);
      setIsAdFree(false);
      setBrandColor('#2563eb');
      setAddress('');
      setManagerPhone('');
      setWeeklySchedule(INITIAL_WEEKLY_SCHEDULE);
      setLinks([]);
    }
    setErrorMsg('');
  }, [restaurant, isOpen, organizations, preselectedOrgId, preselectedBrandId]);

  // Si se preselecciona una marca, sincronizar sus datos en nueva sucursal
  useEffect(() => {
    if (!restaurant && brandId && allBrands.length > 0) {
      const matched = allBrands.find((b) => b.id === brandId);
      if (matched) {
        setBrandName(matched.name);
        setBusinessType(matched.vertical_slug || 'restaurant');
        if (matched.logo_url) setLogoUrl(matched.logo_url);
        if (matched.brand_color) setBrandColor(matched.brand_color);
        const generated = `${matched.name} ${branchName}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        setSlug(generated);
      }
    }
  }, [brandId, allBrands, restaurant]);

  if (!isOpen) return null;

  const orgBrands = allBrands.filter((b) => b.organization_id === organizationId);
  const currentVerticalObj = verticals.find((v) => v.slug === businessType);
  const filteredVerticals = verticals.filter((v) => {
    const q = verticalSearch.trim().toLowerCase();
    if (!q) return true;
    return v.name.toLowerCase().includes(q) || v.slug.toLowerCase().includes(q);
  });
  const exactVerticalMatch = verticals.some(
    (v) => v.name.toLowerCase() === verticalSearch.trim().toLowerCase()
  );

  const handleCreateNewVertical = async () => {
    const clean = verticalSearch.trim();
    if (!clean) return;
    setIsCreatingVertical(true);
    const res = await api.createBusinessVertical({ name: clean });
    setIsCreatingVertical(false);
    if (res.success && res.data) {
      const created = res.data;
      setVerticals((prev) => [...prev, created]);
      setBusinessType(created.slug);
      setVerticalSearch('');
      setIsVerticalDropdownOpen(false);
    }
  };

  // Auto-generar slug
  const handleBrandChange = (val: string) => {
    setBrandName(val);
    if (!restaurant) {
      const generated = `${val} ${branchName}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleBranchChange = (val: string) => {
    setBranchName(val);
    if (!restaurant) {
      const generated = `${brandName} ${val}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const addLink = () => {
    setLinks([
      ...links,
      { id: Date.now().toString(), title: 'Nuevo Acceso', url: 'https://', icon: 'menu' },
    ]);
  };

  const updateLink = (index: number, field: keyof LinkItem, value: string) => {
    const updated = [...links];
    const current = updated[index];

    if (field === 'icon') {
      const newIcon = value as LinkType;
      let newTitle = current.title;
      let newUrl = current.url;

      if (newIcon === 'wifi') {
        if (!newTitle || newTitle === 'Nuevo Acceso') newTitle = 'Conectar a Wi-Fi Clientes';
        if (newUrl.startsWith('http')) newUrl = '';
      } else {
        if (newUrl.startsWith('WIFI:')) newUrl = 'https://';
        if (newIcon === 'instagram') {
          if (
            !newTitle ||
            newTitle === 'Nuevo Acceso' ||
            newTitle === 'Conectar a Wi-Fi Clientes'
          )
            newTitle = 'Síguenos en Instagram';
        } else if (newIcon === 'whatsapp') {
          if (
            !newTitle ||
            newTitle === 'Nuevo Acceso' ||
            newTitle === 'Conectar a Wi-Fi Clientes'
          )
            newTitle = 'Reservaciones por WhatsApp';
        } else if (newIcon === 'menu') {
          if (
            !newTitle ||
            newTitle === 'Nuevo Acceso' ||
            newTitle === 'Conectar a Wi-Fi Clientes'
          )
            newTitle = 'Menú Digital & Carta';
        }
      }

      updated[index] = { ...current, icon: newIcon, title: newTitle, url: newUrl };
    } else {
      updated[index] = { ...current, [field]: value };
    }

    setLinks(updated);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !googleReviewUrl.trim()) {
      setErrorMsg('Nombre de marca y enlace de Google Reseñas son obligatorios.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const fullName = branchName
      ? `${brandName.trim()} - ${branchName.trim()}`
      : brandName.trim();
    const cleanLogo = logoUrl.startsWith('data:') ? logoUrl : normalizeImageUrl(logoUrl);

    let resolvedBrandId = brandId || null;

    // Si pertenece a una organización y aún no tiene brand_id en organization_brands, sincronizar marca
    if (organizationId && !resolvedBrandId) {
      const existingBrand = orgBrands.find(
        (b) => b.name.toLowerCase() === brandName.trim().toLowerCase()
      );
      if (existingBrand) {
        resolvedBrandId = existingBrand.id;
      } else {
        const createdBrandRes = await api.createOrganizationBrand({
          organization_id: organizationId,
          name: brandName.trim(),
          vertical_id: currentVerticalObj?.id || null,
          vertical_slug: businessType || 'restaurant',
          logo_url: cleanLogo || null,
          brand_color: brandColor || '#2563eb',
        });
        if (createdBrandRes.success && createdBrandRes.data) {
          resolvedBrandId = createdBrandRes.data.id;
        }
      }
    }

    const payload: Partial<Restaurant> = {
      brand_id: resolvedBrandId,
      brand_name: brandName.trim(),
      branch_name: branchName.trim() || 'Principal',
      business_type: businessType || 'restaurant',
      name: fullName,
      slug: slug.trim() || `sucursal-${Date.now()}`,
      google_review_url: googleReviewUrl.trim(),
      logo_url: cleanLogo || null,
      tier,
      is_ad_free: isAdFree,
      brand_color: brandColor,
      address: address.trim() || null,
      manager_phone: managerPhone.trim() || null,
      daily_operating_hours: JSON.stringify(weeklySchedule),
      opening_time: weeklySchedule.find((d) => d.isOpen)?.open || '08:00',
      closing_time: weeklySchedule.find((d) => d.isOpen)?.close || '23:00',
      operating_days: (() => {
        const openDays = weeklySchedule.filter((d) => d.isOpen);
        if (openDays.length === 7) return 'Lun - Dom';
        if (openDays.length === 6 && !weeklySchedule.find((d) => d.key === 'lunes')?.isOpen) return 'Mar - Dom';
        if (openDays.length === 6 && !weeklySchedule.find((d) => d.key === 'domingo')?.isOpen) return 'Lun - Sáb';
        if (openDays.length === 5 && !weeklySchedule.find((d) => d.key === 'sabado')?.isOpen && !weeklySchedule.find((d) => d.key === 'domingo')?.isOpen) return 'Lun - Vie';
        return openDays.map((d) => d.name.slice(0, 3)).join(', ');
      })(),
      organization_id: organizationId || null,
      links,
      is_active: true,
    };

    if (restaurant?.id) {
      payload.id = restaurant.id;
    }

    const res = await api.saveRestaurant(payload);

    setIsSaving(false);
    if (res.success) {
      onSaved();
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al guardar la sucursal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {restaurant ? 'Editar Sucursal / Local' : 'Dar de Alta Sucursal'}
              </h2>
              <p className="text-xs text-slate-500">
                Configuración de organización, marca comercial, giro, paquete y publicidad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Organización y Marca Comercial */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Organización & Marca Comercial
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowNewOrgModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors w-fit"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dar de Alta Organización</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Organización Matriz
                </label>
                <select
                  value={organizationId}
                  onChange={(e) => {
                    setOrganizationId(e.target.value);
                    setBrandId('');
                  }}
                  className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-white shadow-2xs"
                >
                  <option value="">-- Sin Organización (Independiente) --</option>
                  {localOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.owner_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Marca Registrada en la Organización
                </label>
                <select
                  value={brandId}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setBrandId(bId);
                    const matched = orgBrands.find((b) => b.id === bId);
                    if (matched) {
                      setBrandName(matched.name);
                      setBusinessType(matched.vertical_slug || 'restaurant');
                      if (matched.logo_url) setLogoUrl(matched.logo_url);
                      if (matched.brand_color) setBrandColor(matched.brand_color);
                    }
                  }}
                  className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-white shadow-2xs"
                >
                  <option value="">-- Nueva Marca / Especificar Abajo --</option>
                  {orgBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.vertical_slug})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Nombre de Marca, Giro Comercial Universal con Buscador y Sucursal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de la Marca *
              </label>
              <div className="relative">
                <TagIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  placeholder="Ej. Tacos El Pastorcito"
                  className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                />
              </div>
            </div>

            {/* Selector Universal de Giro Comercial con Buscador */}
            <div ref={verticalDropdownRef} className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Giro de la Marca *
              </label>
              <button
                type="button"
                onClick={() => setIsVerticalDropdownOpen((prev) => !prev)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-white flex items-center justify-between font-bold text-slate-800"
              >
                <span className="truncate">
                  {currentVerticalObj ? currentVerticalObj.name : businessType}
                </span>
                <Layers className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              </button>

              {isVerticalDropdownOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      autoFocus
                      value={verticalSearch}
                      onChange={(e) => setVerticalSearch(e.target.value)}
                      placeholder="Buscar o crear giro..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                    {filteredVerticals.map((vert) => (
                      <button
                        key={vert.id}
                        type="button"
                        onClick={() => {
                          setBusinessType(vert.slug);
                          setIsVerticalDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 text-left text-xs rounded-lg flex items-center justify-between ${
                          businessType === vert.slug
                            ? 'bg-blue-50 text-blue-800 font-extrabold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{vert.name}</span>
                        {businessType === vert.slug && (
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                  {verticalSearch.trim().length > 1 && !exactVerticalMatch && (
                    <button
                      type="button"
                      disabled={isCreatingVertical}
                      onClick={handleCreateNewVertical}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Dar de alta giro "{verticalSearch.trim()}"</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de Sucursal *
              </label>
              <input
                type="text"
                required
                value={branchName}
                onChange={(e) => handleBranchChange(e.target.value)}
                placeholder="Ej. Sucursal Centro o Norte"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Slug único (URL) *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ej: tacos-pastorcito-centro"
                className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Enlace de Google Reseñas *
              </label>
              <input
                type="text"
                required
                value={googleReviewUrl}
                onChange={(e) => handleReviewUrlChange(e.target.value)}
                placeholder="https://g.page/r/.../review o link de Google Maps"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Selección de Paquete (Tier 1 a 4) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Paquete Contratado (Nivel de Servicio)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([1, 2, 3, 4] as TierType[]).map((tNum) => (
                <div
                  key={tNum}
                  onClick={() => setTier(tNum)}
                  className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all ${
                    tier === tNum
                      ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{TIERS[tNum].name}</span>
                    {tier === tNum && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {TIERS[tNum].description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Opciones de monetización (Switch de Anuncios), Color y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Modalidad de Anuncios
              </label>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-xs font-bold text-slate-800">
                  {isAdFree ? 'Marca Blanca (Ad-Free)' : 'Red de Anuncios'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAdFree}
                  onClick={() => setIsAdFree((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    isAdFree ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      isAdFree ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Color de Marca
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                />
                <span className="text-xs font-mono text-slate-600">{brandColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Teléfono de la Sucursal
              </label>
              <PhoneInputWithCountry
                value={managerPhone}
                onChange={setManagerPhone}
                compact
              />
            </div>
          </div>

          {/* Logo y dirección física */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                URL del Logo de Marca
              </label>
              <input
                type="url"
                value={logoUrl.startsWith('data:') ? '' : logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Dirección Física de la Sucursal
                </label>
                {googleReviewUrl && (
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Ver en Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Hidalgo #120, Col. Centro"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Horario Operativo de la Sucursal por Día (Requerimiento 2) */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Horario Operativo de la Sucursal por Día (Base para Turnos)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMondayHoursToAll}
                  className="text-[11px] font-bold text-indigo-700 bg-indigo-100/80 hover:bg-indigo-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Copiar las horas de apertura y cierre del Lunes a todos los demás días"
                >
                  Copiar Lunes a toda la semana
                </button>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100/70 px-2 py-0.5 rounded-md">
                  Útil para Gerente de Tienda
                </span>
              </div>
            </div>

            {/* Lista de 7 Días */}
            <div className="space-y-1.5 pt-1">
              {weeklySchedule.map((day, idx) => {
                return (
                  <div
                    key={day.key}
                    className={`px-3 py-2 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                      day.isOpen
                        ? 'bg-white border-slate-200/90 shadow-2xs'
                        : 'bg-slate-100/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-32 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setWeeklySchedule((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, isOpen: !d.isOpen } : d))
                          );
                        }}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          day.isOpen ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {day.isOpen && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span className={`text-xs font-bold ${day.isOpen ? 'text-slate-900' : 'text-slate-400'}`}>
                        {day.name}
                      </span>
                    </div>

                    {day.isOpen ? (
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Abre:</span>
                          <input
                            type="time"
                            value={day.open}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWeeklySchedule((prev) =>
                                prev.map((d, i) => (i === idx ? { ...d, open: val } : d))
                              );
                            }}
                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-900"
                          />
                        </div>
                        <span className="text-slate-400 font-bold">&ndash;</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Cierra:</span>
                          <input
                            type="time"
                            value={day.close}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWeeklySchedule((prev) =>
                                prev.map((d, i) => (i === idx ? { ...d, close: val } : d))
                              );
                            }}
                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 italic">
                        Descanso / Cerrado
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-500">
              El Gerente de Tienda utilizará estos horarios por día para calcular las horas de entrada y salida al programar los turnos matutinos, vespertinos y nocturnos.
            </p>
          </div>

          {/* Sección de Linktree para Tier 3 o superior */}
          {tier >= 3 && (
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Botones de Linktree (Menú, Redes, Wi-Fi)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Aparecerán debajo del widget de estrellas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addLink}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Botón</span>
                </button>
              </div>

              <div className="space-y-3">
                {links.map((link, idx) => {
                  const isWifi = link.icon === 'wifi';
                  const wifiData = isWifi ? parseWifiString(link.url) : { ssid: '', pass: '' };

                  return (
                    <div
                      key={link.id || idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isWifi
                          ? 'bg-blue-50/50 border-blue-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <select
                          value={link.icon}
                          onChange={(e) => updateLink(idx, 'icon', e.target.value as LinkType)}
                          className="w-full sm:w-auto p-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                        >
                          <option value="wifi">Wi-Fi Clientes</option>
                          <option value="menu">Menú Digital</option>
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="tiktok">TikTok</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="website">Sitio Web</option>
                          <option value="other">Otro Enlace</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Texto del botón (ej. Conectar a Wi-Fi Clientes)"
                          value={link.title}
                          onChange={(e) => updateLink(idx, 'title', e.target.value)}
                          className="flex-1 w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                        />

                        {!isWifi && (
                          <input
                            type="text"
                            placeholder="URL destino (ej. https://instagram.com/...)"
                            value={link.url}
                            onChange={(e) => updateLink(idx, 'url', e.target.value)}
                            className="flex-1 w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => removeLink(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-100/70 rounded-lg self-end sm:self-center transition-colors"
                          title="Eliminar botón"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {isWifi && (
                        <div className="mt-2.5 pt-2.5 border-t border-blue-100 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Nombre de la Red (SSID)
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: CafeClientes"
                                value={wifiData.ssid}
                                onChange={(e) => {
                                  const newWifiStr = buildWifiString(
                                    e.target.value,
                                    wifiData.pass
                                  );
                                  updateLink(idx, 'url', newWifiStr);
                                }}
                                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Contraseña de Wi-Fi
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: cafe1234"
                                value={wifiData.pass}
                                onChange={(e) => {
                                  const newWifiStr = buildWifiString(
                                    wifiData.ssid,
                                    e.target.value
                                  );
                                  updateLink(idx, 'url', newWifiStr);
                                }}
                                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                              />
                            </div>
                          </div>
                          <p className="text-[11px] text-blue-700 flex items-center gap-1.5">
                            <Wifi className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>
                              Genera automáticamente el código para que los clientes copien la clave con un toque.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving
                ? 'Guardando...'
                : restaurant
                ? 'Actualizar Sucursal'
                : 'Guardar y Activar Sucursal'}
            </button>
          </div>
        </form>
      </div>

      {showNewOrgModal && (
        <NewOrganizationModal
          isOpen={showNewOrgModal}
          onClose={() => setShowNewOrgModal(false)}
          onCreated={(newOrg) => {
            setLocalOrgs((prev) => [newOrg, ...prev]);
            setOrganizationId(newOrg.id);
            if (onOrganizationCreated) {
              onOrganizationCreated(newOrg);
            }
          }}
          onBrandCreated={(newBrand) => {
            setAllBrands((prev) => [...prev, newBrand]);
            setBrandId(newBrand.id);
            setBrandName(newBrand.name);
            setBusinessType(newBrand.vertical_slug);
          }}
        />
      )}
    </div>
  );
};
