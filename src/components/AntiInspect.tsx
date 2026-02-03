'use client';

import { useEffect } from 'react';

// Set to false to enable DevTools for debugging
const ENABLE_ANTI_INSPECT = false; // TODO: Change to true in production

export default function AntiInspect() {
  useEffect(() => {
    // Skip if disabled
    if (!ENABLE_ANTI_INSPECT) return;
    // ==================== 1. منع كليك يمين ====================
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // ==================== 2. منع اختصارات لوحة المفاتيح ====================
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl/Cmd combinations
      if (e.ctrlKey || e.metaKey) {
        // Shift combinations
        if (e.shiftKey) {
          // I, J, C (Inspect, Console, Element picker)
          if (['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }
        // U (View Source), S (Save)
        if (['u', 'U', 's', 'S'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Alt/Option combinations (Mac)
      if (e.altKey && e.metaKey) {
        if (['i', 'I', 'j', 'J', 'c', 'C', 'u', 'U'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    // ==================== 3. منع التحديد (اختياري) ====================
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      // السماح بالتحديد في الـ inputs و textareas
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return true;
      }
      // السماح بتحديد النصوص العادية
      return true;
    };

    // ==================== 4. منع السحب للصور ====================
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // ==================== Event Listeners ====================
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('dragstart', handleDragStart, true);

    // ==================== تنظيف ====================
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('dragstart', handleDragStart, true);
    };
  }, []);

  // ==================== CSS لمنع سحب الصور ====================
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-anti-inspect', 'true');
    style.textContent = `
      /* منع سحب الصور */
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
      }

      /* منع تحديد الصور */
      img {
        -webkit-touch-callout: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.querySelector('style[data-anti-inspect="true"]');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null;
}
