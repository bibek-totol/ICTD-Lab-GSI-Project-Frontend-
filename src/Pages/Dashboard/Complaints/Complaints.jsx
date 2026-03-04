import React, { useEffect, useMemo, useState, useContext } from "react";
import * as XLSX from "xlsx";
import {
  FaSearch,
  FaFileExcel,
  FaFileCsv,
  FaPrint,
  FaSync,
  FaTrash,
  FaEye,
  FaCheckCircle,
  FaFilter,
  FaUndo,
  FaPlus,
  FaEdit,
  FaTimes,
  FaImage,
  FaExclamationTriangle,
  FaUser,
  FaPhone,
} from "react-icons/fa";
import ComplaintService from "../../../services/complaint.service";
import LabService from "../../../services/lab.service";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../../contexts/AuthContext";

const Complaints = () => {
  const { isSuperAdmin, isDivisionAdmin, isDistrictAdmin, isUpazilaAdmin, isLabAdmin, userDivision, userDistrict, userUpazila, user } = useContext(AuthContext);

  // Pre-set jurisdiction-locked filters for non-SuperAdmin
  const lockedDivision = !isSuperAdmin ? (userDivision || null) : null;
  const lockedDistrict = (!isSuperAdmin && !isDivisionAdmin && !isLabAdmin) ? (userDistrict || null) : null;
  const lockedUpazila = (isUpazilaAdmin) ? (userUpazila || null) : null;

  const initialFilters = {
    division: lockedDivision || "All",
    district: lockedDistrict || "All",
    upazila: lockedUpazila || "All",
    category: "",
    status: "",
    priority: "",
  };

  const [data, setData] = useState([]);
  const [labs, setLabs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const initialFormState = {
    division: lockedDivision || "All",
    district: lockedDistrict || "All",
    upazila: lockedUpazila || "All",
    institute: "",
    category: "Equipment",
    subject: "",
    description: "",
    priority: "Medium",
    complainantName: "",
    complainantPhone: "",
    status: "Pending",
    labType: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);

  const [filters, setFilters] = useState(initialFilters);

  const [filterOptions, setFilterOptions] = useState({
    divisions: [],
    districts: [],
    upazilas: [],
  });

  const [labSearch, setLabSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch filter options dynamically
  const fetchFilterOptions = async (queryDivision = null, queryDistrict = null) => {
    try {
      const params = {};
      if (queryDivision && queryDivision !== "All" && queryDivision !== "") params.division = queryDivision;
      if (queryDistrict && queryDistrict !== "All" && queryDistrict !== "") params.district = queryDistrict;

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
    if ((filters.division && filters.division !== "All") || (filters.district && filters.district !== "All")) {
      fetchFilterOptions(filters.division, filters.district);
    } else {
      fetchFilterOptions(lockedDivision, lockedDistrict);
    }
  }, [filters.division, filters.district]);

  // Load data from backend
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};

      const divisionParam = lockedDivision || (filters.division !== "All" ? filters.division : null);
      const districtParam = lockedDistrict || (filters.district !== "All" ? filters.district : null);
      const upazilaParam = lockedUpazila || (filters.upazila !== "All" ? filters.upazila : null);

      if (divisionParam) params.division = divisionParam;
      if (districtParam) params.district = districtParam;
      if (upazilaParam) params.upazila = upazilaParam;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (search) params.search = search;

      const response = await ComplaintService.getComplaints(params);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch complaints");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await LabService.getUnifiedLabs();
      if (response.success) {
        setLabs(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch labs:", error);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchLabs();
  }, [filters, search, lockedDivision, lockedDistrict, lockedUpazila]);

  const handleReset = () => {
    setSearch("");
    // Only reset non-locked filters
    setFilters(initialFilters);
  };

  const handleReload = () => {
    fetchComplaints();
    toast.success("Data reloaded");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSubmit = new FormData();
      Object.keys(formData).forEach(key => {
        dataToSubmit.append(key, formData[key]);
      });

      // Append new images
      selectedImages.forEach(image => {
        dataToSubmit.append("complaintImages", image);
      });

      // Append deleted images if editing
      if (editingId) {
        dataToSubmit.append("deletedImages", JSON.stringify(deletedImages));
      }

      if (editingId) {
        await ComplaintService.updateComplaint(editingId, dataToSubmit);
        toast.success("অভিযোগ সফলভাবে আপডেট করা হয়েছে (Updated Successfully)");
      } else {
        await ComplaintService.createComplaint(dataToSubmit);
        toast.success("অভিযোগ সফলভাবে গ্রহণ করা হয়েছে (Created Successfully)");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
      setSelectedImages([]);
      setExistingImages([]);
      setDeletedImages([]);
      setLabSearch("");
      fetchComplaints();
    } catch (error) {
      toast.error(editingId ? "Failed to update" : "Failed to create");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (complaint) => {
    setEditingId(complaint.id);
    setFormData({
      division: complaint.division || "",
      district: complaint.district || "",
      upazila: complaint.upazila || "",
      institute: complaint.institute || "",
      category: complaint.category || "Equipment",
      subject: complaint.subject || "",
      description: complaint.description || "",
      priority: complaint.priority || "Medium",
      complainantName: complaint.complainantName || "",
      complainantPhone: complaint.complainantPhone || "",
      status: complaint.status || "Pending",
      labType: complaint.labType || "",
    });
    setExistingImages(complaint.complaintImages || []);
    setDeletedImages([]);
    setSelectedImages([]);
    setLabSearch(complaint.institute || "");
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex items-center gap-4 p-1">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-emerald-900 text-sm">Delete Complaint?</p>
          <p className="text-xs text-emerald-600">This action cannot be undone.</p>
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToast = toast.loading("Removing complaint...", {
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
              });

              setDeletingId(id);

              // Optimistic UI Update: Remove from local state immediately
              const previousData = [...data];
              setData(prev => prev.filter(item => item.id !== id));

              try {
                await ComplaintService.deleteComplaint(id);
                toast.success("Complaint deleted successfully", {
                  id: loadingToast,
                  icon: '🗑️',
                  style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
                // Background refresh to sync with server
                fetchComplaints();
              } catch (error) {
                // Revert state on error
                setData(previousData);
                toast.error("Failed to delete from server", { id: loadingToast });
                console.error(error);
              } finally {
                setDeletingId(null);
              }
            }}
            className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors shadow-sm"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
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

  // Filter Logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = Object.values(item).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      );

      const matchesCategory = filters.category
        ? item.category === filters.category
        : true;

      const matchesStatus = filters.status
        ? item.status.toLowerCase() === filters.status.toLowerCase()
        : true;

      const matchesPriority = filters.priority
        ? item.priority === filters.priority
        : true;

      const matchesDivision = filters.division && filters.division !== "All"
        ? item.division === filters.division
        : true;

      const matchesDistrict = filters.district && filters.district !== "All"
        ? item.district === filters.district || (item.district === "N/A" && filters.district === "All")
        : true;

      const matchesUpazila = filters.upazila && filters.upazila !== "All"
        ? item.upazila === filters.upazila
        : true;

      return (
        matchesSearch &&
        matchesDivision &&
        matchesDistrict &&
        matchesUpazila &&
        matchesCategory &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [search, filters, data]);

  // Dynamic filter options based on data (Deprecated - now using fetchFilterOptions)
  // const filterOptions = useMemo(() => {
  //   return {
  //     divisions: [...new Set(data.map(item => item.division).filter(Boolean))].sort(),
  //     districts: [...new Set(data.map(item => item.district).filter(Boolean))].sort(),
  //     upazilas: [...new Set(data.map(item => item.upazila).filter(Boolean))].sort(),
  //   };
  // }, [data]);

  const filteredLabs = useMemo(() => {
    if (!labSearch) return labs.slice(0, 100);
    const searchTerm = labSearch.toLowerCase();
    return labs
      .filter(
        (lab) =>
          lab.institute?.toLowerCase().includes(searchTerm) ||
          lab.upazila?.toLowerCase().includes(searchTerm) ||
          lab.district?.toLowerCase().includes(searchTerm) ||
          lab.division?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 100);
  }, [labSearch, labs]);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Complaints");
    XLSX.writeFile(wb, "complaints_data.xlsx");
  };

  const handleExportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "complaints_data.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printable-table");
    const winPrint = window.open(
      "",
      "",
      "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0"
    );
    winPrint.document.write(`
      <html>
        <head>
          <title>Print Complaints</title>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>Complaints List</h2>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    winPrint.document.close();
    winPrint.focus();
    winPrint.print();
    winPrint.close();
  };

  const statusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const priorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-600 text-white shadow-red-200 border-red-700";
      case "high":
        return "bg-orange-500 text-white shadow-orange-200 border-orange-600";
      case "medium":
        return "bg-amber-400 text-amber-950 shadow-amber-100 border-amber-500";
      case "low":
        return "bg-emerald-400 text-emerald-950 shadow-emerald-100 border-emerald-500";
      default:
        return "bg-gray-400 text-white border-gray-500";
    }
  };

  const categoriesList = [
    "Personnel",
    "Infrastructure",
    "Equipment",
    "Internet",
    "Security",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-emerald-50 p-6 fade-in-up">
      {/* Header Stats - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-emerald-100 flex items-center gap-4 hover:shadow-emerald-200 transition-all duration-300 hover:-translate-y-1">
          <div className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl text-white shadow-md shadow-emerald-200">
            <FaCheckCircle size={28} />
          </div>
          <div>
            <h3 className="text-emerald-600 text-sm font-semibold uppercase tracking-wide">
              Total Complaints
            </h3>
            <p className="text-3xl font-bold text-emerald-950">{data.length}</p>
          </div>
        </div>
        <div className="bg-white backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-amber-100 flex items-center gap-4 hover:shadow-amber-200 transition-all duration-300 hover:-translate-y-1">
          <div className="p-4 bg-red-600 rounded-xl text-white shadow-md shadow-amber-200">
            <FaUndo size={28} />
          </div>
          <div>
            <h3 className="text-red-600 text-sm font-semibold uppercase tracking-wide">
              Pending Issues
            </h3>
            <p className="text-3xl font-bold bg-red-500 bg-clip-text text-transparent">
              {data.filter((d) => d.status === "Pending").length}
            </p>
          </div>
        </div>
        <div className="bg-white backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-blue-100 flex items-center gap-4 hover:shadow-blue-200 transition-all duration-300 hover:-translate-y-1">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white shadow-md shadow-blue-200">
            <FaSync size={28} />
          </div>
          <div>
            <h3 className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Processing</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              {data.filter((d) => d.status === "Processing").length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-emerald-100">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-emerald-100 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-emerald-950 flex items-center gap-2">
              অভিযোগ পোর্টাল
            </h2>
            <p className="text-emerald-600 text-sm mt-2">
              Manage and track all technical complaints efficiently
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mt-3"></div>
            {isLabAdmin ? (
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-200">
                <FaFilter className="w-4 h-4" />
                Lab Admin ({user?.email})
              </div>
            ) : lockedDistrict && isDistrictAdmin ? (
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-200">
                <FaFilter className="w-4 h-4" />
                District Admin({lockedDistrict})
              </div>
            ) : lockedDivision && (
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-200">
                <FaFilter className="w-4 h-4" />
                {lockedDivision} Division Admin
                {lockedDistrict && ` — ${lockedDistrict} District`}
                {lockedUpazila && ` — ${lockedUpazila} Upazila`}
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <button
              onClick={() => {
                setEditingId(null);
                setFormData(initialFormState);
                setLabSearch("");
                setExistingImages([]);
                setSelectedImages([]);
                setDeletedImages([]);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 font-semibold"
            >
              <FaPlus /> Add New Complaint
            </button>
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search anything..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none text-emerald-950 placeholder-emerald-400"
              />
              <FaSearch className="absolute left-3.5 top-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${isSuperAdmin ? "xl:grid-cols-6" : "xl:grid-cols-3"} gap-4 mb-8 bg-emerald-50/50 p-5 rounded-xl border border-dashed border-emerald-200`}>
          {/* Division - Only show for SuperAdmin */}
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                বিভাগ (Division)
              </label>
              <select
                value={filters.division}
                onChange={(e) =>
                  setFilters({ ...filters, division: e.target.value, district: "All", upazila: "All" })
                }
                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
              >
                <option value="All">সকল বিভাগ (All Divisions)</option>
                {filterOptions.divisions.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>
          )}

          {/* District - Show for SuperAdmin and DivisionAdmin */}
          {(isSuperAdmin || isDivisionAdmin) && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                জেলা (District)
              </label>
              <select
                value={filters.district}
                onChange={(e) =>
                  setFilters({ ...filters, district: e.target.value, upazila: "All" })
                }
                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
              >
                <option value="All">সকল জেলা (All Districts)</option>
                {filterOptions.districts.map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
          )}

          {/* Upazila - Show for SuperAdmin, DivisionAdmin and DistrictAdmin */}
          {(isSuperAdmin || isDivisionAdmin || isDistrictAdmin) && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                উপজেলা (Upazila)
              </label>
              <select
                value={filters.upazila}
                onChange={(e) =>
                  setFilters({ ...filters, upazila: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
              >
                <option value="All">সকল উপজেলা (All Upazilas)</option>
                {filterOptions.upazilas.map((upz) => (
                  <option key={upz} value={upz}>{upz}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <FaFilter size={10} /> Category
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <FaFilter size={10} /> Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <FaFilter size={10} /> Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full  px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleReset}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all text-sm font-medium border border-emerald-200"
          >
            <FaUndo /> Reset
          </button>
          <button
            onClick={handleReload}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all text-sm font-medium border border-emerald-200"
          >
            <FaSync /> Reload
          </button>
          <div className="h-8 w-px bg-emerald-200 mx-2 hidden sm:block"></div>
          <button
            onClick={handleExportExcel}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all text-sm font-medium"
          >
            <FaFileExcel /> Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
          >
            <FaFileCsv /> CSV
          </button>
          <button
            onClick={handlePrint}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-red-600 text-white border-red-200 rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
          >
            <FaPrint /> Print
          </button>
        </div>

        {/* Table */}
        <div
          className="overflow-x-auto rounded-xl border border-emerald-100"
          id="printable-table"
        >
          <table className="w-full text-sm text-left">
            <thead className="bg-emerald-50 text-emerald-600 font-medium uppercase tracking-wider">
              <tr>
                {[
                  "Institute",
                  "Category",
                  "Subject",
                  "Priority",
                  "Status",
                  "Complainant",
                  "Date",
                  "Actions",
                ].map((th) => (
                  <th key={th} className="px-6 py-4 whitespace-nowrap text-left first:rounded-l-xl last:rounded-r-xl">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-12 text-emerald-600">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FaSync className="animate-spin text-emerald-500" size={40} />
                      <p>Loading complaints...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-12 text-emerald-600">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FaSearch size={40} className="text-emerald-200" />
                      <p>No complaints found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredData.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-emerald-50 transition-all duration-300 border-l-4 border-transparent hover:border-emerald-500"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-emerald-950 truncate max-w-[200px]" title={row.institute}>
                            {row.institute}
                          </span>
                          <span className="text-[10px] text-emerald-500 flex gap-1">
                            {row.upazila}, {row.district}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold border border-gray-200">
                          {row.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[250px] truncate font-medium text-emerald-800" title={row.subject}>
                        {row.subject}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-tight shadow-sm ${priorityColor(row.priority)}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider shadow-sm ${statusColor(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-emerald-900 text-[11px] truncate max-w-[120px]">{row.complainantName || "Anonymous"}</span>
                          <span className="text-emerald-500 text-[10px]">{row.complainantPhone || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-emerald-600 text-xs whitespace-nowrap text-center">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(row)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 pt-8 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 30 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative z-10 w-full max-w-3xl my-auto bg-white rounded-2xl shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]"
              >
                {/* Sticky Header */}
                <div className=" top-0 z-10 px-6 py-4 border-b border-emerald-100 flex justify-between items-center bg-emerald-50 rounded-t-2xl flex-shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900">
                      {editingId ? "অভিযোগ আপডেট করুন" : "নতুন অভিযোগ যোগ করুন"}
                    </h3>
                    <p className="text-xs text-emerald-500 mt-0.5">সকল তারকাচিহ্নিত (*) ক্ষেত্র পূরণ করা বাধ্যতামূলক</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-emerald-100 rounded-full transition-colors flex-shrink-0"
                  >
                    <FaTimes className="text-emerald-600" size={14} />
                  </button>
                </div>

                {/* Scrollable Form Body */}
                <div className="overflow-y-auto flex-1">
                  <form id="complaint-form" onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                      {/* Optimized Lab Selection (Autocomplete) */}
                      <div className="space-y-1 relative">
                        <label className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                          <FaSearch size={12} /> ল্যাব নির্বাচন করুন (Select Lab)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="প্রতিষ্ঠান খুঁজুন (Search Institute...)"
                            value={labSearch}
                            onFocus={() => !editingId && setIsDropdownOpen(true)}
                            onChange={(e) => {
                              if (!editingId) {
                                setLabSearch(e.target.value);
                                setIsDropdownOpen(true);
                              }
                            }}
                            disabled={!!editingId}
                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-4 transition-all outline-none font-medium pr-10 ${editingId
                              ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-white border-emerald-500 text-emerald-950 focus:ring-emerald-500/20"
                              } placeholder-emerald-300`}
                          />
                          {labSearch && !editingId && (
                            <button
                              type="button"
                              onClick={() => {
                                setLabSearch("");
                                setFormData({ ...formData, institute: "", division: "", district: "", upazila: "" });
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 p-1"
                            >
                              <FaTimes size={14} />
                            </button>
                          )}
                          <AnimatePresence>
                            {isDropdownOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setIsDropdownOpen(false)}
                                />
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute z-20 w-full mt-2 bg-white border border-emerald-100 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto"
                                >
                                  {filteredLabs.length > 0 ? (
                                    filteredLabs.map((lab) => (
                                      <div
                                        key={lab.id}
                                        onClick={() => {
                                          const labType = (lab.type || "").toLowerCase();
                                          const isICTDL = labType.includes("ictdl");
                                          const isSRDSOF = labType.includes("srd") || labType.includes("sof");

                                          setFormData({
                                            ...formData,
                                            institute: lab.institute || "",
                                            division: lab.division || "N/A",
                                            district: lab.district || "N/A",
                                            upazila: lab.upazila || "N/A",
                                            labType: lab.type || "",
                                          });
                                          setLabSearch(lab.institute);
                                          setIsDropdownOpen(false);
                                        }}
                                        className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-emerald-50 last:border-0 transition-colors group"
                                      >
                                        <div className="font-bold text-emerald-900 group-hover:text-emerald-700">
                                          {lab.institute}
                                        </div>
                                        <div className="text-xs text-emerald-500 flex items-center gap-2 mt-1">
                                          <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{lab.type}</span>
                                          <span>{lab.upazila}, {lab.district}</span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-4 text-center text-emerald-500 text-sm">
                                      No labs found
                                    </div>
                                  )}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                        <p className="text-[10px] text-emerald-500 mt-1 font-medium">ল্যাব সিলেক্ট করলে নিচের তথ্যগুলো স্বয়ংক্রিয়ভাবে পূরণ হবে</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-emerald-700">বিভাগ (Division)</label>
                          <input
                            type="text"
                            required
                            readOnly
                            value={formData.division}
                            className="w-full px-4 py-2 bg-gray-100 border-gray-200 text-gray-500 rounded-lg outline-none cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-emerald-700">জেলা (District)</label>
                          <input
                            type="text"
                            required
                            readOnly
                            value={formData.district}
                            className="w-full px-4 py-2 bg-gray-100 border-gray-200 text-gray-500 rounded-lg outline-none cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-emerald-700">উপজেলা (Upazila)</label>
                          <input
                            type="text"
                            required
                            readOnly
                            value={formData.upazila}
                            className="w-full px-4 py-2 bg-gray-100 border-gray-200 text-gray-500 rounded-lg outline-none cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-emerald-700 text-rose-600 flex items-center gap-1">
                            <FaExclamationTriangle size={10} /> অভিযোগের ধরণ (Category) *
                          </label>
                          <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-2 bg-white border-2 border-emerald-500 rounded-xl focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-bold"
                          >
                            {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-bold text-emerald-700">অভিযোগের বিষয় (Subject) *</label>
                        <input
                          type="text"
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border-2 border-emerald-100 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-medium"
                          placeholder="Ex: ল্যাবের তালা ভাঙা বা কর্মচারীর অনুপস্থিতি"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-bold text-emerald-700">বিস্তারিত বিবরণ (Description) *</label>
                        <textarea
                          required
                          rows="4"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border-2 border-emerald-100 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-medium resize-none"
                          placeholder="বিস্তারিত লিখুন..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-emerald-700">গুরুত্ব (Priority) *</label>
                          <select
                            required
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="w-full px-4 py-2 bg-white border-2 border-emerald-100 rounded-xl focus:border-emerald-500 transition-all outline-none"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-emerald-700">স্ট্যাটাস (Status) *</label>
                          <select
                            required
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2 bg-white border-2 border-emerald-100 rounded-xl focus:border-emerald-500 transition-all outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-emerald-700 flex items-center gap-1"><FaUser size={10} /> অভিযোগকারীর নাম (Optional)</label>
                          <input
                            type="text"
                            value={formData.complainantName}
                            onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                            className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg outline-none focus:border-emerald-500 shadow-sm"
                            placeholder="আপনার নাম"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-emerald-700 flex items-center gap-1"><FaPhone size={10} /> মোবাইল নম্বর (Optional)</label>
                          <input
                            type="text"
                            value={formData.complainantPhone}
                            onChange={(e) => setFormData({ ...formData, complainantPhone: e.target.value })}
                            className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg outline-none focus:border-emerald-500 shadow-sm"
                            placeholder="Ex: 01700000000"
                          />
                        </div>
                      </div>

                      {/* Image Upload Section */}
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                          <FaImage /> প্রমানস্বরুপ ছবি (Complaint Images - Max 5)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                          {/* Existing Images */}
                          {existingImages.map((img, idx) => (
                            <div key={`exist-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border border-emerald-100">
                              <img src={img} alt="Existing" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              {!deletedImages.includes(img) ? (
                                <button
                                  type="button"
                                  onClick={() => setDeletedImages([...deletedImages, img])}
                                  className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <FaTimes size={10} />
                                </button>
                              ) : (
                                <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => setDeletedImages(deletedImages.filter(i => i !== img))}
                                    className="p-1 px-2.5 bg-white text-red-600 rounded-lg text-[10px] font-bold shadow-xl"
                                  >
                                    Undo
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Preview New Images */}
                          {selectedImages.map((file, idx) => (
                            <div key={`new-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-dashed border-blue-200">
                              <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 p-1.5 bg-blue-500 text-white rounded-full shadow-lg"
                              >
                                <FaTimes size={10} />
                              </button>
                            </div>
                          ))}

                          {/* Upload Trigger */}
                          {selectedImages.length + (existingImages.length - deletedImages.length) < 5 && (
                            <label className="cursor-pointer aspect-square rounded-xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center hover:bg-emerald-50 hover:border-emerald-400 transition-all gap-1 group">
                              <FaPlus className="text-emerald-300 group-hover:text-emerald-500 group-hover:scale-125 transition-all" size={20} />
                              <span className="text-[10px] font-bold text-emerald-400 group-hover:text-emerald-600">Upload</span>
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files);
                                  const totalAllowed = 5 - (selectedImages.length + existingImages.length - deletedImages.length);
                                  setSelectedImages([...selectedImages, ...files.slice(0, totalAllowed)]);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sticky Footer with action buttons */}
                  </form>
                </div>
                <div className="sticky bottom-0 z-10 flex justify-end gap-3 px-6 py-4 border-t border-emerald-100 bg-white rounded-b-2xl flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-white text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all font-semibold text-sm"
                  >
                    বাতিল (Cancel)
                  </button>
                  <button
                    type="submit"
                    form="complaint-form"
                    disabled={isSubmitting}
                    className={`px-8 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 font-bold text-sm flex items-center justify-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSync className="animate-spin" size={14} />
                        প্রসেসিং হচ্ছে...
                      </>
                    ) : (
                      editingId ? "আপডেট করুন" : "✓ সংরক্ষণ করুন"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer / Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-emerald-600 gap-4">
          <p>Showing {filteredData.length} entries</p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors text-emerald-600"
              disabled
            >
              Previous
            </button>
            <button className="px-3 py-2 bg-emerald-600 text-white rounded-lg shadow-sm shadow-emerald-200 border border-emerald-500">
              1
            </button>
            <button className="px-3 py-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600">
              2
            </button>
            <button className="px-3 py-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600">
              3
            </button>
            <button className="px-4 py-2 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-emerald-600">
              Next
            </button>
          </div>
        </div>
      </div >
    </div >
  );
};

export default Complaints;
