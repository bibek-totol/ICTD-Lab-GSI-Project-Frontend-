import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FaDownload,
  FaSearch,
  FaSyncAlt,
  FaFilePdf,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

const API = import.meta.env.VITE_API_BASE_URL || "https://ictd-lab-backend.vercel.app/api/v1";

const fetchNotices = async () => {
  const res = await fetch(`${API}/notices/active`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load notices");
  const json = await res.json();
  if (!json.success || !Array.isArray(json.data)) return [];
  return json.data.map((n) => ({
    id: n.id,
    title: n.title,
    date: new Date(n.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
    file: n.fileUrl,
  }));
};

const AllNotice = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);
  const [showToast, setShowToast] = useState(false);

  // Helper function to get the correct URL for files
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    // For PDFs, use direct proxy endpoint to display inline
    if (fileUrl.toLowerCase().includes(".pdf")) {
      return `${API}/files/pdf?url=${encodeURIComponent(fileUrl)}`;
    }
    // For images, use direct URL
    return fileUrl;
  };

  const {
    data: notices = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["notices"],
    queryFn: fetchNotices,
  });

  const filtered = notices.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  const start = (page - 1) * entries;
  const paginated = filtered.slice(start, start + entries);
  const totalPages = Math.ceil(filtered.length / entries);

  const handleReload = async () => {
    setSearch("");
    setEntries(10);
    setPage(1);
    await refetch();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <section className="min-h-screen font-sans relative overflow-hidden bg-white mt-15">
      {/* Footer-like Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/95 via-emerald-50/90 to-emerald-100/85 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Toast */}
        {showToast && (
          <div className="fixed top-24 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl text-sm font-medium z-50 animate-fade-in flex items-center gap-2">
            <FaSyncAlt className="animate-spin" /> {t("notice_refreshed")}
          </div>
        )}

        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            {/* <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mb-2"></div> */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-950 mb-2">
              {t("notice_title")}
            </h1>
            {/* <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto"></div> */}
          </div>
          <p className="text-emerald-700 max-w-2xl mx-auto">
            {t("notice_subtitle")}
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 text-emerald-800">
          <div className="flex items-center gap-2">
            <span>{t("notice_show")}</span>
            <select
              value={entries}
              onChange={(e) => {
                setEntries(Number(e.target.value));
                setPage(1);
              }}
              className="border border-emerald-200 rounded px-2 py-1 text-emerald-900 cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>{t("notice_entries")}</span>
            <button
              onClick={handleReload}
              className="ml-2 p-2 text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded bg-white shadow-sm transition-transform active:scale-95 hover:bg-emerald-50"
            >
              <FaSyncAlt className={isFetching ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm text-emerald-900 bg-white placeholder-emerald-400"
              placeholder={t("notice_search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-100">
          <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
            <thead>
              <tr className="bg-emerald-100/50 border-b border-emerald-200 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <th className="px-4 py-3 text-center w-12">
                  {t("notice_th_sl")}
                </th>
                <th className="px-4 py-3">{t("notice_th_title")}</th>
                <th className="px-4 py-3 w-36">{t("notice_th_date")}</th>
                <th className="px-4 py-3 w-20 text-center">
                  {t("notice_th_action")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-emerald-500">
                    {t('notice_loading')}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-emerald-500">
                    {t("notice_no_data")}
                  </td>
                </tr>
              ) : (
                paginated.map((notice, index) => (
                  <tr
                    key={notice.id}
                    className="hover:bg-emerald-50 transition-colors border-b border-emerald-50/50 last:border-0"
                  >
                    <td className="px-4 py-3 text-center text-emerald-600 font-medium">
                      {start + index + 1}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2 text-emerald-900 font-medium">
                      {notice.file && notice.file.toLowerCase().includes(".pdf") ? (
                        <FaFilePdf className="text-rose-500" />
                      ) : (
                        <FaFilePdf className="text-emerald-500" />
                      )}{" "}
                      {notice.title}
                    </td>
                    <td className="px-4 py-3 text-emerald-600 text-sm">{notice.date}</td>
                    <td className="px-4 py-3 text-center">
                      {notice.file ? (
                        <a
                          href={getFileUrl(notice.file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition shadow-sm bg-white"
                        >
                          <FaFilePdf className="text-sm" />
                        </a>
                      ) : (
                        <span className="text-emerald-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4 text-sm">
          <span className="text-emerald-700">
            {t("notice_showing")} {filtered.length ? start + 1 : 0}{" "}
            {t("notice_to")} {Math.min(start + entries, filtered.length)}{" "}
            {t("notice_of")} {filtered.length} {t("notice_entries")}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 flex items-center border border-emerald-200 rounded text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-50 transition-colors shadow-sm"
            >
              <FaChevronLeft className="text-xs" /> {t("notice_prev")}
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-2 py-1 rounded transition-colors ${page === i + 1
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 border border-emerald-500"
                  : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm"
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 flex items-center border border-emerald-200 rounded text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-50 transition-colors shadow-sm"
            >
              {t("notice_next")} <FaChevronRight className="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AllNotice;
