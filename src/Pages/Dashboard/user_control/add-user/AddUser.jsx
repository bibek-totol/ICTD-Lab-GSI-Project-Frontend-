import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaUserPlus } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";
import { motion } from "framer-motion";

const API = import.meta.env.VITE_API_BASE_URL;

const ROLES = [
  { value: "DivisionAdmin", label: "Division Admin" },
  { value: "DistrictAdmin", label: "District Admin" },
  { value: "UpazilaAdmin", label: "Upazila Admin" },
];

const baseInput =
  "w-full mt-1 rounded-xl px-4 py-3 text-sm bg-white border border-emerald-300 " +
  "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 outline-none transition-all";

const AddUser = () => {
  const [form, setForm] = useState({
    userName: "",
    designation: "",
    email: "",
    role: "",
    phone: "",
    division: "",
    district: "",
    upazila: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);

  /* Load BD geo data */
  useEffect(() => {
    fetch("/bd-divisions.json").then(r => r.json()).then(d => setDivisions(d.divisions || []));
    fetch("/bd-districts.json").then(r => r.json()).then(d => setDistricts(d.districts || []));
    fetch("/bd-upazilas.json").then(r => r.json()).then(d => setUpazilas(d.upazilas || []));
  }, []);

  const filteredDistricts = useMemo(() =>
    form.division ? districts.filter(d => d.division_id === form.division) : [], [districts, form.division]);

  const filteredUpazilas = useMemo(() =>
    form.district ? upazilas.filter(u => u.district_id === form.district) : [], [upazilas, form.district]);

  const getDivisionName = (id) => divisions.find(d => d.id === id)?.name || "";
  const getDistrictName = (id) => districts.find(d => d.id === id)?.name || "";
  const getUpazilaName = (id) => upazilas.find(u => u.id === id)?.name || "";

  const handleReset = () => {
    setForm({ userName: "", designation: "", email: "", role: "", phone: "", division: "", district: "", upazila: "" });
  };

  // Determine if jurisdiction fields are required based on role
  const requiresDivision = ["DivisionAdmin", "DistrictAdmin", "UpazilaAdmin"].includes(form.role);
  const requiresDistrict = ["DistrictAdmin", "UpazilaAdmin"].includes(form.role);
  const requiresUpazila = ["UpazilaAdmin"].includes(form.role);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.role) {
      toast.error("Role is required");
      return;
    }

    if (requiresDivision && !form.division) {
      toast.error("Division is required for this role");
      return;
    }
    if (requiresDistrict && !form.district) {
      toast.error("District is required for this role");
      return;
    }
    if (requiresUpazila && !form.upazila) {
      toast.error("Upazila is required for this role");
      return;
    }

    if (form.phone && !/^1[3-9]\d{8}$/.test(form.phone)) {
      toast.error("Enter a valid phone number (1XXXXXXXXX)");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        userName: form.userName.trim() || undefined,
        designation: form.designation.trim() || undefined,
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phone ? `+880${form.phone}` : undefined,
        role: form.role,
        division: form.division ? getDivisionName(form.division) : undefined,
        district: form.district ? getDistrictName(form.district) : undefined,
        upazila: form.upazila ? getUpazilaName(form.upazila) : undefined,
      };

      const res = await axios.post(`${API}/users/manage`, payload, { withCredentials: true });

      if (res.data.success) {
        toast.success(`Admin "${payload.email}" created successfully!`, { icon: "👤" });
        handleReset();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create admin";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-emerald-50 py-12 px-4"
    >
      <div className="max-w-4xl mx-auto mt-5">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <FaUserPlus className="text-emerald-700 text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-emerald-900">Add Admin</h1>
          </div>
          <p className="text-emerald-700">Create a new admin with role, designation and jurisdiction</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-emerald-700">Full Name</label>
              <input
                className={baseInput}
                placeholder="Enter full name"
                value={form.userName}
                onChange={e => setForm({ ...form, userName: e.target.value })}
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-emerald-700">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                className={baseInput}
                placeholder="Enter email address"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>


            {/* Role */}
            <div>
              <label className="text-xs font-semibold text-emerald-700">Role <span className="text-red-500">*</span></label>
              <select
                className={baseInput}
                required
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value, division: "", district: "", upazila: "" })}
              >
                <option value="">Select role</option>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Designation */}
            <div>
              <label className="text-xs font-semibold text-emerald-700">Designation</label>
              <input
                className={baseInput}
                placeholder="Enter designation"
                value={form.designation}
                onChange={e => setForm({ ...form, designation: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-emerald-700">Phone Number</label>
              <div className="group mt-1 flex items-center gap-3 rounded-xl px-4 py-3 border border-emerald-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-400">
                <span className="font-semibold text-emerald-800">+880</span>
                <input
                  className="flex-1 outline-none text-sm"
                  placeholder="1XXXXXXXXX"
                  value={form.phone}
                  onChange={e => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.startsWith("880")) value = value.slice(3);
                    if (value.startsWith("0")) value = value.slice(1);
                    setForm({ ...form, phone: value.slice(0, 10) });
                  }}
                />
              </div>
            </div>

            {/* Division */}
            {requiresDivision && (
              <div>
                <label className="text-xs font-semibold text-emerald-700">
                  Division {requiresDivision && <span className="text-red-500">*</span>}
                </label>
                <select
                  className={baseInput}
                  value={form.division}
                  onChange={e => setForm({ ...form, division: e.target.value, district: "", upazila: "" })}
                  required={requiresDivision}
                >
                  <option value="">Select division</option>
                  {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}

            {/* District */}
            {requiresDistrict && (
              <div>
                <label className="text-xs font-semibold text-emerald-700">
                  District {requiresDistrict && <span className="text-red-500">*</span>}
                </label>
                <select
                  className={baseInput}
                  value={form.district}
                  onChange={e => setForm({ ...form, district: e.target.value, upazila: "" })}
                  required={requiresDistrict}
                >
                  <option value="">Select district</option>
                  {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}

            {/* Upazila */}
            {requiresUpazila && (
              <div>
                <label className="text-xs font-semibold text-emerald-700">
                  Upazila {requiresUpazila && <span className="text-red-500">*</span>}
                </label>
                <select
                  className={baseInput}
                  value={form.upazila}
                  onChange={e => setForm({ ...form, upazila: e.target.value })}
                  required={requiresUpazila}
                >
                  <option value="">Select upazila</option>
                  {filteredUpazilas.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Info notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            <strong>Note:</strong> Created admins are initially <strong>unverified</strong>. SuperAdmin can verify them and assign a password in the Manage Admin section.
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold flex items-center gap-2"
            >
              <GrPowerReset />
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-10 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white rounded-xl font-semibold flex items-center gap-2"
            >
              {submitting ? (
                <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Creating...</>
              ) : (
                <><FaUserPlus /> Add Admin</>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.section>
  );
};

export default AddUser;
