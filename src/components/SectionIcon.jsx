import React from 'react';
import * as LucideIcons from 'lucide-react';

export default function SectionIcon({ icon, iconType, className = '', size = 22, style = {} }) {
  if (!icon) {
    const FallbackIcon = LucideIcons.Layers;
    return <FallbackIcon size={size} className={className} style={style} />;
  }

  const iconStr = String(icon).trim();

  // 1. Raw SVG string
  if (iconStr.startsWith('<svg')) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size, ...style }}
        dangerouslySetInnerHTML={{ __html: iconStr }}
      />
    );
  }

  // 2. HTTP URL or Data URI (SVG / Image)
  if (iconStr.startsWith('http://') || iconStr.startsWith('https://') || iconStr.startsWith('data:')) {
    return (
      <img
        src={iconStr}
        alt=""
        className={`object-contain ${className}`}
        style={{ width: size, height: size, ...style }}
      />
    );
  }

  // 3. Iconify icon string (e.g., "ph:bicycle", "mdi:car", "lucide:bike")
  if (iconStr.includes(':')) {
    const [prefix, name] = iconStr.split(':');
    const iconifyUrl = `https://api.iconify.design/${prefix}/${name}.svg`;
    return (
      <img
        src={iconifyUrl}
        alt={iconStr}
        className={`object-contain ${className}`}
        style={{ width: size, height: size, ...style }}
      />
    );
  }

  // 4. Lucide React Icon fallback by name
  const IconComponent = LucideIcons[iconStr] || LucideIcons.Layers;
  return <IconComponent size={size} className={className} style={style} />;
}
