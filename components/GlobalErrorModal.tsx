import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';

interface ApiErrorDetail {
    message: string;
    status?: number;
    action?: 'login';
    details?: string[];
}

const getTitle = (detail: ApiErrorDetail | null) => {
    if (!detail) return 'Erro';
    if (detail.action === 'login') return 'Sessão expirada';
    if (detail.status === 400) return 'Dados inválidos';
    if (detail.status === 401) return 'Não autorizado';
    if (detail.status === 403) return 'Acesso negado';
    if (detail.status === 404) return 'Não encontrado';
    if (detail.status === 409) return 'Conflito de dados';
    if (detail.status === 500) return 'Erro interno';
    if (detail.status) return `Erro ${detail.status}`;
    return 'Erro';
};

const getSubtitle = (detail: ApiErrorDetail | null) => {
    if (!detail) return undefined;
    if (detail.action === 'login') {
        return 'Sua sessão expirou. Faça login novamente para continuar.';
    }
    if (detail.status === 400) {
        return detail.message || 'Não foi possível processar a requisição. Verifique os campos e tente novamente.';
    }
    if (detail.status === 401) {
        return detail.message || 'Sua sessão não é válida para esta ação. Faça login novamente e tente de novo.';
    }
    if (detail.status === 403) {
        const base = detail.message || 'Você não tem permissão para executar esta ação.';
        return `${base} Procure um Administrador.`;
    }
    if (detail.status === 404) {
        return detail.message || 'Recurso não encontrado. Verifique se os dados estão corretos.';
    }
    if (detail.status === 409) {
        return detail.message || 'Conflito de dados. Verifique se ja existe um registro semelhante.';
    }
    if (detail.status === 500) {
        return detail.message || 'Ocorreu um erro inesperado no servidor. Tente novamente mais tarde.';
    }
    return detail.message;
};

export const GlobalErrorModal: React.FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [detail, setDetail] = useState<ApiErrorDetail | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = (event: Event) => {
            const customEvent = event as CustomEvent<ApiErrorDetail>;

            // Na tela de login, nenhum modal de erro deve aparecer.
            // Os erros sao exibidos inline na propria tela.
            if (pathname === '/login') {
                return;
            }

            setDetail(customEvent.detail);
            setOpen(true);
        };

        window.addEventListener('api-error', handler as EventListener);
        return () => window.removeEventListener('api-error', handler as EventListener);
    }, [pathname]);

    const handleClose = () => {
        setOpen(false);
        const shouldGoLogin = detail?.action === 'login' || detail?.status === 403;
        if (shouldGoLogin) {
            logout();
            navigate('/login', { replace: true });
        }
        setDetail(null);
    };

    return (
        <Modal
            open={open && !!detail}
            onClose={handleClose}
            title={getTitle(detail)}
            subtitle={getSubtitle(detail)}
            size="sm"
        >
            {detail?.details && detail.details.length > 0 && (
                <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Erros de validacao</p>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        {detail.details.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="flex justify-end gap-2">
                {detail?.action === 'login' ? (
                    <Button variant="primary" onClick={handleClose}>Ir para login</Button>
                ) : (
                    <Button variant="primary" onClick={handleClose}>Ok</Button>
                )}
            </div>
        </Modal>
    );
};
