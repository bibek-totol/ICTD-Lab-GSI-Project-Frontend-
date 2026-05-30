import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import { FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import heroBg1 from "../../../assets/banner/heroBg1.jpg";
import heroBg2 from "../../../assets/banner/heroBg2.jpg";
import heroBg3 from "../../../assets/banner/heroBg3.jpg";
import { Link } from "react-router";

const SLIDE_DURATION = 4000;

const Banner = () => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  // Dynamic slides configuration using i18n
  const slides = [
    {
      bg: heroBg1,
      tag: t('banner_slide_1_tag'),
      title: t('banner_slide_1_title'),
      desc: t('banner_slide_1_desc'),
      btn1: t('banner_slide_1_btn1'),
      btn2: t('banner_slide_1_btn2'),
      stats: [
        {
          id: 1,
          icon: <HiOutlineOfficeBuilding className="w-6 h-6" />,
          count: t('banner_slide_1_stat1_count'),
          label: t('banner_slide_1_stat1_label'),
        },
        {
          id: 2,
          icon: <HiOutlineUsers className="w-6 h-6" />,
          count: t('banner_slide_1_stat2_count'),
          label: t('banner_slide_1_stat2_label'),
        },
        {
          id: 3,
          icon: <HiOutlineLocationMarker className="w-6 h-6" />,
          count: t('banner_slide_1_stat3_count'),
          label: t('banner_slide_1_stat3_label'),
        },
      ],
    },
    {
      bg: heroBg2,
      tag: t('banner_slide_2_tag'),
      title: t('banner_slide_2_title'),
      desc: t('banner_slide_2_desc'),
      btn1: t('banner_slide_2_btn1'),
      btn2: t('banner_slide_2_btn2'),
      stats: [
        {
          id: 1,
          icon: <HiOutlineOfficeBuilding className="w-6 h-6" />,
          count: t('banner_slide_2_stat1_count'),
          label: t('banner_slide_2_stat1_label'),
        },
        {
          id: 2,
          icon: <HiOutlineUsers className="w-6 h-6" />,
          count: t('banner_slide_2_stat2_count'),
          label: t('banner_slide_2_stat2_label'),
        },
        {
          id: 3,
          icon: <HiOutlineLocationMarker className="w-6 h-6" />,
          count: t('banner_slide_2_stat3_count'),
          label: t('banner_slide_2_stat3_label'),
        },
      ],
    },
    {
      bg: heroBg3,
      tag: t('banner_slide_3_tag'),
      title: t('banner_slide_3_title'),
      desc: t('banner_slide_3_desc'),
      btn1: t('banner_slide_3_btn1'),
      btn2: t('banner_slide_3_btn2'),
      stats: [
        {
          id: 1,
          icon: <HiOutlineOfficeBuilding className="w-6 h-6" />,
          count: t('banner_slide_3_stat1_count'),
          label: t('banner_slide_3_stat1_label'),
        },
        {
          id: 2,
          icon: <HiOutlineUsers className="w-6 h-6" />,
          count: t('banner_slide_3_stat2_count'),
          label: t('banner_slide_3_stat2_label'),
        },
        {
          id: 3,
          icon: <HiOutlineLocationMarker className="w-6 h-6" />,
          count: t('banner_slide_3_stat3_count'),
          label: t('banner_slide_3_stat3_label'),
        },
      ],
    },
  ];

  const resetAuto = () => {
    clearTimeout(timerRef.current);
    setPaused(false);
  };

  const nextSlide = () => {
    resetAuto();
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    resetAuto();
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Auto swipe
  useEffect(() => {
    if (paused) return;

    timerRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION);

    return () => clearTimeout(timerRef.current);
  }, [current, paused, slides.length]);
  
  return (
    <section
      className="relative h-[calc(100vh-4rem)] overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* SLIDE TRACK */}
      <div className="absolute inset-0">
        <motion.div
          className="flex h-full w-full"
          animate={{ x: `-${current * 100}%` }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          drag="x"
          dragMomentum={false}
          onDragStart={() => setPaused(true)}
          onDragEnd={(e, info) => {
            setPaused(false);
            if (info.offset.x < -80) nextSlide();
            else if (info.offset.x > 80) prevSlide();
          }}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className="relative min-w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${s.bg})` }}
            >
              <div className="absolute inset-0 bg-black/35" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* CONTENT */}
      <div className="relative h-full flex items-center px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto z-10">
          <div className="max-w-3xl">
          <div className="max-w-xl sm:max-w-2xl text-center sm:text-left space-y-5">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <span className="inline-flex items-center justify-center sm:justify-start gap-2 text-white text-sm font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                {slides[current].tag}
              </span>

              <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                {slides[current].title}
              </h1>

              <p className="mt-3 text-sm sm:text-base md:text-lg text-white/90">
                {slides[current].desc}
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
                <Link to="/labdetails">
                <button className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors">
                  {slides[current].btn1}
                  <FaArrowRight />
                </button>
                </Link>
               
               {/* <Link to="/labdetails">
                <button className="cursor-pointer bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 shadow-sm transition-colors">
                  {slides[current].btn2}
                </button>
                </Link> */}
              </div>
            </motion.div>

            {/* DOTS */}
            <div className="flex gap-2 pt-6 justify-center sm:justify-start">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? "w-8 bg-white" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
          </div>
        </div>

        {/* NEXT / PREV */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 sm:left-4 sm:right-4 flex justify-between z-30 pointer-events-none">
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="pointer-events-auto flex items-center justify-center text-white opacity-80 hover:opacity-100 transition"
          >
            <FiChevronLeft size={28} />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="pointer-events-auto flex items-center justify-center text-white opacity-80 hover:opacity-100 transition"
          >
            <FiChevronRight size={28} />
          </button>
        </div>

        {/* STATS */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-5xl">
          <div className="bg-white/90 hidden md:block backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-[0_12px_45px_rgba(0,0,0,0.10)] px-4 sm:px-7 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {slides[current].stats.map((stat) => (
                <div
                  key={stat.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-emerald-50 transition-all duration-300 md:justify-center"
                >
                  {/* ICON */}
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
                    <div className="text-emerald-600">{stat.icon}</div>
                  </div>

                  {/* TEXT */}
                  <div className="leading-tight">
                    <h3 className="text-2xl font-extrabold text-emerald-900">
                      {stat.count}
                    </h3>
                    <p className="text-sm text-emerald-700">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
