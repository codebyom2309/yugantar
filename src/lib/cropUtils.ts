import React from 'react';

export interface OrganizerCropData {
  zoom: number;       // Zoom level: 0.5 to 3.5 (default: 1.0)
  x: number;          // Normalized horizontal offset as a percentage of viewport width (-100 to +100, default: 0)
  y: number;          // Normalized vertical offset as a percentage of viewport height (-100 to +100, default: 0)
  shape: 'circle' | 'rounded' | 'square'; // Mask shape
}

/**
 * Parses and sanitizes crop metadata from JSON string, object, or undefined.
 * Returns a guaranteed valid OrganizerCropData with safe defaults.
 */
export function parseCropData(raw: unknown): OrganizerCropData {
  const fallback: OrganizerCropData = {
    zoom: 1.0,
    x: 0,
    y: 0,
    shape: 'circle',
  };

  if (!raw) return fallback;

  let obj: any = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  if (typeof obj !== 'object' || obj === null) return fallback;

  // Validate zoom (clamp between 0.5 and 3.5)
  let zoom = typeof obj.zoom === 'number' && !isNaN(obj.zoom) ? obj.zoom : 1.0;
  zoom = Math.max(0.5, Math.min(3.5, Number(zoom.toFixed(2))));

  // Validate x and y offsets (clamp between -100 and +100 percent)
  let x = typeof obj.x === 'number' && !isNaN(obj.x) ? obj.x : 0;
  x = Math.max(-100, Math.min(100, Math.round(x)));

  let y = typeof obj.y === 'number' && !isNaN(obj.y) ? obj.y : 0;
  y = Math.max(-100, Math.min(100, Math.round(y)));

  // Validate shape
  let shape: 'circle' | 'rounded' | 'square' = 'circle';
  if (obj.shape === 'rounded' || obj.shape === 'square') {
    shape = obj.shape;
  }

  return { zoom, x, y, shape };
}

/**
 * Returns the exact inline CSS properties for the <img> tag inside a 1:1 aspect-ratio container.
 * 
 * MATHEMATICAL FOUNDATION:
 * The <img> has width: 100% and height: 100% of the 1:1 container, with object-fit: cover.
 * In CSS transforms:
 *   translate(X%, Y%) moves by X% of the element's box (which equals the container's box).
 *   scale(S) scales from the center origin.
 * Therefore, applying `translate(${x}%, ${y}%) scale(${zoom})` produces the exact same framing
 * regardless of whether the container is 240px (editor), 80px (admin card), or 56px (public preview).
 */
export function getCropImageStyle(crop?: OrganizerCropData | null): React.CSSProperties {
  if (!crop) {
    return {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    };
  }

  const { zoom = 1, x = 0, y = 0 } = crop;

  return {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    // translate is applied in percentage of the 1:1 container box, followed by scale around center
    transform: `translate(${x}%, ${y}%) scale(${zoom})`,
    transformOrigin: 'center center',
    transition: 'none',
  };
}

/**
 * Returns the exact Tailwind CSS class for the mask shape container.
 */
export function getCropMaskClass(shape?: string, variant: 'avatar' | 'card' | 'editor' = 'avatar'): string {
  switch (shape) {
    case 'circle':
      return 'rounded-full';
    case 'rounded':
      return variant === 'editor' ? 'rounded-3xl' : 'rounded-2xl';
    case 'square':
      return 'rounded-none';
    default:
      return 'rounded-full';
  }
}
