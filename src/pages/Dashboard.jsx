import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Plus, FileText, Calendar, User, Search } from 'lucide-react';

const Dashboard = () => {
    const { user, role, dept } = useAuth();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        let q;
        const recordsRef = collection(db, 'records');

        if (role === 'admin') {
            // Admin sees all, ordered by newest
            q = query(recordsRef, orderBy('createdAt', 'desc'));
        } else {
            // Staff sees only their dept
            if (dept) {
                q = query(
                    recordsRef,
                    where('dept', '==', dept)
                    // Note: Complex query with orderBy requires composite index. 
                    // Keeping it simple first or we might need index creation.
                    // We'll client-side sort for now to avoid index need immediately.
                );
            } else {
                // No dept assigned? See nothing or everything? Safety: see nothing.
                q = query(recordsRef, where('dept', '==', 'null'));
            }
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Client-side sort if needed (for staff query without index)
            docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

            setRecords(docs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, role, dept]);



    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Department Records
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {role === 'admin' ? 'Viewing Global Records' : `Viewing ${dept} Records`}
                    </p>
                </div>

                <button
                    onClick={() => navigate('/new-record')}
                    className="bg-[var(--accent-primary)] hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    New Record
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-[var(--text-secondary)]">Loading records...</div>
            ) : records.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center">
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-full mb-4">
                        <FileText size={40} className="text-[var(--text-secondary)]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Records Found</h3>
                    <p className="text-[var(--text-secondary)] max-w-sm mx-auto">
                        {role === 'admin'
                            ? "There are no records in the system yet."
                            : "Your department hasn't created any records yet."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {records.map(record => (
                        <div key={record.id} className="glass-panel p-6 rounded-xl hover:translate-y-[-4px] transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <FileText size={20} />
                                </div>
                                <span className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded border border-slate-700">
                                    {record.dept}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold mb-2 truncate" title={record.title}>{record.title}</h3>
                            <p className="text-[var(--text-secondary)] text-sm mb-6 line-clamp-3">
                                {record.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-4 border-t border-slate-700/50">
                                <div className="flex items-center gap-1.5" title={record.creatorEmail}>
                                    <User size={14} />
                                    <span className="truncate max-w-[100px]">{record.creatorEmail?.split('@')[0]}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    <span>
                                        {record.createdAt?.toMillis
                                            ? new Date(record.createdAt.toMillis()).toLocaleDateString()
                                            : 'Just now'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}

        </div>
    );
};

export default Dashboard;
