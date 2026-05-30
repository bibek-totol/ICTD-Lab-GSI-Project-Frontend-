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
    HiOutlinePencilAlt,
    HiOutlineSave,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
} from "react-icons/hi";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { AuthContext } from "../../../contexts/AuthContext";
import LabService from "../../../services/lab.service";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const inspectionReportFields = [
    { label: "শিক্ষা প্রতিষ্ঠানের নাম ও ঠিকানা", name: "instituteAddress" },
    { label: "ল্যাব স্থাপনের তারিখ ও সাল", name: "labEstablishedAt" },
    { label: "কম্পিউটার সংখ্যা", name: "computerCount" },
    { label: "অন্যান্য সরঞ্জামাদি ও সংখ্যা", name: "otherEquipmentCount" },
    { label: "ডিজিটাল ল্যাবসমূহের ক্লাস কার্যক্রম পরিচালিত হচ্ছে কিনা?", name: "digitalLabStatus" },
    { label: "ল্যাব রেনোভেশন/ইন্টেরিয়র ডেকোরেশনের জন্য বরাদ্দ ছিল কিনা? (পরিমাণ)", name: "renovationRouteStatus" },
    { label: "ল্যাব ক্লাস রেজিস্টার আছে/নাই (না থাকলে কারণ)", name: "labClassRegister" },
    { label: "ল্যাবে ক্যামেরা আছে/নাই (না থাকলে কারণ)", name: "labCameraStatus" },
    { label: "ইন্টারনেট কানেকশন আছে/নাই (না থাকলে কারণ)", name: "internetConnectionStatus" },
    { label: "আইসিটিডি স্কুল অব ফিউচার এবং রোবোটিক্স কর্নার সরঞ্জামসমূহ পরিচালিত না হলে তার কারণ।", name: "sofRoboticsStatus" },
    { label: "বর্তমান অবস্থা", name: "currentStatus" },
];

const getInspectionFieldType = (fieldName) => {
    if (fieldName === "computerCount") return "number";
    if (["digitalLabStatus", "renovationRouteStatus"].includes(fieldName)) return "yesNo";
    if (["labClassRegister", "labCameraStatus", "internetConnectionStatus"].includes(fieldName)) return "exists";
    return "textarea";
};

