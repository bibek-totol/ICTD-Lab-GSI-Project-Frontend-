import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiBell,
  FiHome,
  FiLayout,
  FiLogOut,
  FiMenu,
  FiTarget,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Link, useLocation } from "react-router";
import logo from "../../assets/govt.png";
import { AuthContext } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

const Navbar = () => {
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { icon: <FiHome />, label: t("home"), href: "/" },
    { icon: <FiUsers />, label: t("ICTD Labs"), href: "/labs-public" },
    { icon: <FiUsers />, label: t("SOF Labs"), href: "/soflabs-public" },
    { icon: <FiTarget />, label: t("notice"), href: "/all-notice" },
    { icon: <FiBell />, label: t("Lab Details"), href: "/labdetails" },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-emerald-100 fixed w-full z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          to="/"
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

        <div className="hidden lg:flex flex-1 items-center justify-center">
          <nav className="flex items-center space-x-6 bg-emerald-50/80 px-8 py-2 rounded-full border border-emerald-100 backdrop-blur-sm shadow-sm">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`relative px-2 py-1 font-medium transition-all duration-300 ${
                    isActive
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
                to="/dashboard"
                className="cursor-pointer hover:scale-105 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg transition-all duration-300 shadow-lg shadow-emerald-500/20 border border-emerald-500 font-medium tracking-wide flex items-center gap-2"
              >
                <FiLayout size={18} />
                {t("Dashboard")}
              </Link>
              <button
                onClick={logout}
                className="cursor-pointer hover:scale-105 bg-white hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg transition-all duration-300 border border-red-200 font-medium flex items-center gap-2"
                title={t("dashboard_logout")}
              >
                <FiLogOut size={18} />
                <span>{t("dashboard_logout")}</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="cursor-pointer hover:scale-105 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg shadow-red-500/20 border border-red-400 font-medium tracking-wide"
            >
              {t("login")}
            </Link>
          )}
        </div>

        <button
          className="lg:hidden text-emerald-800 text-2xl hover:text-emerald-600 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

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
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
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
              <Link to="/login" onClick={() => setMenuOpen(false)}>
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
    </header>
  );
};

export default Navbar;
