import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit2,
  Grid3X3,
  UserCheck,
  Building2,
} from 'lucide-react';
import type { Farmer, Plot, Language, UserRole, MembershipStatus } from '../types/index.ts';
import { hasPermission } from '../lib/logic/permissions.ts';

interface FarmersViewProps {
  farmers: Farmer[];
  plots?: Plot[];
  language: Language;
  currentRole: UserRole;
  onAddFarmer: (farmerData: Partial<Farmer>) => Promise<void>;
  onUpdateFarmer?: (id: string, farmerData: Partial<Farmer>) => Promise<Farmer>;
  onImportCsv: (rows: any[]) => Promise<{ importedCount: number; errorCount: number; errors: any[] }>;
}

export const FarmersView: React.FC<FarmersViewProps> = ({
  farmers,
  plots = [],
  language,
  currentRole,
  onAddFarmer,
  onUpdateFarmer,
  onImportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoop, setSelectedCoop] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);

  // Success Feedback Toast
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+25078');
  const [nationalId, setNationalId] = useState('');
  const [email, setEmail] = useState('');
  const [sector, setSector] = useState('Nasho');
  const [cell, setCell] = useState('Cyambwe');
  const [village, setVillage] = useState('');
  const [cooperativeName, setCooperativeName] = useState("Umuryango w'Abakoresha Amazi Nasho (WUO)");
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('ACTIVE');
  const [hectares, setHectares] = useState('1.5');
  const [selectedPlotIds, setSelectedPlotIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState<{ importedCount: number; errorCount: number; errors: any[] } | null>(null);

  const canCreate = hasPermission(currentRole, 'CREATE_FARMER');
  const canImport = hasPermission(currentRole, 'IMPORT_FARMERS');

  const filteredFarmers = farmers.filter((f) => {
    const matchesSearch =
      f.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.phone.includes(searchTerm) ||
      f.farmerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.nationalId && f.nationalId.includes(searchTerm)) ||
      (f.sector && f.sector.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.village && f.village.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCoop = selectedCoop === 'ALL' || f.cooperativeName === selectedCoop;
    const matchesStatus = statusFilter === 'ALL' || f.membershipStatus === statusFilter;
    return matchesSearch && matchesCoop && matchesStatus;
  });

  // Open form for registration
  const openCreateModal = () => {
    setEditingFarmer(null);
    setFullName('');
    setPhone('+25078');
    setNationalId('');
    setEmail('');
    setSector('Nasho');
    setCell('Cyambwe');
    setVillage('');
    setCooperativeName("Umuryango w'Abakoresha Amazi Nasho (WUO)");
    setMembershipStatus('ACTIVE');
    setHectares('1.5');
    setSelectedPlotIds([]);
    setNotes('');
    setFormError('');
    setShowAddModal(true);
  };

  // Open form for editing
  const openEditModal = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setFullName(farmer.fullName || '');
    setPhone(farmer.phone || '+25078');
    setNationalId(farmer.nationalId || '');
    setEmail(farmer.email || '');
    setSector(farmer.sector || 'Nasho');
    setCell(farmer.cell || 'Cyambwe');
    setVillage(farmer.village || '');
    setCooperativeName(farmer.cooperativeName || "Umuryango w'Abakoresha Amazi Nasho (WUO)");
    setMembershipStatus(farmer.membershipStatus || 'ACTIVE');
    setHectares(String(farmer.totalHectares || 1.5));
    setSelectedPlotIds(farmer.assignedPlotIds || []);
    setNotes(farmer.notes || '');
    setFormError('');
    setShowAddModal(true);
  };

  const togglePlotSelection = (plotId: string) => {
    setSelectedPlotIds((prev) =>
      prev.includes(plotId) ? prev.filter((id) => id !== plotId) : [...prev, plotId]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Farmer full name is required.');
      return;
    }
    if (!phone || phone.trim().length < 10) {
      setFormError('Valid Rwandan phone number is required (e.g. +250788123456).');
      return;
    }
    if (nationalId.trim() && nationalId.trim().length !== 16) {
      setFormError('Rwandan National ID must be exactly 16 digits.');
      return;
    }

    const payload: Partial<Farmer> = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      nationalId: nationalId.trim() || undefined,
      email: email.trim() || undefined,
      sector: sector.trim() || undefined,
      cell: cell.trim() || undefined,
      village: village.trim() || undefined,
      district: 'Kirehe',
      cooperativeName,
      membershipStatus,
      totalHectares: parseFloat(hectares) || 1.0,
      assignedPlotIds: selectedPlotIds,
      notes: notes.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      if (editingFarmer) {
        if (onUpdateFarmer) {
          const updated = await onUpdateFarmer(editingFarmer.id, payload);
          setSuccessBanner(`Umuhinzi ${updated.fullName} (${updated.farmerCode}) yahinduwe neza!`);
        } else {
          await onAddFarmer(payload);
          setSuccessBanner('Farmer record updated successfully!');
        }
      } else {
        await onAddFarmer(payload);
        setSuccessBanner(`Umuhinzi ${fullName.trim()} yanditswe neza muri WUO!`);
      }

      setShowAddModal(false);
      if (selectedFarmer && editingFarmer && selectedFarmer.id === editingFarmer.id) {
        setSelectedFarmer(null);
      }
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save farmer record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvProcess = async () => {
    setFormError('');
    setImportResult(null);

    if (!csvText.trim()) {
      setFormError('Please paste CSV content.');
      return;
    }

    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      setFormError('CSV must have a header row and at least one data row.');
      return;
    }

    const rows: any[] = [];
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 2) continue;
      const row: any = {};
      headers.forEach((h, idx) => {
        if (h.includes('name')) row.fullName = parts[idx];
        else if (h.includes('phone')) row.phone = parts[idx];
        else if (h.includes('id') || h.includes('nid')) row.nationalId = parts[idx];
        else if (h.includes('coop') || h.includes('org') || h.includes('wuo')) row.cooperativeName = parts[idx];
        else if (h.includes('ha') || h.includes('hectare')) row.totalHectares = parts[idx];
      });
      if (row.fullName && row.phone) {
        rows.push(row);
      }
    }

    try {
      setIsSubmitting(true);
      const res = await onImportCsv(rows);
      setImportResult(res);
      if (res.importedCount > 0) {
        setSuccessBanner(`Imported ${res.importedCount} farmer records successfully!`);
        setTimeout(() => setSuccessBanner(null), 5000);
      }
    } catch (err: any) {
      setFormError(err.message || 'CSV Import failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 font-bold text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {language === 'rw'
                ? 'Urutonde rw\'Abahinzi n\'Umuryango w\'Abakoresha Amazi (WUO)'
                : 'Farmer & WUO Membership Directory'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            GFI Nasho 1 Water Users Organization (WUO) Member Registry · Kirehe District
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canImport && (
            <button
              onClick={() => {
                setShowImportModal(true);
                setImportResult(null);
                setFormError('');
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>{language === 'rw' ? 'Kwinjiza CSV' : 'Import CSV'}</span>
            </button>
          )}

          {canCreate && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'rw' ? 'Andika Umuhinzi' : 'Register Farmer'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              language === 'rw'
                ? 'Shakisha izina, telefone, kode, indangamuntu, umugudugu...'
                : 'Search by name, phone, farmer code, NID, village, sector...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <select
          value={selectedCoop}
          onChange={(e) => setSelectedCoop(e.target.value)}
          className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
        >
          <option value="ALL" className="dark:bg-slate-800">All WUO Organizations</option>
          <option value="Umuryango w'Abakoresha Amazi Nasho (WUO)" className="dark:bg-slate-800">Umuryango w'Abakoresha Amazi Nasho (WUO)</option>
          <option value="Umuryango w'Abakoresha Amazi Cyambwe (WUO)" className="dark:bg-slate-800">Umuryango w'Abakoresha Amazi Cyambwe (WUO)</option>
          <option value="Umuryango w'Abakoresha Amazi Duterimbere (WUO)" className="dark:bg-slate-800">Umuryango w'Abakoresha Amazi Duterimbere (WUO)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
        >
          <option value="ALL" className="dark:bg-slate-800">All Membership Statuses</option>
          <option value="ACTIVE" className="dark:bg-slate-800">Active (Bakora)</option>
          <option value="SUSPENDED" className="dark:bg-slate-800">Suspended (Wahagaritswe)</option>
          <option value="PROBATIONARY" className="dark:bg-slate-800">Probationary (Agateganyo)</option>
        </select>
      </div>

      {/* High-density Farmer Data Grid */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">National ID (NID)</th>
                <th className="py-3 px-4">Location (Sector/Village)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Area (Ha)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredFarmers.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {f.farmerCode}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {f.fullName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {f.phone}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                    {f.nationalId || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {f.sector || 'Nasho'}{f.village ? ` · ${f.village}` : ''}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        f.membershipStatus === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200'
                          : 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200'
                      }`}
                    >
                      {f.membershipStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 font-bold">
                    {f.totalHectares} Ha
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedFarmer(f)}
                      className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 cursor-pointer"
                    >
                      {language === 'rw' ? 'Ibisobanuro' : 'Details'}
                    </button>
                    {canCreate && (
                      <button
                        onClick={() => openEditModal(f)}
                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 cursor-pointer inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{language === 'rw' ? 'Hindura' : 'Edit'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredFarmers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No farmers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Farmer Profile / Details Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-slate-900 text-white">
              <div>
                <h3 className="text-base font-bold text-white">{selectedFarmer.fullName}</h3>
                <p className="text-xs font-mono text-emerald-300">{selectedFarmer.farmerCode}</p>
              </div>
              <button
                onClick={() => setSelectedFarmer(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Phone:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{selectedFarmer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">National ID:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">{selectedFarmer.nationalId || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Location:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {selectedFarmer.sector || 'Nasho'} · {selectedFarmer.cell || 'Cyambwe'} {selectedFarmer.village ? `(${selectedFarmer.village})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Organization (WUO):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedFarmer.cooperativeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Registration Date:</span>
                  <span className="text-slate-800 dark:text-slate-100">{selectedFarmer.registrationDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Allocated Area:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{selectedFarmer.totalHectares} Ha</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-bold mb-1">Assigned Irrigation Plots:</span>
                {selectedFarmer.assignedPlotIds && selectedFarmer.assignedPlotIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFarmer.assignedPlotIds.map((pId) => {
                      const matchedPlot = plots.find((p) => p.id === pId);
                      return (
                        <span key={pId} className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-md font-mono font-bold text-[11px]">
                          {matchedPlot ? `${matchedPlot.plotCode} (${matchedPlot.blockCode})` : pId}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">No assigned plots attached.</span>
                )}
              </div>

              {selectedFarmer.notes && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-bold mb-1">Operational Notes:</span>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
                    {selectedFarmer.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              {canCreate && (
                <button
                  type="button"
                  onClick={() => openEditModal(selectedFarmer)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{language === 'rw' ? 'Hindura Amakuru' : 'Edit Profile'}</span>
                </button>
              )}

              <button
                onClick={() => setSelectedFarmer(null)}
                className="px-4 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs cursor-pointer ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register / Edit Farmer Modal Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 bg-emerald-950 text-white shrink-0">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {editingFarmer
                    ? (language === 'rw' ? `Guhindura Umuhinzi (${editingFarmer.farmerCode})` : `Edit Farmer Record (${editingFarmer.farmerCode})`)
                    : (language === 'rw' ? 'Kwandika Umuhinzi Mushya (WUO)' : 'Register New WUO Farmer')}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1 scrollbar-thin">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Farmer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jean Bosco Mugisha"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Phone Number (MTN / Airtel) *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250788123456"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    National ID (16 digits)
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="1199880012345678"
                    maxLength={16}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@gfinasho.rw"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Administrative Location */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white block text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Administrative Location (Kirehe District, Eastern Province)</span>
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Sector (Umurenge)</label>
                    <input
                      type="text"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      placeholder="Nasho"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Cell (Akagari)</label>
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => setCell(e.target.value)}
                      placeholder="Cyambwe"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Village (Umudugudu)</label>
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="Kagezi"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* WUO Membership & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Water Users Organization (WUO) *
                  </label>
                  <select
                    value={cooperativeName}
                    onChange={(e) => setCooperativeName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Umuryango w'Abakoresha Amazi Nasho (WUO)">Umuryango w'Abakoresha Amazi Nasho (WUO)</option>
                    <option value="Umuryango w'Abakoresha Amazi Cyambwe (WUO)">Umuryango w'Abakoresha Amazi Cyambwe (WUO)</option>
                    <option value="Umuryango w'Abakoresha Amazi Duterimbere (WUO)">Umuryango w'Abakoresha Amazi Duterimbere (WUO)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Membership Status
                  </label>
                  <select
                    value={membershipStatus}
                    onChange={(e) => setMembershipStatus(e.target.value as MembershipStatus)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="ACTIVE">ACTIVE (Bakora)</option>
                    <option value="SUSPENDED">SUSPENDED (Wahagaritswe)</option>
                    <option value="PROBATIONARY">PROBATIONARY (Agateganyo)</option>
                    <option value="ARCHIVED">ARCHIVED (Wavuyemo)</option>
                  </select>
                </div>
              </div>

              {/* Plot Assignment Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    Assign Irrigation Plots ({selectedPlotIds.length} selected)
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Total: {hectares} Ha
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {plots.map((p) => {
                    const isSelected = selectedPlotIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-mono transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePlotSelection(p.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="truncate">
                          <div className="font-bold">{p.plotCode}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{p.blockCode} · {p.areaHectares}Ha</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Total Cultivated Area (Hectares)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={hectares}
                    onChange={(e) => setHectares(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    disabled
                    value={editingFarmer ? editingFarmer.registrationDate : new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Notes / Tenancy & Crop Details
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cultivates hybrid maize under Pivot CP-01. Verified WUO member."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Saving Record...' : editingFarmer ? 'Save Changes' : 'Register Farmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV / Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-emerald-950 text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Import Farmers from CSV / Excel
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Paste CSV data including headers. Format: <code>fullName, phone, nationalId, cooperativeName, totalHectares</code>
              </p>

              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="fullName,phone,nationalId,cooperativeName,totalHectares&#10;Faustin Habineza,+250788339900,1198080034129011,Umuryango w'Abakoresha Amazi Nasho (WUO),2.0&#10;Marie Chantal Uwamahoro,+250785112233,1198570045129988,Umuryango w'Abakoresha Amazi Cyambwe (WUO),1.4"
                className="w-full p-3 font-mono text-[11px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              />

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {importResult && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Successfully imported {importResult.importedCount} farmer records!</span>
                  </div>
                  {importResult.errorCount > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="font-bold text-rose-700 dark:text-rose-400 block">
                        {importResult.errorCount} row(s) skipped due to validation:
                      </span>
                      {importResult.errors.map((err, idx) => (
                        <div key={idx} className="text-rose-600 dark:text-rose-300 text-[11px]">
                          Row {err.row}: {err.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCsvProcess}
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Validating...' : 'Validate & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
