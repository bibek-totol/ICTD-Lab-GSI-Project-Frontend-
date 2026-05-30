import { BiLeaf, BiLeftArrow, BiRightArrow } from "react-icons/bi";
import { FaUserAlt, FaLock } from "react-icons/fa";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { FaRegEye } from "react-icons/fa6";
import { FaRegEyeSlash } from "react-icons/fa6";

import StateDefault from "./StateDefault";
import StateEnterCode from "./StateEnterCode";
import StateRegistration from "./StateRegistration";
import StateVerifyEmail from "./StateVerifyEmail";
import { LocateOff } from "lucide";
import lo from "../../assets/favicon.png";

const Login = () => {
  const LoginPageStateOptions = [
    "default",
    "verifyEmail",
    "enterCode",
    "registeration",
  ];

  const [showPassword, setShowPassword] = useState(false);
  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
    retypePassword: "",
    code: "",
    pageState: "verifyEmail", // default, verifyEmail, enterCode, registeration
  });

  useEffect(() => {
    const checkPageState =
      localStorage.getItem("LoginPageState") || LoginPageStateOptions[0];
    setLoginFormData((prev) => ({ ...prev, pageState: checkPageState }));
  }, []);

  const handleFormFieldChanges = (e) => {
    const { name, value } = e.target;

    setLoginFormData((prev) => ({
      ...prev,
      [name]: value.trim(),
    }));
  };

  const handleStateDefault = (e) => {
    e.preventDefault();
    setLoginFormData((prev) => ({
      ...prev,
      pageState: LoginPageStateOptions[1],
    }));
    localStorage.setItem("LoginPageState", LoginPageStateOptions[1]);
  };

  const handleStateVerifyEmail = (e) => {
    e.preventDefault();
    setLoginFormData((prev) => ({
      ...prev,
      pageState: LoginPageStateOptions[2],
    }));
    localStorage.setItem("LoginPageState", LoginPageStateOptions[2]);
  };

  const handleStateEnterCode = (e) => {
    e.preventDefault();
    setLoginFormData((prev) => ({
      ...prev,
      pageState: LoginPageStateOptions[3],
    }));
    localStorage.setItem("LoginPageState", LoginPageStateOptions[3]);
  };

  const handleStateRegistration = (e) => {
    e.preventDefault();
    setLoginFormData((prev) => ({
      ...prev,
      pageState: LoginPageStateOptions[0],
    }));
    localStorage.removeItem("LoginPageState");
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-emerald-950 px-4 relative overflow-hidden">
      {/* Premium Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[80%] h-[80%] rounded-full bg-emerald-600/20 blur-[150px] animate-pulse-slow"></div>
        <div className="absolute top-[20%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[150px] animate-pulse-slow delay-1000"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-emerald-950 via-emerald-900/50 to-transparent"></div>
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Logo & Title */}
        <div className="text-center mb-10 transform transition-all hover:scale-105 duration-500">
          <div className="inline-block  mb-4 w-26 h-26">
            <img className="w-full h-full object-contain" src={lo} alt="" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-emerald-200 drop-shadow-sm">
            ICTD LAB
          </h1>
        </div>

        {/* Glass Card */}
        <div className="w-full bg-emerald-900/30 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-emerald-400/20 p-8 md:px-10 md:pt-10 md:pb-4 relative overflow-hidden group">
          {/* Card Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {loginFormData.pageState === "default" && (
            <StateDefault
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loginFormData={loginFormData}
              setLoginFormData={setLoginFormData}
              handleFormFieldChanges={handleFormFieldChanges}
              handleStateDefault={handleStateDefault}
            />
          )}

          {loginFormData.pageState === "verifyEmail" && (
            <StateVerifyEmail
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loginFormData={loginFormData}
              setLoginFormData={setLoginFormData}
              handleFormFieldChanges={handleFormFieldChanges}
              handleStateVerifyEmail={handleStateVerifyEmail}
              LoginPageStateOptions={LoginPageStateOptions}
            />
          )}

          {loginFormData.pageState === "enterCode" && (
            <StateEnterCode
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loginFormData={loginFormData}
              setLoginFormData={setLoginFormData}
              handleFormFieldChanges={handleFormFieldChanges}
              handleStateEnterCode={handleStateEnterCode}
              LoginPageStateOptions={LoginPageStateOptions}
            />
          )}

          {loginFormData.pageState === "registeration" && (
            <StateRegistration
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loginFormData={loginFormData}
              setLoginFormData={setLoginFormData}
              handleFormFieldChanges={handleFormFieldChanges}
              handleStateRegistration={handleStateRegistration}
              LoginPageStateOptions={LoginPageStateOptions}
            />
          )}
        </div>

        

        {/* Footer */}
        <div className="flex justify-center mt-8">
          <Link
            to={"/"}
            className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-900/30 border border-emerald-500/20 text-emerald-200/80 hover:text-white hover:bg-emerald-800/50 hover:border-emerald-400/40 transition-all duration-300 backdrop-blur-sm"
          >
            <BiLeftArrow className="text-emerald-400 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Login;
