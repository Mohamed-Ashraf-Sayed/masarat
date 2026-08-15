'use client';

import { useEffect, useRef } from 'react';

// مشغّل YouTube بالـ IFrame API — الـ iframe العادي مبيدّيش أي إشارة لما الفيديو يخلص،
// فالدرس مكانش بيتسجل مكتمل تلقائياً إلا للفيديوهات المباشرة. المكوّن ده بيبلّغ onEnded
// عند انتهاء الفيديو عشان التقدم والشهادات يشتغلوا زي باقي أنواع الدروس.

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

export default function YouTubeLessonPlayer({ videoId, onEnded }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    let player: any = null;
    let cancelled = false;
    let created = false;

    const createPlayer = () => {
      if (cancelled || created || !containerRef.current) return;
      created = true;
      // YT.Player بيستبدل العنصر اللي بيتبعتله بـ iframe، فبنركّب عنصر داخلي مؤقت
      const mount = document.createElement('div');
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(mount);
      player = new window.YT!.Player(mount, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === window.YT!.PlayerState.ENDED) onEndedRef.current();
          },
        },
      });
    };

    let poll: ReturnType<typeof setInterval> | null = null;

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
      }, 500);
    }

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [videoId]);

  return <div ref={containerRef} className="w-full h-full max-h-[70vh] aspect-video" />;
}
