// طبقة ImageKit CDN: بتحوّل مسارات الصور المحلية لروابط ImageKit مع تحسين تلقائي
// (f-auto → WebP/AVIF حسب المتصفح، q-80 ضغط، w-{width} تصغير للمقاس المطلوب).
// لو NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT مش متظبط بترجع المسار زي ما هو — fallback آمن.
const ENDPOINT = (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '').replace(/\/+$/, '');

export function ikUrl(src, { width, quality } = {}) {
  // الروابط الخارجية و data:/blob: والمسارات الداخلية بتعدي زي ما هي
  if (!ENDPOINT || typeof src !== 'string' || !src.startsWith('/') || src.startsWith('//')) {
    return src;
  }
  if (src.startsWith('/_next/') || src.startsWith('/api/')) return src;

  const tr = ['f-auto', `q-${quality || 80}`];
  if (width) tr.push(`w-${Math.round(width)}`);

  const sep = src.includes('?') ? '&' : '?';
  return `${ENDPOINT}${src}${sep}tr=${tr.join(',')}`;
}

// Custom loader لـ next/image — بيتوصّل من next.config.js لما الـ endpoint يبقى موجود
export default function imageKitLoader({ src, width, quality }) {
  return ikUrl(src, { width, quality });
}
