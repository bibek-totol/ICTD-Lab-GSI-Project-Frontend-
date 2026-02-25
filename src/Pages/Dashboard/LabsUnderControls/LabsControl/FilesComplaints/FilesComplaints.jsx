import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
import { FaImage } from "react-icons/fa";
import ComplaintService from "../../../../../services/complaint.service";
import LabService from "../../../../../services/lab.service";
import {
  HiOutlineExclamationCircle,
  HiOutlineArrowLeft,
  HiOutlinePhotograph,
  HiOutlineX,
} from "react-icons/hi";

// Import Assets
import smartBoard from "../../../../../assets/complaint/smartboard.png";
import desktop from "../../../../../assets/complaint/desktop.png";
import attandence from "../../../../../assets/complaint/attandence.png";
import smartCard from "../../../../../assets/complaint/smartCard.png";
import wifi from "../../../../../assets/complaint/wifi.png";
import laptop from "../../../../../assets/complaint/laptop.png";
import smarttv from "../../../../../assets/complaint/smarttv.png";
import printer from "../../../../../assets/complaint/printer.png";
import scanneer from "../../../../../assets/complaint/scanner.png";
import webcam from "../../../../../assets/complaint/webcam.png";
import router from "../../../../../assets/complaint/router.png";
import networkswitch from "../../../../../assets/complaint/switch.png";
import internet from "../../../../../assets/complaint/internet.png";

const FilesComplaints = () => {
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [labData, setLabData] = useState(null);

  useEffect(() => {
    if (id) {
      LabService.getLabById(id).then(res => {
        if (res.success) setLabData(res.data);
      });
    }
  }, [id]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const categories = [
    { name: "Equipment", icon: laptop, description: "Issues with laptops, TVs, printers, etc." },
    { name: "Infrastructure", icon: smartBoard, description: "Lab building, electricity, furniture issues." },
    { name: "Internet", icon: internet, description: "Connectivity, router, or network problems." },
    { name: "Personnel", icon: attandence, description: "Staff attendance or behavior issues." },
    { name: "Security", icon: smartCard, description: "Theft, damage, or safety concerns." },
    { name: "Other", icon: scanneer, description: "Any other situational complaints." },
  ];

  const openModal = (categoryName) => {
    setSelectedDevice(categoryName); // Using this as category
    setIsModalOpen(true);
    reset();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDevice("");
    reset();
  };

  const onSubmit = async (data) => {
    const loadingToast = toast.loading("Submitting complaint...");
    try {
      const formData = new FormData();
      formData.append("category", selectedDevice);
      formData.append("subject", data.subject);
      formData.append("description", data.description);
      formData.append("priority", data.priority);

      // These should come from context or lab-selection if not hardcoded
      // For now, let's assume they are required from somewhere. 
      // If this page is reached from a lab-context, we'd have them.
      // Mocking them for now if not present.
      formData.append("division", labData?.division || "N/A");
      formData.append("district", labData?.district || "N/A");
      formData.append("upazila", labData?.upazila || "N/A");
      formData.append("institute", labData?.institute || "N/A");
      formData.append("labType", labData?.type || "");

      if (data.screenshot && data.screenshot.length > 0) {
        for (let i = 0; i < data.screenshot.length; i++) {
          formData.append("complaintImages", data.screenshot[i]);
        }
      }

      await ComplaintService.createComplaint(formData);

      toast.success("Submitting successfully!", { id: loadingToast });
      closeModal();
    } catch (err) {
      toast.error("Failed to submit complaint", { id: loadingToast });
      console.error(err);
    }
  };

  const InputGroup = ({ label, error, required, children }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs">{error.message}</p>}
    </div>
  );

  const Input = ({ className, ...props }) => (
    <input
      className={`w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-sm hover:border-gray-300 ${className}`}
      {...props}
    />
  );

  const Select = ({ className, children, ...props }) => (
    <select
      className={`w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-sm hover:border-gray-300 ${className}`}
      {...props}
    >
      {children}
    </select>
  );

  const Textarea = ({ className, ...props }) => (
    <textarea
      className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none ${className}`}
      {...props}
    />
  );

  return (
    <div className="min-h-screen bg-emerald-50 p-6 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/dashboard/labsUnderControl"
              className="p-2 text-gray-400  bg-red-700 rounded-full transition-all"
            >
              <HiOutlineArrowLeft className="w-7 h-7 text-white hover:text-emerald-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-green-950">File a Complaint</h1>
              <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mt-2"></div>
            </div>
          </div>
          <p className="text-gray-600 text-sm ml-14">
            Select a situational category to report an issue
          </p>
        </div>
      </div>

      {/* Situational Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b-2 border-emerald-100">
          <h2 className="text-xl font-bold text-green-950">Select Complaint Category</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl shadow-sm hover:shadow-2xl border border-emerald-50 hover:border-emerald-200 transition-all duration-500 p-8 flex flex-col items-center group cursor-pointer transform hover:-translate-y-2 relative overflow-hidden"
              onClick={() => openModal(cat.name)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-100 transition-colors duration-500"></div>

              <div className="w-24 h-24 mb-6 flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl group-hover:scale-110 transition-all duration-500 shadow-inner">
                <img
                  src={cat.icon}
                  alt={cat.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {cat.name}
              </h3>
              <p className="text-center text-gray-500 text-sm mb-6 px-4 leading-relaxed">
                {cat.description}
              </p>
              <button
                className="w-full py-3 px-6 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 border border-emerald-100 group-hover:border-emerald-600"
              >
                <HiOutlineExclamationCircle className="w-5 h-5" />
                Select {cat.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-emerald-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <HiOutlineExclamationCircle className="w-6 h-6 text-emerald-600" />
                  File &quot;{selectedDevice}&quot; Complaint
                </h2>
                <p className="text-xs text-emerald-600 mt-1 font-medium italic">
                  Please provide details about the situational issue.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors shadow-sm"
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <InputGroup label="Subject" error={errors.subject} required>
                  <Input
                    {...register("subject", { required: "Subject is required" })}
                    placeholder="Briefly describe the issue (e.g. Broken lock)"
                  />
                </InputGroup>

                <InputGroup label="Priority" error={errors.priority} required>
                  <Select
                    {...register("priority", { required: "Priority is required" })}
                  >
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </Select>
                </InputGroup>

                <InputGroup label="Detailed Description" error={errors.description} required>
                  <Textarea
                    {...register("description", {
                      required: "Please describe the issue in detail",
                      minLength: { value: 10, message: "Please provide more details (min 10 chars)" }
                    })}
                    rows="5"
                    placeholder="Details about what happened, who is involved, and current status..."
                  />
                </InputGroup>

                <div className="pt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Attach Evidence (Optional)
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-emerald-50 hover:border-emerald-400 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <HiOutlinePhotograph className="w-8 h-8 text-gray-400 mb-2 group-hover:text-emerald-500 transition-colors" />
                        <p className="text-sm text-gray-500 group-hover:text-emerald-700">
                          <span className="font-semibold">Click to upload</span> (Max 5 images)
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG or JPEG</p>
                      </div>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/*"
                        {...register("screenshot")}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                className="px-8 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2"
              >
                <FaImage className="w-4 h-4" />
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesComplaints;
