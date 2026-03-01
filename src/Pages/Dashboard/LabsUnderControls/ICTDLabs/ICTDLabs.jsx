import React, { useState, useEffect, useContext } from "react";
import {
    HiOutlineSearch,
    HiOutlinePencil,
    HiOutlineRefresh,
    HiOutlineFilter,
} from "react-icons/hi";
import { Link } from "react-router";
import { toast } from "react-hot-toast";
import { AuthContext } from "../../../../contexts/AuthContext";
import api from "../../../../services/api";

const ICTDLabs = () => {
    const { isSuperAdmin, isDivisionAdmin, isDistrictAdmin, isLabAdmin, userDivision, userDistrict, userUpazila, user } = useContext(AuthContext);

    // Jurisdiction Locking
    const lockedDivision = !isSuperAdmin ? (userDivision || null) : null;
    const lockedDistrict = (!isSuperAdmin && !isDivisionAdmin && !isLabAdmin) ? (userDistrict || null) : null;
    const lockedUpazila = (userUpazila) ? (userUpazila || null) : null;

    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        division: lockedDivision || "All",
        district: lockedDistrict || "All",
        upazila: lockedUpazila || "All"
    });
    const [filterOptions, setFilterOptions] = useState({ divisions: [], districts: [], upazilas: [] });

    const entriesPerPage = 25;

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        fetchLabs();
    }, [currentPage, filters, searchTerm]);

    const fetchFilterOptions = async () => {
        try {
            const { data: result } = await api.get(`/ictdl/filter-options`);
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
            const response = await api.get(`/ictdl`, {
                params: {
                    page: currentPage,
                    limit: entriesPerPage,
                    division: filters.division,
                    district: filters.district,
                    upazila: filters.upazila,
                    search: searchTerm,
                }
            });
            const result = response.data;
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

    const totalPages = Math.ceil(totalCount / entriesPerPage);

    return (
        <div className="min-h-screen bg-emerald-50 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-emerald-950">ICTDL ল্যাবসমূহ</h1>
                    <p className="text-emerald-600 mt-2 text-lg">সারা দেশের সকল আইসিটিডিএল ল্যাব ম্যানেজমেন্ট</p>
                    <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mt-3"></div>
                    {isLabAdmin ? (
                        <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-200">
                            <HiOutlineFilter className="w-4 h-4" />
                            Lab Admin ({user?.email})
                        </div>
                    ) : lockedDistrict && isDistrictAdmin ? (
                        <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-200">
                            <HiOutlineFilter className="w-4 h-4" />
                            District Admin({lockedDistrict})
                        </div>
                    ) : lockedDivision && (
                        <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-200">
                            <HiOutlineFilter className="w-4 h-4" />
                            {lockedDivision} Division Admin
                            {lockedDistrict && ` — ${lockedDistrict} District`}
                        </div>
                    )}
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

                    <div className={`grid grid-cols-1 ${isSuperAdmin ? "md:grid-cols-4" : "md:grid-cols-2"} gap-4 pt-4 border-t border-emerald-100`}>
                        {/* Division - Only show for SuperAdmin */}
                        {isSuperAdmin && (
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
                        )}
                        {/* District - Show for SuperAdmin and DivisionAdmin */}
                        {(isSuperAdmin || isDivisionAdmin) && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-emerald-600 uppercase">জেলা (District)</label>
                                <select
                                    value={filters.district}
                                    onChange={(e) => { setFilters({ ...filters, district: e.target.value, upazila: "All" }); setCurrentPage(1); }}
                                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 outline-none"
                                >
                                    <option value="All">সকল জেলা</option>
                                    {filterOptions.districts.map(d => <option key={d} value={d} className="text-black">{d}</option>)}
                                </select>
                            </div>
                        )}
                        {/* Upazila - Show for SuperAdmin and DivisionAdmin only (Hidden for District Admin) */}
                        {(isSuperAdmin || isDivisionAdmin) && (
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
                        )}
                        {/* Clear */}
                        <div className={`flex items-end ${!isSuperAdmin ? "md:col-start-2" : ""}`}>
                            <button
                                onClick={() => {
                                    setFilters({
                                        division: lockedDivision || "All",
                                        district: lockedDistrict || "All",
                                        upazila: lockedUpazila || "All"
                                    });
                                    setSearchTerm("");
                                    setCurrentPage(1);
                                }}
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
                    <div className="p-20 text-center">
                        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        ICTDL ল্যাব লোড করা হচ্ছে...
                    </div>
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
                                {labs.length > 0 ? (
                                    labs.map((lab, idx) => (
                                        <tr key={lab.id} className="hover:bg-emerald-50/50 transition-colors group">
                                            <td className="px-6 py-4">{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                                            <td className="px-6 py-4 font-semibold text-emerald-950">{lab.institute}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    {(isSuperAdmin || isDivisionAdmin || isDistrictAdmin) && (
                                                        <>
                                                            <span className="font-medium">{lab.upazila}</span>
                                                            <span className="text-xs text-emerald-600">{lab.district}</span>
                                                        </>
                                                    )}
                                                    {lab.division && (
                                                        <span className="text-xs text-emerald-400 font-bold">বিভাগ: {lab.division}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{lab.head}</span>
                                                    <span className="text-xs text-emerald-500">{lab.mobile}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <Link
                                                        to={`/dashboard/ictdLabsUpdate/${lab.id}`}
                                                        className="p-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all shadow-sm"
                                                    >
                                                        <HiOutlinePencil className="w-5 h-5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-emerald-400">
                                            কোন ল্যাব পাওয়া যায়নি।
                                        </td>
                                    </tr>
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
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-white border rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <div className="flex gap-1">
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-sm transition-colors ${currentPage === pageNum ? 'bg-emerald-600 text-white' : 'bg-white border text-emerald-600'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-white border rounded-lg disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ICTDLabs;