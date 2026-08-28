import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Plus, Trash2, Sliders, Shield, AlertCircle, Pencil } from 'lucide-react';
import CustomSelect from './CustomSelect';

export const FIELD_PRESETS = [

  // General & Rodados
  { id: 'marca', label: 'Marca / Fabricante', category: 'Vehículos & Rodados', type: 'text', defaultRequired: true },
  { id: 'modelo', label: 'Modelo / Versión', category: 'Vehículos & Rodados', type: 'text', defaultRequired: true },
  { id: 'year', label: 'Año de Fabricación', category: 'Vehículos & Rodados', type: 'number', defaultRequired: true },
  { id: 'kilometers', label: 'Kilometraje (km)', category: 'Vehículos & Rodados', type: 'number', defaultRequired: true },
  { id: 'fuel', label: 'Combustible / Propulsión', category: 'Vehículos & Rodados', type: 'select', options: ['Nafta', 'Diesel', 'Híbrido', 'Eléctrico'], defaultRequired: true },
  { id: 'transmission', label: 'Transmisión', category: 'Vehículos & Rodados', type: 'select', options: ['Automático', 'Manual', 'PDK', 'Secuencial'], defaultRequired: true },
  { id: 'condition', label: 'Estado / Condición', category: 'Vehículos & Rodados', type: 'select', options: ['Nuevo / 0km', 'Usado', 'A Estrenar', 'En Pozo', 'Reacondicionado'], defaultRequired: true },
  
  // Propiedades
  { id: 'operationType', label: 'Tipo de Operación (Venta/Alquiler)', category: 'Propiedades & Inmuebles', type: 'select', options: ['Venta', 'Alquiler'], defaultRequired: true },
  { id: 'surface', label: 'Superficie Total (m²)', category: 'Propiedades & Inmuebles', type: 'number', defaultRequired: false },
  { id: 'coveredSurface', label: 'Superficie Cubierta (m²)', category: 'Propiedades & Inmuebles', type: 'number', defaultRequired: false },
  { id: 'rooms', label: 'Ambientes Total', category: 'Propiedades & Inmuebles', type: 'number', defaultRequired: false },
  { id: 'bedrooms', label: 'Dormitorios', category: 'Propiedades & Inmuebles', type: 'number', defaultRequired: false },
  { id: 'bathrooms', label: 'Baños', category: 'Propiedades & Inmuebles', type: 'number', defaultRequired: false },
  { id: 'garages', label: 'Cocheras / Estacionamiento', category: 'Propiedades & Inmuebles', type: 'number', defaultRequired: false },
  { id: 'expenses', label: 'Expensas / Mantenimiento ($)', category: 'Propiedades & Inmuebles', type: 'text', defaultRequired: false },

  // Náutica
  { id: 'eslora', label: 'Eslora (Pies / Metros)', category: 'Náutica & Embarcaciones', type: 'number', defaultRequired: false },
  { id: 'motorHp', label: 'Potencia de Motor (HP)', category: 'Náutica & Embarcaciones', type: 'text', defaultRequired: false },
  { id: 'engineHours', label: 'Horas de Uso del Motor', category: 'Náutica & Embarcaciones', type: 'number', defaultRequired: false },

  // Inversiones
  { id: 'developerCompany', label: 'Empresa Desarrolladora', category: 'Inversiones & Pozos', type: 'text', defaultRequired: false },
  { id: 'estimatedReturn', label: 'Retorno Estimado (%)', category: 'Inversiones & Pozos', type: 'text', defaultRequired: false },
  { id: 'workProgress', label: 'Avance de Obra (%)', category: 'Inversiones & Pozos', type: 'number', defaultRequired: false },
  { id: 'termMonths', label: 'Plazo de Entrega (Meses)', category: 'Inversiones & Pozos', type: 'number', defaultRequired: false },

  // General & Otros
  { id: 'location', label: 'Ubicación física / Barrio / Ciudad', category: 'General', type: 'text', defaultRequired: true },
  { id: 'material', label: 'Material / Composición / Cuadro', category: 'General', type: 'text', defaultRequired: false },
  { id: 'warranty', label: 'Garantía / Cobertura', category: 'General', type: 'text', defaultRequired: false }
];

