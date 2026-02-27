import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaTrash, FaCheckCircle, FaTimesCircle,
  FaSearch, FaSync, FaEye, FaEyeSlash, FaShieldAlt,
  FaUsers, FaUserCheck, FaUserTimes, FaTimes,
} from "react-icons/fa";
import { AuthContext } from "../../../../contexts/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL;

const roleBadge = {
  SuperAdmin: "bg-red-100 text-red-700 border-red-200",
  DivisionAdmin: "bg-blue-100 text-blue-700 border-blue-200",
  DistrictAdmin: "bg-purple-100 text-purple-700 border-purple-200",
  UpazilaAdmin: "bg-amber-100 text-amber-700 border-amber-200",
  LabAdmin: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Anonymous: "bg-gray-100 text-gray-700 border-gray-200",
};

const ManageUser = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [showPasswords, setShowPasswords] = useState({});
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [setPasswordUser, setSetPasswordUser] = useState(null); // User to verify with password
  const [geoData, setGeoData] = useState({ divisions: [], districts: [], upazilas: [] });
  const [updating, setUpdating] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/users/manage`, { withCredentials: true });
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Defer Geo Data loading until the modal is actually used to speed up page mount
  useEffect(() => {
    if (editUser && geoData.divisions.length === 0) {
      const loadGeoData = async () => {
        setGeoLoading(true);
        try {
          const [res1, res2] = await Promise.all([
            fetch("/srd-data.json").then(r => r.json()),
            fetch("/srd-data300.json").then(r => r.json())
          ]);
          const combined = [...res1, ...res2];
          const divs = [...new Set(combined.map(i => i.division).filter(Boolean))].sort();
          const dists = [...new Set(combined.map(i => i.district).filter(Boolean))].sort();
          const upzs = [...new Set(combined.map(i => i.upazila).filter(Boolean))].sort();
          setGeoData({ divisions: divs, districts: dists, upazilas: upzs });
        } catch (err) {
          console.error("Failed to load geo data", err);
        } finally {
          setGeoLoading(false);
        }
      };
      loadGeoData();
    }
  }, [editUser, geoData.divisions.length]);

  const handleDelete = (userId, userName) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="font-bold text-emerald-950 text-sm">Delete user: <span className="text-red-600">{userName || userId}</span>?</p>
        <p className="text-xs text-emerald-600">This action cannot be undone.</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToast = toast.loading("Deleting...");
              try {
                await axios.delete(`${API}/users/manage/${userId}`, { withCredentials: true });
                setUsers(prev => prev.filter(u => u.id !== userId));
                toast.success("User deleted", { id: loadingToast, icon: "🗑️" });
              } catch (err) {
                toast.error(err.response?.data?.message || "Failed to delete", { id: loadingToast });
              }
            }}
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold"
          > Confirm </button>
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000, position: "top-center", style: { minWidth: "320px", borderRadius: "1rem", background: "#fff", border: "1px solid #d1fae5" } });
  };

  const handleVerifyToggle = async (userId, currentState, password = null) => {
    const loadingToast = toast.loading(password ? "Verifying & Setting Password..." : "Updating...");
    try {
      const res = await axios.patch(`${API}/users/manage/${userId}/verify`, {
        isVerified: !currentState,
        password: password
      }, { withCredentials: true });

      if (res.data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...res.data.data } : u));
        toast.success(`User ${!currentState ? "verified" : "unverified"} successfully`, { id: loadingToast });
        if (password) setSetPasswordUser(null);
      }
    } catch (err) {
      toast.error("Failed to update verification", { id: loadingToast });
    }
  };

  const handleVerifyAll = async (isVerified) => {
    const loadingToast = toast.loading(`${isVerified ? "Verifying" : "Unverifying"} all users...`);
    try {
      const res = await axios.patch(`${API}/users/manage/verify-all`, { isVerified }, { withCredentials: true });
      toast.success(res.data.message, { id: loadingToast });
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update all", { id: loadingToast });
    }
  };

  const togglePassword = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    const loadingToast = toast.loading("Updating user...");
    try {
      const res = await axios.put(`${API}/users/manage/${editUser.id}`, {
        role: editUser.role,
        division: editUser.division,
        district: editUser.district,
        upazila: editUser.upazila,
      }, { withCredentials: true });

      if (res.data.success) {
        toast.success("User updated successfully", { id: loadingToast });
        setEditUser(null);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed", { id: loadingToast });
    } finally {
      setUpdating(false);
    }
  };

  // ─── Filtered data ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    setCurrentPage(1); // Reset to first page on filter change
    const searchLower = search.toLowerCase().trim();
    return users.filter(u => {
      const matchSearch = !searchLower ||
        (u.userName || "").toLowerCase().includes(searchLower) ||
        (u.email || "").toLowerCase().includes(searchLower) ||
        (u.phoneNumber || "").includes(searchLower) ||
        (u.division || "").toLowerCase().includes(searchLower) ||
        (u.district || "").toLowerCase().includes(searchLower);
      const matchRole = !roleFilter || u.role === roleFilter;
      const matchVerified = verifiedFilter === "" ? true :
        verifiedFilter === "verified" ? u.isVerified : !u.isVerified;
      return matchSearch && matchRole && matchVerified;
    });
  }, [users, search, roleFilter, verifiedFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const stats = useMemo(() => ({
    total: users.length,
    verified: users.filter(u => u.isVerified).length,
    unverified: users.filter(u => !u.isVerified).length,
  }), [users]);

  return (
    <div className="min-h-screen bg-emerald-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-emerald-950">User Management</h1>
          <p className="text-emerald-600 mt-2">Manage all system users — roles, permissions, and status</p>
          <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mt-3" />
        </div>

        {/* Verification Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => handleVerifyAll(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
          >
            <FaCheckCircle /> Verify All
          </button>
          <button
            onClick={() => handleVerifyAll(false)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all shadow-md shadow-amber-100"
          >
            <FaTimesCircle /> Unverify All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: stats.total, icon: <FaUsers />, color: "emerald" },
          { label: "Verified", value: stats.verified, icon: <FaUserCheck />, color: "blue" },
          { label: "Unverified", value: stats.unverified, icon: <FaUserTimes />, color: "amber" },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -2 }} className={`bg-white rounded-2xl p-5 shadow border border-emerald-100 flex items-center gap-4`}>
            <div className={`p-3 bg-emerald-600 rounded-xl text-white shadow`}>{s.icon}</div>
            <div>
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">{s.label}</p>
              <p className="text-3xl font-bold text-emerald-950">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl p-6 shadow border border-emerald-100 space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <FaSearch className="absolute left-3.5 top-3.5 text-emerald-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-900 outline-none"
            >
              <option value="">All Roles</option>
              {Object.keys(roleBadge).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={verifiedFilter}
              onChange={e => setVerifiedFilter(e.target.value)}
              className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-900 outline-none"
            >
              <option value="">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>

            <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100">
              <FaSync className={loading ? "animate-spin" : ""} /> Reload
            </button>
          </div>
        </div>
        <p className="text-xs text-emerald-500">{filtered.length} users found</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow border border-emerald-100 overflow-hidden">
        <div className="overflow-x-auto text-sans">
          <table className="w-full text-sm">
            <thead className="bg-emerald-50 border-b border-emerald-100">
              <tr>
                {["#", "User Info", "Role", "Jurisdiction", "Password", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <FaSync className="animate-spin text-emerald-400 mx-auto mb-2" size={28} />
                  <p className="text-emerald-500">Loading users...</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-emerald-400">No users found</td></tr>
              ) : (
                paginatedUsers.map((u, idx) => (
                  <UserRow
                    key={u.id}
                    u={u}
                    idx={(currentPage - 1) * pageSize + idx}
                    showPassword={showPasswords[u.id]}
                    onTogglePassword={() => togglePassword(u.id)}
                    currentUser={currentUser}
                    onView={() => setViewUser(u)}
                    onEdit={() => setEditUser(u)}
                    onVerify={() => {
                      if (!u.isVerified) {
                        setSetPasswordUser(u);
                      } else {
                        handleVerifyToggle(u.id, u.isVerified);
                      }
                    }}
                    onDelete={() => handleDelete(u.id, u.userName || u.email)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-emerald-50/50 px-5 py-4 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-xs text-emerald-600 font-medium font-sans">
              Showing {Math.min(filtered.length, (currentPage - 1) * pageSize + 1)}-{Math.min(filtered.length, currentPage * pageSize)} of {filtered.length} users
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 disabled:opacity-50 hover:bg-emerald-50 transition-colors"
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                (totalPages <= 5 || Math.abs(currentPage - (i + 1)) < 3 || i === 0 || i === totalPages - 1) ? (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                      : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                  >
                    {i + 1}
                  </button>
                ) : (
                  (i + 1 === currentPage - 3 || i + 1 === currentPage + 3) ? <span key={i} className="text-emerald-300 px-1">...</span> : null
                )
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 disabled:opacity-50 hover:bg-emerald-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {viewUser && <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} showPasswords={showPasswords} togglePassword={togglePassword} />}
        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={handleUpdate}
            geoData={geoData}
            geoLoading={geoLoading}
            updating={updating}
            setEditUser={setEditUser}
          />
        )}
        {setPasswordUser && (
          <VerifyUserConfirmModal
            user={setPasswordUser}
            onClose={() => setSetPasswordUser(null)}
            onConfirm={(pass) => handleVerifyToggle(setPasswordUser.id, false, pass)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-components (Memoized for Performance) ---

const UserRow = React.memo(({ u, idx, showPassword, onTogglePassword, currentUser, onView, onEdit, onVerify, onDelete }) => (
  <tr className="hover:bg-emerald-50/60 border-l-4 border-transparent hover:border-emerald-400 transition-all font-sans">
    <td className="px-5 py-4 text-emerald-400 text-xs">{idx + 1}</td>
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {(u.userName || u.email)?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <p className="font-semibold text-emerald-950 text-sm whitespace-nowrap">{u.userName || "—"}</p>
          <p className="text-xs text-emerald-500 whitespace-nowrap">{u.email}</p>
          {u.phoneNumber && <p className="text-xs text-emerald-400">{u.phoneNumber}</p>}
        </div>
      </div>
    </td>
    <td className="px-5 py-4">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-opacity-50 ${roleBadge[u.role] || roleBadge.LabAdmin}`}>
        {u.role}
      </span>
    </td>
    <td className="px-5 py-4 text-xs text-emerald-700 space-y-0.5">
      {u.division && <div><span className="font-semibold opacity-60">Div:</span> {u.division}</div>}
      {u.district && <div><span className="font-semibold opacity-60">Dist:</span> {u.district}</div>}
      {u.upazila && <div><span className="font-semibold opacity-60">Upz:</span> {u.upazila}</div>}
      {!u.division && !u.district && !u.upazila && <span className="text-emerald-300">—</span>}
    </td>
    {/* Password */}
    <td className="px-5 py-4">
      <div className="flex items-center gap-2">
        <code className="text-xs bg-emerald-50 border border-emerald-100 px-2 py-1 rounded font-mono">
          {showPassword ? (u.plainPassword || "govt@doict.pass") : "••••••••••••"}
        </code>
        <button onClick={onTogglePassword} className="text-emerald-400 hover:text-emerald-600">
          {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
        </button>
      </div>
    </td>
    <td className="px-5 py-4">
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${u.isVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
        {u.isVerified ? <FaCheckCircle /> : <FaTimesCircle />}
        {u.isVerified ? "VERIFIED" : "PENDING"}
      </span>
    </td>
    <td className="px-5 py-4">
      <div className="flex items-center gap-1.5">
        <button onClick={onView} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Info"><FaEye size={14} /></button>
        <button onClick={onEdit} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Permissions"><FaShieldAlt size={14} /></button>
        <button onClick={onVerify} className={`p-2 rounded-lg transition-colors ${u.isVerified ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`} title={u.isVerified ? "Unverify" : "Verify"}>
          {u.isVerified ? <FaUserTimes size={14} /> : <FaUserCheck size={14} />}
        </button>
        {u.id !== currentUser?.id && u.role !== "SuperAdmin" && (
          <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><FaTrash size={14} /></button>
        )}
      </div>
    </td>
  </tr>
));

