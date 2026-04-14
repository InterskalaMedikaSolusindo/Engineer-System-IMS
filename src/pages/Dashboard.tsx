import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Wrench, 
  Calendar, 
  FileText, 
  Users, 
  AlertTriangle,
  Activity,
  Package,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    
    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full p-6">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="rounded-full h-12 w-12 border-b-2 border-blue-600"
      />
    </div>
  );
  
  if (!stats) return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center shadow-sm"
    >
      <AlertTriangle className="mr-3 h-5 w-5" />
      Failed to load dashboard data. Please check your connection or contact support.
    </motion.div>
  );

  const totalInventory = stats.totalSparepart.count + stats.totalTools.count + stats.totalConsumable.count;

  const kpiCards = [
    { title: 'Total Inventory Items', value: totalInventory, icon: Package, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    { title: 'Low Stock Alerts', value: stats.lowStockSpareparts.length, icon: AlertTriangle, color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600' },
    { title: 'Upcoming PMs', value: stats.upcomingPM.length, icon: Calendar, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
    { title: 'Active Users', value: stats.totalUsers.count, icon: Users, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ];

  const stockData = stats.stockOverview || [];

  const distributionData = [
    { name: 'Spareparts', value: stats.totalSparepart.count },
    { name: 'Tools', value: stats.totalTools.count },
    { name: 'Consumables', value: stats.totalConsumable.count },
  ];
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    try {
      // SQLite CURRENT_TIMESTAMP is in UTC, so append Z if it doesn't have timezone info
      const safeDateString = dateString.includes('Z') ? dateString : dateString.replace(' ', 'T') + 'Z';
      const date = new Date(safeDateString);
      if (isNaN(date.getTime())) return dateString;
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <motion.div 
      className="space-y-6 pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 tracking-tight">
            Overview Dashboard
          </h2>
          <p className="text-slate-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium text-slate-600 shadow-inner">
          <Clock className="h-4 w-4 mr-2 text-blue-500" />
          {currentTime.toLocaleTimeString()}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((item) => (
          <motion.div 
            key={item.title} 
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white overflow-hidden shadow-sm hover:shadow-md rounded-3xl border border-slate-100 transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-4 rounded-2xl ${item.bg} ${item.text} shadow-inner`}>
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-slate-500 truncate">{item.title}</dt>
                    <dd>
                      <div className="text-3xl font-black text-slate-800 mt-1 tracking-tight">{item.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <motion.div variants={itemVariants} className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl p-6 border border-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Inventory Levels vs Minimum</h3>
            <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-600 rounded-full">Top 15 Lowest</span>
          </div>
          <div className="h-72">
            {stockData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} angle={-15} textAnchor="end" height={60} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="current" fill="#3b82f6" name="Current Stock" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="minimum" fill="#f43f5e" name="Minimum Required" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">No inventory data available</div>
            )}
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={itemVariants} className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl p-6 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Inventory Distribution</h3>
          <div className="h-64 flex justify-center items-center">
            {totalInventory > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Legend iconType="circle" verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm font-medium">No inventory data available</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Low Stock Alerts */}
        <motion.div variants={itemVariants} className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl border border-slate-100 flex flex-col h-[400px] overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white z-10">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <div className="p-2 bg-red-50 rounded-xl mr-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              Low Stock Alerts
            </h3>
            <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
              {stats.lowStockSpareparts.length} items
            </span>
          </div>
          <div className="p-0 flex-1 overflow-auto custom-scrollbar">
            {stats.lowStockSpareparts.length > 0 ? (
              <ul className="divide-y divide-slate-50">
                {stats.lowStockSpareparts.map((item: any, idx: number) => (
                  <motion.li 
                    whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
                    key={`${item.category}-${item.id}-${idx}`} 
                    className="p-5 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">{item.category} {item.tipe ? `• ${item.tipe}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                          {item.stok_saat_ini} / {item.minimum_stock}
                        </span>
                        <p className="text-[10px] text-red-500 mt-1.5 font-bold uppercase tracking-wider">Needs Restock</p>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4"
                >
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </motion.div>
                <p className="text-base font-bold text-slate-800">All Stock Levels Good</p>
                <p className="text-sm text-slate-500 mt-1">No items are currently below minimum stock.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming PM */}
        <motion.div variants={itemVariants} className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl border border-slate-100 flex flex-col h-[400px] overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white z-10">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <div className="p-2 bg-amber-50 rounded-xl mr-3">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              Upcoming PM
            </h3>
          </div>
          <div className="p-0 flex-1 overflow-auto custom-scrollbar">
            {stats.upcomingPM.length > 0 ? (
              <ul className="divide-y divide-slate-50">
                {stats.upcomingPM.map((item: any) => (
                  <motion.li 
                    whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
                    key={item.id} 
                    className="p-5 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.hospital_name || 'Unknown Hospital'}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">{item.keterangan || 'No description'}</p>
                      </div>
                      <div className="text-right whitespace-nowrap ml-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          {(() => {
                            if (!item.tanggal_pm) return 'No Date';
                            try {
                              const parts = item.tanggal_pm.split('T')[0].split('-');
                              if (parts.length !== 3) return item.tanggal_pm;
                              const [year, month, day] = parts;
                              return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            } catch (e) {
                              return item.tanggal_pm;
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-base font-bold text-slate-800">No Upcoming PMs</p>
                <p className="text-sm text-slate-500 mt-1">Your maintenance schedule is clear.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl border border-slate-100 flex flex-col h-[400px] overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white z-10">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <div className="p-2 bg-blue-50 rounded-xl mr-3">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              Recent Activity
            </h3>
          </div>
          <div className="p-0 flex-1 overflow-auto custom-scrollbar">
            {stats.recentActivities && stats.recentActivities.length > 0 ? (
              <ul className="divide-y divide-slate-50">
                {stats.recentActivities.map((log: any) => (
                  <motion.li 
                    whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
                    key={log.id} 
                    className="p-5 transition-colors"
                  >
                    <div className="flex space-x-4">
                      <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ${
                        log.action === 'CREATE' ? 'bg-emerald-500 shadow-emerald-200' : 
                        log.action === 'UPDATE' ? 'bg-blue-500 shadow-blue-200' : 
                        log.action === 'DELETE' ? 'bg-red-500 shadow-red-200' : 'bg-slate-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800">
                          <span className="font-bold">{log.user_name || 'System'}</span>
                          {' '}
                          <span className="text-slate-500 font-medium">
                            {log.action === 'CREATE' ? 'added new' : log.action === 'UPDATE' ? 'updated' : log.action === 'DELETE' ? 'deleted' : log.action}
                          </span>
                          {' '}
                          <span className="font-bold text-blue-600">{log.entity}</span>
                        </p>
                        <p className="text-xs font-medium text-slate-400 mt-1.5 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-base font-bold text-slate-800">No Recent Activity</p>
                <p className="text-sm text-slate-500 mt-1">System events will appear here.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Access: Troubleshooting Guides */}
        <motion.div variants={itemVariants} className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl border border-slate-100 flex flex-col h-[400px] overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white z-10">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <div className="p-2 bg-purple-50 rounded-xl mr-3">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
              Latest Guides
            </h3>
          </div>
          <div className="p-0 flex-1 overflow-auto custom-scrollbar">
            {stats.recentTroubleshooting && stats.recentTroubleshooting.length > 0 ? (
              <ul className="divide-y divide-slate-50">
                {stats.recentTroubleshooting.map((guide: any) => (
                  <motion.li 
                    whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
                    key={guide.id} 
                    className="p-5 transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-purple-700 transition-colors">{guide.nama_trouble}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1.5 flex items-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 uppercase tracking-wider mr-2">
                            {guide.equipment_name || 'General'}
                          </span>
                          {formatDate(guide.created_at)}
                        </p>
                      </div>
                      <a 
                        href="/troubleshooting" 
                        className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm"
                        title="View Guide"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </a>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-base font-bold text-slate-800">No Guides Found</p>
                <p className="text-sm text-slate-500 mt-1">Troubleshooting guides will appear here.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
