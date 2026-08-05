const BURST_POINTS =
  "300,2.7 338.1,55.4 439.3,11.7 405.1,67.9 523.3,51.4 449.5,89.3 581.4,92.1 430,115 590.7,138.7 452.4,141.2 533.6,181.5 390,155.3 430.9,212.1 339.6,177 300,230.8 261,176 190.8,195.9 216.2,152.5 70.2,180.4 145.2,141.6 56.4,134.9 149.1,115 43.4,94.1 161.5,91.2 69.1,49.2 219.4,78.9 176.7,23.6 262.6,56.5";

const LETTER_FONT_FAMILY = "'Arial Black', Impact, 'Franklin Gothic Bold', sans-serif";

const LETTERS = [
  { char: "P", x: 150, y: 142, rotate: -7 },
  { char: "S", x: 188, y: 134, rotate: 5 },
  { char: "H", x: 242, y: 146, rotate: -4 },
  { char: "A", x: 304, y: 132, rotate: 6 },
  { char: "W", x: 364, y: 148, rotate: -9 },
  { char: "!", x: 422, y: 140, rotate: 8 },
];

export function PshawLogo({ className = "w-64 sm:w-80" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 240" role="img" aria-label="Pshaw!" className={className}>
      <defs>
        <radialGradient id="pshaw-burst-grad" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#ffd23f" />
          <stop offset="70%" stopColor="#ffb703" />
          <stop offset="100%" stopColor="#f2960a" />
        </radialGradient>
        <pattern id="pshaw-halftone" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.6" fill="#17181c" opacity="0.5" />
        </pattern>
        <clipPath id="pshaw-burst-clip">
          <polygon points={BURST_POINTS} />
        </clipPath>
        <g id="pshaw-badge-word">
          {LETTERS.map(({ char, x, y, rotate }) => (
            <text
              key={char}
              x={x}
              y={y}
              transform={`rotate(${rotate} ${x} ${y})`}
              fontFamily={LETTER_FONT_FAMILY}
              fontSize={68}
              fontWeight={900}
            >
              {char}
            </text>
          ))}
        </g>
      </defs>

      <polygon
        points={BURST_POINTS}
        fill="url(#pshaw-burst-grad)"
        stroke="#17181c"
        strokeWidth={9}
        strokeLinejoin="round"
      />
      <polygon
        points={BURST_POINTS}
        fill="url(#pshaw-halftone)"
        clipPath="url(#pshaw-burst-clip)"
        opacity={0.5}
      />

      <use href="#pshaw-badge-word" transform="translate(4,5)" fill="#17181c" />
      <use
        href="#pshaw-badge-word"
        fill="#e8432e"
        stroke="#17181c"
        strokeWidth={2.8}
        strokeLinejoin="round"
        paintOrder="stroke fill"
      />
    </svg>
  );
}
