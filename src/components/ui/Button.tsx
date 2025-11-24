import React from 'react';
import { cn } from '../../libs/utils.ts';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  ...props
}) => {
  const baseStyles =
    'cursor-pointer px-6 py-2 rounded-full font-medium transition-all duration-200';
  const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-700 shadow-lg',
    outline: 'border border-white text-white hover:bg-white/10',
    ghost: 'text-white hover:text-gray-200',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    />
  );
};

export default Button;
