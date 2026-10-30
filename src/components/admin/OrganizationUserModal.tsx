import React, { useState, useEffect } from 'react';
import type { Organization, OrganizationMember, MemberRole } from '../../types';
import { api } from '../../lib/api';
import { X, UserPlus, Copy, Check, Users, KeyRound, Mail } from 'lucide-react';

interface OrganizationUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
  preselectedOrgId?: string;
}

export const OrganizationUserModal: React.FC<OrganizationUserModalProps> = ({
  isOpen,
  onClose,
  organizations,
  preselectedOrgId,
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<MemberRole>('owner');
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  useEffect(() => {
    if (preselectedOrgId) {
      setSelectedOrgId(preselectedOrgId);
    } else if (organizations.length > 0) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [preselectedOrgId, organizations, isOpen]);

  const loadMembers = async (orgId: string) => {
    if (!orgId) return;
    setLoadingMembers(true);
    const list = await api.getOrganizationMembers(orgId);
    setMembers(list);
    setLoadingMembers(false);
  };

  useEffect(() => {
    if (selectedOrgId) {
      loadMembers(selectedOrgId);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [selectedOrgId]);

  if (!isOpen) return null;

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !email || !password) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await api.createOrganizationMember(selectedOrgId, email, password, role);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`¡Usuario ${email} registrado exitosamente!`);
      loadMembers(selectedOrgId);
    } else {
      setErrorMsg(res.error || 'Error creando usuario');
    }
  };

  const currentOrg = organizations.find((o) => o.id === selectedOrgId);

  const getCopyMessage = () => {
    const portalUrl = `${window.location.origin}${window.location.pathname}#/portal/login`;
    return `¡Hola ${currentOrg?.owner_name || 'estimado cliente'}! 👋\nYa tienes acceso a tu Portal de Negocio para ver tus quejas y métricas:\n\n🔗 Entra aquí: ${portalUrl}\n✉️ Correo: ${email}\n🔑 Contraseña: ${password}\n\n(Revisa tu correo para confirmar tu cuenta y acceder).`;
  };

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(getCopyMessage());
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Accesos al Portal de Suscriptores
              </h3>
              <p className="text-xs text-slate-500">
                Gestiona los correos y contraseñas para los dueños de restaurante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Selector de Organización */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Cliente / Organización
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.owner_name})
                </option>
              ))}
            </select>
          </div>

          {/* Formulario de Alta de Usuario */}
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Dar de Alta Nuevo Acceso</span>
            </h4>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{successMsg}</span>
                </p>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCredentials ? '¡Mensaje Copiado!' : 'Copiar Acceso para WhatsApp'}</span>
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Correo del Dueño o Gerente
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gerente@mirestaurante.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Contraseña Provisional
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="flex-1 p-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[11px] font-bold"
                    title="Generar contraseña"
                  >
                    Generar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Rol en el Portal
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as MemberRole)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="owner">👑 Dueño (Acceso Total a Locales)</option>
                  <option value="manager">🧑‍💼 Gerente de Turno</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : 'Registrar y Enviar Activación'}</span>
            </button>
          </form>

          {/* Lista de usuarios con acceso a esta organización */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Usuarios con Acceso a {currentOrg?.name}</span>
            </h4>

            {loadingMembers ? (
              <p className="text-xs text-slate-400 py-3 text-center">Cargando accesos...</p>
            ) : members.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-slate-100">
                Aún no has registrado accesos para este cliente.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {members.map((m) => (
                  <div key={m.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {m.user_email || `Usuario ID: ${m.user_id.slice(0, 8)}...`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Registrado el {new Date(m.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
