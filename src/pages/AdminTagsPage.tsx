import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Tag, Restaurant } from '../types';
import { TagBatchModal } from '../components/admin/TagBatchModal';
import { TagSingleModal } from '../components/admin/TagSingleModal';
import { TagQRModal } from '../components/admin/TagQRModal';
import {
  QrCode,
  Plus,
  Edit2,
  Scan,
  Filter,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

export const AdminTagsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const restaurantFilterParam = searchParams.get('restaurant') || 'all';

  const [tags, setTags] = useState<Tag[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedTagForQr, setSelectedTagForQr] = useState<Tag | null>(null);

  // Edición rápida inline de tag
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editRestaurantId, setEditRestaurantId] = useState<string>('');
  const [editTable, setEditTable] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    const [tagList, resList] = await Promise.all([api.getTags(), api.getRestaurants()]);
    setTags(tagList);
    setRestaurants(resList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartEdit = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditRestaurantId(tag.restaurant_id || '');
    setEditTable(tag.table_identifier || '');
  };

  const handleSaveEdit = async (tagId: string) => {
    await api.saveTag({
      id: tagId,
      restaurant_id: editRestaurantId || null,
      table_identifier: editTable.trim() || null,
    });
    setEditingTagId(null);
    loadData();
  };

  const filteredTags = tags.filter((t) => {
    if (restaurantFilterParam === 'all') return true;
    if (restaurantFilterParam === 'unassigned') return !t.restaurant_id;
    return t.restaurant_id === restaurantFilterParam;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tags NFC & Códigos QR</h1>
          <p className="text-xs text-slate-500 mt-1">
            Asigna códigos físicos a restaurantes y mesas, descarga QRs e inspecciona escaneos
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSingleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Tag</span>
          </button>
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all"
          >
            <QrCode className="w-4 h-4 text-slate-500" />
            <span>Lote en Masa</span>
          </button>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700">Filtrar por local:</span>
          <select
            value={restaurantFilterParam}
            onChange={(e) => {
              setSearchParams(e.target.value === 'all' ? {} : { restaurant: e.target.value });
            }}
            className="p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white"
          >
            <option value="all">Todos los tags ({tags.length})</option>
            <option value="unassigned">Tags sin asignar</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
          Mostrando <strong>{filteredTags.length}</strong> de <strong>{tags.length}</strong> tags
        </div>
      </div>

      {/* Tabla de tags */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Cargando tags...</div>
      ) : filteredTags.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No hay tags asignados a este local</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Crea un tag individual para una mesa específica o genera un lote para tus stickers NFC.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsSingleModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              + Crear Tag para este Local
            </button>
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Generar Lote en Masa
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5 pl-5">Código NFC</th>
                  <th className="p-3.5">Restaurante / Sucursal</th>
                  <th className="p-3.5">Identificador de Mesa</th>
                  <th className="p-3.5 text-center">Escaneos</th>
                  <th className="p-3.5 text-center">Estado</th>
                  <th className="p-3.5 pr-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTags.map((tag) => {
                  const isEditing = editingTagId === tag.id;
                  const resName = restaurants.find((r) => r.id === tag.restaurant_id)?.name;

                  return (
                    <tr key={tag.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">
                        {tag.tag_code}
                      </td>

                      <td className="p-3.5">
                        {isEditing ? (
                          <select
                            value={editRestaurantId}
                            onChange={(e) => setEditRestaurantId(e.target.value)}
                            className="p-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="">-- Sin Asignar --</option>
                            {restaurants.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        ) : resName ? (
                          <span className="font-semibold text-slate-800">{resName}</span>
                        ) : (
                          <span className="text-amber-600 italic">Sin asignar</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTable}
                            onChange={(e) => setEditTable(e.target.value)}
                            placeholder="Ej. Mesa 4"
                            className="p-1.5 text-xs rounded-lg border border-slate-200 bg-white w-32"
                          />
                        ) : (
                          <span className="text-slate-600">{tag.table_identifier || '—'}</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                          <Scan className="w-3 h-3 text-slate-400" />
                          {tag.scan_count || 0}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tag.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {tag.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="p-3.5 pr-5 text-right space-x-1.5 whitespace-nowrap">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(tag.id)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              title="Guardar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingTagId(null)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(tag)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Asignar o editar mesa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setSelectedTagForQr(tag)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Ver código QR y descargar"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>

                            <a
                              href={`#/?t=${tag.tag_code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors inline-block"
                              title="Probar pantalla cliente"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <TagSingleModal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        onCreated={loadData}
        restaurants={restaurants}
        defaultRestaurantId={restaurantFilterParam !== 'all' && restaurantFilterParam !== 'unassigned' ? restaurantFilterParam : undefined}
        existingTags={tags}
      />

      <TagBatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onGenerated={loadData}
        restaurants={restaurants}
        defaultRestaurantId={restaurantFilterParam !== 'all' && restaurantFilterParam !== 'unassigned' ? restaurantFilterParam : undefined}
        existingTags={tags}
      />

      <TagQRModal
        isOpen={selectedTagForQr !== null}
        onClose={() => setSelectedTagForQr(null)}
        tag={selectedTagForQr}
      />
    </div>
  );
};

