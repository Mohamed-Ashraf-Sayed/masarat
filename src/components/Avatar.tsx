'use client';

import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

const COLORS = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
];

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function getColorForName(name?: string | null): string {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const hasValidImage = src && !imgError && !src.includes('via.placeholder.com');

  if (hasValidImage) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = getInitials(name);
  const colorClass = getColorForName(name);
  const fontSize = Math.max(12, size * 0.4);

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold select-none ${colorClass} ${className}`}
      style={{ width: size, height: size, fontSize }}
      aria-label={name || 'Avatar'}
    >
      {initials}
    </div>
  );
}
