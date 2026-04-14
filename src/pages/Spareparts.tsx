import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, Image as ImageIcon, Download, Upload, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ConfirmModal from '../components/ConfirmModal';

export default function Spareparts() {
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
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const canEdit = user.role === 'Super Admin' || user.role === 'Engineer';

  const initialForm = {
    nama_sparepart: '', tipe: '', serial_number: '', brand: '', klasifikasi: '',
    equipment_id: '', stok_saat_ini: 0, minimum_stock: 0, kondisi: 'Good', keterangan: '',
    prioritas_sparepart: 'generic'
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const [resItems, resEq] = await Promise.all([
        fetch('/api/spareparts', { headers: { Authorization: `Bearer ${token}` } }),
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
        nama_sparepart: item.nama_sparepart,
        tipe: item.tipe || '',
        serial_number: item.serial_number || '',
        brand: item.brand || '',
        klasifikasi: item.klasifikasi || '',
        equipment_id: item.equipment_id || '',
        stok_saat_ini: item.stok_saat_ini,
        minimum_stock: item.minimum_stock,
        kondisi: item.kondisi || 'Good',
        keterangan: item.keterangan || '',
        prioritas_sparepart: item.prioritas_sparepart || 'generic'
      });
    } else {
      setEditingItem(null);
      setFormData(initialForm);
    }
    setFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const url = editingItem ? `/api/spareparts/${editingItem.id}` : '/api/spareparts';
      const method = editingItem ? 'PUT' : 'POST';
      
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, String(value));
      });
      if (file) {
        data.append('gambar', file);
      }

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: data
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
      const response = await fetch(`/api/spareparts/${deleteId}`, {
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
      await Promise.all(selectedIds.map(id => fetch(`/api/spareparts/${id}`, {
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
    
    const doc = new jsPDF('landscape');
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('IMS - Interskala Medika Solusindo', 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Spareparts Inventory Report', 14, 32);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 40);

    const tableColumn = ["No", "Name", "Serial Number", "Type", "Prioritas", "Brand", "Equipment", "Stock", "Min", "Condition", "Status"];
    const tableRows = itemsToExport.map((item: any, index: number) => [
      index + 1,
      item.nama_sparepart || '-',
      item.serial_number || '-',
      item.tipe || '-',
      item.prioritas_sparepart || '-',
      item.brand || '-',
      item.equipment_name || '-',
      item.stok_saat_ini,
      item.minimum_stock,
      item.kondisi || '-',
      item.restock_status || '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 45 }
    });

    doc.save(`IMS_Spareparts_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      'Name (Required)': '',
      'Serial Number': '',
      'Type': '',
      'Prioritas (critical/generic/non-critical)': 'generic',
      'Brand': '',
      'Classification': '',
      'Equipment Name': '',
      'Current Stock (Required)': 0,
      'Minimum Stock (Required)': 0,
      'Condition (Good/Fair/Poor/Broken)': 'Good',
      'Description': ''
    }];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      {wch: 25}, {wch: 20}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 15}, 
      {wch: 25}, {wch: 25}, {wch: 25}, {wch: 35}, {wch: 30}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import_Template');
    XLSX.writeFile(wb, 'IMS_Spareparts_Import_Template.xlsx');
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
          const name = row['Name (Required)'];
          if (!name) {
            errorCount++;
            continue;
          }

          let eqId = '';
          if (row['Equipment Name']) {
            const eq = equipment.find(e => e.name.toLowerCase() === String(row['Equipment Name']).toLowerCase());
            if (eq) eqId = eq.id;
          }

          const formData = new FormData();
          formData.append('nama_sparepart', name);
          formData.append('serial_number', row['Serial Number'] || '');
          formData.append('tipe', row['Type'] || '');
          formData.append('prioritas_sparepart', row['Prioritas (critical/generic/non-critical)'] || 'generic');
          formData.append('brand', row['Brand'] || '');
          formData.append('klasifikasi', row['Classification'] || '');
          formData.append('equipment_id', eqId);
          formData.append('stok_saat_ini', String(row['Current Stock (Required)'] || 0));
          formData.append('minimum_stock', String(row['Minimum Stock (Required)'] || 0));
          formData.append('kondisi', row['Condition (Good/Fair/Poor/Broken)'] || 'Good');
          formData.append('keterangan', row['Description'] || '');

          const response = await fetch('/api/spareparts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
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
    const matchesSearch = item.nama_sparepart.toLowerCase().includes(search.toLowerCase()) ||
      (item.serial_number && item.serial_number.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filterStatus === 'All' || item.restock_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Sparepart Equipment</h2>
        <div className="flex flex-wrap gap-3">
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
                <Plus className="-ml-1 mr-2 h-4 w-4" /> Add Sparepart
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

      <div className="bg-white shadow rounded-lg border border-gray-100">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative rounded-md shadow-sm max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="Search spareparts..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <option value="OK">OK</option>
              <option value="Need Restock">Need Restock</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name & SN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioritas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={selectedIds.includes(item.id)} onChange={() => handleSelect(item.id)} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.gambar ? (
                      <img src={item.gambar} alt={item.nama_sparepart} className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.nama_sparepart}</div>
                    <div className="text-sm text-gray-500">SN: {item.serial_number || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tipe || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.prioritas_sparepart === 'critical' ? 'bg-red-100 text-red-800' : 
                      item.prioritas_sparepart === 'non-critical' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.prioritas_sparepart || 'generic'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.equipment_name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.stok_saat_ini} / {item.minimum_stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.restock_status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.restock_status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit className="h-5 w-5" /></button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr><td colSpan={canEdit ? 9 : 8} className="px-6 py-4 text-center text-sm text-gray-500">No spareparts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{editingItem ? 'Edit Sparepart' : 'Add Sparepart'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input type="text" required value={formData.nama_sparepart} onChange={e => setFormData({...formData, nama_sparepart: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                      <input type="text" value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <input type="text" value={formData.tipe} onChange={e => setFormData({...formData, tipe: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Prioritas</label>
                      <select value={formData.prioritas_sparepart} onChange={e => setFormData({...formData, prioritas_sparepart: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                        <option value="critical">Critical</option>
                        <option value="generic">Generic</option>
                        <option value="non-critical">Non-Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Brand</label>
                      <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Equipment</label>
                      <select value={formData.equipment_id} onChange={e => setFormData({...formData, equipment_id: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                        <option value="">Select Equipment</option>
                        {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Classification</label>
                      <input type="text" value={formData.klasifikasi} onChange={e => setFormData({...formData, klasifikasi: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Current Stock *</label>
                      <input type="number" required min="0" value={formData.stok_saat_ini} onChange={e => setFormData({...formData, stok_saat_ini: e.target.value ? parseInt(e.target.value) : 0})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Minimum Stock *</label>
                      <input type="number" required min="0" value={formData.minimum_stock} onChange={e => setFormData({...formData, minimum_stock: e.target.value ? parseInt(e.target.value) : 0})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Condition</label>
                      <select value={formData.kondisi} onChange={e => setFormData({...formData, kondisi: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                        <option value="Broken">Broken</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Image</label>
                      <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
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
        title="Delete Sparepart"
        message="Are you sure you want to delete this sparepart? This action cannot be undone."
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Spareparts"
        message={`Are you sure you want to delete ${selectedIds.length} selected spareparts? This action cannot be undone.`}
      />
    </div>
  );
}