const ViewUserModal = ({ user, onClose, showPasswords, togglePassword }) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm" />
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
        <h3 className="text-xl font-bold">User Information</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl"><FaTimes /></button>
      </div>
      <div className="p-8 space-y-4">
        {[
          ["Name", user.userName], ["Email", user.email], ["Role", user.role], ["Phone", user.phoneNumber],
          ["Designation", user.designation], ["Division", user.division], ["District", user.district], ["Upazila", user.upazila],
          ["Verified", user.isVerified ? "Verified" : "Pending"], ["Created", user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"]
        ].map(([label, val]) => val && (
          <div key={label} className="flex border-b border-emerald-50 pb-2">
            <span className="w-32 text-xs font-bold text-emerald-600 uppercase tracking-widest">{label}</span>
            <span className="text-sm text-emerald-950 font-medium">{val}</span>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <span className="w-32 text-xs font-bold text-emerald-600 uppercase tracking-widest">Password</span>
          <code className="bg-emerald-50 px-3 py-1 rounded text-xs font-mono flex-1">{showPasswords.modal ? (user.plainPassword || "govt@doict.pass") : "••••••••"}</code>
          <button onClick={() => togglePassword("modal")} className="text-emerald-500">{showPasswords.modal ? <FaEyeSlash /> : <FaEye />}</button>
        </div>
      </div>
    </motion.div>
  </div>
);

const EditUserModal = ({ user, onClose, onSave, geoData, geoLoading, updating, setEditUser }) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 font-sans">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm" />
    <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative z-10 w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-emerald-100">
      <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
        <div><h3 className="text-xl font-bold tracking-tight">Permissions & Jurisdiction</h3><p className="text-emerald-100 text-xs mt-1">Managing access for {user.email}</p></div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all"><FaTimes /></button>
      </div>

      <form onSubmit={onSave} className="p-8 space-y-6">
        {!user.isVerified && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-800 text-xs leading-relaxed">
            <FaShieldAlt className="shrink-0 mt-0.5" /><p><strong>Limited Sync:</strong> This account is not verified. Permissions are locked until verified.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 shadow-sm">Assign Role</label>
            <select disabled={!user.isVerified} value={user.role || ""} onChange={e => setEditUser({ ...user, role: e.target.value, division: "", district: "", upazila: "" })} className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm outline-none focus:border-emerald-500 disabled:opacity-50">
              <option value="">Select Role</option>
              {Object.keys(roleBadge).filter(r => r !== "Anonymous").map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Division</label>
            {geoLoading ? <div className="h-11 bg-emerald-50 animate-pulse rounded-xl" /> : (
              <select disabled={!user.isVerified || user.role !== "DivisionAdmin"} value={user.division || ""} onChange={e => setEditUser({ ...user, division: e.target.value })} className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm outline-none focus:border-emerald-500 disabled:bg-gray-50">
                <option value="">Select Division</option>
                {geoData.divisions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">District</label>
            {geoLoading ? <div className="h-11 bg-emerald-50 animate-pulse rounded-xl" /> : (
              <select disabled={!user.isVerified || user.role !== "DistrictAdmin"} value={user.district || ""} onChange={e => setEditUser({ ...user, district: e.target.value })} className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm outline-none focus:border-emerald-500 disabled:bg-gray-50">
                <option value="">Select District</option>
                {geoData.districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Upazila</label>
            {geoLoading ? <div className="h-11 bg-emerald-50 animate-pulse rounded-xl" /> : (
              <select disabled={!user.isVerified || user.role !== "UpazilaAdmin"} value={user.upazila || ""} onChange={e => setEditUser({ ...user, upazila: e.target.value })} className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm outline-none focus:border-emerald-500 disabled:bg-gray-50">
                <option value="">Select Upazila</option>
                {geoData.upazilas.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100">Cancel</button>
          <button type="submit" disabled={updating || !user.isVerified} className="px-8 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-50 transition-all">
            {updating ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </motion.div>
  </div>
);

export default ManageUser;

const VerifyUserConfirmModal = ({ user, onClose, onConfirm }) => {
  const [password, setPassword] = useState("govt@doict.pass");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(password);
    } finally {
      // Parent component will close the modal via state change
      // No need to set loading false here as component will unmount
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-emerald-600 p-6 text-white text-center">
          <FaShieldAlt size={40} className="mx-auto mb-3" />
          <h3 className="text-xl font-bold">Verify User</h3>
          <p className="text-emerald-100 text-xs mt-1">Set an initial password for {user.email}</p>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 block">Log-in Password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm outline-none focus:border-emerald-500"
                placeholder="Enter password"
              />
              <button onClick={() => setShow(!show)} className="absolute right-3 top-3.5 text-emerald-400">
                {show ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p className="text-[10px] text-emerald-400 mt-2 italic">This password will be hashed in the database but you'll see the plain version in the dashboard.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-gray-50 text-emerald-700 font-bold rounded-xl text-sm hover:bg-gray-100 transition-colors">Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={!password || loading}
              className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Confirm & Verify"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
