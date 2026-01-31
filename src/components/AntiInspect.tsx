'use client';

import { useEffect } from 'react';

export default function AntiInspect() {
  useEffect(() => {
    // منع كليك يمين
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // منع اختصارات لوحة المفاتيح
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I (Inspect)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }

      // Cmd+Option+I (Mac Inspect)
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        return false;
      }

      // Cmd+Option+J (Mac Console)
      if (e.metaKey && e.altKey && e.key === 'j') {
        e.preventDefault();
        return false;
      }

      // Cmd+Option+C (Mac Inspect Element)
      if (e.metaKey && e.altKey && e.key === 'c') {
        e.preventDefault();
        return false;
      }

      // Cmd+Option+U (Mac View Source)
      if (e.metaKey && e.altKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
    };

    // كشف فتح DevTools عن طريق حجم النافذة
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        // يمكن إضافة إجراء هنا مثل تحويل الصفحة أو إظهار رسالة
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-size:24px;font-family:Cairo,sans-serif;direction:rtl;text-align:center;padding:20px;">غير مسموح بفتح أدوات المطور</div>';
      }
    };

    // منع السحب والإفلات
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // منع النسخ (اختياري)
    const handleCopy = (e: ClipboardEvent) => {
      // يمكن تفعيل هذا لمنع النسخ
      // e.preventDefault();
      // return false;
    };

    // إضافة الـ Event Listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    // document.addEventListener('copy', handleCopy);

    // كشف DevTools كل ثانية
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // تنظيف عند إزالة الكومبوننت
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      // document.removeEventListener('copy', handleCopy);
      clearInterval(devToolsInterval);
    };
  }, []);

  return null;
}
