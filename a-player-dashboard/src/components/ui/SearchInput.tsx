import React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
  // Enhanced accessibility props
  ariaDescribedBy?: string;
  required?: boolean;
  autoComplete?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  label,
  id = "search",
  className = "",
  ariaDescribedBy,
  required = false,
  autoComplete = "off"
}) => {
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-secondary-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field pl-10"
          placeholder={placeholder}
          aria-describedby={ariaDescribedBy}
          aria-required={required}
          autoComplete={autoComplete}
          role="searchbox"
          aria-label={label || "Search"}
        />
        <div 
          className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          aria-hidden="true"
        >
          <svg className="h-5 w-5 text-secondary-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {value && (
        <div 
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          Search results will update automatically as you type
        </div>
      )}
    </div>
  );
}; 