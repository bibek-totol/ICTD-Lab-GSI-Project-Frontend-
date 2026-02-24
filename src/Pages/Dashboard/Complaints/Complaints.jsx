import React, { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fa";
import ComplaintService from "../../../services/complaint.service";
import LabService from "../../../services/lab.service";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const Complaints = () => {
  const [data, setData] = useState([]);
  const [labs, setLabs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    division: "",
    district: "",
    upazila: "",
    institute: "",
    deviceType: "",
    deviceStatus: "চালু",
    total: 1,
    status: "Pending",
    labType: "",
  });

  const [filters, setFilters] = useState({
    division: "",
    district: "",
    upazila: "",
    labType: "",
    deviceType: "",
    deviceStatus: "",
    supportStatus: "",
  });

  const [labSearch, setLabSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load data from backend
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await ComplaintService.getComplaints();
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
  }, []);

  const handleReset = () => {
    setSearch("");
    setFilters({
      division: "",
      district: "",
      upazila: "",
      labType: "",
      deviceType: "",
      deviceStatus: "",
      supportStatus: "",
    });
  };

  const handleReload = () => {
    fetchComplaints();
    toast.success("Data reloaded");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await ComplaintService.updateComplaint(editingId, formData);
        toast.success("Complaint updated successfully");
      } else {
        await ComplaintService.createComplaint(formData);
        toast.success("Complaint created successfully");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        division: "",
        district: "",
        upazila: "",
        institute: "",
        deviceType: "",
        deviceStatus: "চালু",
        total: 1,
        status: "Pending",
        labType: "",
      });
      setLabSearch("");
      // Refresh complaints in the background
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
    const labType = (complaint.labType || "").toLowerCase();
    const isICTDL = labType.includes("ictdl");
    const isSRDSOF = labType.includes("srd") || labType.includes("sof");

    setFormData({
      division: isICTDL ? "N/A" : (complaint.division || "N/A"),
      district: isSRDSOF ? "N/A" : (complaint.district || "N/A"),
      upazila: complaint.upazila || "N/A",
      institute: complaint.institute,
      deviceType: complaint.deviceType,
      deviceStatus: complaint.deviceStatus,
      total: complaint.total,
      status: complaint.status,
      labType: complaint.labType || "",
    });
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

      const matchesDeviceType = filters.deviceType
        ? item.deviceType === filters.deviceType
        : true;

      const matchesDeviceStatus = filters.deviceStatus
        ? item.deviceStatus.includes(filters.deviceStatus)
        : true;

      const matchesSupportStatus = filters.supportStatus
        ? item.status.toLowerCase() === filters.supportStatus.toLowerCase()
        : true;

      const matchesDivision = filters.division
        ? item.division === filters.division
        : true;

      const matchesDistrict = filters.district
        ? item.district === filters.district
        : true;

      const matchesUpazila = filters.upazila
        ? item.upazila === filters.upazila
        : true;

      return (
        matchesSearch &&
        matchesDivision &&
        matchesDistrict &&
        matchesUpazila &&
        matchesDeviceType &&
        matchesDeviceStatus &&
        matchesSupportStatus
      );
    });
  }, [search, filters, data]);

  // Dynamic filter options based on data
  const filterOptions = useMemo(() => {
    return {
      divisions: [...new Set(data.map(item => item.division).filter(Boolean))].sort(),
      districts: [...new Set(data.map(item => item.district).filter(Boolean))].sort(),
      upazilas: [...new Set(data.map(item => item.upazila).filter(Boolean))].sort(),
    };
  }, [data]);

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
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const deviceTypesList = [
    "Laptop",
    "LED Smart Tv",
    "Printer",
    "Scanner",
    "Web Camera",
    "Router",
    "Network Switch",
    "Internet",
    "Digital Smart Board",
    "Desktop",
    "Attendance Machine",
    "Digital ID Card",
    "Wi-Fi Router",
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
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  division: "",
                  district: "",
                  upazila: "",
                  institute: "",
                  deviceType: "",
                  deviceStatus: "চালু",
                  total: 1,
                  status: "Pending",
                  labType: "",
                });
                setLabSearch("");
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8 bg-emerald-50/50 p-5 rounded-xl border border-dashed border-emerald-200">
          {/* Reusable Filter Component logic could minimize code, but explicit meant for clarity here */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <FaFilter size={10} /> Division
            </label>
            <select
              value={filters.division}
              onChange={(e) =>
                setFilters({ ...filters, division: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
            >
              <option value="">All Divisions</option>
              {filterOptions.divisions.map((div) => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <FaFilter size={10} /> District
            </label>
            <select
              value={filters.district}
              onChange={(e) =>
                setFilters({ ...filters, district: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
            >
              <option value="">All Districts</option>
              {filterOptions.districts.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <FaFilter size={10} /> Upazila
            </label>
            <select
              value={filters.upazila}
              onChange={(e) =>
                setFilters({ ...filters, upazila: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
            >
              <option value="">All Upazilas</option>
              {filterOptions.upazilas.map((upz) => (
                <option key={upz} value={upz}>{upz}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <FaFilter size={10} /> Device Type
            </label>
            <select
              value={filters.deviceType}
              onChange={(e) =>
                setFilters({ ...filters, deviceType: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
            >
              <option value="">All Devices</option>
              {deviceTypesList.map((device, index) => (
                <option className="text-black" key={index} value={device}>
                  {device}
                </option>
              ))}
              {/* Add Bengali mappings if needed based on fake data */}
              <option className="text-black" value="স্মার্ট বোর্ড">স্মার্ট বোর্ড</option>
              <option className="text-black" value="ল্যাপটপ">ল্যাপটপ</option>
              <option className="text-black" value="প্রজেক্টর">প্রজেক্টর</option>
              <option className="text-black" value="রাউটার">রাউটার</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <FaFilter size={10} /> Device Status
            </label>
            <select
              value={filters.deviceStatus}
              onChange={(e) =>
                setFilters({ ...filters, deviceStatus: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
            >
              <option className="text-black" value="">All Statuses</option>
              <option className="text-black" value="চালু">চালু (Active)</option>
              <option className="text-black" value="নষ্ট">নষ্ট (Damaged)</option>
              <option className="text-black" value="মেরামত প্রয়োজন">মেরামত প্রয়োজন (Repair)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <FaFilter size={10} /> Support Status
            </label>
            <select
              value={filters.supportStatus}
              onChange={(e) =>
                setFilters({ ...filters, supportStatus: e.target.value })
              }
              className="w-full  px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-emerald-900 outline-none hover:border-emerald-400"
            >
              <option className="text-black" value="">All</option>
              <option className="text-black" value="Pending">Pending</option>
              <option className="text-black" value="Processing">Processing</option>
              <option className="text-black" value="Resolved">Resolved</option>
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
                  "NO",
                  "DIVISION",
                  "district",
                  "upazila",
                  "INSTITUTE",
                  "DEVICE TYPE",
                  "DEVICE STATUS",
                  "TOTAL",
                  "STATUS",
                  "DATE",
                  "ACTIONS",
                ].map((th) => (
                  <th key={th} className="px-6 py-4 whitespace-nowrap text-center">
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
                      <td className="px-6 py-4 font-medium text-emerald-400 transition-all">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 text-emerald-900">
                        {(row.labType || "").toLowerCase().includes("ictdl") ? "N/A" : (row.division || "N/A")}
                      </td>
                      <td className="px-6 py-4 text-emerald-900">
                        {(row.labType || "").toLowerCase().includes("srd") || (row.labType || "").toLowerCase().includes("sof") ? "N/A" : (row.district || "N/A")}
                      </td>
                      <td className="px-6 py-4 text-emerald-900">{row.upazila || "N/A"}</td>
                      <td className="px-6 py-4 text-emerald-950 font-medium">
                        {row.institute}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-emerald-100/80 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200 whitespace-nowrap shadow-sm">
                          {row.deviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${row.deviceStatus === "চালু"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                            } shadow-sm`}
                        >
                          {row.deviceStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-center text-emerald-950">
                        {row.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider shadow-sm ${statusColor(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-emerald-600 text-xs">
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-emerald-950/30 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                className="relative w-full max-w-3xl bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/50 overflow-hidden"
              >
                <div className="p-6 border-b border-emerald-100 flex justify-between items-center bg-emerald-50">
                  <h3 className="text-xl font-bold text-emerald-900">
                    {editingId ? "অভিযোগ আপডেট করুন" : "নতুন অভিযোগ যোগ করুন"}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-emerald-100 rounded-full transition-colors"
                  >
                    <FaTimes className="text-emerald-600" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                                          division: isICTDL ? "N/A" : (lab.division || ""),
                                          district: isSRDSOF ? "N/A" : (lab.district || ""),
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
                      {((formData.labType || "").toLowerCase().includes("srd") || (formData.labType || "").toLowerCase().includes("sof")) && (
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-emerald-700">বিভাগ (Division)</label>
                          <input
                            type="text"
                            required
                            readOnly={!!editingId}
                            value={formData.division}
                            onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all outline-none ${editingId ? "bg-gray-100 border-gray-100 text-gray-500 cursor-not-allowed" : "bg-gray-50 border-emerald-100 focus:ring-emerald-500"
                              }`}
                            placeholder="Ex: ঢাকা"
                          />
                        </div>
                      )}

                      {(formData.labType || "").toLowerCase().includes("ictdl") && (
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-emerald-700">জেলা (District)</label>
                          <input
                            type="text"
                            required
                            readOnly={!!editingId}
                            value={formData.district}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all outline-none ${editingId ? "bg-gray-100 border-gray-100 text-gray-500 cursor-not-allowed" : "bg-gray-50 border-emerald-100 focus:ring-emerald-500"
                              }`}
                            placeholder="Ex: গাজীপুর"
                          />
                        </div>
                      )}

                      {(!formData.labType || (!(formData.labType || "").toLowerCase().includes("ictdl") && !(formData.labType || "").toLowerCase().includes("srd") && !(formData.labType || "").toLowerCase().includes("sof"))) && (
                        <>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-emerald-700">বিভাগ (Division)</label>
                            <input
                              type="text"
                              required
                              readOnly={!!editingId}
                              value={formData.division}
                              onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all outline-none ${editingId ? "bg-gray-100 border-gray-100 text-gray-500 cursor-not-allowed" : "bg-gray-50 border-emerald-100 focus:ring-emerald-500"
                                }`}
                              placeholder="Ex: ঢাকা"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-emerald-700">জেলা (District)</label>
                            <input
                              type="text"
                              required
                              readOnly={!!editingId}
                              value={formData.district}
                              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all outline-none ${editingId ? "bg-gray-100 border-gray-100 text-gray-500 cursor-not-allowed" : "bg-gray-50 border-emerald-100 focus:ring-emerald-500"
                                }`}
                              placeholder="Ex: গাজীপুর"
                            />
                          </div>
                        </>
                      )}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-emerald-700">উপজেলা (Upazila)</label>
                        <input
                          type="text"
                          required
                          readOnly={!!editingId}
                          value={formData.upazila}
                          onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all outline-none ${editingId ? "bg-gray-100 border-gray-100 text-gray-500 cursor-not-allowed" : "bg-gray-50 border-emerald-100 focus:ring-emerald-500"
                            }`}
                          placeholder="Ex: টঙ্গী"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-emerald-700">প্রতিষ্ঠানের নাম (Institute)</label>
                        <input
                          type="text"
                          required
                          readOnly={!!editingId}
                          value={formData.institute}
                          onChange={(e) => setFormData({ ...formData, institute: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all outline-none ${editingId ? "bg-gray-100 border-gray-100 text-gray-500 cursor-not-allowed" : "bg-gray-50 border-emerald-100 focus:ring-emerald-500"
                            }`}
                          placeholder="Ex: টঙ্গী সরকারি উচ্চ বিদ্যালয়"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-emerald-700">ডিভাইসের ধরণ (Device Type)</label>
                        <select
                          required
                          value={formData.deviceType}
                          onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                          className="w-full px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        >
                          <option value="">Select Device</option>
                          {deviceTypesList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-emerald-700">অবস্থা (Status)</label>
                        <select
                          required
                          value={formData.deviceStatus}
                          onChange={(e) => setFormData({ ...formData, deviceStatus: e.target.value })}
                          className="w-full px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        >
                          <option value="চালু">চালু (Active)</option>
                          <option value="নষ্ট">নষ্ট (Damaged)</option>
                          <option value="মেরামত প্রয়োজন">মেরামত প্রয়োজন (Repair)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-emerald-700">মোট সংখ্যা (Total)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.total}
                          onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                          className="w-full px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-emerald-700">সাপোর্ট স্ট্যাটাস (Support Status)</label>
                        <select
                          required
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-8 border-t border-emerald-100 pt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all font-medium"
                    >
                      বাতিল (Cancel)
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-8 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 font-bold flex items-center justify-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {isSubmitting ? (
                        <>
                          <FaSync className="animate-spin" size={16} />
                          প্রসেসিং হচ্ছে...
                        </>
                      ) : (
                        editingId ? "আপডেট করুন" : "সংরক্ষণ করুন"
                      )}
                    </button>
                  </div>
                </form>
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
      </div>
    </div >
  );
};

export default Complaints;
