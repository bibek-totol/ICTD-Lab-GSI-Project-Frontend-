import React from "react";
import { FaUserAlt, FaLock } from "react-icons/fa";
import { FaRegEye } from "react-icons/fa6";
import { FaRegEyeSlash } from "react-icons/fa6";
import { useContext, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

function StateDefault({
  showPassword,
  setShowPassword,
  loginFormData,
  handleFormFieldChanges,
  handleStateDefault,
}) {
  const { login } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginFormData.email, loginFormData.password);
      toast.success("প্রবেশ সফল হয়েছে!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "প্রবেশ ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    handleFormFieldChanges({
      target: { name: "email", value: "bbibekbhowmick2001@gmail.com" },
    });
    handleFormFieldChanges({
      target: { name: "password", value: "123456aA@" },
    });
  };

  return (
    <>
      {/* Demo Credentials Section */}
      <div className="w-full mb-6 p-4 bg-emerald-900/40 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
        <p className="text-xs text-emerald-300/80 mb-3 font-semibold uppercase tracking-widest">
          📌 ডেমো শংসাপত্র (Demo Credentials)
        </p>
        <div className="space-y-2 text-xs text-emerald-200/90">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">ইমেইল:</span>
            <code className="bg-emerald-950/80 px-2 py-1 rounded border border-emerald-500/20 font-mono text-emerald-300">
              bbibekbhowmick2001@gmail.com
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">পাসওয়ার্ড:</span>
            <code className="bg-emerald-950/80 px-2 py-1 rounded border border-emerald-500/20 font-mono text-emerald-300">
              123456aA@
            </code>
          </div>
        </div>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="w-full mt-3 px-3 py-2 bg-emerald-600/50 hover:bg-emerald-600/70 text-white text-xs font-semibold rounded-lg transition-colors duration-300"
        >
          ডেমো শংসাপত্র দিয়ে পূরণ করুন
        </button>
      </div>

      {/* Login Card */}
      <form onSubmit={handleLogin} className="w-full h-full">
        <h4 className="text-center text-2xl font-bold text-white mb-8 tracking-wide">
          প্রবেশ করুন
        </h4>

        {/* User ID */}
        <div className="relative mb-6 group">
          <input
            type="text"
            name="email"
            onChange={handleFormFieldChanges}
            value={loginFormData.email}
            required={true}
            placeholder="ইউজার ইমেইল"
            className="w-full bg-emerald-950/50 border border-emerald-500/30 text-white px-5 py-3.5 pr-12 rounded-xl
                         focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 placeholder-emerald-300/60 transition-all duration-300"
          />
          <FaUserAlt className="absolute right-4 top-4 text-emerald-500 group-focus-within:text-emerald-300 transition-colors" />
        </div>

        {/* Password */}
        <div className="relative mb-6 group">
          <input
            onChange={handleFormFieldChanges}
            value={loginFormData.password}
            type={showPassword ? "text" : "password"}
            required={true}
            name="password"
            placeholder="পাসওয়ার্ড"
            className="w-full bg-emerald-950/50 border border-emerald-500/30 text-white px-5 py-3.5 pr-12 rounded-xl
                         focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 placeholder-emerald-300/60 transition-all duration-300"
          />

          <span className="absolute right-4 top-4 text-emerald-500 cursor-pointer hover:text-emerald-300 transition-colors">
            {!loginFormData.password.trim().length > 0 ? (
              <FaLock />
            ) : (
              <span
                onClick={() => {
                  setShowPassword((prev) => !prev);
                }}
                className="text-lg"
              >
                {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
              </span>
            )}
          </span>
        </div>

        {/* Remember + Button */}
        <div className="flex items-center justify-between mb-8 text-sm">
          <label className="flex items-center gap-2 text-emerald-200/80 hover:text-white cursor-pointer transition-colors select-none">
            <input
              type="checkbox"
              name="remmember-me"
              className="accent-emerald-500 w-4 h-4 cursor-pointer rounded border-emerald-500/30 bg-emerald-900/50"
            />
            মনে রাখুন
          </label>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-2.5 rounded-xl
                         hover:from-emerald-400 hover:to-green-500 transition-all duration-300 font-semibold shadow-lg shadow-emerald-900/20 transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "অপেক্ষা করুন..." : "প্রবেশ করুন"}
          </button>
        </div>

        {/* Forgot + Register */}
        <div className="flex justify-between items-center border-t border-emerald-500/20 pt-6">
          {/* Forgot */}
          <p className="text-sm text-emerald-300/80 hover:text-emerald-200 hover:underline cursor-pointer transition-colors">
            পাসওয়ার্ড ভুলে গেছেন?
          </p>

          {/* Register */}
          <p
            onClick={handleStateDefault}
            className="text-sm text-emerald-300 font-medium hover:text-white hover:underline cursor-pointer transition-colors"
          >
            নিবন্ধন করুন
          </p>
        </div>
      </form>
    </>
  );
}

export default StateDefault;
