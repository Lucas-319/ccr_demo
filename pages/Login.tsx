import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';
import { playSound } from '../utils';
import { getCookieConsent, getLoginCookies, setLoginCookies, clearLoginCookies } from '../cookies';

export const Login: React.FC = () => {
    const [login, setLogin] = useState('guest');
    const [password, setPassword] = useState('demo');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberLogin, setRememberLogin] = useState(false);
    const [welcomeTitle, setWelcomeTitle] = useState('Bem-vindo');
    const { login: authLogin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setLogin('guest');
        setPassword('demo');
        setWelcomeTitle('Bem-vindo à DEMO');
        const consent = getCookieConsent();
        setRememberLogin(consent === 'accepted');
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authLogin({ login, password });
            const consent = getCookieConsent();
            if (consent === 'accepted' && rememberLogin) {
                setLoginCookies(login, password);
            } else {
                clearLoginCookies();
            }
            playSound('success');
            navigate('/dashboard');
        } catch (err: any) {
            const rawMessage = String(err?.message || '').trim();
            const lower = rawMessage.toLowerCase();

            if (lower.includes('acesso negado') || lower.includes('forbidden')) {
                setError('Acesso negado. Procure um Administrador.');
            } else if (
                lower.includes('credenciais inválidas') ||
                lower.includes('credenciais invalidas') ||
                lower.includes('invalid') ||
                lower.includes('credential') ||
                lower.includes('senha') ||
                lower.includes('usuario') ||
                lower.includes('usuário')
            ) {
                setError('Usuário ou senha inválidos.');
            } else if (lower.includes('conectar ao servidor') || lower.includes('failed to fetch') || lower.includes('networkerror')) {
                setError('Não foi possível conectar ao servidor.');
            } else {
                setError('Não foi possível entrar. Tente novamente.');
            }
            playSound('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#020617] relative overflow-hidden">
            {/* Cinematic Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-primary-400/20 to-purple-400/20 blur-[120px] animate-float" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-indigo-400/20 to-blue-400/20 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md p-8 relative z-10"
            >
                <div className="glass-panel rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 dark:border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>

                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                            className="w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary-500/40 mb-4"
                        >
                            <span className="text-white text-2xl font-bold">🤍</span>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">{welcomeTitle}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Controle do Culto Infantil</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                placeholder="Usuário"
                                icon={<UserIcon size={18} />}
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                disabled
                                className="bg-slate-50/50 dark:bg-slate-800/50"
                            />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Senha"
                                icon={<Lock size={18} />}
                                rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                rightIconAriaLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                onRightIconClick={() => setShowPassword((prev) => !prev)}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled
                                className="bg-slate-50/50 dark:bg-slate-800/50"
                            />
                        </div>

                        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200/70 dark:border-amber-700/40">
                            <strong>Modo DEMO</strong>
                            <p className="mt-2">Esta é uma versão de demonstração do sistema. Use as credenciais padrão para explorar todas as funcionalidades.</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg"
                            >
                                {error}
                            </motion.div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-base shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40"
                            isLoading={loading}
                        >
                            Entrar no Sistema
                        </Button>

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    checked={rememberLogin}
                                    onChange={(e) => setRememberLogin(e.target.checked)}
                                    disabled
                                />
                                Lembrar acesso (demo)
                            </label>
                            {getCookieConsent() !== 'accepted' && (
                                <span className="text-[11px]">Aceite cookies para lembrar.</span>
                            )}
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            &copy; 2026 CCR Ministério Infantil. <br />
                            Feito com ❤️ para o Reino por{' '}
                            <a
                                href="https://github.com/Lucas-319"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 underline"
                            >
                                Lucas Squared
                            </a>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
