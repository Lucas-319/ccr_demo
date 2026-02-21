import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Pencil, Trash2, Plus } from 'lucide-react';
import { api } from '../config/api';
import { User } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { SettingsActionCard } from '../components/SettingsActionCard';

export const Users: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ name: '', login: '', password: '', role: 'USER' as 'ADMIN' | 'USER' });
    const [submitting, setSubmitting] = useState(false);
    const [actionUser, setActionUser] = useState<User | null>(null);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [statusAction, setStatusAction] = useState<'deactivate' | 'reactivate'>('deactivate');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', login: '', password: '', role: 'USER' as 'ADMIN' | 'USER' });

    const loadUsers = async () => {
        try {
            const data = await api.request<User[]>('/users');
            setUsers(data);
            setError('');
        } catch (e) {
            setError('Não foi possível carregar os voluntários.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.request('/users', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            setFormData({ name: '', login: '', password: '', role: 'USER' });
            setCreateModalOpen(false);
            await loadUsers();
        } catch (e) {
            setError('Não foi possível criar o voluntário.');
        } finally {
            setSubmitting(false);
        }
    };

    const activeUsers = users.filter((item) => item.active);
    const inactiveUsers = users.filter((item) => !item.active);

    const sortedActiveUsers = [...activeUsers].sort((a, b) => {
        if (a.role !== b.role) return a.role === 'ADMIN' ? -1 : 1;
        return a.name.localeCompare(b.name, 'pt-BR');
    });

    const sortedInactiveUsers = [...inactiveUsers].sort((a, b) => {
        if (a.role !== b.role) return a.role === 'ADMIN' ? -1 : 1;
        return a.name.localeCompare(b.name, 'pt-BR');
    });

    const isCurrentUser = (candidate: User) => {
        if (!user) return false;
        return String(candidate.id) === String(user.id);
    };

    const openActionModal = (selected: User) => {
        if (user?.role !== 'ADMIN') return;
        setActionUser(selected);
        setActionModalOpen(true);
    };

    const openEditModal = () => {
        if (!actionUser) return;
        setEditForm({
            name: actionUser.name,
            login: actionUser.login,
            password: '',
            role: actionUser.role,
        });
        setActionModalOpen(false);
        setEditModalOpen(true);
    };

    const openStatusModal = (nextStatus: 'deactivate' | 'reactivate') => {
        if (nextStatus === 'deactivate' && actionUser && isCurrentUser(actionUser)) return;
        setStatusAction(nextStatus);
        setActionModalOpen(false);
        setDeleteModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionUser) return;
        setSubmitting(true);
        try {
            const payload = {
                name: editForm.name,
                login: editForm.login,
                role: editForm.role,
                ...(editForm.password.trim() ? { password: editForm.password } : {}),
            };
            await api.request(`/users/${actionUser.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            setEditModalOpen(false);
            await loadUsers();
        } catch (e) {
            setError('Não foi possível atualizar o voluntário.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!actionUser) return;
        if (statusAction === 'deactivate' && isCurrentUser(actionUser)) return;
        setSubmitting(true);
        try {
            await api.request(`/users/${actionUser.id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ active: statusAction === 'reactivate' }),
            });
            setDeleteModalOpen(false);
            await loadUsers();
        } catch (e) {
            setError(statusAction === 'reactivate'
                ? 'Não foi possível reativar o voluntário.'
                : 'Não foi possível inativar o voluntário.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Voluntários</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Cadastro e gestão de voluntários</p>
                </div>
                {user?.role === 'ADMIN' && (
                    <Button onClick={() => setCreateModalOpen(true)} className="bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/30">
                        <Plus size={18} />
                        Novo Voluntário
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            ) : error ? (
                <div className="text-center text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl">
                    {error}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedActiveUsers.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => openActionModal(item)}
                                className={`glass-panel p-5 rounded-2xl border border-white/50 dark:border-slate-700 transition-all ${item.role === 'ADMIN'
                                    ? 'hover:border-amber-300 dark:hover:border-amber-600'
                                    : 'hover:border-slate-300 dark:hover:border-slate-600'
                                    } ${user?.role === 'ADMIN' ? 'cursor-pointer' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.role === 'ADMIN'
                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            }`}>
                                            {item.role === 'ADMIN' ? '👑 Admin' : 'Voluntário'}
                                        </span>
                                        {isCurrentUser(item) && (
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                                                Você
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">@{item.login}</div>
                            </motion.div>
                        ))}
                    </div>

                    {sortedInactiveUsers.length > 0 && (
                        <div className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Voluntários Inativos
                                </span>
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {sortedInactiveUsers.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => openActionModal(item)}
                                        className={`glass-panel p-5 rounded-2xl border border-white/50 dark:border-slate-700 transition-all opacity-70 ${item.role === 'ADMIN'
                                            ? 'hover:border-amber-300 dark:hover:border-amber-600'
                                            : 'hover:border-slate-300 dark:hover:border-slate-600'
                                            } ${user?.role === 'ADMIN' ? 'cursor-pointer' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.role === 'ADMIN'
                                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {item.role === 'ADMIN' ? '👑 Admin' : 'Voluntário'}
                                                </span>
                                                {isCurrentUser(item) && (
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                                                        Você
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">@{item.login}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <Modal
                open={actionModalOpen && !!actionUser}
                onClose={() => setActionModalOpen(false)}
                title={actionUser?.name || 'Voluntário'}
                subtitle={actionUser?.role === 'ADMIN' ? 'Administrador' : 'Voluntário'}
                size="sm"
            >
                <div className="space-y-2">
                    <Button className="w-full" onClick={openEditModal}>
                        <Pencil size={16} />
                        Atualizar registro
                    </Button>
                    {actionUser?.active ? (
                        <Button
                            variant="danger"
                            className="w-full"
                            disabled={!!actionUser && isCurrentUser(actionUser)}
                            onClick={() => {
                                if (actionUser && isCurrentUser(actionUser)) return;
                                openStatusModal('deactivate');
                            }}
                        >
                            <Trash2 size={16} />
                            Inativar voluntário
                        </Button>
                    ) : (
                        <Button variant="success" className="w-full" onClick={() => openStatusModal('reactivate')}>
                            Reativar voluntário
                        </Button>
                    )}
                    {actionUser?.active && actionUser && isCurrentUser(actionUser) && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-1">
                            Você não pode inativar sua própria conta.
                        </div>
                    )}
                </div>
            </Modal>

            <Modal
                open={editModalOpen && !!actionUser}
                onClose={() => setEditModalOpen(false)}
                title="Atualizar voluntário"
                subtitle={actionUser?.name}
                size="md"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nome"
                            placeholder="Nome completo"
                            required
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        <Input
                            label="Login"
                            placeholder="Voluntário"
                            required
                            value={editForm.login}
                            onChange={(e) => setEditForm({ ...editForm, login: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nova senha (opcional)"
                            type="password"
                            placeholder="Deixe em branco para manter"
                            value={editForm.password}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Perfil</label>
                            <select
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'ADMIN' | 'USER' })}
                            >
                                <option value="USER">Voluntário</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting}>Salvar alteracoes</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={deleteModalOpen && !!actionUser}
                onClose={() => setDeleteModalOpen(false)}
                title={statusAction === 'reactivate' ? 'Reativar voluntário?' : 'Inativar voluntário?'}
                subtitle={actionUser
                    ? statusAction === 'reactivate'
                        ? `Confirmar reativação de ${actionUser.name}.`
                        : `Confirmar inativação de ${actionUser.name}. Esta ação pode ser desfeita por um administrador.`
                    : undefined}
                size="sm"
            >
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                    <Button
                        variant={statusAction === 'reactivate' ? 'success' : 'danger'}
                        isLoading={submitting}
                        onClick={handleStatusUpdate}
                    >
                        {statusAction === 'reactivate' ? 'Reativar' : 'Inativar'}
                    </Button>
                </div>
            </Modal>

            {user?.role === 'ADMIN' && !loading && !error && (
                <div className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Ajustes
                        </span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>

                    <div className="mt-4">
                        <SettingsActionCard
                            title="Conta"
                            description="Trocar senha"
                            icon={Lock}
                            onClick={() => setPasswordModalOpen(true)}
                        />
                    </div>
                </div>
            )}

            <ChangePasswordModal
                open={passwordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
            />

            <Modal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Novo Voluntário"
                subtitle="Cadastrar novo voluntário no sistema"
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nome"
                            placeholder="Nome completo"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <Input
                            label="Login"
                            placeholder="Voluntário"
                            required
                            value={formData.login}
                            onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Senha"
                            type="password"
                            placeholder="senha"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Perfil</label>
                            <select
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' })}
                            >
                                <option value="USER">Voluntário</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting}>Cadastrar voluntário</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
