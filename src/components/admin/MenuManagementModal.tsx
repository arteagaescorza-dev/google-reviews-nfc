import React, { useState, useEffect } from 'react';
import type { Restaurant, MenuItem, MenuCategory, KitchenStation } from '../../types';
import { api } from '../../lib/api';
import {
  X,
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  Check,
  AlertCircle,
  ChefHat,
  Eye,
  EyeOff,
} from 'lucide-react';

interface MenuManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant | null;
  userRole?: 'admin' | 'gerente_tienda' | 'capitan_piso' | 'kitchen' | string;
  onMenuUpdated?: () => void;
}

export const MenuManagementModal: React.FC<MenuManagementModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  userRole = 'admin',
  onMenuUpdated,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Estado del formulario de edición / creación de platillo
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(150);
  const [itemTimeMins, setItemTimeMins] = useState<number>(10);
  const [itemStation, setItemStation] = useState<KitchenStation>('cocina');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  // Estado de gestión de categorías
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = async () => {
    if (!restaurant) return;
    setLoading(true);
    const [items, cats] = await Promise.all([
      api.getMenuItems(restaurant.id),
      api.getMenuCategories(restaurant.id),
    ]);
    setMenuItems(items);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && restaurant) {
      loadData();
    }
  }, [isOpen, restaurant]);

  if (!isOpen || !restaurant) return null;

  // Filtrado por categoría activa
  const filteredItems =
    selectedCategory === 'todos'
      ? menuItems
      : menuItems.filter((i) => i.category.toLowerCase() === selectedCategory.toLowerCase());

  // Apertura de modal para nuevo platillo
  const handleOpenNewItem = () => {
    setEditingItemId(null);
    setItemName('');
    setItemCategory(categories[0]?.slug || 'principales');
    setItemPrice(150);
    setItemTimeMins(12);
    setItemStation('cocina');
    setItemImageUrl('');
    setItemDescription('');
    setItemAvailable(true);
    setIsItemFormOpen(true);
  };

  // Apertura de modal para editar platillo existente
  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemPrice(item.price);
    setItemTimeMins(item.preparation_time_mins || 10);
    setItemStation(item.station || 'cocina');
    setItemImageUrl(item.image_url || '');
    setItemDescription(item.description);
    setItemAvailable(item.is_available !== false);
    setIsItemFormOpen(true);
  };

  // Guardar platillo
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      showNotification('El nombre del platillo es obligatorio.', 'error');
      return;
    }
    setSavingItem(true);
    const payload: Partial<MenuItem> = {
      ...(editingItemId ? { id: editingItemId } : {}),
      restaurant_id: restaurant.id,
      name: itemName.trim(),
      category: itemCategory || 'principales',
      price: Number(itemPrice) || 0,
      preparation_time_mins: Number(itemTimeMins) || 10,
      station: itemStation,
      image_url: itemImageUrl.trim() || undefined,
      description: itemDescription.trim(),
      is_available: itemAvailable,
    };

    const res = await api.saveMenuItem(payload);
    setSavingItem(false);

    if (res.success) {
      showNotification(
        editingItemId ? 'Platillo actualizado exitosamente.' : 'Nuevo platillo añadido a la carta.'
      );
      setIsItemFormOpen(false);
      loadData();
      onMenuUpdated?.();
    } else {
      showNotification('Error al guardar el platillo.', 'error');
    }
  };

  // Toggle rápido de disponibilidad (Agotado temporalmente / 86)
  const handleToggleAvailability = async (item: MenuItem) => {
    const nextState = !item.is_available;
    setMenuItems((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, is_available: nextState } : m))
    );
    await api.toggleMenuItemAvailability(item.id, nextState);
    showNotification(
      nextState
        ? `"${item.name}" reactivado en comanda.`
        : `"${item.name}" marcado como Agotado (86).`
    );
    onMenuUpdated?.();
  };

  // Eliminar platillo
  const handleDeleteItem = async (item: MenuItem) => {
    if (window.confirm(`¿Deseas eliminar definitivamente "${item.name}" de la carta?`)) {
      setMenuItems((prev) => prev.filter((m) => m.id !== item.id));
      await api.deleteMenuItem(item.id);
      showNotification(`"${item.name}" eliminado de la carta.`);
      onMenuUpdated?.();
    }
  };

  // Crear categoría
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    const slug = newCategoryName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const res = await api.saveMenuCategory({
      name: newCategoryName.trim(),
      slug,
      restaurant_id: restaurant.id,
      sort_order: categories.length + 1,
    });
    setSavingCategory(false);
    if (res.success) {
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      showNotification('Categoría añadida exitosamente.');
      loadData();
      onMenuUpdated?.();
    }
  };

  // Eliminar categoría
  const handleDeleteCategory = async (cat: MenuCategory) => {
    const itemsCount = menuItems.filter(
      (m) => m.category.toLowerCase() === cat.slug.toLowerCase()
    ).length;
    if (itemsCount > 0) {
      if (
        !window.confirm(
          `La categoría "${cat.name}" contiene ${itemsCount} platillo(s). ¿Deseas eliminarla de todas formas?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    }
    await api.deleteMenuCategory(cat.id);
    showNotification(`Categoría "${cat.name}" eliminada.`);
    loadData();
    onMenuUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Cabecera Bento */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Carta & Menú Digital Interactivo
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                  {restaurant.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                  {userRole === 'kitchen' ? 'Cocina KDS' : userRole === 'capitan_piso' ? 'Capitán de Piso' : userRole === 'gerente_tienda' ? 'Gerencia' : 'Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Edición de platillos, fotografías, precios, tiempos y desactivación rápida de agotados (86).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNewItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Platillo</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificación flotante */}
        {notification && (
          <div
            className={`mx-5 mt-3 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-fadeIn ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Barra de Categorías Dinámicas con Botón de Gestión */}
        <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === 'todos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todo el Menú ({menuItems.length})
            </button>

            {categories.map((cat) => {
              const count = menuItems.filter(
                (m) => m.category.toLowerCase() === cat.slug.toLowerCase()
              ).length;
              return (
                <div key={cat.id} className="inline-flex items-center group">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-3 py-1.5 rounded-l-xl text-xs font-bold transition-all ${
                      selectedCategory === cat.slug
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className={`px-1.5 py-1.5 rounded-r-xl border-l text-xs font-bold transition-all ${
                      selectedCategory === cat.slug
                        ? 'bg-indigo-700 text-indigo-200 border-indigo-500 hover:text-white'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-rose-600 hover:bg-slate-200'
                    }`}
                    title={`Eliminar categoría ${cat.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
            title="Añadir nueva categoría gastronómica"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Categoría</span>
          </button>
        </div>

        {/* Modal interno para Añadir Categoría */}
        {isCategoryModalOpen && (
          <div className="p-4 mx-5 my-2 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-wrap items-center gap-3">
            <span className="text-xs font-extrabold text-indigo-950">Nueva Categoría:</span>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ej: Coctelería, Cortes al Carbón, Ensaladas..."
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-[200px]"
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={savingCategory || !newCategoryName.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {savingCategory ? 'Guardando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Cuerpo del Modal: Lista de Platillos */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Cargando platillos de la sucursal...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 space-y-2">
              <UtensilsCrossed className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">
                No hay platillos registrados en esta categoría.
              </p>
              <button
                type="button"
                onClick={handleOpenNewItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Primer Platillo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredItems.map((item) => {
                const isAvail = item.is_available !== false;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isAvail
                        ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                        : 'bg-slate-50/70 border-rose-200/80 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Fotografía o Placeholder */}
                      <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 relative">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className={`w-full h-full object-cover transition-all ${
                              !isAvail ? 'grayscale brightness-90' : ''
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <UtensilsCrossed className="w-6 h-6" />
                          </div>
                        )}
                        {!isAvail && (
                          <div className="absolute inset-0 bg-rose-900/60 flex items-center justify-center text-[9px] font-black text-white uppercase text-center px-0.5">
                            86 Agotado
                          </div>
                        )}
                      </div>

                      {/* Detalles del Platillo */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                            {item.name}
                          </h4>
                          <span className="font-black text-xs text-emerald-700 whitespace-nowrap bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            ${Number(item.price).toFixed(2)} MXN
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description || 'Sin descripción ingresada.'}
                        </p>

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-slate-400" />
                            ~{item.preparation_time_mins || 10} min
                          </span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded uppercase border border-indigo-100">
                            {item.category}
                          </span>
                          {item.station && (
                            <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded uppercase border border-orange-100">
                              KDS: {item.station}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Barra de Acciones del Platillo */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {/* Switch Rápido: Disponible vs Agotado (86) */}
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                          isAvail
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Cambiar estado de disponibilidad inmediata en comanda"
                      >
                        {isAvail ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Disponible en Sala</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                            <span>Agotado Temporalmente (86)</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditItem(item)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                          title="Editar detalles y precio"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
                          title="Eliminar de la carta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Formulario Modal / Drawer para Crear o Editar Platillo */}
        {isItemFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {editingItemId ? 'Editar Platillo' : 'Nuevo Platillo para Carta'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsItemFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-5 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">
                    Nombre del Platillo *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Ej: Carpaccio de Res Trufado"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">
                      Categoría *
                    </label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">
                      Precio ($ MXN) *
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="number"
                        required
                        min={0}
                        step="0.5"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">
                      Tiempo Preparación (min)
                    </label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="number"
                        min={1}
                        value={itemTimeMins}
                        onChange={(e) => setItemTimeMins(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">
                      Estación KDS Destino
                    </label>
                    <select
                      value={itemStation}
                      onChange={(e) => setItemStation(e.target.value as KitchenStation)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="cocina">Cocina Caliente</option>
                      <option value="barra">Barra & Coctelería</option>
                      <option value="postres">Repostería & Café</option>
                      <option value="barista">Barista</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>URL de Fotografía</span>
                    {itemImageUrl && (
                      <span className="text-[10px] text-indigo-600 font-semibold">Vista previa activa</span>
                    )}
                  </label>
                  <input
                    type="url"
                    value={itemImageUrl}
                    onChange={(e) => setItemImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {itemImageUrl && (
                    <div className="mt-2 w-full h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={itemImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">
                    Descripción Gastronómica
                  </label>
                  <textarea
                    rows={2}
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Ingredientes clave, preparación o maridaje sugerido..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-extrabold text-slate-700">Disponible para Pedir en Mesa</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemAvailable}
                      onChange={(e) => setItemAvailable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsItemFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingItem}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors disabled:opacity-50"
                  >
                    {savingItem ? 'Guardando...' : editingItemId ? 'Guardar Cambios' : 'Añadir a la Carta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer Bento */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total: {menuItems.length} platillos en {categories.length} categorías registradas.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-all shadow-2xs"
          >
            Cerrar Administrador
          </button>
        </div>
      </div>
    </div>
  );
};
