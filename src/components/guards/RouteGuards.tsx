import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../contexts/AuthContext';

function profileIsComplete(profile: any, user: any) {
    if (!profile && !user?.user_metadata?.role) return false;
    const role = profile?.role || user?.user_metadata?.role;
    if (role === 'ADMIN' || role === 'TECH') return true;
    return !!(profile?.first_name && profile?.last_name && profile?.data_consent);
}

function redirectByRole(profile: any, user: any) {
    const role = profile?.role || user?.user_metadata?.role;
    if (!profileIsComplete(profile, user)) return <Navigate to="/onboarding" replace />;
    if (role === 'TECH') return <Navigate to="/tech" replace />;
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/app" replace />;
}

export function AuthGuard() {
    const { session, loading } = useAuth();
    if (loading) return <div>Cargando...</div>;
    if (!session) return <Navigate to="/auth/login" replace />;
    return <Outlet />;
}

export function RoleGuard({ allowedRoles }: { allowedRoles: Role[] }) {
    const { session, profile, user, loading } = useAuth();
    if (loading) return <div>Cargando...</div>;
    if (!session) return <Navigate to="/auth/login" replace />;
    const role = (profile?.role || user?.user_metadata?.role) as Role;
    if (!allowedRoles.includes(role)) return redirectByRole(profile, user);
    return <Outlet />;
}

export function PublicGuard() {
    const { session, profile, user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <div>Cargando...</div>;
    
    if (session) {
        // Redirect if at root, login, or register
        const isAuthRoute = location.pathname.startsWith('/auth');
        const isRootRoute = location.pathname === '/';
        
        if (isAuthRoute || isRootRoute) {
            console.log('PublicGuard: Authenticated user detected at public route, redirecting to portal');
            return redirectByRole(profile, user);
        }
    }
    return <Outlet />;
}
