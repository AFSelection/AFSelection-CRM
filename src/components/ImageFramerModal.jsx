import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Crop, RotateCcw, ZoomIn, Monitor, Smartphone, Move } from 'lucide-react';
import {
  DEFAULT_FRAMING,
  MAX_ZOOM,
  parseFraming,
  withFraming,
  framingStyle,
  visibleRegion
} from '../utils/imageFraming';

// Alto máximo de la foto en el editor: el 52 % de la pantalla, con techo de 440 px.
const stageMaxHeight = () => Math.min(440, Math.round(window.innerHeight * 0.52));
const PREVIEW_MAX_W = 135;
const PREVIEW_MAX_H = 105;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Tamaño de la vista previa: misma proporción que el recuadro real, achicada. */
function previewSize(frame) {
  const scale = Math.min(PREVIEW_MAX_W / frame.w, PREVIEW_MAX_H / frame.h, 1);
  return { width: Math.round(frame.w * scale), height: Math.round(frame.h * scale) };
}

function DeviceIcon({ device, size = 11 }) {
  return device === 'Celular' ? <Smartphone size={size} /> : <Monitor size={size} />;
}

/**
 * Editor de encuadre.
 *
 * Muestra la foto entera con una cuadrícula encima: la zona clara es lo que se
 * ve en el recuadro elegido y lo oscuro queda recortado. Los otros recuadros
 * donde aparece la misma foto se marcan con línea punteada, y a la derecha se
 * ve cómo queda cada uno, con los mismos estilos que usa el sitio.
 *
 * @param {string}   url     URL de la foto (puede traer ya un encuadre).
 * @param {Array}    frames  Recuadros donde se muestra (utils/imageFraming.js).
 * @param {Function} onSave  Recibe la URL con el encuadre nuevo.
 */
