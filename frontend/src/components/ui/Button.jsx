import React, { useState } from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'default',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Base styles that apply to all buttons
  const baseStyles = `
    border-2 bg-transparent rounded-[30px_70px] font-bold uppercase tracking-wide
    transition-all duration-300 ease-in-out cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed
    hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,209,102,0.3)]
    active:translate-y-0 active:shadow-[0_2px_6px_rgba(255,209,102,0.2)]
  `;

  // Size variants
  const sizeStyles = {
    small: 'px-4 py-2 text-sm',
    default: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };

  // Color variants with explicit hover states
  const getVariantStyles = () => {
    const variants = {
      primary: {
        border: 'border-accent-yellow',
        text: isHovered ? 'text-primary-orange' : 'text-accent-yellow',
        background: isHovered ? 'bg-accent-yellow' : 'bg-transparent'
      },
      secondary: {
        border: 'border-primary-orange',
        text: isHovered ? 'text-white' : 'text-primary-orange',
        background: isHovered ? 'bg-primary-orange' : 'bg-transparent'
      },
      charcoal: {
        border: 'border-charcoal',
        text: isHovered ? 'text-accent-yellow' : 'text-charcoal',
        background: isHovered ? 'bg-charcoal' : 'bg-transparent'
      },
      white: {
        border: 'border-white',
        text: isHovered ? 'text-charcoal' : 'text-white',
        background: isHovered ? 'bg-white' : 'bg-transparent'
      }
    };
    
    const currentVariant = variants[variant];
    return `${currentVariant.border} ${currentVariant.text} ${currentVariant.background}`;
  };

  const buttonClasses = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${getVariantStyles()}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
