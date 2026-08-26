import React, { useState } from 'react';
import { Plus, Trash2, Layers, FolderPlus } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function SectionsManagerView({ data, setData }) {
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState('Layers');
  const [categoryInputs, setCategoryInputs] = useState({});

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

  const sections = data.sections || [];

  const persistSections = (updatedSections) => {
    setData({ sections: updatedSections });
    try {
      localStorage.setItem('af_crm_sections', JSON.stringify(updatedSections));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSection = (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    const slug = newSectionName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newSec = {
      id: slug,
      name: newSectionName.trim(),
      slug: slug,
      icon: newSectionIcon,
      categories: []
    };

    const updatedSections = [...sections, newSec];
    persistSections(updatedSections);
    setNewSectionName('');
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

  return (
    <div className="space-y-8 font-body">
      
      {/* View Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
          Secciones & Categorías
        </h1>
        <p className="text-sm text-primary/45 mt-1 leading-relaxed">
          Agregá nuevas divisiones de negocio (Náutica, Motos, Campos) y gestioná sus clasificaciones.
        </p>
      </div>

      {/* Add New Section Card */}
      <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-xs font-extrabold tracking-widest text-primary/65 uppercase flex items-center gap-2 mb-6">
          <FolderPlus className="w-5 h-5 text-primary" />
          <span>Crear Nueva Sección de Producto</span>
        </h3>

        <form onSubmit={handleAddSection} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase">
              Nombre de la Sección
            </label>
            <input
              type="text"
              className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary focus:bg-white text-sm text-primary rounded-xl py-3 px-4 outline-none transition-all duration-200"
              placeholder="Ej: Náutica / Motos"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase">
              Icono Representativo
            </label>
            <select
              className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary focus:bg-white text-sm text-primary rounded-xl py-3 px-4 outline-none transition-all duration-200"
              value={newSectionIcon}
              onChange={(e) => setNewSectionIcon(e.target.value)}
            >
              <option value="Layers">Icono General</option>
              <option value="Car">Vehículo (Car)</option>
              <option value="Home">Inmueble (Home)</option>
              <option value="Anchor">Náutica (Anchor)</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Sección</span>
          </button>
        </form>
      </div>

      {/* Sections and Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((sec) => (
          <div
            key={sec.id}
            className="bg-white border border-border-light rounded-3xl p-6 flex flex-col shadow-sm"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-light mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/5 text-primary p-2.5 rounded-xl">
                  <Layers className="w-5 h-5" />
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
            <div className="flex-1 mb-6">
              <h4 className="text-[10px] font-extrabold tracking-widest text-primary/45 uppercase mb-3">
                Categorías ({sec.categories.length})
              </h4>

              <div className="flex flex-wrap gap-2">
                {sec.categories.length === 0 ? (
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
            </div>

            {/* Add Category Input */}
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-bg-canvas/50 border border-border-light focus:border-primary focus:bg-white text-xs text-primary rounded-xl py-2.5 px-4.5 outline-none transition-all duration-200"
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
                className="bg-bg-canvas hover:bg-border-light border border-border-light text-primary p-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-250"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Confirm Popup */}
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
    </div>
  );
}
