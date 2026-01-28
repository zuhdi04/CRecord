import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Users, Shield, Briefcase, ChevronDown } from 'lucide-react';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
        fetchDepartments();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const userList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users", error);
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (userId, field, value) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { [field]: value });
            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
        } catch (error) {
            console.error("Error updating user", error);
            alert("Failed to update user");
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, 'users', userId));
            setUsers(users.filter(user => user.id !== userId));
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user.");
        }
    };

    const [departments, setDepartments] = useState([]);

    const fetchDepartments = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'departments'));
            const deptList = querySnapshot.docs.map(doc => doc.data().name).filter(Boolean);
            // Remove duplicates just in case and sort
            setDepartments([...new Set(deptList)].sort());
        } catch (error) {
            console.error("Error fetching departments", error);
        }
    };

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'staff', dept: '' });

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            // Import dynamically to avoid top-level side effects if possible, or just use standard imports
            const { initializeApp, getApp, getApps, deleteApp } = await import("firebase/app");
            const { getAuth, createUserWithEmailAndPassword, signOut: secondarySignOut } = await import("firebase/auth");
            const { setDoc, doc: firestoreDoc } = await import("firebase/firestore");

            // 1. Initialize a secondary app to avoid kicking out the current admin
            // Use a unique name for the secondary app to prevent conflicts
            const secondaryAppName = `secondaryApp-${Date.now()}`;
            const secondaryApp = initializeApp({
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
                authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: import.meta.env.VITE_FIREBASE_APP_ID
            }, secondaryAppName);

            const secondaryAuth = getAuth(secondaryApp);

            // 2. Create the user in Authentication
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
            const createdUser = userCredential.user;

            // 3. Create the user document in Firestore (using the MAIN app's db instance which is already auth'd as admin)
            // We use the UID from the newly created user
            await setDoc(firestoreDoc(db, 'users', createdUser.uid), {
                email: newUser.email,
                role: newUser.role,
                dept: newUser.dept,
                createdAt: new Date()
            });

            // 4. If a department was provided, ensure it exists in the 'departments' collection
            if (newUser.dept) {
                const deptName = newUser.dept.trim();
                // Use the department name as the document ID to prevent duplicates easily, 
                // or use a query to check existence if we want auto-IDs. 
                // For simplicity and uniqueness, using a sanitized name as ID or check-then-add is good.
                // Here, let's just use setDoc with a custom ID (slugified) or just add it if strictly needed.
                // The user said "save to the new collection".
                // Let's us setDoc to ensure we don't duplicate logical entries if they type "IT" and "IT" exists.
                // We will create a document reference with the name as a key or just add it.
                // To make it easy: ID = deptName
                await setDoc(firestoreDoc(db, 'departments', deptName), {
                    name: deptName
                });
                // Refresh departments list
                fetchDepartments();
            }

            // 4. Cleanup: Sign out and delete the secondary app
            await secondarySignOut(secondaryAuth);
            await deleteApp(secondaryApp);

            alert("User created successfully!");
            setShowCreateModal(false);
            setNewUser({ email: '', password: '', role: 'staff', dept: '' });
            fetchUsers(); // Refresh the list

        } catch (error) {
            console.error("Error creating user:", error);
            alert(`Failed to create user: ${error.message}`);
        }
    };

    // const departments = ["Sales", "IT", "Engineering", "HR", "Legal"];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        User Management
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">Manage system access and department assignments</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-pink-500/20 active:scale-95 transition-all font-medium"
                >
                    <Users size={20} />
                    Add User
                </button>
            </div>

            <div className="glass-panel overflow-hidden rounded-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-secondary)] border-b border-slate-700/50">
                                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">User</th>
                                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Role</th>
                                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Department</th>
                                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-[var(--text-secondary)]">Loading users...</td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                                                {user.email?.[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium">{user.email}</div>
                                                {/* <div className="text-xs text-[var(--text-secondary)] font-mono">ID: {user.id.slice(0, 8)}...</div> */}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateUser(user.id, 'role', user.role === 'admin' ? 'staff' : 'admin')}
                                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${user.role === 'admin'
                                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30'
                                                    : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700'
                                                    }`}
                                            >
                                                {user.role || 'staff'}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="relative inline-block w-40">
                                            <select
                                                value={user.dept || ''}
                                                onChange={(e) => updateUser(user.id, 'dept', e.target.value)}
                                                className="w-full appearance-none bg-[var(--bg-primary)] border border-slate-700 hover:border-slate-600 text-[var(--text-primary)] text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                                            >
                                                <option value="" disabled>Unassigned</option>
                                                {departments.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
                                        </div>
                                    </td>
                                    <td className="p-4 text-[var(--text-secondary)] text-sm">
                                        {/* Placeholder for future actions */}
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className="hover:text-red-400 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold mb-6">Add New User</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-purple-500"
                                    placeholder="user@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-purple-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Department</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUser.dept}
                                        onChange={e => setNewUser({ ...newUser, dept: e.target.value })}
                                        className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-purple-500"
                                        placeholder="Enter Department Name"
                                        list="dept-suggestions"
                                    />
                                    <datalist id="dept-suggestions">
                                        {departments.map(dept => (
                                            <option key={dept} value={dept} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors bg-transparent"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-colors"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
