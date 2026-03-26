'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const fallbackSlides = [
  { id: '1', src: '/slider1.jpeg', alt: 'Slider 1', order: 0 },
  { id: '2', src: '/slider2.jpeg', alt: 'Slider 2', order: 1 },
];

interface Slide {
  id: string;
  src: string;
  alt: string;
  order: number;
}

export default function ImageSlider() {
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetch('/api/sliders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setSlides(data.data);
        }
      })
      .catch(() => {
        // Use fallback slides
      });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative w-full" style={{ paddingBottom: '40%' }}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full object-contain"
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10"
            aria-label="Previous slide"
          >
            <ChevronRight className="w-8 h-8 text-gray-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10"
            aria-label="Next slide"
          >
            <ChevronLeft className="w-8 h-8 text-gray-800" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-4 h-4 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-blue-600 scale-110'
                    : 'bg-gray-400 hover:bg-gray-600'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
