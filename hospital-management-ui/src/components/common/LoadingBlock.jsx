import PulseDivider from "./PulseDivider";

export default function LoadingBlock({ label = "Loading…" }) {
  return (
    <div className="loading-block">
      <PulseDivider animate style={{ maxWidth: 160 }} />
      <span>{label}</span>
    </div>
  );
}
