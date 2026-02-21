import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ChevronLeft } from 'lucide-react';

export const Terms: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 mb-8 text-primary-600 dark:text-primary-400 hover:underline"
                >
                    <ChevronLeft size={18} />
                    Voltar
                </button>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-lg">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-8">
                        Termos de Uso
                    </h1>

                    <div className="prose prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
                        <section>
                            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
                                1. Sobre o Sistema CCR
                            </h2>
                            <p>
                                O CCR (Controle do Culto Infantil) é um sistema web desenvolvido para gerenciar e controlar atividades
                                do ministério infantil, incluindo cadastro de crianças, registro de presenças, disponibilidade de
                                voluntários e comunicação entre membros da equipe.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
                                2. Cookies - O Que São e Por Que Usamos
                            </h2>
                            <p>
                                Cookies são pequenos arquivos de texto armazenados no seu navegador que ajudam a melhorar sua
                                experiência ao usar o sistema. Este sistema utiliza os seguintes cookies:
                            </p>
                            <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-xl mt-3 space-y-3">
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-white">ccr_token (Token de Autenticação)</h3>
                                    <p className="text-sm">
                                        Armazena seu token de autenticação para manter você logado no sistema. Expira automaticamente após o
                                        tempo configurado no servidor (geralmente 24 horas).
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-white">ccr_cookie_consent (Consentimento)</h3>
                                    <p className="text-sm">
                                        Armazena sua preferência de aceitar ou recusar cookies. Válido por 1 ano.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-white">
                                        ccr_login e ccr_password (Opcional - Lembrar Acesso)
                                    </h3>
                                    <p className="text-sm">
                                        Se você marcar "Lembrar acesso" na tela de login, seu login e senha são armazenados de forma local
                                        no navegador por 30 dias. Você pode desabilitar isso na tela de login.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
                                3. Funcionalidades do Sistema
                            </h2>
                            <ul className="space-y-2">
                                <li className="flex gap-2">
                                    <span className="text-primary-600 dark:text-primary-400 font-bold">•</span>
                                    <span><strong>Autenticação:</strong> Login seguro com token JWT</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary-600 dark:text-primary-400 font-bold">•</span>
                                    <span><strong>Gestão de Crianças:</strong> Cadastro, edição e exclusão de informações de crianças (admin)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary-600 dark:text-primary-400 font-bold">•</span>
                                    <span><strong>Registro de Presença:</strong> Marcar presença de crianças por domingo e turno</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary-600 dark:text-primary-400 font-bold">•</span>
                                    <span><strong>Disponibilidade de Voluntários:</strong> Voluntários marcam sua disponibilidade por domingo</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary-600 dark:text-primary-400 font-bold">•</span>
                                    <span><strong>Gestão de Usuários:</strong> Apenas admins podem criar e editar usuários</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary-600 dark:text-primary-400 font-bold">•</span>
                                    <span><strong>Modo Escuro/Claro:</strong> Tema personalizável</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
                                4. Segurança e Privacidade
                            </h2>
                            <p>
                                • Suas credenciais de login são enviadas apenas uma vez para autenticação<br />
                                • Comunicação é protegida via HTTPS<br />
                                • Tokens expiram automaticamente<br />
                                • Dados sensíveis (alergias, contatos) são armazenados com segurança no servidor<br />
                                • Senhas são criptografadas no armazenamento do servidor
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
                                5. Funções e Permissões
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-white">Usuários Comuns</h3>
                                    <p className="text-sm">
                                        Podem visualizar todas as crianças, registrar presenças, marcar disponibilidade nos domingos
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-white">Administradores</h3>
                                    <p className="text-sm">
                                        Podem gerenciar crianças (criar, editar, deletar), gerenciar usuários, desmarcar disponibilidades de
                                        voluntários, acessar relatórios completos
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
                                6. Responsabilidade do Usuário
                            </h2>
                            <p>
                                Você é responsável por manter sua senha segura e confidencial. Não compartilhe suas credenciais com
                                outras pessoas. O sistema registra todas as ações realizadas, logo recomenda-se usar a plataforma de
                                forma responsável.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
                                7. Suporte e Dúvidas
                            </h2>
                            <p>
                                Se você tiver dúvidas sobre este termo de uso ou sobre como o sistema funciona, entre em contato com
                                um administrador do sistema.
                            </p>
                        </section>

                        <section className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Última atualização: 12 de Fevereiro de 2026<br />
                                Sistema CCR v1.0
                            </p>
                        </section>
                    </div>

                    <div className="mt-8">
                        <Button onClick={() => navigate(-1)} className="w-full md:w-auto">
                            Entendi e Voltar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
