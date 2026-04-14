import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, Calendar as CalendarIcon, Download, Upload, FileText, FileSpreadsheet, List, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, addMonths, subMonths } from 'date-fns';
import ConfirmModal from '../components/ConfirmModal';

export default function PM() {
  const [items, setItems] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const canEdit = user.role === 'Super Admin' || user.role === 'Engineer';

  const initialForm = {
    hospital_name: '', tanggal_pm: format(new Date(), 'yyyy-MM-dd'), status: 'Upcoming', keterangan: ''
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const [resItems, resEq] = await Promise.all([
        fetch('/api/pm', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/equipment', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (resItems.ok && resEq.ok) {
        setItems(await resItems.json());
        setEquipment(await resEq.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
      if (item) {
      setEditingItem(item);
      setFormData({
        hospital_name: item.hospital_name || '',
        tanggal_pm: item.tanggal_pm ? item.tanggal_pm.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
        status: item.status || 'Upcoming',
        keterangan: item.keterangan || ''
      });
    } else {
      setEditingItem(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const url = editingItem ? `/api/pm/${editingItem.id}` : '/api/pm';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const resData = await response.json();
        alert(resData.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/pm/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setDeleteId(null);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredItems.map((item: any) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const confirmBulkDelete = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await Promise.all(selectedIds.map(id => fetch(`/api/pm/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })));
      fetchData();
      setSelectedIds([]);
    } catch (error) {
      console.error('Error bulk deleting:', error);
    } finally {
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleExportPDF = () => {
    const itemsToExport = selectedIds.length > 0 ? filteredItems.filter((item: any) => selectedIds.includes(item.id)) : filteredItems;
    if (itemsToExport.length === 0) {
      alert("No data to export");
      return;
    }
    
    const doc = new jsPDF('portrait');
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('IMS - Interskala Medika Solusindo', 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Preventive Maintenance Schedule Report', 14, 32);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 40);

    const tableColumn = ["No", "Date", "Hospital Name", "Status", "Description"];
    const tableRows = itemsToExport.map((item: any, index: number) => {
      let scheduleDate = new Date();
      if (item.tanggal_pm) {
        try {
          const parts = item.tanggal_pm.split('T')[0].split('-');
          if (parts.length === 3) {
            const [year, month, day] = parts;
            scheduleDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        } catch (e) {}
      }
      const isOverdue = scheduleDate < new Date(new Date().setHours(0,0,0,0)) && item.status !== 'Completed';
      const displayStatus = isOverdue ? 'Overdue' : item.status;
      
      return [
        index + 1,
        scheduleDate.toLocaleDateString(),
        item.hospital_name || '-',
        displayStatus || '-',
        item.keterangan || '-'
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 45 }
    });

    doc.save(`IMS_PM_Schedule_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      'Hospital Name (Required)': '',
      'Date (YYYY-MM-DD) (Required)': '',
      'Status (Upcoming/Completed/Overdue)': 'Upcoming',
      'Description': ''
    }];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      {wch: 30}, {wch: 25}, {wch: 35}, {wch: 40}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import_Template');
    XLSX.writeFile(wb, 'IMS_PM_Import_Template.xlsx');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          alert('The Excel file is empty.');
          setLoading(false);
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        const token = sessionStorage.getItem('token');

        for (const row of data as any[]) {
          const hospitalName = row['Hospital Name (Required)'];
          const dateStr = row['Date (YYYY-MM-DD) (Required)'];
          
          if (!hospitalName || !dateStr) {
            errorCount++;
            continue;
          }

          const payload = {
            hospital_name: hospitalName,
            tanggal_pm: dateStr,
            status: row['Status (Upcoming/Completed/Overdue)'] || 'Upcoming',
            keterangan: row['Description'] || ''
          };

          const response = await fetch('/api/pm', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        }

        alert(`Import completed!\nSuccessfully imported: ${successCount} items.\nFailed: ${errorCount} items.`);
        fetchData();
      } catch (error) {
        console.error('Error importing Excel:', error);
        alert('Failed to parse Excel file. Please ensure you are using the correct template.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = (item.hospital_name && item.hospital_name.toLowerCase().includes(search.toLowerCase())) ||
      item.status.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'All' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const daySchedules = filteredItems.filter(item => 
          item.tanggal_pm === format(cloneDay, 'yyyy-MM-dd')
        );

        days.push(
          <div
            className={`min-h-[120px] p-2 border-r border-b border-gray-200 ${
              !isSameMonth(day, monthStart)
                ? "bg-gray-50 text-gray-400"
                : "bg-white"
            }`}
            key={day.toString()}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                {formattedDate}
              </span>
              {canEdit && isSameMonth(day, monthStart) && (
                <button 
                  onClick={() => {
                    setEditingItem(null);
                    setFormData({...initialForm, tanggal_pm: format(cloneDay, 'yyyy-MM-dd')});
                    setIsModalOpen(true);
                  }}
                  className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                  title="Add PM Schedule"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-1.5 overflow-y-auto max-h-[80px] pr-1 custom-scrollbar">
              {daySchedules.map(schedule => {
                let scheduleDate = new Date();
                if (schedule.tanggal_pm) {
                  try {
                    const parts = schedule.tanggal_pm.split('T')[0].split('-');
                    if (parts.length === 3) {
                      const [year, month, day] = parts;
                      scheduleDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    }
                  } catch (e) {}
                }
                const isOverdue = scheduleDate < new Date(new Date().setHours(0,0,0,0)) && schedule.status !== 'Completed';
                const statusColor = schedule.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' : 
                                   isOverdue ? 'bg-red-100 text-red-800 border-red-200' : 'bg-blue-100 text-blue-800 border-blue-200';
                
                return (
                  <div 
                    key={schedule.id}
                    onClick={() => canEdit && handleOpenModal(schedule)}
                    className={`text-xs p-1.5 rounded border ${statusColor} cursor-pointer hover:opacity-80 transition-opacity`}
                    title={`${schedule.hospital_name} - ${schedule.status}`}
                  >
                    <div className="font-semibold truncate">{schedule.hospital_name}</div>
                    <div className="text-[10px] truncate opacity-80">{schedule.status}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 w-48">
              {format(currentDate, "MMMM yyyy")}
            </h3>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-600 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm font-medium rounded hover:bg-white hover:shadow-sm text-gray-700 transition-all"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-600 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-xs text-gray-500 mr-2">
              <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200 mr-1"></span> Upcoming
            </div>
            <div className="flex items-center text-xs text-gray-500 mr-2">
              <span className="w-3 h-3 rounded-full bg-green-100 border border-green-200 mr-1"></span> Completed
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <span className="w-3 h-3 rounded-full bg-red-100 border border-red-200 mr-1"></span> Overdue
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="flex flex-col border-l border-t border-gray-200">
          {rows}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Jadwal Preventive Maintenance</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-gray-100 p-1 rounded-md mr-2">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="h-4 w-4 mr-1.5" /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarIcon className="h-4 w-4 mr-1.5" /> Calendar
            </button>
          </div>

          <button onClick={handleExportPDF} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <FileText className="-ml-1 mr-2 h-4 w-4 text-red-500" /> Export PDF
          </button>
          
          {canEdit && (
            <>
              <div className="relative group">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  <Upload className="-ml-1 mr-2 h-4 w-4 text-green-600" /> Import Excel
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                  <div className="py-1">
                    <button onClick={handleDownloadTemplate} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Download Template
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <Upload className="mr-2 h-4 w-4 text-blue-600" /> Upload Excel File
                    </button>
                  </div>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportExcel} 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
              />
              <button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                <Plus className="-ml-1 mr-2 h-4 w-4" /> Add PM Schedule
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="-ml-1 mr-2 h-4 w-4" />
                  Delete Selected ({selectedIds.length})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {viewMode === 'calendar' ? (
        renderCalendar()
      ) : (
        <div className="bg-white shadow rounded-lg border border-gray-100">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative rounded-md shadow-sm max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input type="text" className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="Search by hospital name or status..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="filterStatus" className="text-sm font-medium text-gray-700">Status:</label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              >
                <option value="All">All Status</option>
                <option value="Upcoming">Upcoming</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredItems.length} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  let scheduleDate = new Date();
                  if (item.tanggal_pm) {
                    try {
                      const parts = item.tanggal_pm.split('T')[0].split('-');
                      if (parts.length === 3) {
                        const [year, month, day] = parts;
                        scheduleDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      }
                    } catch (e) {}
                  }
                  const isOverdue = scheduleDate < new Date(new Date().setHours(0,0,0,0)) && item.status !== 'Completed';
                  const statusColor = item.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                     isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
                  const displayStatus = isOverdue ? 'Overdue' : item.status;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={selectedIds.includes(item.id)} onChange={() => handleSelect(item.id)} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {(() => {
                            if (!item.tanggal_pm) return '-';
                            try {
                              const parts = item.tanggal_pm.split('T')[0].split('-');
                              if (parts.length === 3) {
                                const [year, month, day] = parts;
                                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
                              }
                            } catch (e) {}
                            return item.tanggal_pm;
                          })()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.hospital_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.keterangan || '-'}</td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit className="h-5 w-5" /></button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr><td colSpan={canEdit ? 6 : 5} className="px-6 py-4 text-center text-sm text-gray-500">No schedules found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{editingItem ? 'Edit PM Schedule' : 'Add PM Schedule'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hospital Name *</label>
                    <input type="text" required value={formData.hospital_name} onChange={e => setFormData({...formData, hospital_name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Enter hospital name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date *</label>
                    <input type="date" required value={formData.tanggal_pm} onChange={e => setFormData({...formData, tanggal_pm: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                      <option value="Upcoming">Upcoming</option>
                      <option value="Completed">Completed</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea rows={3} value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Save</button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete PM Schedule"
        message="Are you sure you want to delete this PM schedule? This action cannot be undone."
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected PM Schedules"
        message={`Are you sure you want to delete ${selectedIds.length} selected PM schedules? This action cannot be undone.`}
      />
    </div>
  );
}
