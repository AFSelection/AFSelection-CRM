import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers, FolderPlus, Save, Image as ImageIcon, Upload, ShieldCheck, Heart, Star, CheckCircle, RefreshCw, FileCode, Search, Check, Sparkles, Sliders } from 'lucide-react';
import { supabase } from '../services/supabase';
import { fetchSiteSetting, saveSiteSetting, saveSectionsDB, DEFAULT_STAGGERED_SHOWCASE, DEFAULT_TESTIMONIALS_SECTION } from '../services/storage';
import ConfirmModal from './ConfirmModal';
import SectionIcon from './SectionIcon';
import CustomSelect from './CustomSelect';
import SectionFieldsModal from './SectionFieldsModal';

export default function SectionsManagerView({ data, setData }) {

  const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'staggered' | 'testimonials'
  const [configuringSection, setConfiguringSection] = useState(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState('Layers');
  const [categoryInputs, setCategoryInputs] = useState({});

  // Dynamic Home Sections State
  const [staggeredData, setStaggeredData] = useState(DEFAULT_STAGGERED_SHOWCASE);
  const [testimonialsData, setTestimonialsData] = useState(DEFAULT_TESTIMONIALS_SECTION);
  const [savingShowcase, setSavingShowcase] = useState(false);
  const [savingTestimonials, setSavingTestimonials] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(null); // card id or index being uploaded

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    isNotice: false,
    loading: false,
    onConfirmHandler: null
  });

  useEffect(() => {
    // Fetch site settings from Supabase
    fetchSiteSetting('staggered_showcase', DEFAULT_STAGGERED_SHOWCASE).then((res) => {
      if (res && res.title) setStaggeredData(res);
    });

    fetchSiteSetting('testimonials_section', DEFAULT_TESTIMONIALS_SECTION).then((res) => {
      if (res && res.title) setTestimonialsData(res);
    });
  }, []);

  const showNoticeModal = (title, message) => {
    setModalState({
      isOpen: true,
      title,
      message,
      variant: 'primary',
      confirmText: 'Entendido',
      cancelText: '',
      isNotice: true,
      loading: false,
      onConfirmHandler: () => setModalState((prev) => ({ ...prev, isOpen: false }))
    });
  };

  const showConfirmModal = ({ title, message, variant = 'danger', confirmText = 'Eliminar', onConfirm }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      variant,
      confirmText,
      cancelText: 'Cancelar',
      isNotice: false,
      loading: false,
      onConfirmHandler: async () => {
        setModalState((prev) => ({ ...prev, loading: true }));
        try {
          await onConfirm();
        } finally {
          setModalState((prev) => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  // Icon selection states for creating new section
  const [iconMode, setIconMode] = useState('lucide'); // 'lucide' | 'iconify' | 'svg'
  const [iconifyName, setIconifyName] = useState('ph:bicycle');
  const [svgContent, setSvgContent] = useState('');

  // Custom Fields Modal state for sections
  const [activeSectionForFields, setActiveSectionForFields] = useState(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text'); // 'text' | 'number' | 'select'
  const [fieldOptionsStr, setFieldOptionsStr] = useState('');
  const [fieldRequired, setFieldRequired] = useState(true);

  const sections = data.sections || [];

  const persistSections = async (updatedSections) => {
    setData({ sections: updatedSections });
    try {
      await saveSectionsDB(updatedSections);
      localStorage.setItem('af_crm_sections', JSON.stringify(updatedSections));
    } catch (e) {
      console.error('Error saving sections to Supabase:', e);
    }
  };

  const getComputedIconValue = () => {
    if (iconMode === 'iconify') return iconifyName.trim() || 'ph:bicycle';
    if (iconMode === 'svg') return svgContent.trim() || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
    return newSectionIcon;
  };

  const handleSvgFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSvgContent(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleSaveSectionFields = (secId, updatedFields) => {
    const updatedSections = sections.map((s) => {
      if (s.id === secId) {
        return {
          ...s,
          customFields: updatedFields
        };
      }
      return s;
    });

    persistSections(updatedSections);
  };

  const handleAddSection = (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    const slug = newSectionName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const finalIcon = getComputedIconValue();

    const newSec = {
      id: slug,
      name: newSectionName.trim(),
      slug: slug,
      icon: finalIcon,
      iconType: iconMode,
      categories: [],
      customFields: []
    };

    const updatedSections = [...sections, newSec];
    persistSections(updatedSections);
    setNewSectionName('');
    setSvgContent('');
    setIconifyName('ph:bicycle');

    // Auto open modal to configure fields for new section!
    setConfiguringSection(newSec);
  };


  const handleAddCustomField = (secId) => {
    if (!fieldLabel.trim()) return;

    const fieldName = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const options = fieldType === 'select'
      ? fieldOptionsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const fieldObj = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: fieldName,
      label: fieldLabel.trim(),
      type: fieldType,
      required: fieldRequired,
      options
    };

    const updatedSections = sections.map((s) => {
      if (s.id === secId) {
        const existingFields = s.customFields || [];
        return {
          ...s,
          customFields: [...existingFields, fieldObj]
        };
      }
      return s;
    });

    persistSections(updatedSections);
    setFieldLabel('');
    setFieldOptionsStr('');
    setFieldType('text');
    setFieldRequired(true);
  };

  const handleDeleteCustomField = (secId, fieldId) => {
    const updatedSections = sections.map((s) => {
      if (s.id === secId) {
        return {
          ...s,
          customFields: (s.customFields || []).filter((f) => f.id !== fieldId && f.name !== fieldId)
        };
      }
      return s;
    });

    persistSections(updatedSections);
  };

  const handleDeleteSection = (secId) => {

    const doDelete = () => {
      const updatedSections = sections.filter((s) => s.id !== secId);
      persistSections(updatedSections);
    };

    if (secId === 'autos' || secId === 'propiedades') {
      showConfirmModal({
        title: '¿Eliminar Sección Principal?',
        message: `¿Estás seguro de eliminar la sección principal "${secId.toUpperCase()}"?`,
        variant: 'danger',
        confirmText: 'Eliminar Sección',
        onConfirm: doDelete
      });
    } else {
      doDelete();
    }
  };

  const handleAddCategory = (secId) => {
    const catName = categoryInputs[secId];
    if (!catName || !catName.trim()) return;

    const updatedSections = sections.map((s) => {
      if (s.id === secId) {
        return {
          ...s,
          categories: s.categories.includes(catName.trim())
            ? s.categories
            : [...s.categories, catName.trim()]
        };
      }
      return s;
    });

    persistSections(updatedSections);
    setCategoryInputs({ ...categoryInputs, [secId]: '' });
  };

  const handleDeleteCategory = (secId, catToDelete) => {
    const updatedSections = sections.map((s) => {
      if (s.id === secId) {
        return {
          ...s,
          categories: s.categories.filter((c) => c !== catToDelete)
        };
      }
      return s;
    });

    persistSections(updatedSections);
  };

  // Image Upload Helper for Home Sections
  const handleImageUpload = async (e, updateCallback, keyId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImg(keyId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `home-${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${fileExt}`;
      const filePath = `sections/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('listings')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('listings')
        .getPublicUrl(filePath);

      updateCallback(publicUrl);
    } catch (err) {
      alert('Error al subir imagen. Verifica que el bucket "listings" en Supabase sea público.');
      console.error(err);
    } finally {
      setUploadingImg(null);
      e.target.value = '';
    }
  };

  // Save Handlers
  const handleSaveStaggered = async (e) => {
    e.preventDefault();
    setSavingShowcase(true);
    try {
      await saveSiteSetting('staggered_showcase', staggeredData);
      showNoticeModal('¡Cambios Guardados!', 'La sección "Por Qué Elegirnos" fue actualizada exitosamente y ya se visualiza en la web.');
    } catch (err) {
      alert('Error al guardar cambios: ' + err.message);
    } finally {
      setSavingShowcase(false);
    }
  };

  const handleSaveTestimonials = async (e) => {
    e.preventDefault();
    setSavingTestimonials(true);
    try {
      await saveSiteSetting('testimonials_section', testimonialsData);
      showNoticeModal('¡Cambios Guardados!', 'La sección de Testimonios y Reseñas fue actualizada exitosamente en la web.');
    } catch (err) {
      alert('Error al guardar cambios: ' + err.message);
    } finally {
      setSavingTestimonials(false);
    }
  };

  return (
    <div className="space-y-8 font-body">
      
      {/* View Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
          Gestor de Secciones & Home
        </h1>
        <p className="text-sm text-primary/45 mt-1 leading-relaxed">
          Administrá las divisiones del catálogo y personalizá los títulos, textos y fotos de las secciones destacadas del inicio.
        </p>
      </div>

      {/* Top Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border-light pb-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-primary text-white shadow-md'
              : 'bg-white text-primary/60 hover:text-primary hover:bg-bg-canvas border border-border-light'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Divisiones de Productos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staggered')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeTab === 'staggered'
              ? 'bg-primary text-white shadow-md'
              : 'bg-white text-primary/60 hover:text-primary hover:bg-bg-canvas border border-border-light'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Sección "Por Qué Elegirnos"</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('testimonials')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeTab === 'testimonials'
              ? 'bg-primary text-white shadow-md'
              : 'bg-white text-primary/60 hover:text-primary hover:bg-bg-canvas border border-border-light'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Sección "Testimonios / Clientes"</span>
        </button>
      </div>

      {/* TAB 1: PRODUCT DIVISIONS & CATEGORIES */}
      {activeTab === 'sections' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Add New Section Card */}
          <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-xs font-extrabold tracking-widest text-primary/65 uppercase flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-primary" />
              <span>Crear Nueva Sección de Producto</span>
            </h3>

            <form onSubmit={handleAddSection} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">
                    Nombre de la Sección *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary focus:bg-white text-sm text-primary rounded-xl py-3 px-4 outline-none transition-all duration-200"
                    placeholder="Ej: Bicicletas / Náutica / Motos"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">
                    Tipo de Icono
                  </label>
                  <div className="flex rounded-xl bg-bg-canvas p-1 border border-border-light">
                    <button
                      type="button"
                      onClick={() => setIconMode('lucide')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${iconMode === 'lucide' ? 'bg-white text-primary shadow-sm' : 'text-primary/50 hover:text-primary'}`}
                    >
                      Estándar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconMode('iconify')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${iconMode === 'iconify' ? 'bg-white text-primary shadow-sm' : 'text-primary/50 hover:text-primary'}`}
                    >
                      Iconify API
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconMode('svg')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${iconMode === 'svg' ? 'bg-white text-primary shadow-sm' : 'text-primary/50 hover:text-primary'}`}
                    >
                      Archivo / Código SVG
                    </button>
                  </div>
                </div>
              </div>

              {/* Icon Mode Specific Controls */}
              {iconMode === 'lucide' && (
                <div className="space-y-2">
                  <CustomSelect
                    label="Seleccionar Icono Estándar"
                    value={newSectionIcon}
                    onChange={(val) => setNewSectionIcon(val)}
                    options={[
                      { label: 'Capas / General (Layers)', value: 'Layers' },
                      { label: 'Vehículo (Car)', value: 'Car' },
                      { label: 'Inmueble (Home)', value: 'Home' },
                      { label: 'Inversión (TrendingUp)', value: 'TrendingUp' },
                      { label: 'Náutica (Anchor)', value: 'Anchor' },
                      { label: 'Bicicleta (Bike)', value: 'Bike' },
                      { label: 'Eléctrico / Motos (Zap)', value: 'Zap' },
                      { label: 'Relojes / Joyas (Watch)', value: 'Watch' },
                      { label: 'Comercial / Negocios (Briefcase)', value: 'Briefcase' },
                      { label: 'Lujo / Destacado (Sparkles)', value: 'Sparkles' }
                    ]}
                  />
                </div>
              )}


              {iconMode === 'iconify' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">
                      Nombre del Icono en Iconify (ej: ph:bicycle, mdi:car, fa6-solid:motorcycle)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary focus:bg-white text-xs text-primary rounded-xl py-3 px-4 outline-none font-mono"
                      placeholder="ph:bicycle"
                      value={iconifyName}
                      onChange={(e) => setIconifyName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[10px] text-primary/40 font-bold uppercase">Sugeridos:</span>
                    {['ph:bicycle', 'fa6-solid:motorcycle', 'tabler:sailboat', 'carbon:watch', 'material-symbols:local-shipping'].map((iconCode) => (
                      <button
                        key={iconCode}
                        type="button"
                        onClick={() => setIconifyName(iconCode)}
                        className="px-2.5 py-1 bg-bg-canvas hover:bg-primary/10 border border-border-light rounded-lg text-primary text-[11px] font-mono transition-colors"
                      >
                        {iconCode}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {iconMode === 'svg' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">
                      Cargar Archivo .SVG
                    </label>
                    <input
                      type="file"
                      accept=".svg"
                      onChange={handleSvgFileUpload}
                      className="w-full bg-bg-canvas/50 border border-border-light text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">
                      o Pegar Código SVG
                    </label>
                    <textarea
                      rows={2}
                      placeholder='<svg viewBox="0 0 24 24">...</svg>'
                      value={svgContent}
                      onChange={(e) => setSvgContent(e.target.value)}
                      className="w-full bg-bg-canvas/50 border border-border-light text-xs font-mono text-primary rounded-xl py-2 px-3 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Preview & Submit */}
              <div className="flex items-center justify-between pt-2 border-t border-border-light">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase">Vista previa:</span>
                  <div className="w-10 h-10 rounded-xl bg-primary/5 border border-border-light flex items-center justify-center text-primary">
                    <SectionIcon icon={getComputedIconValue()} iconType={iconMode} size={22} />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-3.5 px-6 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Sección</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sections List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((sec) => (
              <div
                key={sec.id}
                className="bg-white border border-border-light rounded-3xl p-6 flex flex-col shadow-sm"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border-light mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/5 text-primary p-2.5 rounded-xl flex items-center justify-center">
                      <SectionIcon icon={sec.icon} iconType={sec.iconType} size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-primary leading-none">{sec.name}</h3>
                      <span className="text-[10px] text-primary/35 font-bold uppercase mt-1 block">ID: {sec.id}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSection(sec.id)}
                    className="text-primary/30 hover:text-accent-red p-2 rounded-full hover:bg-red-50 cursor-pointer transition-all duration-250"
                    title="Eliminar Sección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Categories */}
                <div className="mb-6 space-y-3">
                  <h4 className="text-[10px] font-extrabold tracking-widest text-primary/45 uppercase">
                    Categorías ({sec.categories?.length || 0})
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {(!sec.categories || sec.categories.length === 0) ? (
                      <span className="text-xs font-semibold text-primary/30 italic">Sin categorías aún.</span>
                    ) : (
                      sec.categories.map((cat) => (
                        <span
                          key={cat}
                          className="bg-bg-canvas/60 border border-border-light rounded-full pl-3 pr-2 py-1 text-xs font-semibold text-primary/75 flex items-center gap-1.5"
                        >
                          <span>{cat}</span>
                          <button
                            onClick={() => handleDeleteCategory(sec.id, cat)}
                            className="text-primary/30 hover:text-accent-red p-0.5 rounded-full hover:bg-primary/5 cursor-pointer transition-colors"
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      className="flex-1 bg-bg-canvas/50 border border-border-light focus:border-primary focus:bg-white text-xs text-primary rounded-xl py-2 px-3.5 outline-none transition-all duration-200"
                      placeholder="Nueva categoría..."
                      value={categoryInputs[sec.id] || ''}
                      onChange={(e) => setCategoryInputs({ ...categoryInputs, [sec.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory(sec.id);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCategory(sec.id)}
                      className="bg-bg-canvas hover:bg-border-light border border-border-light text-primary p-2 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Custom Fields per Section */}
                <div className="pt-4 border-t border-border-light space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-extrabold tracking-widest text-primary/45 uppercase">
                      Campos de Publicación ({(sec.customFields || []).length})
                    </h4>
                  </div>

                  {/* Button to open Preset Fields Selection Modal */}
                  <button
                    type="button"
                    onClick={() => setConfiguringSection(sec)}
                    className="w-full py-3 px-4 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Configurar Campos y Atributos ({(sec.customFields || []).length} activos)</span>
                  </button>

                  {/* List of active Fields on this card */}
                  <div className="space-y-2 pt-1">
                    {(!sec.customFields || sec.customFields.length === 0) ? (
                      <p className="text-xs text-primary/35 italic font-medium">Sin campos asignados. Hacé clic arriba para elegir qué campos tendrá.</p>
                    ) : (
                      sec.customFields.map((field) => (
                        <div
                          key={field.id || field.name}
                          className="flex items-center justify-between p-2.5 bg-bg-canvas/60 border border-border-light rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{field.label}</span>
                            <span className="text-[10px] text-primary/40 font-mono">({field.type})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${field.required ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-500'}`}>
                              {field.required ? 'Obligatorio' : 'Opcional'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomField(sec.id, field.id || field.name)}
                              className="text-primary/30 hover:text-accent-red p-1 rounded-lg hover:bg-red-50 transition-colors"
                              title="Eliminar campo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* TAB 2: POR QUÉ ELEGIRNOS */}
      {activeTab === 'staggered' && (
        <form onSubmit={handleSaveStaggered} className="space-y-8 animate-in fade-in duration-200">
          <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border-light pb-4">
              <div>
                <h3 className="text-base font-bold text-primary">Sección: No Somos un Concesionario Tradicional</h3>
                <p className="text-xs text-primary/45 mt-0.5">Editá el título principal, la descripción y las 3 tarjetas de fotos destacadas.</p>
              </div>
              <button
                type="submit"
                disabled={savingShowcase}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-6 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingShowcase ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">Título Principal de la Sección *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary focus:bg-white text-sm font-bold text-primary rounded-xl py-3 px-4 outline-none"
                  value={staggeredData.title || ''}
                  onChange={(e) => setStaggeredData({ ...staggeredData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">Texto del Botón Catálogo *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary focus:bg-white text-sm font-bold text-primary rounded-xl py-3 px-4 outline-none"
                  value={staggeredData.buttonText || ''}
                  onChange={(e) => setStaggeredData({ ...staggeredData, buttonText: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">Descripción Resumen *</label>
              <textarea
                rows={3}
                required
                className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary focus:bg-white text-xs text-primary rounded-xl py-3 px-4 outline-none leading-relaxed"
                value={staggeredData.description || ''}
                onChange={(e) => setStaggeredData({ ...staggeredData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Cards Editor (3 Tarjetas) */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold tracking-widest text-primary/65 uppercase px-2">
              Tarjetas Destacadas de la Sección (3 Fotos)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(staggeredData.cards || []).map((card, idx) => (
                <div key={card.id || idx} className="bg-white border border-border-light rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      Tarjeta {idx + 1}
                    </span>
                  </div>

                  {/* Image Preview & Uploader */}
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-bg-canvas border border-border-light group">
                    {card.image ? (
                      <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-primary/30">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-xs font-semibold">Sin imagen</span>
                      </div>
                    )}

                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity duration-200">
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">{uploadingImg === `staggered-${idx}` ? 'Subiendo...' : 'Cambiar Imagen'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, (url) => {
                          const updated = [...staggeredData.cards];
                          updated[idx] = { ...updated[idx], image: url };
                          setStaggeredData({ ...staggeredData, cards: updated });
                        }, `staggered-${idx}`)}
                      />
                    </label>
                  </div>

                  {/* Image URL Direct Input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-primary/40 uppercase block">URL de Imagen (o subir archivo arriba)</label>
                    <input
                      type="text"
                      className="w-full bg-bg-canvas/50 border border-border-light text-xs text-primary rounded-xl py-2 px-3 outline-none"
                      value={card.image || ''}
                      onChange={(e) => {
                        const updated = [...staggeredData.cards];
                        updated[idx] = { ...updated[idx], image: e.target.value };
                        setStaggeredData({ ...staggeredData, cards: updated });
                      }}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Card Title */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-primary/40 uppercase block">Título de la Tarjeta *</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary text-xs font-bold text-primary rounded-xl py-2.5 px-3.5 outline-none"
                      value={card.title || ''}
                      onChange={(e) => {
                        const updated = [...staggeredData.cards];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setStaggeredData({ ...staggeredData, cards: updated });
                      }}
                      placeholder="Ej: Porsche 911 GT3 RS"
                    />
                  </div>

                  {/* Card Subtitle */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-primary/40 uppercase block">Subtítulo / Detalle *</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3.5 outline-none"
                      value={card.subtitle || ''}
                      onChange={(e) => {
                        const updated = [...staggeredData.cards];
                        updated[idx] = { ...updated[idx], subtitle: e.target.value };
                        setStaggeredData({ ...staggeredData, cards: updated });
                      }}
                      placeholder="Ej: Edición Limitada 2023"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={savingShowcase}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-4 px-8 rounded-2xl flex items-center gap-2 cursor-pointer transition-colors shadow-lg disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{savingShowcase ? 'Guardando...' : 'Guardar Cambios en la Web'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: TESTIMONIOS Y RESEÑAS */}
      {activeTab === 'testimonials' && (
        <form onSubmit={handleSaveTestimonials} className="space-y-8 animate-in fade-in duration-200">
          <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border-light pb-4">
              <div>
                <h3 className="text-base font-bold text-primary">Sección: Testimonios de Clientes</h3>
                <p className="text-xs text-primary/45 mt-0.5">Editá los títulos, reseñas reales y fotos de clientes de la portada.</p>
              </div>
              <button
                type="submit"
                disabled={savingTestimonials}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-6 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingTestimonials ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">Etiqueta Badge *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary text-xs font-bold text-primary rounded-xl py-3 px-4 outline-none"
                  value={testimonialsData.badge || ''}
                  onChange={(e) => setTestimonialsData({ ...testimonialsData, badge: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">Título Principal *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary text-xs font-bold text-primary rounded-xl py-3 px-4 outline-none"
                  value={testimonialsData.title || ''}
                  onChange={(e) => setTestimonialsData({ ...testimonialsData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">Puntuación Google Reviews *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary text-xs font-bold text-primary rounded-xl py-3 px-4 outline-none"
                  value={testimonialsData.rating || '5.0'}
                  onChange={(e) => setTestimonialsData({ ...testimonialsData, rating: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">Descripción Resumen *</label>
              <textarea
                rows={2}
                required
                className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary text-xs text-primary rounded-xl py-3 px-4 outline-none leading-relaxed"
                value={testimonialsData.description || ''}
                onChange={(e) => setTestimonialsData({ ...testimonialsData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Testimonial Cards (3 Reviews) */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold tracking-widest text-primary/65 uppercase px-2">
              Reseñas de Clientes (3 Tarjetas)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(testimonialsData.reviews || []).map((rev, idx) => (
                <div key={rev.id || idx} className="bg-white border border-border-light rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>Reseña {idx + 1}</span>
                    </span>
                  </div>

                  {/* Image Preview & Uploader */}
                  <div className="relative h-40 rounded-2xl overflow-hidden bg-bg-canvas border border-border-light group">
                    {rev.image ? (
                      <img src={rev.image} alt={rev.author} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-primary/30">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-xs font-semibold">Sin imagen</span>
                      </div>
                    )}

                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity duration-200">
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">{uploadingImg === `test-${idx}` ? 'Subiendo...' : 'Cambiar Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, (url) => {
                          const updated = [...testimonialsData.reviews];
                          updated[idx] = { ...updated[idx], image: url };
                          setTestimonialsData({ ...testimonialsData, reviews: updated });
                        }, `test-${idx}`)}
                      />
                    </label>
                  </div>

                  {/* Image URL Input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-primary/40 uppercase block">URL de Imagen (o subir archivo arriba)</label>
                    <input
                      type="text"
                      className="w-full bg-bg-canvas/50 border border-border-light text-xs text-primary rounded-xl py-2 px-3 outline-none"
                      value={rev.image || ''}
                      onChange={(e) => {
                        const updated = [...testimonialsData.reviews];
                        updated[idx] = { ...updated[idx], image: e.target.value };
                        setTestimonialsData({ ...testimonialsData, reviews: updated });
                      }}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary/40 uppercase block">Etiqueta Operación *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-bg-canvas/50 border border-border-light text-xs font-bold text-primary rounded-xl py-2 px-3 outline-none"
                        value={rev.tag || ''}
                        onChange={(e) => {
                          const updated = [...testimonialsData.reviews];
                          updated[idx] = { ...updated[idx], tag: e.target.value };
                          setTestimonialsData({ ...testimonialsData, reviews: updated });
                        }}
                        placeholder="Ej: COMPRA AUTOMOTRIZ"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary/40 uppercase block">Modelo / Destacado *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-bg-canvas/50 border border-border-light text-xs font-bold text-primary rounded-xl py-2 px-3 outline-none"
                        value={rev.date || ''}
                        onChange={(e) => {
                          const updated = [...testimonialsData.reviews];
                          updated[idx] = { ...updated[idx], date: e.target.value };
                          setTestimonialsData({ ...testimonialsData, reviews: updated });
                        }}
                        placeholder="Ej: Hilux SRX 4x4"
                      />
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-primary/40 uppercase block">Cita / Testimonio *</label>
                    <textarea
                      rows={3}
                      required
                      className="w-full bg-bg-canvas/50 border border-border-light text-xs text-primary rounded-xl py-2 px-3 outline-none leading-relaxed"
                      value={rev.quote || ''}
                      onChange={(e) => {
                        const updated = [...testimonialsData.reviews];
                        updated[idx] = { ...updated[idx], quote: e.target.value };
                        setTestimonialsData({ ...testimonialsData, reviews: updated });
                      }}
                      placeholder="Cita textual del cliente..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary/40 uppercase block">Nombre Cliente *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-bg-canvas/50 border border-border-light text-xs font-bold text-primary rounded-xl py-2 px-3 outline-none"
                        value={rev.author || ''}
                        onChange={(e) => {
                          const updated = [...testimonialsData.reviews];
                          updated[idx] = { ...updated[idx], author: e.target.value };
                          setTestimonialsData({ ...testimonialsData, reviews: updated });
                        }}
                        placeholder="Ej: Martín R."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary/40 uppercase block">Ubicación *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-bg-canvas/50 border border-border-light text-xs text-primary rounded-xl py-2 px-3 outline-none"
                        value={rev.location || ''}
                        onChange={(e) => {
                          const updated = [...testimonialsData.reviews];
                          updated[idx] = { ...updated[idx], location: e.target.value };
                          setTestimonialsData({ ...testimonialsData, reviews: updated });
                        }}
                        placeholder="Ej: Tucumán"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={savingTestimonials}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-4 px-8 rounded-2xl flex items-center gap-2 cursor-pointer transition-colors shadow-lg disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{savingTestimonials ? 'Guardando...' : 'Guardar Cambios en la Web'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Custom Notice / Confirm Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        variant={modalState.variant}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        isNotice={modalState.isNotice}
        loading={modalState.loading}
        onConfirm={modalState.onConfirmHandler}
        onCancel={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Section Fields Preset Config Modal */}
      <SectionFieldsModal
        isOpen={Boolean(configuringSection)}
        section={configuringSection}
        onClose={() => setConfiguringSection(null)}
        onSave={handleSaveSectionFields}
      />
    </div>
  );
}

