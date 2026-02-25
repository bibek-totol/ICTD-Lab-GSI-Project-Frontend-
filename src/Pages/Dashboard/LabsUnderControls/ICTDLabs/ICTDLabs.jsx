import React, { useState, useEffect } from "react";
import {
    HiOutlineSearch,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineFilter,
    HiOutlineDownload,
    HiOutlineRefresh,
    HiOutlineCloudUpload,
} from "react-icons/hi";
import { Link } from "react-router";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ICTDLabs = () => {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({ division: "All", district: "All", upazila: "All" });
    const [filterOptions, setFilterOptions] = useState({ divisions: [], districts: [], upazilas: [] });
    const [isImporting, setIsImporting] = useState(false);

    const entriesPerPage = 25;

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        fetchLabs();
    }, [currentPage, filters, searchTerm]);

    const fetchFilterOptions = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/ictdl/filter-options`);
            const result = await response.json();
            if (result.success) {
                setFilterOptions({
                    divisions: result.data.divisions || [],
                    districts: result.data.districts || [],
                    upazilas: result.data.upazilas || [],
                });
            }
        } catch (error) {
            console.error("Error fetching filter options:", error);
        }
    };

    const fetchLabs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: entriesPerPage.toString(),
                division: filters.division,
                district: filters.district,
                upazila: filters.upazila,
                search: searchTerm,
            });

            const response = await fetch(`${API_BASE_URL}/ictdl?${params.toString()}`);
            const result = await response.json();
            if (result.success) {
                setLabs(result.data);
                setTotalCount(result.totalCount);
            }
        } catch (error) {
            console.error("Error fetching ICTDL labs:", error);
            toast.error("Failed to load labs");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        toast((t) => (
            <div className="flex items-center gap-4 p-1">
                <div className="flex flex-col gap-1">
                    <p className="font-bold text-emerald-900 text-sm">Bulk Import Labs?</p>
                    <p className="text-xs text-emerald-600">This will import all labs from srd-data.json.</p>
                </div>
                <div className="flex gap-2 ml-auto">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            setIsImporting(true);
                            toast.loading("Importing data, please wait...", { id: 'import', style: { borderRadius: '10px', background: '#333', color: '#fff' } });

                            try {
                                const response = await fetch('/srd-data.json');
                                const data = await response.json();

                                const importResponse = await fetch(`${API_BASE_URL}/ictdl/import`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(data),
                                });

                                const result = await importResponse.json();
                                if (result.success) {
                                    toast.success(result.message, { id: 'import', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                                    fetchLabs();
                                    fetchFilterOptions();
                                } else {
                                    toast.error(result.message || "Import failed", { id: 'import', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                                }
                            } catch (error) {
                                console.error("Import error:", error);
                                toast.error("Import failed: " + error.message, { id: 'import', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                            } finally {
                                setIsImporting(false);
                            }
                        }}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                    >
                        Import
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100 cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 10000,
            position: 'top-center',
            style: {
                minWidth: '400px',
                borderRadius: '1rem',
                background: '#fff',
                border: '1px solid #d1fae5',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            },
        });
    };

    const handleDelete = async (id) => {
        toast((t) => (
            <div className="flex items-center gap-4 p-1">
                <div className="flex flex-col gap-1">
                    <p className="font-bold text-emerald-900 text-sm">Delete Lab?</p>
                    <p className="text-xs text-emerald-600">This will also remove images from Cloudinary.</p>
                </div>
                <div className="flex gap-2 ml-auto">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const deletingToast = toast.loading("Deleting lab...", { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                            try {
                                const response = await fetch(`${API_BASE_URL}/ictdl/${id}`, { method: "DELETE" });
                                const result = await response.json();
                                if (result.success) {
                                    toast.success("Lab deleted successfully", { id: deletingToast, style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                                    fetchLabs();
                                } else {
                                    toast.error(result.message || "Delete failed", { id: deletingToast, style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                                }
                            } catch (error) {
                                console.error("Delete error:", error);
                                toast.error("Internal server error", { id: deletingToast, style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                            }
                        }}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100 cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 6000,
            position: 'top-center',
            style: {
                minWidth: '380px',
                borderRadius: '1rem',
                background: '#fff',
                border: '1px solid #d1fae5',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            },
        });
    };

    const totalPages = Math.ceil(totalCount / entriesPerPage);

    return (
        <div className="min-h-screen bg-emerald-50 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-emerald-950">ICTDL ল্যাবসমূহ</h1>
                    <p className="text-emerald-600 mt-2 text-lg">সারা দেশের সকল আইসিটিডিএল ল্যাব ম্যানেজমেন্ট</p>
                    <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mt-3"></div>
                </div>

            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-5">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
                            <input
                                type="text"
                                placeholder="প্রতিষ্ঠান, প্রধান বা যোগাযোগের তথ্য খুঁজুন..."
                                className="block w-full pl-10 pr-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm outline-none"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={fetchLabs} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                <HiOutlineRefresh className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-emerald-100">
                        {/* Division */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-emerald-600 uppercase">বিভাগ (Division)</label>
                            <select
                                value={filters.division}
                                onChange={(e) => { setFilters({ ...filters, division: e.target.value, district: "All" }); setCurrentPage(1); }}
                                className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 outline-none"
                            >
                                <option value="All">সকল বিভাগ</option>
                                {filterOptions.divisions.map(d => <option key={d} value={d} className="text-black">{d}</option>)}
                            </select>
                        </div>
                        {/* District */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-emerald-600 uppercase">জেলা (District)</label>
                            <select
                                value={filters.district}
                                onChange={(e) => { setFilters({ ...filters, district: e.target.value }); setCurrentPage(1); }}
                                className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 outline-none"
                            >
                                <option value="All">সকল জেলা</option>
                                {filterOptions.districts.map(d => <option key={d} value={d} className="text-black">{d}</option>)}
                            </select>
                        </div>
                        {/* Upazila */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-emerald-600 uppercase">উপজেলা (Upazila)</label>
                            <select
                                value={filters.upazila}
                                onChange={(e) => { setFilters({ ...filters, upazila: e.target.value }); setCurrentPage(1); }}
                                className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 outline-none"
                            >
                                <option value="All">সকল উপজেলা</option>
                                {filterOptions.upazilas.map(u => <option key={u} value={u} className="text-black">{u}</option>)}
                            </select>
                        </div>
                        {/* Clear */}
                        <div className="flex items-end">
                            <button
                                onClick={() => { setFilters({ division: "All", district: "All", upazila: "All" }); setSearchTerm(""); setCurrentPage(1); }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all text-sm font-semibold"
                            >
                                <HiOutlineFilter className="w-5 h-5" />
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center"><div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>ICTDL ল্যাব লোড করা হচ্ছে...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap text-left text-sm">
                            <thead>
                                <tr className="bg-emerald-50/50 border-b border-emerald-100">
                                    <th className="px-6 py-4 font-bold text-emerald-600 uppercase">ক্রম</th>
                                    <th className="px-6 py-4 font-bold text-emerald-600 uppercase">প্রতিষ্ঠানের নাম</th>
                                    <th className="px-6 py-4 font-bold text-emerald-600 uppercase">অবস্থান</th>
                                    <th className="px-6 py-4 font-bold text-emerald-600 uppercase">যোগাযোগ</th>
                                    <th className="px-6 py-4 font-bold text-emerald-600 uppercase text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                                {labs.length > 0 ? labs.map((lab, idx) => (
                                    <tr key={lab.id} className="hover:bg-emerald-50/50 transition-colors group">
                                        <td className="px-6 py-4">{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                                        <td className="px-6 py-4 font-semibold text-emerald-950">{lab.institute}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{lab.upazila}</span>
                                                <span className="text-xs text-emerald-600">{lab.district}</span>
                                                {lab.division && (
                                                    <span className="text-xs text-emerald-400">বিভাগ: {lab.division}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col"><span className="font-medium">{lab.head}</span><span className="text-xs text-emerald-500">{lab.mobile}</span></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <Link to={`/dashboard/ictdLabsUpdate/${lab.id}`} className="p-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all shadow-sm"><HiOutlinePencil className="w-5 h-5" /></Link>

                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" className="px-6 py-10 text-center text-emerald-400">কোন ল্যাব পাওয়া যায়নি।</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-emerald-100 bg-emerald-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                        <span className="text-sm text-emerald-600">Total {totalCount} records found</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-white border rounded-lg disabled:opacity-50">Previous</button>
                            <div className="flex gap-1">
                                {/* Simple pagination logic */}
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;

                                    return (
                                        <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-lg text-sm transition-colors ${currentPage === pageNum ? 'bg-emerald-600 text-white' : 'bg-white border text-emerald-600'}`}>{pageNum}</button>
                                    );
                                })}
                            </div>
                            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-white border rounded-lg disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ICTDLabs;