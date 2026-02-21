import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatMonthYear, getGreeting, getFirstName, isSunday } from '../utils';
import { Users, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../config/api';
import { Child, ChildAttendance, SundayCalendarItem, SundayCalendarResponse } from '../types';

const StatCard = ({ title, value, subtitle, icon: Icon, delay, color }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-${color}-500/10 blur-2xl group-hover:bg-${color}-500/20 transition-colors`}></div>
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{value}</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{subtitle}</p>
      </div>
      <div className={`p-3 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [childrenCount, setChildrenCount] = useState(0);
  const [presenceCount, setPresenceCount] = useState(0);
  const [volunteersCount, setVolunteersCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [nextSundays, setNextSundays] = useState<SundayCalendarItem[]>([]);
  const [shiftLabel, setShiftLabel] = useState('Turno da Manhã');

  const formatVolunteerName = (fullName: string) => {
    const firstName = getFirstName(fullName);
    if (firstName.length <= 20) return firstName;
    return `${firstName.slice(0, 17).trimEnd()}...`;
  };

  useEffect(() => {
    const loadStats = async () => {
      const today = new Date();
      const shift = today.getHours() < 15 ? 'MORNING' : 'NIGHT';
      setShiftLabel(shift === 'MORNING' ? 'Turno da Manhã' : 'Turno da Noite');

      try {
        const children = await api.request<Child[]>('/children');
        setChildrenCount(children.length);
        setAlertCount(children.filter((child) => !!child.allergies && child.allergies.trim().length > 0).length);
      } catch (e) {
        setChildrenCount(0);
        setAlertCount(0);
      }

      if (isSunday(today)) {
        try {
          const attendances = await api.request<ChildAttendance[]>(`/children/attendance?start=${formatDate(today)}&shift=${shift}`);
          setPresenceCount(attendances.length);
        } catch (e) {
          setPresenceCount(0);
        }

        try {
          const calendar = await api.request<SundayCalendarResponse>(`/sundays/calendar?month=${formatMonthYear(today)}`);
          const report = calendar.sundays
            .find((item) => item.date === formatDate(today))
            ?.reports.find((r) => r.shift === shift);
          setVolunteersCount(report?.availableUsers.length || 0);
        } catch (e) {
          setVolunteersCount(0);
        }
      } else {
        setPresenceCount(0);
        setVolunteersCount(0);
      }

      try {
        const parsePtDate = (value: string) => {
          const [day, month, year] = value.split('/').map(Number);
          return new Date(year, month - 1, day);
        };

        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const calendar = await api.request<SundayCalendarResponse>(`/sundays/calendar?month=${formatMonthYear(today)}`);
        const upcoming = calendar.sundays
          .filter((item) => parsePtDate(item.date) >= startOfToday)
          .slice(0, 4);

        if (upcoming.length > 0) {
          setNextSundays(upcoming);
        } else {
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          const nextCalendar = await api.request<SundayCalendarResponse>(`/sundays/calendar?month=${formatMonthYear(nextMonth)}`);
          const nextUpcoming = nextCalendar.sundays
            .filter((item) => parsePtDate(item.date) >= startOfToday)
            .slice(0, 4);
          setNextSundays(nextUpcoming);
        }
      } catch (e) {
        setNextSundays([]);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white tracking-tight">
            {getGreeting()}, {getFirstName(user?.name || 'Usuario')} ✨
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Tudo pronto para mais um culto abençoado.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link to="/attendance" className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
            <Calendar size={18} />
            <span>Iniciar Check-in</span>
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Crianças Cadastradas"
          value={childrenCount}
          subtitle="Total na base"
          icon={Users}
          color="primary"
          delay={0.1}
        />
        <StatCard
          title="Presença Hoje"
          value={presenceCount}
          subtitle={shiftLabel}
          icon={TrendingUp}
          color="emerald"
          delay={0.2}
        />
        <StatCard
          title="Voluntários"
          value={volunteersCount}
          subtitle="Disponíveis hoje"
          icon={Calendar}
          color="violet"
          delay={0.3}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">Próximos Domingos</h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">Próximos eventos do calendário</p>
          </div>
          <Link
            to="/sundays"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-full font-medium shadow-lg shadow-primary-600/30 transition-all transform hover:scale-105 whitespace-nowrap"
          >
            <Calendar size={16} />
            Ver calendário
          </Link>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {nextSundays.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              Nenhum domingo disponível no período.
            </div>
          ) : (
            nextSundays.map((sunday, idx) => (
              <motion.div
                key={sunday.date}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/20 dark:to-transparent border border-primary-200/50 dark:border-primary-800/30 hover:border-primary-300 dark:hover:border-primary-700/50 transition-colors"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-base md:text-lg">{sunday.date}</div>
                <div className="flex flex-col gap-1">
                  {sunday.reports.map((report) => (
                    <div key={`${report.date}-${report.shift}`} className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${report.shift === 'MORNING'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                          }`}
                      >
                        {report.shift === 'MORNING' ? 'Manhã' : 'Noite'}
                      </span>
                      {report.availableUsers.length > 0 ? (
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          {report.availableUsers.map(u => formatVolunteerName(u.name)).join(', ')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">Sem voluntários</span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
