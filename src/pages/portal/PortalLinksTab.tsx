import React, { useState, useEffect } from 'react';
import type { Restaurant, LinkItem, LinkType } from '../../types';
import { api } from '../../lib/api';
import {
  Plus,
  Trash2,
  Save,
  Check,
  Wifi,
  Info,
  Store,
} from 'lucide-react';

interface PortalLinksTabProps {
  restaurants: Restaurant[];
  selectedRestaurantId: string;
  onRefresh: () => void;
}

function parseWifiString(url: string): { ssid: string; pass: string } {
  if (!url) return { ssid: '', pass: '' };
  const ssidMatch = url.match(/S:([^;]+)/i);
  const passMatch = url.match(/P:([^;]*)/i);
  return {
    ssid: ssidMatch ? ssidMatch[1] : '',
    pass: passMatch ? passMatch[1] : (url.startsWith('WIFI:') ? '' : url),
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

export const PortalLinksTab: React.FC<PortalLinksTabProps> = ({
  restaurants,
  selectedRestaurantId,
  onRefresh,
}) => {
  const [activeResId, setActiveResId] = useState<string>('');
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Determinar qué restaurante se está editando
  useEffect(() => {
    if (selectedRestaurantId && selectedRestaurantId !== 'all') {
      setActiveResId(selectedRestaurantId);
    } else if (restaurants.length > 0) {
      setActiveResId(restaurants[0].id);
    }
  }, [selectedRestaurantId, restaurants]);

  // Cargar links del restaurante activo
  useEffect(() => {
    const res = restaurants.find((r) => r.id === activeResId);
    if (res) {
      setLinks(res.links || []);
    } else {
      setLinks([]);
    }
    setSaveSuccess(false);
  }, [activeResId, restaurants]);

  const activeRes = restaurants.find((r) => r.id === activeResId);

  const addLink = () => {
    setLinks([
      ...links,
      {
        id: Date.now().toString(),
        title: 'Nuevo Acceso',
        url: 'https://',
        icon: 'menu',
      },
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
          if (!newTitle || newTitle === 'Nuevo Acceso' || newTitle === 'Conectar a Wi-Fi Clientes')
            newTitle = 'Síguenos en Instagram';
        } else if (newIcon === 'whatsapp') {
          if (!newTitle || newTitle === 'Nuevo Acceso' || newTitle === 'Conectar a Wi-Fi Clientes')
            newTitle = 'Reservaciones por WhatsApp';
        } else if (newIcon === 'menu') {
          if (!newTitle || newTitle === 'Nuevo Acceso' || newTitle === 'Conectar a Wi-Fi Clientes')
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

  const handleSave = async () => {
    if (!activeResId) return;
    setIsSaving(true);
    setSaveSuccess(false);

    const ok = await api.updateMyRestaurantLinks(activeResId, links);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      onRefresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (!activeRes) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-200">
        No hay sucursales disponibles para editar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de sucursal si hay varias */}
      {restaurants.length > 1 && (
        <div className="bg-white rounded-2xl p-3 border border-slate-200 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-blue-600" />
            <span>Sucursal a editar:</span>
          </span>
          <select
            value={activeResId}
            onChange={(e) => setActiveResId(e.target.value)}
            className="p-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:bg-white"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.branch_name || r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Título de la pestaña */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Accesos Rápidos (Linktree)
          </h2>
          <p className="text-xs text-slate-500">
            Botones visibles para tus comensales (Menú, Wi-Fi, Redes Sociales).
          </p>
        </div>

        <button
          type="button"
          onClick={addLink}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between animate-fadeIn">
          <span>¡Enlaces actualizados correctamente en tus mesas!</span>
          <Check className="w-4 h-4 text-emerald-600" />
        </div>
      )}

      {/* Lista de Enlaces */}
      {links.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-xs text-slate-500 mb-3">
            Aún no has configurado botones de acceso rápido para esta sucursal.
          </p>
          <button
            type="button"
            onClick={addLink}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            + Crear Primer Botón (Menú o Wi-Fi)
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link, idx) => {
            const isWifi = link.icon === 'wifi';
            const wifiData = isWifi ? parseWifiString(link.url) : { ssid: '', pass: '' };

            return (
              <div
                key={link.id || idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isWifi
                    ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Fila superior: Tipo, Título y Borrar */}
                <div className="flex items-center gap-2">
                  <select
                    value={link.icon}
                    onChange={(e) => updateLink(idx, 'icon', e.target.value as LinkType)}
                    className="p-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="wifi">📶 Wi-Fi Clientes</option>
                    <option value="menu">🍽️ Menú Digital</option>
                    <option value="instagram">📸 Instagram</option>
                    <option value="facebook">👍 Facebook</option>
                    <option value="tiktok">🎵 TikTok</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="website">🌐 Sitio Web</option>
                    <option value="other">🔗 Otro</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Texto del botón"
                    value={link.title}
                    onChange={(e) => updateLink(idx, 'title', e.target.value)}
                    className="flex-1 p-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Si no es Wi-Fi: URL estándar */}
                {!isWifi && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateLink(idx, 'url', e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                )}

                {/* Si es Wi-Fi: Campos limpios de SSID y Clave */}
                {isWifi && (
                  <div className="mt-2.5 pt-2.5 border-t border-blue-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Nombre de Red (SSID)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: CafeClientes"
                          value={wifiData.ssid}
                          onChange={(e) => {
                            const newWifi = buildWifiString(e.target.value, wifiData.pass);
                            updateLink(idx, 'url', newWifi);
                          }}
                          className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Contraseña de Wi-Fi
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: cafe1234"
                          value={wifiData.pass}
                          onChange={(e) => {
                            const newWifi = buildWifiString(wifiData.ssid, e.target.value);
                            updateLink(idx, 'url', newWifi);
                          }}
                          className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-blue-700 flex items-center gap-1">
                      <Wifi className="w-3 h-3 flex-shrink-0" />
                      <span>Los comensales podrán copiar la clave o conectarse con 1 toque.</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Botón flotante o fijo de Guardar Cambios */}
      <div className="pt-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Guardando en la nube...' : 'Guardar y Publicar en Mesas'}</span>
        </button>
      </div>

      {/* Nota de protección de cuenta */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-500">
        <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p leading-relaxed>
          El enlace oficial de Google Reseñas y el paquete de suscripción están administrados por tu proveedor de servicio. Para cambios en tu ficha de Google, comunícate con soporte.
        </p>
      </div>
    </div>
  );
};
