import React from 'react';
import { useTranslation } from "react-i18next";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList
} from 'recharts';
import { bangladeshDivisions } from '../../data/bangladeshDivisions';
import { FaSchool, FaGraduationCap, FaBook, FaChartBar } from 'react-icons/fa';

export const StatsChart = ({ division }) => {
    const { t } = useTranslation();
    const activeDivision = division || bangladeshDivisions.find(d => d.id === 'dhaka') || bangladeshDivisions[0];

    const data = [
        {
            name: t("chart_school"),
            ictdl: activeDivision.stats.school.institutions,
            sof: activeDivision.stats.school.labs,
            icon: <FaSchool />,
            color: '#10b981'
        },
        {
            name: t("chart_college"),
            ictdl: activeDivision.stats.college.institutions,
            sof: activeDivision.stats.college.labs,
            icon: <FaGraduationCap />,
            color: '#3b82f6'
        },
        {
            name: t("chart_madrasha"),
            ictdl: activeDivision.stats.madrasha.institutions,
            sof: activeDivision.stats.madrasha.labs,
            icon: <FaBook />,
            color: '#f59e0b'
        },
        {
            name: t("chart_total"),
            ictdl: activeDivision.stats.total.institutions,
            sof: activeDivision.stats.total.labs,
            icon: <FaChartBar />,
            color: '#ef4444'
        },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-emerald-950/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-emerald-500/30 animate-in fade-in zoom-in duration-300">
                    <p className="text-sm font-bold text-white mb-2 border-b border-emerald-500/20 pb-1">{label} {t("chart_institutions")}</p>
                    <div className="space-y-1">
                        <p className="text-xs flex items-center justify-between gap-4">
                            <span className="text-emerald-400 font-medium">{t("chart_ictdl_labs")}:</span>
                            <span className="font-bold text-emerald-100">{payload[0].value.toLocaleString()}</span>
                        </p>
                        <p className="text-xs flex items-center justify-between gap-4">
                            <span className="text-rose-400 font-medium">{t("chart_sof_labs")}:</span>
                            <span className="font-bold text-emerald-100">{payload[1].value.toLocaleString()}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full  backdrop-blur-sm p-8 rounded-[2rem] border-4 border-emerald-500/10 shadow-2xl flex flex-col transition-all duration-500 hover:shadow-emerald-500/20 relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-black tracking-tight">
                            {activeDivision.id === 'bangladesh' ? t("country_bangladesh") : t(`division_${activeDivision.id}`)} <span className="text-emerald-400">{activeDivision.id === 'bangladesh' ? t("chart_national") : t("chart_division")}</span>
                        </h2>
                        <p className="text-sm text-emerald-400/80 font-medium">
                            {activeDivision.id === 'bangladesh' ? t("chart_overall_distribution") : t("chart_resource_distribution")}
                        </p>
                    </div>
                    <div className="bg-emerald-500/10 p-3 rounded-2xl">
                        <FaChartBar className="text-emerald-400 text-xl" />
                    </div>
                </div>

                {/* Summary Mini Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 mb-1">{t("chart_ictdl_labs")}</p>
                        <p className="text-xl font-black text-black">{activeDivision.stats.total.institutions.toLocaleString()}</p>
                    </div>
                    <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-rose-400 mb-1">{t("chart_sof_labs")}</p>
                        <p className="text-xl font-black text-black">{activeDivision.stats.total.labs.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="flex-grow relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        barGap={12}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(16, 185, 129, 0.1)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#064e3b', fontSize: 11, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#059669', fontSize: 10 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)', radius: 12 }} />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', fontSize: '11px', fontWeight: 700, color: '#065f46' }}
                        />

                        <Bar
                            dataKey="ictdl"
                            name={t("chart_ictdl_labs")}
                            fill="#34d399"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                            animationDuration={1500}
                        >
                            <LabelList dataKey="ictdl" position="top" style={{ fill: '#059669', fontSize: 10, fontWeight: 800 }} offset={8} />
                        </Bar>

                        <Bar
                            dataKey="sof"
                            name={t("chart_sof_labs")}
                            fill="#fb7185"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                            animationDuration={2000}
                        >
                            <LabelList dataKey="sof" position="top" style={{ fill: '#e11d48', fontSize: 10, fontWeight: 800 }} offset={8} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
