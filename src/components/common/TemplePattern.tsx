export const TemplePattern = ({ className = "opacity-10" }: { className?: string }) => {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <svg
        className="h-full w-full object-cover"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="#FFBE32" strokeWidth="1.2" strokeOpacity="0.45">
          {/* Temple Gopuram Tiered Outline */}
          <path d="M600 80 L620 120 L580 120 Z" />
          <path d="M570 120 H630 V160 H570 Z" />
          <path d="M550 160 H650 V210 H550 Z" />
          <path d="M530 210 H670 V270 H530 Z" />
          <path d="M500 270 H700 V340 H500 Z" />
          <path d="M470 340 H730 V420 H470 Z" />
          <path d="M440 420 H760 V510 H440 Z" />
          <path d="M410 510 H790 V620 H410 Z" />

          {/* Gopuram Pillar Columns & Gateway */}
          <path d="M550 510 V620" />
          <path d="M650 510 V620" />
          <path d="M570 620 C570 560 630 560 630 620" />

          {/* Architectural Lattice lines */}
          <line x1="510" y1="280" x2="690" y2="280" strokeDasharray="4 4" />
          <line x1="480" y1="350" x2="720" y2="350" strokeDasharray="4 4" />
          <line x1="450" y1="430" x2="750" y2="430" strokeDasharray="4 4" />
          <line x1="420" y1="520" x2="780" y2="520" strokeDasharray="4 4" />

          {/* Flowing Flame Curves from Jersey */}
          <path d="M380 620 C 380 480, 480 420, 430 300 C 400 380, 360 410, 330 460 C 310 500, 350 570, 380 620 Z" />
          <path d="M820 620 C 820 480, 720 420, 770 300 C 800 380, 840 410, 870 460 C 890 500, 850 570, 820 620 Z" />
        </g>
      </svg>
    </div>
  );
};
