import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileDropdownProps {
  className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileSettings = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Get user initials for fallback
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const email = user.email;
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  // Check if user has profile picture (placeholder for future implementation)
  const hasProfilePicture = false; // TODO: Implement profile picture logic
  const profilePictureUrl = null; // TODO: Get from user data

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
          if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        aria-label={`Profile menu for ${user?.email || 'user'}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        id="profile-menu-button"
      >
        {hasProfilePicture && profilePictureUrl ? (
          <img
            src={profilePictureUrl}
            alt={`Profile picture for ${user?.email || 'user'}`}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
            <span className="text-xs font-semibold text-slate-700" aria-hidden="true">
              {getUserInitials()}
            </span>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
          role="menu"
          aria-labelledby="profile-menu-button"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        >
          <div className="py-1">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-lg">
              <p className="text-sm font-medium text-slate-900 truncate" title={user?.email}>
                {user?.email || 'User'}
              </p>
              {user?.jwtRole && (
                <p className="text-xs text-slate-500 mt-1 capitalize">
                  {user.jwtRole.replace('_', ' ')} Role
                </p>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={handleProfileSettings}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleProfileSettings();
                  }
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none flex items-center gap-3 transition-colors"
                role="menuitem"
              >
                <Settings size={16} className="text-slate-400" />
                Profile Settings
              </button>

              <button
                onClick={handleSignOut}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSignOut();
                  }
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none flex items-center gap-3 transition-colors"
                role="menuitem"
              >
                <LogOut size={16} className="text-slate-400" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        {isOpen ? 'Profile menu opened' : ''}
      </div>
    </div>
  );
};
