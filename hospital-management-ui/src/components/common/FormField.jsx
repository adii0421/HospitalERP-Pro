export default function FormField({
  label,
  error,
  hint,
  type = "text",
  as = "input",
  options = [],
  children,
  ...rest
}) {
  return (
    <div className="form-field">
      {label && (
        <label>
          {label}
          {rest.required && <span style={{ color: "var(--color-vital)" }}> *</span>}
        </label>
      )}
      {children ? (
        children
      ) : as === "select" ? (
        <select {...rest}>
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea {...rest} />
      ) : (
        <input type={type} {...rest} />
      )}
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
