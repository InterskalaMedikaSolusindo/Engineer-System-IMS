import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, FileText, Download, Upload, ChevronRight, ArrowLeft, Settings, User } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Troubleshooting() {
  const [view, setView] = useState<'equipment' | 'issues' | 'details'>('equipment');
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'engineer' | 'user'>('engineer');

  const [items, setItems] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [issueFiles, setIssueFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isEditEqModalOpen, setIsEditEqModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isEditIssueModalOpen, setIsEditIssueModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<'equipment' | 'issue' | 'file' | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // File Editing & Uploading
  const [editingFileId, setEditingFileId] = useState<number | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [uploadForm, setUploadForm] = useState<{ file: File | null, title: string, role: 'engineer' | 'user' }>({ file: null, title: '', role: 'engineer' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Forms
  const [eqForm, setEqForm] = useState({ name: '', description: '' });
  const [issueForm, setIssueForm] = useState({ nama_trouble: '' });
  const [detailsForm, setDetailsForm] = useState({
    isi_troubleshooting: '',
    isi_troubleshooting_user: ''
  });

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const canEdit = user.role === 'Super Admin' || user.role === 'Engineer';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const [resItems, resEq] = await Promise.all([
        fetch('/api/troubleshooting', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/equipment', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (resItems.ok && resEq.ok) {
        const fetchedItems = await resItems.json();
        setItems(fetchedItems);
        setEquipment(await resEq.json());

        // Update selected issue if in details view
        if (selectedIssue) {
          const updatedIssue = fetchedItems.find((i: any) => i.id === selectedIssue.id);
          if (updatedIssue) {
            setSelectedIssue(updatedIssue);
            setDetailsForm({
              isi_troubleshooting: updatedIssue.isi_troubleshooting || '',
              isi_troubleshooting_user: updatedIssue.isi_troubleshooting_user || ''
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueFiles = async (issueId: number) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`/api/troubleshooting/${issueId}/files`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setIssueFiles(await res.json());
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // --- Equipment Actions ---
  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const isEdit = isEditEqModalOpen && selectedEquipment;
      const url = isEdit ? `/api/equipment/${selectedEquipment.id}` : '/api/equipment';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(eqForm)
      });

      if (response.ok) {
        setIsEqModalOpen(false);
        setIsEditEqModalOpen(false);
        setEqForm({ name: '', description: '' });
        fetchData();
        showToast(`Equipment ${isEdit ? 'updated' : 'saved'} successfully`);
      } else {
        showToast(`Failed to ${isEdit ? 'update' : 'save'} equipment`, 'error');
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
      showToast('An error occurred', 'error');
    }
  };

  // --- Issue Actions ---
  const handleSaveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const data = new FormData();
      data.append('equipment_id', selectedEquipment.id);
      data.append('nama_trouble', issueForm.nama_trouble);
      
      const isEdit = isEditIssueModalOpen && selectedIssue;
      const url = isEdit ? `/api/troubleshooting/${selectedIssue.id}` : '/api/troubleshooting';
      const method = isEdit ? 'PUT' : 'POST';

      if (isEdit) {
        data.append('isi_troubleshooting', selectedIssue.isi_troubleshooting || '');
        data.append('isi_troubleshooting_user', selectedIssue.isi_troubleshooting_user || '');
      }

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      if (response.ok) {
        setIsIssueModalOpen(false);
        setIsEditIssueModalOpen(false);
        setIssueForm({ nama_trouble: '' });
        fetchData();
        
        if (isEdit) {
          setSelectedIssue({ ...selectedIssue, nama_trouble: issueForm.nama_trouble });
        }
        
        showToast(`Issue ${isEdit ? 'updated' : 'saved'} successfully`);
      } else {
        showToast(`Failed to ${isEdit ? 'update' : 'save'} issue`, 'error');
      }
    } catch (error) {
      console.error('Error saving issue:', error);
      showToast('An error occurred', 'error');
    }
  };

  // --- Details Actions ---
  const handleFileUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !selectedIssue) return;
    
    try {
      const token = sessionStorage.getItem('token');
      const data = new FormData();
      data.append('file', uploadForm.file);
      data.append('role', uploadForm.role);
      if (uploadForm.title.trim()) {
        data.append('custom_name', uploadForm.title.trim());
      }
      
      const res = await fetch(`/api/troubleshooting/${selectedIssue.id}/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });
      
      if (res.ok) {
        fetchIssueFiles(selectedIssue.id);
        setIsUploadModalOpen(false);
        setUploadForm({ file: null, title: '', role: 'engineer' });
        showToast('File uploaded successfully');
      } else {
        showToast('Failed to upload file', 'error');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('An error occurred', 'error');
    }
  };

  const handleFileRename = async (fileId: number) => {
    if (!editingFileName.trim()) return;
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`/api/troubleshooting/files/${fileId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ file_name: editingFileName })
      });
      
      if (res.ok && selectedIssue) {
        fetchIssueFiles(selectedIssue.id);
        setEditingFileId(null);
        showToast('File renamed successfully');
      } else {
        showToast('Failed to rename file', 'error');
      }
    } catch (error) {
      console.error('Error renaming file:', error);
      showToast('An error occurred', 'error');
    }
  };

  const handleFileDelete = (fileId: number) => {
    setDeleteId(fileId);
    setDeleteType('file');
  };

  // --- Delete Actions ---
  const confirmDelete = async () => {
    if (!deleteId || !deleteType) return;
    try {
      const token = sessionStorage.getItem('token');
      let url = '';
      if (deleteType === 'equipment') url = `/api/equipment/${deleteId}`;
      else if (deleteType === 'issue') url = `/api/troubleshooting/${deleteId}`;
      else if (deleteType === 'file') url = `/api/troubleshooting/files/${deleteId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        if (deleteType === 'file' && selectedIssue) {
          fetchIssueFiles(selectedIssue.id);
        } else if (deleteType === 'issue' && selectedIssue && deleteId === selectedIssue.id) {
          setView('issues');
          setSelectedIssue(null);
          fetchData();
        } else {
          fetchData();
        }
        showToast(`${deleteType.charAt(0).toUpperCase() + deleteType.slice(1)} deleted successfully`);
      } else {
        showToast(`Failed to delete ${deleteType}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showToast('An error occurred', 'error');
    } finally {
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  // --- Views ---
  const renderEquipmentView = () => {
    const filteredEq = equipment.filter(eq => eq.name.toLowerCase().includes(search.toLowerCase()));
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Equipment Categories</h2>
          {canEdit && (
            <button onClick={() => setIsEqModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              <Plus className="-ml-1 mr-2 h-4 w-4" /> Add Equipment
            </button>
          )}
        </div>

        <div className="bg-white shadow rounded-lg border border-gray-100 p-4">
          <div className="relative rounded-md shadow-sm max-w-sm w-full mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="Search equipment..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEq.map(eq => (
              <div key={eq.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white group relative">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-medium text-gray-900 cursor-pointer flex-1" onClick={() => { setSelectedEquipment(eq); setView('issues'); setSearch(''); }}>{eq.name}</h3>
                  {canEdit && (
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedEquipment(eq); setEqForm({ name: eq.name, description: eq.description || '' }); setIsEditEqModalOpen(true); }} className="p-1 text-gray-500 hover:text-blue-600 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteId(eq.id); setDeleteType('equipment'); }} className="p-1 text-gray-500 hover:text-red-600 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate cursor-pointer" onClick={() => { setSelectedEquipment(eq); setView('issues'); setSearch(''); }}>{eq.description || 'No description'}</p>
                <div className="mt-4 flex justify-between items-center cursor-pointer" onClick={() => { setSelectedEquipment(eq); setView('issues'); setSearch(''); }}>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {items.filter(i => i.equipment_id === eq.id).length} Issues
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
            {filteredEq.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">No equipment found</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderIssuesView = () => {
    const eqItems = items.filter(i => i.equipment_id === selectedEquipment.id);
    const filteredItems = eqItems.filter(item => item.nama_trouble.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => { setView('equipment'); setSelectedEquipment(null); setSearch(''); }} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{selectedEquipment.name} - Issues</h2>
          <div className="flex-1"></div>
          {canEdit && (
            <button onClick={() => setIsIssueModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              <Plus className="-ml-1 mr-2 h-4 w-4" /> Add Issue
            </button>
          )}
        </div>

        <div className="bg-white shadow rounded-lg border border-gray-100 p-4">
          <div className="relative rounded-md shadow-sm max-w-sm w-full mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="Search issues..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="space-y-3">
            {filteredItems.map(item => (
              <div key={item.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 cursor-pointer" onClick={() => { 
                  setSelectedIssue(item); 
                  fetchIssueFiles(item.id);
                  setView('details'); 
                }}>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <h3 className="text-md font-medium text-gray-900">{item.nama_trouble}</h3>
                  </div>
                </div>
                {canEdit && (
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); setDeleteType('issue'); }} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">No issues found for this equipment</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFileList = (role: 'engineer' | 'user') => {
    const files = issueFiles.filter(f => f.role === role);
    
    // Include legacy file if exists
    const legacyFile = role === 'engineer' ? selectedIssue.file_path : selectedIssue.file_path_user;
    
    return (
      <div className="mt-4 space-y-2">
        {legacyFile && (
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm font-medium text-gray-900">Legacy Attachment</span>
            </div>
            <div className="flex items-center space-x-2">
              <a href={legacyFile} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
        
        {files.map(f => (
          <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center flex-1 mr-4">
              <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
              {editingFileId === f.id ? (
                <div className="flex items-center w-full space-x-2">
                  <input 
                    type="text" 
                    value={editingFileName} 
                    onChange={(e) => setEditingFileName(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <button onClick={() => handleFileRename(f.id)} className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Save</button>
                  <button onClick={() => setEditingFileId(null)} className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">Cancel</button>
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-900 truncate">{f.file_name}</span>
              )}
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <a href={f.file_path} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Download">
                <Download className="h-4 w-4" />
              </a>
              {canEdit && editingFileId !== f.id && (
                <>
                  <button onClick={() => { setEditingFileId(f.id); setEditingFileName(f.file_name); }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="Rename">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleFileDelete(f.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {files.length === 0 && !legacyFile && (
          <p className="text-sm text-gray-500 italic">No files uploaded yet.</p>
        )}
      </div>
    );
  };

  const renderDetailsView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => { setView('issues'); setSelectedIssue(null); }} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedIssue.nama_trouble}</h2>
              <p className="text-sm text-gray-500">{selectedEquipment.name}</p>
            </div>
          </div>
          {canEdit && (
            <div className="flex space-x-2">
              <button 
                onClick={() => { setIssueForm({ nama_trouble: selectedIssue.nama_trouble }); setIsEditIssueModalOpen(true); }} 
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" /> Edit Issue
              </button>
              <button 
                onClick={() => { setDeleteId(selectedIssue.id); setDeleteType('issue'); }} 
                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Issue
              </button>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('engineer')}
                className={`${activeTab === 'engineer' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center`}
              >
                <Settings className="mr-2 h-5 w-5" />
                Files for Engineer
              </button>
              <button
                onClick={() => setActiveTab('user')}
                className={`${activeTab === 'user' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center`}
              >
                <User className="mr-2 h-5 w-5" />
                Files for User
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-lg font-medium text-gray-900">Attachments ({activeTab === 'engineer' ? 'Engineer' : 'User'})</label>
              {canEdit && (
                <button 
                  onClick={() => { setUploadForm({ file: null, title: '', role: activeTab }); setIsUploadModalOpen(true); }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload File
                </button>
              )}
            </div>
            {renderFileList(activeTab)}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      {view === 'equipment' && renderEquipmentView()}
      {view === 'issues' && renderIssuesView()}
      {view === 'details' && renderDetailsView()}

      {/* Add Equipment Modal */}
      {isEqModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsEqModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Add Equipment Category</h3>
                  <button onClick={() => setIsEqModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSaveEquipment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Equipment Name *</label>
                    <input type="text" required value={eqForm.name} onChange={e => setEqForm({...eqForm, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea rows={3} value={eqForm.description} onChange={e => setEqForm({...eqForm, description: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Save</button>
                    <button type="button" onClick={() => setIsEqModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {isEditEqModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsEditEqModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Equipment Category</h3>
                  <button onClick={() => setIsEditEqModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSaveEquipment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Equipment Name *</label>
                    <input type="text" required value={eqForm.name} onChange={e => setEqForm({...eqForm, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea rows={3} value={eqForm.description} onChange={e => setEqForm({...eqForm, description: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Save Changes</button>
                    <button type="button" onClick={() => setIsEditEqModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Issue Modal */}
      {isIssueModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsIssueModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Add Issue / Problem</h3>
                  <button onClick={() => setIsIssueModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSaveIssue} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Issue Name *</label>
                    <input type="text" required value={issueForm.nama_trouble} onChange={e => setIssueForm({...issueForm, nama_trouble: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="e.g. Power failure, Error code 500..." />
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Save</button>
                    <button type="button" onClick={() => setIsIssueModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Issue Modal */}
      {isEditIssueModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsEditIssueModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Issue / Problem</h3>
                  <button onClick={() => setIsEditIssueModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSaveIssue} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Issue Name *</label>
                    <input type="text" required value={issueForm.nama_trouble} onChange={e => setIssueForm({...issueForm, nama_trouble: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="e.g. Power failure, Error code 500..." />
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Save Changes</button>
                    <button type="button" onClick={() => setIsEditIssueModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {isUploadModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsUploadModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Upload File ({uploadForm.role === 'engineer' ? 'Engineer' : 'User'})</h3>
                  <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleFileUploadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File Title (Optional)</label>
                    <input 
                      type="text" 
                      value={uploadForm.title} 
                      onChange={e => setUploadForm({...uploadForm, title: e.target.value})} 
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                      placeholder="e.g. Manual Guide PDF" 
                    />
                    <p className="text-xs text-gray-500 mt-1">If left blank, the original file name will be used.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Select File *</label>
                    <input 
                      type="file" 
                      required 
                      onChange={e => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})} 
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" disabled={!uploadForm.file} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm">Upload</button>
                    <button type="button" onClick={() => setIsUploadModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
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
        onClose={() => { setDeleteId(null); setDeleteType(null); }}
        onConfirm={confirmDelete}
        title={`Delete ${deleteType === 'equipment' ? 'Equipment' : deleteType === 'issue' ? 'Issue' : 'File'}`}
        message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} z-50 transition-opacity`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