export default function SectionFieldsModal({ isOpen, section, onClose, onSave }) {
  if (!isOpen || !section) return null;

  // Local state for active fields: array of { id, name, label, type, required, options, isCustom }
  const [fieldsState, setFieldsState] = useState(() => {
    const existing = section.customFields || [];
    // If empty, pre-select default location & condition
    if (existing.length === 0) {
      return [
        { id: 'location', name: 'location', label: 'Ubicación física / Barrio / Ciudad', type: 'text', required: true },
        { id: 'condition', name: 'condition', label: 'Estado / Condición', type: 'select', options: ['Nuevo', 'Usado'], required: true }
      ];
    }
    return existing;
  });

  // Custom Extra Field Form state
  const [customLabel, setCustomLabel] = useState('');
  const [customType, setCustomType] = useState('text');
  const [customOptionsStr, setCustomOptionsStr] = useState('');
  const [customRequired, setCustomRequired] = useState(false);

  // Edit Field State
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editType, setEditType] = useState('text');
  const [editOptionsStr, setEditOptionsStr] = useState('');
  const [editRequired, setEditRequired] = useState(false);

  const categories = Array.from(new Set(FIELD_PRESETS.map((f) => f.category)));

  const isPresetSelected = (presetId) => {
    return fieldsState.some((f) => f.id === presetId || f.name === presetId);
  };

  const isPresetRequired = (presetId) => {
    const found = fieldsState.find((f) => f.id === presetId || f.name === presetId);
    return found ? Boolean(found.required) : false;
  };

  const togglePreset = (preset) => {
    if (isPresetSelected(preset.id)) {
      // Remove
      setFieldsState((prev) => prev.filter((f) => f.id !== preset.id && f.name !== preset.id));
    } else {
      // Add
      setFieldsState((prev) => [
        ...prev,
        {
          id: preset.id,
          name: preset.id,
          label: preset.label,
          type: preset.type,
          options: preset.options || [],
          required: preset.defaultRequired
        }
      ]);
    }
  };

  const toggleRequired = (presetId) => {
    setFieldsState((prev) =>
      prev.map((f) => {
        if (f.id === presetId || f.name === presetId) {
          return { ...f, required: !f.required };
        }
        return f;
      })
    );
  };

  const handleAddCustomField = () => {
    if (!customLabel.trim()) return;

    const fieldName = customLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const options = customType === 'select'
      ? customOptionsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const newField = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: fieldName,
      label: customLabel.trim(),
      type: customType,
      options,
      required: customRequired,
      isCustom: true
    };

    setFieldsState((prev) => [...prev, newField]);
    setCustomLabel('');
    setCustomOptionsStr('');
    setCustomType('text');
    setCustomRequired(false);
  };

  const handleStartEditField = (field) => {
    const fieldId = field.id || field.name;
    setEditingFieldId(fieldId);
    setEditLabel(field.label || '');
    setEditType(field.type || 'text');
    setEditOptionsStr(field.options ? field.options.join(', ') : '');
    setEditRequired(Boolean(field.required));
  };

  const handleSaveEditField = (fieldId) => {
    if (!editLabel.trim()) return;

    const options = editType === 'select'
      ? editOptionsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    setFieldsState((prev) =>
      prev.map((f) => {
        if (f.id === fieldId || f.name === fieldId) {
          return {
            ...f,
            label: editLabel.trim(),
            type: editType,
            options,
            required: editRequired
          };
        }
        return f;
      })
    );

    setEditingFieldId(null);
  };

  const handleRemoveCustomField = (fieldId) => {
    const targetField = fieldsState.find((f) => f.id === fieldId || f.name === fieldId);
    const label = targetField?.label || 'este campo';
    if (window.confirm(`¿Estás seguro de eliminar el campo "${label}"?`)) {
      setFieldsState((prev) => prev.filter((f) => f.id !== fieldId && f.name !== fieldId));
    }
  };

  const handleSaveModal = () => {
    onSave(section.id, fieldsState);
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-border-light rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-body">
        
        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-border-light flex items-center justify-between bg-bg-canvas/40">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 block mb-1">
              Configuración de Formulario
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
              Campos de Publicación para "{section.name}"
            </h2>
            <p className="text-xs text-primary/50 mt-1">
              Marque qué campos deberá completar el usuario o vendedor al crear una publicación en esta sección.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-primary/40 hover:text-primary hover:bg-bg-canvas transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-8 flex-1">
          
          {/* Preset Categories */}
          {categories.map((catName) => {
            const catPresets = FIELD_PRESETS.filter((p) => p.category === catName);
            return (
              <div key={catName} className="space-y-3">
                <h3 className="text-xs font-black tracking-widest text-primary/60 uppercase border-b border-border-light pb-2">
                  {catName}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catPresets.map((preset) => {
                    const selected = isPresetSelected(preset.id);
                    const req = isPresetRequired(preset.id);

                    return (
                      <div
                        key={preset.id}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                          selected
                            ? 'bg-primary/5 border-primary/30 shadow-xs'
                            : 'bg-white border-border-light hover:border-primary/20'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer select-none min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => togglePreset(preset)}
                            className="w-4 h-4 rounded border-border-light text-primary focus:ring-0 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <span className={`text-xs font-bold block truncate ${selected ? 'text-primary' : 'text-primary/70'}`}>
                              {preset.label}
                            </span>
                            <span className="text-[9px] text-primary/40 font-mono">({preset.type})</span>
                          </div>
                        </label>

                        {selected && (
                          <button
                            type="button"
                            onClick={() => toggleRequired(preset.id)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              req
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                          >
                            {req ? 'Obligatorio' : 'Opcional'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Custom Extra Fields Section */}
          <div className="space-y-4 pt-4 border-t border-border-light">
            <h3 className="text-xs font-black tracking-widest text-primary/60 uppercase flex items-center gap-2">
              <Sliders size={14} />
              <span>Campos Extra Creados a Medida</span>
            </h3>

            {/* List of custom non-preset fields */}
            {fieldsState.filter((f) => f.isCustom || !FIELD_PRESETS.some((p) => p.id === f.id)).length > 0 && (
              <div className="space-y-2">
                {fieldsState.filter((f) => f.isCustom || !FIELD_PRESETS.some((p) => p.id === f.id)).map((field) => {
                  const fieldId = field.id || field.name;
                  const isEditing = editingFieldId === fieldId;

                  if (isEditing) {
                    return (
                      <div key={fieldId} className="p-4 bg-primary/5 border border-primary/30 rounded-2xl space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                            Editar Campo: {field.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingFieldId(null)}
                            className="text-xs text-primary/40 hover:text-primary font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Etiqueta / Nombre"
                            className="w-full bg-white border border-border-light text-xs font-semibold text-primary rounded-xl py-2 px-3 outline-none"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                          />

                          <CustomSelect
                            value={editType}
                            onChange={(val) => setEditType(val)}
                            options={[
                              { label: 'Texto libre', value: 'text' },
                              { label: 'Número', value: 'number' },
                              { label: 'Selección (Dropdown)', value: 'select' }
                            ]}
                          />
                        </div>

                        {editType === 'select' && (
                          <input
                            type="text"
                            placeholder="Opciones separadas por coma (ej: Negro, Blanco, Rojo)"
                            className="w-full bg-white border border-border-light text-xs text-primary rounded-xl py-2 px-3 outline-none"
                            value={editOptionsStr}
                            onChange={(e) => setEditOptionsStr(e.target.value)}
                          />
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editRequired}
                              onChange={(e) => setEditRequired(e.target.checked)}
                              className="rounded border-border-light text-primary focus:ring-0"
                            />
                            <span>Es Obligatorio</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingFieldId(null)}
                              className="px-3 py-1.5 border border-border-light text-xs font-bold rounded-lg text-primary/60 hover:bg-bg-canvas cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditField(fieldId)}
                              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-1.5 px-4 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <CheckCircle2 size={13} />
                              <span>Actualizar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={fieldId}
                      className="p-3 bg-bg-canvas/70 border border-border-light rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">{field.label}</span>
                          <span className="text-[10px] text-primary/40 font-mono">({field.type})</span>
                        </div>
                        {field.type === 'select' && field.options?.length > 0 && (
                          <span className="text-[10px] text-primary/50 font-medium truncate max-w-xs mt-0.5">
                            Opciones: {field.options.join(', ')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRequired(fieldId)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer ${
                            field.required ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {field.required ? 'Obligatorio' : 'Opcional'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEditField(field)}
                          className="text-primary/40 hover:text-primary p-1.5 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors"
                          title="Editar campo"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(fieldId)}
                          className="text-primary/30 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                          title="Eliminar campo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}


            {/* Add Custom Field Form */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider block">
                + Crear Otro Campo Personalizado
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Etiqueta / Nombre (ej: Rodado / Cuadro / Cilindrada)"
                  className="w-full bg-white border border-border-light text-xs text-primary font-medium rounded-xl py-2.5 px-3 outline-none"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                />

                <CustomSelect
                  value={customType}
                  onChange={(val) => setCustomType(val)}
                  options={[
                    { label: 'Texto libre', value: 'text' },
                    { label: 'Número', value: 'number' },
                    { label: 'Selección (Dropdown)', value: 'select' }
                  ]}
                />
              </div>

              {customType === 'select' && (
                <input
                  type="text"
                  placeholder="Opciones separadas por coma (ej: Carbono, Aluminio, Acero)"
                  className="w-full bg-white border border-border-light text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                  value={customOptionsStr}
                  onChange={(e) => setCustomOptionsStr(e.target.value)}
                />
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customRequired}
                    onChange={(e) => setCustomRequired(e.target.checked)}
                    className="rounded border-border-light text-primary focus:ring-0"
                  />
                  <span>Es Obligatorio</span>
                </label>

                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  <span>Agregar Campo Extra</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-border-light flex items-center justify-between bg-bg-canvas/30">
          <span className="text-xs font-semibold text-primary/50">
            Campos seleccionados: <strong>{fieldsState.length}</strong>
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-border-light hover:bg-bg-canvas text-xs font-bold uppercase tracking-wider text-primary rounded-xl cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveModal}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold uppercase tracking-wider py-3 px-6 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-md"
            >
              <CheckCircle2 size={16} />
              <span>Guardar Campos</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
