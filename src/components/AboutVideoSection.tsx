'use client';

import React, { useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

export default function AboutVideoSection() {
  const { language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Video Section - Left (Portrait Video) */}
          <div className="order-2 lg:order-1 flex justify-center">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-100 w-full max-w-[320px] group">
              <video
                ref={videoRef}
                className="w-full h-auto"
                src="/videos/intro.mp4"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                playsInline
              />

              {/* Play/Pause Overlay */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-[#4485b5] ms-1" fill="currentColor" />
                  </div>
                </button>
              )}

              {/* Controls */}
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 transition-opacity ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                {/* Progress Bar */}
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 mb-2 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Play/Pause */}
                    <button onClick={togglePlay} className="text-white hover:text-[#4485b5] transition-colors">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    {/* Mute */}
                    <button onClick={toggleMute} className="text-white hover:text-[#4485b5] transition-colors">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    {/* Time */}
                    <span className="text-white text-xs">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Fullscreen */}
                  <button onClick={toggleFullscreen} className="text-white hover:text-[#4485b5] transition-colors">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section - Right */}
          <div className="order-1 lg:order-2 text-right" dir="rtl">
            <h2 className="text-3xl md:text-4xl font-bold text-[#4485b5] mb-6">
              {language === 'ar' ? 'مسارات في كلمات' : 'Masarat in Words'}
            </h2>

            <p className="text-gray-600 text-lg leading-loose mb-6">
              {language === 'ar'
                ? 'تهدف إلى تقديم خدمات تعليمية وعلاجية وتدريبية للمتخصصين وتطوير المؤسسات ذات الصلة، وتمكين الأسر الذين يسعون إلى خدمات وتدخلات فعالة قائمة على الدليل العلمي. نوفر برامج تدريبية عالية الجودة وبتكلفة مناسبة، يمكنكم الوصول إليها بأي وقت ومن أي مكان في العالم عبر الإنترنت وباللغتين العربية والإنجليزية.'
                : 'We aim to provide educational, therapeutic, and training services for specialists and develop relevant institutions, empowering families seeking effective evidence-based services and interventions. We offer high-quality training programs at affordable costs, accessible anytime and anywhere in the world via the internet in both Arabic and English.'}
            </p>

            {/* Features List */}
            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">
                  {language === 'ar' ? 'برامج معتمدة دولياً' : 'Internationally Accredited Programs'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">
                  {language === 'ar' ? 'متاح باللغتين العربية والإنجليزية' : 'Available in Arabic and English'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">
                  {language === 'ar' ? 'تعلم في أي وقت ومن أي مكان' : 'Learn Anytime, Anywhere'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
