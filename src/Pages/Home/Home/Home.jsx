import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Banner from '../Banner/Banner';
import Goals from '../Goals/Goals';
import Vendor from '../Vendor/Vendor';
import Contact from '../../Contact/Contact';
import About from '../About/About';
import { BangladeshMap } from '../../../components/BangladeshMap/Mainfile';
import { StatsChart } from '../../../components/BangladeshMap/StatsChart';
import Notice from '../../AllNotice/Notice';
import LatestUpdatesMarquee from '../../../components/sheard/LatestUpdatesMarquee';

import { bangladeshDivisions } from '../../../data/bangladeshDivisions';

const API = import.meta.env.VITE_API_BASE_URL || 'https://ictd-lab-backend.vercel.app/api/v1';

const Home = () => {
  const { t } = useTranslation();
  const [hoveredDivision, setHoveredDivision] = useState(null);
  const [totalStats, setTotalStats] = useState(null);
  const [processedDivisions, setProcessedDivisions] = useState(bangladeshDivisions);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`${API}/data/srd-data`),
          fetch(`${API}/data/srd-data300`),
        ]);
        const ictdlData = await res1.json();
        const combinedData = await res2.json();

        const stats = {};
        const nationalStats = {
          school: { ictdl: 0, sof: 0 },
          college: { ictdl: 0, sof: 0 },
          madrasha: { ictdl: 0, sof: 0 },
          technical: { ictdl: 0, sof: 0 },
          total: { ictdl: 0, sof: 0 },
        };

        const divMap = {
          ঢাকা: 'dhaka',
          চট্টগ্রাম: 'chittagong',
          রাজশাহী: 'rajshahi',
          খুলনা: 'khulna',
          বরিশাল: 'barisal',
          সিলেট: 'sylhet',
          রংপুর: 'rangpur',
          ময়মনসিংহ: 'mymensingh',
          ময়মনসিংহ: 'mymensingh',
        };

        const getCat = (name) => {
          if (!name) return 'school';
          const n = name.toLowerCase();
          if (
            n.includes('মাদ্রাসা') ||
            n.includes('মাদরাসা') ||
            n.includes('madrasha') ||
            n.includes('madrasah')
          )
            return 'madrasha';
          if (n.includes('college') || n.includes('কলেজ')) return 'college';
          if (n.includes('technical') || n.includes('কারিগরি') || n.includes('সফল'))
            return 'technical';
          return 'school';
        };

        const initDiv = () => ({
          school: { ictdl: 0, sof: 0 },
          college: { ictdl: 0, sof: 0 },
          madrasha: { ictdl: 0, sof: 0 },
          technical: { ictdl: 0, sof: 0 },
          total: { ictdl: 0, sof: 0 },
        });

        ictdlData.forEach((item) => {
          const id = divMap[item.division];
          const cat = getCat(item.institute);
          nationalStats[cat].ictdl++;
          nationalStats.total.ictdl++;
          if (id) {
            stats[id] = stats[id] || initDiv();
            stats[id][cat].ictdl++;
            stats[id].total.ictdl++;
          }
        });

        combinedData.forEach((item) => {
          const id = divMap[item.division];
          const cat = getCat(item.institute);
          nationalStats[cat].sof++;
          nationalStats.total.sof++;
          if (id) {
            stats[id] = stats[id] || initDiv();
            stats[id][cat].sof++;
            stats[id].total.sof++;
          }
        });

        const updated = bangladeshDivisions.map((div) => {
          const s = stats[div.id] || initDiv();
          return {
            ...div,
            stats: {
              school: { institutions: s.school.ictdl, labs: s.school.sof },
              college: { institutions: s.college.ictdl, labs: s.college.sof },
              madrasha: { institutions: s.madrasha.ictdl, labs: s.madrasha.sof },
              technical: { institutions: s.technical.ictdl, labs: s.technical.sof },
              total: { institutions: s.total.ictdl, labs: s.total.sof },
            },
          };
        });

        const national = {
          name: 'Bangladesh',
          id: 'bangladesh',
          stats: {
            school: { institutions: nationalStats.school.ictdl, labs: nationalStats.school.sof },
            college: { institutions: nationalStats.college.ictdl, labs: nationalStats.college.sof },
            madrasha: {
              institutions: nationalStats.madrasha.ictdl,
              labs: nationalStats.madrasha.sof,
            },
            technical: {
              institutions: nationalStats.technical.ictdl,
              labs: nationalStats.technical.sof,
            },
            total: { institutions: nationalStats.total.ictdl, labs: nationalStats.total.sof },
          },
        };

        setProcessedDivisions(updated);
        setTotalStats(national);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load map data', err);
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Update hoveredDivision using updated data
  const handleHover = (div) => {
    if (!div) {
      setHoveredDivision(null);
      return;
    }
    const updatedDiv = processedDivisions.find((d) => d.id === div.id);
    setHoveredDivision(updatedDiv);
  };

  return (
    <div>
      <section id="home">
        <Banner />
      </section>

      <section className="bg-emerald-50">
        <LatestUpdatesMarquee />
      </section>

      <section id="notice">
        <Notice />
      </section>

      <section
        id="map-stats"
        className="py-20 bg-emerald-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-emerald-950 mb-4">
              {t('home_map_title')}
            </h2>

            <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mx-auto mb-4"></div>
            <p className="text-lg text-emerald-700 max-w-2xl mx-auto">{t('home_map_desc')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            {/* Left Side: Map */}
            <div className="group bg-white/60 backdrop-blur-sm rounded-3xl border-4 border-emerald-100 shadow-xl overflow-hidden h-[650px] relative transition-all duration-500 hover:shadow-emerald-200/50 hover:border-emerald-200">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent pointer-events-none"></div>
              <BangladeshMap onHover={handleHover} divisions={processedDivisions} />

              {/* Map Overlay Info */}
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-emerald-100 pointer-events-none transition-transform duration-500 group-hover:translate-y-[-5px]">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  {t('home_map_overlay_title')}
                </div>
                <p className="text-xs text-emerald-600">{t('home_map_overlay_desc')}</p>
              </div>
            </div>

            {/* Right Side: Chart */}
            <div className="h-[650px] transition-all duration-500">
              <StatsChart
                division={
                  hoveredDivision ||
                  totalStats ||
                  (processedDivisions && processedDivisions.find((d) => d.id === 'dhaka'))
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-emerald-50 px-4 sm:px-6 lg:px-8" id="goals">
        <Goals />
      </section>

      <section id="about">
        <About />
      </section>

      <section id="vendor">
        <Vendor />
      </section>

      <section id="contact">
        <Contact />
      </section>
    </div>
  );
};

export default Home;
