import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectDropdownProps<T = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function SelectDropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  icon,
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  size = 'md',
  fullWidth = true,
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update focused index when dropdown opens or value changes
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, options, value]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && focusedIndex < options.length) {
          const opt = options[focusedIndex];
          if (!opt.disabled) {
            onChange(opt.value);
            setIsOpen(false);
          }
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Size variations
  const sizeStyles = {
    sm: 'py-1.5 px-3 text-xs rounded-xl min-h-[36px]',
    md: 'py-2.5 px-4 text-sm rounded-2xl min-h-[44px]',
    lg: 'py-3.5 px-5 text-base rounded-2xl min-h-[52px]',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${fullWidth ? 'w-full' : ''} ${isOpen ? 'z-50' : 'z-10'} ${className}`}
    >
      {label && (
        <label className="block text-xs font-bold text-[#18342A] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        id={dropdownId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2.5 bg-white border border-[#E8F6EC] text-[#18342A] font-semibold transition-all duration-200 shadow-xs hover:border-[#72C98B] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#72C98B]/50 focus:border-[#176B4D] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          sizeStyles[size]
        } ${isOpen ? 'border-[#176B4D] ring-2 ring-[#72C98B]/30 shadow-md' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {icon && <span className="text-[#176B4D] shrink-0">{icon}</span>}
          {selectedOption?.icon && (
            <span className="text-[#176B4D] shrink-0">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${!selectedOption ? 'text-gray-400 font-normal' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`${iconSizes[size]} text-[#176B4D] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Floating Options Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            aria-labelledby={dropdownId}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`absolute left-0 right-0 mt-2 z-[9999] max-h-60 overflow-auto bg-white rounded-2xl border border-[#E8F6EC] p-1.5 shadow-2xl shadow-[#176B4D]/20 focus:outline-none scrollbar-thin scrollbar-thumb-gray-200 ${menuClassName}`}
          >
            {options.length === 0 ? (
              <li className="px-4 py-3 text-xs text-gray-400 font-medium text-center">
                No options available
              </li>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === value;
                const isFocused = index === focusedIndex;

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        setIsOpen(false);
                      }
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 my-0.5 rounded-xl cursor-pointer text-sm font-medium transition-all duration-150 ${
                      option.disabled ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      isSelected
                        ? 'bg-[#E8F6EC] text-[#176B4D] font-bold shadow-2xs'
                        : isFocused
                        ? 'bg-[#E8F6EC]/70 text-[#176B4D] font-semibold'
                        : 'text-[#18342A] hover:bg-[#E8F6EC]/70 hover:text-[#176B4D]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {option.icon && (
                        <span
                          className={`shrink-0 ${
                            isSelected ? 'text-[#176B4D]' : 'text-gray-400'
                          }`}
                        >
                          {option.icon}
                        </span>
                      )}
                      <div className="truncate">
                        <p className="truncate leading-snug">{option.label}</p>
                        {option.description && (
                          <p className="text-[11px] text-gray-400 font-normal truncate">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#176B4D] shrink-0 font-extrabold" />
                    )}
                  </li>
                );
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
