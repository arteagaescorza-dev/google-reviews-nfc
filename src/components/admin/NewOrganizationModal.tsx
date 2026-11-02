import React, { useState, useEffect, useRef } from 'react';
import type {
  Organization,
  OrganizationBrand,
  BusinessVertical,
  Restaurant,
  TierType,
} from '../../types';
import { api } from '../../lib/api';
import { TIERS } from '../../lib/constants';
import { normalizeImageUrl } from '../../lib/utils';
import { PhoneInputWithCountry } from '../common/PhoneInputWithCountry';
import {
  X,
  Building2,
  User,
  Mail,
  Check,
  Loader2,
  FileText,
  Tag as TagIcon,
  Store,
  Upload,
  Search,
  Plus,
  ChevronRight,
  MapPin,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface NewOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newOrg: Organization) => void;
  onBrandCreated?: (newBrand: OrganizationBrand) => void;
  onBranchCreated?: (newBranch: Restaurant) => void;
  initialOrganization?: Organization | null;
  initialBrand?: OrganizationBrand | null;
}

type WizardStep = 1 | 2 | 3;

const TAX_REGIMES = [
  { code: '601', label: '601 - General de Ley Personas Morales' },
  { code: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { code: '626', label: '626 - Régimen Simplificado de Confianza (RESICO)' },
  { code: '621', label: '621 - Incorporación Fiscal' },
  { code: '606', label: '606 - Arrendamiento' },
];

/**
 * Redimensiona una imagen subida a formato cuadrado estándar (256x256 px WebP/PNG)
 */
function resizeLogoToStandardFormat(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const TARGET_SIZE = 256;
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el lienzo de imagen'));
          return;
        }
        // Fondo blanco limpio y recorte centrado 1:1 (cover)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, TARGET_SIZE, TARGET_SIZE);
        resolve(canvas.toDataURL('image/webp', 0.88));
      };
      img.onerror = () => reject(new Error('Archivo de imagen inválido'));
      img.src = String(ev.target?.result || '');
    };
    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    reader.readAsDataURL(file);
  });
}

