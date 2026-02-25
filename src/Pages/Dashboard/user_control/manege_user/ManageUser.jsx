import { useState } from "react";
import { FaSave, FaUndo } from "react-icons/fa";
import { motion } from "framer-motion";
import usersData from "../../../../data/userdb.json";

const ManageUser = () => {
  const [users, setUsers] = useState(
  usersData.map((u) => ({
    ...u,
    status: u.status === "Active" ? "Active" : "Inactive",
    institute_name: u.institute_name ?? "N/A",
  }))
);
  const [drafts, setDrafts] = useState({});

  const statuses = ["Active", "Inactive"];

  const handleChange = (id, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  };

  const saveUser = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...drafts[id] } : u))
    );

    setDrafts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const resetUser = (id) => {
    setDrafts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen py-10 px-4 md:px-8 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-950">Manage Users</h1>
          <p className="text-emerald-700 mt-2">Update user status and save or reset</p>
        </div>

        <div className="bg-white/90 rounded-2xl shadow-xl border border-emerald-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-100/60 border-b border-emerald-200">
                <th className="px-6 py-4 text-left">#</th>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-left">Institute</th>
                <th className="px-6 py-4 text-left">Role</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-emerald-100">
              {users.map((user, index) => {
                const draft = drafts[user.id] || {};
                const statusValue = draft.status ?? user.status;
                const hasChange = !!drafts[user.id];

                return (
                  <tr key={user.id} className="hover:bg-emerald-50">
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>

                    <td className="px-6 py-4">{user.institute_name || "N/A"}</td>

                    {/* Role visible only */}
                    <td className="px-6 py-4 font-medium text-emerald-900">
                      {user.role}
                    </td>

                    {/* Editable Status */}
                    <td className="px-6 py-4">
                      <select
                        value={statusValue}
                        onChange={(e) =>
                          handleChange(user.id, "status", e.target.value)
                        }
                        className="border border-emerald-200 rounded-xl px-3 py-2"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-4">
                        {/* Save */}
                        <button
                          onClick={() => saveUser(user.id)}
                          disabled={!hasChange}
                          title="Save"
                          className={`text-lg transition ${hasChange
                              ? "text-emerald-600 hover:text-emerald-800"
                              : "text-gray-300 cursor-not-allowed"
                            }`}
                        >
                          <FaSave />
                        </button>

                        {/* Reset */}
                        <button
                          onClick={() => resetUser(user.id)}
                          disabled={!hasChange}
                          title="Reset"
                          className={`text-lg transition ${hasChange
                              ? "text-blue-600 hover:text-blue-800"
                              : "text-gray-300 cursor-not-allowed"
                            }`}
                        >
                          <FaUndo />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-emerald-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
};

export default ManageUser;
