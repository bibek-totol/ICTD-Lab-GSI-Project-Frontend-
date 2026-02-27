import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FaLock, FaKey, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import UserService from "../../../services/user.service";

const ChangePassWord = () => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await UserService.changePassword({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.success) {
        toast.success(response.message || "Password updated successfully!");
        reset();
      } else {
        toast.error(response.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error(error.response?.data?.message || "An error occurred while updating password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in-up min-h-[80vh] flex items-center justify-center p-4 bg-emerald-50">
      <div className="max-w-lg w-full bg-white backdrop-blur-xl p-8 rounded-2xl shadow-2xl shadow-emerald-100 border border-emerald-100">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-emerald-200 border border-emerald-100">
            <FaLock />
          </div>
          <h1 className="text-3xl font-bold text-emerald-950">
            পাসওয়ার্ড পরিবর্তন করুন
          </h1>
          <p className="text-emerald-600 text-sm mt-3">
            নিরাপত্তার স্বার্থে একটি শক্তিশালী পাসওয়ার্ড ব্যবহার করুন
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mt-3 mx-auto"></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-emerald-800">বর্তমান পাসওয়ার্ড</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400">
                <FaKey />
              </div>
              <input
                type={showCurrentPass ? "text" : "password"}
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none text-emerald-950 placeholder-emerald-300 hover:border-emerald-300"
                placeholder="Enter current password"
                {...register("currentPassword", {
                  required: "Current password is required",
                })}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-400 hover:text-emerald-600 cursor-pointer transition-colors"
              >
                {showCurrentPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-emerald-800">নতুন পাসওয়ার্ড</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400">
                <FaLock />
              </div>
              <input
                type={showNewPass ? "text" : "password"}
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none text-emerald-950 placeholder-emerald-300 hover:border-emerald-300"
                placeholder="Enter new password"
                {...register("newPassword", {
                  required: "New password is required",
                  pattern: {
                    value:
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/,
                    message:
                      "Password must contain uppercase, lowercase, number & special char",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-400 hover:text-emerald-600 cursor-pointer transition-colors"
              >
                {showNewPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {errors.newPassword.message}
              </p>
            )}
            <p className="text-xs text-emerald-500 mt-2">
              Must be at least 6 characters long.
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-emerald-800">পাসওয়ার্ড নিশ্চিত করুন</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400">
                <FaCheckCircle />
              </div>
              <input
                type={showConfirmPass ? "text" : "password"}
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none text-emerald-950 placeholder-emerald-300 hover:border-emerald-300"
                placeholder="Confirm new password"
                {...register("confirmPassword", {
                  required: "Please confirm password",
                  validate: (value) =>
                    value === newPassword || "Passwords do not match",
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-400 hover:text-emerald-600 cursor-pointer transition-colors"
              >
                {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`cursor-pointer w-full font-semibold py-3.5 rounded-xl shadow-lg transition-all transform border border-emerald-100 flex items-center justify-center gap-2 ${loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 text-white hover:shadow-emerald-300 hover:-translate-y-0.5 active:translate-y-0"
              }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassWord;
