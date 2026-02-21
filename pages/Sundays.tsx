import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarPlus, CheckCircle, X, UserPlus, Search } from 'lucide-react';
import { api } from '../config/api';
import { SundayCalendarResponse, SundayReport, Child } from '../types';
import { formatMonthYear, isPastDate, isFutureMonth } from '../utils';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

export const Sundays: React.FC = () => {
    const { user } = useAuth();
    const [monthDate, setMonthDate] = useState(new Date());
    const [calendar, setCalendar] = useState<SundayCalendarResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [children, setChildren] = useState<Child[]>([]);

    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedShift, setSelectedShift] = useState<'MORNING' | 'NIGHT'>('MORNING');
    const [selectedChildId, setSelectedChildId] = useState('');
    const [present, setPresent] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState('');
    const [reportData, setReportData] = useState<SundayReport[]>([]);
    const [reportMeta, setReportMeta] = useState<{ date: string; shift: 'MORNING' | 'NIGHT' } | null>(null);
    const [removeModalOpen, setRemoveModalOpen] = useState(false);
    const [removeTarget, setRemoveTarget] = useState<{ date: string; shift: 'MORNING' | 'NIGHT'; userId: string; userName: string } | null>(null);
    const [removeAttendanceModalOpen, setRemoveAttendanceModalOpen] = useState(false);
    const [removeAttendanceTarget, setRemoveAttendanceTarget] = useState<{ childId: string; childName: string; date: string; shift: 'MORNING' | 'NIGHT' } | null>(null);
    const [monthlyReportModalOpen, setMonthlyReportModalOpen] = useState(false);
    const [monthlyReportData, setMonthlyReportData] = useState<SundayCalendarResponse | null>(null);
    const [monthlyReportLoading, setMonthlyReportLoading] = useState(false);
    const [childSearchTerm, setChildSearchTerm] = useState('');

    const getScrollContainer = (): HTMLElement | null => {
        return (document.querySelector('main') as HTMLElement | null) ?? (document.scrollingElement as HTMLElement | null);
    };

    const captureScrollTop = (): number => {
        const el = getScrollContainer();
        if (el) return el.scrollTop;
        return window.scrollY;
    };

    const restoreScrollTop = (top: number) => {
        const el = getScrollContainer();
        if (el) {
            el.scrollTop = top;
            return;
        }
        window.scrollTo(0, top);
    };

    const monthLabel = useMemo(() => {
        return monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }, [monthDate]);

    const sortedChildren = useMemo(() => {
        return [...children].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }, [children]);

    const filteredChildren = useMemo(() => {
        const term = childSearchTerm.trim().toLowerCase();
        if (!term) return sortedChildren;
        return sortedChildren.filter((child) => child.name.toLowerCase().includes(term));
    }, [childSearchTerm, sortedChildren]);

    const formatNamesLimited = (names: string[], maxChars: number) => {
        const joined = names.join(', ');
        if (joined.length <= maxChars) return joined;
        return `${joined.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
    };

    const checkAttendanceExists = (childId: string, date: string, shift: 'MORNING' | 'NIGHT'): boolean => {
        if (!calendar) return false;
        const sunday = calendar.sundays.find((s) => s.date === date);
        if (!sunday) return false;
        const report = sunday.reports.find((r) => r.shift === shift);
        if (!report) return false;
        return report.attendances.some((att) => att.child.id === childId);
    };

    const fetchReport = async (date: string, shift: 'MORNING' | 'NIGHT') => {
        setReportLoading(true);
        setReportError('');
        try {
            const data = await api.request<SundayReport[]>(`/sundays/report?start=${date}&end=${date}&shift=${shift}`);
            setReportData(data);
        } catch (e) {
            setReportData([]);
            setReportError('Não foi possível carregar o relatório do domingo.');
        } finally {
            setReportLoading(false);
        }
    };

    const loadCalendar = async () => {
        const scrollTop = captureScrollTop();
        if (!calendar) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }
        try {
            const data = await api.request<SundayCalendarResponse>(`/sundays/calendar?month=${formatMonthYear(monthDate)}`);
            setCalendar(data);
            setError('');
        } catch (e) {
            setError('Não foi possível carregar o calendário.');
        } finally {
            setLoading(false);
            setRefreshing(false);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    restoreScrollTop(scrollTop);
                });
            });
        }
    };

    const loadChildren = async () => {
        try {
            const data = await api.request<Child[]>('/children');
            setChildren(data);
        } catch (e) {
            setChildren([]);
        }
    };

    useEffect(() => {
        loadCalendar();
    }, [monthDate]);

    useEffect(() => {
        loadChildren();
    }, []);

    useEffect(() => {
        if (!attendanceModalOpen) return;
        const nextId = filteredChildren[0]?.id || '';
        setSelectedChildId(nextId);
    }, [attendanceModalOpen, filteredChildren]);

    const handleAvailability = async (date: string, shift: 'MORNING' | 'NIGHT', isAvailable: boolean) => {
        try {
            if (isAvailable) {
                await api.request(`/sundays?date=${date}&shift=${shift}`, { method: 'DELETE' });
            } else {
                await api.request('/sundays', {
                    method: 'POST',
                    body: JSON.stringify({ date, shift }),
                });
            }
            await loadCalendar();
        } catch (e) {
            setError('Não foi possível atualizar a disponibilidade.');
        }
    };

    const openReportModal = (date: string, shift: 'MORNING' | 'NIGHT') => {
        setReportMeta({ date, shift });
        setReportModalOpen(true);
        fetchReport(date, shift);
    };

    const openRemoveModal = (date: string, shift: 'MORNING' | 'NIGHT', userId: string, userName: string) => {
        setRemoveTarget({ date, shift, userId, userName });
        setRemoveModalOpen(true);
    };

    const confirmRemoveAvailability = async () => {
        if (!removeTarget) return;
        try {
            await api.request(`/sundays?date=${removeTarget.date}&shift=${removeTarget.shift}&userId=${removeTarget.userId}`, { method: 'DELETE' });
            await loadCalendar();
            if (reportMeta && reportMeta.date === removeTarget.date && reportMeta.shift === removeTarget.shift) {
                await fetchReport(removeTarget.date, removeTarget.shift);
            }
        } catch (e) {
            setError('Não foi possível remover a disponibilidade.');
        } finally {
            setRemoveModalOpen(false);
            setRemoveTarget(null);
        }
    };

    const openRemoveAttendanceModal = (childId: string, childName: string, date: string, shift: 'MORNING' | 'NIGHT') => {
        setRemoveAttendanceTarget({ childId, childName, date, shift });
        setRemoveAttendanceModalOpen(true);
    };

    const confirmRemoveAttendance = async () => {
        if (!removeAttendanceTarget) return;
        try {
            const payload = {
                date: removeAttendanceTarget.date,
                shift: removeAttendanceTarget.shift,
                present: false,
            };
            await api.request(`/children/${removeAttendanceTarget.childId}/attendance`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            await loadCalendar();
            if (reportMeta && reportMeta.date === removeAttendanceTarget.date && reportMeta.shift === removeAttendanceTarget.shift) {
                await fetchReport(removeAttendanceTarget.date, removeAttendanceTarget.shift);
            }
        } catch (e) {
            setError('Não foi possível remover a presença.');
        } finally {
            setRemoveAttendanceModalOpen(false);
            setRemoveAttendanceTarget(null);
        }
    };

    const openAttendanceModal = (date: string, shift: 'MORNING' | 'NIGHT') => {
        setSelectedDate(date);
        setSelectedShift(shift);
        setChildSearchTerm('');
        setSelectedChildId(sortedChildren[0]?.id || '');
        setPresent(true);
        setAttendanceModalOpen(true);
    };

    const handleAttendanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChildId || !selectedDate) return;
        setSubmitting(true);
        const payload = { date: selectedDate, shift: selectedShift, present };

        // Verifica se já existe presença registrada para decidir entre POST ou PUT
        const attendanceExists = checkAttendanceExists(selectedChildId, selectedDate, selectedShift);
        const method = attendanceExists ? 'PUT' : 'POST';

        try {
            await api.request(`/children/${selectedChildId}/attendance`, {
                method,
                body: JSON.stringify(payload),
            });
            setAttendanceModalOpen(false);
            // Recarrega dados
            await loadCalendar();
            if (reportModalOpen && reportMeta) {
                await fetchReport(reportMeta.date, reportMeta.shift);
            }
        } catch (error) {
            setError('Não foi possível registrar a presença.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Domingos</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Disponibilidade e presenças do mês</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>
                        Mês anterior
                    </Button>
                    <Button variant="secondary" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>
                        Próximo mês
                    </Button>
                    {user?.role === 'ADMIN' && (
                        <Button variant="primary" onClick={async () => {
                            setMonthlyReportModalOpen(true);
                            setMonthlyReportLoading(true);
                            try {
                                const data = await api.request<SundayCalendarResponse>(`/sundays/calendar?month=${formatMonthYear(monthDate)}`);
                                setMonthlyReportData(data);
                            } catch (e) {
                                setMonthlyReportData(null);
                            } finally {
                                setMonthlyReportLoading(false);
                            }
                        }}>
                            Relatório Mensal
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-bold text-primary-600 dark:text-primary-400 capitalize">{monthLabel}</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-primary-500 via-emerald-500 to-violet-500 rounded-full"></div>
            </div>

            {!!error && (
                <div className="text-center text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl">
                    {error}
                </div>
            )}

            {loading && !calendar ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {calendar?.sundays.map((sunday) => (
                        <div key={sunday.date} className="glass-panel p-5 rounded-2xl border border-white/50 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="font-semibold text-slate-800 dark:text-slate-100">{sunday.date}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{sunday.reports.length} turnos</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {sunday.reports.map((report) => {
                                    const isAvailable = report.availableUsers.some((u) => u.name === user?.name);
                                    const isPast = isPastDate(report.date);
                                    const isFuture = isFutureMonth(monthDate);
                                    const isFull = report.remainingSlots === 0 && !isAvailable;
                                    const shouldDisableAvailability = isPast || (isFull && !isAvailable);
                                    const shouldDisableAttendance = isPast || isFuture;
                                    const attendingChildren = children.filter((child) =>
                                        report.attendances.some((att) => att.child.id === child.id && att.present)
                                    ) || [];
                                    const attendingNames = attendingChildren
                                        .map((child) => child.name)
                                        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

                                    return (
                                        <div
                                            key={`${report.date}-${report.shift}`}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => openReportModal(report.date, report.shift)}
                                            className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="font-bold text-lg text-slate-700 dark:text-slate-200">
                                                    {report.shift === 'MORNING' ? '🌅 Manhã' : '🌙 Noite'}
                                                </div>
                                                <div className={`text-xs font-semibold px-2 py-1 rounded-full ${report.remainingSlots === 0
                                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                    }`}>
                                                    {report.availableUsers.length} disponíveis
                                                </div>
                                            </div>

                                            {report.availableUsers.length > 0 && (
                                                <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Voluntários:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {report.availableUsers.map((userItem) => (
                                                            <span
                                                                key={userItem.id}
                                                                onClick={(event) => {
                                                                    if (user?.role === 'ADMIN') {
                                                                        event.stopPropagation();
                                                                        openRemoveModal(report.date, report.shift, userItem.id, userItem.name);
                                                                    }
                                                                }}
                                                                className={`text-sm px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full inline-flex items-center gap-1 ${user?.role === 'ADMIN' ? 'cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-900/50' : ''
                                                                    }`}
                                                            >
                                                                {userItem.name}
                                                                {user?.role === 'ADMIN' && (
                                                                    <X size={14} className="ml-0.5" />
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {attendingNames.length > 0 && (
                                                <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Crianças presentes:</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                                        {formatNamesLimited(attendingNames, 60)}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-3 flex flex-col gap-2">
                                                <Button
                                                    variant={isAvailable ? 'danger' : 'primary'}
                                                    className="w-full"
                                                    disabled={shouldDisableAvailability}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleAvailability(report.date, report.shift, isAvailable);
                                                    }}
                                                >
                                                    <CalendarPlus size={16} />
                                                    {isAvailable ? 'Cancelar disponibilidade' : isFull ? 'Vagas esgotadas' : 'Marcar disponibilidade'}
                                                </Button>
                                                <Button
                                                    variant="success"
                                                    className="w-full"
                                                    disabled={shouldDisableAttendance}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openAttendanceModal(report.date, report.shift);
                                                    }}
                                                >
                                                    <CheckCircle size={16} />
                                                    Registrar presença
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                open={attendanceModalOpen}
                onClose={() => {
                    setAttendanceModalOpen(false);
                    setChildSearchTerm('');
                }}
                title="Registrar presença"
                subtitle={`${selectedDate} - ${selectedShift === 'MORNING' ? 'Manhã' : 'Noite'}`}
                size="md"
            >
                <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Buscar criança</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Digite o nome da criança..."
                                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={childSearchTerm}
                                onChange={(e) => setChildSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Criança</label>
                        <select
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={selectedChildId}
                            onChange={(e) => setSelectedChildId(e.target.value)}
                            required
                        >
                            {filteredChildren.length === 0 ? (
                                <option value="" disabled>Nenhuma criança encontrada</option>
                            ) : (
                                filteredChildren.map((child) => (
                                    <option key={child.id} value={child.id}>{child.name}</option>
                                ))
                            )}
                        </select>
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
                        <Button type="submit" isLoading={submitting}>
                            <UserPlus size={16} />
                            Salvar presença
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={reportModalOpen && !!reportMeta}
                onClose={() => setReportModalOpen(false)}
                title="Relatório do Domingo"
                subtitle={reportMeta ? `${reportMeta.date} - ${reportMeta.shift === 'MORNING' ? 'Manhã' : 'Noite'}` : undefined}
                size="lg"
            >
                {reportLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : reportError ? (
                    <div className="text-center text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl">
                        {reportError}
                    </div>
                ) : reportData.length === 0 ? (
                    <div className="text-center text-sm text-slate-500 dark:text-slate-400 p-4">
                        Nenhum dado encontrado para este turno.
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Voluntários disponíveis</h3>
                            {reportData[0].availableUsers.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum voluntário marcado.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {reportData[0].availableUsers.map((userItem) => (
                                        <span
                                            key={userItem.id}
                                            onClick={() => {
                                                if (user?.role === 'ADMIN' && reportMeta) {
                                                    openRemoveModal(reportMeta.date, reportMeta.shift, userItem.id, userItem.name);
                                                }
                                            }}
                                            className={`text-sm px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full inline-flex items-center gap-1 ${user?.role === 'ADMIN' ? 'cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-900/50' : ''
                                                }`}
                                        >
                                            {userItem.name}
                                            {user?.role === 'ADMIN' && (
                                                <X size={14} className="ml-0.5" />
                                            )}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Presenças registradas</h3>
                            {reportData[0].attendances.filter(att => att.present).length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma presença registrada.</p>
                            ) : (
                                <div className="space-y-2">
                                    {reportData[0].attendances
                                        .filter(attendance => attendance.present)
                                        .sort((a, b) => a.child.name.localeCompare(b.child.name, 'pt-BR'))
                                        .map((attendance) => (
                                            <div
                                                key={`${attendance.child.id}-${attendance.date}-${attendance.shift}`}
                                                onClick={() => openRemoveAttendanceModal(attendance.child.id, attendance.child.name, attendance.date, attendance.shift)}
                                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                            >
                                                <div className="text-sm text-slate-700 dark:text-slate-200">
                                                    {attendance.child.name}
                                                </div>
                                                <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2 py-1 rounded-full">
                                                    Presente
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                open={removeModalOpen && !!removeTarget}
                onClose={() => setRemoveModalOpen(false)}
                title="Remover disponibilidade?"
                subtitle={removeTarget ? `Confirmar remoção de ${removeTarget.userName} em ${removeTarget.date} (${removeTarget.shift === 'MORNING' ? 'Manhã' : 'Noite'}).` : undefined}
                size="sm"
            >
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setRemoveModalOpen(false)}>Cancelar</Button>
                    <Button variant="danger" onClick={confirmRemoveAvailability}>Remover</Button>
                </div>
            </Modal>

            <Modal
                open={removeAttendanceModalOpen && !!removeAttendanceTarget}
                onClose={() => setRemoveAttendanceModalOpen(false)}
                title="Remover presença?"
                subtitle={removeAttendanceTarget ? `Confirmar remoção da presença de ${removeAttendanceTarget.childName}?` : undefined}
                size="sm"
            >
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setRemoveAttendanceModalOpen(false)}>Cancelar</Button>
                    <Button variant="danger" onClick={confirmRemoveAttendance}>Remover</Button>
                </div>
            </Modal>

            <Modal
                open={monthlyReportModalOpen}
                onClose={() => setMonthlyReportModalOpen(false)}
                title="Relatório Mensal"
                subtitle={`Relatório completo de ${monthLabel}`}
                size="lg"
            >
                {monthlyReportLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : !monthlyReportData ? (
                    <div className="text-center text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl">
                        Erro ao carregar relatório mensal.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {monthlyReportData.sundays.map((sunday) => (
                            <div key={sunday.date} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3">{sunday.date}</h3>
                                <div className="space-y-3">
                                    {sunday.reports.map((report) => (
                                        <div key={`${report.date}-${report.shift}`} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {report.shift === 'MORNING' ? '🌅 Manhã' : '🌙 Noite'}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${report.remainingSlots === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>
                                                    {report.availableUsers.length} voluntário(s)
                                                </span>
                                            </div>
                                            {report.availableUsers.length > 0 && (
                                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                    <strong>Voluntários:</strong> {report.availableUsers.map(u => u.name).join(', ')}
                                                </div>
                                            )}
                                            {report.attendances.filter(att => att.present).length > 0 && (
                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                    <strong>Crianças presentes:</strong> {report.attendances
                                                        .filter(att => att.present)
                                                        .map(att => att.child.name)
                                                        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
                                                        .join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
};
