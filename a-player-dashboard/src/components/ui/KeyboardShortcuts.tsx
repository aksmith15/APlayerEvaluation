import React, { useState } from 'react';

interface Shortcut {
  keys: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: 'Alt + B', description: 'Go back' },
  { keys: 'Alt + H', description: 'Go to Employee Selection' },
];

export const KeyboardShortcuts: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-secondary-600 text-white p-2 rounded-full shadow-lg hover:bg-secondary-700 transition-colors z-50"
        title="Show keyboard shortcuts"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-secondary-200 rounded-lg shadow-lg p-4 z-50 max-w-xs">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-secondary-800">Keyboard Shortcuts</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-secondary-400 hover:text-secondary-600"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-secondary-600">{shortcut.description}</span>
            <kbd className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded text-xs font-mono">
              {shortcut.keys}
            </kbd>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-secondary-200">
        <p className="text-xs text-secondary-500">
          Press shortcuts anywhere on the page
        </p>
      </div>
    </div>
  );
}; 