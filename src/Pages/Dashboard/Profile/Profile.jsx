import React, { useContext, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineIdentification,
  HiOutlineLocationMarker,
  HiOutlineShieldCheck,
  HiOutlineBriefcase,
  HiOutlineCamera,
  HiOutlinePencilAlt,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi";
import { AuthContext } from "../../../contexts/AuthContext";
import UserService from "../../../services/user.service";
import toast from "react-hot-toast";

const roleBadgeColors = {
  SuperAdmin: "bg-red-100 text-red-700 border-red-200",
  DivisionAdmin: "bg-blue-100 text-blue-700 border-blue-200",
  DistrictAdmin: "bg-purple-100 text-purple-700 border-purple-200",
  UpazilaAdmin: "bg-amber-100 text-amber-700 border-amber-200",
  LabAdmin: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const InfoRow = ({ icon, label, value, isEditing, name, onChange, type = "text" }) => (
  <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-colors group">
    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wider">{label}</p>
      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-1.5 mt-1 text-sm font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <p className="text-sm font-semibold text-emerald-950 mt-0.5 break-all">
          {value || <span className="text-emerald-400 italic font-normal">Not provided</span>}
        </p>
      )}
    </div>
  </div>
);

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userName: user?.userName || "",
    phoneNumber: user?.phoneNumber || "",
    altPhoneNumber: user?.altPhoneNumber || "",
    designation: user?.designation || "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const displayName = user?.userName || user?.email?.split("@")[0] || "—";
  const initials = displayName
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "AU";
  const role = user?.role || "LabAdmin";

  const jurisdictionText = (() => {
    if (role === "SuperAdmin") return "National Level — All Bangladesh";
    if (role === "DivisionAdmin") return `Division Level — ${user?.division || "N/A"}`;
    if (role === "DistrictAdmin") return `District Level — ${user?.district || "N/A"}`;
    if (role === "UpazilaAdmin") return `Upazila Level — ${user?.upazila || "N/A"}`;
    return "Lab Level";
  })();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const updatePromise = (async () => {
      try {
        const body = new FormData();
        Object.keys(formData).forEach((key) => {
          body.append(key, formData[key]);
        });
        if (selectedFile) {
          body.append("profilePicture", selectedFile);
        }

        const res = await UserService.updateProfile(body);
        if (res.success) {
          setUser(res.data);
          setIsEditing(false);
          setSelectedFile(null);
          setPreviewUrl(null);
          return res.message;
        }
        throw res.message;
      } catch (err) {
        throw err.response?.data?.message || err || "Failed to update profile";
      } finally {
        setLoading(false);
      }
    })();

    toast.promise(updatePromise, {
      loading: "Updating profile...",
      success: (m) => m,
      error: (m) => m,
    });
  };

  const cancelEdit = () => {
    setFormData({
      userName: user?.userName || "",
      phoneNumber: user?.phoneNumber || "",
      altPhoneNumber: user?.altPhoneNumber || "",
      designation: user?.designation || "",
    });
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-emerald-50 p-6 lg:p-10 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-emerald-950">My Profile</h1>
            <p className="text-emerald-600 mt-2 text-lg">
              Manage your account information and appearances
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mt-3"></div>
          </div>

          <div className="flex gap-3">
            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
              >
                <HiOutlinePencilAlt className="w-5 h-5" />
                Edit Profile
              </motion.button>
            ) : (
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={cancelEdit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 border-2 border-emerald-100 rounded-2xl font-bold hover:bg-emerald-50 transition-all disabled:opacity-50"
                >
                  <HiOutlineXCircle className="w-5 h-5" />
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all disabled:opacity-50"
                >
                  <HiOutlineCheckCircle className="w-5 h-5" />
                  {loading ? "Saving..." : "Save Changes"}
                </motion.button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white backdrop-blur-xl rounded-3xl shadow-xl shadow-emerald-100 overflow-hidden border border-emerald-100 h-full"
            >
              <div className="h-32 bg-gradient-to-r from-emerald-500 to-blue-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent"></div>
              </div>

              <div className="px-6 pb-8 relative text-center">
                <div className="relative inline-block -mt-16 mb-6">
                  <div
                    onClick={() => {
                      if (!isEditing) {
                        setIsEditing(true);
                        setTimeout(() => fileInputRef.current?.click(), 200);
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden relative bg-emerald-600 mx-auto flex items-center justify-center group transition-all duration-300 cursor-pointer ${isEditing ? "ring-4 ring-emerald-500/20 scale-105" : "hover:scale-105 hover:ring-4 hover:ring-emerald-500/10"
                      }`}
                  >
                    {(previewUrl || (user?.imageUrl && !user.imageUrl.includes("iconpacks"))) ? (
                      <img src={previewUrl || user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-white transition-transform group-hover:scale-110">{initials}</span>
                    )}

                    {isEditing && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-all group-hover:bg-black/50">
                        <HiOutlineCamera className="w-8 h-8 text-white mb-1" />
                        <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Update</span>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Upload Badge */}
                  {isEditing && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 w-10 h-10 bg-emerald-600 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center z-20 hover:bg-emerald-700 transition-colors"
                      title="Click to upload photo"
                    >
                      <HiOutlineCamera className="w-6 h-6" />
                    </motion.button>
                  )}

                  {!isEditing && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-100 shadow-sm text-[10px] font-bold text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Profile Photo
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>

                <h2 className="text-2xl font-bold text-emerald-950">{displayName}</h2>
                <div className="flex justify-center mt-2 mb-3">
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${roleBadgeColors[role] || roleBadgeColors.LabAdmin}`}>
                    {role}
                  </span>
                </div>

                <p className="text-xs text-emerald-500 italic mb-4">{jurisdictionText}</p>

                <div className="flex justify-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${user?.isVerified
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}>
                    {user?.isVerified ? "✓ Verified" : "⚠ Unverified"}
                  </span>
                </div>

                <div className="mt-8 pt-6 border-t border-emerald-100 flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-3 text-emerald-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <HiOutlineMail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-500">Email Address</p>
                      <p className="text-sm font-medium break-all">{user?.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-emerald-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <HiOutlinePhone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-500">Phone</p>
                      <p className={`text-sm font-medium ${user?.phoneNumber ? "text-emerald-900" : "text-emerald-400 italic"}`}>
                        {user?.phoneNumber || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Profile Details */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white backdrop-blur-xl rounded-3xl shadow-xl shadow-emerald-100 border border-emerald-100 p-8 h-full"
            >
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-emerald-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <HiOutlineUser className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-950">Profile Details</h3>
                  <p className="text-sm text-emerald-500">
                    {isEditing ? "Update your personal information below" : "Your account information (view-only)"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  icon={<HiOutlineIdentification className="w-5 h-5" />}
                  label="Full Name"
                  value={isEditing ? formData.userName : user?.userName}
                  isEditing={isEditing}
                  name="userName"
                  onChange={handleInputChange}
                />
                <InfoRow
                  icon={<HiOutlineMail className="w-5 h-5" />}
                  label="Email Address"
                  value={user?.email}
                  isEditing={false} // Email cannot be changed by user for security
                />
                <InfoRow
                  icon={<HiOutlinePhone className="w-5 h-5" />}
                  label="Phone Number"
                  value={isEditing ? formData.phoneNumber : user?.phoneNumber}
                  isEditing={isEditing}
                  name="phoneNumber"
                  onChange={handleInputChange}
                />
                <InfoRow
                  icon={<HiOutlinePhone className="w-5 h-5" />}
                  label="Alt Phone Number"
                  value={isEditing ? formData.altPhoneNumber : user?.altPhoneNumber}
                  isEditing={isEditing}
                  name="altPhoneNumber"
                  onChange={handleInputChange}
                />
                <InfoRow
                  icon={<HiOutlineBriefcase className="w-5 h-5" />}
                  label="Designation"
                  value={isEditing ? formData.designation : user?.designation}
                  isEditing={isEditing}
                  name="designation"
                  onChange={handleInputChange}
                />
                <InfoRow
                  icon={<HiOutlineShieldCheck className="w-5 h-5" />}
                  label="Role"
                  value={user?.role}
                  isEditing={false}
                />
                {(user?.division || user?.role === "DivisionAdmin" || user?.role === "SuperAdmin") && (
                  <InfoRow
                    icon={<HiOutlineLocationMarker className="w-5 h-5" />}
                    label="Division"
                    value={user?.division || (user?.role === "SuperAdmin" ? "All Bangladesh" : null)}
                    isEditing={false}
                  />
                )}
                {(user?.district || user?.role === "DistrictAdmin") && (
                  <InfoRow
                    icon={<HiOutlineLocationMarker className="w-5 h-5" />}
                    label="District"
                    value={user?.district}
                    isEditing={false}
                  />
                )}
                {(user?.upazila || user?.role === "UpazilaAdmin") && (
                  <InfoRow
                    icon={<HiOutlineLocationMarker className="w-5 h-5" />}
                    label="Upazila"
                    value={user?.upazila}
                    isEditing={false}
                  />
                )}
              </div>

              {/* Info notice */}
              <AnimatePresence>
                {!isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3"
                  >
                    <HiOutlineShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Profile Security</p>
                      <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                        Basic jurisdiction (Division/District/Upazila) and Role are managed by the system administrator.
                        If you need to change these, please contact the Super Admin.
                        You can update your display name, contact numbers, and designation directly.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
