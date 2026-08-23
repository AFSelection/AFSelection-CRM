import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { compressImage } from '../utils/compressor';
import { ImageIcon, Plus, Trash2, MoveUp, MoveDown, Save, Loader2, CheckCircle2, AlertCircle, ExternalLink, Upload, Play, Video } from 'lucide-react';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=2400&q=95'
];

const DEFAULT_VIDEO_URL = 'https://www.instagram.com/reel/C3x9-V4xgL1/';

async function loadHeroImages() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'hero_images')
    .maybeSingle();
  if (error || !data) return DEFAULT_IMAGES;
  const val = data.value;
  return Array.isArray(val) ? val : DEFAULT_IMAGES;
}

async function saveHeroImages(images) {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: 'hero_images', value: images }, { onConflict: 'key' });
  if (error) throw error;
}

async function loadDefaultMediaSettings() {
  const { data: reelData } = await supabase.from('site_settings').select('value').eq('key', 'default_video').maybeSingle();
  const { data: fileData } = await supabase.from('site_settings').select('value').eq('key', 'default_video_file').maybeSingle();

  return {
    reelUrl: typeof reelData?.value === 'string' ? reelData.value : DEFAULT_VIDEO_URL,
    fileUrl: typeof fileData?.value === 'string' ? fileData.value : ''
  };
}

async function saveDefaultMediaSettings(reelUrl, fileUrl) {
  await supabase.from('site_settings').upsert({ key: 'default_video', value: (reelUrl || '').trim() }, { onConflict: 'key' });
  await supabase.from('site_settings').upsert({ key: 'default_video_file', value: (fileUrl || '').trim() }, { onConflict: 'key' });
}

