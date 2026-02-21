import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, User, Phone, AlertTriangle, Pencil } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { api } from '../config/api';
import { Child, ChildAttendance } from '../types';
import { formatMonthYear, playSound } from '../utils';

export const Children: React.FC = () => {
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', responsibleName: '', responsibleContact: '', allergies: '' });
    const [submitting, setSubmitting] = useState(false);
    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
    const [attendanceChild, setAttendanceChild] = useState<Child | null>(null);
    const [sundayDates, setSundayDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedShift, setSelectedShift] = useState<'MORNING' | 'NIGHT'>('MORNING');
    const [present, setPresent] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '', responsibleName: '', responsibleContact: '', allergies: '' });

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            const data = await api.request<Child[]>('/children');
            setChildren(data);
            setError('');
        } catch (error) {
            console.error(error);
            setError('Não foi possível carregar as crianças.');
        } finally {
            setLoading(false);
        }
    };

    const filteredChildren = children.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.responsibleName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedChildren = [...filteredChildren].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR')
    );

    const parsePtDate = (value: string) => {
        const [day, month, year] = value.split('/').map(Number);
        return new Date(year, month - 1, day);
    };

    const loadSundayDates = async () => {
        const now = new Date();
        const currentMonth = formatMonthYear(now);
        const data = await api.request<{ sundays: { date: string }[] }>(`/sundays/calendar?month=${currentMonth}`);
        const upcoming = data.sundays
            .map((item) => item.date)
            .filter((date) => parsePtDate(date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()));

        if (upcoming.length > 0) {
            setSundayDates(upcoming);
            setSelectedDate(upcoming[0]);
            return;
        }

        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonthValue = formatMonthYear(nextMonth);
        const nextData = await api.request<{ sundays: { date: string }[] }>(`/sundays/calendar?month=${nextMonthValue}`);
        const nextDates = nextData.sundays.map((item) => item.date);
        setSundayDates(nextDates);
        setSelectedDate(nextDates[0] || '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const submitData = {
                ...formData,
                allergies: formData.allergies.trim() === '' ? 'N/A' : formData.allergies
            };
            await api.request('/children', { method: 'POST', body: JSON.stringify(submitData) });
            playSound('success');
            setIsModalOpen(false);
            setFormData({ name: '', responsibleName: '', responsibleContact: '', allergies: '' });
            fetchChildren();
        } catch (e) {
            playSound('error');
        } finally {
            setSubmitting(false);
        }
    };

    const openAttendanceModal = async (child: Child) => {
        setAttendanceChild(child);
        setSelectedShift('MORNING');
        setPresent(true);
        setAttendanceModalOpen(true);
        try {
            await loadSundayDates();
        } catch (e) {
            setSundayDates([]);
        }
    };

    const openEditModal = (child: Child) => {
        setEditingChild(child);
        setEditFormData({
            name: child.name,
            responsibleName: child.responsibleName,
            responsibleContact: child.responsibleContact,
            allergies: child.allergies || '',
        });
        setEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChild) return;
        setSubmitting(true);
        try {
            const submitData = {
                ...editFormData,
                allergies: editFormData.allergies.trim() === '' ? 'N/A' : editFormData.allergies
            };
            await api.request(`/children/${editingChild.id}`, { method: 'PUT', body: JSON.stringify(submitData) });
            playSound('success');
            setEditModalOpen(false);
            setEditingChild(null);
            fetchChildren();
        } catch (e) {
            playSound('error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAttendanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!attendanceChild || !selectedDate) return;
        setAttendanceSubmitting(true);
        const payload = {
            date: selectedDate,
            shift: selectedShift,
            present,
        };

        const attendanceExists = async () => {
            const data = await api.request<ChildAttendance[]>(`/children/attendance?start=${selectedDate}&shift=${selectedShift}`);
            return data.some((item) => String(item.child.id) === String(attendanceChild.id));
        };

        try {
            const exists = await attendanceExists();
            await api.request(`/children/${attendanceChild.id}/attendance`, {
                method: exists ? 'PUT' : 'POST',
                body: JSON.stringify(payload),
            });
            playSound('success');
            setAttendanceModalOpen(false);
        } catch (error) {
            playSound('error');
        } finally {
            setAttendanceSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Crianças</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Gerencie o cadastro dos pequenos</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/30">
                    <Plus size={18} />
                    Nova Criança
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome ou responsável..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-none shadow-sm focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {sortedChildren.map((child) => (
                            <motion.div
                                layout
                                key={child.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('button')) {
                                        openEditModal(child);
                                    }
                                }}
                                className="glass-panel p-5 rounded-2xl border border-white/50 dark:border-slate-700 hover:shadow-lg transition-all group cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold">
                                        {child.name.charAt(0)}
                                    </div>
                                    {child.allergies && child.allergies.trim() !== '' && child.allergies.toLowerCase() !== 'n/a' && (
                                        <div className="text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                                            <AlertTriangle size={12} />
                                            <span>Alergia/Observação</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">
                                        {child.name}
                                    </h3>
                                    <Pencil size={16} className="text-slate-400 dark:text-slate-500" />
                                </div>
                                <div className="space-y-1 mt-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <User size={14} />
                                        <span>{child.responsibleName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <Phone size={14} />
                                        <span>{child.responsibleContact}</span>
                                    </div>
                                    {child.allergies && child.allergies.trim() !== '' && child.allergies.toLowerCase() !== 'n/a' && (
                                        <div className="flex items-start gap-2 text-sm mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                                            <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-amber-700 dark:text-amber-300 font-medium">{child.allergies}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="secondary" className="w-full" onClick={() => openAttendanceModal(child)}>
                                        Dar Presença
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Cadastro"
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nome da Criança"
                        placeholder="Ex: Miguel Silva"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Responsável"
                            placeholder="Nome"
                            required
                            value={formData.responsibleName}
                            onChange={e => setFormData({ ...formData, responsibleName: e.target.value })}
                        />
                        <Input
                            label="Telefone"
                            placeholder="(00) 00000-0000"
                            required
                            value={formData.responsibleContact}
                            onChange={e => setFormData({ ...formData, responsibleContact: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Alergias / Observações"
                        placeholder="Nenhuma..."
                        value={formData.allergies}
                        onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                    />

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting}>Salvar Cadastro</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={attendanceModalOpen && !!attendanceChild}
                onClose={() => setAttendanceModalOpen(false)}
                title="Dar Presença"
                subtitle={attendanceChild?.name}
                size="md"
            >
                <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Domingo</label>
                            <select
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                            >
                                {sundayDates.map((date) => (
                                    <option key={date} value={date}>{date}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Turno</label>
                            <select
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={selectedShift}
                                onChange={(e) => setSelectedShift(e.target.value as 'MORNING' | 'NIGHT')}
                            >
                                <option value="MORNING">Manhã</option>
                                <option value="NIGHT">Noite</option>
                            </select>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <input
                            type="checkbox"
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            checked={present}
                            onChange={(e) => setPresent(e.target.checked)}
                        />
                        Presente
                    </label>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setAttendanceModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={attendanceSubmitting}>Salvar Presença</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={editModalOpen && !!editingChild}
                onClose={() => setEditModalOpen(false)}
                title="Editar Criança"
                subtitle={editingChild?.name}
                size="md"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <Input
                        label="Nome da Criança"
                        placeholder="Ex: Miguel Silva"
                        required
                        value={editFormData.name}
                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Responsável"
                            placeholder="Nome"
                            required
                            value={editFormData.responsibleName}
                            onChange={e => setEditFormData({ ...editFormData, responsibleName: e.target.value })}
                        />
                        <Input
                            label="Telefone"
                            placeholder="(00) 00000-0000"
                            required
                            value={editFormData.responsibleContact}
                            onChange={e => setEditFormData({ ...editFormData, responsibleContact: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Alergias / Observações"
                        placeholder="Nenhuma..."
                        value={editFormData.allergies}
                        onChange={e => setEditFormData({ ...editFormData, allergies: e.target.value })}
                    />

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting}>Salvar Alterações</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
