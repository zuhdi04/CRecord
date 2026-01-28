import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, getDoc, doc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const NewRecord = () => {
    const { user, role, dept } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID if editing
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const isEditMode = !!id;

    // Form State
    const [formData, setFormData] = useState({
        nama_penuh: '',
        cawangan: '', // Dept
        jawatan_gred: '',
        kakitangan: 'NEGERI', // Default per PHP check
        jenis_komputer: '',
        project_date: '',
        umur_komputer: '',
        jenis_processor: '',
        other_proc_text: '',
        saiz_ram: '',
        jenis_sistem: '', // 32BIT/64BIT
        antivirus: '',
        ipv4_address: '',
        catatan: ''
    });

    useEffect(() => {
        // Fetch departments if admin
        if (role === 'admin') {
            const fetchDepartments = async () => {
                const querySnapshot = await getDocs(collection(db, 'departments'));
                const deptList = querySnapshot.docs.map(doc => doc.data().name).filter(Boolean);
                setDepartments([...new Set(deptList)].sort());
            };
            fetchDepartments();
        }

        // Handle Edit Mode Fetch
        if (isEditMode) {
            const fetchRecord = async () => {
                setLoading(true);
                try {
                    const docRef = doc(db, 'records', id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        // Determine processor type (Standard or Other)
                        let procType = '';
                        let procOther = '';
                        if (['i3', 'i5', 'i7'].includes(data.jenis_processor)) {
                            procType = data.jenis_processor;
                        } else if (data.jenis_processor) {
                            procType = 'Others';
                            procOther = data.final_processor || data.jenis_processor;
                            // Fallback if 'final_processor' stored the combined string
                            // logic: if stored 'AMD', and we set 'Others', we put 'AMD' in text field
                        }

                        setFormData({
                            nama_penuh: data.nama_penuh || data.title || '',
                            cawangan: data.cawangan || data.dept || '',
                            jawatan_gred: data.jawatan_gred || '',
                            kakitangan: data.kakitangan || 'NEGERI',
                            jenis_komputer: data.jenis_komputer || '',
                            project_date: data.project_date || '',
                            umur_komputer: data.umur_komputer || '',
                            jenis_processor: procType,
                            other_proc_text: procOther || (procType === 'Others' ? (data.final_processor || data.jenis_processor) : ''),
                            saiz_ram: data.saiz_ram || '',
                            jenis_sistem: data.jenis_sistem || '',
                            antivirus: data.antivirus || '',
                            ipv4_address: data.ipv4_address || '',
                            catatan: data.catatan || ''
                        });
                    } else {
                        alert("Record not found!");
                        navigate('/');
                    }
                } catch (error) {
                    console.error("Error fetching record:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchRecord();
        } else {
            // Pre-fill user's dept if not admin on new record
            if (role !== 'admin') {
                setFormData(prev => ({ ...prev, cawangan: dept || '' }));
            }
        }
    }, [role, dept, id, isEditMode, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare data for Firestore
            const recordData = {
                ...formData,
                // Combine processor info
                final_processor: formData.jenis_processor === 'Others' ? formData.other_proc_text : formData.jenis_processor,
                // Meta
                dept: formData.cawangan,
                title: formData.nama_penuh,
                description: `${formData.jawatan_gred} - ${formData.jenis_komputer}`,
                updatedBy: user.uid,
                updatedAt: serverTimestamp()
            };

            if (isEditMode) {
                const docRef = doc(db, 'records', id);
                await updateDoc(docRef, recordData);
            } else {
                // New Record fields
                recordData.createdBy = user.uid;
                recordData.creatorEmail = user.email;
                recordData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'records'), recordData);
            }

            navigate('/');
        } catch (error) {
            console.error("Error saving record", error);
            alert("Failed to save record");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content" style={{ marginTop: '20px' }}>
            <form onSubmit={handleSubmit} className="form-container">

                {/* Nama */}
                <div>
                    <label>Nama Penuh :</label>
                    <input
                        type="text"
                        name="nama_penuh"
                        required
                        autoFocus
                        value={formData.nama_penuh}
                        onChange={handleChange}
                        placeholder="Masukkan nama penuh"
                    />
                </div>

                {/* Bahagian / Unit (Admin Only) */}
                {role === 'admin' ? (
                    <div>
                        <label>Unit / Bahagian / Cawangan / Daerah :</label>
                        <select
                            name="cawangan"
                            value={formData.cawangan}
                            onChange={handleChange}
                        >
                            <option value="">Select Department</option>
                            {departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label>Unit / Bahagian / Cawangan / Daerah :</label>
                        <input type="text" value={formData.cawangan} disabled style={{ backgroundColor: '#e9ecef' }} />
                    </div>
                )}

                {/* Jawatan */}
                <div>
                    <label>Jawatan dan Gred :</label>
                    <input
                        type="text"
                        name="jawatan_gred"
                        value={formData.jawatan_gred}
                        onChange={handleChange}
                        placeholder="Jawatan dan gred"
                    />
                </div>

                {/* Kakitangan */}
                <div>
                    <label>Kakitangan Persekutuan / Negeri :</label>
                    <div className="radio-group" style={{ marginTop: '5px' }}>
                        {['NEGERI', 'PERSEKUTUAN'].map(type => (
                            <label key={type}>
                                <input
                                    type="radio"
                                    name="kakitangan"
                                    value={type}
                                    checked={formData.kakitangan === type}
                                    onChange={handleChange}
                                />
                                {type.charAt(0) + type.slice(1).toLowerCase()}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Jenis PC */}
                <div>
                    <label>Jenis Komputer :</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                        {['Bahagian Tek...', 'Sewaan JKR', 'SUK'].map(type => (
                            <div className="radio-group" key={type}>
                                <label>
                                    <input
                                        type="radio"
                                        name="jenis_komputer"
                                        value={type.toUpperCase()} // Store as uppercase likely
                                        checked={formData.jenis_komputer === type.toUpperCase()}
                                        onChange={handleChange}
                                    />
                                    {type}
                                </label>
                            </div>
                        ))}
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="jenis_komputer"
                                    value="PROJEK"
                                    checked={formData.jenis_komputer === 'PROJEK'}
                                    onChange={handleChange}
                                />
                                Projek
                            </label>
                            <input
                                type="date"
                                name="project_date"
                                disabled={formData.jenis_komputer !== 'PROJEK'}
                                value={formData.project_date}
                                onChange={handleChange}
                                style={{ width: 'auto', marginLeft: '10px', padding: '5px' }}
                            />
                        </div>
                    </div>
                </div>


                {/* Umur PC */}
                <div>
                    <label>Umur Komputer (Tahun) :</label>
                    <input
                        type="number"
                        name="umur_komputer"
                        value={formData.umur_komputer}
                        onChange={handleChange}
                        placeholder=""
                    />
                </div>

                {/* Processor */}
                <div>
                    <label>Jenis Processor :</label>
                    <div className="radio-group" style={{ flexWrap: 'wrap', marginTop: '5px' }}>
                        {['i3', 'i5', 'i7'].map(proc => (
                            <label key={proc}>
                                <input
                                    type="radio"
                                    name="jenis_processor"
                                    value={proc}
                                    checked={formData.jenis_processor === proc}
                                    onChange={handleChange}
                                />
                                {proc}
                            </label>
                        ))}
                        <label>
                            <input
                                type="radio"
                                name="jenis_processor"
                                value="Others"
                                checked={formData.jenis_processor === 'Others'}
                                onChange={handleChange}
                            />
                            Others:
                        </label>
                        <input
                            type="text"
                            name="other_proc_text"
                            disabled={formData.jenis_processor !== 'Others'}
                            value={formData.other_proc_text}
                            onChange={handleChange}
                            style={{ width: '150px', padding: '5px' }}
                        />
                    </div>
                </div>

                {/* RAM */}
                <div>
                    <label>Saiz RAM :</label>
                    <div className="radio-group">
                        <input
                            type="number"
                            name="saiz_ram"
                            value={formData.saiz_ram}
                            onChange={handleChange}
                            placeholder="8"
                            style={{ width: '100px' }}
                        />
                        <span>GB</span>
                    </div>
                </div>



                {/* System Type */}
                <div>
                    <label>Jenis Sistem :</label>
                    <div className="radio-group" style={{ marginTop: '5px' }}>
                        {['32BIT', '64BIT'].map(sys => (
                            <label key={sys}>
                                <input
                                    type="radio"
                                    name="jenis_sistem"
                                    value={sys}
                                    checked={formData.jenis_sistem === sys}
                                    onChange={handleChange}
                                />
                                {sys}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Antivirus */}
                <div>
                    <label>Antivirus :</label>
                    <input
                        type="text"
                        name="antivirus"
                        value={formData.antivirus}
                        onChange={handleChange}
                        placeholder="Antivirus name"
                    />
                </div>

                {/* IP */}
                <div>
                    <label>IPv4 Address :</label>
                    <input
                        type="text"
                        name="ipv4_address"
                        value={formData.ipv4_address}
                        onChange={handleChange}
                        placeholder="192.168.0.1"
                    />
                </div>


                {/* Catatan */}
                <div>
                    <label>Catatan :</label>
                    <textarea
                        name="catatan"
                        value={formData.catatan}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Tambahan informasi..."
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                        type="submit" // Primary action
                        disabled={loading}
                        className="button"
                    >
                        {loading ? 'Saving...' : (isEditMode ? 'KEMASKINI' : 'SIMPAN')}
                    </button>
                    {!isEditMode && (
                        <input
                            type="reset"
                            value="RESET"
                            onClick={() => setFormData({ ...formData, nama_penuh: '', catatan: '' })}
                            className="reset"
                            style={{ width: 'auto', minWidth: '100px' }}
                        />
                    )}
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="btnBack"
                        style={{ width: 'auto', minWidth: '100px' }}
                    >
                        BATAL
                    </button>
                </div>

            </form>
        </div>
    );
};

export default NewRecord;


