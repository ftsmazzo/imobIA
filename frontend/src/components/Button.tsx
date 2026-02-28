import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "outlineLight";

const base: React.CSSProperties = {
  padding: "0.6rem 1.2rem",
  fontSize: "1rem",
  fontWeight: 600,
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  transition: "opacity 0.15s, transform 0.1s",
  minHeight: 44,
};

const variants: Record<Variant, React.CSSProperties> = {
  primary: {
    ...base,
    background: "#0f3460",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(15,52,96,0.4)",
  },
  secondary: {
    ...base,
    background: "transparent",
    color: "#0f3460",
    border: "2px solid #0f3460",
  },
  danger: {
    ...base,
    background: "#c0392b",
    color: "#fff",
  },
  outlineLight: {
    ...base,
    background: "transparent",
    color: "#eee",
    border: "2px solid rgba(255,255,255,0.4)",
  },
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: React.ReactNode;
};

export default function Button({ variant = "primary", type = "button", style, disabled, ...rest }: Props) {
  return (
    <button
      type={type}
      style={{
        ...variants[variant],
        ...(disabled ? { opacity: 0.6, cursor: "not-allowed" } : {}),
        ...style,
      }}
      disabled={disabled}
      onMouseDown={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "";
      }}
      {...rest}
    />
  );
}
