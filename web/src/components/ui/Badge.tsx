import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'success';
}

export function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200"
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
