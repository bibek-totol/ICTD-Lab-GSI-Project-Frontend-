import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaSync,
  FaEye,
  FaEyeSlash,
  FaFileAlt,
  FaSortAmountUp,
  FaBell,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaFilePdf,
  FaFileImage,
} from "react-icons/fa";

const API = import.meta.env.VITE_API_BASE_URL || "https://ictd-lab-backend.vercel.app/api/v1";

const ManageAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    serial: 0,
    isActive: true,
    file: null,
    deleteFile: false,
  });
  const [saving, setSaving] = useState(false);

  // Helper function to get the correct URL for files
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    // For PDFs, use direct proxy endpoint to display inline
    if (fileUrl.toLowerCase().includes(".pdf")) {
      return `${API}/files/pdf?url=${encodeURIComponent(fileUrl)}`;
    }
    // For images, use direct URL
    return fileUrl;
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/announcements`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        serial: item.serial,
        isActive: item.isActive,
        file: null,
        deleteFile: false,
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: "",
        serial:
          announcements.length > 0
            ? Math.max(...announcements.map((a) => a.serial)) + 1
            : 1,
        isActive: true,
        file: null,
        deleteFile: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      title: "",
      serial: 0,
      isActive: true,
      file: null,
      deleteFile: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading(editingItem ? "Updating..." : "Creating...");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("serial", formData.serial);
      data.append("isActive", formData.isActive);
      if (formData.file) {
        data.append("file", formData.file);
      }
      if (formData.deleteFile) {
        data.append("deleteFile", "true");
      }

      let res;
      if (editingItem) {
        res = await axios.put(
          `${API}/announcements/update/${editingItem.id}`,
          data,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
      } else {
        res = await axios.post(`${API}/announcements/create`, data, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (res.data.success) {
        toast.success(
          editingItem ? "Updated successfully" : "Created successfully",
          { id: toastId },
        );
        fetchAnnouncements();
        handleCloseModal();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed", {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-1">
          <p className="font-bold text-emerald-950 text-sm">
            Delete this announcement?
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const tid = toast.loading("Deleting...");
                try {
                  await axios.delete(`${API}/announcements/delete/${id}`, {
                    withCredentials: true,
                  });
                  setAnnouncements((prev) => prev.filter((a) => a.id !== id));
                  toast.success("Deleted", { id: tid });
                } catch (err) {
                  toast.error("Delete failed", { id: tid });
                }
              }}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold"
            >
              {" "}
              Confirm{" "}
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 6000, position: "top-center" },
    );
  };

  const toggleStatus = async (item) => {
    const tid = toast.loading("Updating status...");
    try {
      const res = await axios.put(
        `${API}/announcements/update/${item.id}`,
        {
          isActive: !item.isActive,
        },
        { withCredentials: true },
      );

      if (res.data.success) {
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === item.id ? { ...a, isActive: !item.isActive } : a,
          ),
        );
        toast.success("Status updated", { id: tid });
      }
    } catch (err) {
      toast.error("Failed to update status", { id: tid });
    }
  };

  // Helper function to determine file type
  const getFileType = (fileUrl) => {
    if (!fileUrl) return null;
    const url = fileUrl.toLowerCase();
    if (url.includes(".pdf") || url.includes("pdf")) return "pdf";
    if (
      url.includes(".jpg") ||
      url.includes(".jpeg") ||
      url.includes(".png") ||
      url.includes(".webp") ||
      url.includes("image")
    )
      return "image";
    return "file";
  };

  // Helper function to get file icon
  const getFileIcon = (fileUrl) => {
    const type = getFileType(fileUrl);
    if (type === "pdf") return <FaFilePdf className="text-red-500" />;
    if (type === "image") return <FaFileImage className="text-blue-500" />;
    return <FaFileAlt className="text-emerald-500" />;
  };

  return (
    <div className="min-h-screen bg-emerald-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-emerald-950">
            Manage Announcements
          </h1>
          <p className="text-emerald-600 mt-2">
            Create and manage scrolling notifications for the homepage
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mt-3" />
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1"
        >
          <FaPlus /> New Announcement
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden backdrop-blur-sm bg-white/80">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">
                  Serial
                </th>
                <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <FaSync className="animate-spin text-emerald-600 mx-auto text-4xl mb-4" />
                    <p className="text-emerald-500 font-medium">
                      Fetching announcements...
                    </p>
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-20 text-center text-emerald-400"
                  >
                    <FaBell className="mx-auto text-5xl mb-4 opacity-20" />
                    No announcements found. Create one to get started!
                  </td>
                </tr>
              ) : (
                announcements.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-emerald-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <FaSortAmountUp className="text-emerald-300" />
                        {item.serial}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="max-w-md">
                        <p className="font-semibold text-emerald-950 text-base leading-snug">
                          {item.title}
                        </p>
                        <p className="text-xs text-emerald-400 mt-1">
                          Created:{" "}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      {item.fileUrl ? (
                        <a
                          href={getFileUrl(item.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors hover:underline group"
                        >
                          {getFileIcon(item.fileUrl)}
                          <span className="group-hover:translate-x-0.5 transition-transform">
                            {getFileType(item.fileUrl) === "pdf"
                              ? "View PDF"
                              : getFileType(item.fileUrl) === "image"
                                ? "View Image"
                                : "View File"}
                          </span>
                        </a>
                      ) : (
                        <span className="text-emerald-300 italic">No file</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <button
                        onClick={() => toggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${item.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                          } transition-all hover:scale-105`}
                      >
                        {item.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                        {item.isActive ? "PUBLISHED" : "UNPUBLISHED"}
                      </button>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-[101] w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">
                    {editingItem ? "Edit Announcement" : "Create Announcement"}
                  </h3>
                  <p className="text-emerald-100 text-xs mt-1">
                    Fill in the details below
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest pl-1">
                    Announcement Title
                  </label>
                  <textarea
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm outline-none focus:border-emerald-500 transition-all min-h-[100px]"
                    placeholder="Enter announcement text..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest pl-1">
                      Serial Number
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.serial}
                      onChange={(e) =>
                        setFormData({ ...formData, serial: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest pl-1">
                      Visibility Status
                    </label>
                    <select
                      value={formData.isActive}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.value === "true",
                        })
                      }
                      className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="true">Published</option>
                      <option value="false">Unpublished</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest pl-1">
                    Attachment (Optional)
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) =>
                          setFormData({ ...formData, file: e.target.files[0] })
                        }
                        className="text-sm text-emerald-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer w-full"
                      />
                      <p className="text-[10px] text-emerald-500 mt-1 pl-1">
                        Supported: PDF, JPG, PNG, WEBP (Max 10MB)
                      </p>
                    </div>
                    {editingItem?.fileUrl &&
                      !formData.file &&
                      !formData.deleteFile && (
                        <div className="flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-2">
                            {getFileIcon(editingItem.fileUrl)}
                            <p className="text-[10px] text-emerald-600 font-medium">
                              Current:{" "}
                              {getFileType(editingItem.fileUrl) === "pdf"
                                ? "PDF Document"
                                : getFileType(editingItem.fileUrl) === "image"
                                  ? "Image File"
                                  : "Attached File"}
                            </p>
                            <a
                              href={getFileUrl(editingItem.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-500 hover:text-blue-700 underline font-bold"
                            >
                              Preview
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, deleteFile: true })
                            }
                            className="text-[10px] font-bold text-red-500 hover:text-red-700 underline"
                          >
                            Remove File
                          </button>
                        </div>
                      )}
                    {formData.deleteFile && (
                      <p className="text-[10px] text-red-400 italic px-2">
                        File will be removed upon saving.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 text-sm font-bold text-white bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    {editingItem ? "Update Announcement" : "Save Announcement"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageAnnouncement;
