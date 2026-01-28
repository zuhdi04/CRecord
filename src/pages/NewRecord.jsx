import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Save, X, Upload } from 'lucide-react';

const NewRecord = () => {
    const { user, role, dept } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);

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
        } else {
            // Pre-fill user's dept if not admin
            setFormData(prev => ({ ...prev, cawangan: dept || '' }));
        }
    }, [role, dept]);

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
                createdBy: user.uid,
                creatorEmail: user.email,
                createdAt: serverTimestamp(),
                // Map legacy fields to new structure if needed, or keep as is.
                // Using the PHP form field names as keys for simplicity based on user request.
                dept: formData.cawangan, // Ensure this matches what Dashboard expects for filtering
                title: formData.nama_penuh, // Mapping for Dashboard compatibility (Dashboard expects 'title')
                description: `${formData.jawatan_gred} - ${formData.jenis_komputer}` // Mapping for Dashboard compatibility
            };

            await addDoc(collection(db, 'records'), recordData);
            navigate('/');
        } catch (error) {
            console.error("Error creating record", error);
            alert("Failed to save record");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    New Equipment Record
                </h1>
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="glass-panel p-8 rounded-xl">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Nama */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nama Penuh</label>
                        <input
                            type="text"
                            name="nama_penuh"
                            required
                            autoFocus
                            value={formData.nama_penuh}
                            onChange={handleChange}
                            className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:border-purple-500 outline-none"
                            placeholder="Masukkan nama penuh"
                        />
                    </div>

                    {/* Bahagian / Unit (Admin Only) */}
                    {role === 'admin' && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Unit / Bahagian</label>
                            <select
                                name="cawangan"
                                value={formData.cawangan}
                                onChange={handleChange}
                                className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:border-purple-500 outline-none"
                            >
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Jawatan */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Jawatan dan Gred</label>
                        <input
                            type="text"
                            name="jawatan_gred"
                            value={formData.jawatan_gred}
                            onChange={handleChange}
                            className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:border-purple-500 outline-none"
                            placeholder="Jawatan dan gred"
                        />
                    </div>

                    {/* File Upload (Visual only for now) */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Gambar</label>
                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors cursor-pointer bg-[var(--bg-secondary)]">
                            <Upload className="mx-auto mb-2 text-[var(--text-secondary)]" size={24} />
                            <span className="text-sm text-[var(--text-secondary)]">Click to upload image</span>
                            <input type="file" className="hidden" accept="image/*" />
                        </div>
                    </div>

                    {/* Kakitangan */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Kakitangan</label>
                        <div className="flex gap-4">
                            {['NEGERI', 'PERSEKUTUAN'].map(type => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="kakitangan"
                                        value={type}
                                        checked={formData.kakitangan === type}
                                        onChange={handleChange}
                                        className="accent-purple-500"
                                    />
                                    <span className="capitalize">{type.toLowerCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Jenis PC */}
                    <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Jenis Komputer</label>
                        <div className="space-y-2">
                            {['BAHAGIAN TEK', 'SEWAAN JKR', 'SUK'].map(type => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="jenis_komputer"
                                        value={type}
                                        checked={formData.jenis_komputer === type}
                                        onChange={handleChange}
                                        className="accent-purple-500"
                                    />
                                    <span>{type}</span>
                                </label>
                            ))}
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="jenis_komputer"
                                        value="PROJEK"
                                        checked={formData.jenis_komputer === 'PROJEK'}
                                        onChange={handleChange}
                                        className="accent-purple-500"
                                    />
                                    <span>Projek</span>
                                </label>
                                <input
                                    type="date"
                                    name="project_date"
                                    disabled={formData.jenis_komputer !== 'PROJEK'}
                                    value={formData.project_date}
                                    onChange={handleChange}
                                    className="bg-[var(--bg-primary)] border border-slate-700 rounded px-2 py-1 text-sm disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Umur PC */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Umur Komputer (Tahun)</label>
                            <input
                                type="number"
                                name="umur_komputer"
                                value={formData.umur_komputer}
                                onChange={handleChange}
                                className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:border-purple-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        {/* RAM */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">RAM (GB)</label>
                            <input
                                type="number"
                                name="saiz_ram"
                                value={formData.saiz_ram}
                                onChange={handleChange}
                                className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:border-purple-500 outline-none"
                                placeholder="8"
                            />
                        </div>
                    </div>

                    {/* Processor */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Jenis Processor</label>
                        <div className="flex flex-wrap gap-4 items-center">
                            {['i3', 'i5', 'i7'].map(proc => (
                                <label key={proc} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="jenis_processor"
                                        value={proc}
                                        checked={formData.jenis_processor === proc}
                                        onChange={handleChange}
                                        className="accent-purple-500"
                                    />
                                    <span>{proc}</span>
                                </label>
                            ))}
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="jenis_processor"
                                        value="Others"
                                        checked={formData.jenis_processor === 'Others'}
                                        onChange={handleChange}
                                        className="accent-purple-500"
                                    />
                                    <span>Others:</span>
                                </label>
                                <input
                                    type="text"
                                    name="other_proc_text"
                                    disabled={formData.jenis_processor !== 'Others'}
                                    value={formData.other_proc_text}
                                    onChange={handleChange}
                                    className="bg-[var(--bg-secondary)] border border-slate-700 rounded px-2 py-1 text-sm disabled:opacity-50 w-32"
                                />
                            </div>
                        </div>
                    </div>

                    {/* System Type */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">System Type</label>
                        <div className="flex gap-4">
                            {['32BIT', '64BIT'].map(sys => (
                                <label key={sys} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="jenis_sistem"
                                        value={sys}
                                        checked={formData.jenis_sistem === sys}
                                        onChange={handleChange}
                                        className="accent-purple-500"
                                    />
                                    <span>{sys}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Antivirus & IP */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Antivirus</label>
                            <input
                                type="text"
                                name="antivirus"
                                value={formData.antivirus}
                                onChange={handleChange}
                                className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:border-purple-500 outline-none"
                                placeholder="Antivirus name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">IPv4 Address</label>
                            <input
                                type="text"
                                name="ipv4_address"
                                value={formData.ipv4_address}
                                onChange={handleChange}
                                className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:border-purple-500 outline-none"
                                placeholder="192.168.0.1"
                            />
                        </div>
                    </div>

                    {/* Catatan */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Catatan</label>
                        <textarea
                            name="catatan"
                            value={formData.catatan}
                            onChange={handleChange}
                            rows="4"
                            className="w-full bg-[var(--bg-secondary)] border border-slate-700 rounded-lg p-3 focus:border-purple-500 outline-none resize-none"
                            placeholder="Tambahan informasi..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <input
                            type="reset"
                            value="RESET"
                            onClick={() => setFormData({ ...formData, nama_penuh: '', catatan: '' })} // Simplify reset
                            className="px-6 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg py-2.5 font-medium shadow-lg shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            {loading ? 'Saving...' : 'SAVE'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default NewRecord;
