import React from "react";
import classNames from "classnames";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}) => {
  const baseClasses = "rounded px-4 py-2 font-semibold transition-colors duration-200";

  const variantClasses: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-700 text-white hover:bg-gray-600 border border-cyan-400",
    ghost: "bg-transparent text-white hover:bg-white/10",
  };

  const sizeClasses: Record<string, string> = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <button
      className={classNames(
        baseClasses,
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
