import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Trash2, Edit, Download } from 'lucide-react';
import { generateWordReport } from '../utils/reportGenerator';

const Dashboard = () => {
    const { user, role, dept } = useAuth();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
            q = query(recordsRef, orderBy('createdAt', 'desc'));
        } else {
            if (dept) {
                q = query(recordsRef, where('dept', '==', dept));
            } else {
                q = query(recordsRef, where('dept', '==', 'null'));
            }
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setRecords(docs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, role, dept]);

    // Filtering
    const filteredRecords = records.filter(r =>
        (r.nama_penuh || r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.jenis_komputer || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            {/* Title */}
            <h2 style={{
                color: '#0056b3',
                textAlign: 'center',
                textTransform: 'uppercase',
                marginBottom: '30px',
                fontWeight: 'bold',
                fontSize: '1.5rem'
            }}>
                SPESIFIKASI KOMPUTER KAKITANGAN: {role === 'admin' ? 'SEMUA BHG' : (dept || 'UNKNOWN').toUpperCase()}
            </h2>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#333' }}>
                    <select style={{ padding: '2px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                    </select>
                    <span>entries per page</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Keep Download Report functionality available but unobtrusive or styled nicely */}
                    <button
                        onClick={() => generateWordReport(records, role === 'admin' ? 'Keseluruhan' : dept)}
                        title="Download Report"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#10b981' }}
                    >
                        <Download size={20} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Search:</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '4px', width: '200px' }}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Loading records...</div>
            ) : (
                <>
                    <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
                        <table id="printTable">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '150px' }}>NAMA PENUH</th>
                                    {role === 'admin' && <th>BAHAGIAN</th>}
                                    <th>JAWATAN DAN GRED</th>
                                    <th>KAKITANGAN: NEGERI / PERSEKUTUAN</th>
                                    <th>JENIS KOMPUTER</th>
                                    <th>UMUR KOMPUTER</th>
                                    <th>JENIS PROCESSOR</th>
                                    <th>SAIZ RAM</th>
                                    <th>JENIS SISTEM</th>
                                    <th>ANTIVIRUS</th>
                                    <th>IPV4 ADDRESS</th>
                                    <th>CATATAN</th>
                                    <th>OPERASI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={role === 'admin' ? "13" : "12"} style={{ textAlign: 'center', padding: '20px' }}>No data available in table</td>
                                    </tr>
                                ) : filteredRecords.map(record => (
                                    <tr key={record.id}>
                                        <td style={{ fontWeight: 'bold' }}>{record.nama_penuh || record.title || '-'}</td>
                                        {role === 'admin' && <td>{record.dept || record.cawangan || '-'}</td>}
                                        <td>{record.jawatan_gred || '-'}</td>
                                        <td>{record.kakitangan || '-'}</td>
                                        <td>
                                            {record.jenis_komputer || '-'}
                                            {record.jenis_komputer === 'PROJEK' && record.project_date && (
                                                <div style={{ fontSize: '0.8em', color: '#666' }}>({record.project_date})</div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {(() => {
                                                const val = parseInt(record.umur_komputer);
                                                if (!isNaN(val)) {
                                                    return val > 1900 ? new Date().getFullYear() - val : val;
                                                }
                                                return record.umur_komputer || '-';
                                            })()}
                                        </td>
                                        <td>{record.final_processor || record.jenis_processor || '-'}</td>
                                        <td>{record.saiz_ram ? `${record.saiz_ram} GB` : '-'}</td>
                                        <td>{record.jenis_sistem || '-'}</td>
                                        <td>{record.antivirus || '-'}</td>
                                        <td>{record.ipv4_address || '-'}</td>
                                        <td>{record.catatan || '-'}</td>
                                        <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            <button
                                                onClick={() => navigate(`/edit-record/${record.id}`)}
                                                className="btn-edit"
                                                style={{ marginRight: '5px', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteRecord(record.id)}
                                                className="btn-delete"
                                                style={{ border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Info */}
                    <div style={{ fontSize: '14px', color: '#333', marginBottom: '20px' }}>
                        Showing {filteredRecords.length > 0 ? 1 : 0} to {filteredRecords.length} of {records.length} entries
                    </div>

                    {/* Bottom Button */}
                    <div>
                        <button
                            onClick={() => navigate('/new-record')}
                            className="btnAdd"
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#46acf0',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                            }}
                        >
                            Tambah Maklumat
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;

