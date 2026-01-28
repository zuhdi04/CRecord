import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { LogOut, LayoutDashboard, Users, Shield } from 'lucide-react';

const MainLayout = () => {
    const { user, role, dept } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <button
                onClick={() => navigate(to)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/30'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                    }`}
            >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
            </button>
        );
    };

    return (
        <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--bg-secondary)] border-r border-slate-700/50 flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        RecordSys
                    </h1>
                    <div className="mt-1 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'}`}></span>
                        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{role || 'Staff'} Access</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    {role === 'admin' && (
                        <NavItem to="/admin" icon={Users} label="User Management" />
                    )}
                </nav>

                <div className="p-4 border-t border-slate-700/50">
                    <div className="mb-4 px-4">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.email}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 select-all" title={user?.uid}>ID: {user?.uid?.slice(0, 8)}...</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Dept: {dept || 'Unassigned'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all text-sm font-medium"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Header (optional, for mobile mainly but adding ambient glow) */}
                <div className="sticky top-0 z-30 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                </div>

                <div className="p-8 max-w-7xl mx-auto relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
