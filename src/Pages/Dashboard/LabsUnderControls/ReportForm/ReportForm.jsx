import React, { useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  HiCheck,
  HiOutlineChip,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineX,
} from "react-icons/hi";
import { RiRobot3Fill } from "react-icons/ri";
import { GiRobotGolem } from "react-icons/gi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ictd-lab-backend.vercel.app/api/v1";

const ReportForm = ({ onClose, instituteName, labId, labType = "sof" }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("labId", labId);
      formData.append("labType", labType);
      formData.append("basicRobotics", parseInt(data.basicRobotics) || 0);
      formData.append("advancedRobotics", parseInt(data.advancedRobotics) || 0);
      formData.append("3dPrinter", parseInt(data["3dPrinter"]) || 0);
      formData.append("vrHeadset", parseInt(data.vrHeadset) || 0);
      formData.append("networkCamera", parseInt(data.networkCamera) || 0);
      formData.append("ups", parseInt(data.ups) || 0);
      formData.append("isFunctional", data.isFunctional || "");
      formData.append("damageDetails", data.damageDetails || "");
      formData.append("recommendations", data.recommendations || "");

      selectedFiles.forEach((file) => {
        formData.append("storageImages", file);
      });

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/lab-reports`, {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Report submitted successfully!", {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
        imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
        onClose();
      } else {
        setSubmitError(result.message || "Failed to submit report");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      setSubmitError("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ml-20 bg-emerald-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300 relative border border-emerald-100">
      {submitError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border-2 border-red-400 text-red-800 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-sm animate-in slide-in-from-top duration-300">
          <p className="font-semibold flex items-center gap-2">
            <HiOutlineX className="w-5 h-5" /> {submitError}
          </p>
        </div>
      )}

      <div className="relative flex items-center justify-between p-6 border-b border-emerald-200 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl shadow-sm">
            <HiOutlineDocumentText className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 uppercase tracking-wide">
              SOR: {instituteName || "NAME OF THE INSTITUTE"}
            </h2>
            <p className="text-emerald-600 text-sm mt-1 flex items-center gap-2">
              <HiOutlineChip className="w-4 h-4" />
              IT Equipment & Functionality Report
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="group p-2.5 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-red-200"
        >
          <HiOutlineX className="w-6 h-6 transition-transform group-hover:rotate-90" />
        </button>
      </div>

      <div className="relative flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-track-emerald-50 scrollbar-thumb-emerald-200 hover:scrollbar-thumb-emerald-300">
        <form id="report-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <HiOutlineCube className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-emerald-800 uppercase tracking-wide">
                A. IT Equipment Inventory
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: "Basic Robotics Instruments", name: "basicRobotics", icon: <RiRobot3Fill /> },
                { label: "Advanced Robotics Instruments", name: "advancedRobotics", icon: <GiRobotGolem /> },
                { label: "3D Printer & Filament", name: "3dPrinter", icon: "Printer" },
                { label: "VR Headset with Controller", name: "vrHeadset", icon: "VR" },
                { label: "IR Fixed Bullet Network Camera", name: "networkCamera", icon: "Camera" },
                { label: "UPS", name: "ups", icon: "UPS" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="group flex items-center justify-between gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <label className="flex items-center gap-3 text-emerald-700 text-sm font-semibold cursor-pointer">
                    <span className="text-lg transition-transform group-hover:scale-110 text-emerald-600 font-bold">
                      {item.icon}
                    </span>
                    {item.label}
                  </label>
                  <input
                    type="number"
                    min={0}
                    defaultValue={0}
                    {...register(item.name)}
                    className="w-[30%] px-5 flex justify-center items-center bg-white border-2 border-emerald-200 rounded-lg py-3 text-center text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-500 transition-all hover:border-emerald-400 shadow-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-emerald-800 mb-6 uppercase tracking-wide">
              B. Whether the robotic instruments are functional
            </h3>
            <div className="flex gap-8">
              <label className="group flex items-center gap-4 cursor-pointer p-4 rounded-xl hover:bg-emerald-50 transition-all duration-300 border border-transparent hover:border-emerald-100">
                <div className="relative flex items-center justify-center w-7 h-7">
                  <input
                    type="radio"
                    value="yes"
                    {...register("isFunctional")}
                    className="peer appearance-none w-6 h-6 border-2 border-emerald-300 rounded-full checked:border-emerald-500 checked:bg-emerald-500 transition-all cursor-pointer"
                  />
                  <div className="absolute w-2.5 h-2.5 bg-white rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                </div>
                <span className="text-emerald-700 font-semibold text-lg group-hover:text-emerald-900 transition-colors">
                  Yes
                </span>
              </label>
              <label className="group flex items-center gap-4 cursor-pointer p-4 rounded-xl hover:bg-red-50 transition-all duration-300 border border-transparent hover:border-red-100">
                <div className="relative flex items-center justify-center w-7 h-7">
                  <input
                    type="radio"
                    value="no"
                    {...register("isFunctional")}
                    className="peer appearance-none w-6 h-6 border-2 border-red-300 rounded-full checked:border-red-500 checked:bg-red-500 transition-all cursor-pointer"
                  />
                  <div className="absolute w-2.5 h-2.5 bg-white rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                </div>
                <span className="text-emerald-700 font-semibold text-lg group-hover:text-red-600 transition-colors">
                  No
                </span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-emerald-800 mb-4 uppercase tracking-wide">
              C. Details of damaged/inoperative equipment and possible causes
            </h3>
            <textarea
              {...register("damageDetails")}
              className="w-full bg-emerald-50/50 border-2 border-emerald-200 rounded-xl p-5 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-500 transition-all resize-y min-h-[120px] placeholder-emerald-400 hover:border-emerald-300 shadow-inner font-medium leading-relaxed"
              placeholder="Describe any damaged equipment, symptoms, and possible causes..."
            />
          </div>

          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-emerald-800 mb-4 uppercase tracking-wide">
              D. Storage Images
            </h3>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-400 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-2 text-sm text-emerald-600 font-semibold">
                    <span className="font-bold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-emerald-500">PNG, JPG, JPEG (MAX. 5MB each)</p>
                </div>
                <input
                  id="storageImages"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    const previews = files.map((file) => URL.createObjectURL(file));
                    setImagePreviews(previews);
                    setSelectedFiles(files);
                  }}
                />
              </label>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-emerald-200 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(preview);
                          setImagePreviews(imagePreviews.filter((_, i) => i !== index));
                          setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 shadow-sm"
                      >
                        <HiOutlineX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-emerald-800 mb-4 uppercase tracking-wide">
              E. Problems encountered and necessary recommendations
            </h3>
            <textarea
              {...register("recommendations")}
              className="w-full bg-emerald-50/50 border-2 border-emerald-200 rounded-xl p-5 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-500 transition-all resize-y min-h-[120px] placeholder-emerald-400 hover:border-emerald-300 shadow-inner font-medium leading-relaxed"
              placeholder="List problems, challenges, and recommendations for improvement..."
            />
          </div>
        </form>
      </div>

      <div className="relative p-6 border-t border-emerald-200 bg-white/80 backdrop-blur-xl flex justify-end gap-4">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="group px-8 py-3 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all font-semibold cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        >
          Cancel
        </button>
        <button
          form="report-form"
          type="submit"
          disabled={isSubmitting}
          className="group relative px-10 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all duration-300 font-bold flex items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 overflow-hidden"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              <HiCheck className="w-6 h-6" />
              Submit Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportForm;
