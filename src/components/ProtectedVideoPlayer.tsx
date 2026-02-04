'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, AlertTriangle, Settings } from 'lucide-react';

interface WatermarkInfo {
  text: string;
  id: string;
}

interface ProtectedVideoPlayerProps {
  lessonId: string;
  token: string;
  onEnded?: () => void;
  className?: string;
}

export default function ProtectedVideoPlayer({ lessonId, token, onEnded, className = '' }: ProtectedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [watermark, setWatermark] = useState<WatermarkInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watermarkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch secure video URL
  useEffect(() => {
    const fetchSecureVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/secure-video/${lessonId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || 'Failed to load video');
          return;
        }

        setVideoUrl(result.data.streamUrl);
        setWatermark(result.data.watermark);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError('Failed to load video');
      }
    };

    if (lessonId && token) {
      fetchSecureVideo();
    }
  }, [lessonId, token]);

  // DevTools detection (desktop only - mobile has false positives due to browser UI)
  useEffect(() => {
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (typeof window !== 'undefined' && window.innerWidth < 768);

    if (isMobile) {
      // Skip DevTools detection on mobile
      setDevToolsOpen(false);
      return;
    }

    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        setDevToolsOpen(true);
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      } else {
        setDevToolsOpen(false);
      }
    };

    // Check on resize
    window.addEventListener('resize', detectDevTools);

    // Initial check
    detectDevTools();

    // Periodic check
    const interval = setInterval(detectDevTools, 1000);

    return () => {
      window.removeEventListener('resize', detectDevTools);
      clearInterval(interval);
    };
  }, []);

  // Prevent right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu);
    }

    // Also prevent on document when video is playing
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu);
      }
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Prevent keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Ctrl+Shift+S, Ctrl+U, F12
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) ||
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J'))
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Blur video when window loses focus (screen recording protection)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        // Small delay before unblurring
        setTimeout(() => setIsBlurred(false), 500);
      }
    };

    const handleBlur = () => {
      setIsBlurred(true);
    };

    const handleFocus = () => {
      setTimeout(() => setIsBlurred(false), 300);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Dynamic watermark position
  useEffect(() => {
    if (!watermark) return;

    const updateWatermarkPosition = () => {
      // Watermark will move randomly every 30 seconds
    };

    watermarkIntervalRef.current = setInterval(updateWatermarkPosition, 30000);

    return () => {
      if (watermarkIntervalRef.current) {
        clearInterval(watermarkIntervalRef.current);
      }
    };
  }, [watermark]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      setShowSettings(false);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (devToolsOpen) return;

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, devToolsOpen]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnded) {
      onEnded();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Generate random watermark positions
  const getWatermarkPositions = () => {
    const positions = [];
    const timestamp = Math.floor(Date.now() / 30000); // Changes every 30 seconds

    for (let i = 0; i < 3; i++) {
      const seed = (timestamp + i) * 12345;
      positions.push({
        top: `${20 + ((seed % 60))}%`,
        left: `${10 + ((seed * 7) % 80)}%`,
        opacity: 0.15 + ((seed % 10) / 100),
      });
    }
    return positions;
  };

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-900 ${className}`}>
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-white text-lg">{error}</p>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  const watermarkPositions = getWatermarkPositions();

  return (
    <div
      ref={containerRef}
      className={`relative bg-black group select-none overflow-hidden ${className}`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onDoubleClick={toggleFullscreen}
    >
      {/* DevTools Warning Overlay */}
      {devToolsOpen && (
        <div className="absolute inset-0 z-50 bg-red-900/95 flex flex-col items-center justify-center">
          <AlertTriangle className="w-20 h-20 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">تم إيقاف الفيديو</h2>
          <p className="text-red-200 text-center max-w-md">
            تم اكتشاف أدوات المطور. يرجى إغلاقها لمتابعة المشاهدة.
          </p>
          <p className="text-red-300 text-sm mt-4">
            Developer tools detected. Please close them to continue watching.
          </p>
        </div>
      )}

      {/* Blur Overlay for Screen Recording Protection */}
      {isBlurred && !devToolsOpen && (
        <div className="absolute inset-0 z-40 backdrop-blur-xl bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-white text-lg">تم إيقاف الفيديو مؤقتاً</p>
            <p className="text-gray-400 text-sm mt-2">Video paused for security</p>
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        playsInline
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onClick={togglePlay}
        crossOrigin="use-credentials"
        style={{ pointerEvents: 'auto' }}
      />

      {/* Watermarks */}
      {watermark && !isBlurred && !devToolsOpen && (
        <>
          {watermarkPositions.map((pos, index) => (
            <div
              key={index}
              className="absolute pointer-events-none select-none"
              style={{
                top: pos.top,
                left: pos.left,
                opacity: pos.opacity,
                transform: `rotate(${-15 + (index * 10)}deg)`,
              }}
            >
              <span className="text-white text-sm font-mono whitespace-nowrap">
                {watermark.text} • {watermark.id}
              </span>
            </div>
          ))}

          {/* Corner watermark */}
          <div className="absolute bottom-20 right-4 pointer-events-none select-none opacity-30">
            <span className="text-white text-xs font-mono bg-black/30 px-2 py-1 rounded">
              ID: {watermark.id}
            </span>
          </div>
        </>
      )}

      {/* Loading Indicator */}
      {isLoading && !isBlurred && !devToolsOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isPlaying && !isLoading && !isBlurred && !devToolsOpen && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-20"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 bg-primary-500/80 rounded-full flex items-center justify-center hover:bg-primary-500 transition-colors">
            <Play className="w-10 h-10 text-white ms-1" fill="white" />
          </div>
        </div>
      )}

      {/* Custom Controls */}
      {!isBlurred && !devToolsOpen && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300 z-30 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div
            className="h-1.5 bg-gray-600/80 rounded-full cursor-pointer mb-4 group/progress hover:h-2 transition-all"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-primary-500 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-400 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-primary-500"
                />
              </div>

              {/* Time */}
              <span className="text-white text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Settings (Playback Speed) */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg overflow-hidden shadow-xl">
                    <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700">
                      سرعة التشغيل
                    </div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-800 transition-colors ${
                          playbackRate === rate ? 'text-primary-400 bg-gray-800' : 'text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5 text-white" />
                ) : (
                  <Maximize className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invisible overlay to prevent interactions */}
      <div
        className="absolute inset-0 pointer-events-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* Hidden canvas for additional protection */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
