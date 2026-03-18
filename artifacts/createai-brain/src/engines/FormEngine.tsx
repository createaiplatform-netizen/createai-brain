import React, { useState, useCallback, useEffect, useRef } from "react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const BRAND = {
  accent:      "#6366f1",
  accentHover: "#4f46e5",
  accentLight: "#818cf8",
  accentFaint: "rgba(99,102,241,0.10)",
  text:        "#f1f5f9",
  textMuted:   "#94a3b8",
  textFaint:   "#64748b",
  border:      "rgba(255,255,255,0.10)",
  borderFocus: "#6366f1",
  surface:     "rgba(255,255,255,0.04)",
  surfaceHigh: "rgba(255,255,255,0.08)",
  error:       "#f87171",
  errorFaint:  "rgba(248,113,113,0.10)",
  success:     "#34d399",
  successFaint:"rgba(52,211,153,0.10)",
  warning:     "#fbbf24",
};

// ─── Field types ──────────────────────────────────────────────────────────────

export type FieldType =
  | "text" | "email" | "password" | "number" | "url" | "tel"
  | "textarea" | "select" | "multiselect" | "radio" | "checkbox"
  | "toggle" | "date" | "range" | "tags" | "color" | "section"
  | "info" | "hidden" | "code";

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export interface FormField {
  id: string;
  type: FieldType;
  label?: string;
  placeholder?: string;
  description?: string;
  defaultValue?: string | number | boolean | string[];
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  rows?: number;
  options?: SelectOption[];
  validate?: (value: FormValue) => string | undefined;
  icon?: string;
  prefix?: string;
  suffix?: string;
  width?: "full" | "half" | "third" | "auto";
  info?: string;
  dependsOn?: { field: string; value: FormValue | FormValue[] };
  mono?: boolean;
}

export type FormValue = string | number | boolean | string[];

export type FormValues = Record<string, FormValue>;

export interface FormSchema {
  id?: string;
  title?: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  layout?: "single" | "grid";
  compact?: boolean;
}

export interface FormEngineProps {
  schema: FormSchema;
  initialValues?: FormValues;
  onSubmit: (values: FormValues) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
  success?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  submitStyle?: React.CSSProperties;
  autoFocus?: boolean;
}

// ─── Shared input style ───────────────────────────────────────────────────────

function inputBase(focused: boolean, error: boolean, disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box" as const,
    background: disabled ? "rgba(255,255,255,0.02)" : BRAND.surface,
    border: `1px solid ${error ? BRAND.error : focused ? BRAND.borderFocus : BRAND.border}`,
    borderRadius: 8,
    color: disabled ? BRAND.textFaint : BRAND.text,
    fontSize: 14,
    padding: "9px 12px",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxShadow: focused && !error ? `0 0 0 3px ${BRAND.accentFaint}` : undefined,
    cursor: disabled ? "not-allowed" : undefined,
    fontFamily: "inherit",
  };
}

// ─── Field components ─────────────────────────────────────────────────────────

function useFieldFocus() {
  const [focused, setFocused] = useState(false);
  return { focused, onFocus: () => setFocused(true), onBlur: () => setFocused(false) };
}

function TextInput({ field, value, onChange, error, autoFocus }: {
  field: FormField; value: string; onChange: (v: string) => void; error?: string; autoFocus?: boolean;
}) {
  const { focused, onFocus, onBlur } = useFieldFocus();
  const hasError = !!error;
  const disabled = !!field.disabled;
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {field.prefix && (
        <span style={{ position: "absolute", left: 10, color: BRAND.textFaint, fontSize: 13, pointerEvents: "none" }}>
          {field.prefix}
        </span>
      )}
      <input
        type={field.type === "hidden" ? "hidden" : field.type}
        autoFocus={autoFocus}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        min={field.min}
        max={field.max}
        step={field.step}
        readOnly={field.readOnly}
        disabled={disabled}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          ...inputBase(focused, hasError, disabled),
          paddingLeft: field.prefix ? 28 : 12,
          paddingRight: field.suffix ? 28 : 12,
          fontFamily: field.mono ? "'SF Mono', 'Fira Code', monospace" : "inherit",
          fontSize: field.mono ? 12 : 14,
        }}
      />
      {field.suffix && (
        <span style={{ position: "absolute", right: 10, color: BRAND.textFaint, fontSize: 13, pointerEvents: "none" }}>
          {field.suffix}
        </span>
      )}
    </div>
  );
}

