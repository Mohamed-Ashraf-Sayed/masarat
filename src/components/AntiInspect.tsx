'use client';

import { useEffect, useCallback } from 'react';

export default function AntiInspect() {
  const blockPage = useCallback(() => {
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-size: 24px;
        font-family: Cairo, sans-serif;
        direction: rtl;
        text-align: center;
        padding: 20px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: #fff;
      ">
        <div>
          <div style="font-size: 48px; margin-bottom: 20px;">🚫</div>
          <div>غير مسموح بفتح أدوات المطور</div>
          <div style="font-size: 14px; margin-top: 10px; opacity: 0.7;">Developer tools are not allowed</div>
        </div>
      </div>
    `;
    // إيقاف كل الـ scripts
    throw new Error('DevTools detected');
  }, []);

  useEffect(() => {
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
          // I, J, C, K (Inspect, Console, Element picker, Performance)
          if (['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }
        // U (View Source), S (Save), P (Print)
        if (['u', 'U', 's', 'S', 'p', 'P'].includes(e.key)) {
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

    // ==================== 3. كشف DevTools بالـ debugger timing ====================
    const detectByDebugger = () => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      // لو الـ debugger أخذ أكتر من 100ms يعني DevTools مفتوحة
      if (end - start > 100) {
        blockPage();
      }
    };

    // ==================== 4. كشف DevTools بحجم النافذة ====================
    const detectByWindowSize = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        blockPage();
      }
    };

    // ==================== 5. كشف DevTools بـ console methods ====================
    const detectByConsole = () => {
      const element = new Image();
      Object.defineProperty(element, 'id', {
        get: function() {
          blockPage();
          return '';
        }
      });
      // هذا سيتم تنفيذه فقط لو console مفتوحة
      console.log('%c', element);
    };

    // ==================== 6. كشف DevTools بـ toString ====================
    const detectByToString = () => {
      const devtools = /./;
      let isOpen = false;
      devtools.toString = function() {
        isOpen = true;
        return '';
      };
      console.log('%c', devtools);
      if (isOpen) {
        blockPage();
      }
    };

    // ==================== 7. تعطيل console ====================
    const disableConsole = () => {
      const noop = () => undefined;
      const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp', 'context', 'memory'];

      methods.forEach(method => {
        (console as Record<string, unknown>)[method] = noop;
      });
    };

    // ==================== 8. منع التحديد ====================
    const handleSelectStart = (e: Event) => {
      // السماح بالتحديد في الـ inputs و textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // ==================== 9. منع السحب ====================
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // ==================== 10. منع النسخ من الفيديوهات والصور ====================
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
      }
      // السماح بالنسخ من النصوص العادية
    };

    // ==================== 11. كشف Firebug ====================
    const detectFirebug = () => {
      if ((window as unknown as Record<string, unknown>).Firebug &&
          (window as unknown as Record<string, { chrome?: { isInitialized?: boolean } }>).Firebug.chrome &&
          (window as unknown as Record<string, { chrome?: { isInitialized?: boolean } }>).Firebug.chrome.isInitialized) {
        blockPage();
      }
    };

    // ==================== 12. مراقبة الـ DOM للتغييرات المشبوهة ====================
    const observeDOM = () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              // كشف إضافة iframes مشبوهة
              if (node.tagName === 'IFRAME' && !node.getAttribute('data-allowed')) {
                node.remove();
              }
              // كشف scripts مشبوهة
              if (node.tagName === 'SCRIPT' && !node.getAttribute('data-allowed')) {
                const src = node.getAttribute('src') || '';
                if (src.includes('devtools') || src.includes('debug')) {
                  node.remove();
                }
              }
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      return observer;
    };

    // ==================== تنفيذ الحماية ====================

    // Event listeners
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('copy', handleCopy, true);

    // تعطيل console في الإنتاج
    if (process.env.NODE_ENV === 'production') {
      disableConsole();
    }

    // كشف دوري
    const windowSizeInterval = setInterval(detectByWindowSize, 500);
    const consoleInterval = setInterval(detectByConsole, 1000);
    const toStringInterval = setInterval(detectByToString, 1000);
    const firebugInterval = setInterval(detectFirebug, 1000);

    // الـ debugger detection - تشغيله مرة واحدة في البداية وبشكل متقطع
    // (تشغيله كثيراً قد يبطئ الصفحة)
    const debuggerInterval = setInterval(detectByDebugger, 5000);

    // مراقبة DOM
    const domObserver = observeDOM();

    // ==================== منع eval و Function constructor ====================
    try {
      const originalEval = window.eval;
      window.eval = function(code: string) {
        if (code.includes('debugger') || code.includes('console')) {
          return undefined;
        }
        return originalEval(code);
      };
    } catch {
      // في بعض الحالات لا يمكن تغيير eval
    }

    // ==================== تنظيف ====================
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('copy', handleCopy, true);

      clearInterval(windowSizeInterval);
      clearInterval(consoleInterval);
      clearInterval(toStringInterval);
      clearInterval(firebugInterval);
      clearInterval(debuggerInterval);

      domObserver.disconnect();
    };
  }, [blockPage]);

  // ==================== CSS لمنع التحديد ====================
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-allowed', 'true');
    style.textContent = `
      /* منع التحديد */
      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      /* السماح بالتحديد في الـ inputs */
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }

      /* منع سحب الصور */
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
        pointer-events: none;
      }

      /* إعادة تفعيل الصور القابلة للنقر */
      a img, button img {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
