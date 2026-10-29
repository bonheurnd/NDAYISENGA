import React, { useState } from 'react';
import {
  Smartphone,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  MessageSquare,
  Key,
} from 'lucide-react';
import type { SmsNotification, Farmer, Language } from '../types/index.ts';

interface SmsLogsViewProps {
  notifications: SmsNotification[];
  farmers: Farmer[];
  language: Language;
  onSendManualSms: (smsData: any) => Promise<void>;
}

export const SmsLogsView: React.FC<SmsLogsViewProps> = ({
  notifications,
  farmers,
  language,
  onSendManualSms,
}) => {
  const [recipientPhone, setRecipientPhone] = useState(farmers[0]?.phone || '+250788543210');
  const [templateType, setTemplateType] = useState<SmsNotification['type']>('SCHEDULE_ALERT');
  const [msgLang, setMsgLang] = useState<Language>('rw');
  const [messageText, setMessageText] = useState(
    'GFI Nasho 1: Gahunda yo kuhira umurima wawe BLK-A-P01 yemerewe. Gutangira: 16/10 saa 06:00 kugeza 10:00.'
  );
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Template auto-fill
  const handleTemplateSelect = (type: SmsNotification['type'], lang: Language) => {
    setTemplateType(type);
    setMsgLang(lang);
    if (type === 'SCHEDULE_ALERT') {
      setMessageText(
        lang === 'rw'
          ? 'GFI Nasho 1: Gahunda yo kuhira umurima wawe BLK-A-P01 yemerewe. Gutangira: 16/10 saa 06:00 kugeza 10:00.'
          : 'GFI Nasho 1: Irrigation schedule approved for plot BLK-A-P01. Start: 16/10 06:00 to 10:00.'
      );
    } else if (type === 'PAYMENT_RECEIPT') {
      setMessageText(
        lang === 'rw'
          ? 'GFI Nasho 1: Twakiriye ubwishyu bwawe bwa 60,000 RWF (REC-2026-0031). Asigaye: 60,000 RWF. Murakoze!'
          : 'GFI Nasho 1: Verified payment of 60,000 RWF received (REC-2026-0031). Balance: 60,000 RWF. Thank you!'
      );
    } else if (type === 'DUE_REMINDER') {
      setMessageText(
        lang === 'rw'
          ? 'GFI Nasho 1: Urwibutso rw\'ubwishyu bw\'amazi. Igihe cyo kwishyura kirarangira ku wa 25/10/2026.'
          : 'GFI Nasho 1: Seasonal water levy payment reminder. Deadline is 25 Oct 2026. Pay via MoMo *182#.'
      );
    } else if (type === 'INTERRUPTION_ALERT') {
      setMessageText(
        lang === 'rw'
          ? 'GFI Nasho 1: Amazi yarahagaze kuri Pivo 03 kubera isana ry\'ihuse. Muramenyeshwa naza.'
          : 'GFI Nasho 1: Water temporarily interrupted at Pivot 03 for emergency maintenance. Will notify upon restore.'
      );
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setIsSending(true);
      await onSendManualSms({
        phone: recipientPhone.trim(),
        message: messageText.trim(),
        type: templateType,
        language: msgLang,
      });
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch SMS.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {language === 'rw' ? 'Ubutumwa bwa SMS (Telefoni Zisanzwe)' : 'SMS & Basic Phone Gateway Console'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Dual-language notification dispatcher for smallholder farmers using basic feature phones (Nokia/Itel)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: SMS Dispatcher & Templates (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>Send SMS Broadcast / Alert</span>
              </h2>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded font-semibold">
                Gateway Driver: Africa's Talking (Simulated)
              </span>
            </div>

            {/* Template Selector Buttons */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Standard Verified Templates:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('SCHEDULE_ALERT', 'rw')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                >
                  Schedule Alert (RW)
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('PAYMENT_RECEIPT', 'rw')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                >
                  Payment Receipt (RW)
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('DUE_REMINDER', 'en')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                >
                  Due Date Reminder (EN)
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('INTERRUPTION_ALERT', 'rw')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                >
                  Interruption Notice (RW)
                </button>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Recipient Phone *</label>
                  <input
                    type="text"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+250788..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Member Autofill</label>
                  <select
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  >
                    {farmers.map((f) => (
                      <option key={f.id} value={f.phone}>
                        {f.fullName} ({f.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-medium text-slate-700">SMS Body (160 Chars Max per Segment)</label>
                  <span className="font-mono text-[11px] text-slate-400">
                    {messageText.length}/160 chars ({Math.ceil(messageText.length / 160)} SMS)
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {sendSuccess ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Message sent to provider gateway!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    Sender ID: <strong className="font-mono text-slate-700">GFINASHO</strong>
                  </span>
                )}

                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Dispatch SMS'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Delivery Logs */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Transmission Logs</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {notifications.map((n) => (
                <div key={n.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{n.recipientPhone}</span>
                      <span className="text-slate-400 text-[11px]">· {n.recipientName}</span>
                      <span className="text-[10px] uppercase font-semibold bg-slate-100 px-1.5 rounded text-slate-600">
                        {n.language}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed font-mono">
                      "{n.message}"
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {n.status}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono mt-1">
                      {new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Basic Feature Phone Handset Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-slate-500" />
            <span>Farmer Handset Display (Basic Phone)</span>
          </div>

          {/* Physical Phone Casing */}
          <div className="w-64 bg-slate-800 rounded-3xl p-4 shadow-xl border-4 border-slate-700 flex flex-col items-center">
            {/* Earpiece slit */}
            <div className="w-12 h-1 bg-slate-900 rounded-full mb-3" />

            {/* Monochrome Green/Black LCD Screen */}
            <div className="w-full bg-[#8fa47b] border-2 border-slate-900 rounded-lg p-3 text-slate-900 font-mono text-xs shadow-inner min-h-[160px] flex flex-col justify-between">
              <div>
                {/* Status Bar */}
                <div className="flex justify-between items-center text-[10px] border-b border-slate-800/40 pb-1 mb-2 font-bold">
                  <span>MTN-RW ■■■</span>
                  <span>10:45 AM</span>
                </div>

                <div className="text-[10px] font-bold text-slate-900 uppercase">
                  From: GFINASHO
                </div>
                <p className="text-[11px] font-medium leading-tight mt-1 text-slate-950">
                  {messageText || 'No incoming SMS preview available.'}
                </p>
              </div>

              <div className="text-[9px] border-t border-slate-800/40 pt-1 flex justify-between font-bold">
                <span>[Options]</span>
                <span>[Back]</span>
              </div>
            </div>

            {/* D-Pad and Number Keypad */}
            <div className="mt-4 w-full flex flex-col items-center gap-2">
              {/* D-Pad */}
              <div className="w-14 h-14 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-slate-900" />
              </div>

              {/* Number keys grid */}
              <div className="grid grid-cols-3 gap-1.5 w-full mt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                  <div
                    key={k}
                    className="h-6 bg-slate-700/80 rounded border border-slate-600 text-slate-300 flex items-center justify-center text-[11px] font-mono"
                  >
                    {k}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center max-w-xs mt-3 leading-relaxed">
            Real-world smallholders in Nasho Sector rely on basic 2G handsets. All automated notices are optimized for 160 GSM-7 characters in Ikinyarwanda.
          </p>
        </div>
      </div>
    </div>
  );
};
