import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { FiBell, FiTarget } from 'react-icons/fi';

const API = import.meta.env.VITE_API_BASE_URL;

const LatestUpdatesMarquee = () => {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.toLowerCase().includes('.pdf')) {
      return `${API}/files/pdf?url=${encodeURIComponent(fileUrl)}`;
    }
    return fileUrl;
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get(`${API}/announcements/active`);
        if (res.data.success && res.data.data.length > 0) {
          setAnnouncements(res.data.data);
          return;
        }
      } catch (err) {
        console.error('Failed to fetch announcements', err);
      }

      setAnnouncements([
        { title: t('marquee_fallback_1') },
        { title: t('marquee_fallback_2') },
        { title: t('marquee_fallback_3') },
        { title: t('marquee_fallback_4') },
      ]);
    };

    fetchAnnouncements();
  }, [t]);

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 text-emerald-900 py-2.5 overflow-hidden relative border-y border-emerald-100">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative flex items-center h-8">
        <div className="flex-shrink-0 px-4 flex items-center gap-2 bg-white/80 py-1.5 rounded-r-full border border-emerald-200 border-l-0 shadow-sm z-10 h-full">
          <FiBell className="text-red-500 animate-pulse flex-shrink-0" size={18} />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 whitespace-nowrap">
            {t('latest_updates')}
          </span>
        </div>

        <div className="flex-1 overflow-hidden h-full flex items-center">
          <div
            className={`animate-marquee whitespace-nowrap inline-flex items-center ${announcements.length === 0 ? 'opacity-0' : 'opacity-100'}`}
          >
            {[...announcements, ...announcements].map((ann, index) => (
              <span key={`${ann.title}-${index}`} className="inline-flex items-center mx-6">
                {ann.fileUrl ? (
                  <a
                    href={getFileUrl(ann.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-emerald-800 hover:text-blue-600 hover:underline inline-flex items-center gap-1.5 whitespace-nowrap transition-colors duration-200 group"
                    title={t('marquee_attachment_title')}
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
                <span className="mx-6 text-red-400">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

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

        .animate-marquee * {
          white-space: nowrap !important;
          display: inline-flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default LatestUpdatesMarquee;
