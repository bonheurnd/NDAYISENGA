import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Palette,
  Image as ImageIcon,
  FileText,
  Sliders,
  RotateCcw,
  Save,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Upload,
  Trash2,
  Info,
  ShieldCheck,
} from 'lucide-react';
import type { QrPosterTemplate, Plot, Language } from '../types/index.ts';
import { DEFAULT_POSTER_TEMPLATE, DEFAULT_KINYARWANDA_INSTRUCTIONS } from '../types/index.ts';
import { generateBlockQrPayload } from '../lib/logic/checkin.ts';

interface QrPosterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTemplate: QrPosterTemplate;
  onSaveTemplate: (updatedTemplate: QrPosterTemplate) => Promise<void>;
  samplePlot: Plot;
  language: Language;
}

export const QrPosterConfigModal: React.FC<QrPosterConfigModalProps> = ({
  isOpen,
  onClose,
  activeTemplate,
  onSaveTemplate,
  samplePlot,
  language,
}) => {
  const [template, setTemplate] = useState<QrPosterTemplate>(activeTemplate || DEFAULT_POSTER_TEMPLATE);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'content' | 'instructions' | 'layout'>('branding');

  useEffect(() => {
    if (activeTemplate) {
      setTemplate(activeTemplate);
      setIsDirty(false);
    }
  }, [activeTemplate, isOpen]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof QrPosterTemplate>(key: K, value: QrPosterTemplate[K]) => {
    setTemplate((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
    setMsg(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File type validation
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMsg({
        type: 'error',
        text: language === 'rw'
          ? 'Ishusho igomba kuba iri mu bwoko bwa PNG, JPEG, cyangwa WebP.'
          : 'Invalid file type. Please upload a PNG, JPEG, or WebP image.',
      });
      return;
    }

    // File size validation (< 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMsg({
        type: 'error',
        text: language === 'rw'
          ? 'Ingano y\'ishusho ntiyemerewe kurenga 2MB.'
          : 'Image file size exceeds 2MB limit.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleChange('logoDataUrl', reader.result);
        setMsg({
          type: 'success',
          text: language === 'rw' ? 'Ibirango bishya byinjijwe neza!' : 'Logo uploaded successfully!',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleChange('logoDataUrl', undefined);
    setMsg({
      type: 'success',
      text: language === 'rw' ? 'Ibirango byakuweho.' : 'Logo reference removed.',
    });
  };

  const handleResetDefaults = () => {
    setTemplate({
      ...DEFAULT_POSTER_TEMPLATE,
      id: template.id || 'template-default',
    });
    setIsDirty(true);
    setMsg({
      type: 'success',
      text: language === 'rw'
        ? 'Imiterere yasubijwe ku buryo busanzwe (Default settings restored).'
        : 'Restored default poster configuration.',
    });
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMsg(null);
      await onSaveTemplate(template);
      setIsDirty(false);
      setMsg({
        type: 'success',
        text: language === 'rw'
          ? 'Imiterere y\'icyapa yabikijwe neza mu bubiko bwa sisitemu!'
          : 'QR Poster configuration saved successfully!',
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || 'Failed to save poster template configuration.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSafeClose = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        language === 'rw'
          ? 'Ufite ibyo wahinduye bitarabikwa. Uradukomeza gusa bila kubika?'
          : 'You have unsaved configuration changes. Are you sure you want to close without saving?'
      );
      if (!confirmDiscard) return;
    }
    onClose();
  };

  // QR Size pixels helper
  const qrPixelSize = template.qrSize === 'SMALL' ? 120 : template.qrSize === 'LARGE' ? 220 : 170;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-5">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600 rounded-xl">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {language === 'rw'
                  ? 'Guhindura Imiterere y\'Icyapa cya QR'
                  : 'QR Code Poster Configuration Modal'}
              </h2>
              <p className="text-xs text-sky-200">
                GFI Nasho 1 · Water Users Organization (WUO) Poster Customization
              </p>
            </div>
          </div>

          <button
            onClick={handleSafeClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications Bar */}
        {msg && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-b border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {msg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
            <button onClick={() => setMsg(null)} className="text-slate-500 hover:text-slate-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Split Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Panel: Configuration Controls (Scrollable Form) */}
          <div className="w-full lg:w-1/2 flex flex-col overflow-hidden bg-white">
            {/* Control Navigation Sub-Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold shrink-0">
              <button
                onClick={() => setActiveSubTab('branding')}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
                  activeSubTab === 'branding'
                    ? 'border-sky-600 bg-white text-sky-900 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="truncate">{language === 'rw' ? 'Ibirango n\'Amabara' : 'Branding'}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('content')}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
                  activeSubTab === 'content'
                    ? 'border-sky-600 bg-white text-sky-900 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">{language === 'rw' ? 'Amakuru' : 'Content'}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('instructions')}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
                  activeSubTab === 'instructions'
                    ? 'border-sky-600 bg-white text-sky-900 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="truncate">{language === 'rw' ? 'Amabwiriza' : 'Instructions'}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('layout')}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
                  activeSubTab === 'layout'
                    ? 'border-sky-600 bg-white text-sky-900 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="truncate">{language === 'rw' ? 'Layout' : 'Layout & Sizing'}</span>
              </button>
            </div>

            {/* Form Section Body */}
            <form onSubmit={handleSaveSubmit} className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* SECTION A: Branding */}
              {activeSubTab === 'branding' && (
                <div className="space-y-4">
                  {/* Logo Upload Card */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-900 block text-xs">
                      {language === 'rw' ? 'Ibirango by\'Umushinga (Logo Upload)' : 'Official Logo Image'}
                    </span>

                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                        {template.logoDataUrl ? (
                          <img src={template.logoDataUrl} alt="Poster Logo Preview" className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="text-center text-[10px] text-slate-400 p-1">
                            <ImageIcon className="w-6 h-6 mx-auto text-slate-300 mb-0.5" />
                            No Logo
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer text-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{language === 'rw' ? 'Shyiramo Logo' : 'Upload Logo'}</span>
                          <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleLogoUpload} className="hidden" />
                        </label>

                        {template.logoDataUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="ml-2 px-2.5 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold rounded-lg text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                            <span>Remove</span>
                          </button>
                        )}
                        <p className="text-[10px] text-slate-500">Formats: PNG, JPEG, WebP (Max 2MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Color Palette Controls Grid */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-900 block text-xs">
                      {language === 'rw' ? 'Ibara n\'Imiterere (Color Palette & Headers)' : 'Color Scheme & Accent Palette'}
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium text-[11px]">Primary Header</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={template.primaryColor}
                            onChange={(e) => handleChange('primaryColor', e.target.value)}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={template.primaryColor}
                            onChange={(e) => handleChange('primaryColor', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1 font-medium text-[11px]">Secondary Accent</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={template.secondaryColor}
                            onChange={(e) => handleChange('secondaryColor', e.target.value)}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={template.secondaryColor}
                            onChange={(e) => handleChange('secondaryColor', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1 font-medium text-[11px]">Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={template.backgroundColor}
                            onChange={(e) => handleChange('backgroundColor', e.target.value)}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={template.backgroundColor}
                            onChange={(e) => handleChange('backgroundColor', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1 font-medium text-[11px]">Text Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={template.textColor}
                            onChange={(e) => handleChange('textColor', e.target.value)}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={template.textColor}
                            onChange={(e) => handleChange('textColor', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1 font-medium text-[11px]">Header Banner</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={template.headerColor}
                            onChange={(e) => handleChange('headerColor', e.target.value)}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={template.headerColor}
                            onChange={(e) => handleChange('headerColor', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1 font-medium text-[11px]">Footer Banner</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={template.footerColor}
                            onChange={(e) => handleChange('footerColor', e.target.value)}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={template.footerColor}
                            onChange={(e) => handleChange('footerColor', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Border Styling */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-900 block text-xs">
                      {language === 'rw' ? 'Imiterere y\'Umupaka (Border Frame)' : 'Border Frame Options'}
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 mb-1 font-medium">Border Style</label>
                        <select
                          value={template.borderStyle}
                          onChange={(e) => handleChange('borderStyle', e.target.value as any)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                        >
                          <option value="SOLID">Solid Line</option>
                          <option value="DASHED">Dashed Line</option>
                          <option value="NONE">No Border Frame</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-1 font-medium">Border Thickness ({template.borderWidth}px)</label>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          value={template.borderWidth}
                          onChange={(e) => handleChange('borderWidth', Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: Poster Content */}
              {activeSubTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      {language === 'rw' ? 'Izina ry\'Umuryango (Organization Name)' : 'Organization Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={template.organizationName}
                      onChange={(e) => handleChange('organizationName', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      {language === 'rw' ? 'Umutwe w\'Icyapa (Poster Title) *' : 'Poster Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={template.posterTitle}
                      onChange={(e) => handleChange('posterTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      {language === 'rw' ? 'Umutwe Wunganira (English / Subtitle)' : 'Secondary Subtitle'}
                    </label>
                    <input
                      type="text"
                      value={template.posterSubtitle}
                      onChange={(e) => handleChange('posterSubtitle', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      {language === 'rw' ? 'Amakuru yo Yanditswe Hasi (Footer Text)' : 'Security Stamp / Footer Text'}
                    </label>
                    <input
                      type="text"
                      value={template.footerText}
                      onChange={(e) => handleChange('footerText', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      {language === 'rw' ? 'Nimero za Telefone na Email (Contact Info)' : 'Contact Details'}
                    </label>
                    <input
                      type="text"
                      value={template.contactInfo}
                      onChange={(e) => handleChange('contactInfo', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={template.showBlockCode}
                        onChange={(e) => handleChange('showBlockCode', e.target.checked)}
                        className="rounded text-sky-600 w-4 h-4"
                      />
                      <span>{language === 'rw' ? 'Garagaza Kode y\'Umurima munsi ya QR Code' : 'Display block code text directly beneath QR code'}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* SECTION C: Kinyarwanda Instructions */}
              {activeSubTab === 'instructions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-900">
                      {language === 'rw' ? 'Amabwiriza mu Kinyarwanda (Instructions)' : 'Custom Kinyarwanda Instructions'}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleChange('instructionsRw', DEFAULT_KINYARWANDA_INSTRUCTIONS)}
                      className="text-xs text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'rw' ? 'Subiza ku buryo busanzwe' : 'Restore Default Text'}</span>
                    </button>
                  </div>

                  <textarea
                    rows={10}
                    value={template.instructionsRw}
                    onChange={(e) => handleChange('instructionsRw', e.target.value)}
                    className="w-full p-3 font-sans text-xs border border-slate-300 rounded-xl leading-relaxed focus:ring-2 focus:ring-sky-500"
                  />

                  <p className="text-[11px] text-slate-500 leading-normal">
                    Instructions format supports full Kinyarwanda characters, bullet points, line breaks, and safety notices.
                  </p>
                </div>
              )}

              {/* SECTION D: Layout & Sizing */}
              {activeSubTab === 'layout' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      {language === 'rw' ? 'Ingano y\'Urupapuro (Paper Format)' : 'Paper Size & Orientation'}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => handleChange('paperSize', 'A4_PORTRAIT')}
                        className={`p-3 rounded-xl border text-center font-semibold transition cursor-pointer ${
                          template.paperSize === 'A4_PORTRAIT'
                            ? 'bg-sky-50 border-sky-600 text-sky-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        A4 Portrait (Ihagaze)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChange('paperSize', 'A4_LANDSCAPE')}
                        className={`p-3 rounded-xl border text-center font-semibold transition cursor-pointer ${
                          template.paperSize === 'A4_LANDSCAPE'
                            ? 'bg-sky-50 border-sky-600 text-sky-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        A4 Landscape (Iryamye)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChange('paperSize', 'COMPACT')}
                        className={`p-3 rounded-xl border text-center font-semibold transition cursor-pointer ${
                          template.paperSize === 'COMPACT'
                            ? 'bg-sky-50 border-sky-600 text-sky-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        Compact Sign
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      {language === 'rw' ? 'Ingano ya QR Code' : 'QR Code Display Size'}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => handleChange('qrSize', 'SMALL')}
                        className={`p-3 rounded-xl border text-center font-semibold transition cursor-pointer ${
                          template.qrSize === 'SMALL'
                            ? 'bg-sky-50 border-sky-600 text-sky-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        Small (120px)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChange('qrSize', 'MEDIUM')}
                        className={`p-3 rounded-xl border text-center font-semibold transition cursor-pointer ${
                          template.qrSize === 'MEDIUM'
                            ? 'bg-sky-50 border-sky-600 text-sky-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        Medium (180px)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChange('qrSize', 'LARGE')}
                        className={`p-3 rounded-xl border text-center font-semibold transition cursor-pointer ${
                          template.qrSize === 'LARGE'
                            ? 'bg-sky-50 border-sky-600 text-sky-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        Large (220px)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Panel: Live Poster Interactive Preview Pane */}
          <div className="w-full lg:w-1/2 bg-slate-200/90 p-6 flex flex-col items-center overflow-y-auto">
            <div className="w-full max-w-[420px] text-center mb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{language === 'rw' ? 'Reba uko bizagaragara (Live Poster Preview)' : 'Live Poster Preview'}</span>
              </span>
            </div>

            {/* Rendered Live Poster Canvas Frame */}
            <div
              className="w-full max-w-[420px] shadow-2xl transition-all duration-300 rounded-2xl p-5 space-y-4 text-xs font-sans border"
              style={{
                backgroundColor: template.backgroundColor,
                color: template.textColor,
                borderColor: template.primaryColor,
                borderStyle: template.borderStyle === 'DASHED' ? 'dashed' : template.borderStyle === 'NONE' ? 'none' : 'solid',
                borderWidth: `${template.borderWidth}px`,
              }}
            >
              {/* Poster Header */}
              <div
                className="p-3.5 rounded-xl text-center space-y-1 text-white shadow-xs"
                style={{ backgroundColor: template.headerColor }}
              >
                {template.logoDataUrl && (
                  <img src={template.logoDataUrl} alt="Logo" className="h-9 mx-auto object-contain mb-1" />
                )}
                <h2 className="font-extrabold text-sm uppercase tracking-tight text-white">
                  {template.organizationName}
                </h2>
              </div>

              {/* Title & Subtitle */}
              <div className="text-center space-y-0.5 border-b pb-2" style={{ borderColor: template.secondaryColor }}>
                <h3 className="font-bold text-xs" style={{ color: template.primaryColor }}>
                  {template.posterTitle}
                </h3>
                {template.posterSubtitle && (
                  <p className="text-[10px] font-semibold opacity-75">{template.posterSubtitle}</p>
                )}
              </div>

              {/* Central QR Code Display */}
              <div className="flex flex-col items-center justify-center space-y-2 py-1">
                <div className="p-3 bg-white rounded-2xl border border-slate-300 shadow-md inline-block">
                  <QRCodeSVG value={generateBlockQrPayload(samplePlot)} size={qrPixelSize} level="H" />
                </div>

                {template.showBlockCode && (
                  <div
                    className="px-4 py-1.5 rounded-lg text-white font-mono font-bold text-sm shadow-xs"
                    style={{ backgroundColor: template.secondaryColor }}
                  >
                    {samplePlot.plotCode}
                  </div>
                )}
              </div>

              {/* Metadata Card */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-[11px] grid grid-cols-2 gap-2 text-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">Pivot/Sector:</span>
                  <span className="font-bold">{samplePlot.blockCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Crop:</span>
                  <span className="font-bold">{samplePlot.currentCrop || 'Maize'}</span>
                </div>
              </div>

              {/* Kinyarwanda Instructions Block */}
              <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-[10px] text-teal-950 leading-relaxed whitespace-pre-line font-medium">
                {template.instructionsRw}
              </div>

              {/* Footer Bar */}
              <div
                className="p-2.5 rounded-lg text-center text-[9px] opacity-80 leading-normal"
                style={{ backgroundColor: template.footerColor }}
              >
                <div>{template.footerText}</div>
                <div className="font-mono mt-0.5">{template.contactInfo}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'rw' ? 'Subiza ku buryo busanzwe' : 'Restore Defaults'}</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSafeClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl cursor-pointer"
            >
              {language === 'rw' ? 'Hagarika' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSaveSubmit}
              disabled={isSaving}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Bika...' : language === 'rw' ? 'Bika imiterere' : 'Save Template'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
