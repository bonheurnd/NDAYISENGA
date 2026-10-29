import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  FileText,
  DollarSign,
  Activity,
} from 'lucide-react';
import type { Equipment, WorkOrder, Language, UserRole } from '../types/index.ts';
import { hasPermission } from '../lib/logic/permissions.ts';

interface MaintenanceViewProps {
  equipment: Equipment[];
  workOrders: WorkOrder[];
  language: Language;
  currentRole: UserRole;
  onCreateWorkOrder: (woData: any) => Promise<void>;
  onUpdateWorkOrder: (id: string, updateData: any) => Promise<void>;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  equipment,
  workOrders,
  language,
  currentRole,
  onCreateWorkOrder,
  onUpdateWorkOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'work-orders' | 'equipment'>('work-orders');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWO, setEditingWO] = useState<WorkOrder | null>(null);

  // Work order form states
  const [equipmentId, setEquipmentId] = useState(equipment[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<WorkOrder['priority']>('MEDIUM');
  const [assignedTechnician, setAssignedTechnician] = useState('Jean Claude Bizimana');
  const [estimatedCost, setEstimatedCost] = useState('35000');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit WO form states
  const [updateStatus, setUpdateStatus] = useState<WorkOrder['status']>('COMPLETED');
  const [downtimeHours, setDowntimeHours] = useState('6');
  const [actualCost, setActualCost] = useState('32000');
  const [sparePartsText, setSparePartsText] = useState('Gearbox seal gasket, 90W lubricating oil');

  const canCreateWO = hasPermission(currentRole, 'CREATE_WORK_ORDER');
  const canUpdateWO = hasPermission(currentRole, 'UPDATE_MAINTENANCE');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !description.trim()) {
      setFormError('Title and description are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateWorkOrder({
        equipmentId,
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedTechnicianName: assignedTechnician,
        estimatedCostRwf: parseFloat(estimatedCost) || 0,
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create work order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWO) return;

    try {
      setIsSubmitting(true);
      const parts = sparePartsText
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await onUpdateWorkOrder(editingWO.id, {
        status: updateStatus,
        downtimeHours: parseFloat(downtimeHours) || 0,
        actualCostRwf: parseFloat(actualCost) || 0,
        sparePartsUsed: parts,
      });
      setEditingWO(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update work order.');
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
            {language === 'rw' ? 'Ibikoresho n\'Isana' : 'Infrastructure & Maintenance Operations'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Asset condition monitoring, spare parts inventory, and technician work orders
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-tab pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('work-orders')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'work-orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Work Orders ({workOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'equipment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Asset Register ({equipment.length})
            </button>
          </div>

          {canCreateWO && (
            <button
              onClick={() => {
                setShowAddModal(true);
                setFormError('');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'rw' ? 'Isana Rishya' : 'New Work Order'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Work Orders Grid */}
      {activeTab === 'work-orders' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">WO #</th>
                  <th className="py-3 px-4">Asset / Pivot</th>
                  <th className="py-3 px-4">Issue Title</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Downtime</th>
                  <th className="py-3 px-4 text-right">Est. Cost</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {wo.workOrderNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-sky-800 font-medium">
                      {wo.equipmentCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {wo.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {wo.assignedTechnicianName || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-semibold ${
                          wo.priority === 'EMERGENCY'
                            ? 'text-rose-700'
                            : wo.priority === 'HIGH'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {wo.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-medium ${
                          wo.status === 'COMPLETED'
                            ? 'text-emerald-700'
                            : wo.status === 'IN_PROGRESS'
                            ? 'text-sky-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {wo.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {wo.downtimeHours} hrs
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 font-medium">
                      {wo.estimatedCostRwf.toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canUpdateWO && wo.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => {
                            setEditingWO(wo);
                            setUpdateStatus(wo.status === 'OPEN' ? 'IN_PROGRESS' : 'COMPLETED');
                            setDowntimeHours(String(wo.downtimeHours || 4));
                            setActualCost(String(wo.actualCostRwf || wo.estimatedCostRwf));
                            setSparePartsText(wo.sparePartsUsed ? wo.sparePartsUsed.join(', ') : '');
                          }}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-[11px] transition shadow-xs cursor-pointer"
                        >
                          Update
                        </button>
                      ) : (
                        <span className="text-emerald-600 text-[11px] font-semibold">Done ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Equipment Register Grid */}
      {activeTab === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((eq) => (
            <div key={eq.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-sky-800">{eq.assetCode}</span>
                  <h3 className="text-xs font-bold text-slate-900 mt-0.5">{eq.name}</h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    eq.condition === 'EXCELLENT' || eq.condition === 'GOOD'
                      ? 'bg-emerald-50 text-emerald-700'
                      : eq.condition === 'REQUIRES_REPAIR'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {eq.condition}
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-medium text-slate-800">{eq.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-slate-700">{eq.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Installed:</span>
                  <span className="font-mono text-slate-700">{eq.installDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Inspection:</span>
                  <span className="font-mono text-slate-700">{eq.lastInspectionDate}</span>
                </div>
              </div>

              {eq.notes && (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 leading-normal mt-2">
                  {eq.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Work Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {language === 'rw' ? 'Kora Urupapuro rw\'Isana' : 'Create Maintenance Work Order'}
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
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Equipment Asset *</label>
                <select
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  {equipment.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.assetCode} — {e.name} ({e.condition})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Work Order Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Center pivot alignment switch malfunction"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Fault Diagnosis / Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe observed faults, noises, pressure drops, or electrical trips."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="EMERGENCY">EMERGENCY (Pump Offline)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assigned Technician</label>
                  <input
                    type="text"
                    value={assignedTechnician}
                    onChange={(e) => setAssignedTechnician(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Estimated Cost (RWF)</label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
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
                  {isSubmitting ? 'Creating...' : 'Create Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Work Order Modal */}
      {editingWO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Work Order Status</h3>
                <p className="text-xs text-slate-500">{editingWO.workOrderNumber} · {editingWO.equipmentCode}</p>
              </div>
              <button
                onClick={() => setEditingWO(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900"
                >
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="WAITING_FOR_PARTS">WAITING_FOR_PARTS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Downtime (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={downtimeHours}
                    onChange={(e) => setDowntimeHours(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Actual Cost (RWF)</label>
                  <input
                    type="number"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Spare Parts Used (Comma separated)</label>
                <input
                  type="text"
                  value={sparePartsText}
                  onChange={(e) => setSparePartsText(e.target.value)}
                  placeholder="e.g. Limit switch, pressure gauge, seal gasket"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingWO(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
