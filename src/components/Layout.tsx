import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Wrench, 
  Box, 
  Calendar, 
  FileText, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout({ user, setUser }: { user: any, setUser: any }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(user.role === 'Super Admin' ? [{ name: 'User Management', href: '/dashboard/users', icon: Users }] : []),
    { name: 'Equipment', href: '/dashboard/equipment', icon: Settings },
    { name: 'Spareparts', href: '/dashboard/spareparts', icon: Box },
    { name: 'Inventaris Tools', href: '/dashboard/tools', icon: Wrench },
    { name: 'Consumable Parts', href: '/dashboard/consumables', icon: Box },
    { name: 'Jadwal PM', href: '/dashboard/pm', icon: Calendar },
    { name: 'Troubleshooting', href: '/dashboard/troubleshooting', icon: FileText },
    ...(user.role === 'Super Admin' ? [{ name: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText }] : []),
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed md:relative inset-y-0 left-0 z-50 bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col overflow-hidden whitespace-nowrap
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-0 md:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-slate-950">
          <div className="flex items-center gap-2">
            <img 
              src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhByJhlMXqtAbn3GGfI6LGZF3cydDVyOz8Uh6ET14sqyRk-xTWeqNX1T8tfzRNuHMLXT2vqM4_Z9uQJzWRws7lJ4yDSCkYTBBKA_uopZZIcScQ-8QXQY4YK9W3qo9Yx0yFpzMhmnrw7AKdZTepz8eJJLmHpTD2it8Wpefhjwyl7QysIYfOQz0W8jYMLnav7/s320/Logo%20IMS.png" 
              alt="IMS Logo" 
              className="h-8 object-contain bg-white rounded p-0.5"
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-bold tracking-tight">EngLogistics</span>
          </div>
          <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="px-2 space-y-1 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive ? 'bg-slate-800 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center px-4 md:px-6 flex-shrink-0">
          <button 
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 mr-4" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 truncate">
            {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
          </h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
