import { useQuery } from '@tanstack/react-query';
import { FaEnvelope, FaFilePdf, FaPhoneAlt, FaUserTie } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { FaArrowRight } from 'react-icons/fa6';

const API = import.meta.env.VITE_API_BASE_URL;
const EMPLOYEE_PHONE_HREF = '+8801711474175';
const EMPLOYEE_EMAIL = 'project.director@ictdlab.gov.bd';

const fetchNotices = async () => {
  const res = await fetch(`${API}/notices/active`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load notices');
  const json = await res.json();
  if (!json.success || !Array.isArray(json.data)) return [];
  return json.data.map((n) => ({
    id: n.id,
    title: n.title,
    createdAt: n.createdAt,
    date: new Date(n.createdAt).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    file: n.fileUrl,
  }));
};

const Notice = () => {
  const { t } = useTranslation();

  // Helper function to get the correct URL for files
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    // For PDFs, use direct proxy endpoint to display inline
    if (fileUrl.toLowerCase().includes('.pdf')) {
      return `${API}/files/pdf?url=${encodeURIComponent(fileUrl)}`;
    }
    // For images, use direct URL
    return fileUrl;
  };

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['latest-notices'],
    queryFn: fetchNotices,
    staleTime: 1000 * 60 * 5,
  });

  const latestNotices = [...notices]
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
    .slice(0, 4);

  return (
    <section className="relative bg-emerald-50 py-20 overflow-hidden">
      {/* ===== NOTICE SECTION ===== */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-14 bg-white/90 border border-emerald-100 rounded-2xl shadow-xl shadow-emerald-100/60 overflow-hidden">
          <div className="grid md:grid-cols-[220px_1fr]">
            <div className="bg-emerald-900 p-6 flex items-center justify-center">
              <img
                src="/fatema-tul-jannat.png"
                alt={t('employee_photo_alt')}
                className="w-36 h-36 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>

            <div className="p-6 md:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">
                <FaUserTie />
                {t('employee_info_badge')}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-emerald-950">
                {t('employee_name')}
              </h2>
              <p className="text-emerald-700 font-semibold mt-1">{t('employee_designation')}</p>
              <p className="text-emerald-600 mt-1">{t('employee_department')}</p>

              <div className="grid sm:grid-cols-2 gap-3 mt-5">
                <a
                  href={`tel:${EMPLOYEE_PHONE_HREF}`}
                  className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-100 transition"
                >
                  <FaPhoneAlt className="text-emerald-600" />
                  <span>{t('employee_phone')}</span>
                </a>
                <a
                  href={`mailto:${EMPLOYEE_EMAIL}`}
                  className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-100 transition"
                >
                  <FaEnvelope className="text-emerald-600" />
                  <span>{t('employee_email')}</span>
                </a>
              </div>
            </div>
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
            <div className="py-12 text-center text-emerald-600">{t('notice_loading')}</div>
          ) : latestNotices.length === 0 ? (
            <div className="py-12 text-center text-emerald-600">{t('notice_no_data')}</div>
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
                  <p className="text-xs text-emerald-600 mt-1">{notice.date}</p>
                </div>

                {/* Download / View */}
                {notice.file ? (
                  <a
                    href={getFileUrl(notice.file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View notice"
                    className="w-9 h-9 flex items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
                  >
                    <FaFilePdf className="text-xs" />
                  </a>
                ) : (
                  <span
                    className="w-9 h-9 flex items-center justify-center rounded-full text-emerald-200"
                    aria-hidden
                  >
                    —
                  </span>
                )}
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
  );
};

export default Notice;
