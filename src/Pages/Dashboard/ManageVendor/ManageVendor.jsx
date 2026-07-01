import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBuilding,
  FaCheckCircle,
  FaEdit,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaPlus,
  FaSync,
  FaTimes,
  FaTimesCircle,
  FaTrash,
} from 'react-icons/fa';

const API = import.meta.env.VITE_API_BASE_URL;

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

const emptyVendor = {
  name: '',
  address: '',
  phone: '',
  serial: 1,
  isActive: true,
};

const ManageVendor = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState(emptyVendor);

  const sortedVendors = useMemo(
    () => [...vendors].sort((a, b) => (Number(a.serial) || 0) - (Number(b.serial) || 0)),
    [vendors],
  );

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/vendors`, getAuthConfig());
      if (data?.success) {
        setVendors(data.data || []);
      }
    } catch (err) {
      try {
        const { data } = await axios.get(`${API}/vendors/active`);
        if (data?.success) {
          setVendors(data.data || []);
          toast.error('Showing published vendors. Sign in as Super Admin to manage them.');
          return;
        }
      } catch (fallbackErr) {
        console.error('Failed to fetch active vendors:', fallbackErr);
      }
      toast.error(err.response?.data?.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name || '',
        address: vendor.address || '',
        phone: vendor.phone || '',
        serial: vendor.serial || 1,
        isActive: vendor.isActive ?? true,
      });
    } else {
      setEditingVendor(null);
      setFormData({
        ...emptyVendor,
        serial: vendors.length
          ? Math.max(...vendors.map((vendor) => Number(vendor.serial) || 0)) + 1
          : 1,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVendor(null);
    setFormData(emptyVendor);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const toastId = toast.loading(editingVendor ? 'Updating vendor...' : 'Creating vendor...');

    try {
      const payload = {
        ...formData,
        serial: Number(formData.serial) || 1,
      };

      const { data } = editingVendor
        ? await axios.put(`${API}/vendors/update/${editingVendor.id}`, payload, getAuthConfig())
        : await axios.post(`${API}/vendors/create`, payload, getAuthConfig());

      if (data?.success) {
        toast.success(editingVendor ? 'Vendor updated' : 'Vendor created', { id: toastId });
        fetchVendors();
        closeModal();
      } else {
        toast.error(data?.message || 'Operation failed', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (vendor) => {
    const toastId = toast.loading('Updating status...');
    try {
      const { data } = await axios.put(
        `${API}/vendors/update/${vendor.id}`,
        { isActive: !vendor.isActive },
        getAuthConfig(),
      );

      if (data?.success) {
        setVendors((prev) =>
          prev.map((item) =>
            item.id === vendor.id ? { ...item, isActive: !vendor.isActive } : item,
          ),
        );
        toast.success('Status updated', { id: toastId });
      } else {
        toast.error(data?.message || 'Status update failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Status update failed', { id: toastId });
    }
  };

  const handleDelete = (vendor) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-1">
          <p className="text-sm font-bold text-emerald-950">Delete vendor?</p>
          <p className="text-xs text-emerald-600">{vendor.name}</p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = toast.loading('Deleting vendor...');
                try {
                  await axios.delete(`${API}/vendors/delete/${vendor.id}`, getAuthConfig());
                  setVendors((prev) => prev.filter((item) => item.id !== vendor.id));
                  toast.success('Vendor deleted', { id: toastId });
                } catch (err) {
                  toast.error('Delete failed', { id: toastId });
                }
              }}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white"
            >
              Confirm
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 6000, position: 'top-center' },
    );
  };

  return (
    <div className="min-h-screen space-y-6 bg-emerald-50 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-emerald-950">Vendor Management</h1>
          <p className="mt-2 text-emerald-600">
            Store and manage Contact With Vendor landing page data from the Vendor table.
          </p>
          <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" />
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchVendors}
            className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
          >
            <FaSync className={loading ? 'animate-spin' : ''} /> Reload
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            <FaPlus /> New Vendor
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-600 text-left text-white">
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Serial</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <FaSync className="mx-auto mb-4 animate-spin text-4xl text-emerald-600" />
                    <p className="font-medium text-emerald-500">Fetching vendors...</p>
                  </td>
                </tr>
              ) : sortedVendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-emerald-400">
                    <FaBuilding className="mx-auto mb-4 text-5xl opacity-20" />
                    No vendors found. Create one to publish on the landing page.
                  </td>
                </tr>
              ) : (
                sortedVendors.map((vendor) => (
                  <tr key={vendor.id} className="transition hover:bg-emerald-50/60">
                    <td className="px-6 py-4 font-bold text-emerald-700">{vendor.serial}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xl">
                        <p className="text-base font-bold text-emerald-950">{vendor.name}</p>
                        <div className="mt-2 flex items-start gap-2 text-xs text-emerald-600">
                          <FaMapMarkerAlt className="mt-0.5 shrink-0" />
                          <span>{vendor.address || 'No address added'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-semibold text-emerald-800">
                        <FaPhoneAlt className="text-emerald-500" />
                        {vendor.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(vendor)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition hover:scale-105 ${
                          vendor.isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {vendor.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                        {vendor.isActive ? 'PUBLISHED' : 'UNPUBLISHED'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openModal(vendor)}
                          className="rounded-xl bg-blue-50 p-2 text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor)}
                          className="rounded-xl bg-red-50 p-2 text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white"
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

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative z-[101] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between bg-emerald-600 p-6 text-white">
                <div>
                  <h3 className="text-2xl font-bold">
                    {editingVendor ? 'Edit Vendor' : 'Create Vendor'}
                  </h3>
                  <p className="mt-1 text-xs text-emerald-100">
                    Vendor table data for the landing page
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-full p-2 transition hover:bg-white/20"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-8">
                <div className="space-y-2">
                  <label className="pl-1 text-xs font-bold uppercase tracking-widest text-emerald-600">
                    Vendor Name
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="Enter vendor name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="pl-1 text-xs font-bold uppercase tracking-widest text-emerald-600">
                    Address
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="min-h-[100px] w-full rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="Enter vendor address"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-1">
                    <label className="pl-1 text-xs font-bold uppercase tracking-widest text-emerald-600">
                      Phone
                    </label>
                    <input
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                      placeholder="01700-000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="pl-1 text-xs font-bold uppercase tracking-widest text-emerald-600">
                      Serial
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.serial}
                      onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                      className="w-full rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="pl-1 text-xs font-bold uppercase tracking-widest text-emerald-600">
                      Status
                    </label>
                    <select
                      value={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.value === 'true' })
                      }
                      className="w-full rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    >
                      <option value="true">Published</option>
                      <option value="false">Unpublished</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-2xl bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-600 transition hover:bg-emerald-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {editingVendor ? 'Update Vendor' : 'Save Vendor'}
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

export default ManageVendor;
