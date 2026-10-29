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
} from 'lucide-react';
import type { Farmer, Language, UserRole } from '../types/index.ts';
import { hasPermission } from '../lib/logic/permissions.ts';

interface FarmersViewProps {
  farmers: Farmer[];
  language: Language;
  currentRole: UserRole;
  onAddFarmer: (farmerData: Partial<Farmer>) => Promise<void>;
  onImportCsv: (rows: any[]) => Promise<{ importedCount: number; errorCount: number; errors: any[] }>;
}

export const FarmersView: React.FC<FarmersViewProps> = ({
  farmers,
  language,
  currentRole,
  onAddFarmer,
  onImportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoop, setSelectedCoop] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);

  // Form states for manual registration
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+25078');
  const [nationalId, setNationalId] = useState('');
  const [email, setEmail] = useState('');
  const [cooperativeName, setCooperativeName] = useState("Umuryango w'Abakoresha Amazi Nasho (WUO)");
  const [hectares, setHectares] = useState('1.5');
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
      (f.nationalId && f.nationalId.includes(searchTerm));
    const matchesCoop = selectedCoop === 'ALL' || f.cooperativeName === selectedCoop || (f.cooperativeName && f.cooperativeName.includes(selectedCoop));
    return matchesSearch && matchesCoop;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!phone || phone.length < 10) {
      setFormError('Valid Rwandan phone number is required (e.g. +250788123456).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddFarmer({
        fullName: fullName.trim(),
        phone: phone.trim(),
        nationalId: nationalId.trim() || undefined,
        email: email.trim() || undefined,
        cooperativeName,
        totalHectares: parseFloat(hectares) || 1.0,
        notes: notes.trim() || undefined,
      });
      setShowAddModal(false);
      // Reset form
      setFullName('');
      setPhone('+25078');
      setNationalId('');
      setEmail('');
      setNotes('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to register farmer.');
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
    } catch (err: any) {
      setFormError(err.message || 'CSV Import failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {language === 'rw' ? 'Urutonde rw\'Abahinzi n\'Umuryango w\'Abakoresha Amazi (WUO)' : 'Farmer & WUO Directory'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            GFI Nasho 1 Water Users Organization (WUO) Member Registry
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'rw' ? 'Kwinjiza CSV' : 'Import CSV'}</span>
            </button>
          )}

          {canCreate && (
            <button
              onClick={() => {
                setShowAddModal(true);
                setFormError('');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
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
                ? 'Shakisha izina, telefone, kode, indangamuntu...'
                : 'Search by full name, phone number, code, or NID...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <select
          value={selectedCoop}
          onChange={(e) => setSelectedCoop(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
        >
          <option value="ALL">All Water Users Organizations (WUO)</option>
          <option value="Umuryango w'Abakoresha Amazi Nasho (WUO)">Umuryango w'Abakoresha Amazi Nasho (WUO)</option>
          <option value="Umuryango w'Abakoresha Amazi Cyambwe (WUO)">Umuryango w'Abakoresha Amazi Cyambwe (WUO)</option>
          <option value="Umuryango w'Abakoresha Amazi Duterimbere (WUO)">Umuryango w'Abakoresha Amazi Duterimbere (WUO)</option>
        </select>
      </div>

      {/* High-density Farmer Data Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">National ID (NID)</th>
                <th className="py-3 px-4">Organization (WUO)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Area (Ha)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFarmers.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">
                    {f.farmerCode}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {f.fullName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {f.phone}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {f.nationalId || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {f.cooperativeName}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-medium text-emerald-700">
                      {f.membershipStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                    {f.totalHectares} Ha
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedFarmer(f)}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
                    >
                      {language === 'rw' ? 'Ibisobanuro' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredFarmers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedFarmer.fullName}</h3>
                <p className="text-xs font-mono text-slate-500">{selectedFarmer.farmerCode}</p>
              </div>
              <button
                onClick={() => setSelectedFarmer(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500 block text-[11px]">Phone:</span>
                  <span className="font-mono font-medium text-slate-800">{selectedFarmer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">National ID:</span>
                  <span className="font-mono text-slate-800">{selectedFarmer.nationalId || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Organization (WUO):</span>
                  <span className="font-medium text-slate-800">{selectedFarmer.cooperativeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Registration Date:</span>
                  <span className="text-slate-800">{selectedFarmer.registrationDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Allocated Area:</span>
                  <span className="font-semibold text-slate-800">{selectedFarmer.totalHectares} Ha</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Assigned Plot IDs:</span>
                  <span className="font-mono text-slate-800">
                    {selectedFarmer.assignedPlotIds.length > 0 ? selectedFarmer.assignedPlotIds.join(', ') : 'None'}
                  </span>
                </div>
              </div>

              {selectedFarmer.notes && (
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium mb-1">Operational Notes:</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    {selectedFarmer.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedFarmer(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Farmer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {language === 'rw' ? 'Kwandika Umuhinzi Mushya' : 'Register New Farmer'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jean Bosco Mugisha"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number (MTN/Airtel) *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250788123456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">National ID (16 digits)</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="1198..."
                    maxLength={16}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Umuryango w'Abakoresha Amazi (WUO)</label>
                  <select
                    value={cooperativeName}
                    onChange={(e) => setCooperativeName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Umuryango w'Abakoresha Amazi Nasho (WUO)">Umuryango w'Abakoresha Amazi Nasho (WUO)</option>
                    <option value="Umuryango w'Abakoresha Amazi Cyambwe (WUO)">Umuryango w'Abakoresha Amazi Cyambwe (WUO)</option>
                    <option value="Umuryango w'Abakoresha Amazi Duterimbere (WUO)">Umuryango w'Abakoresha Amazi Duterimbere (WUO)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Total Hectares (Ha)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={hectares}
                    onChange={(e) => setHectares(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes / Tenancy Details</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cultivates Maize in Pivot CP-01 Section A."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Registering...' : 'Register Farmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV / Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Import Farmers from CSV / Excel
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Paste CSV data including headers. Format: <code>fullName, phone, nationalId, cooperativeName, totalHectares</code>
              </p>

              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="fullName,phone,nationalId,cooperativeName,totalHectares&#10;Faustin Habineza,+250788339900,1198080034129011,Umuryango w'Abakoresha Amazi Nasho (WUO),2.0&#10;Marie Chantal Uwamahoro,+250785112233,1198570045129988,Umuryango w'Abakoresha Amazi Cyambwe (WUO),1.4"
                className="w-full p-3 font-mono text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {importResult && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Successfully imported {importResult.importedCount} farmer records!</span>
                  </div>
                  {importResult.errorCount > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="font-semibold text-rose-700 block">
                        {importResult.errorCount} row(s) skipped due to validation:
                      </span>
                      {importResult.errors.map((err, idx) => (
                        <div key={idx} className="text-rose-600 text-[11px]">
                          Row {err.row}: {err.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCsvProcess}
                disabled={isSubmitting}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs shadow-xs"
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
