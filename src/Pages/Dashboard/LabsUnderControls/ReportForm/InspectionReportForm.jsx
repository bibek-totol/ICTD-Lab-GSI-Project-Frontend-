import React, { useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  HiCheck,
  HiOutlineDocumentText,
  HiOutlineX,
} from "react-icons/hi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ictd-lab-backend.vercel.app/api/v1";

const sofOperationLabel = "আইসিটিডি স্কুল অব ফিউচার এন্ড রোবোটিক্স কর্নার যথাযথভাবে পরিচালিত না হলে তার কারণ।";
const ictdlOperationLabel = "আইসিটিডি ডিজিটাল ল্যাব যথাযথভাবে পরিচালিত না হলে তার কারণ।";

const reportFields = [
  {
    label: "শিক্ষা প্রতিষ্ঠানের নাম ও ঠিকানা",
    name: "instituteAddress",
    type: "textarea",
    placeholder: "প্রতিষ্ঠানের নাম ও পূর্ণ ঠিকানা",
  },
  {
    label: "ল্যাব স্থাপনের তারিখ ও সাল",
    name: "labEstablishedAt",
    type: "text",
    placeholder: "১২/০৫/২০২৪",
  },
  {
    label: "কম্পিউটার সংখ্যা",
    name: "computerCount",
    type: "number",
    placeholder: "0",
  },
  {
    label: "অন্যান্য সরঞ্জামাদি ও সংখ্যা",
    name: "otherEquipmentCount",
    type: "textarea",
    placeholder: "সরঞ্জামের নাম ও সংখ্যা লিখুন",
  },
  {
    label: "ডিজিটাল ল্যাবসমূহের ক্লাস কার্যক্রম পরিচালিত হচ্ছে কিনা?",
    name: "digitalLabStatus",
    type: "radioWithDetails",
    options: ["হ্যাঁ", "না"],
    placeholder: "বিস্তারিত লিখুন",
  },
  {
    label: "ল্যাব রেনোভেশন/ইন্টেরিয়র ডেকোরেশনের জন্য বরাদ্দ ছিল কি/না? (পরিমাণ)",
    name: "renovationRouteStatus",
    type: "radioWithDetails",
    options: ["হ্যাঁ", "না"],
    placeholder: "পরিমাণ/বিস্তারিত লিখুন",
  },
  {
    label: "ল্যাব ক্লাস রেজিস্টার আছে/নাই (না থাকলে কারণ)",
    name: "labClassRegister",
    type: "radioWithDetails",
    options: ["আছে", "নাই"],
    placeholder: "কারণ/বিস্তারিত লিখুন",
  },
  {
    label: "ল্যাবে ক্যামেরা আছে/নাই (না থাকলে কারণ)",
    name: "labCameraStatus",
    type: "radioWithDetails",
    options: ["আছে", "নাই"],
    placeholder: "কারণ/বিস্তারিত লিখুন",
  },
  {
    label: "ইন্টারনেট কানেকশন আছে/নাই (না থাকলে কারণ)",
    name: "internetConnectionStatus",
    type: "radioWithDetails",
    options: ["আছে", "নাই"],
    placeholder: "কারণ/বিস্তারিত লিখুন",
  },
  {
    label: ictdlOperationLabel,
    name: "sofRoboticsStatus",
    type: "textarea",
    placeholder: "কারণ লিখুন",
  },
  {
    label: "বর্তমান অবস্থা",
    name: "currentStatus",
    type: "textarea",
    placeholder: "বর্তমান অবস্থা লিখুন",
  },
];

const formatReportValue = (field, data) => {
  const value = data[field.name] || "";
  if (field.type !== "radioWithDetails") return value;

  const details = data[`${field.name}Details`];
  return details ? `${value} - ${details}` : value;
};

const InspectionReportForm = ({ onClose, onSubmitted, instituteName, labId, labType = "sof" }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const classReportFields = reportFields.map((field) => (
    field.name === "sofRoboticsStatus"
      ? { ...field, label: labType === "sof" ? sofOperationLabel : ictdlOperationLabel }
      : field
  ));
  const { register, handleSubmit } = useForm({
    defaultValues: {
      instituteAddress: instituteName || "",
      computerCount: 0,
    },
  });

  const onSubmit = async (data) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const computerCount = parseInt(data.computerCount, 10) || 0;
      const reportSummary = classReportFields
        .map((field) => `${field.label}: ${formatReportValue(field, data)}`)
        .join("\n");

      const payload = {
        ...data,
        labId,
        labType,
        computerCount,
        reportSummary,
        reportDetails: data,
      };

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/class-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Report submitted successfully!", {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
        onSubmitted?.({ labId, labType, report: result.data });
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
    <div className="bg-emerald-50 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300 relative border border-emerald-100">
      {submitError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-100 border-2 border-red-400 text-red-800 px-6 py-3 rounded-xl shadow-2xl">
          <p className="font-semibold flex items-center gap-2">
            <HiOutlineX className="w-5 h-5" /> {submitError}
          </p>
        </div>
      )}

      <div className="relative flex items-center justify-between p-5 border-b border-emerald-200 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl shadow-sm">
            <HiOutlineDocumentText className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-emerald-900">
               ক্লাস কার্যক্রম পরিচালনা রিপোর্ট
            </h2>
            <p className="text-emerald-600 text-sm mt-1">
              {instituteName || "শিক্ষা প্রতিষ্ঠানের তথ্য"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="group p-2.5 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-red-200"
          aria-label="Close report form"
        >
          <HiOutlineX className="w-6 h-6 transition-transform group-hover:rotate-90" />
        </button>
      </div>

      <div className="relative flex-1 overflow-y-auto p-4 md:p-6">
        <form id="report-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="overflow-x-auto rounded-xl border border-emerald-200 bg-white shadow-sm">
            <table className="min-w-[1180px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-emerald-100 text-emerald-950">
                  {classReportFields.map((field) => (
                    <th
                      key={field.name}
                      className="w-[180px] border border-emerald-200 px-3 py-3 text-left align-top font-bold leading-6"
                    >
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {classReportFields.map((field) => (
                    <td
                      key={field.name}
                      className="border border-emerald-200 p-2 align-top"
                    >
                      {field.type === "radioWithDetails" ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-3">
                            {field.options.map((option) => (
                              <label
                                key={option}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
                              >
                                <input
                                  {...register(field.name)}
                                  type="radio"
                                  value={option}
                                  className="h-4 w-4 accent-emerald-600"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                          <textarea
                            {...register(`${field.name}Details`)}
                            rows={4}
                            placeholder={field.placeholder}
                            className="h-24 w-full resize-none rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      ) : field.type === "textarea" ? (
                        <textarea
                          {...register(field.name)}
                          rows={5}
                          placeholder={field.placeholder}
                          className="h-32 w-full resize-none rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      ) : (
                        <input
                          {...register(field.name)}
                          type={field.type}
                          min={field.type === "number" ? 0 : undefined}
                          placeholder={field.placeholder}
                          className="w-full rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </form>
      </div>

      <div className="relative p-5 border-t border-emerald-200 bg-white/90 backdrop-blur-xl flex justify-end gap-4">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all font-semibold cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          form="report-form"
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all font-bold flex items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
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

export default InspectionReportForm;
