export default function BrandMark({ text = 'UG', size = 32 }) {
  return (
    <div
      className="brand-mark"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
      aria-label={text}
    >
      {text}
    </div>
  );
}
