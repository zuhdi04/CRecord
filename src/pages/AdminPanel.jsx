import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Users, ChevronDown } from 'lucide-react';

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
                await setDoc(firestoreDoc(db, 'departments', deptName), {
                    name: deptName
                });
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

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1>User Management</h1>
                    <p style={{ color: '#666' }}>Manage system access and department assignments</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btnAdd"
                >
                    <Users size={20} style={{ marginRight: '5px' }} />
                    Add User
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table id="printTable">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Loading users...</td>
                            </tr>
                        ) : users.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div style={{ fontWeight: 'bold' }}>{user.email}</div>
                                </td>
                                <td>
                                    <button
                                        onClick={() => updateUser(user.id, 'role', user.role === 'admin' ? 'staff' : 'admin')}
                                        style={{
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            border: '1px solid #ccc',
                                            backgroundColor: user.role === 'admin' ? '#e2e8f0' : '#f8f9fa',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {user.role || 'staff'}
                                    </button>
                                </td>
                                <td>
                                    <select
                                        value={user.dept || ''}
                                        onChange={(e) => updateUser(user.id, 'dept', e.target.value)}
                                        style={{ width: '100%', padding: '5px' }}
                                    >
                                        <option value="" disabled>Unassigned</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="btn-delete"
                                        style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal" style={{ display: 'block' }}>
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <span className="close" onClick={() => setShowCreateModal(false)}>&times;</span>
                        <h2 style={{ marginBottom: '20px' }}>Add New User</h2>
                        <form onSubmit={handleCreateUser} className="form-container">
                            <div>
                                <label>Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="user@company.com"
                                />
                            </div>
                            <div>
                                <label>Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label>Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Department</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUser.dept}
                                        onChange={e => setNewUser({ ...newUser, dept: e.target.value })}
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

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="reset"
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="button"
                                    style={{ flex: 1 }}
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

