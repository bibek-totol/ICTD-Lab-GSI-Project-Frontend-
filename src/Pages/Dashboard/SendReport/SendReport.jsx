import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import {
    HiOutlineSearch,
    HiOutlineFilter,
    HiOutlineDownload,
    HiOutlinePrinter,
    HiOutlineRefresh,
    HiOutlineTrash,
    HiOutlineEye,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
} from "react-icons/hi";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { AuthContext } from "../../../contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SendReport = () => {
    const { isSuperAdmin, isDivisionAdmin, isDistrictAdmin, isUpazilaAdmin, userDivision, userDistrict, userUpazila } = useContext(AuthContext);

    // Compute locked jurisdiction params for non-SuperAdmin
    const lockedDivision = !isSuperAdmin ? (userDivision || null) : null;
    const lockedDistrict = (!isSuperAdmin && !isDivisionAdmin) ? (userDistrict || null) : null;
    const lockedUpazila = (isUpazilaAdmin) ? (userUpazila || null) : null;

    const [filters, setFilters] = useState({
        division: lockedDivision || "All",
        district: lockedDistrict || "All",
        upazila: lockedUpazila || "All",
        labType: "All",
    });

    const [entriesPerPage, setEntriesPerPage] = useState(25);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [reportsData, setReportsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterOptions, setFilterOptions] = useState({
        divisions: [],
        districts: [],
        upazilas: [],
        labTypes: [],
    });
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch filter options on mount
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/labs/filter-options`, {
                    headers: { "Authorization": token ? `Bearer ${token}` : "" }
                });
                const result = await response.json();

                if (result.success) {
                    setFilterOptions({
                        divisions: result.data.divisions || [],
                        districts: result.data.districts || [],
                        upazilas: result.data.upazilas || [],
                        labTypes: result.data.labTypes || [],
                    });
                }
            } catch (error) {
                console.error("Error fetching filter options:", error);
            }
        };

        fetchFilterOptions();
    }, []);

    // Fetch reports data
    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();

                // Apply locked jurisdiction for non-SuperAdmin
                const divisionParam = lockedDivision || (filters.division !== "All" ? filters.division : null);
                const districtParam = lockedDistrict || (filters.district !== "All" ? filters.district : null);
                const upazilaParam = lockedUpazila || (filters.upazila !== "All" ? filters.upazila : null);

                if (divisionParam) params.append("division", divisionParam);
                if (districtParam) params.append("district", districtParam);
                if (upazilaParam) params.append("upazila", upazilaParam);
                if (filters.labType !== "All") params.append("labType", filters.labType);
                if (searchTerm) params.append("search", searchTerm);

                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${API_BASE_URL}/lab-reports?${params.toString()}`,
                    { headers: { "Authorization": token ? `Bearer ${token}` : "" } }
                );
                const result = await response.json();

                if (result.success) {
                    setReportsData(result.data);
                } else {
                    setError(result.message || "Failed to fetch reports");
                }
            } catch (error) {
                console.error("Error fetching reports data:", error);
                setError("Failed to load reports data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [filters, searchTerm, lockedDivision, lockedDistrict, lockedUpazila]);


    // Format mobile number
    const formatMobile = (mobile) => {
        if (!mobile) return "";
        const mobileStr = String(mobile);
        return mobileStr.startsWith("0") ? mobileStr : `0${mobileStr}`;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Pagination Logic
    const totalEntries = reportsData.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const currentEntries = reportsData.slice(
        startIndex,
        startIndex + entriesPerPage,
    );

    const handleResetFilters = () => {
        setFilters({
            division: lockedDivision || "All",
            district: lockedDistrict || "All",
            upazila: lockedUpazila || "All",
            labType: "All",
        });
        setSearchTerm("");
        setCurrentPage(1);
    };

    const handleExport = (type) => {
        if (type === "reload") {
            window.location.reload();
            return;
        }

        if (type === "print") {
            window.print();
            return;
        }

        if (type === "reset") {
            handleResetFilters();
            return;
        }

        // Export Logic
        const exportData = reportsData.map((report) => ({
            "Lab Type": report.labType === "sof" ? "SOF" : "ICTDL & SOF",
            Institute: report.institute,
            Division: report.division,
            District: report.district, // Added District to export
            Upazila: report.upazila,
            "Basic Robotics": report.basicRobotics,
            "Advanced Robotics": report.advancedRobotics,
            "3D Printer": report["3dPrinter"],
            "VR Headset": report.vrHeadset,
            "Network Camera": report.networkCamera,
            UPS: report.ups,
            Functional: report.isFunctional === "yes" ? "Yes" : "No",
            "Submitted Date": formatDate(report.createdAt),
        }));

        const workSheet = XLSX.utils.json_to_sheet(exportData);
        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, "Reports");

        if (type === "excel") {
            XLSX.writeFile(workBook, "Lab_Reports.xlsx");
        }
    };

    const handleViewDetails = (report) => {
        setSelectedReport(report);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedReport(null);
    };

    const handleDeleteReport = async (reportId) => {
        toast((t) => (
            <div className="flex items-center gap-4 p-1">
                <div className="flex flex-col gap-1">
                    <p className="font-bold text-emerald-900 text-sm">Delete Report?</p>
                    <p className="text-xs text-emerald-600">This action cannot be undone.</p>
                </div>
                <div className="flex gap-2 ml-auto">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const loadingToast = toast.loading("Deleting report...", {
                                style: { borderRadius: '10px', background: '#333', color: '#fff' }
                            });

                            try {
                                const token = localStorage.getItem("token");
                                const response = await fetch(`${API_BASE_URL}/lab-reports/${reportId}`, {
                                    method: "DELETE",
                                    headers: { "Authorization": token ? `Bearer ${token}` : "" }
                                });
                                const result = await response.json();

                                if (result.success) {
                                    toast.success("Report deleted successfully", {
                                        id: loadingToast,
                                        icon: '🗑️',
                                        style: { borderRadius: '10px', background: '#333', color: '#fff' }
                                    });
                                    // Refresh the data
                                    setReportsData(reportsData.filter((r) => r.id !== reportId));
                                } else {
                                    toast.error(result.message || "Failed to delete report", { id: loadingToast });
                                }
                            } catch (error) {
                                console.error("Error deleting report:", error);
                                toast.error("Failed to delete report", { id: loadingToast });
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
                minWidth: '350px',
                borderRadius: '1rem',
                background: '#fff',
                border: '1px solid #d1fae5',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            },
        });
    };

    return (
        <div className="min-h-screen bg-emerald-50 p-6 space-y-6">
            <style>
                {`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            body {
              background-color: white;
            }
            .p-6 {
                padding: 0 !important;
            }
          }
        `}
            </style>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                <div>
                    <h1 className="text-4xl font-bold text-emerald-950">প্রতিবেদন সমূহ</h1>
                    <p className="text-emerald-600 mt-2 text-lg">
                        সকল ল্যাব থেকে জমা দেওয়া IT সরঞ্জাম প্রতিবেদন
                    </p>
                    <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mt-3"></div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleExport("excel")}
                        className="cursor-pointer hover:scale-105 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all text-sm font-semibold border border-emerald-100"
                    >
                        <HiOutlineDownload className="w-5 h-5" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Controls & Filters Card */}
            <div className="bg-white backdrop-blur-xl rounded-xl shadow-sm border border-emerald-100 p-5 no-print">
                <div className="flex flex-col gap-6">
                    {/* Top Row: Search & Action Buttons */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <HiOutlineSearch className="h-5 w-5 text-emerald-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm transition-all text-emerald-950 placeholder-emerald-400"
                                placeholder="Search by institution or location..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <button
                                onClick={() => handleExport("excel")}
                                className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 transition-colors text-sm font-medium"
                                title="Export Excel"
                            >
                                <FaFileExcel />
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                            <button
                                onClick={() => handleExport("print")}
                                className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-red-600 text-white border border-emerald-200 rounded-lg hover:bg-red-700 hover:text-white transition-colors text-sm font-medium"
                                title="Print"
                            >
                                <HiOutlinePrinter className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleExport("reload")}
                                className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 transition-colors text-sm font-medium"
                                title="Reload"
                            >
                                <HiOutlineRefresh className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className={`grid grid-cols-1 ${isSuperAdmin ? "sm:grid-cols-2 md:grid-cols-4" : "sm:grid-cols-2"} gap-4 pt-4 border-t border-emerald-100`}>
                        {/* Division - Only show for SuperAdmin */}
                        {isSuperAdmin && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                    বিভাগ (Division)
                                </label>
                                <select
                                    value={filters.division}
                                    onChange={(e) => {
                                        setFilters({ ...filters, division: e.target.value, district: "All", upazila: "All" });
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900"
                                >
                                    <option value="All">সকল বিভাগ</option>
                                    {filterOptions.divisions.map((division) => (
                                        <option className="text-black" key={division} value={division}>
                                            {division}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* District - Only show for SuperAdmin */}
                        {isSuperAdmin && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                    জেলা (District)
                                </label>
                                <select
                                    value={filters.district}
                                    onChange={(e) => {
                                        setFilters({ ...filters, district: e.target.value, upazila: "All" });
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900"
                                >
                                    <option value="All">সকল জেলা</option>
                                    {filterOptions.districts.map((district) => (
                                        <option className="text-black" key={district} value={district}>
                                            {district}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Upazila - Only show for SuperAdmin */}
                        {isSuperAdmin && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                    উপজেলা (Upazila)
                                </label>
                                <select
                                    value={filters.upazila}
                                    onChange={(e) => {
                                        setFilters({ ...filters, upazila: e.target.value });
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900"
                                >
                                    <option value="All">সকল উপজেলা</option>
                                    {filterOptions.upazilas.map((upazila) => (
                                        <option className="text-black" key={upazila} value={upazila}>
                                            {upazila}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Lab Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                ল্যাব টাইপ (Lab Type)
                            </label>
                            <select
                                value={filters.labType}
                                onChange={(e) => {
                                    setFilters({ ...filters, labType: e.target.value });
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900"
                            >
                                <option value="All">সকল টাইপ</option>
                                {filterOptions.labTypes.map((type) => (
                                    <option className="text-black" key={type} value={type}>
                                        {type === "sof"
                                            ? "SOF"
                                            : type === "ictdl_sof"
                                                ? "ICTDL & SOF"
                                                : type.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear Filters */}
                        <div className={`${isSuperAdmin ? "sm:col-span-2 md:col-span-4" : "sm:col-span-2"} flex justify-end`}>
                            <button
                                onClick={handleResetFilters}
                                className="cursor-pointer hover:scale-105 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm hover:shadow transition-all text-sm font-medium flex items-center justify-center gap-2 border border-emerald-100"
                            >
                                <HiOutlineFilter className="w-5 h-5" />
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg backdrop-blur-sm">
                    {error}
                </div>
            )}

            {/* Main Table Card */}
            <div className="bg-white backdrop-blur-xl rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-emerald-600">
                        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Loading reports data...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead>
                                <tr className="bg-emerald-50 border-b border-emerald-100 text-left">
                                    <th className="px-6 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                        ক্রম / ল্যাব
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                        প্রতিষ্ঠান
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                        সরঞ্জাম সংখ্যা
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                        কার্যকারিতা
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                        জমার তারিখ
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider text-center no-print">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                                {currentEntries.length > 0 ? (
                                    currentEntries.map((report, index) => (
                                        <tr
                                            key={report.id}
                                            className="hover:bg-emerald-50/50 transition-all duration-300 group border-l-4 border-transparent hover:border-emerald-500"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${report.labType === "sof"
                                                            ? "bg-blue-900/50 text-black border border-blue-500/30"
                                                            : "bg-purple-900/50 text-black   border border-purple-500/30"
                                                            }`}
                                                    >
                                                        {report.labType === "sof" ? "SOF" : "ICTDL & SOF"}
                                                    </span>
                                                    <span className="text-xs text-emerald-400">
                                                        #{startIndex + index + 1}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col max-w-xs">
                                                    <span
                                                        className="text-sm font-semibold text-emerald-950 truncate"
                                                        title={report.institute}
                                                    >
                                                        {report.institute}
                                                    </span>
                                                    <span className="text-xs text-emerald-500 mt-1">
                                                        {report.upazila}, {report.district}, {report.division}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col text-xs text-emerald-600">
                                                    <span>🤖 Basic: {report.basicRobotics}</span>
                                                    <span>🦾 Advanced: {report.advancedRobotics}</span>
                                                    <span>🖨️ 3D: {report["3dPrinter"]}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {report.isFunctional === "yes" ? (
                                                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                                            Functional
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-rose-500 font-medium">
                                                            <HiOutlineXCircle className="w-5 h-5" />
                                                            Not Functional
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-emerald-800">
                                                    {formatDate(report.createdAt)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right no-print">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(report)}
                                                        className="flex items-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all shadow-sm hover:shadow font-medium text-sm cursor-pointer"
                                                        title="View Details"
                                                    >
                                                        <HiOutlineEye className="w-5 h-5" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteReport(report.id)}
                                                        className="flex items-center gap-2 px-3 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all shadow-sm hover:shadow font-medium text-sm cursor-pointer"
                                                        title="Delete Report"
                                                    >
                                                        <HiOutlineTrash className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-8 text-center text-emerald-600"
                                        >
                                            No reports found matching criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-emerald-100 bg-emerald-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                        <span>Show</span>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => {
                                setEntriesPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-white border border-emerald-200 rounded-md text-sm py-1 pl-2 pr-8 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900"
                        >
                            <option className="text-black" value={10}>
                                10
                            </option>
                            <option className="text-black" value={25}>
                                25
                            </option>
                            <option className="text-black" value={50}>
                                50
                            </option>
                        </select>
                        <span>entries</span>
                        <span className="ml-2 text-emerald-800">
                            {startIndex + 1}-
                            {Math.min(startIndex + entriesPerPage, totalEntries)} of{" "}
                            {totalEntries}
                        </span>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-emerald-600 transition-all"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                                            ? "bg-emerald-600 text-white shadow-sm border border-emerald-500"
                                            : "text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 border border-transparent"
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() =>
                                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                                }
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-emerald-600 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {isModalOpen && selectedReport && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm print:hidden">
                    <div className="bg-white border-2 border-emerald-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-emerald-100 bg-emerald-50/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-emerald-950">
                                        {selectedReport.institute}
                                    </h2>
                                    <p className="text-emerald-600 text-sm mt-1">
                                        Report Details - {formatDate(selectedReport.createdAt)}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 text-emerald-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all cursor-pointer"
                                >
                                    <HiOutlineXCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Lab Info */}
                            <div className="bg-emerald-50/50 backdrop-blur-sm rounded-xl p-5 border border-emerald-100">
                                <h3 className="text-lg font-bold text-emerald-800 mb-4">
                                    Lab Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-emerald-500">Division:</span>
                                        <span className="text-emerald-950 ml-2 font-medium">
                                            {selectedReport.division}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-emerald-500">Upazila:</span>
                                        <span className="text-emerald-950 ml-2 font-medium">
                                            {selectedReport.upazila}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-emerald-500">Lab Type:</span>
                                        <span className="text-emerald-950 ml-2 font-medium">
                                            {selectedReport.labType === "sof"
                                                ? "SOF"
                                                : "ICTDL & SOF"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-emerald-500">Head:</span>
                                        <span className="text-emerald-950 ml-2 font-medium">
                                            {selectedReport.head}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Equipment Counts */}
                            <div className="bg-teal-50/50 backdrop-blur-sm rounded-xl p-5 border border-teal-100">
                                <h3 className="text-lg font-bold text-teal-800 mb-4">
                                    A. IT Equipment Inventory
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                        <span className="text-emerald-600 text-xs">
                                            🤖 Basic Robotics
                                        </span>
                                        <p className="text-emerald-950 text-2xl font-bold mt-1">
                                            {selectedReport.basicRobotics}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                        <span className="text-emerald-600 text-xs">
                                            🦾 Advanced Robotics
                                        </span>
                                        <p className="text-emerald-950 text-2xl font-bold mt-1">
                                            {selectedReport.advancedRobotics}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                        <span className="text-emerald-600 text-xs">
                                            🖨️ 3D Printer
                                        </span>
                                        <p className="text-emerald-950 text-2xl font-bold mt-1">
                                            {selectedReport["3dPrinter"]}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                        <span className="text-emerald-600 text-xs">
                                            🥽 VR Headset
                                        </span>
                                        <p className="text-emerald-950 text-2xl font-bold mt-1">
                                            {selectedReport.vrHeadset}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                        <span className="text-emerald-600 text-xs">
                                            📹 Network Camera
                                        </span>
                                        <p className="text-emerald-950 text-2xl font-bold mt-1">
                                            {selectedReport.networkCamera}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                        <span className="text-emerald-400 text-xs">🔋 UPS</span>
                                        <p className="text-emerald-950 text-2xl font-bold mt-1">
                                            {selectedReport.ups}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Functionality */}
                            <div className="bg-emerald-50/50 backdrop-blur-sm rounded-xl p-5 border border-emerald-100">
                                <h3 className="text-lg font-bold text-emerald-800 mb-4">
                                    B. Functionality Status
                                </h3>
                                <div className="flex items-center gap-3">
                                    {selectedReport.isFunctional === "yes" ? (
                                        <span className="flex items-center gap-2 text-emerald-600 text-lg font-semibold">
                                            <HiOutlineCheckCircle className="w-6 h-6" />
                                            All equipment is functional
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-rose-500 text-lg font-semibold">
                                            <HiOutlineXCircle className="w-6 h-6" />
                                            Equipment has issues
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Text Fields */}
                            {selectedReport.damageDetails && (
                                <div className="bg-teal-50/50 backdrop-blur-sm rounded-xl p-5 border border-teal-100">
                                    <h3 className="text-lg font-bold text-teal-800 mb-3">
                                        C. Damage Details
                                    </h3>
                                    <p className="text-emerald-900 leading-relaxed">
                                        {selectedReport.damageDetails}
                                    </p>
                                </div>
                            )}

                            {selectedReport.storageImages && selectedReport.storageImages.length > 0 && (
                                <div className="bg-emerald-50/50 backdrop-blur-sm rounded-xl p-5 border border-emerald-100">
                                    <h3 className="text-lg font-bold text-emerald-800 mb-4">
                                        D. Storage Images
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {selectedReport.storageImages.map((imageUrl, index) => (
                                            <div key={index} className="group relative overflow-hidden rounded-lg border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all">
                                                <img
                                                    src={imageUrl}
                                                    alt={`Storage ${index + 1}`}
                                                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                                                    onError={(e) => {
                                                        e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                    <span className="text-white text-sm font-semibold">Image {index + 1}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedReport.recommendations && (
                                <div className="bg-teal-50/50 backdrop-blur-sm rounded-xl p-5 border border-teal-100">
                                    <h3 className="text-lg font-bold text-teal-800 mb-3">
                                        E. Recommendations
                                    </h3>
                                    <p className="text-emerald-900 leading-relaxed">
                                        {selectedReport.recommendations}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-emerald-100 bg-emerald-50/50 flex justify-end">
                            <button
                                onClick={handleCloseModal}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all font-bold cursor-pointer hover:scale-105"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SendReport;