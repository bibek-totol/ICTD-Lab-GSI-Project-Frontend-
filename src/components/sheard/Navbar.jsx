import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  FiMenu,
  FiX,
  FiHome,
  FiBell,
  FiTarget,
  FiUsers,
  FiInfo,
  FiLogOut,
  FiLayout,
} from "react-icons/fi";
import logo from "../../assets/govt.png";
import { Link, useLocation } from "react-router";
import { AuthContext } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

const API = import.meta.env.VITE_API_BASE_URL;

const Navbar = () => {
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    // For PDFs, use direct proxy endpoint to display inline
    if (fileUrl.toLowerCase().includes(".pdf")) {
      return `${API}/files/pdf?url=${encodeURIComponent(fileUrl)}`;
    }
    // For images, use direct URL
    return fileUrl;
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get(`${API}/announcements/active`);
        if (res.data.success && res.data.data.length > 0) {
          setAnnouncements(res.data.data);
        } else {
          // Fallback static announcements if none in DB
          setAnnouncements([
            {
              title:
                "📍 বাংলাদেশের ৮টি বিভাগে ৯,০০১+ আইসিটি ল্যাব স্থাপিত হয়েছে",
            },
            { title: "🎓 ৩০,০০০+ শিক্ষার্থী আইসিটি শিক্ষায় উপকৃত হচ্ছেন" },
            {
              title:
                "🗺️ জিওস্পেশিয়াল ডেটা সংগ্রহ ও ভিজুয়ালাইজেশন প্ল্যাটফর্ম",
            },
            {
              title:
                "💻 শিক্ষা প্রতিষ্ঠানে ডিজিটাল রূপান্তর ত্বরান্বিত করা হচ্ছে",
            },
            {
              title: "📊 রিয়েল-টাইম ল্যাব মনিটরিং ও ডেটা ম্যানেজমেন্ট সিস্টেম",
            },
            {
              title:
                "🌐 স্থানীয় উন্নয়ন পরিকল্পনা ও দুর্যোগ ব্যবস্থাপনায় সহায়তা",
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch announcements", err);
        // Fallback
        setAnnouncements([
          {
            title:
              "📍 বাংলাদেশের ৮টি বিভাগে ৯,০০১+ আইসিটি ল্যাব স্থাপিত হয়েছে",
          },
          { title: "🎓 ৩০,০০০+ শিক্ষার্থী আইসিটি শিক্ষায় উপকৃত হচ্ছেন" },
        ]);
      }
    };
    fetchAnnouncements();
  }, []);

  const navItems = [
    { icon: <FiHome />, label: t("home"), href: "/" },
    { icon: <FiUsers />, label: t("ICTDL Labs"), href: "/labs-public" },
    { icon: <FiUsers />, label: t("SOF Labs"), href: "/soflabs-public" },
    { icon: <FiTarget />, label: t("notice"), href: "/all-notice" },
    { icon: <FiBell />, label: t("Lab Details"), href: "/labdetails" },
    // { icon: <FiInfo />, label: t("Dashboard"), href: "/dashboard" },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-emerald-100 fixed w-full z-50 shadow-sm">
      {/* Running Marquee Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 text-emerald-900 py-2.5 overflow-hidden relative border-b border-emerald-100">
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative flex items-center h-8">
          {/* Announcement Icon */}
          <div className="flex-shrink-0 px-4 flex items-center gap-2 bg-white/80 py-1.5 rounded-r-full border border-emerald-200 border-l-0 shadow-sm z-10 h-full">
            <FiBell
              className="text-red-500 animate-pulse flex-shrink-0"
              size={18}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 whitespace-nowrap">
              {t("latest_updates")}
            </span>
          </div>

          {/* Marquee Content */}
          <div className="flex-1 overflow-hidden h-full flex items-center">
            <div
              className={`animate-marquee whitespace-nowrap inline-flex items-center ${announcements.length === 0 ? "opacity-0" : "opacity-100"}`}
            >
              {announcements.map((ann, index) => (
                <span
                  key={`a-${index}`}
                  className="inline-flex items-center mx-6"
                >
                  {ann.fileUrl ? (
                    <a
                      href={getFileUrl(ann.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-emerald-800 hover:text-blue-600 hover:underline inline-flex items-center gap-1.5 whitespace-nowrap transition-colors duration-200 group"
                      title="Click to view attachment"
                    >
                      <span className="inline-block">{ann.title}</span>
                      <FiTarget
                        className="text-blue-500 flex-shrink-0 group-hover:scale-110 transition-transform"
                        size={13}
                      />
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-emerald-800 inline-block whitespace-nowrap">
                      {ann.title}
                    </span>
                  )}
                  <span className="mx-6 text-red-400">●</span>
                </span>
              ))}
              {/* Duplicate for seamless loop */}
              {announcements.map((ann, index) => (
                <span
                  key={`dup-${index}`}
                  className="inline-flex items-center mx-6"
                >
                  {ann.fileUrl ? (
                    <a
                      href={getFileUrl(ann.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-emerald-800 hover:text-blue-600 hover:underline inline-flex items-center gap-1.5 whitespace-nowrap transition-colors duration-200 group"
                      title="Click to view attachment"
                    >
                      <span className="inline-block">{ann.title}</span>
                      <FiTarget
                        className="text-blue-500 flex-shrink-0 group-hover:scale-110 transition-transform"
                        size={13}
                      />
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-emerald-800 inline-block whitespace-nowrap">
                      {ann.title}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          to={"/"}
          className="cursor-pointer flex items-center space-x-2 group"
        >
          <img
            src={logo}
            alt="ICTD Logo"
            className="w-14 drop-shadow-md group-hover:scale-105 transition-transform duration-300"
          />
          <div>
            <h1 className="text-xl font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors">
              ICTD Lab
            </h1>
            <p className="text-sm text-emerald-600">GIS Platform</p>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <nav className="flex items-center space-x-6 bg-emerald-50/80 px-8 py-2 rounded-full border border-emerald-100 backdrop-blur-sm shadow-sm">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`relative px-2 py-1 font-medium transition-all duration-300 ${isActive
                    ? "text-emerald-800"
                    : "text-emerald-600 hover:text-emerald-900"
                    }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="hidden lg:flex items-center space-x-4">
          <button
            onClick={toggleLanguage}
            className="cursor-pointer hover:scale-105 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 rounded-lg font-medium text-sm transition-all duration-300 border border-emerald-200 shadow-sm"
          >
            {language === "bn" ? "English" : "বাংলা"}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to={"/dashboard"}
                className="cursor-pointer hover:scale-105 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg transition-all duration-300 shadow-lg shadow-emerald-500/20 border border-emerald-500 font-medium tracking-wide flex items-center gap-2"
              >
                <FiLayout size={18} />
                {t("Dashboard")}
              </Link>
              <button
                onClick={logout}
                className="cursor-pointer hover:scale-105 bg-white hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg transition-all duration-300 border border-red-200 font-medium flex items-center gap-2"
                title="Logout"
              >
                <FiLogOut size={18} />
                <span>{t("dashboard_logout")}</span>
              </button>
            </div>
          ) : (
            <Link
              to={"/login"}
              className="cursor-pointer hover:scale-105 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg shadow-red-500/20 border border-red-400 font-medium tracking-wide"
            >
              {t("login")}
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-emerald-800 text-2xl hover:text-emerald-600 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl shadow-xl border-t border-emerald-100 animate-slideDown absolute w-full">
          <nav className="flex flex-col space-y-2 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-2 px-4 py-3 hover:bg-emerald-50 rounded-lg font-medium text-emerald-800 hover:text-emerald-950 transition-all duration-300 border border-transparent hover:border-emerald-100"
                onClick={() => setMenuOpen(false)}
              >
                <span>{item.label}</span>
              </Link>
            ))}

            {user ? (
              <>
                <Link to={"/dashboard"} onClick={() => setMenuOpen(false)}>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg mt-2 transition-all duration-300 shadow-lg border border-emerald-500 flex items-center justify-center gap-2">
                    <FiLayout /> {t("Dashboard")}
                  </button>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-lg mt-2 transition-all duration-300 flex items-center justify-center gap-2 font-bold"
                >
                  <FiLogOut /> {t("dashboard_logout")}
                </button>
              </>
            ) : (
              <Link to={"/login"} onClick={() => setMenuOpen(false)}>
                <button className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg mt-2 transition-all duration-300 shadow-lg border border-red-400">
                  {t("login")}
                </button>
              </Link>
            )}

            <button
              onClick={() => {
                toggleLanguage();
                setMenuOpen(false);
              }}
              className="w-full px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-950 rounded-lg font-medium text-sm mt-2 border border-emerald-200 transition-all"
            >
              {language === "en" ? "বাংলা" : "English"}
            </button>
          </nav>
        </div>
      )}

      {/* Marquee Animation Styles */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-marquee {
          animation: marquee 60s linear infinite;
          display: inline-flex;
          align-items: center;
        }
        
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        
        /* Ensure single line display */
        .animate-marquee * {
          white-space: nowrap !important;
          display: inline-flex;
          align-items: center;
        }
      `}</style>
    </header>
  );
};

export default Navbar;
