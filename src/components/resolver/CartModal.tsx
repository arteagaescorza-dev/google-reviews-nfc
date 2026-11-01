import React, { useState, useEffect } from 'react';
import type { Restaurant, MenuItem, OrderItem } from '../../types';
import { api } from '../../lib/api';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
} from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  tagCode: string;
  tableIdentifier?: string | null;
  onOrderPlaced?: (orderId: string, itemsCount: number) => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  tagCode,
  tableIdentifier,
  onOrderPlaced,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [cart, setCart] = useState<{ [itemId: string]: { item: MenuItem; quantity: number; notes: string } }>({});
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function loadMenu() {
        setLoading(true);
        const items = await api.getMenuItems(restaurant.id);
        setMenuItems(items);
        setLoading(false);
      }
      loadMenu();
      setOrderSuccess(false);
    }
  }, [isOpen, restaurant.id]);

  if (!isOpen) return null;

  const categories = [
    { id: 'todos', label: 'Todo el Menú' },
    { id: 'entradas', label: 'Entradas' },
    { id: 'principales', label: 'Principales' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'postres', label: 'Postres' },
  ];

  const filteredItems = selectedCategory === 'todos'
    ? menuItems
    : menuItems.filter((i) => i.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const current = prev[item.id] || { item, quantity: 0, notes: '' };
      return {
        ...prev,
        [item.id]: {
          ...current,
          quantity: current.quantity + 1,
        },
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: {
          ...current,
          quantity: current.quantity - 1,
        },
      };
    });
  };

  const updateNotes = (itemId: string, notes: string) => {
    setCart((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: {
          ...current,
          notes,
        },
      };
    });
  };

  const cartList = Object.values(cart);
  const totalItems = cartList.reduce((acc, c) => acc + c.quantity, 0);
  const totalAmount = cartList.reduce((acc, c) => acc + c.item.price * c.quantity, 0);

  const handleSendOrder = async () => {
    if (cartList.length === 0) return;
    setIsSubmitting(true);

    const orderItems: OrderItem[] = cartList.map((c) => ({
      menu_item_id: c.item.id,
      name: c.item.name,
      price: c.item.price,
      quantity: c.quantity,
      notes: c.notes.trim() || undefined,
    }));

    const res = await api.createTableOrder({
      restaurant_id: restaurant.id,
      tag_code: tagCode,
      table_number: tableIdentifier || 'Mesa 4',
      items: orderItems,
      total_amount: totalAmount,
      customer_name: customerName.trim() || undefined,
    });

    setIsSubmitting(false);
    if (res.success && res.data) {
      setOrderSuccess(true);
      if (onOrderPlaced) {
        onOrderPlaced(res.data.id, totalItems);
      }
      setTimeout(() => {
        setCart({});
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Menú & Comanda en Mesa
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                  {tableIdentifier || 'Mesa 4'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Pide directo a cocina sin esperar al mesero
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

        {orderSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-black text-slate-900">¡Comanda Enviada a Cocina!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Los chefs ya tienen tu pedido en pantalla. En unos momentos tus platillos estarán listos en tu mesa.
            </p>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Tiempo estimado: 12 - 15 minutos
            </span>
          </div>
        ) : (
          <>
            {/* Filtros de Categorías */}
            <div className="flex gap-1.5 py-3 overflow-x-auto no-scrollbar flex-shrink-0">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === c.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Lista de Platillos (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Cargando platillos...</div>
              ) : filteredItems.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No hay platillos en esta sección</div>
              ) : (
                filteredItems.map((item) => {
                  const qty = cart[item.id]?.quantity || 0;
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition-all flex gap-3"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover flex-shrink-0 shadow-xs"
                        />
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-1">
                              {item.name}
                            </h4>
                            <span className="font-black text-xs text-slate-900 flex-shrink-0">
                              ${item.price} <span className="text-[9px] text-slate-400 font-normal">MXN</span>
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1">
                          <span className="text-[9px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            ~{item.preparation_time_mins || 10} min
                          </span>

                          <div className="flex items-center gap-1.5">
                            {qty > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-bold text-xs text-slate-900 w-4 text-center">
                                  {qty}
                                </span>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow-xs"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{qty > 0 ? 'Agregar' : 'Pedir'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Campo de notas rápidas si ya está en el carrito */}
                        {qty > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200/60">
                            <input
                              type="text"
                              value={cart[item.id]?.notes || ''}
                              onChange={(e) => updateNotes(item.id, e.target.value)}
                              placeholder="Instrucción (ej. Sin cebolla, término medio)..."
                              className="w-full text-[10px] p-1.5 rounded-lg border border-slate-200 bg-white placeholder:text-slate-400"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Barra Inferior del Carrito */}
            <div className="pt-3 border-t border-slate-100 flex-shrink-0 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4 text-orange-600" />
                  <span>{totalItems} platillos seleccionados</span>
                </span>
                <span className="font-black text-sm text-slate-900">
                  Total: ${totalAmount.toLocaleString('es-MX')} MXN
                </span>
              </div>

              {totalItems > 0 && (
                <div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Tu nombre (opcional para el ticket)"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              )}

              <button
                type="button"
                disabled={totalItems === 0 || isSubmitting}
                onClick={handleSendOrder}
                className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Despachando a Cocina...'
                    : totalItems === 0
                    ? 'Selecciona platillos para ordenar'
                    : `Confirmar Comanda ($${totalAmount.toLocaleString('es-MX')} MXN)`}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
