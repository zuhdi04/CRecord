import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Plus, FileText, Calendar, User, Search, Trash2, Edit } from 'lucide-react';

const Dashboard = () => {
    const { user, role, dept } = useAuth();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const deleteRecord = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            const { deleteDoc, doc } = await import("firebase/firestore");
            await deleteDoc(doc(db, 'records', id));
        } catch (error) {
            console.error("Error deleting record", error);
            alert("Failed to delete record");
        }
    };

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
                <div className="glass-panel rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-[var(--bg-secondary)] border-b border-slate-700/50 text-[var(--text-secondary)]">
                                    <th className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">Nama Penuh</th>
                                    {role === 'admin' && <th className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">Cawangan / Bahagian</th>}
                                    <th className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">Jawatan & Gred</th>
                                    <th className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">Kakitangan</th>
                                    <th className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">Jenis Komputer</th>
                                    <th className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">Umur (Tahun)</th>
                                    <th className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">Processor</th>
                                    <th className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">RAM</th>
                                    <th className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">Sistem</th>
                                    <th className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">Antivirus</th>
                                    <th className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">IP Address</th>
                                    <th className="p-3 font-semibold uppercase tracking-wider">Catatan</th>
                                    <th className="p-3 font-semibold uppercase tracking-wider text-right">Operasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {records.map(record => (
                                    <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-3 font-medium">{record.nama_penuh || record.title || '-'}</td>
                                        {role === 'admin' && <td className="p-3 text-[var(--text-secondary)]">{record.dept || record.cawangan || '-'}</td>}
                                        <td className="p-3 text-[var(--text-secondary)]">{record.jawatan_gred || '-'}</td>
                                        <td className="p-3 text-[var(--text-secondary)]">{record.kakitangan || '-'}</td>
                                        <td className="p-3 text-[var(--text-secondary)]">
                                            {record.jenis_komputer || '-'}
                                            {record.jenis_komputer === 'PROJEK' && record.project_date && (
                                                <div className="text-xs opacity-70 mt-1">Tamat: {record.project_date}</div>
                                            )}
                                        </td>
                                        <td className="p-3 text-[var(--text-secondary)] text-center">{record.umur_komputer || '-'}</td>
                                        <td className="p-3 text-[var(--text-secondary)]">{record.final_processor || record.jenis_processor || '-'}</td>
                                        <td className="p-3 text-[var(--text-secondary)]">{record.saiz_ram ? `${record.saiz_ram} GB` : '-'}</td>
                                        <td className="p-3 text-[var(--text-secondary)]">{record.jenis_sistem || '-'}</td>
                                        <td className="p-3 text-[var(--text-secondary)]">{record.antivirus || '-'}</td>
                                        <td className="p-3 text-[var(--text-secondary)] font-mono text-xs">{record.ipv4_address || '-'}</td>
                                        <td className="p-3 text-[var(--text-secondary)] text-xs max-w-[200px] truncate" title={record.catatan}>
                                            {record.catatan || '-'}
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Placeholder Edit */}
                                                <button className="text-blue-400 hover:text-blue-300 p-1">
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteRecord(record.id)}
                                                    className="text-red-400 hover:text-red-300 p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}

        </div>
    );
};

export default Dashboard;
