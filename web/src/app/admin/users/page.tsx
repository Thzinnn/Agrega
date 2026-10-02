"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Shield, Pencil, Trash2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'ADMIN' });

  const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        setUsers(response.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (userToEdit) {
        await api.put(`/admin/users/${userToEdit.id}`, formData);
      } else {
        await api.post('/admin/users', formData);
      }
      setFormData({ name: '', email: '', password: '', role: 'ADMIN' });
      setUserToEdit(null);
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      const axiosError = error as import('axios').AxiosError<{message: string}>;
      alert(axiosError.response?.data?.message || 'Erro ao salvar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (error: unknown) {
      const axiosError = error as import('axios').AxiosError<{message: string}>;
      alert(axiosError.response?.data?.message || 'Erro ao excluir usuário');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Usuários Administrativos</h1>
          <p className="text-brand-muted mt-1">Gerencie os acessos ao painel do Agrega.</p>
        </div>
        <button 
          onClick={() => {
            setUserToEdit(null);
            setFormData({ name: '', email: '', password: '', role: 'ADMIN' });
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-brand-10 text-white rounded-xl font-bold text-sm hover:bg-brand-10/90 transition-colors"
        >
          + Novo Usuário
        </button>
      </div>

      <div className="bg-white border border-brand-30 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-brand-text">
          <thead className="bg-brand-60/50 text-brand-muted uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">E-mail</th>
              <th className="px-6 py-4">Cargo</th>
              <th className="px-6 py-4">Data de Criação</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-30">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-brand-muted">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4 font-bold">{u.name}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3" /> {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(u)}
                        className="p-2 text-brand-muted hover:text-brand-10 hover:bg-brand-60 rounded-lg transition-colors"
                        title="Editar Usuário"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-brand-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-brand-text mb-4">
              {userToEdit ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
            </h2>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-4 py-2 border border-brand-30 rounded-lg focus:ring-2 focus:ring-brand-10 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@empresa.com"
                  className="w-full px-4 py-2 border border-brand-30 rounded-lg focus:ring-2 focus:ring-brand-10 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">
                  {userToEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha temporária'}
                </label>
                <input
                  type="password"
                  required={!userToEdit}
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={userToEdit ? '********' : 'Mínimo 6 caracteres'}
                  className="w-full px-4 py-2 border border-brand-30 rounded-lg focus:ring-2 focus:ring-brand-10 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Permissão (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-brand-30 rounded-lg focus:ring-2 focus:ring-brand-10 outline-none bg-white"
                >
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                  {/* Futuras permissões podem ser adicionadas aqui */}
                  {/* <option value="EDITOR">Editor (Apenas vagas)</option> */}
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-60 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-10 hover:bg-brand-10/90 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                  ) : (
                    userToEdit ? 'Salvar Alterações' : 'Criar Usuário'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
