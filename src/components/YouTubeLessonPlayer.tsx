'use client';

import { useEffect, useRef, useState } from 'react';

// مشغّل YouTube بالـ IFrame API — بيبلّغ onEnded عند انتهاء الفيديو عشان الدرس
// يتسجل مكتمل تلقائياً. لو الـ API اتأخر أو فشل (شبكة بطيئة / حظر)، بنرجع
// تلقائياً للـ iframe العادي بعد مهلة — الفيديو يشتغل في كل الحالات
// (من غير auto-complete، وزرار "تحديد كمكتمل" اليدوي موجود كاحتياطي).

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface Props {
  videoId: string;
  onEnded: () => void;
}

const API_TIMEOUT_MS = 8000;

export default function YouTubeLessonPlayer({ videoId, onEnded }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    readyRef.current = false;
    setReady(false);
    setFallback(false);

    let player: any = null;
    let cancelled = false;
    let created = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    const useFallback = () => {
      if (cancelled) return;
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
      setFallback(true);
    };

    const createPlayer = () => {
      if (cancelled || created || !containerRef.current) return;
      created = true;
      // YT.Player بيستبدل العنصر اللي بيتبعتله بـ iframe — بنديله عنصر داخلي بمقاس كامل
      const mount = document.createElement('div');
      mount.style.width = '100%';
      mount.style.height = '100%';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(mount);
      try {
        player = new window.YT!.Player(mount, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: { rel: 0, origin: window.location.origin },
          events: {
            onReady: () => {
              if (!cancelled) {
                readyRef.current = true;
                setReady(true);
              }
            },
            onStateChange: (e: any) => {
              if (e.data === window.YT!.PlayerState.ENDED) onEndedRef.current();
            },
          },
        });
      } catch {
        useFallback();
      }
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
      poll = setInterval(() => {
        if (window.YT?.Player) {
          if (poll) clearInterval(poll);
          createPlayer();
        }
      }, 300);
    }

    // مهلة أمان: لو المشغّل مجهزش خلال المهلة → iframe عادي بدل شاشة سودة
    const failover = setTimeout(() => {
      if (!readyRef.current) useFallback();
    }, API_TIMEOUT_MS);

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      clearTimeout(failover);
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [videoId]);

  if (fallback) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        className="w-full h-full max-h-[70vh] aspect-video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div className="w-full h-full max-h-[70vh] aspect-video relative">
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
          <span className="text-sm">جاري تحميل الفيديو...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