export const NewOrganizationModal: React.FC<NewOrganizationModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  onBrandCreated,
  onBranchCreated,
  initialOrganization = null,
  initialBrand = null,
}) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Entidades creadas / activas durante el asistente
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [orgBrands, setOrgBrands] = useState<OrganizationBrand[]>([]);
  const [activeBrand, setActiveBrand] = useState<OrganizationBrand | null>(null);

  // Catálogo universal de giros comerciales
  const [verticals, setVerticals] = useState<BusinessVertical[]>([]);
  const [verticalSearch, setVerticalSearch] = useState('');
  const [isVerticalDropdownOpen, setIsVerticalDropdownOpen] = useState(false);
  const [isCreatingVertical, setIsCreatingVertical] = useState(false);
  const verticalDropdownRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // PASO 1: Datos Generales de la Organización + Datos Fiscales
  // ==========================================
  const [orgName, setOrgName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [notifyNegativeFeedback, setNotifyNegativeFeedback] = useState(true);
  // Datos Fiscales (billing_info)
  const [taxName, setTaxName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxRegime, setTaxRegime] = useState('601');
  const [taxZip, setTaxZip] = useState('');
  const [billingEmail, setBillingEmail] = useState('');

  // ==========================================
  // PASO 2: Añadir Marca Comercial + Giro Universal + Logo Formato Estándar
  // ==========================================
  const [brandName, setBrandName] = useState('');
  const [selectedVertical, setSelectedVertical] = useState<BusinessVertical | null>(null);
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#2563eb');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // PASO 3: Añadir Sucursal (Supeditada a la Marca)
  // ==========================================
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [branchName, setBranchName] = useState('Sucursal Principal');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [tier, setTier] = useState<TierType>(2);
  const [isAdFree, setIsAdFree] = useState(false);
  const [managerPhone, setManagerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [branchBrandColor, setBranchBrandColor] = useState('#2563eb');

  // Cargar catálogo universal de giros y configurar paso inicial
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg('');
    api.getBusinessVerticals().then((list) => {
      setVerticals(list);
      const defaultVert = list.find((v) => v.slug === 'restaurant') || list[0] || null;
      setSelectedVertical(defaultVert);
    });

    if (initialOrganization && initialBrand) {
      setActiveOrg(initialOrganization);
      setActiveBrand(initialBrand);
      setSelectedBrandId(initialBrand.id);
      setBranchBrandColor(initialBrand.brand_color || '#2563eb');
      api.getOrganizationBrands(initialOrganization.id).then((bList) => {
        setOrgBrands(bList.length > 0 ? bList : [initialBrand]);
      });
      setStep(3);
    } else if (initialOrganization) {
      setActiveOrg(initialOrganization);
      api.getOrganizationBrands(initialOrganization.id).then((bList) => {
        setOrgBrands(bList);
      });
      setBrandName('');
      setBrandLogoUrl('');
      setBrandColor('#2563eb');
      setStep(2);
    } else {
      setActiveOrg(null);
      setActiveBrand(null);
      setOrgBrands([]);
      setOrgName('');
      setOwnerName('');
      setOwnerPhone('');
      setOwnerEmail('');
      setNotifyNegativeFeedback(true);
      setTaxName('');
      setTaxId('');
      setTaxRegime('601');
      setTaxZip('');
      setBillingEmail('');
      setBrandName('');
      setBrandLogoUrl('');
      setBrandColor('#2563eb');
      setBranchName('Sucursal Principal');
      setGoogleReviewUrl('');
      setTier(2);
      setIsAdFree(false);
      setManagerPhone('');
      setAddress('');
      setBranchBrandColor('#2563eb');
      setStep(1);
    }
  }, [isOpen, initialOrganization, initialBrand]);

  // Cerrar desplegable de giros al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (
        verticalDropdownRef.current &&
        !verticalDropdownRef.current.contains(ev.target as Node)
      ) {
        setIsVerticalDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Filtrado de giros en el buscador
  const filteredVerticals = verticals.filter((v) => {
    const q = verticalSearch.trim().toLowerCase();
    if (!q) return true;
    return v.name.toLowerCase().includes(q) || v.slug.toLowerCase().includes(q);
  });

  const exactVerticalMatch = verticals.some(
    (v) => v.name.toLowerCase() === verticalSearch.trim().toLowerCase()
  );

  // Dar de alta un nuevo giro universal desde el desplegable
  const handleCreateNewVertical = async () => {
    const clean = verticalSearch.trim();
    if (!clean) return;
    setIsCreatingVertical(true);
    const res = await api.createBusinessVertical({ name: clean });
    setIsCreatingVertical(false);
    if (res.success && res.data) {
      const created = res.data;
      setVerticals((prev) => {
        if (prev.some((v) => v.id === created.id)) return prev;
        return [...prev, created];
      });
      setSelectedVertical(created);
      setVerticalSearch('');
      setIsVerticalDropdownOpen(false);
    }
  };

  // Subida de logo estandarizado 256x256
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeLogoToStandardFormat(file);
      setBrandLogoUrl(dataUrl);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo procesar el logo.');
    }
  };

  // Normalización de enlace de Google Reviews
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

  // ==========================================
  // SUBMIT PASO 1: Dar de Alta Organización
  // ==========================================
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setErrorMsg('El nombre corporativo o general de la organización es obligatorio.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('El nombre del dueño titular de la organización es obligatorio.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const hasBilling =
      taxName.trim() || taxId.trim() || taxZip.trim() || billingEmail.trim();

    const res = await api.createOrganization({
      name: orgName.trim(),
      owner_name: ownerName.trim(),
      owner_phone: ownerPhone.trim() || null,
      owner_email: ownerEmail.trim() || null,
      notify_negative_feedback: notifyNegativeFeedback,
      billing_info: hasBilling
        ? {
            tax_name: taxName.trim() || orgName.trim(),
            tax_id: taxId.trim().toUpperCase(),
            tax_regime: taxRegime,
            tax_zip: taxZip.trim(),
            billing_email: billingEmail.trim() || ownerEmail.trim(),
          }
        : null,
    });

    setIsSaving(false);

    if (res.success && res.data) {
      setActiveOrg(res.data);
      onCreated(res.data);
      // Pre-llenar sugerencia de marca si aún está vacía
      if (!brandName) {
        setBrandName(orgName.trim());
      }
      if (!managerPhone && ownerPhone.trim()) {
        setManagerPhone(ownerPhone.trim());
      }
      setStep(2);
    } else {
      setErrorMsg(res.error || 'Error al dar de alta la organización.');
    }
  };

  // ==========================================
  // SUBMIT PASO 2: Añadir Marca Comercial
  // ==========================================
  const handleSaveBrand = async (goToNextStep: boolean) => {
    if (!activeOrg) {
      setErrorMsg('Primero debes registrar o seleccionar una organización.');
      return;
    }
    if (!brandName.trim()) {
      setErrorMsg('El nombre de la marca comercial es obligatorio.');
      return;
    }
    if (!selectedVertical) {
      setErrorMsg('Selecciona o da de alta el giro comercial de la marca.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const cleanLogo = brandLogoUrl.startsWith('data:')
      ? brandLogoUrl
      : normalizeImageUrl(brandLogoUrl);

    const res = await api.createOrganizationBrand({
      organization_id: activeOrg.id,
      name: brandName.trim(),
      vertical_id: selectedVertical.id,
      vertical_slug: selectedVertical.slug,
      logo_url: cleanLogo || null,
      brand_color: brandColor || '#2563eb',
    });

    setIsSaving(false);

    if (res.success && res.data) {
      const createdBrand = res.data;
      setOrgBrands((prev) => [...prev, createdBrand]);
      setActiveBrand(createdBrand);
      setSelectedBrandId(createdBrand.id);
      setBranchBrandColor(createdBrand.brand_color || '#2563eb');
      if (onBrandCreated) {
        onBrandCreated(createdBrand);
      }

      if (goToNextStep) {
        setStep(3);
      } else {
        // Limpiar para añadir otra marca a la misma organización
        setBrandName('');
        setBrandLogoUrl('');
      }
    } else {
      setErrorMsg(res.error || 'Error al registrar la marca comercial.');
    }
  };

  // ==========================================
  // SUBMIT PASO 3: Añadir Sucursal (Supeditada a la Marca)
  // ==========================================
  const handleSaveBranch = async (addAnotherBranch: boolean) => {
    if (!activeOrg) {
      setErrorMsg('No hay organización activa.');
      return;
    }
    const targetBrand =
      orgBrands.find((b) => b.id === selectedBrandId) || activeBrand;

    if (!targetBrand) {
      setErrorMsg('Toda sucursal debe estar supeditada a una marca comercial.');
      return;
    }
    if (!branchName.trim()) {
      setErrorMsg('El nombre de la sucursal es obligatorio.');
      return;
    }
    if (!googleReviewUrl.trim()) {
      setErrorMsg('El enlace de Google Reseñas de la sucursal es obligatorio.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const fullName = `${targetBrand.name.trim()} - ${branchName.trim()}`;
    const generatedSlug =
      fullName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Math.floor(100 + Math.random() * 900);

    const payload: Partial<Restaurant> = {
      organization_id: activeOrg.id,
      brand_id: targetBrand.id,
      brand_name: targetBrand.name.trim(),
      branch_name: branchName.trim(),
      business_type: targetBrand.vertical_slug || 'restaurant',
      name: fullName,
      slug: generatedSlug,
      google_review_url: googleReviewUrl.trim(),
      logo_url: targetBrand.logo_url || null,
      tier,
      is_ad_free: isAdFree,
      brand_color: branchBrandColor || targetBrand.brand_color || '#2563eb',
      address: address.trim() || null,
      manager_phone: managerPhone.trim() || activeOrg.owner_phone || null,
      links: [],
      is_active: true,
    };

    const res = await api.saveRestaurant(payload);
    setIsSaving(false);

    if (res.success && res.data) {
      if (onBranchCreated) {
        onBranchCreated(res.data);
      }
      if (addAnotherBranch) {
        setBranchName('');
        setGoogleReviewUrl('');
        setAddress('');
      } else {
        onClose();
      }
    } else {
      setErrorMsg(res.error || 'Error al registrar la sucursal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[93vh] overflow-y-auto">
        {/* Cabecera del Asistente de 3 Pasos */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              {step === 1 && <Building2 className="w-5 h-5" />}
              {step === 2 && <TagIcon className="w-5 h-5" />}
              {step === 3 && <Store className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {step === 1 && 'Paso 1: Dar de Alta Organización'}
                  {step === 2 && 'Paso 2: Añadir Marca Comercial'}
                  {step === 3 && 'Paso 3: Añadir Sucursal a la Marca'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wide border border-blue-200">
                  Paso {step} de 3
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {step === 1 &&
                  'Registra los datos generales del dueño y los datos fiscales de la organización.'}
                {step === 2 &&
                  `Configura las marcas de ${activeOrg?.name || 'la organización'}, su logo cuadrado y su giro comercial.`}
                {step === 3 &&
                  'Vincula la sucursal física supeditada a la marca, su link de Google Reseñas, paquete y publicidad.'}
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

        {/* Barra de Progreso de los 3 Pasos */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div
            className={`p-2.5 rounded-2xl border text-xs flex items-center gap-2 transition-all ${
              step === 1
                ? 'bg-blue-50 border-blue-300 text-blue-900 font-extrabold'
                : activeOrg
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white border border-current flex items-center justify-center text-[10px] font-extrabold flex-shrink-0">
              {activeOrg && step > 1 ? <Check className="w-3 h-3" /> : '1'}
            </span>
            <span className="truncate">1. Organización & Fiscal</span>
          </div>

          <div
            className={`p-2.5 rounded-2xl border text-xs flex items-center gap-2 transition-all ${
              step === 2
                ? 'bg-blue-50 border-blue-300 text-blue-900 font-extrabold'
                : orgBrands.length > 0 && step > 2
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white border border-current flex items-center justify-center text-[10px] font-extrabold flex-shrink-0">
              {orgBrands.length > 0 && step > 2 ? <Check className="w-3 h-3" /> : '2'}
            </span>
            <span className="truncate">2. Añadir Marca & Giro</span>
          </div>

          <div
            className={`p-2.5 rounded-2xl border text-xs flex items-center gap-2 transition-all ${
              step === 3
                ? 'bg-blue-50 border-blue-300 text-blue-900 font-extrabold'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white border border-current flex items-center justify-center text-[10px] font-extrabold flex-shrink-0">
              3
            </span>
            <span className="truncate">3. Añadir Sucursal</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* ============================================================ */}
        {/* PASO 1: DAR DE ALTA ORGANIZACIÓN + DATOS FISCALES            */}
        {/* ============================================================ */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Datos Generales de la Organización y Dueño Titular</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre de la Organización / Grupo *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Ej. Grupo Gastronómico del Norte"
                      className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre del Dueño Titular *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Ej. Roberto Gómez"
                      className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp del Dueño
                  </label>
                  <PhoneInputWithCountry
                    value={ownerPhone}
                    onChange={setOwnerPhone}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correo del Dueño (Acceso Portal)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="dueno@empresa.com"
                      className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque de Datos Fiscales de la Organización */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Datos Fiscales de la Organización (Facturación CFDI 4.0)</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Opcional en alta rápida</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    value={taxName}
                    onChange={(e) => setTaxName(e.target.value)}
                    placeholder="Ej. Operadora de Alimentos S.A. de C.V."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    RFC (Registro Federal de Contribuyentes)
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                    placeholder="Ej. OAL210415AB1"
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 bg-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Régimen Fiscal SAT
                  </label>
                  <select
                    value={taxRegime}
                    onChange={(e) => setTaxRegime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    {TAX_REGIMES.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Código Postal Fiscal
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={taxZip}
                    onChange={(e) => setTaxZip(e.target.value)}
                    placeholder="Ej. 06600"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Correo de Recepción de Facturas (XML / PDF)
                </label>
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="facturacion@empresa.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="notifyNegWizard"
                checked={notifyNegativeFeedback}
                onChange={(e) => setNotifyNegativeFeedback(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label
                htmlFor="notifyNegWizard"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Notificar al dueño ante quejas privadas de 1 a 3 estrellas
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando Organización...</span>
                  </>
                ) : (
                  <>
                    <span>Guardar y Continuar a Añadir Marca</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* PASO 2: AÑADIR MARCA COMERCIAL + GIRO UNIVERSAL + LOGO 1:1   */}
        {/* ============================================================ */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Resumen de la Organización Matriz Activa */}
            {activeOrg && (
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-700">Organización:</span>
                  <span className="font-extrabold text-blue-950">{activeOrg.name}</span>
                  <span className="text-slate-500">({activeOrg.owner_name})</span>
                </div>
                {orgBrands.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    {orgBrands.length} {orgBrands.length === 1 ? 'marca creada' : 'marcas creadas'}
                  </span>
                )}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre de la Marca Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Ej. Pizza Norte, Barbería Royal, DentalCare"
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900"
                  />
                </div>

                {/* Desplegable de Giro Comercial con Buscador + Alta Universal */}
                <div ref={verticalDropdownRef} className="relative">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Giro Comercial de la Marca (Universal) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsVerticalDropdownOpen((prev) => !prev)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white flex items-center justify-between font-bold text-slate-800 hover:border-blue-400 transition-colors"
                  >
                    <span className="truncate">
                      {selectedVertical ? selectedVertical.name : 'Seleccionar giro comercial...'}
                    </span>
                    <Layers className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  </button>

                  {isVerticalDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 space-y-2">
                      {/* Buscador interno */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          autoFocus
                          value={verticalSearch}
                          onChange={(e) => setVerticalSearch(e.target.value)}
                          placeholder="Buscar giro (ej. Restaurante, Barbería, Dental)..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
                        {filteredVerticals.map((vert) => (
                          <button
                            key={vert.id}
                            type="button"
                            onClick={() => {
                              setSelectedVertical(vert);
                              setIsVerticalDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs rounded-xl flex items-center justify-between transition-colors ${
                              selectedVertical?.id === vert.id
                                ? 'bg-blue-50 text-blue-800 font-extrabold'
                                : 'hover:bg-slate-50 text-slate-700 font-medium'
                            }`}
                          >
                            <div>
                              <span className="block">{vert.name}</span>
                              <span className="text-[10px] text-slate-400">
                                Unidad: {vert.unit_plural}
                                {vert.show_kds ? ' • KDS' : ''}
                              </span>
                            </div>
                            {selectedVertical?.id === vert.id && (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Botón para dar de alta el giro en la tabla universal si no existe */}
                      {verticalSearch.trim().length > 1 && !exactVerticalMatch && (
                        <div className="pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={isCreatingVertical}
                            onClick={handleCreateNewVertical}
                            className="w-full px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              {isCreatingVertical
                                ? 'Registrando giro...'
                                : `+ Dar de alta giro "${verticalSearch.trim()}"`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Subida de Logo en Formato Predeterminado (Cuadrado 256x256) y Color de Marca */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2 border-t border-slate-200/70">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Logo de la Marca (Formato Cuadrado Predeterminado 1:1)
                  </label>
                  <div className="flex items-center gap-3">
                    {/* Previsualización Cuadrada Estandarizada */}
                    <div
                      className="w-14 h-14 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs"
                      style={{
                        backgroundColor: brandLogoUrl ? '#ffffff' : brandColor,
                      }}
                    >
                      {brandLogoUrl ? (
                        <img
                          src={brandLogoUrl}
                          alt={brandName || 'Logo'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-extrabold text-lg">
                          {(brandName || 'M').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir Archivo (Auto-Ajuste 256×256)</span>
                        </button>
                        {brandLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setBrandLogoUrl('')}
                            className="text-[11px] text-rose-600 font-bold hover:underline"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        value={brandLogoUrl.startsWith('data:') ? '' : brandLogoUrl}
                        onChange={(e) => setBrandLogoUrl(e.target.value)}
                        placeholder="O pega URL directa del logo (https://...)"
                        className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white"
                      />
                      <p className="text-[10px] text-slate-400">
                        Formato predeterminado del sistema: Cuadrado 1:1 (256×256 px PNG/WebP).
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Color Identidad de Marca
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {brandColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones del Paso 2 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
              >
                Cerrar Asistente
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {orgBrands.length > 0 && !brandName.trim() && (
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                  >
                    <span>Ir al Paso 3 (Sucursales)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveBrand(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar y Añadir Otra Marca</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveBrand(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando Marca...</span>
                    </>
                  ) : (
                    <>
                      <span>Guardar Marca y Añadir Sucursal</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PASO 3: AÑADIR SUCURSAL SUPEDITADA A LA MARCA                */}
        {/* ============================================================ */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              {/* Selección de Marca a la que está supeditada la Sucursal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Marca Comercial Matriz *
                  </label>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setSelectedBrandId(bId);
                      const found = orgBrands.find((b) => b.id === bId);
                      if (found) {
                        setActiveBrand(found);
                        setBranchBrandColor(found.brand_color || '#2563eb');
                      }
                    }}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-extrabold text-slate-900"
                  >
                    {orgBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.vertical_slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre de la Sucursal *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Ej. Sucursal Centro, Polanco, Norte"
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Link de Reseñas de Google */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Enlace de Reseñas de Google de la Sucursal *
                  </label>
                  {googleReviewUrl && (
                    <a
                      href={googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-bold"
                    >
                      <span>Probar enlace</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={googleReviewUrl}
                  onChange={(e) => handleReviewUrlChange(e.target.value)}
                  placeholder="https://g.page/r/.../review o Place ID (ChIJ...)"
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              {/* Paquete Contratado (Tier 1 a 4) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Paquete Contratado por la Sucursal
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {([1, 2, 3, 4] as TierType[]).map((tNum) => (
                    <button
                      key={tNum}
                      type="button"
                      onClick={() => setTier(tNum)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        tier === tNum
                          ? 'border-blue-600 bg-blue-50/70 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-extrabold text-slate-900">
                          {TIERS[tNum].name}
                        </span>
                        {tier === tNum && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        {TIERS[tNum].description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Switch de Modalidad de Anuncios, Teléfono, Dirección Física y Color */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/70">
                {/* Switch de Modalidad de Anuncios */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Modalidad de Anuncios
                  </span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-slate-900">
                      {isAdFree ? 'Marca Blanca (Ad-Free)' : 'Red de Anuncios Activa'}
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
                  <span className="text-[10px] text-slate-400 mt-1">
                    {isAdFree
                      ? '0% anuncios de terceros en mesa'
                      : 'Monetiza con cupones cruzados'}
                  </span>
                </div>

                {/* Teléfono de la Sucursal */}
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teléfono de la Sucursal
                  </label>
                  <PhoneInputWithCountry
                    value={managerPhone}
                    onChange={setManagerPhone}
                    compact
                  />
                </div>

                {/* Color de Marca de la Sucursal */}
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Color de Marca
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branchBrandColor}
                      onChange={(e) => setBranchBrandColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {branchBrandColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dirección Física de la Sucursal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dirección Física de la Sucursal
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Hidalgo #120, Col. Centro"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Botones de Acción del Paso 3 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                &larr; Añadir Otra Marca
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveBranch(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar y Añadir Otra Sucursal</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveBranch(false)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando Sucursal...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Sucursal y Finalizar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