export default function ImageFramerModal({ isOpen, url, frames, title = 'Encuadrar imagen', onSave, onClose }) {
  const { src, framing: initialFraming } = parseFraming(url);
  const [framing, setFraming] = useState(initialFraming || DEFAULT_FRAMING);
  const [activeId, setActiveId] = useState(frames?.[0]?.id);
  const [imageAspect, setImageAspect] = useState(null);
  const [stageWidth, setStageWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  const stageBoxRef = useRef(null);
  const dragRef = useRef(null);

  // Cada vez que se abre con otra foto, arrancamos desde su encuadre guardado.
  useEffect(() => {
    if (!isOpen) return;
    setFraming(parseFraming(url).framing || DEFAULT_FRAMING);
    setActiveId(frames?.[0]?.id);
    setImageAspect(null);
  }, [isOpen, url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen || !stageBoxRef.current) return;
    const el = stageBoxRef.current;
    const ro = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const activeFrame = frames?.find((f) => f.id === activeId) || frames?.[0];

  // La foto entera, ajustada al espacio disponible.
  let stageW = 0;
  let stageH = 0;
  if (imageAspect && stageWidth) {
    stageW = stageWidth;
    stageH = stageW / imageAspect;
    if (stageH > stageMaxHeight()) {
      stageH = stageMaxHeight();
      stageW = stageH * imageAspect;
    }
  }

  const regionFor = useCallback(
    (frame) => visibleRegion(imageAspect, frame.w / frame.h, framing),
    [imageAspect, framing]
  );

  /* Arrastre: la zona clara sigue al puntero. Se traduce el desplazamiento a
     x/y usando la zona del recuadro activo, así se mueve exactamente con el
     dedo o el mouse. */
  const handlePointerDown = (e) => {
    if (!imageAspect || !activeFrame) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      region: regionFor(activeFrame),
      framing
    };
    setDragging(true);
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || !stageW) return;
    const { region, framing: start } = drag;
    const dx = (e.clientX - drag.startX) / stageW;
    const dy = (e.clientY - drag.startY) / stageH;

    const slackX = 1 - region.width;
    const slackY = 1 - region.height;
    setFraming({
      ...start,
      x: slackX > 0.0001 ? clamp(((region.left + dx) / slackX) * 100, 0, 100) : start.x,
      y: slackY > 0.0001 ? clamp(((region.top + dy) / slackY) * 100, 0, 100) : start.y
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const handleKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 2;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    setFraming((f) => ({ ...f, x: clamp(f.x + move[0], 0, 100), y: clamp(f.y + move[1], 0, 100) }));
  };

  if (!isOpen || !src) return null;

  const previewUrl = withFraming(src, framing);
  const isDefault = framing.x === 50 && framing.y === 50 && framing.zoom === 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white border border-border-light rounded-3xl w-full max-w-6xl max-h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-7">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Crop size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-primary tracking-tight">{title}</h3>
              <p className="text-xs text-primary/55 leading-relaxed mt-0.5 max-w-xl">
                Arrastrá la zona clara para elegir qué parte de la foto se ve. Lo oscuro queda recortado en el recuadro elegido;
                las líneas punteadas marcan los otros lugares donde aparece esta misma foto.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-primary/40 hover:text-primary p-2 rounded-full hover:bg-bg-canvas transition-colors cursor-pointer outline-none"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_290px] gap-6 lg:gap-8 p-6 sm:p-8">
          {/* ── Editor ── */}
          <div className="space-y-4 min-w-0">
            {/* Recuadro activo */}
            <div className="flex flex-wrap gap-2">
              {frames.map((frame) => (
                <button
                  key={frame.id}
                  type="button"
                  onClick={() => setActiveId(frame.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border transition-colors cursor-pointer ${
                    frame.id === activeFrame?.id
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-primary/60 border-border-light hover:border-primary/30'
                  }`}
                >
                  <DeviceIcon device={frame.device} />
                  <span>{frame.label} · {frame.device}</span>
                </button>
              ))}
            </div>

            <div ref={stageBoxRef} className="w-full rounded-2xl bg-[#1a1c20] flex items-center justify-center overflow-hidden" style={{ minHeight: 240 }}>
              {/* Se carga oculta sólo para conocer la proporción real de la foto. */}
              {!imageAspect && (
                <img
                  src={src}
                  alt=""
                  className="hidden"
                  onLoad={(e) => setImageAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
                />
              )}

              {!imageAspect ? (
                <div className="text-xs font-semibold text-white/50 py-24">Cargando foto…</div>
              ) : (
                <div
                  className={`relative select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{ width: stageW, height: stageH, touchAction: 'none' }}
                  tabIndex={0}
                  role="application"
                  aria-label="Área de encuadre. Arrastrá o usá las flechas para mover."
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onKeyDown={handleKeyDown}
                >
                  <img src={src} alt="" draggable={false} className="absolute inset-0 w-full h-full pointer-events-none" />

                  {/* Otros recuadros: sólo el contorno. Sin etiqueta a propósito:
                      suelen caer casi encima y los textos se pisaban. Para saber
                      cuál es cuál están los botones de arriba y las vistas previas. */}
                  {frames.filter((f) => f.id !== activeFrame.id).map((frame) => {
                    const r = regionFor(frame);
                    return (
                      <div
                        key={frame.id}
                        className="absolute pointer-events-none border border-dashed border-white/70"
                        style={{
                          left: r.left * stageW,
                          top: r.top * stageH,
                          width: r.width * stageW,
                          height: r.height * stageH,
                          zIndex: 3
                        }}
                      />
                    );
                  })}

                  {/* Recuadro activo: lo de afuera se oscurece, adentro va la cuadrícula */}
                  {(() => {
                    const r = regionFor(activeFrame);
                    return (
                      <div
                        className="absolute pointer-events-none border-2 border-amber-400"
                        style={{
                          left: r.left * stageW,
                          top: r.top * stageH,
                          width: r.width * stageW,
                          height: r.height * stageH,
                          boxShadow: '0 0 0 9999px rgba(10, 11, 13, 0.62)',
                          zIndex: 2
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage:
                              'linear-gradient(to right, rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.55) 1px, transparent 1px)',
                            backgroundSize: '33.333% 33.333%',
                            backgroundPosition: '-1px -1px'
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="w-9 h-9 rounded-full bg-black/45 border border-white/60 text-white flex items-center justify-center">
                            <Move size={16} />
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-3">
              <ZoomIn size={16} className="text-primary/40 flex-shrink-0" />
              <label htmlFor="framer-zoom" className="text-[10px] font-extrabold uppercase tracking-wider text-primary/50 flex-shrink-0">
                Zoom
              </label>
              <input
                id="framer-zoom"
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.05}
                value={framing.zoom}
                onChange={(e) => setFraming((f) => ({ ...f, zoom: Number(e.target.value) }))}
                className="flex-1 accent-primary cursor-pointer"
              />
              <span className="text-xs font-bold text-primary/60 tabular-nums w-12 text-right">
                {framing.zoom.toFixed(2)}×
              </span>
            </div>
            <p className="text-[10px] text-primary/40 leading-relaxed">
              Tip: con las flechas del teclado se mueve de a poco (con Shift, más rápido). Si la foto y el recuadro tienen la misma
              forma no hay nada para recortar: subí el zoom para elegir un sector.
            </p>
          </div>

          {/* ── Vistas previas ── */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/45">Así se va a ver</h4>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
              {frames.map((frame) => {
                const size = previewSize(frame);
                const isActive = frame.id === activeFrame?.id;
                return (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => setActiveId(frame.id)}
                    className="block text-left cursor-pointer group"
                    style={{ width: PREVIEW_MAX_W }}
                  >
                    <span className={`flex items-start gap-1.5 text-[9px] leading-tight font-bold uppercase tracking-wider mb-1.5 ${isActive ? 'text-primary' : 'text-primary/45 group-hover:text-primary/70'}`}>
                      <DeviceIcon device={frame.device} />
                      {frame.label} · {frame.device}
                    </span>
                    <span
                      className={`block relative overflow-hidden rounded-xl bg-bg-canvas border-2 transition-colors ${isActive ? 'border-amber-400' : 'border-transparent'}`}
                      style={size}
                    >
                      <img
                        src={src}
                        alt=""
                        draggable={false}
                        className="w-full h-full object-cover"
                        style={framingStyle(previewUrl)}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 sm:px-8 pb-6 sm:pb-8">
          <button
            type="button"
            onClick={() => setFraming(DEFAULT_FRAMING)}
            disabled={isDefault}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-primary/60 hover:text-primary hover:bg-bg-canvas disabled:opacity-30 transition-colors cursor-pointer outline-none"
          >
            <RotateCcw size={14} />
            Centrar de nuevo
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-xs font-bold text-primary/70 bg-bg-canvas hover:bg-border-light/60 transition-colors cursor-pointer outline-none"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave(withFraming(src, framing))}
              className="px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 transition-all cursor-pointer outline-none"
            >
              Guardar encuadre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
