export default function PulseDivider({ animate = false, className = "", style }) {
  return (
    <svg
      className={`pulse-divider ${animate ? "pulse-animate" : ""} ${className}`}
      viewBox="0 0 340 20"
      preserveAspectRatio="none"
      style={style}
    >
      <path d="M0 10 H120 L135 10 L145 2 L155 18 L165 10 L180 10 H340" />
    </svg>
  );
}
