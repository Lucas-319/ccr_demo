import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { SettingsActionCard } from '../components/SettingsActionCard';

export const Settings: React.FC = () => {
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Ajustes</h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">Gerencie suas preferencias e seguranca</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsActionCard
                    title="Conta"
                    description="Trocar senha"
                    icon={Lock}
                    onClick={() => setPasswordModalOpen(true)}
                />
            </div>

            <ChangePasswordModal
                open={passwordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
            />
        </div>
    );
};
