import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ label, value, onChange, options = [], disabled = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format options array (support string[] or {label, value}[])
  const formattedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { label: opt.label, value: opt.value };
    }
    return { label: String(opt), value: String(opt) };
  });

  const selectedOption = formattedOptions.find((opt) => opt.value === value) || formattedOptions[0];

  return (
    <div ref={containerRef} className={`relative space-y-1.5 font-body ${className}`}>
      {label && (
        <label className="text-[10px] font-extrabold tracking-widest text-primary/45 uppercase block">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-bg-canvas/60 border border-border-light hover:border-primary focus:border-primary focus:bg-white text-xs font-bold text-primary rounded-xl py-3 px-4.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-all duration-200 outline-none disabled:opacity-50"
      >
        <span className="truncate pr-2">{selectedOption?.label || 'Seleccionar...'}</span>
        <ChevronDown
          size={16}
          className="text-primary/40 flex-shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-border-light rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-bg-canvas/50 py-1">
          {formattedOptions.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-4.5 py-3 text-xs font-semibold cursor-pointer hover:bg-bg-canvas transition-colors flex items-center justify-between ${
                opt.value === value ? 'bg-primary/5 text-primary font-black' : 'text-primary/75'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 ml-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
