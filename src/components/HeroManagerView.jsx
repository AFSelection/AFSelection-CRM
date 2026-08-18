import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { ImageIcon, Plus, Trash2, MoveUp, MoveDown, Save, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=2400&q=95'
];

async function loadHeroImages() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'hero_images')
    .maybeSingle();
  if (error || !data) return DEFAULT_IMAGES;
  const val = data.value;
  return Array.isArray(val) && val.length > 0 ? val : DEFAULT_IMAGES;
}

async function saveHeroImages(images) {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: 'hero_images', value: images }, { onConflict: 'key' });
  if (error) throw error;
}

export default function HeroManagerView() {
  const [images, setImages]   = useState([]);
  const [newUrl, setNewUrl]   = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null); // { type: 'ok'|'err', msg }

  useEffect(() => {
    loadHeroImages().then((imgs) => {
      setImages(imgs);
      setLoading(false);
    });
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAdd = () => {
    const url = newUrl.trim();
    if (!url) return;
    if (!url.startsWith('http')) {
      showToast('err', 'La URL debe comenzar con http:// o https://');
      return;
    }
    if (images.includes(url)) {
      showToast('err', 'Esa imagen ya está en la lista.');
      return;
    }
    setImages((prev) => [...prev, url]);
    setNewUrl('');
  };

  const handleRemove = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMove = (idx, dir) => {
    const next = [...images];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setImages(next);
  };

  const handleSave = async () => {
    if (images.length === 0) {
      showToast('err', 'Debe haber al menos una imagen.');
      return;
    }
    setSaving(true);
    try {
      await saveHeroImages(images);
      showToast('ok', 'Imágenes del Hero guardadas correctamente.');
    } catch (e) {
      showToast('err', 'Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-primary tracking-tight">
            IMÁGENES DEL HERO
          </h1>
          <p className="text-xs text-primary/50 mt-1 font-medium">
            Administrá las fotos de fondo que se muestran en el banner principal del sitio.
            Si hay más de una, se irán rotando automáticamente con efecto Ken Burns.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Guardando…' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold ${
          toast.type === 'ok'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {toast.type === 'ok'
            ? <CheckCircle2 size={16} />
            : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Add new URL row */}
      <div className="bg-white border border-border-light rounded-3xl p-6 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-primary/40">
          Agregar imagen
        </h2>
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 bg-bg-canvas border border-border-light rounded-2xl px-4 py-3 focus-within:border-primary transition-colors">
            <ImageIcon size={16} className="text-primary/30 flex-shrink-0" />
            <input
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-transparent text-sm text-primary placeholder:text-primary/30 outline-none"
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-primary text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-2xl hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>
        <p className="text-[11px] text-primary/35 font-medium leading-relaxed">
          Usá URLs directas de imágenes (terminan en .jpg, .png, .webp) o links de Unsplash, Cloudinary, etc.
          Recomendamos imágenes horizontales de al menos 1920×1080 px.
        </p>
      </div>

      {/* Image list */}
      <div className="bg-white border border-border-light rounded-3xl p-6 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-primary/40">
          Imágenes activas — {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
        </h2>

        {images.length === 0 ? (
          <div className="text-center py-12 text-primary/30 text-sm font-semibold">
            Sin imágenes. Agregá al menos una.
          </div>
        ) : (
          <div className="space-y-3">
            {images.map((url, i) => (
              <div
                key={url + i}
                className="flex items-center gap-4 p-3 rounded-2xl border border-border-light hover:border-primary/20 bg-bg-canvas group transition-all"
              >
                {/* Thumbnail */}
                <div className="w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-primary/5">
                  <img
                    src={url}
                    alt={`Hero ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>

                {/* URL text */}
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-primary/60 truncate block">
                    Imagen {i + 1}
                  </span>
                  <span className="text-[10px] text-primary/35 truncate block mt-0.5">
                    {url}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    title="Ver imagen"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => handleMove(i, -1)}
                    disabled={i === 0}
                    title="Subir"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-20 cursor-pointer"
                  >
                    <MoveUp size={13} />
                  </button>
                  <button
                    onClick={() => handleMove(i, 1)}
                    disabled={i === images.length - 1}
                    title="Bajar"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-20 cursor-pointer"
                  >
                    <MoveDown size={13} />
                  </button>
                  <button
                    onClick={() => handleRemove(i)}
                    title="Eliminar"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
