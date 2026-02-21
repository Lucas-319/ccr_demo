import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { api } from '../config/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';

interface ChangePasswordModalProps {
    open: boolean;
    onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowCurrent(false);
            setShowNew(false);
            setShowConfirm(false);
            setError('');
            setSuccess('');
            setSubmitting(false);
        }
    }, [open]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('As senhas novas não conferem.');
            return;
        }

        setSubmitting(true);
        try {
            await api.request('/users/me/password', {
                method: 'PUT',
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });
            setSuccess('Senha atualizada com sucesso.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e) {
            const status = e?.status;
            const msg = String(e?.message ?? '').toLowerCase();

            if (
                status === 400 &&
                (msg.includes('current password') ||
                    msg.includes('senha atual'))
            ) {
                setError('Senha atual incorreta. Tente novamente.');
                return;
            }

            setError('Não foi possível atualizar a senha. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Trocar senha"
            subtitle="Atualize sua senha de acesso"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Senha atual"
                    type={showCurrent ? 'text' : 'password'}
                    icon={<Lock size={16} />}
                    rightIcon={showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    rightIconAriaLabel={showCurrent ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                    onRightIconClick={() => setShowCurrent((prev) => !prev)}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                />
                <Input
                    label="Nova senha"
                    type={showNew ? 'text' : 'password'}
                    icon={<Lock size={16} />}
                    rightIcon={showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    rightIconAriaLabel={showNew ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                    onRightIconClick={() => setShowNew((prev) => !prev)}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <Input
                    label="Confirmar nova senha"
                    type={showConfirm ? 'text' : 'password'}
                    icon={<Lock size={16} />}
                    rightIcon={showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    rightIconAriaLabel={showConfirm ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                    onRightIconClick={() => setShowConfirm((prev) => !prev)}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-xl">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl">
                        {success}
                    </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" isLoading={submitting}>Atualizar senha</Button>
                </div>
            </form>
        </Modal>
    );
};
