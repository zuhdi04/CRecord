import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

import JkrLogo from '../assets/jkr-logo.png';

const MainLayout = () => {
    const { user, role } = useAuth();
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

    return (
        <div>
            {/* Tier 1: Branding Header */}
            <div className="top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#0056b3', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img
                        src={JkrLogo}
                        alt="JKR Logo"
                        style={{ height: '80px', width: 'auto' }}
                    />
                </div>

                <div className="title" style={{ textAlign: 'center', flex: 1 }}>
                    <h2 style={{ color: '#F0CB29', margin: 0, fontSize: '1.2rem', fontWeight: '900', textShadow: '1px 1px 2px black' }}>
                        JABATAN KERJA RAYA NEGERI KEDAH DARUL AMAN
                    </h2>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div
                        style={{
                            backgroundColor: '#46acf0',
                            padding: '8px 15px',
                            color: 'white',
                            fontWeight: 'bold',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '14px'
                        }}
                    >
                        {user?.email}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="logout"
                        style={{ backgroundColor: '#ff4757', border: 'none', padding: '8px 15px', color: 'white', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Tier 2: Navigation Bar */}
            <div className="menu-bar" style={{ backgroundColor: '#003d80', padding: '0' }}>
                <ul style={{ display: 'flex', justifyContent: 'center', listStyle: 'none', margin: 0, padding: '10px 0', gap: '30px' }}>
                    {role === 'admin' && (
                        <li>
                            <NavLink
                                to="/admin"
                                className={({ isActive }) => isActive ? "active" : ""}
                                style={({ isActive }) => ({ color: isActive ? '#F0CB29' : 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' })}
                            >
                                Admin
                            </NavLink>
                        </li>
                    )}
                    <li>
                        <NavLink
                            to="/"
                            className={({ isActive }) => isActive ? "active" : ""}
                            style={({ isActive }) => ({ color: isActive ? '#F0CB29' : 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' })}
                        >
                            Spesifikasi
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/new-record"
                            className={({ isActive }) => isActive ? "active" : ""}
                            style={({ isActive }) => ({ color: isActive ? '#F0CB29' : 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' })}
                        >
                            Tambah Maklumat
                        </NavLink>
                    </li>
                </ul>
            </div>

            {/* Main Content */}
            <div style={{ padding: '20px', minHeight: 'calc(100vh - 200px)' }}>
                <Outlet />
            </div>

            {/* Footer */}
            <div className="footer" style={{ backgroundColor: '#003d80', color: 'white', textAlign: 'center', padding: '15px', marginTop: 'auto' }}>
                &copy; {new Date().getFullYear()} Jabatan Kerja Raya Negeri Kedah. All rights reserved.
            </div>
        </div>
    );
};

export default MainLayout;