const SendReport = () => {
    const { isSuperAdmin, isDivisionAdmin, isDistrictAdmin, isUpazilaAdmin, isLabAdmin, userDivision, userDistrict, userUpazila, user } = useContext(AuthContext);

    // Compute locked jurisdiction params for non-SuperAdmin
    const lockedDivision = !isSuperAdmin ? (userDivision || null) : null;
    const lockedDistrict = (!isSuperAdmin && !isDivisionAdmin && !isLabAdmin) ? (userDistrict || null) : null;
    const lockedUpazila = (isUpazilaAdmin) ? (userUpazila || null) : null;

    const [filters, setFilters] = useState({
        division: lockedDivision || "All",
        district: lockedDistrict || "All",
        upazila: lockedUpazila || "All",
        labType: "All",
        reportType: "All",
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
    const [editingClassReport, setEditingClassReport] = useState(null);
    const [classReportForm, setClassReportForm] = useState({});
    const [isUpdatingClassReport, setIsUpdatingClassReport] = useState(false);

    // Fetch filter options dynamically
    const fetchFilterOptions = async (queryDivision = null, queryDistrict = null) => {
        try {
            const params = {};
            if (queryDivision && queryDivision !== "All") params.division = queryDivision;
            if (queryDistrict && queryDistrict !== "All") params.district = queryDistrict;

            const result = await LabService.getUnifiedFilterOptions(params);

            if (result.success) {
                setFilterOptions(result.data);
            }
        } catch (error) {
            console.error("Error fetching filter options:", error);
        }
    };

    useEffect(() => {
        // Initial fetch with current/locked jurisdictions
        fetchFilterOptions(lockedDivision, lockedDistrict);
    }, [lockedDivision, lockedDistrict]);

    // Re-fetch options when selection changes
    useEffect(() => {
        if (filters.division !== "All" || filters.district !== "All") {
            fetchFilterOptions(filters.division, filters.district);
        } else {
            fetchFilterOptions(lockedDivision, lockedDistrict);
        }
    }, [filters.division, filters.district]);

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
                const headers = { "Authorization": token ? `Bearer ${token}` : "" };
                const [equipmentResponse, classResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/lab-reports?${params.toString()}`, { headers }),
                    fetch(`${API_BASE_URL}/class-reports?${params.toString()}`, { headers }),
                ]);
                const [equipmentResult, classResult] = await Promise.all([
                    equipmentResponse.json(),
                    classResponse.json(),
                ]);

                if (equipmentResult.success && classResult.success) {
                    setReportsData([
                        ...(equipmentResult.data || []).map((report) => ({ ...report, reportType: report.reportType || "equipment" })),
                        ...(classResult.data || []).map((report) => ({ ...report, reportType: report.reportType || "class" })),
                    ]);
                } else {
                    setError(equipmentResult.message || classResult.message || "Failed to fetch reports");
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

    const parseInspectionDetails = (report) => {
        const directDetails = inspectionReportFields.reduce((details, field) => {
            if (report[field.name] !== undefined && report[field.name] !== null && report[field.name] !== "") {
                details[field.name] = report[field.name];
            }
            return details;
        }, {});

        if (report.reportDetails && typeof report.reportDetails === "object") {
            return { ...report.reportDetails, ...directDetails };
        }

        if (report.reportDetails && typeof report.reportDetails === "string") {
            try {
                return { ...JSON.parse(report.reportDetails), ...directDetails };
            } catch (error) {
                console.error("Error parsing inspection report details:", error);
            }
        }

        const details = {};
        const summary = report.damageDetails || "";
        inspectionReportFields.forEach((field, index) => {
            const nextLabel = inspectionReportFields[index + 1]?.label;
            const start = summary.indexOf(`${field.label}:`);
            if (start === -1) return;

            const valueStart = start + field.label.length + 1;
            const valueEnd = nextLabel
                ? summary.indexOf(`${nextLabel}:`, valueStart)
                : summary.length;
            details[field.name] = summary
                .slice(valueStart, valueEnd === -1 ? summary.length : valueEnd)
                .trim();
        });

        return { ...details, ...directDetails };
    };

    const isInspectionReport = (report) => {
        if (report.reportType === "class" || report.reportDetails) return true;
        const summary = report.damageDetails || "";
        return inspectionReportFields.some((field) => summary.includes(`${field.label}:`));
    };

    const showEquipmentReports = filters.reportType === "All" || filters.reportType === "equipment";
    const showInspectionReports = filters.reportType === "All" || filters.reportType === "class" || filters.reportType === "inspection";
    const equipmentReports = showEquipmentReports
        ? reportsData.filter((report) => !isInspectionReport(report))
        : [];
    const inspectionReports = showInspectionReports
        ? reportsData.filter(isInspectionReport)
        : [];
    const shouldRenderEquipmentTable = showEquipmentReports
        && (filters.reportType === "equipment" || loading || equipmentReports.length > 0 || inspectionReports.length === 0);

    // Pagination Logic
    const totalEntries = equipmentReports.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const currentEntries = equipmentReports.slice(
        startIndex,
        startIndex + entriesPerPage,
    );

    const handleResetFilters = () => {
        setFilters({
            division: lockedDivision || "All",
            district: lockedDistrict || "All",
            upazila: lockedUpazila || "All",
            labType: "All",
            reportType: "All",
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
            "Lab Type": report.labType === "sof" ? "SOF" : report.labType === "ictdl" ? "ICTDL" : "ICTDL & SOF",
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

    const handleEditClassReport = (report) => {
        const details = parseInspectionDetails(report);
        setEditingClassReport(report);
        setClassReportForm(details);
    };

    const handleClassReportFormChange = (name, value) => {
        setClassReportForm((current) => ({ ...current, [name]: value }));
    };

    const handleUpdateClassReport = async (event) => {
        event.preventDefault();
        if (!editingClassReport) return;

        setIsUpdatingClassReport(true);
        const loadingToast = toast.loading("Updating class report...", {
            style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });

        try {
            const computerCount = parseInt(classReportForm.computerCount, 10) || 0;
            const payload = {
                ...classReportForm,
                computerCount,
                reportDetails: { ...classReportForm, computerCount },
                reportSummary: inspectionReportFields
                    .map((field) => `${field.label}: ${classReportForm[field.name] || ""}`)
                    .join("\n"),
            };

            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/class-reports/${editingClassReport.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
                body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (result.success) {
                setReportsData((current) => current.map((report) => (
                    report.id === editingClassReport.id && report.reportType === "class"
                        ? { ...report, ...result.data, reportType: "class" }
                        : report
                )));
                if (selectedReport?.id === editingClassReport.id && selectedReport?.reportType === "class") {
                    setSelectedReport({ ...selectedReport, ...result.data, reportType: "class" });
                }
                setEditingClassReport(null);
                setClassReportForm({});
                toast.success("Class report updated successfully", { id: loadingToast });
            } else {
                toast.error(result.message || "Failed to update class report", { id: loadingToast });
            }
        } catch (error) {
            console.error("Error updating class report:", error);
            toast.error("Failed to update class report", { id: loadingToast });
        } finally {
            setIsUpdatingClassReport(false);
        }
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
                                const report = reportsData.find((item) => item.id === reportId);
                                const endpoint = report?.reportType === "class" ? "class-reports" : "lab-reports";
                                const response = await fetch(`${API_BASE_URL}/${endpoint}/${reportId}`, {
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
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          @media print {
            body * {
              visibility: hidden;
            }
            html,
            body {
              width: 210mm;
              min-height: 297mm;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-modal-wrapper,
            .print-modal-wrapper * {
              visibility: visible;
            }
            .print-modal-wrapper {
              position: absolute !important;
              inset: 0 !important;
              display: block !important;
              padding: 0 !important;
              background: #ffffff !important;
              overflow: visible !important;
              backdrop-filter: none !important;
            }
            .print-modal {
              position: static !important;
              width: 100% !important;
              max-width: none !important;
              max-height: none !important;
              overflow: visible !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              color: #064e3b !important;
              display: block !important;
            }
            .print-modal-content {
              overflow: visible !important;
              padding: 0 !important;
              display: block !important;
            }
            .print-modal > div:first-child {
              padding: 0 0 8mm 0 !important;
              margin-bottom: 6mm !important;
              border-bottom: 2px solid #047857 !important;
              background: #ffffff !important;
            }
            .print-modal h2 {
              font-size: 18pt !important;
              line-height: 1.25 !important;
              color: #022c22 !important;
            }
            .print-modal h3 {
              font-size: 12pt !important;
              margin-bottom: 4mm !important;
              color: #065f46 !important;
            }
            .print-modal table {
              width: 100% !important;
              min-width: 0 !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
              page-break-inside: auto;
            }
            .print-modal tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            .print-modal th,
            .print-modal td {
              border: 1px solid #94a3b8 !important;
              padding: 6px 8px !important;
              vertical-align: top !important;
              color: #022c22 !important;
              background: #ffffff !important;
              font-size: 9pt !important;
              line-height: 1.35 !important;
              white-space: normal !important;
              word-break: break-word !important;
            }
            .print-modal th {
              background: #ecfdf5 !important;
              color: #065f46 !important;
              font-weight: 700 !important;
              width: 34% !important;
            }
            .print-modal .rounded-xl,
            .print-modal .rounded-2xl,
            .print-modal .rounded-lg {
              border-radius: 0 !important;
            }
            .print-modal .shadow-sm,
            .print-modal .shadow-lg,
            .print-modal .shadow-2xl,
            .print-modal .shadow-xl {
              box-shadow: none !important;
            }
            .print-modal .bg-emerald-50\\/50,
            .print-modal .bg-teal-50\\/50,
            .print-modal .bg-white,
            .print-modal .bg-emerald-50 {
              background: #ffffff !important;
            }
            .print-modal .grid {
              display: table !important;
              width: 100% !important;
              border-collapse: collapse !important;
            }
            .print-modal .grid > div {
              display: table-row !important;
              page-break-inside: avoid;
            }
            .print-modal .grid > div > span:first-child,
            .print-modal .grid > div > span.text-emerald-500 {
              display: table-cell !important;
              width: 34% !important;
              border: 1px solid #94a3b8 !important;
              background: #ecfdf5 !important;
              padding: 6px 8px !important;
              font-weight: 700 !important;
              color: #065f46 !important;
            }
            .print-modal .grid > div > span:last-child,
            .print-modal .grid > div > span.text-emerald-950 {
              display: table-cell !important;
              border: 1px solid #94a3b8 !important;
              padding: 6px 8px !important;
            }
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            .equipment-screen-sections {
              display: none !important;
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
                            {lockedUpazila && ` — ${lockedUpazila} Upazila`}
                        </div>
                    )}
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
                    <div className={`grid grid-cols-1 ${isSuperAdmin ? "sm:grid-cols-2 md:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-3"} gap-4 pt-4 border-t border-emerald-100`}>
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

                        {/* District - Show for SuperAdmin and DivisionAdmin */}
                        {(isSuperAdmin || isDivisionAdmin) && (
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

                        {/* Upazila - Show for SuperAdmin, DivisionAdmin and DistrictAdmin */}
                        {(isSuperAdmin || isDivisionAdmin || isDistrictAdmin) && (
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

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                Report Type
                            </label>
                            <select
                                value={filters.reportType}
                                onChange={(e) => {
                                    setFilters({ ...filters, reportType: e.target.value });
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900"
                            >
                                <option value="All">All Reports</option>
                                <option value="equipment">IT Equipment & Functionality Report</option>
                                <option value="class">Class activity management report</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        <div className={`${isSuperAdmin ? "sm:col-span-2 md:col-span-5" : "sm:col-span-2 lg:col-span-3"} flex justify-end`}>
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
            {shouldRenderEquipmentTable && (
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
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${report.labType === "sof"
                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                        : report.labType === "ictdl"
                                                            ? "bg-blue-100 text-blue-700 border-blue-200"
                                                            : "bg-amber-100 text-amber-700 border-amber-200"
                                                        }`}>
                                                        {report.labType === "sof" ? "SOF" : report.labType === "ictdl" ? "ICTDL" : "ICTDL & SOF"}
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
            )}

            {/* Inspection Reports Table */}
            {showInspectionReports && (
            <div className="bg-white backdrop-blur-xl rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50/60">
                    <h2 className="text-xl font-bold text-emerald-950">
                        ক্লাস কার্যক্রম পরিচালনা রিপোর্ট
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[1500px] w-full text-sm">
                        <thead>
                            <tr className="bg-emerald-50 border-b border-emerald-100 text-left">
                                <th className="px-4 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                    ক্রম / ল্যাব
                                </th>
                                {inspectionReportFields.map((field) => (
                                    <th
                                        key={field.name}
                                        className="px-4 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider align-top"
                                    >
                                        {field.label}
                                    </th>
                                ))}
                                <th className="px-4 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                    জমার তারিখ
                                </th>
                                <th className="px-4 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                    Submitted By
                                </th>
                                <th className="px-4 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider text-center no-print">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50">
                            {inspectionReports.length > 0 ? (
                                inspectionReports.map((report, index) => {
                                    const details = parseInspectionDetails(report);

                                    return (
                                        <tr
                                            key={`inspection-${report.id}`}
                                            className="hover:bg-emerald-50/50 transition-all duration-300 group border-l-4 border-transparent hover:border-emerald-500"
                                        >
                                            <td className="px-4 py-4 align-top">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${report.labType === "sof"
                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                        : report.labType === "ictdl"
                                                            ? "bg-blue-100 text-blue-700 border-blue-200"
                                                            : "bg-amber-100 text-amber-700 border-amber-200"
                                                        }`}>
                                                        {report.labType === "sof" ? "SOF" : report.labType === "ictdl" ? "ICTDL" : "ICTDL & SOF"}
                                                    </span>
                                                    <span className="text-xs text-emerald-400">
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                            </td>

                                            {inspectionReportFields.map((field) => (
                                                <td
                                                    key={field.name}
                                                    className="px-4 py-4 align-top text-emerald-900 whitespace-pre-wrap min-w-[160px]"
                                                >
                                                    {details[field.name] || "-"}
                                                </td>
                                            ))}

                                            <td className="px-4 py-4 align-top whitespace-nowrap text-emerald-800">
                                                {formatDate(report.createdAt)}
                                            </td>
                                            <td className="px-4 py-4 align-top min-w-[180px]">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-emerald-900">
                                                        {report.submittedByName || "Unknown"}
                                                    </span>
                                                    {report.submittedByEmail && (
                                                        <span className="text-xs text-emerald-500">
                                                            {report.submittedByEmail}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-top text-right no-print">
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
                                                        onClick={() => handleEditClassReport(report)}
                                                        className="flex items-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all shadow-sm hover:shadow font-medium text-sm cursor-pointer"
                                                        title="Update Report"
                                                    >
                                                        <HiOutlinePencilAlt className="w-5 h-5" />
                                                        Update
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
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={inspectionReportFields.length + 4}
                                        className="px-6 py-8 text-center text-emerald-600"
                                    >
                                        No inspection reports found matching criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {/* Details Modal */}
            {isModalOpen && selectedReport && (
                <div className="print-modal-wrapper fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="print-modal bg-white border-2 border-emerald-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
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
                                <div className="flex items-center gap-3 no-print">
                                    <button
                                        onClick={() => window.print()}
                                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50"
                                        title="Print report"
                                    >
                                        <HiOutlinePrinter className="w-5 h-5" />
                                        Print
                                    </button>
                                    <button
                                        onClick={handleCloseModal}
                                        className="p-2 text-emerald-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all cursor-pointer"
                                    >
                                        <HiOutlineXCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="print-modal-content flex-1 overflow-y-auto p-6 space-y-6">
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
                                        <span className="text-emerald-500">District:</span>
                                        <span className="text-emerald-950 ml-2 font-medium">
                                            {selectedReport.district}
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
                                    {selectedReport.reportType === "class" && (
                                        <div className="col-span-2">
                                            <span className="text-emerald-500">Submitted By:</span>
                                            <span className="text-emerald-950 ml-2 font-medium">
                                                {selectedReport.submittedByName || "Unknown"}
                                                {selectedReport.submittedByEmail ? ` (${selectedReport.submittedByEmail})` : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedReport.reportType === "class" ? (() => {
                                const details = parseInspectionDetails(selectedReport);

                                return (
                                    <div className="bg-teal-50/50 backdrop-blur-sm rounded-xl p-5 border border-teal-100">
                                        <h3 className="text-lg font-bold text-teal-800 mb-4">
                                            ক্লাস কার্যক্রম পরিচালনা রিপোর্ট
                                        </h3>
                                        <div className="overflow-x-auto rounded-xl border border-emerald-100 bg-white">
                                            <table className="w-full min-w-[900px] text-sm">
                                                <tbody className="divide-y divide-emerald-50">
                                                    {inspectionReportFields.map((field) => {
                                                        const detailValue = details[`${field.name}Details`];
                                                        const value = details[field.name] || "-";

                                                        return (
                                                            <tr key={field.name} className="align-top">
                                                                <th className="w-1/3 bg-emerald-50 px-4 py-3 text-left font-semibold text-emerald-700">
                                                                    {field.label}
                                                                </th>
                                                                <td className="px-4 py-3 text-emerald-950 whitespace-pre-wrap">
                                                                    <div>{value}</div>
                                                                    {detailValue && (
                                                                        <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 border border-emerald-100">
                                                                            {detailValue}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    <tr className="align-top">
                                                        <th className="w-1/3 bg-emerald-50 px-4 py-3 text-left font-semibold text-emerald-700">
                                                            Submitted Date
                                                        </th>
                                                        <td className="px-4 py-3 text-emerald-950">
                                                            {formatDate(selectedReport.createdAt)}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })() : (
                                <>
                                    <div className="print-only hidden">
                                        <h3 className="text-lg font-bold text-teal-800 mb-4">
                                            IT Equipment & Functionality Report
                                        </h3>
                                        <table className="w-full text-sm">
                                            <tbody>
                                                <tr>
                                                    <th className="text-left">Basic Robotics</th>
                                                    <td>{selectedReport.basicRobotics ?? "-"}</td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left">Advanced Robotics</th>
                                                    <td>{selectedReport.advancedRobotics ?? "-"}</td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left">3D Printer</th>
                                                    <td>{selectedReport["3dPrinter"] ?? "-"}</td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left">VR Headset</th>
                                                    <td>{selectedReport.vrHeadset ?? "-"}</td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left">Network Camera</th>
                                                    <td>{selectedReport.networkCamera ?? "-"}</td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left">UPS</th>
                                                    <td>{selectedReport.ups ?? "-"}</td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left">Functionality Status</th>
                                                    <td>
                                                        {selectedReport.isFunctional === "yes"
                                                            ? "All equipment is functional"
                                                            : "Equipment has issues"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left">Damage Details</th>
                                                    <td>{selectedReport.damageDetails || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left">Storage Images</th>
                                                    <td>
                                                        {selectedReport.storageImages?.length
                                                            ? `${selectedReport.storageImages.length} image(s) attached`
                                                            : "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th className="text-left">Recommendations</th>
                                                    <td>{selectedReport.recommendations || "-"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="equipment-screen-sections space-y-6">
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
                                </>
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

            {editingClassReport && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm print:hidden">
                    <div className="bg-white border-2 border-emerald-100 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-emerald-100 bg-emerald-50/60 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-emerald-950">
                                    Update Class Report
                                </h2>
                                <p className="text-sm text-emerald-600 mt-1">
                                    {editingClassReport.institute}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingClassReport(null);
                                    setClassReportForm({});
                                }}
                                className="p-2 text-emerald-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all cursor-pointer"
                            >
                                <HiOutlineXCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateClassReport} className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {inspectionReportFields.map((field) => {
                                    const fieldType = getInspectionFieldType(field.name);
                                    const detailName = `${field.name}Details`;
                                    const choiceOptions = fieldType === "yesNo"
                                        ? ["হ্যাঁ", "না"]
                                        : fieldType === "exists"
                                            ? ["আছে", "নাই"]
                                            : [];

                                    return (
                                        <div key={field.name} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
                                            <label className="block text-sm font-semibold text-emerald-800 leading-6">
                                                {field.label}
                                            </label>

                                            {fieldType === "number" ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={classReportForm[field.name] || ""}
                                                    onChange={(event) => handleClassReportFormChange(field.name, event.target.value)}
                                                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                                />
                                            ) : choiceOptions.length ? (
                                                <>
                                                    <div className="flex flex-wrap gap-3">
                                                        {choiceOptions.map((option) => (
                                                            <label key={option} className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800">
                                                                <input
                                                                    type="radio"
                                                                    name={field.name}
                                                                    value={option}
                                                                    checked={classReportForm[field.name] === option}
                                                                    onChange={(event) => handleClassReportFormChange(field.name, event.target.value)}
                                                                    className="h-4 w-4 accent-emerald-600"
                                                                />
                                                                {option}
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <textarea
                                                        rows={3}
                                                        value={classReportForm[detailName] || ""}
                                                        onChange={(event) => handleClassReportFormChange(detailName, event.target.value)}
                                                        placeholder="Details / reason"
                                                        className="w-full resize-none rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                </>
                                            ) : (
                                                <textarea
                                                    rows={4}
                                                    value={classReportForm[field.name] || ""}
                                                    onChange={(event) => handleClassReportFormChange(field.name, event.target.value)}
                                                    className="w-full resize-none rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 p-5 bg-white/95 border-t border-emerald-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingClassReport(null);
                                        setClassReportForm({});
                                    }}
                                    disabled={isUpdatingClassReport}
                                    className="px-6 py-3 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingClassReport}
                                    className="px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
                                >
                                    <HiOutlineSave className="w-5 h-5" />
                                    {isUpdatingClassReport ? "Updating..." : "Update Report"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SendReport;