export default function HeroManagerView() {
  const [images, setImages]             = useState([]);
  const [defaultVideo, setDefaultVideo]   = useState(DEFAULT_VIDEO_URL);
  const [defaultVideoFile, setDefaultVideoFile] = useState('');
  const [newUrl, setNewUrl]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [toast, setToast]               = useState(null); // { type: 'ok'|'err', msg }

  useEffect(() => {
    Promise.all([loadHeroImages(), loadDefaultMediaSettings()]).then(([imgs, media]) => {
      setImages(imgs);
      setDefaultVideo(media.reelUrl);
      setDefaultVideoFile(media.fileUrl);
      setLoading(false);
    });
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDefaultVideoFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxMb = 50;
    if (file.size > maxMb * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      showToast('err', `El video pesa ${sizeMb}MB (máximo permitido: ${maxMb}MB). Por favor utilizá un archivo más liviano o el link de Instagram Reel.`);
      e.target.value = '';
      return;
    }

    setVideoUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `default_vid_${Date.now()}.${ext}`;
      const filePath = `site/${fileName}`;
      const { error } = await supabase.storage.from('listings').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(filePath);
      setDefaultVideoFile(publicUrl);
      await saveDefaultMediaSettings(defaultVideo, publicUrl);
      showToast('ok', 'Archivo de video por defecto subido y guardado.');
    } catch (err) {
      let msg = err.message || '';
      if (msg.includes('exceeded') || msg.includes('maximum allowed size') || msg.includes('payload too large')) {
        msg = 'El archivo supera el tamaño máximo de 50MB. Te recomendamos comprimirlo o usar el link de Instagram Reel.';
      }
      showToast('err', 'Error al subir video por defecto: ' + msg);
    } finally {
      setVideoUploading(false);
      e.target.value = '';
    }
  };

  const handleAdd = async () => {
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
    const next = [...images, url];
    setImages(next);
    setNewUrl('');
    try {
      await saveHeroImages(next);
      showToast('ok', 'Imagen agregada correctamente.');
    } catch (err) {
      showToast('err', 'Error al guardar: ' + err.message);
    }
  };

  const handleRemove = async (idx) => {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
    try {
      await saveHeroImages(next);
      showToast('ok', 'Imagen eliminada correctamente.');
    } catch (err) {
      showToast('err', 'Error al guardar cambios: ' + err.message);
    }
  };

  const handleMove = async (idx, dir) => {
    const next = [...images];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setImages(next);
    try {
      await saveHeroImages(next);
      showToast('ok', 'Orden actualizado.');
    } catch (err) {
      showToast('err', 'Error al guardar orden: ' + err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const fileToUpload = file.type?.startsWith('image/') ? await compressImage(file) : file;
        const ext = fileToUpload.name.split('.').pop();
        const fileName = `hero_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from('listings')
          .upload(`hero/${fileName}`, fileToUpload);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(`hero/${fileName}`);
        uploaded.push(publicUrl);
      }
      const next = [...images, ...uploaded];
      setImages(next);
      await saveHeroImages(next);
      showToast('ok', `${uploaded.length} imagen${uploaded.length > 1 ? 'es' : ''} subida${uploaded.length > 1 ? 's' : ''} y guardada${uploaded.length > 1 ? 's' : ''}.`);
    } catch (err) {
      showToast('err', 'Error al subir: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (images.length === 0) {
      showToast('err', 'Debe haber al menos una imagen en el Hero.');
      return;
    }
    setSaving(true);
    try {
      await saveHeroImages(images);
      await saveDefaultMediaSettings(defaultVideo, defaultVideoFile);
      showToast('ok', 'Configuración guardada correctamente en Supabase.');
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
            HERO Y CONFIGURACIÓN DEL SITIO
          </h1>
          <p className="text-xs text-primary/50 mt-1 font-medium">
            Administrá las imágenes del banner principal y el video MP4 / Reel por defecto del sitio.
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

      {/* DEFAULT VIDEO SECTION */}
      <div className="bg-white border border-border-light rounded-3xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Video size={18} className="text-accent-red" />
            <h2 className="text-xs font-black uppercase tracking-widest text-primary/70">
              Video / Reel de Presentación por Defecto del Sitio
            </h2>
          </div>
        </div>

        <p className="text-[11px] text-primary/45 font-medium leading-relaxed">
          Definí el video MP4 nativo y/o el link de Instagram Reel que se mostrará por defecto en las publicaciones que no tengan un video propio cargado.
        </p>

        {/* 1. Default MP4 File Upload */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 block">
            1. Archivo de Video MP4 por Defecto (Nativo para la Web)
          </label>

          <label className="w-full flex items-center justify-center gap-2.5 bg-primary text-white text-xs font-black uppercase tracking-wider py-3.5 px-5 rounded-2xl cursor-pointer hover:bg-primary/90 transition-colors shadow-sm">
            <Upload size={16} />
            <span>{videoUploading ? 'Subiendo video...' : 'Subir Archivo de Video MP4 por Defecto'}</span>
            <input
              type="file"
              accept="video/mp4,video/mov,video/*"
              className="hidden"
              onChange={handleDefaultVideoFileUpload}
              disabled={videoUploading}
            />
          </label>

          {defaultVideoFile && (
            <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 text-xs text-emerald-800 font-semibold">
              <span className="truncate">✓ MP4 Cargado: {defaultVideoFile}</span>
              <a href={defaultVideoFile} target="_blank" rel="noreferrer" className="text-emerald-700 underline font-bold flex-shrink-0">
                Probar MP4
              </a>
            </div>
          )}
        </div>

        {/* 2. Default Instagram Reel URL */}
        <div className="space-y-2 pt-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 block">
            2. Link de Instagram Reel por Defecto
          </label>

          <div className="flex items-center gap-3 bg-bg-canvas border border-border-light rounded-2xl px-4 py-3 focus-within:border-primary transition-colors">
            <Play size={16} className="text-primary/30 flex-shrink-0" />
            <input
              type="url"
              placeholder="https://www.instagram.com/reel/C3x9-V4xgL1/"
              value={defaultVideo}
              onChange={(e) => setDefaultVideo(e.target.value)}
              className="flex-1 bg-transparent text-xs font-medium text-primary placeholder:text-primary/30 outline-none"
            />
            {defaultVideo && (
              <a
                href={defaultVideo}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-accent-red hover:underline flex items-center gap-1 flex-shrink-0"
              >
                <span>Probar Reel</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* HERO IMAGES SECTION */}
      <div className="bg-white border border-border-light rounded-3xl p-6 space-y-4 shadow-sm">
        <h2 className="text-xs font-black uppercase tracking-widest text-primary/70 flex items-center gap-2">
          <ImageIcon size={16} className="text-primary/40" />
          <span>Imágenes del Hero ({images.length})</span>
        </h2>

        {/* Upload from file */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-primary/30 mb-2">Desde archivo</p>
          <label className={`inline-flex items-center gap-2 border border-border-light rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : 'bg-bg-canvas hover:border-primary text-primary'}`}>
            {uploading
              ? <><Loader2 size={14} className="animate-spin" /> Subiendo…</>
              : <><Upload size={14} /> Subir fotos desde tu dispositivo</>
            }
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Or add by URL */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-primary/30 mb-2">O pegar URL</p>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-bg-canvas border border-border-light rounded-2xl px-4 py-3 focus-within:border-primary transition-colors">
              <ImageIcon size={16} className="text-primary/30 flex-shrink-0" />
              <input
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1 bg-transparent text-xs text-primary placeholder:text-primary/30 outline-none"
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
        </div>
      </div>

      {/* Image list */}
      <div className="bg-white border border-border-light rounded-3xl p-6 space-y-4 shadow-sm">
        <h2 className="text-xs font-black uppercase tracking-widest text-primary/40">
          Fotos activas del Hero
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
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
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
