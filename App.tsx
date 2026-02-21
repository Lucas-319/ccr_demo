import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Children } from './pages/Children';
import { Attendance } from './pages/Attendance';
import { Sundays } from './pages/Sundays';
import { Users } from './pages/Users';
import { Terms } from './pages/Terms';
import { Settings } from './pages/Settings';
import { Layout } from './components/Layout';
import { GlobalErrorModal } from './components/GlobalErrorModal';
import { CookieBanner } from './components/CookieBanner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/terms" element={<Terms />} />

            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />

            <Route path="/children" element={
                <ProtectedRoute>
                    <Children />
                </ProtectedRoute>
            } />

            <Route path="/attendance" element={
                <ProtectedRoute>
                    <Attendance />
                </ProtectedRoute>
            } />

            <Route path="/sundays" element={
                <ProtectedRoute>
                    <Sundays />
                </ProtectedRoute>
            } />

            <Route path="/users" element={
                <ProtectedRoute>
                    <Users />
                </ProtectedRoute>
            } />

            <Route path="/settings" element={
                <ProtectedRoute>
                    <Settings />
                </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <HashRouter>
                    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] pointer-events-none">
                        <div className="px-3 py-1.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wide bg-amber-500/90 text-amber-950 shadow-lg shadow-amber-600/30">
                            Modo Demo
                        </div>
                    </div>
                    <AppRoutes />
                    <CookieBanner />
                    <GlobalErrorModal />
                </HashRouter>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
