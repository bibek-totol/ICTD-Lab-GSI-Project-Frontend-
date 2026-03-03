import { useQuery } from "@tanstack/react-query";
import { FaDownload, FaFilePdf } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Marquee from "react-fast-marquee";
import { Link } from "react-router";
import { FaArrowRight } from "react-icons/fa6";



const fetchNotices = async () => {
  const res = await fetch("/notices.json");
  if (!res.ok) throw new Error("Failed to load notices");
  return res.json();
};

const API = import.meta.env.VITE_API_BASE_URL;

const Notice = () => {
  const { t } = useTranslation();

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

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["latest-notices"],
    queryFn: fetchNotices,
    staleTime: 1000 * 60 * 5,
  });

  const latestNotices = [...notices]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);




  return (
    <section className="relative bg-emerald-50 py-20 overflow-hidden">


      {/* ===== NOTICE SECTION ===== */}
      <div className="max-w-5xl mx-auto px-4">

        {/* ===== BEAUTIFUL IMAGE MARQUEE SECTION ===== */}
        <div className="mb-16 -mx-4 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
          {/* Professional Headline */}
          <div className="text-center mb-8 px-4">
            <h2 className="text-3xl md:text-5xl font-bold text-emerald-950 mb-3">
              {t('notice_hero_title')}
            </h2>

            <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 to-green-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="relative w-full">
            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />

            <Marquee pauseOnHover speed={60} gradient={false} className="w-full">
              {[
                'https://ucbd.edu.bd/wp-content/uploads/2025/08/DSC00690.avif',
                'https://ucbd.edu.bd/wp-content/uploads/2025/08/ucbdcc2.avif',
                'https://ucbd.edu.bd/wp-content/uploads/2025/08/DSC02243.avif',
                'https://ucbd.edu.bd/wp-content/uploads/2025/08/ucbdcc1.avif',
                'https://ucbd.edu.bd/wp-content/uploads/2025/08/ucbdcc4.avif',
                'https://ucbd.edu.bd/wp-content/uploads/2025/08/DSC02298.avif'
              ].map((src, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center opacity-0 animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-[600px] h-[400px] flex items-center justify-center">
                    <img
                      src={src}
                      alt={`University Campus ${index + 1}`}
                      className="w-full h-full object-cover rounded-xl opacity-90 hover:opacity-100 transition-all duration-300"
                      onError={(e) => {
                        console.log(`Image failed to load: ${src}`);
                        // Show placeholder instead
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center text-emerald-600 text-2xl font-bold">Campus ${index + 1}</div>`;
                      }}
                    />
                  </div>
                </div>
              ))}
            </Marquee>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12">

          <h2 className="text-3xl md:text-5xl font-bold text-emerald-950 mt-2">
            {t('notice_board_title')}
          </h2>
          <div className="w-24 h-1 bg-emerald-600 mx-auto mt-4 rounded-full" />
        </div>

        {/* Notices */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-emerald-600">
              {t('notice_loading')}
            </div>
          ) : latestNotices.length === 0 ? (
            <div className="py-12 text-center text-emerald-600">
              {t("notice_no_data")}
            </div>
          ) : (
            latestNotices.map((notice) => (
              <div
                key={notice.id}
                className="group flex items-start gap-4 p-5 bg-white border border-emerald-100 rounded-xl hover:border-emerald-300 hover:shadow-md transition"
              >
                {/* Icon */}
                <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-red-50 text-red-600 shrink-0">
                  <FaFilePdf size={18} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-sm md:text-base font-medium text-emerald-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition">
                    {notice.title}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {notice.date}
                  </p>
                </div>

                {/* Download */}
                <a
                  href={getFileUrl(notice.file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View notice"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
                >
                  <FaFilePdf className="text-xs" />
                </a>
              </div>
            ))
          )}
        </div>

        {/* View All */}
        <div className="flex justify-center mt-12">
          <Link
            to="/all-notice"
            className="inline-flex items-center gap-2 px-10 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-300/40 hover:shadow-xl hover:scale-[1.03] transition"
          >
            {t('notice_view_all')}
            <FaArrowRight />
          </Link>
        </div>
      </div>
    </section>
  )
};

export default Notice;