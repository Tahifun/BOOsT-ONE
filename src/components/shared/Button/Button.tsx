import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant, className }) => {
  const baseClasses = "px-4 py-2 rounded-md font-semibold";
  const variantClasses = variant === "secondary" ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600";

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className || ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;


