import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Users, Globe, LogIn, UserPlus, LogOut, User, Wrench, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Section = 'community' | 'detection' | 'directory' | 'tools';

interface HeaderProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

const Header: React.FC<HeaderProps> = ({ activeSection, onSectionChange }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const userNavItems = [
    { id: 'detection' as Section, label: 'Detection Engine', icon: Shield, path: '/detection' },
    { id: 'community' as Section, label: 'Community Hub', icon: Users, path: '/community' },
    { id: 'directory' as Section, label: 'Public Directory', icon: Globe, path: '/directory' },
    { id: 'tools' as Section, label: 'Tools', icon: Wrench, path: '/tools' },
  ];

  const navItems = isAdmin ? [] : userNavItems;

  // Handle navigation when clicking on nav items
  const handleNavClick = (section: Section, path: string) => {
    onSectionChange(section);
    navigate(path);
  };

  // Determine active section based on current location
  const getCurrentSection = (): Section => {
    if (location.pathname.startsWith('/community') || location.pathname.startsWith('/create-') || location.pathname.startsWith('/forum')) {
      return 'community';
    } else if (location.pathname.startsWith('/directory')) {
      return 'directory';
    } else if (location.pathname.startsWith('/detection')) {
      return 'detection';
    } else if (location.pathname.startsWith('/tools')) {
      return 'tools';
    }
    return 'detection'; // default
  };

  const currentSection = getCurrentSection();

  return (
    <header className="bg-white shadow-lg border-b-2 border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 p-2 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">PhishGuard</h1>
              <p className="text-xs text-gray-500">Advanced Threat Protection</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {isAdmin ? (
              <button
                onClick={() => navigate('/admin')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/admin'
                    ? 'bg-purple-100 text-purple-700 shadow-md'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </button>
            ) : (
              navItems.map(({ id, label, icon: Icon, path }) => (
                <button
                  key={id}
                  onClick={() => handleNavClick(id, path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentSection === id
                      ? 'bg-blue-100 text-blue-700 shadow-md'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))
            )}
          </nav>

          {/* Desktop Authentication */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isAdmin ? 'bg-purple-50' : 'bg-blue-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-emerald-600'}`}>
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                    {isAdmin && <span className="text-xs font-bold text-purple-600">ADMIN</span>}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/login"
                  className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            <select
              value={currentSection}
              onChange={(e) => {
                const section = e.target.value as Section;
                const navItem = navItems.find(item => item.id === section);
                if (navItem) {
                  handleNavClick(section, navItem.path);
                }
              }}
              className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {navItems.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            
            {/* Mobile Auth Buttons */}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Login"
                >
                  <LogIn className="h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="bg-emerald-100 text-emerald-700 p-2 rounded-lg hover:bg-emerald-200 transition-colors"
                  title="Register"
                >
                  <UserPlus className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;