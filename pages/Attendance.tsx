import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Search } from 'lucide-react';
import { api } from '../config/api';
import { Child, ChildAttendance } from '../types';
import { formatMonthYear } from '../utils';
import { Button } from '../components/ui/Button';

export const Attendance: React.FC = () => {
    const [children, setChildren] = useState<Child[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [sundayDates, setSundayDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedShift, setSelectedShift] = useState<'MORNING' | 'NIGHT'>('MORNING');
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingChildId, setUpdatingChildId] = useState<string | null>(null);

    const sortedChildren = useMemo(() => {
        return [...children].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }, [children]);

    const filteredChildren = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return sortedChildren;
        return sortedChildren.filter((child) =>
            child.name.toLowerCase().includes(term) ||
            child.responsibleName.toLowerCase().includes(term)
        );
    }, [searchTerm, sortedChildren]);

    const getDisplayName = (fullName: string): string => {
        const names = fullName.trim().split(/\s+/);
        if (names.length === 1) {
            return names[0];
        }
        return `${names[0]} ${names[names.length - 1]}`;
    };

    const parsePtDate = (value: string) => {
        const [day, month, year] = value.split('/').map(Number);
        return new Date(year, month - 1, day);
    };

    const loadSundays = async () => {
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

    const loadChildren = async () => {
        const data = await api.request<Child[]>('/children');
        setChildren(data);
    };

    const loadAttendance = async (date: string, shift: 'MORNING' | 'NIGHT') => {
        if (!date) return;
        const data = await api.request<ChildAttendance[]>(`/children/attendance?start=${date}&shift=${shift}`);
        const map: Record<string, boolean> = {};
        data.forEach((item) => {
            map[item.child.id] = item.present;
        });
        setAttendanceMap(map);
    };

    useEffect(() => {
        const init = async () => {
            try {
                await Promise.all([loadChildren(), loadSundays()]);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (!selectedDate) return;
        loadAttendance(selectedDate, selectedShift);
    }, [selectedDate, selectedShift]);

    const updateAttendance = async (childId: string, present: boolean) => {
        // Evitar múltiplas requisições simultâneas para o mesmo filho
        if (updatingChildId === childId) return;

        const payload = {
            date: selectedDate,
            shift: selectedShift,
            present,
        };

        setUpdatingChildId(childId);

        try {
            // Verifica se existe registro (comparando com attendanceMap)
            const hasExistingRecord = childId in attendanceMap;

            if (hasExistingRecord) {
                // Usa PUT se já existe registro
                await api.request(`/children/${childId}/attendance`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
            } else {
                // Usa POST se é novo registro
                await api.request(`/children/${childId}/attendance`, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }

            // Recarrega dados após sucesso
            await loadAttendance(selectedDate, selectedShift);
        } catch (e) {
            // Se POST falhar com 409, tenta PUT (fallback)
            if (!(childId in attendanceMap)) {
                try {
                    await api.request(`/children/${childId}/attendance`, {
                        method: 'PUT',
                        body: JSON.stringify(payload),
                    });
                    await loadAttendance(selectedDate, selectedShift);
                } catch (putError) {
                    console.error('Erro ao atualizar presença:', putError);
                }
            }
        } finally {
            setUpdatingChildId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Presença</h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">Marque a presença das crianças por domingo</p>
            </div>

            <div className="glass-panel p-4 md:p-6 rounded-3xl border border-white/50 dark:border-slate-700 bg-gradient-to-r from-primary-50/40 to-transparent dark:from-primary-900/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">Domingo</label>
                        <select
                            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-4 py-3.5 text-base shadow-sm focus:ring-2 focus:ring-primary-500/30"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        >
                            {sundayDates.map((date) => (
                                <option key={date} value={date}>{date}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">Turno</label>
                        <select
                            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-4 py-3.5 text-base shadow-sm focus:ring-2 focus:ring-primary-500/30"
                            value={selectedShift}
                            onChange={(e) => setSelectedShift(e.target.value as 'MORNING' | 'NIGHT')}
                        >
                            <option value="MORNING">🌅 Manhã</option>
                            <option value="NIGHT">🌙 Noite</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Campo de Busca */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome ou responsável..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredChildren.map((child) => {
                        const present = attendanceMap[child.id]; const isUpdating = updatingChildId === child.id; return (
                            <motion.div
                                key={child.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`glass-panel p-5 rounded-2xl border border-white/50 dark:border-slate-700 transition-all ${present === true ? 'border-emerald-400 dark:border-emerald-600 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-900/20 to-white dark:to-slate-900' :
                                    present === false ? 'border-red-400 dark:border-red-600 bg-gradient-to-br from-red-50/50 dark:from-red-900/20 to-white dark:to-slate-900' :
                                        'hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div>
                                        {/* Nome - Desktop mostra completo, Mobile/Tablet mostra primeiro+último */}
                                        <div className="hidden lg:block font-semibold text-slate-800 dark:text-slate-100">{child.name}</div>
                                        <div className="lg:hidden font-semibold text-slate-800 dark:text-slate-100">{getDisplayName(child.name)}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Responsavel: {child.responsibleName}</div>
                                    </div>
                                    {present !== undefined && (
                                        <>
                                            {/* Tablet/iPad - Apenas ícone */}
                                            <div className="hidden md:block lg:hidden text-lg font-bold flex-shrink-0">
                                                <span className={present ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                                    {present ? '✓' : '✗'}
                                                </span>
                                            </div>
                                            {/* Mobile e Desktop - Com texto */}
                                            <div className={`block md:hidden lg:block text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${present ? 'bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200' :
                                                'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                                                }`}>
                                                {present ? '✓ Presente' : '✗ Faltou'}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button
                                        variant={present ? 'primary' : 'secondary'}
                                        className="flex-1"
                                        onClick={() => updateAttendance(child.id, true)}
                                        isLoading={isUpdating}
                                        disabled={isUpdating}
                                    >
                                        <CheckCircle size={16} />
                                        Presente
                                    </Button>
                                    <Button
                                        variant={!present && present !== undefined ? 'danger' : 'secondary'}
                                        className="flex-1"
                                        onClick={() => updateAttendance(child.id, false)}
                                        isLoading={isUpdating}
                                        disabled={isUpdating}
                                    >
                                        <XCircle size={16} />
                                        Faltou
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
