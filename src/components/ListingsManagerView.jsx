import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, MapPin, Image as ImageIcon, Search, X, ArrowUp, ArrowDown, Upload, Film, Play, Percent } from 'lucide-react';
import { saveListingDB, deleteListingDB } from '../services/storage';
import { supabase } from '../services/supabase';
import { compressImage } from '../utils/compressor';
import ConfirmModal from './ConfirmModal';

// Location search with Nominatim (OpenStreetMap) geocoding
function LocationSearch({ location, onTextChange, onSelect }) {
  const [query, setQuery] = useState(location || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setQuery(location || '');
  }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = async (q) => {
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    setSearching(true);
    try {
      const base = 'https://nominatim.openstreetmap.org/search';
      const headers = { 'Accept-Language': 'es' };
      const p1 = new URLSearchParams({ format: 'json', q, countrycodes: 'ar', limit: '7', addressdetails: '1' });
      const res1 = await fetch(`${base}?${p1}`, { headers });
      if (!res1.ok) throw new Error(`HTTP ${res1.status}`);
      let data = await res1.json();

      if (data.length === 0) {
        // Fallback: sin restricción de país para mejor cobertura
        const p2 = new URLSearchParams({ format: 'json', q, limit: '7', addressdetails: '1' });
        const res2 = await fetch(`${base}?${p2}`, { headers });
        if (res2.ok) data = await res2.json();
      }

      setResults(data);
      setOpen(data.length > 0);
    } catch (err) {
      console.error('[LocationSearch]', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const buildLabel = (item) => {
    const a = item.address || {};
    const parts = [];
    if (a.road) {
      parts.push(a.house_number ? `${a.road} ${a.house_number}` : a.road);
    }
    const area = a.suburb || a.city_district || a.town || a.village;
    if (area) parts.push(area);
    const city = a.city || a.municipality;
    if (city && city !== area) parts.push(city);
    if (a.state) parts.push(a.state);
    return parts.length > 0
      ? parts.join(', ')
      : item.display_name.split(',').slice(0, 3).join(',').trim();
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onTextChange(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 500);
  };

  const handleSelect = (item) => {
    const label = buildLabel(item);
    setQuery(label);
    setOpen(false);
    onSelect({ location: label, lat: item.lat, lng: item.lon });
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/30 pointer-events-none" />
        <input
          type="text"
          className="w-full bg-bg-canvas border border-border-light focus:border-primary focus:bg-white text-xs text-primary rounded-xl py-3.5 pl-9 pr-9 outline-none transition-colors"
          placeholder="Buscar dirección o barrio..."
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {searching && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-border-light rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-bg-canvas/50">
          {results.map((item) => (
            <div
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="flex items-start gap-3 px-4 py-3 text-xs cursor-pointer hover:bg-bg-canvas transition-colors"
            >
              <MapPin size={12} className="text-primary/30 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold text-primary truncate">{buildLabel(item)}</div>
                <div className="text-primary/35 text-[10px] truncate mt-0.5">{item.display_name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Reusable Custom Styled Select Component (Tailwind Custom Select)
function CustomSelect({ label, value, onChange, options, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative space-y-1.5 font-body">
      {label && (
        <label className="text-[10px] font-extrabold tracking-widest text-primary/45 uppercase block">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-bg-canvas border border-border-light hover:border-primary text-xs font-bold text-primary rounded-xl py-3.5 px-4.5 flex items-center justify-between cursor-pointer select-none transition-all duration-200 outline-none disabled:opacity-50"
      >
        <span>{selectedOption?.label || 'Seleccionar...'}</span>
        <span className="text-primary/30 text-[10px] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-border-light rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-bg-canvas/40">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-4.5 py-3 text-xs font-semibold cursor-pointer hover:bg-bg-canvas transition-colors ${
                opt.value === value ? 'bg-primary/5 text-primary font-black' : 'text-primary/70'
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ListingsManagerView({ data, setData, refreshData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Custom Confirm Popup state
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

  const showNoticeModal = ({ title = 'Atención', message, variant = 'info' }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      variant,
      confirmText: 'Entendido',
      cancelText: '',
      isNotice: true,
      loading: false,
      onConfirmHandler: () => setModalState((prev) => ({ ...prev, isOpen: false }))
    });
  };

  // Media uploads states
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [videoLinkInput, setVideoLinkInput] = useState('');

  const tempIdRef = useRef('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    price: '',
    discountPrice: '',
    currency: 'USD',
    sectionId: 'autos',
    category: '',
    condition: 'Usado',
    location: '',
    lat: '',
    lng: '',
    year: '',
    kilometers: '',
    fuel: 'Nafta',
    transmission: 'Automático',
    surface: '',
    rooms: '',
    bedrooms: '',
    bathrooms: '',
    garages: '',
    featured: false,
    description: '',
    isOffer: false,
    oldPrice: '',
    operationType: 'Venta',
    showAddress: true
  });

  // Custom Fields state for the active section
  const [customFieldValues, setCustomFieldValues] = useState({});

  const sections = data.sections || [];
  const listings = data.listings || [];

  const uploadFileToStorage = async (file, itemId) => {
    const fileToUpload = file.type?.startsWith('image/') ? await compressImage(file) : file;
    const fileExt = fileToUpload.name.split('.').pop();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileName = `${randomStr}_${Date.now()}.${fileExt}`;
    const filePath = `${itemId}/${fileName}`;

    const { data: uploadData, error } = await supabase.storage
      .from('listings')
      .upload(filePath, fileToUpload);

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('listings')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleOpenAdd = async () => {
    tempIdRef.current = `item-${Date.now()}`;
    setEditingItem(null);
    setUploadedImages([]);
    setUploadedVideos([]);
    setCustomFieldValues({});

    setFormData({
      title: '',
      subtitle: '',
      price: '',
      discountPrice: '',
      currency: 'USD',
      sectionId: sections[0]?.id || 'autos',
      category: sections[0]?.categories?.[0] || '',
      condition: 'Usado',
      location: 'Tucumán, Argentina',
      lat: '-26.816',
      lng: '-65.316',
      year: '2024',
      kilometers: '0',
      fuel: 'Nafta',
      transmission: 'Automático',
      surface: '120',
      rooms: '3',
      bedrooms: '2',
      bathrooms: '2',
      garages: '1',
      featured: false,
      description: '',
      isOffer: false,
      oldPrice: '',
      operationType: 'Venta',
      showAddress: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    tempIdRef.current = item.id;
    setEditingItem(item);
    setUploadedImages(item.images || []);
    setUploadedVideos(item.videos || []);
    setCustomFieldValues(item.customFields || item.specs || {});

    const isCurrentlyDiscounted = Boolean(item.isOffer) && item.oldPrice && Number(item.oldPrice) > Number(item.price);

    setFormData({
      title: item.title || '',
      subtitle: item.subtitle || '',
      price: isCurrentlyDiscounted ? String(item.oldPrice) : (item.price !== undefined ? String(item.price) : ''),
      discountPrice: isCurrentlyDiscounted ? String(item.price) : '',
      currency: item.currency || 'USD',
      sectionId: item.sectionId || 'autos',
      category: item.category || '',
      condition: item.condition || 'Usado',
      location: item.location || '',
      lat: item.coordinates?.lat || '',
      lng: item.coordinates?.lng || '',
      year: item.year || '',
      kilometers: item.kilometers !== undefined ? item.kilometers : '',
      fuel: item.fuel || 'Nafta',
      transmission: item.transmission || 'Automático',
      surface: item.surface || '',
      rooms: item.rooms || '',
      bedrooms: item.bedrooms || '',
      bathrooms: item.bathrooms || '',
      garages: item.garages || '',
      featured: item.featured || false,
      description: item.description || '',
      isOffer: isCurrentlyDiscounted,
      oldPrice: item.oldPrice !== undefined && item.oldPrice !== null ? String(item.oldPrice) : '',
      operationType: item.operationType || 'Venta',
      showAddress: item.showAddress ?? true
    });
    setIsModalOpen(true);
  };


  const handleImageUploadChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadProgress('Subiendo imágenes...');
    try {
      const newUrls = [];
      for (const file of files) {
        const url = await uploadFileToStorage(file, tempIdRef.current);
        newUrls.push(url);
      }
      setUploadedImages((prev) => [...prev, ...newUrls]);
    } catch (err) {
      alert('Error al subir archivos. Asegurate de que el bucket "listings" esté configurado como Público en Supabase Storage.');
      console.error(err);
    } finally {
      setUploadProgress(null);
    }
  };

  const handleVideoUploadChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxMb = 50;
    if (file.size > maxMb * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      alert(`El video pesa ${sizeMb}MB. El límite máximo de almacenamiento en la nube es de ${maxMb}MB.\n\nPor favor seleccioná un archivo más liviano o utilizá el link de Instagram Reel.`);
      e.target.value = '';
      return;
    }

    setUploadProgress('Subiendo video...');
    try {
      const url = await uploadFileToStorage(file, tempIdRef.current);
      setUploadedVideos((prev) => [...prev, url]);
    } catch (err) {
      let msg = err.message || '';
      if (msg.includes('exceeded') || msg.includes('maximum allowed size') || msg.includes('payload too large')) {
        msg = 'El video supera el límite de 50MB. Te recomendamos comprimirlo antes de subirlo o usar el link de Instagram Reel.';
      }
      alert('Error al subir el video: ' + msg);
      console.error(err);
    } finally {
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleAddVideoLink = () => {
    if (!videoLinkInput.trim()) return;
    setUploadedVideos((prev) => [...prev, videoLinkInput.trim()]);
    setVideoLinkInput('');
  };

  const moveImage = (index, direction) => {
    const updated = [...uploadedImages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setUploadedImages(updated);
  };

  const removeImage = (index) => {
    showConfirmModal({
      title: '¿Quitar Imagen?',
      message: '¿Estás seguro de quitar esta imagen del borrador de la publicación?',
      variant: 'danger',
      confirmText: 'Quitar Imagen',
      onConfirm: () => {
        setUploadedImages((prev) => prev.filter((_, i) => i !== index));
      }
    });
  };

  const removeVideo = (index) => {
    showConfirmModal({
      title: '¿Quitar Video?',
      message: '¿Estás seguro de quitar este video del borrador de la publicación?',
      variant: 'danger',
      confirmText: 'Quitar Video',
      onConfirm: () => {
        setUploadedVideos((prev) => prev.filter((_, i) => i !== index));
      }
    });
  };


  const handleDelete = (id) => {
    showConfirmModal({
      title: '¿Eliminar Publicación?',
      message: '¿Estás seguro de eliminar esta publicación? Se eliminará inmediatamente del sitio web.',
      variant: 'danger',
      confirmText: 'Eliminar Publicación',
      onConfirm: async () => {
        try {
          await deleteListingDB(id);
          await refreshData();
        } catch (err) {
          showNoticeModal({
            title: 'Error',
            message: 'Ocurrió un error al intentar eliminar la publicación.',
            variant: 'danger'
          });
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price) return;

    // Validate required custom fields for the selected section
    const currentSecObj = sections.find((s) => s.id === formData.sectionId);
    if (currentSecObj && currentSecObj.customFields && currentSecObj.customFields.length > 0) {
      for (const field of currentSecObj.customFields) {
        if (field.required && (!customFieldValues[field.name] || !String(customFieldValues[field.name]).trim())) {
          alert(`El campo "${field.label}" es obligatorio para la sección "${currentSecObj.name}".`);
          return;
        }
      }
    }

    setLoading(true);

    const isDiscountActive = Boolean(formData.isOffer) && formData.discountPrice && Number(formData.discountPrice) < Number(formData.price);

    const newItem = {
      id: tempIdRef.current,
      title: formData.title,
      subtitle: formData.subtitle,
      price: isDiscountActive ? Number(formData.discountPrice) : Number(formData.price),
      oldPrice: isDiscountActive ? Number(formData.price) : null,
      isOffer: isDiscountActive,
      currency: formData.currency,
      sectionId: formData.sectionId,
      category: formData.category,
      condition: formData.condition,
      location: formData.location,
      featured: formData.featured,
      description: formData.description,
      images: uploadedImages,
      videos: uploadedVideos,
      operationType: formData.operationType || 'Venta',
      showAddress: formData.showAddress !== false,
      specs: customFieldValues,
      customFields: customFieldValues
    };

    // Specific specs based on section
    if (formData.sectionId === 'autos') {
      const cleanYear = String(formData.year || '').replace(/[^\d]/g, '');
      const cleanKm = String(formData.kilometers || '').replace(/[^\d]/g, '');
      newItem.year = cleanYear ? parseInt(cleanYear, 10) : 2024;
      newItem.kilometers = cleanKm ? parseInt(cleanKm, 10) : 0;
      newItem.fuel = formData.fuel;
      newItem.transmission = formData.transmission;
    } else if (formData.sectionId === 'propiedades') {
      newItem.surface = Number(formData.surface) || 0;
      newItem.rooms = Number(formData.rooms) || 1;
      newItem.bedrooms = Number(formData.bedrooms) || 1;
      newItem.bathrooms = Number(formData.bathrooms) || 1;
      newItem.garages = Number(formData.garages) || 0;

      if (formData.lat && formData.lng) {
        newItem.coordinates = {
          lat: Number(formData.lat),
          lng: Number(formData.lng)
        };
      }
    } else if (formData.sectionId === 'inversiones') {
      newItem.fuel = formData.fuel;
      newItem.surface = Number(formData.surface) || 0;
      newItem.rooms = Number(formData.rooms) || 0;
    }


    try {
      await saveListingDB(newItem);
      await refreshData();
      setIsModalOpen(false);
    } catch (err) {
      alert('Error al guardar la publicación en Supabase: ' + (err.message || 'Error desconocido'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportDefaults = async () => {
    setLoading(true);
    try {
      const defaultListings = [
        {
          id: 'auto-1',
          title: 'Porsche 911 Carrera S',
          subtitle: '3.0 Carrera S 450 CV PDK',
          price: 195000,
          currency: 'USD',
          sectionId: 'autos',
          category: 'Deportivo',
          featured: true,
          condition: 'Usado',
          year: 2023,
          kilometers: 8500,
          fuel: 'Nafta',
          transmission: 'Automático PDK',
          location: 'Puerto Madero, Buenos Aires',
          images: [
            'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80'
          ],
          description: 'Excelente estado, único dueño, services oficiales al día. Equipamiento completo Sport Chrono, escape deportivo, llantas RS Spyder 20/21", audio Bose High-End.',
          specs: {
            'Motor': '3.0 Boxter Twin-Turbo',
            'Potencia': '450 CV',
            'Aceleración (0-100)': '3.5s',
            'Tracción': 'Trasera',
            'Color Exterior': 'Gris Crayon',
            'Interior': 'Cuero Negro / Alcantara'
          }
        },
        {
          id: 'prop-1',
          title: 'Penthouse de Lujo en Torre Renoir',
          subtitle: 'Vista 360° al Río de la Plata y Puerto Madero',
          price: 850000,
          currency: 'USD',
          sectionId: 'propiedades',
          category: 'Departamentos',
          featured: true,
          condition: 'Excelente',
          surface: 280,
          rooms: 4,
          bedrooms: 3,
          bathrooms: 4,
          garages: 2,
          location: 'Puerto Madero, Buenos Aires',
          coordinates: { lat: -34.6135, lng: -58.3632 },
          images: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
          ],
          description: 'Impresionante Penthouse piso alto en Puerto Madero. Master suite con vestidor doble, hidromasaje y terraza privada. Amenities full: Piscina climatizada, gimnasio, spa, microcine y seguridad 24hs.',
          specs: {
            'Superficie Total': '280 m²',
            'Superficie Cubierta': '240 m²',
            'Expensas': '$180.000 ARS',
            'Disposición': 'Frente',
            'Orientación': 'Noreste',
            'Antigüedad': '5 años'
          }
        },
        {
          id: 'auto-2',
          title: 'BMW M4 Competition xDrive',
          subtitle: '3.0 TwinPower Turbo 510 CV',
          price: 165000,
          currency: 'USD',
          sectionId: 'autos',
          category: 'Deportivo',
          featured: true,
          condition: 'Usado',
          year: 2022,
          kilometers: 12000,
          fuel: 'Nafta',
          transmission: 'Automático Steptronic',
          location: 'Nordelta, Tigre',
          images: [
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'
          ],
          description: 'Impecable estado. Tracción integral xDrive M.',
          specs: {
            'Motor': '3.0 L6 TwinPower',
            'Potencia': '510 CV'
          }
        },
        {
          id: 'prop-2',
          title: 'Mansión al Lago en Nordelta',
          subtitle: 'Diseño arquitectónico exclusivo con amarra privada',
          price: 1450000,
          currency: 'USD',
          sectionId: 'propiedades',
          category: 'Casas',
          featured: true,
          condition: 'A Estrenar',
          surface: 650,
          rooms: 6,
          bedrooms: 5,
          bathrooms: 6,
          garages: 4,
          location: 'Nordelta, Tigre',
          coordinates: { lat: -34.4082, lng: -58.6475 },
          images: [
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80'
          ],
          description: 'Exclusiva residencia sobre lote al lago principal.'
        }
      ];

      for (const item of defaultListings) {
        await saveListingDB(item);
      }
      await refreshData();
      alert('¡Unidades iniciales de prueba importadas correctamente en Supabase!');
    } catch (err) {
      console.error(err);
      alert('Error al importar las publicaciones.');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((item) => {
    if (selectedSectionFilter !== 'all' && item.sectionId !== selectedSectionFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return item.title?.toLowerCase().includes(q) || item.location?.toLowerCase().includes(q);
    }
    return true;
  });

  const activeSectionObj = sections.find((s) => s.id === formData.sectionId);
  const categoriesForForm = activeSectionObj
    ? activeSectionObj.categories.map((c) => ({ label: c, value: c }))
    : [];

  const sectionOptions = sections.map((s) => ({ label: s.name, value: s.id }));
  const currencyOptions = [
    { label: 'USD (Dólares)', value: 'USD' },
    { label: 'ARS (Pesos)', value: 'ARS' }
  ];
  const conditionOptions = [
    { label: 'Nuevo (0km)', value: '0km' },
    { label: 'Usado', value: 'Usado' },
    { label: 'A Estrenar (Propiedades)', value: 'A Estrenar' },
    { label: 'En Pozo (Propiedades)', value: 'En Pozo' }
  ];
  const fuelOptions = [
    { label: 'Nafta', value: 'Nafta' },
    { label: 'Diesel', value: 'Diesel' },
    { label: 'Híbrido', value: 'Híbrido' },
    { label: 'Eléctrico', value: 'Eléctrico' }
  ];
  const operationTypeOptions = [
    { label: 'Venta', value: 'Venta' },
    { label: 'Alquiler', value: 'Alquiler' }
  ];
  const transmissionOptions = [
    { label: 'Automático', value: 'Automático' },
    { label: 'Manual', value: 'Manual' },
    { label: 'PDK', value: 'PDK' }
  ];

  if (isModalOpen) {
    return (
      <div className="space-y-6 font-body pb-12">
        
        {/* Header section with Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-light">
          <div className="flex items-center gap-4.5">
            <button
              onClick={() => setIsModalOpen(false)}
              className="inline-flex items-center justify-center bg-white border border-border-light hover:border-primary text-primary text-xs font-black uppercase tracking-wider py-3 px-5 rounded-xl cursor-pointer transition-colors"
            >
              ← Volver
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                {editingItem ? 'Editar Publicación' : 'Agregar Publicación'}
              </h1>
              <p className="text-xs text-primary/45 mt-0.5">
                {editingItem ? `ID: ${editingItem.id}` : 'Completá los datos para cargar un nuevo activo al catálogo.'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-3 border border-border-light text-primary hover:bg-bg-canvas text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!uploadProgress}
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Guardar Publicación</span>
              )}
            </button>
          </div>
        </div>

        {/* Main form columns grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - General Form Inputs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              
              {/* Section & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CustomSelect
                  label="Sección"
                  value={formData.sectionId}
                  onChange={(val) => {
                    const matched = sections.find(s => s.id === val);
                    setFormData({
                      ...formData,
                      sectionId: val,
                      category: matched?.categories?.[0] || ''
                    });
                  }}
                  options={sectionOptions}
                />
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">Título de la publicación *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-bg-canvas border border-border-light focus:border-primary focus:bg-white text-xs text-primary rounded-xl py-3.5 px-4 outline-none transition-colors"
                    placeholder="Ej: Porsche 911 GT3 RS / Mansión al Lago"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">
                  {formData.sectionId === 'inversiones' ? 'Empresa / Desarrolladora' : 'Subtítulo o versión comercial'}
                </label>
                <input
                  type="text"
                  className="w-full bg-bg-canvas border border-border-light focus:border-primary focus:bg-white text-xs text-primary rounded-xl py-3.5 px-4 outline-none transition-colors"
                  placeholder={formData.sectionId === 'inversiones' ? 'Ej: Grupo Constructor Alem' : 'Ej: Motor 4.0L Weissach Package / Residencia con salida al golf'}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>

              {/* Price, Currency, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">Precio Original / Base *</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-bg-canvas border border-border-light focus:border-primary focus:bg-white text-xs text-primary rounded-xl py-3.5 px-4 outline-none transition-colors"
                    placeholder="Ej: 100000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <CustomSelect
                  label="Moneda"
                  value={formData.currency}
                  onChange={(val) => setFormData({ ...formData, currency: val })}
                  options={currencyOptions}
                />
                <CustomSelect
                  label="Categoría"
                  value={formData.category}
                  onChange={(val) => setFormData({ ...formData, category: val })}
                  options={categoriesForForm}
                />
              </div>

              {/* Price Drop (Offer) Section */}
              <div className="p-4.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="isOffer"
                    className="w-4.5 h-4.5 accent-emerald-600 cursor-pointer"
                    checked={formData.isOffer}
                    onChange={(e) => setFormData({ ...formData, isOffer: e.target.checked })}
                  />
                  <label htmlFor="isOffer" className="text-xs font-bold text-primary/80 uppercase cursor-pointer select-none tracking-wide">
                    ¿Esta unidad Bajó de Precio / Está en Descuento?
                  </label>
                </div>

                {formData.isOffer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold tracking-widest text-emerald-600 uppercase block">Nuevo Precio con Descuento *</label>
                      <input
                        type="number"
                        required
                        className="w-full bg-white border border-emerald-300 focus:border-emerald-600 text-xs text-primary font-bold rounded-xl py-3.5 px-4 outline-none"
                        placeholder="Ej: 85000"
                        value={formData.discountPrice}
                        onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center pb-1 text-xs text-primary/60 font-semibold leading-relaxed">
                      El producto se venderá a este nuevo precio con descuento, mostrando el precio original ({formData.currency} {Number(formData.price || 0).toLocaleString()}) tachado con la insignia % DESCUENTO. Al destildar la opción, volverá automáticamente al precio original.
                    </div>
                  </div>
                )}
              </div>

              {/* Location & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">Ubicación física</label>
                  <LocationSearch
                    location={formData.location}
                    onTextChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
                    onSelect={({ location, lat, lng }) => setFormData(prev => ({ ...prev, location, lat, lng }))}
                  />
                  {formData.sectionId === 'propiedades' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="showAddress"
                        className="w-3.5 h-3.5 accent-primary cursor-pointer flex-shrink-0"
                        checked={formData.showAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, showAddress: e.target.checked }))}
                      />
                      <label htmlFor="showAddress" className="text-[10px] font-bold text-primary/50 cursor-pointer select-none leading-tight">
                        Mostrar dirección exacta (altura) en la publicación
                      </label>
                    </div>
                  )}
                </div>
                <CustomSelect
                  label="Estado / Condición"
                  value={formData.condition}
                  onChange={(val) => setFormData({ ...formData, condition: val })}
                  options={conditionOptions}
                />
              </div>

              {/* Operation type — only for propiedades */}
              {formData.sectionId === 'propiedades' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <CustomSelect
                    label="Tipo de Operación"
                    value={formData.operationType}
                    onChange={(val) => setFormData({ ...formData, operationType: val })}
                    options={operationTypeOptions}
                  />
                </div>
              )}

              {/* Specifications box for built-in sections */}
              {['autos', 'propiedades', 'inversiones'].includes(formData.sectionId) && (
                <div className="p-5 bg-bg-canvas/50 border border-border-light rounded-2xl space-y-5">
                  <h4 className="text-[10px] font-black tracking-widest text-primary/50 uppercase leading-none border-b border-border-light pb-3">
                    Especificaciones ({formData.sectionId === 'autos' ? 'Vehículo' : formData.sectionId === 'inversiones' ? 'Inversión' : 'Propiedad'})
                  </h4>

                  {formData.sectionId === 'autos' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Año</label>
                        <input
                          type="number"
                          className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Kilometraje</label>
                        <input
                          type="number"
                          className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                          value={formData.kilometers}
                          onChange={(e) => setFormData({ ...formData, kilometers: e.target.value })}
                        />
                      </div>
                      <CustomSelect
                        label="Combustible"
                        value={formData.fuel}
                        onChange={(val) => setFormData({ ...formData, fuel: val })}
                        options={fuelOptions}
                      />
                      <CustomSelect
                        label="Transmisión"
                        value={formData.transmission}
                        onChange={(val) => setFormData({ ...formData, transmission: val })}
                        options={transmissionOptions}
                      />
                    </div>
                  ) : formData.sectionId === 'inversiones' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Retorno Estimado</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                          placeholder="Ej: 14-17% Anual"
                          value={formData.fuel}
                          onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Avance de Obra (%)</label>
                        <input
                          type="number"
                          className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                          placeholder="Ej: 62"
                          value={formData.surface}
                          onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Plazo (meses)</label>
                        <input
                          type="number"
                          className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                          placeholder="Ej: 18"
                          value={formData.rooms}
                          onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Sup. Total (m²)</label>
                          <input
                            type="number"
                            className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                            value={formData.surface}
                            onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Ambientes</label>
                          <input
                            type="number"
                            className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                            value={formData.rooms}
                            onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Dormitorios</label>
                          <input
                            type="number"
                            className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                            value={formData.bedrooms}
                            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Baños</label>
                          <input
                            type="number"
                            className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                            value={formData.bathrooms}
                            onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Cocheras</label>
                          <input
                            type="number"
                            className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                            value={formData.garages}
                            onChange={(e) => setFormData({ ...formData, garages: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Latitud Mapa</label>
                          <input
                            type="text"
                            className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                            value={formData.lat}
                            onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-primary/40 uppercase block">Longitud Mapa</label>
                          <input
                            type="text"
                            className="w-full bg-white border border-border-light focus:border-primary text-xs text-primary rounded-xl py-2.5 px-3 outline-none"
                            value={formData.lng}
                            onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Dynamic Custom Fields Box for Selected Section */}
              {activeSectionObj?.customFields && activeSectionObj.customFields.length > 0 && (
                <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-black tracking-widest text-primary uppercase leading-none border-b border-primary/10 pb-3 flex items-center justify-between">
                    <span>Campos Específicos: {activeSectionObj.name}</span>
                    <span className="text-[9px] text-primary/50 font-bold">Personalizados</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeSectionObj.customFields.map((field) => (
                      <div key={field.id || field.name} className="space-y-1.5">
                        <label className="text-[10px] font-extrabold tracking-widest text-primary/60 uppercase block">
                          {field.label} {field.required ? <span className="text-red-500">*</span> : <span className="text-primary/30 text-[9px]">(opcional)</span>}
                        </label>

                        {field.type === 'select' ? (
                          <CustomSelect
                            value={customFieldValues[field.name] || ''}
                            onChange={(val) => setCustomFieldValues({ ...customFieldValues, [field.name]: val })}
                            options={[{ label: `Seleccionar ${field.label}...`, value: '' }, ...(field.options || []).map(opt => ({ label: opt, value: opt }))]}
                          />
                        ) : (

                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            className="w-full bg-white border border-border-light focus:border-primary text-xs font-semibold text-primary rounded-xl py-3 px-3.5 outline-none"
                            placeholder={`Ej: ${field.label}`}
                            value={customFieldValues[field.name] || ''}
                            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">Descripción detallada</label>
                <textarea
                  rows={4}
                  className="w-full bg-bg-canvas border border-border-light focus:border-primary focus:bg-white text-xs text-primary rounded-xl py-3 px-4 outline-none transition-colors"
                  placeholder="Detalles sobre el estado, opcionales, confort..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

            </div>
          </div>

          {/* Right Column - Media Manager & Video (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Images Section */}
            <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold tracking-widest text-primary/70 uppercase">
                    Imágenes del Activo
                  </h3>
                  <p className="text-[10px] text-primary/40 mt-0.5">
                    Las primeras 2 definirán la portada y hover del catálogo.
                  </p>
                </div>

                <label className="inline-flex items-center justify-center gap-2 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Subir</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUploadChange}
                    disabled={loading || !!uploadProgress}
                  />
                </label>
              </div>

              {uploadProgress && (
                <div className="text-xs font-bold text-accent-emerald animate-pulse flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-accent-emerald/20 border-t-accent-emerald rounded-full animate-spin"></div>
                  <span>{uploadProgress}</span>
                </div>
              )}

              {/* PREVIEW GRID - 160px height cards */}
              {uploadedImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {uploadedImages.map((imgUrl, index) => {
                    let label = `Detalle #${index - 1}`;
                    let badgeColor = 'bg-black/60 text-white border-white/10';
                    if (index === 0) {
                      label = 'PORTADA PRINCIPAL';
                      badgeColor = 'bg-amber-500 text-white font-black shadow-md border-amber-600';
                    } else if (index === 1) {
                      label = 'PORTADA HOVER';
                      badgeColor = 'bg-primary text-white font-black shadow-md border-primary';
                    }

                    return (
                      <div
                        key={index}
                        className="relative h-[160px] bg-bg-canvas rounded-2xl overflow-hidden border border-border-light group shadow-sm flex flex-col justify-end"
                      >
                        <img
                          src={imgUrl}
                          alt={`Photo ${index}`}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        
                        {/* Floating actions */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/75 backdrop-blur-md p-1.5 rounded-xl shadow-md z-10">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveImage(index, 'up')}
                            className="p-1 text-white/70 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Subir prioridad"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === uploadedImages.length - 1}
                            onClick={() => moveImage(index, 'down')}
                            className="p-1 text-white/70 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Bajar prioridad"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bottom Role Badge Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent pt-8">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[8.5px] font-black tracking-widest uppercase border ${badgeColor}`}>
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-border-light rounded-2xl p-10 text-center text-xs font-semibold text-primary/30 italic bg-bg-canvas/20">
                  Sin imágenes cargadas. Presioná el botón superior para subir fotos de portada y del carrusel.
                </div>
              )}

            </div>

            {/* Videos Section */}
            <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
              <div>
                <h3 className="text-sm font-extrabold tracking-widest text-primary/70 uppercase">
                  Videos y Reels de Presentación
                </h3>
                <p className="text-[10px] text-primary/45 mt-0.5 leading-relaxed">
                  Podés subir un archivo de video (MP4 / MOV) para reproducción nativa en la web, y/o enlazar un Reel de Instagram.
                </p>
              </div>

              {/* Upload MP4 File Button (Big & Prominent) */}
              <div>
                <label className="w-full flex items-center justify-center gap-2.5 bg-primary text-white border border-primary text-xs font-black uppercase tracking-wider py-3.5 px-5 rounded-2xl cursor-pointer hover:bg-primary/90 transition-colors shadow-sm">
                  <Film className="w-4 h-4" />
                  <span>Subir Archivo de Video desde Dispositivo (MP4 / MOV)</span>
                  <input
                    type="file"
                    accept="video/mp4,video/mov,video/webm,video/*"
                    className="hidden"
                    onChange={handleVideoUploadChange}
                    disabled={loading || !!uploadProgress}
                  />
                </label>
              </div>

              {/* Link Instagram Reel input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">
                  O pegar Link de Instagram Reel / YouTube
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-bg-canvas border border-border-light focus:border-primary text-xs text-primary rounded-xl py-3 px-4 outline-none"
                    placeholder="https://www.instagram.com/reel/C3x9-V4xgL1/"
                    value={videoLinkInput}
                    onChange={(e) => setVideoLinkInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddVideoLink}
                    className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider px-4 rounded-xl cursor-pointer"
                  >
                    Enlazar
                  </button>
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress && uploadProgress.includes('video') && (
                <div className="text-xs font-bold text-accent-emerald animate-pulse flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-accent-emerald/20 border-t-accent-emerald rounded-full animate-spin"></div>
                  <span>{uploadProgress} (Guardando en la nube Supabase...)</span>
                </div>
              )}

              {/* Video items list */}
              {uploadedVideos.length > 0 ? (
                <div className="space-y-2">
                  {uploadedVideos.map((vidUrl, index) => {
                    const isMp4 = vidUrl.includes('.mp4') || vidUrl.includes('.mov') || vidUrl.includes('supabase.co');
                    const isIg = vidUrl.includes('instagram.com') || vidUrl.includes('instagr.am');
                    return (
                      <div
                        key={index}
                        className="bg-bg-canvas/40 border border-border-light rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate font-semibold text-primary/75">
                          {isMp4 ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded flex-shrink-0">MP4 NATIVO</span>
                          ) : isIg ? (
                            <span className="bg-pink-100 text-pink-700 text-[9px] font-black uppercase px-2 py-0.5 rounded flex-shrink-0">INSTAGRAM REEL</span>
                          ) : (
                            <Play className="w-4 h-4 text-accent-red flex-shrink-0" />
                          )}
                          <span className="truncate">{vidUrl}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a
                            href={vidUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary/40 hover:text-primary p-1.5 rounded-lg hover:bg-primary/5 cursor-pointer"
                            title="Probar reproducción"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => removeVideo(index)}
                            className="text-primary/30 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-3.5 text-[11px] font-medium text-amber-900/80 leading-relaxed">
                  💡 <b>Video por defecto:</b> Si no cargás un video personalizado para esta publicación, en la web se mostrará automáticamente el Video MP4 y Reel definidos en <i>Hero y Configuración del Sitio</i>.
                </div>
              )}
            </div>

            {/* Featured & Actions */}
            <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="featured"
                  className="w-4.5 h-4.5 accent-primary cursor-pointer"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                <label htmlFor="featured" className="text-xs font-extrabold text-primary/80 uppercase cursor-pointer select-none tracking-wide">
                  Destacar en Portada del Sitio
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3.5 border border-border-light text-primary hover:bg-bg-canvas text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !!uploadProgress}
                  onClick={handleSubmit}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Guardar Publicación</span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Custom Confirm & Notice Modal */}
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

  return (
    <div className="space-y-8 font-body">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            Gestión de Inventario
          </h1>
          <p className="text-sm text-primary/45 mt-1 leading-relaxed">
            Alta, modificación y baja de vehículos, propiedades y artículos publicados en el marketplace.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-full shadow-md cursor-pointer transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Publicación</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-primary/30" />
          <input
            type="text"
            className="w-full bg-white border border-border-light focus:border-primary text-sm text-primary rounded-xl py-3.5 pl-11 pr-4 outline-none transition-colors"
            placeholder="Buscar por título o ubicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedSectionFilter('all')}
            className={`px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer flex-shrink-0 transition-colors ${
              selectedSectionFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white border border-border-light text-primary hover:bg-bg-canvas'
            }`}
          >
            Todos ({listings.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSectionFilter(sec.id)}
              className={`px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer flex-shrink-0 transition-colors ${
                selectedSectionFilter === sec.id
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border-light text-primary hover:bg-bg-canvas'
              }`}
            >
              {sec.name}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid Stack */}
      {filteredListings.length === 0 ? (
        <div className="bg-white border border-border-light rounded-3xl p-16 text-center shadow-sm max-w-xl mx-auto space-y-6">
          <ImageIcon className="w-12 h-12 text-primary/20 mx-auto" />
          <div>
            <h3 className="font-bold text-base text-primary/70 mb-1">Sin Publicaciones en el Catálogo</h3>
            <p className="text-xs text-primary/40 leading-relaxed">
              {searchQuery ? 'No se encontraron publicaciones con ese filtro de búsqueda.' : 'La base de datos de Supabase está vacía. Podés crear una nueva publicación o importar las unidades de prueba para empezar.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={handleImportDefaults}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl cursor-pointer transition-colors duration-200 disabled:opacity-50"
            >
              <span>Importar Unidades de Prueba</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-border-light rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
            >
              {/* Thumbnail Image Container */}
              <div className="relative aspect-video bg-bg-canvas overflow-hidden">
                <img
                  src={item.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Badges Overlay */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <span className="bg-primary/80 backdrop-blur-md text-white text-[9px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
                    {item.category || item.sectionId}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {(Boolean(item.isOffer) && item.oldPrice && Number(item.oldPrice) > Number(item.price)) && (
                      <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1" title="Unidad en Descuento">
                        <Percent size={11} className="stroke-[3]" />
                        <span>Descuento</span>
                      </span>
                    )}

                    {item.featured && (
                      <span className="bg-amber-500 text-white text-[9px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                        ★ Destacada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Item Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-display font-black text-lg text-primary tracking-tight truncate leading-none">
                    {item.title}
                  </h3>
                  <span className="text-[10px] text-primary/35 font-bold uppercase block mt-1 tracking-wider">
                    ID: {item.id}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary/45 mt-2.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{item.location}</span>
                  </div>

                  {/* Specs Pill Summary */}
                  <div className="flex flex-wrap gap-1.5 mt-4 text-[10px] font-bold text-primary/60 uppercase">
                    {item.sectionId === 'autos' ? (
                      <>
                        <span className="bg-bg-canvas px-2.5 py-1 rounded-md">Año {item.year}</span>
                        <span className="bg-bg-canvas px-2.5 py-1 rounded-md">{item.kilometers?.toLocaleString()} KM</span>
                        <span className="bg-bg-canvas px-2.5 py-1 rounded-md">{item.transmission}</span>
                      </>
                    ) : item.sectionId === 'inversiones' ? (
                      <>
                        {item.fuel && <span className="bg-bg-canvas px-2.5 py-1 rounded-md">{item.fuel}</span>}
                        {item.surface != null && <span className="bg-bg-canvas px-2.5 py-1 rounded-md">{item.surface}% avance</span>}
                        {item.rooms != null && <span className="bg-bg-canvas px-2.5 py-1 rounded-md">{item.rooms} meses</span>}
                      </>
                    ) : (
                      <>
                        <span className="bg-bg-canvas px-2.5 py-1 rounded-md">{item.surface} M²</span>
                        <span className="bg-bg-canvas px-2.5 py-1 rounded-md">{item.rooms} Ambientes</span>
                        {item.operationType && item.operationType !== 'Venta' && (
                          <span className="bg-bg-canvas px-2.5 py-1 rounded-md">{item.operationType}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Price and Edit tools */}
                <div className="pt-4 border-t border-border-light flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-primary/30 uppercase tracking-widest block">
                      {item.sectionId === 'inversiones' ? 'Min. Inversión' : item.operationType === 'Alquiler' ? 'Precio Alquiler' : 'Precio Venta'}
                    </span>
                    <span className="text-base font-black text-accent-red tracking-tight leading-none block">
                      {item.currency || 'USD'} {item.price?.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2.5 bg-bg-canvas hover:bg-border-light text-primary/70 hover:text-primary rounded-xl cursor-pointer transition-colors duration-200"
                      title="Editar publicación"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2.5 bg-red-50 hover:bg-red-100 text-accent-red rounded-xl cursor-pointer transition-colors duration-200"
                      title="Eliminar publicación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirm & Notice Modal */}
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
