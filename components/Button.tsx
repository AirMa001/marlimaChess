import React, { memo } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = memo(({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-xl font-bold transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variants = {
    primary: "bg-brand-orange hover:bg-orange-600 text-white shadow-lg shadow-brand-orange/20",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20",
    outline: "border-2 border-slate-200 hover:border-brand-orange text-slate-500 hover:text-brand-orange bg-transparent",
    ghost: "bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs uppercase tracking-widest">Processing</span>
        </div>
      ) : children}
    </button>
  );
});

Button.displayName = 'Button';