import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    size?: ModalSize;
    children: React.ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    title,
    subtitle,
    size = 'md',
    children,
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className={cn(
                            'relative w-full',
                            sizeClasses[size]
                        )}
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.2 }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="rounded-3xl border border-slate-200/20 dark:border-slate-700/60 overflow-hidden shadow-2xl bg-white dark:bg-slate-900/95">
                            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700/40">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-red-400" />
                                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    aria-label="Fechar modal"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900/90 px-6 py-6 sm:px-8 sm:py-7">
                                <div className="mb-5">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
                                    {subtitle && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
                                    )}
                                </div>
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
