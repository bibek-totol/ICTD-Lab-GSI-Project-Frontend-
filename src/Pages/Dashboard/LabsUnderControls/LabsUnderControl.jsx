import React, { useState, useEffect, useContext } from "react";
import {
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineExclamationCircle,
  HiOutlineFilter,
  HiOutlineDownload,
  HiOutlinePrinter,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineClipboardList,
  HiCheckCircle,
} from "react-icons/hi";
import { FaBookOpen, FaFileCsv, FaFileExcel, FaShieldAlt } from "react-icons/fa";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import ReportForm from "./ReportForm/ReportForm";
import InspectionReportForm from "./ReportForm/InspectionReportForm";
import { AuthContext } from "../../../contexts/AuthContext";
import { getBanglaJurisdictionNames } from "../../../utils/jurisdictionAliases";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LabsUnderControl = () => {
  const { isSuperAdmin, isDivisionAdmin, isDistrictAdmin, isUpazilaAdmin, isLabAdmin, userDivision, userDistrict, userUpazila, role, user } = useContext(AuthContext);

  // For non-SuperAdmin roles, lock jurisdiction filters
  const lockedDivision = !isSuperAdmin ? (userDivision || null) : null;
  const lockedDistrict = (!isSuperAdmin && !isDivisionAdmin && !isLabAdmin) ? (userDistrict || null) : null;
  const lockedUpazila = (isUpazilaAdmin) ? (userUpazila || null) : null;
  const [jurisdictionParams, setJurisdictionParams] = useState({
    division: lockedDivision,
    district: lockedDistrict,
    upazila: lockedUpazila,
  });

  const lockedDivisionParam = !isSuperAdmin ? (jurisdictionParams.division || lockedDivision) : null;
  const lockedDistrictParam = (!isSuperAdmin && !isDivisionAdmin && !isLabAdmin)
    ? (jurisdictionParams.district || lockedDistrict)
    : null;
  const lockedUpazilaParam = isUpazilaAdmin ? (jurisdictionParams.upazila || lockedUpazila) : null;

  const [filters, setFilters] = useState({
    division: lockedDivisionParam || "All",
    district: lockedDistrictParam || "All",
    upazila: lockedUpazilaParam || "All",
    labType: "All",
  });
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [labsData, setLabsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    divisions: [],
    districts: [],
    upazilas: [],
    labTypes: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("equipment");
  const [currentLab, setCurrentLab] = useState(null);
  const [submittedInspectionLabs, setSubmittedInspectionLabs] = useState(new Set());

  useEffect(() => {
    let isMounted = true;

    const loadJurisdictionAliases = async () => {
      try {
        const aliases = await getBanglaJurisdictionNames({
          division: lockedDivision,
          district: lockedDistrict,
          upazila: lockedUpazila,
        });

        if (isMounted) {
          setJurisdictionParams({
            division: aliases.division || lockedDivision,
            district: aliases.district || lockedDistrict,
            upazila: aliases.upazila || lockedUpazila,
          });
        }
      } catch (error) {
        console.error("Failed to load jurisdiction aliases:", error);
        if (isMounted) {
          setJurisdictionParams({
            division: lockedDivision,
            district: lockedDistrict,
            upazila: lockedUpazila,
          });
        }
      }
    };

    loadJurisdictionAliases();
    return () => {
      isMounted = false;
    };
  }, [lockedDivision, lockedDistrict, lockedUpazila]);

  useEffect(() => {
    if (isSuperAdmin) return;
    setFilters((prev) => ({
      ...prev,
      division: lockedDivisionParam || "All",
      district: lockedDistrictParam || "All",
      upazila: lockedUpazilaParam || "All",
    }));
    setCurrentPage(1);
  }, [isSuperAdmin, lockedDivisionParam, lockedDistrictParam, lockedUpazilaParam]);

  // Fetch filter options dynamically
  const fetchFilterOptions = async (queryDivision = null, queryDistrict = null) => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (queryDivision && queryDivision !== "All") params.append("division", queryDivision);
      if (queryDistrict && queryDistrict !== "All") params.append("district", queryDistrict);

      const response = await fetch(`${API_BASE_URL}/labs/filter-options?${params.toString()}`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      const result = await response.json();

      if (result.success) {
        setFilterOptions(result.data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  useEffect(() => {
    // Initial fetch with current/locked jurisdictions
    fetchFilterOptions(lockedDivisionParam, lockedDistrictParam);
  }, [lockedDivisionParam, lockedDistrictParam]);

  // Re-fetch options when selection changes
  useEffect(() => {
    if (filters.division !== "All" || filters.district !== "All") {
      fetchFilterOptions(filters.division, filters.district);
    } else {
      fetchFilterOptions(lockedDivisionParam, lockedDistrictParam);
    }
  }, [filters.division, filters.district, lockedDivisionParam, lockedDistrictParam]);

  // Fetch labs data
  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build query params
        const params = new URLSearchParams();

        // Always apply jurisdiction lock for non-SuperAdmin
        const divisionParam = lockedDivisionParam || (filters.division !== "All" ? filters.division : null);
        const districtParam = lockedDistrictParam || (filters.district !== "All" ? filters.district : null);
        const upazilaParam = lockedUpazilaParam || (filters.upazila !== "All" ? filters.upazila : null);

        if (divisionParam) params.append("division", divisionParam);
        if (districtParam) params.append("district", districtParam);
        if (upazilaParam) params.append("upazila", upazilaParam);
        if (filters.labType !== "All") params.append("labType", filters.labType);
        if (searchTerm) params.append("search", searchTerm);

        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/labs?${params.toString()}`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const result = await response.json();

        if (result.success) {
          setLabsData(result.data);
        } else {
          setError(result.message || "Failed to fetch labs");
        }
      } catch (error) {
        console.error("Error fetching lab data:", error);
        setError("Failed to load labs data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, [filters, searchTerm, lockedDivisionParam, lockedDistrictParam, lockedUpazilaParam]);


  // Format mobile number
  const formatMobile = (mobile) => {
    if (!mobile) return "";
    const mobileStr = String(mobile);
    return mobileStr.startsWith("0") ? mobileStr : `0${mobileStr}`;
  };

  // Pagination Logic
  const totalEntries = labsData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = labsData.slice(
    startIndex,
    startIndex + entriesPerPage,
  );

  const handleResetFilters = () => {
    setFilters({
      division: lockedDivisionParam || "All",
      district: lockedDistrictParam || "All",
      upazila: lockedUpazilaParam || "All",
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
    const exportData = labsData.map((lab) => ({
      "Lab Type": lab.labType === "sof" ? "SOF" : "ICTDL & SOF",
      Institute: lab.institute,
      Division: lab.division,
      District: lab.district,
      Upazila: lab.upazila,
      Seat: lab.seat,
      Head: lab.head,
      Mobile: formatMobile(lab.mobile),
      "Alt Mobile": formatMobile(lab.altMobile),
      Email: lab.email,
    }));

    const workSheet = XLSX.utils.json_to_sheet(exportData);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, "LabsData");

    if (type === "excel") {
      XLSX.writeFile(workBook, "Labs_Data.xlsx");
    }
  };

  const handleOpenModal = (lab, type = "equipment") => {
    setCurrentLab(lab);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType("equipment");
    setCurrentLab(null);
  };

  const handleInspectionSubmitted = ({ labId }) => {
    setSubmittedInspectionLabs((prev) => {
      const next = new Set(prev);
      next.add(String(labId));
      return next;
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
          <h1 className="text-4xl font-bold text-emerald-950">
            আইসিটিডি ল্যাব{" "}
          </h1>
          <p className="text-emerald-600 mt-2 text-lg">
            আইসিটিডি ল্যাব এর তথ্য ম্যানেজমেন্ট পোর্টাল
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
              District Admin ({lockedDistrict})
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
                placeholder="Search by institution, head, or contact..."
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
                onClick={() => handleExport("csv")}
                className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-800 transition-colors text-sm font-medium"
                title="Export CSV"
              >
                <FaFileCsv />
                <span className="hidden sm:inline">CSV</span>
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

            {/* Upazila - Show for SuperAdmin, DivisionAdmin AND DistrictAdmin */}
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
                    {type === "sof" ? "SOF" : type === "ictdl_sof" ? "ICTDL & SOF" : type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters - Adjusted layout based on role */}
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
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white backdrop-blur-xl rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-emerald-600">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading labs data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    ক্রম / ল্যাব টাইপ
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    প্রতিষ্ঠানের নাম
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    অবস্থান
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    যোগাযোগ
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-emerald-600 uppercase tracking-wider text-center no-print">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {currentEntries.length > 0 ? (
                  currentEntries.map((lab, index) => (
                    <tr
                      key={lab.id}
                      className="hover:bg-emerald-50/50 transition-all duration-300 group border-l-4 border-transparent hover:border-emerald-500"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-center space-y-1.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${lab.labType === "sof"
                              ? "bg-blue-50 text-blue-600 border border-blue-100"
                              : "bg-purple-50 text-purple-600 border border-purple-100"
                              }`}
                          >
                            {lab.labType === "sof" ? "SOF" : "ICTDL & SOF"}
                          </span>
                          <span className="text-xs text-emerald-400">
                            {startIndex + index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col max-w-xs">
                          <span
                            className="text-sm font-semibold text-emerald-950 truncate"
                            title={lab.institute}
                          >
                            {lab.institute}
                          </span>
                          <span className="text-xs text-emerald-500 mt-1">
                            আসন: {lab.seat}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-sm">
                          {(isSuperAdmin || isDivisionAdmin || isDistrictAdmin) && (
                            <>
                              <span className="text-emerald-800 font-medium">
                                {lab.upazila}
                              </span>
                              {lab.district && (
                                <span className="text-emerald-600 text-xs">
                                  {lab.district}
                                </span>
                              )}
                            </>
                          )}
                          <span className="text-emerald-500 text-xs font-bold">
                            বিভাগ: {lab.division}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-sm">
                          <span className="text-emerald-800 font-medium">
                            {lab.head}
                          </span>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <span className="text-xs text-emerald-500">
                              {formatMobile(lab.mobile)}
                              {lab.altMobile
                                ? `, ${formatMobile(lab.altMobile)}`
                                : ""}
                            </span>
                            {lab.email && (
                              <a
                                href={`mailto:${lab.email}`}
                                className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline"
                              >
                                {lab.email}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right no-print">
                        <div className="flex items-center justify-center gap-2 ">
                          <Link
                            to={`/dashboard/labsUpdate/${lab.id}`}
                            className="hover:scale-110 flex items-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all shadow-sm hover:shadow font-medium text-sm"
                            title="Update Lab"
                          >
                            <HiOutlinePencil className="w-5 h-5" />

                          </Link>
                          {/* <Link
                            to={`/dashboard/filesComplaints/${lab.id}`}
                            className="hover:scale-110 flex items-center gap-2 px-3 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all shadow-sm hover:shadow font-medium text-sm"
                            title="File Complaint"
                          >
                            <HiOutlineExclamationCircle className="w-5 h-5" />

                          </Link> */}
                          <button
                            onClick={() => handleOpenModal(lab)}
                            className="cursor-pointer hover:scale-110 flex items-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all shadow-sm hover:shadow font-medium text-sm"
                            title="Send Equipment Report"
                          >
                            <FaBookOpen className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(lab, "inspection")}
                            className={`relative cursor-pointer hover:scale-110 flex items-center gap-2 px-3 py-2 rounded-lg transition-all shadow-sm hover:shadow font-medium text-sm ${submittedInspectionLabs.has(String(lab.id))
                              ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                              : "text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                              }`}
                            title="Send Inspection Report"
                          >
                            <HiOutlineClipboardList className="w-5 h-5" />
                            {submittedInspectionLabs.has(String(lab.id)) && (
                              <HiCheckCircle className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full bg-white text-emerald-600" />
                            )}
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-emerald-400"
                    >
                      No labs found matching criteria.
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
            <span className="ml-2 text-emerald-400">
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

      {/* Report Modal */}
      {isModalOpen && currentLab && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm print:hidden">
          {modalType === "inspection" ? (
            <InspectionReportForm
              onClose={handleCloseModal}
              onSubmitted={handleInspectionSubmitted}
              instituteName={currentLab.institute}
              labId={currentLab.id}
              labType={currentLab.labType === "sof" ? "sof" : "ictdl"}
            />
          ) : (
            <ReportForm
              onClose={handleCloseModal}
              instituteName={currentLab.institute}
              labId={currentLab.id}
              labType={currentLab.labType === "sof" ? "sof" : "ictdl"}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LabsUnderControl;
