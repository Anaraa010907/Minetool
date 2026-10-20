const PATHS = {
  toolbox: "M3 8h18v11H3z M9 8V5h6v3 M3 13h18",
  swap: "M4 8h15 M15 4l4 4-4 4 M20 16H5 M9 12l-4 4 4 4",
  wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z",
  users: "M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6 M16 5a3.5 3.5 0 0 1 0 7 M18 14.5c2 .7 3.5 2.5 3.5 5.5 M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  scan: "M4 8V5a1 1 0 0 1 1-1h3 M16 4h3a1 1 0 0 1 1 1v3 M20 16v3a1 1 0 0 1-1 1h-3 M8 20H5a1 1 0 0 1-1-1v-3 M7 12h10",
  plus: "M12 5v14 M5 12h14",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z M16 16l4.5 4.5",
  x: "M6 6l12 12 M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  chevron: "M9 6l6 6-6 6",
  alert: "M12 4l9 16H3z M12 10v4 M12 17v.5",
};

export default function Icon({ name, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
