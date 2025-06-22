
import React, { useState, ReactNode } from 'react';

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-4 bg-slate-700/30 rounded-lg">
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between p-3 text-left text-slate-200 hover:bg-slate-700/50 rounded-t-lg focus:outline-none transition-colors duration-150"
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center space-x-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="font-medium text-sm sm:text-md">{title}</span>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-slate-400 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div id={`collapsible-content-${title.replace(/\s+/g, '-')}`} className="p-3 border-t border-slate-700 rounded-b-lg">
          {children}
        </div>
      )}
    </div>
  );
};