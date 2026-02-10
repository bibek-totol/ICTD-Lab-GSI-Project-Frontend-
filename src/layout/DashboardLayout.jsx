import React, { useState, useContext } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  HiOutlineHome,
  HiOutlineUser,
  HiOutlineDesktopComputer,
  HiOutlineAcademicCap,
  HiOutlineExclamationCircle,
  HiOutlineLockClosed,
  HiOutlineLogout,
  HiMenuAlt3,
  HiX,
  HiChevronDown,
} from "react-icons/hi";
import { FaChartPie, FaBell } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Languages } from "lucide-react";
import lo from "../assets/favicon.png";
import { useLanguage } from "../contexts/LanguageContext";
import { AuthContext } from "../contexts/AuthContext";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobile open/close
  const [isCollapsed, setIsCollapsed] = useState(false); // desktop collapse
  const [openDropdown, setOpenDropdown] = useState(null); // track which dropdown is open
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const { logout } = useContext(AuthContext);

  const closeSidebar = () => setIsSidebarOpen(false);

  const menuItems = [
    {
      path: "/dashboard",
      name: t("Dashboard"),
      icon: <HiOutlineHome className="w-5 h-5" />,
    },
    {
      path: "/dashboard/profile",
      name: t("dashboard_profile"),
      icon: <HiOutlineUser className="w-5 h-5" />,
    },
    {
      path: "/dashboard/changePassword",
      name: t("dashboard_change_password"),
      icon: <HiOutlineLockClosed className="w-5 h-5" />,
    },
    {
      id: "labsControl", // unique identifier for dropdown
      path: null, // No direct path, only dropdown
      name: t("dashboard_labs_control"),
      icon: <HiOutlineDesktopComputer className="w-5 h-5" />,
      hasDropdown: true,
      subItems: [
        {
          path: "/dashboard/labsUnderControl",
          name: "SOF Labs",
        },
        {
          path: "/dashboard/ictdLabs",
          name: "ICTDL Labs",
        },
      ],
    },
    {
      path: "/dashboard/sendReport",
      name: t("dashboard_all_report"),
      icon: <FaChartPie className="w-5 h-5" />,
    },
    {
      path: "/dashboard/complaints",
      name: t("dashboard_complaints"),
      icon: <HiOutlineExclamationCircle className="w-5 h-5" />,
    },
    {
      id: "userManagement", // unique identifier for dropdown
      path: null, // No direct path, only dropdown
      name: t("User Control"),
      icon: <HiOutlineDesktopComputer className="w-5 h-5" />,
      hasDropdown: true,
      subItems: [
        {
          path: "/dashboard/add-user",
          name: t("Add User"),
        },
        {
          path: "/dashboard/manage-user",
          name: t("Manage Users"),
        },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-emerald-50 font-sans overflow-hidden relative">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-200/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[120px]"></div>
      </div>

      {/* mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* sidebar */}
      <motion.aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${isCollapsed ? "w-20" : "w-72"}
          bg-white/90 backdrop-blur-xl border-r border-emerald-100 shadow-2xl
          transform lg:transform-none transition-all duration-300 ease-in-out
          flex flex-col
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* top brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-emerald-100 shrink-0 bg-white/50">
          <Link
            to="/"
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200/50 group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl font-bold text-emerald-950">
                <img src={lo} alt="" />
              </span>
            </div>

            {/* hide title when collapsed */}
            {!isCollapsed && (
              <span className="text-xl font-bold tracking-wide whitespace-nowrap text-emerald-950">
                ICTD Lab
              </span>
            )}
          </Link>

          {/* mobile close */}
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-900 transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* desktop collapse toggle button */}
        <div className="hidden lg:flex justify-end px-3 pt-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`cursor-pointer p-2 ${isCollapsed ? "mx-auto" : ""} rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-900 transition-all border border-emerald-100 hover:border-emerald-200`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-4 px-2">
              {t("dashboard_menu")}
            </div>
          )}

          {menuItems.map((item) => {
            const itemKey = item.id || item.path; // Use id if available, otherwise path
            const isActive =
              item.path === "/dashboard"
                ? location.pathname === "/dashboard"
                : location.pathname === item.path;

            const isDropdownOpen = openDropdown === itemKey;
            const hasActiveSubItem = item.subItems?.some(
              (subItem) => location.pathname === subItem.path
            );

            return (
              <div key={itemKey}>
                {item.hasDropdown ? (
                  // Dropdown menu item
                  <>
                    <button
                      onClick={() =>
                        setOpenDropdown(isDropdownOpen ? null : itemKey)
                      }
                      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden w-full ${isActive || hasActiveSubItem
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 border border-emerald-500"
                        : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-900 border border-transparent hover:border-emerald-100"
                        }`}
                      title={isCollapsed ? item.name : ""}
                    >
                      {(isActive || hasActiveSubItem) && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-emerald-600 rounded-xl -z-10"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}

                      <span
                        className={`relative z-10 text-xl ${isActive || hasActiveSubItem
                          ? "text-white"
                          : "text-emerald-500 group-hover:text-emerald-700"
                          }`}
                      >
                        {item.icon}
                      </span>

                      {!isCollapsed && (
                        <>
                          <span className="relative z-10 font-medium flex-1 text-left">
                            {item.name}
                          </span>
                          <HiChevronDown
                            className={`relative z-10 w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""
                              }`}
                          />
                        </>
                      )}
                    </button>

                    {/* Dropdown submenu */}
                    <AnimatePresence>
                      {isDropdownOpen && !isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-8 mt-1 space-y-1">
                            {item.subItems.map((subItem) => {
                              const isSubActive =
                                location.pathname === subItem.path;
                              return (
                                <Link
                                  key={subItem.path}
                                  to={subItem.path}
                                  onClick={closeSidebar}
                                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${isSubActive
                                    ? "bg-emerald-100 text-emerald-900 font-semibold"
                                    : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-900"
                                    }`}
                                >
                                  <span className="text-sm">{subItem.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  // Regular menu item
                  <Link
                    to={item.path}
                    onClick={closeSidebar}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 border border-emerald-500"
                      : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-900 border border-transparent hover:border-emerald-100"
                      }`}
                    title={isCollapsed ? item.name : ""}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-emerald-600 rounded-xl -z-10"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}

                    <span
                      className={`relative z-10 text-xl ${isActive
                        ? "text-white"
                        : "text-emerald-500 group-hover:text-emerald-700"
                        }`}
                    >
                      {item.icon}
                    </span>

                    {!isCollapsed && (
                      <span className="relative z-10 font-medium">
                        {item.name}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* logout */}
        <div className="p-4 border-t border-emerald-100 shrink-0 bg-white/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 group w-full border border-transparent hover:border-red-100"
            title={isCollapsed ? t("dashboard_logout") : ""}
          >
            <HiOutlineLogout className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            {!isCollapsed && (
              <span className="font-bold">{t("dashboard_logout")}</span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* main */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-emerald-100 flex items-center justify-between px-4 lg:px-8 shadow-sm shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
            >
              <HiMenuAlt3 className="w-6 h-6" />
            </button>

            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-emerald-950 tracking-tight">
                {menuItems.find((item) => item.path === location.pathname)
                  ?.name || t("Dashboard")}
              </h1>
              <span className="text-xs text-emerald-500 font-medium">
                {t("dashboard_welcome")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 transition-all shadow-sm hover:shadow font-medium text-sm"
              title={
                language === "bn"
                  ? "Switch to English"
                  : "বাংলায় পরিবর্তন করুন"
              }
            >
              <Languages className="w-5 h-5" />
              <span className="hidden sm:inline">
                {language === "bn" ? "EN" : "বাংলা"}
              </span>
            </button>

            <button className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all relative">
              <FaBell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-lg shadow-rose-500/50"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-emerald-100">
              <div className="hidden md:block text-right">
                <p className="font-semibold text-emerald-900 text-sm">
                  {t("dashboard_admin_user")}
                </p>
                <p className="text-xs text-emerald-500">admin@ictd.gov.bd</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center text-emerald-700 font-bold shadow-sm ring-2 ring-emerald-50">
                AU
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth p-6 custom-scrollbar">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-8xl mx-auto pb-6 min-h-[calc(100vh-180px)]"
          >
            <Outlet />
          </motion.div>

          <footer className="bg-white/50 backdrop-blur-md border-t border-emerald-100 text-emerald-600 text-center p-4 mt-auto rounded-t-2xl">
            <h1 className="text-sm">
              <span className="font-bold text-emerald-700">
                {t("dashboard_copyright")}{" "}
              </span>
              ©{new Date().getFullYear()}{" "}
              <span className=" text-emerald-700 font-bold">DoICT</span> .{" "}
              {t("dashboard_all_rights")}.
            </h1>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
