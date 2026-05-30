import React from "react";

const CircularLoader = ({ text = "ICTD LAB", fullScreen = true }) => {
  return (
    <div
      className={`flex items-center justify-center bg-emerald-950 ${
        fullScreen ? "min-h-screen w-full" : "min-h-64 w-full rounded-lg"
      }`}
      role="status"
      aria-live="polite"
      aria-label={`${text} loading`}
    >
      <div className="relative flex h-36 w-36 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-800/70" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-300 border-r-emerald-400 animate-spin" />
        <div className="absolute h-28 w-28 rounded-full border border-emerald-500/40 bg-emerald-900/80 shadow-2xl shadow-emerald-950" />
        <span className="relative text-center text-xl font-bold tracking-wide text-white">
          {text}
        </span>
      </div>
    </div>
  );
};

export default CircularLoader;
