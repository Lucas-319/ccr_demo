import React from 'react';

interface SettingsActionCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
}

export const SettingsActionCard: React.FC<SettingsActionCardProps> = ({
    title,
    description,
    icon: Icon,
    onClick,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="glass-panel w-full text-left p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300 border border-white/40 dark:border-slate-700"
        >
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
            <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{description}</h3>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
                    <Icon size={22} />
                </div>
            </div>
        </button>
    );
};