function TextareaInput({ field, value, onChange, error }: {
  field: FormField; value: string; onChange: (v: string) => void; error?: string;
}) {
  const { focused, onFocus, onBlur } = useFieldFocus();
  const disabled = !!field.disabled;
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      maxLength={field.maxLength}
      rows={field.rows ?? 4}
      readOnly={field.readOnly}
      disabled={disabled}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        ...inputBase(focused, !!error, disabled),
        resize: "vertical",
        lineHeight: 1.6,
        fontFamily: field.mono ? "'SF Mono', 'Fira Code', monospace" : "inherit",
        fontSize: field.mono ? 12 : 14,
      }}
    />
  );
}

function SelectInput({ field, value, onChange, error }: {
  field: FormField; value: string; onChange: (v: string) => void; error?: string;
}) {
  const { focused, onFocus, onBlur } = useFieldFocus();
  const disabled = !!field.disabled;
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        ...inputBase(focused, !!error, disabled),
        appearance: "none" as const,
        WebkitAppearance: "none" as const,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        paddingRight: 32,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {!value && <option value="">Select…</option>}
      {(field.options ?? []).map(opt => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.icon ? `${opt.icon} ` : ""}{opt.label}
        </option>
      ))}
    </select>
  );
}

function MultiSelectInput({ field, value, onChange, error }: {
  field: FormField; value: string[]; onChange: (v: string[]) => void; error?: string;
}) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {(field.options ?? []).map(opt => {
        const sel = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => !opt.disabled && toggle(opt.value)}
            disabled={opt.disabled}
            style={{
              fontSize: 13,
              padding: "5px 12px",
              borderRadius: 8,
              border: `1px solid ${sel ? BRAND.accent : BRAND.border}`,
              background: sel ? BRAND.accentFaint : BRAND.surface,
              color: sel ? BRAND.accentLight : BRAND.textMuted,
              cursor: opt.disabled ? "not-allowed" : "pointer",
              transition: "all 0.12s",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {opt.icon && <span>{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
      {!!error && <div style={{ width: "100%", fontSize: 12, color: BRAND.error }}>{error}</div>}
    </div>
  );
}

function RadioInput({ field, value, onChange }: {
  field: FormField; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {(field.options ?? []).map(opt => {
        const sel = value === opt.value;
        return (
          <label
            key={opt.value}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              cursor: opt.disabled ? "not-allowed" : "pointer",
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${sel ? BRAND.accent : BRAND.border}`,
              background: sel ? BRAND.accentFaint : "transparent",
              transition: "all 0.12s",
              opacity: opt.disabled ? 0.5 : 1,
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              border: `2px solid ${sel ? BRAND.accent : BRAND.border}`,
              background: sel ? BRAND.accent : "transparent",
              flexShrink: 0, marginTop: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
            </div>
            <input
              type="radio"
              value={opt.value}
              checked={sel}
              disabled={opt.disabled}
              onChange={() => onChange(opt.value)}
              style={{ display: "none" }}
            />
            <div>
              <div style={{ fontSize: 13, color: BRAND.text, fontWeight: sel ? 500 : 400 }}>
                {opt.icon && <span style={{ marginRight: 6 }}>{opt.icon}</span>}{opt.label}
              </div>
              {opt.description && (
                <div style={{ fontSize: 11, color: BRAND.textMuted, marginTop: 2 }}>{opt.description}</div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

function CheckboxInput({ field, value, onChange }: {
  field: FormField; value: boolean; onChange: (v: boolean) => void;
}) {
  const checked = !!value;
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: field.disabled ? "not-allowed" : "pointer", userSelect: "none" }}>
      <div style={{
        width: 18, height: 18, borderRadius: 5,
        border: `2px solid ${checked ? BRAND.accent : BRAND.border}`,
        background: checked ? BRAND.accent : "transparent",
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.12s",
      }}>
        {checked && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={field.disabled}
        onChange={e => onChange(e.target.checked)}
        style={{ display: "none" }}
      />
      <span style={{ fontSize: 14, color: BRAND.text }}>{field.label}</span>
    </label>
  );
}

function ToggleInput({ field, value, onChange }: {
  field: FormField; value: boolean; onChange: (v: boolean) => void;
}) {
  const on = !!value;
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: field.disabled ? "not-allowed" : "pointer", userSelect: "none" }}>
      <div
        onClick={() => !field.disabled && onChange(!on)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: on ? BRAND.accent : BRAND.surfaceHigh,
          position: "relative", flexShrink: 0,
          transition: "background 0.2s",
          cursor: field.disabled ? "not-allowed" : "pointer",
          border: `1px solid ${on ? BRAND.accent : BRAND.border}`,
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: on ? 22 : 3,
          width: 16, height: 16, borderRadius: "50%",
          background: on ? "#fff" : BRAND.textFaint,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
      <span style={{ fontSize: 14, color: BRAND.text }}>{field.label}</span>
    </label>
  );
}

function RangeInput({ field, value, onChange }: {
  field: FormField; value: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <input
        type="range"
        min={field.min ?? 0}
        max={field.max ?? 100}
        step={field.step ?? 1}
        value={value}
        disabled={field.disabled}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: BRAND.accent, cursor: "pointer" }}
      />
      <span style={{
        fontSize: 13, fontWeight: 600, color: BRAND.accentLight,
        minWidth: 36, textAlign: "right",
      }}>
        {value}
        {field.suffix}
      </span>
    </div>
  );
}

function TagsInput({ field, value, onChange, error }: {
  field: FormField; value: string[]; onChange: (v: string[]) => void; error?: string;
}) {
  const [input, setInput] = useState("");
  const { focused, onFocus, onBlur } = useFieldFocus();
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) { onChange([...value, v]); setInput(""); }
  };
  return (
    <div style={{
      ...inputBase(focused, !!error, !!field.disabled),
      display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
      minHeight: 40, padding: "6px 8px",
    }}>
      {value.map((tag, i) => (
        <span key={i} style={{
          fontSize: 12, background: BRAND.accentFaint, color: BRAND.accentLight,
          borderRadius: 6, padding: "2px 8px", display: "flex", alignItems: "center", gap: 5,
        }}>
          {tag}
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
            style={{ background: "none", border: "none", color: BRAND.textFaint, cursor: "pointer", fontSize: 11, padding: 0, lineHeight: 1 }}>
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onFocus={onFocus}
        onBlur={() => { onBlur(); if (input.trim()) add(); }}
        placeholder={value.length === 0 ? (field.placeholder ?? "Add tags…") : ""}
        disabled={field.disabled}
        style={{ flex: 1, minWidth: 80, background: "none", border: "none", outline: "none", color: BRAND.text, fontSize: 13, padding: "2px 4px" }}
      />
    </div>
  );
}

function ColorInput({ field, value, onChange }: {
  field: FormField; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input
        type="color"
        value={value || "#6366f1"}
        onChange={e => onChange(e.target.value)}
        disabled={field.disabled}
        style={{ width: 40, height: 36, padding: 2, border: `1px solid ${BRAND.border}`, borderRadius: 6, background: BRAND.surface, cursor: "pointer" }}
      />
      <span style={{ fontSize: 12, color: BRAND.textMuted, fontFamily: "monospace" }}>{value || "#6366f1"}</span>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function FieldWrapper({ field, error, children }: {
  field: FormField;
  error?: string;
  children: React.ReactNode;
}) {
  if (field.type === "hidden") return <>{children}</>;
  if (field.type === "section") return (
    <div style={{
      gridColumn: "1 / -1",
      paddingTop: 16,
      marginBottom: 4,
      borderTop: `1px solid ${BRAND.border}`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.accentLight, marginBottom: 2 }}>
        {field.icon && <span style={{ marginRight: 6 }}>{field.icon}</span>}
        {field.label}
      </div>
      {field.description && (
        <div style={{ fontSize: 12, color: BRAND.textFaint }}>{field.description}</div>
      )}
    </div>
  );
  if (field.type === "info") return (
    <div style={{
      gridColumn: "1 / -1",
      background: BRAND.accentFaint,
      border: `1px solid rgba(99,102,241,0.2)`,
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 13,
      color: BRAND.textMuted,
      lineHeight: 1.6,
    }}>
      {field.icon && <span style={{ marginRight: 8 }}>{field.icon}</span>}
      {field.description ?? field.label}
    </div>
  );

  const widthStyle: React.CSSProperties =
    field.width === "half"  ? { gridColumn: "span 1" } :
    field.width === "third" ? { gridColumn: "span 1" } :
    field.type === "checkbox" || field.type === "toggle" ? {} :
    { gridColumn: "1 / -1" };

  const showLabel = field.type !== "checkbox" && field.type !== "toggle";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...widthStyle }}>
      {showLabel && field.label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
          {field.icon && <span>{field.icon}</span>}
          {field.label}
          {field.required && <span style={{ color: BRAND.error, fontSize: 11 }}>*</span>}
        </label>
      )}
      {children}
      {field.description && (field.type as string) !== "section" && (
        <div style={{ fontSize: 11, color: BRAND.textFaint, lineHeight: 1.5 }}>{field.description}</div>
      )}
      {error && (
        <div style={{ fontSize: 11, color: BRAND.error, display: "flex", alignItems: "center", gap: 4 }}>
          <span>⚠</span> {error}
        </div>
      )}
      {field.maxLength && field.type === "textarea" && (
        <div style={{ fontSize: 10, color: BRAND.textFaint, textAlign: "right" }}>
          {typeof field.defaultValue === "string" ? (field.defaultValue as string).length : 0} / {field.maxLength}
        </div>
      )}
    </div>
  );
}

// ─── FormEngine ───────────────────────────────────────────────────────────────

function initValues(schema: FormSchema, initial?: FormValues): FormValues {
  const vals: FormValues = {};
  for (const field of schema.fields) {
    if (field.type === "section" || field.type === "info") continue;
    if (initial && field.id in initial) {
      vals[field.id] = initial[field.id];
    } else if (field.defaultValue !== undefined) {
      vals[field.id] = field.defaultValue;
    } else if (field.type === "checkbox" || field.type === "toggle") {
      vals[field.id] = false;
    } else if (field.type === "multiselect" || field.type === "tags") {
      vals[field.id] = [];
    } else if (field.type === "range") {
      vals[field.id] = field.min ?? 0;
    } else if (field.type === "number") {
      vals[field.id] = "";
    } else {
      vals[field.id] = "";
    }
  }
  return vals;
}

function validateForm(schema: FormSchema, values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of schema.fields) {
    if (field.type === "section" || field.type === "info" || field.type === "hidden") continue;
    if (field.disabled) continue;
    const val = values[field.id];
    if (field.required) {
      if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
        errors[field.id] = `${field.label ?? field.id} is required`;
        continue;
      }
    }
    if (field.validate) {
      const msg = field.validate(val);
      if (msg) errors[field.id] = msg;
    }
    if (field.type === "email" && val && typeof val === "string") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errors[field.id] = "Please enter a valid email address";
      }
    }
    if (field.type === "url" && val && typeof val === "string") {
      try { new URL(val); } catch { errors[field.id] = "Please enter a valid URL"; }
    }
    if (field.type === "number" && val !== "" && val !== undefined) {
      const n = Number(val);
      if (isNaN(n)) { errors[field.id] = "Must be a number"; }
      else if (field.min !== undefined && n < field.min) { errors[field.id] = `Minimum value is ${field.min}`; }
      else if (field.max !== undefined && n > field.max) { errors[field.id] = `Maximum value is ${field.max}`; }
    }
  }
  return errors;
}

function isVisible(field: FormField, values: FormValues): boolean {
  if (!field.dependsOn) return true;
  const depVal = values[field.dependsOn.field];
  const expected = field.dependsOn.value;
  if (Array.isArray(expected)) return (expected as FormValue[]).some(v => v === depVal);
  return depVal === expected;
}

export function FormEngine({
  schema,
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  error,
  success,
  disabled = false,
  style,
  submitStyle,
  autoFocus = false,
}: FormEngineProps) {
  const [values, setValues] = useState<FormValues>(() => initValues(schema, initialValues));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const firstFieldRef = useRef(true);

  useEffect(() => {
    setValues(initValues(schema, initialValues));
    setErrors({});
    setTouched({});
  }, [schema.id]);

  const set = useCallback((id: string, val: FormValue) => {
    setValues(prev => ({ ...prev, [id]: val }));
    if (touched[id]) {
      const field = schema.fields.find(f => f.id === id);
      if (!field) return;
      const fieldErrors = validateForm({ ...schema, fields: [field] }, { [id]: val });
      setErrors(prev => ({ ...prev, [id]: fieldErrors[id] ?? "" }));
    }
  }, [schema, touched]);

  const touch = useCallback((id: string) => {
    setTouched(prev => ({ ...prev, [id]: true }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    schema.fields.forEach(f => { allTouched[f.id] = true; });
    setTouched(allTouched);
    const errs = validateForm(schema, values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    await onSubmit(values);
  };

  const handleReset = () => {
    setValues(initValues(schema, initialValues));
    setErrors({});
    setTouched({});
  };

  const visibleFields = schema.fields.filter(f => isVisible(f, values));
  const isGrid = schema.layout === "grid";

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 0, ...style }}>
      {schema.title && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: BRAND.text }}>{schema.title}</div>
          {schema.description && (
            <div style={{ fontSize: 13, color: BRAND.textMuted, marginTop: 4, lineHeight: 1.5 }}>{schema.description}</div>
          )}
        </div>
      )}

      <div style={{
        display: isGrid ? "grid" : "flex",
        flexDirection: isGrid ? undefined : "column",
        gridTemplateColumns: isGrid ? "repeat(2, 1fr)" : undefined,
        gap: schema.compact ? 12 : 18,
      }}>
        {visibleFields.map((field, i) => {
          const val = values[field.id];
          const err = touched[field.id] ? errors[field.id] : undefined;
          const isFirst = firstFieldRef.current && autoFocus && field.type !== "section" && field.type !== "info";
          if (isFirst) firstFieldRef.current = false;

          let input: React.ReactNode = null;
          const isDisabled = disabled || !!field.disabled;
          const fieldWithDisabled = { ...field, disabled: isDisabled };

          switch (field.type) {
            case "section":
            case "info":
              input = null; break;
            case "textarea":
              input = <TextareaInput field={fieldWithDisabled} value={val as string} onChange={v => { set(field.id, v); }} error={err} />; break;
            case "select":
              input = <SelectInput field={fieldWithDisabled} value={val as string} onChange={v => { set(field.id, v); touch(field.id); }} error={err} />; break;
            case "multiselect":
              input = <MultiSelectInput field={fieldWithDisabled} value={val as string[]} onChange={v => { set(field.id, v); touch(field.id); }} error={err} />; break;
            case "radio":
              input = <RadioInput field={fieldWithDisabled} value={val as string} onChange={v => { set(field.id, v); touch(field.id); }} />; break;
            case "checkbox":
              input = <CheckboxInput field={fieldWithDisabled} value={val as boolean} onChange={v => { set(field.id, v); touch(field.id); }} />; break;
            case "toggle":
              input = <ToggleInput field={fieldWithDisabled} value={val as boolean} onChange={v => { set(field.id, v); touch(field.id); }} />; break;
            case "range":
              input = <RangeInput field={fieldWithDisabled} value={val as number} onChange={v => { set(field.id, v); }} />; break;
            case "tags":
              input = <TagsInput field={fieldWithDisabled} value={val as string[]} onChange={v => { set(field.id, v); touch(field.id); }} error={err} />; break;
            case "color":
              input = <ColorInput field={fieldWithDisabled} value={val as string} onChange={v => { set(field.id, v); }} />; break;
            case "hidden":
              input = <input type="hidden" value={val as string} readOnly />; break;
            default:
              input = <TextInput field={fieldWithDisabled} value={val as string} onChange={v => { set(field.id, v); }} error={err} autoFocus={isFirst} />; break;
          }

          return (
            <FieldWrapper key={field.id} field={field} error={err}>
              <div onBlur={() => touch(field.id)}>
                {input}
              </div>
            </FieldWrapper>
          );
        })}
      </div>

      {error && (
        <div style={{
          marginTop: 14,
          background: BRAND.errorFaint,
          border: `1px solid ${BRAND.error}`,
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 13,
          color: BRAND.error,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span>⚠</span> {error}
        </div>
      )}

      {success && (
        <div style={{
          marginTop: 14,
          background: BRAND.successFaint,
          border: `1px solid ${BRAND.success}`,
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 13,
          color: BRAND.success,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span>✓</span> {success}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
        <button
          type="submit"
          disabled={loading || disabled}
          style={{
            padding: "9px 22px",
            background: loading || disabled ? "rgba(99,102,241,0.4)" : BRAND.accent,
            color: "#fff",
            border: "none",
            borderRadius: 9,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || disabled ? "not-allowed" : "pointer",
            transition: "background 0.15s",
            display: "flex",
            alignItems: "center",
            gap: 8,
            ...submitStyle,
          }}
        >
          {loading && (
            <span style={{
              width: 14, height: 14,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTop: "2px solid #fff",
              borderRadius: "50%",
              animation: "form-spin 0.7s linear infinite",
              display: "inline-block",
            }} />
          )}
          {loading ? "Saving…" : (schema.submitLabel ?? "Submit")}
        </button>

        {schema.showReset && (
          <button
            type="button"
            onClick={handleReset}
            disabled={loading || disabled}
            style={{
              padding: "9px 18px",
              background: "transparent",
              color: BRAND.textMuted,
              border: `1px solid ${BRAND.border}`,
              borderRadius: 9,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {schema.resetLabel ?? "Reset"}
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "9px 18px",
              background: "transparent",
              color: BRAND.textMuted,
              border: "none",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </div>

      <style>{`
        @keyframes form-spin { to { transform: rotate(360deg); } }
        select option { background: #1e1e2e; color: #f1f5f9; }
      `}</style>
    </form>
  );
}

// ─── Convenience hook ─────────────────────────────────────────────────────────

export function useFormValues(schema: FormSchema, initial?: FormValues) {
  const [values, setValues] = useState<FormValues>(() => {
    const v: FormValues = {};
    schema.fields.forEach(f => {
      if (initial && f.id in initial) { v[f.id] = initial[f.id]; return; }
      if (f.defaultValue !== undefined) { v[f.id] = f.defaultValue; return; }
      if (f.type === "checkbox" || f.type === "toggle") v[f.id] = false;
      else if (f.type === "multiselect" || f.type === "tags") v[f.id] = [];
      else if (f.type === "range") v[f.id] = f.min ?? 0;
      else v[f.id] = "";
    });
    return v;
  });
  const set = useCallback((id: string, val: FormValue) => setValues(p => ({ ...p, [id]: val })), []);
  const reset = useCallback(() => setValues(initValues(schema, initial)), [schema, initial]);
  return { values, set, reset, setValues };
}

// ─── Quick schema builders ────────────────────────────────────────────────────

export function textField(id: string, label: string, opts?: Partial<FormField>): FormField {
  return { id, type: "text", label, ...opts };
}
export function emailField(id: string, opts?: Partial<FormField>): FormField {
  return { id, type: "email", label: "Email", placeholder: "you@example.com", ...opts };
}
export function textareaField(id: string, label: string, opts?: Partial<FormField>): FormField {
  return { id, type: "textarea", label, rows: 4, ...opts };
}
export function selectField(id: string, label: string, options: SelectOption[], opts?: Partial<FormField>): FormField {
  return { id, type: "select", label, options, ...opts };
}
export function toggleField(id: string, label: string, opts?: Partial<FormField>): FormField {
  return { id, type: "toggle", label, ...opts };
}
export function sectionDivider(label: string, opts?: Partial<FormField>): FormField {
  return { id: `section_${label}`, type: "section", label, ...opts };
}
export function infoField(id: string, description: string, opts?: Partial<FormField>): FormField {
  return { id, type: "info", description, ...opts };
}
