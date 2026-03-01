import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { bangladeshDivisions } from "../../data/bangladeshDivisions";
import { DivisionPath } from "./DivisionPath";
import { useNavigate } from "react-router";

export const BangladeshMap = ({ onHover, divisions }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const displayDivisions = divisions || bangladeshDivisions;
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [hoveredDivision, setHoveredDivision] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.3, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.3, 0.5));
  }, []);

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedDivision(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedDivision(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-transparent overflow-hidden cursor-grab select-none group/map"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Map Controls Overlay */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 opacity-0 group-hover/map:opacity-100 transition-opacity duration-300">
        <button
          onClick={handleZoomIn}
          className="p-3 bg-emerald-950/80 backdrop-blur-md rounded-xl shadow-lg border border-emerald-500/30 text-emerald-100 hover:bg-emerald-500 hover:text-white transition-all duration-300 active:scale-95"
          title="Zoom In"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="p-3 bg-emerald-950/80 backdrop-blur-md rounded-xl shadow-lg border border-emerald-500/30 text-emerald-100 hover:bg-emerald-500 hover:text-white transition-all duration-300 active:scale-95"
          title="Zoom Out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          onClick={handleReset}
          className="p-3 bg-emerald-950/80 backdrop-blur-md rounded-xl shadow-lg border border-emerald-500/30 text-emerald-100 hover:bg-emerald-500 hover:text-white transition-all duration-300 active:scale-95"
          title="Reset View"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
        </button>
      </div>

      {/* SVG Map */}
      <svg
        viewBox="0 0 520 700"
        className="absolute inset-0 w-full h-full drop-shadow-2xl"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isDragging
            ? "none"
            : "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Subtle background glow */}
        <defs>
          <radialGradient
            id="mapGlow"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="260" cy="350" r="400" fill="url(#mapGlow)" />

        {/* Division paths */}
        <g>
          {displayDivisions.map((division) => (
            <DivisionPath
              key={division.id}
              division={division}
              isSelected={selectedDivision?.id === division.id}
              isHovered={hoveredDivision === division.id}
              onMouseEnter={() => {
                setHoveredDivision(division.id);
                onHover?.(division);
              }}
              onMouseLeave={() => {
                setHoveredDivision(null);
                onHover?.(null);
              }}
              onClick={() => {
                setSelectedDivision(division);
                navigate("/labdetails");
              }}
            />
          ))}
        </g>

        {/* Division labels */}
        <g>
          {displayDivisions.map((division) => (
            <text
              key={`label-${division.id}`}
              x={division.labelX}
              y={division.labelY}
              textAnchor="middle"
              fill="white"
              fontSize="11"
              fontWeight="800"
              fontFamily="Inter, system-ui, sans-serif"
              className="pointer-events-none select-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
              style={{
                opacity:
                  hoveredDivision && hoveredDivision !== division.id ? 0.3 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              {t(`division_${division.id}`).toUpperCase()}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};
