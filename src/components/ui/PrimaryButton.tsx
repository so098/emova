import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function PrimaryButton({
  children,
  className = "",
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      className={`h-[2.875rem] rounded-xl bg-point text-sm font-semibold text-on-point transition-opacity hover:opacity-85 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
