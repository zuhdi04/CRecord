import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, role, loading } = useAuth();

    if (loading) {
        // Elegant loading spinner
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If roles are specified, check if user has permission
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // You might want to redirect to a simpler 'Unauthorized' page or just dashboard
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
