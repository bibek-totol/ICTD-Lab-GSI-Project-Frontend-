import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaUserPlus } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";
import { motion } from "framer-motion";

const AddUser = () => {
  const [form, setForm] = useState({
    name: "",
    designation: "",
    email: "",
    role: "",
    phone: "",
    division: "",
    district: "",
    upazila: "",
  });

  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);

  /* ======================
     Load JSON
  ======================= */
  useEffect(() => {
    fetch("/bd-divisions.json")
      .then(res => res.json())
      .then(data => setDivisions(data.divisions || []));

    fetch("/bd-districts.json")
      .then(res => res.json())
      .then(data => setDistricts(data.districts || []));

    fetch("/bd-upazilas.json")
      .then(res => res.json())
      .then(data => setUpazilas(data.upazilas || []));
  }, []);

  /* ======================
     Filters
  ======================= */
  const filteredDistricts = useMemo(() => {
    if (!form.division) return [];
    return districts.filter(d => d.division_id === form.division);
  }, [districts, form.division]);

  const filteredUpazilas = useMemo(() => {
    if (!form.district) return [];
    return upazilas.filter(u => u.district_id === form.district);
  }, [upazilas, form.district]);

  /* ======================
     ID → NAME helpers
  ======================= */
  const getDivisionName = (id) =>
    divisions.find(d => d.id === id)?.name || "";

  const getDistrictName = (id) =>
    districts.find(d => d.id === id)?.name || "";

  const getUpazilaName = (id) =>
    upazilas.find(u => u.id === id)?.name || "";

  /* ======================
     Reset
  ======================= */
  const handleReset = () => {
    setForm({
      name: "",
      designation: "",
      email: "",
      role: "",
      phone: "",
      division: "",
      district: "",
      upazila: "",
    });
  };

  /* ======================
     Submit
  ======================= */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.role) {
      toast.error("Role is required", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      return;
    }

    if (!form.division || !form.district || !form.upazila) {
      toast.error("Division, District and Upazila are required", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      return;
    }

    if (!/^01[3-9]\d{8}$/.test(form.phone)) {
      toast.error("Enter a valid phone number (01XXXXXXXXX)", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      return;
    }

    const payload = {
      name: form.name,
      designation: form.designation,
      email: form.email,
      phone: "+880" + form.phone,
      role: form.role,
      division: getDivisionName(form.division),
      district: getDistrictName(form.district),
      upazila: getUpazilaName(form.upazila),
    };

    console.log("✅ Backend Payload:", payload);
    toast.success("User created successfully", {
      icon: '👤',
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
    handleReset();
  };

  const baseInput =
    "w-full mt-1 rounded-xl px-4 py-3 text-sm bg-white border border-emerald-300 " +
    "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 outline-none transition-all";

  const roles = [
    "SUPER ADMIN",
    "LAB ADMIN",
    "DIVISION ADMIN",
    "DISTRICT ADMIN",
    "UPAZILA ADMIN",
  ];

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
            <h1 className="text-3xl font-bold text-emerald-900">
              Add User
            </h1>
          </div>
          <p className="text-emerald-700">
            User creation with role, designation and location
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-emerald-700">
                Name
              </label>
              <input
                className={baseInput}
                placeholder="Enter full name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            {/* Designation */}


            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-emerald-700">
                Email
              </label>
              <input
                type="email"
                className={baseInput}
                placeholder="Enter email address"
                required
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-semibold text-emerald-700">
                Role
              </label>
              <select
                className={baseInput}
                required
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
              >
                <option value="">Select role</option>
                {roles.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-emerald-700">
                Designation
              </label>
              <input
                className={baseInput}
                placeholder="Enter designation"
                required
                value={form.designation}
                onChange={(e) =>
                  setForm({ ...form, designation: e.target.value })
                }
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-emerald-700">
                Phone Number
              </label>
              <div className="group mt-1 flex items-center gap-3 rounded-xl px-4 py-3 border border-emerald-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-400">
                <span className="font-semibold text-emerald-800">+880</span>
                <input
                  className="flex-1 outline-none text-sm"
                  placeholder="1XXXXXXXXX"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Division */}
            <div>
              <label className="text-xs font-semibold text-emerald-700">
                Division
              </label>
              <select
                className={baseInput}
                value={form.division}
                onChange={(e) =>
                  setForm({
                    ...form,
                    division: e.target.value,
                    district: "",
                    upazila: "",
                  })
                }
                required
              >
                <option value="">Select division</option>
                {divisions.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="text-xs font-semibold text-emerald-700">
                District
              </label>
              <select
                className={baseInput}
                value={form.district}
                onChange={(e) =>
                  setForm({
                    ...form,
                    district: e.target.value,
                    upazila: "",
                  })
                }
                required
              >
                <option value="">Select district</option>
                {filteredDistricts.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Upazila */}
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-emerald-700">
                Upazila
              </label>
              <select
                className={baseInput}
                value={form.upazila}
                onChange={(e) =>
                  setForm({ ...form, upazila: e.target.value })
                }
                required
              >
                <option value="">Select upazila</option>
                {filteredUpazilas.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Actions */}
          <div className="mt-10 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-10 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold"
            >
              <GrPowerReset className="text-2xl" />
            </button>

            <button
              type="submit"
              className="px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
            >
              Add User
            </button>
          </div>
        </form>
      </div>
    </motion.section>
  );
};

export default AddUser;
