import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyOptional } from '../../contexts/CompanyContext';
import { CompanySwitcher } from '../ui/CompanySwitcher';
import { ProfileDropdown } from '../ui/ProfileDropdown';
import { APP_CONFIG, ROUTES } from '../../constants/config';
import { 
  Home,
  ClipboardList,
  Users
} from 'lucide-react';

interface HeaderProps {
  subNav?: React.ReactNode;
}

interface NavLinkProps {
  to: string;
  icon?: React.ComponentType<any>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, label, active, onClick }) => {
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.href = to;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-current={active ? 'page' : undefined}
      className={`
        relative px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md whitespace-nowrap
        focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2
        ${active 
          ? 'text-slate-900 bg-slate-100 after:absolute after:inset-x-3 after:-bottom-[2px] after:h-[2px] after:bg-slate-900 after:rounded-full' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }
      `}
    >
      {label}
    </button>
  );
};



export const Header: React.FC<HeaderProps> = ({ subNav }) => {
  const { user } = useAuth();
  const companyContext = useCompanyOptional();
  const location = useLocation();
  
  // Extract company context values safely
  const selectedCompanyId = companyContext?.selectedCompanyId;
  const setSelectedCompanyId = companyContext?.setSelectedCompanyId;

  // Role-based visibility
  const isAdmin = user?.jwtRole === 'super_admin' || user?.jwtRole === 'hr_admin';
  const isSuperAdmin = user?.jwtRole === 'super_admin';

  // Determine active route
  const isRouteActive = (route: string) => {
    if (route === ROUTES.EMPLOYEE_SELECTION) {
      return location.pathname === route || location.pathname === '/employees';
    }
    return location.pathname === route || location.pathname.startsWith(route);
  };

  const navItems = [
    {
      to: ROUTES.EMPLOYEE_SELECTION,
      label: 'Home',
      icon: Home,
      visible: true
    },
    {
      to: ROUTES.MY_ASSIGNMENTS,
      label: 'My Assignments',
      icon: ClipboardList,
      visible: true
    },
    {
      to: ROUTES.ASSIGNMENT_MANAGEMENT,
      label: 'Manager Dashboard',
      icon: Users,
      visible: isAdmin
    }
  ].filter(item => item.visible);

  return (
    <>
      {/* Main Header (always visible) */}
      <header 
        className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm shadow-sm"
        role="banner"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6 h-12">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-6 h-full">
            
            {/* Left: App Title */}
            <div className="shrink-0">
              <Link 
                to={ROUTES.EMPLOYEE_SELECTION}
                className="text-base md:text-[17px] font-semibold tracking-tight text-slate-900 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 rounded-sm"
                aria-label="Go to homepage"
              >
                {APP_CONFIG.TITLE}
              </Link>
            </div>

            {/* Center: Primary Navigation */}
            <nav 
              className="min-w-0 flex justify-center items-center gap-1 md:gap-3"
              role="navigation"
              aria-label="Main navigation"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  active={isRouteActive(item.to)}
                />
              ))}
            </nav>

            {/* Right: Company Selector + Profile */}
            <div className="shrink-0 flex items-center gap-2 md:gap-4">
              {/* Company Switcher - Super Admin Only */}
              {isSuperAdmin && companyContext && setSelectedCompanyId && (
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline text-xs text-slate-500 font-medium">Company:</span>
                  <CompanySwitcher 
                    currentCompanyId={selectedCompanyId || undefined}
                    onCompanyChange={setSelectedCompanyId}
                    className="h-9 min-w-0 w-[10rem] md:w-[14rem] max-w-[35vw]"
                  />
                </div>
              )}

              {/* Profile Avatar with Dropdown */}
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Navigation (Manager Dashboard only) */}
      {subNav && (
        <div 
          className="sticky top-12 z-40 border-b bg-white/98 backdrop-blur-sm"
          role="navigation"
          aria-label="Manager Dashboard navigation"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-2">
            {subNav}
          </div>
        </div>
      )}
    </>
  );
};
