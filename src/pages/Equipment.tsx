import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, Download, Upload, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ConfirmModal from '../components/ConfirmModal';

export default function Equipment() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', tipe: '', prioritas_sparepart: 'generic' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const canEdit = user.role === 'Super Admin' || user.role === 'Engineer';

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/equipment', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        name: item.name, 
        description: item.description || '',
        tipe: item.tipe || '',
        prioritas_sparepart: item.prioritas_sparepart || 'generic'
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', description: '', tipe: '', prioritas_sparepart: 'generic' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const url = editingItem ? `/api/equipment/${editingItem.id}` : '/api/equipment';
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
        fetchEquipment();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save equipment');
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/equipment/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchEquipment();
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
    } finally {
      setDeleteId(null);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredEquipment.map((item: any) => item.id));
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
      await Promise.all(selectedIds.map(id => fetch(`/api/equipment/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })));
      fetchEquipment();
      setSelectedIds([]);
    } catch (error) {
      console.error('Error bulk deleting equipment:', error);
    } finally {
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleExportPDF = () => {
    const itemsToExport = selectedIds.length > 0 ? filteredEquipment.filter((item: any) => selectedIds.includes(item.id)) : filteredEquipment;
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
    doc.text('Master Equipment Report', 14, 32);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 40);

    const tableColumn = ["ID", "Tipe", "Equipment Name", "Prioritas Sparepart", "Description"];
    const tableRows = itemsToExport.map((item: any) => [
      item.id,
      item.tipe || '-',
      item.name || '-',
      item.prioritas_sparepart || '-',
      item.description || '-'
    ]);

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

    doc.save(`IMS_Equipment_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      'Tipe': '',
      'Name (Required)': '',
      'Prioritas Sparepart (critical/generic/non-critical)': 'generic',
      'Description': ''
    }];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const wscols = [
      {wch: 20}, {wch: 30}, {wch: 30}, {wch: 50}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import_Template');
    XLSX.writeFile(wb, 'IMS_Equipment_Import_Template.xlsx');
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

          const payload = {
            name: name,
            tipe: row['Tipe'] || '',
            prioritas_sparepart: row['Prioritas Sparepart (critical/generic/non-critical)'] || 'generic',
            description: row['Description'] || ''
          };

          const response = await fetch('/api/equipment', {
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
        fetchEquipment();
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

  const filteredEquipment = equipment.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-6">Loading equipment...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Master Equipment</h2>
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
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="-ml-1 mr-2 h-4 w-4" />
                Add Equipment
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
        <div className="p-4 border-b border-gray-200">
          <div className="relative rounded-md shadow-sm max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Search equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredEquipment.length} />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioritas Sparepart</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                {canEdit && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEquipment.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={selectedIds.includes(item.id)} onChange={() => handleSelect(item.id)} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tipe || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.prioritas_sparepart === 'critical' ? 'bg-red-100 text-red-800' : 
                      item.prioritas_sparepart === 'non-critical' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.prioritas_sparepart || 'generic'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredEquipment.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">No equipment found</td>
                </tr>
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
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editingItem ? 'Edit Equipment' : 'Add New Equipment'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipe</label>
                    <input type="text" value={formData.tipe} onChange={e => setFormData({...formData, tipe: e.target.value})} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Equipment Name *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prioritas Sparepart</label>
                    <select value={formData.prioritas_sparepart} onChange={e => setFormData({...formData, prioritas_sparepart: e.target.value})} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2">
                      <option value="critical">Critical</option>
                      <option value="generic">Generic</option>
                      <option value="non-critical">Non-Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">
                      Save
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                      Cancel
                    </button>
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
        title="Delete Equipment"
        message="Are you sure you want to delete this equipment? This action cannot be undone."
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Equipment"
        message={`Are you sure you want to delete ${selectedIds.length} selected equipment? This action cannot be undone.`}
      />
    </div>
  );
}
