import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getCookieConsent, setCookieConsent, clearLoginCookies } from '../cookies';

export const CookieBanner: React.FC = () => {
    const [consent, setConsent] = useState(getCookieConsent());

    const handleAccept = () => {
        setCookieConsent('accepted');
        setConsent('accepted');
    };

    const handleDecline = () => {
        setCookieConsent('declined');
        clearLoginCookies();
        setConsent('declined');
    };

    return (
        <AnimatePresence>
            {!consent && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-3xl rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl p-4"
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">Este site usa cookies</span> para melhorar sua experiência.
                            <Link to="/terms" className="ml-1 text-primary-600 dark:text-primary-400 hover:underline font-medium">
                                Saiba mais
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDecline}
                                className="px-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Recusar
                            </button>
                            <button
                                onClick={handleAccept}
                                className="px-4 py-2 text-sm rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-600/30 hover:bg-primary-500 transition-colors"
                            >
                                Aceitar
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
