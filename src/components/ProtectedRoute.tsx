import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Permission Guard
    if (user?.permissions) {
        // Check if current path is in permissions OR if it's the root path (we handle root redirect separately)
        // We do exact match for simplicity or startsWith
        const isAllowed = user.permissions.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));

        if (!isAllowed && location.pathname !== '/') {
            // Redirect to the first allowed path
            const firstAllowed = user.permissions[0];
            return <Navigate to={firstAllowed} replace />;
        }

        // If at root '/' and it's not strictly allowed, also redirect to first allowed
        if (location.pathname === '/' && !user.permissions.includes('/')) {
            const firstAllowed = user.permissions[0];
            return <Navigate to={firstAllowed} replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
