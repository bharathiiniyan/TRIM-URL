import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, X, Link2, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Sync theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/80 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-primary group">
              <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-all duration-300">
                <Link2 className="h-6 w-6 transform rotate-45 group-hover:rotate-[90deg] transition-transform duration-300" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                TRIM URL
              </span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 px-3  rounded-lg text-sm font-medium transition-all ${
                    isActive('/dashboard')
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="h-4 w-px bg-border"></div>
                <span className="text-sm text-muted-foreground">
                  Hello, <span className="font-semibold text-foreground">{user?.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted text-destructive hover:text-destructive/80 transition-all shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/login') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-primary/25 hover:translate-y-[-1px] active:translate-y-[0]"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </div>

          {/* Mobile Menu Trigger & Theme Toggle */}
          <div className="flex md:hidden items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              aria-label="Open Menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="md:hidden glass border-b border-border px-4 pt-2 pb-4 space-y-3 shadow-lg animate-in slide-in-from-top-4 duration-200">
          {isAuthenticated ? (
            <>
              <div className="px-3 py-2 text-sm border-b border-border">
                Signed in as: <span className="font-semibold text-primary">{user?.username}</span>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-base font-medium transition-all ${
                  isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-base font-medium text-destructive hover:bg-destructive/10 transition-all text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                  isActive('/login') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-medium bg-primary text-primary-foreground text-center shadow-md hover:bg-primary/95 transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
