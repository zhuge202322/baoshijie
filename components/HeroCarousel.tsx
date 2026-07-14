"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const slides = [
  {
    image: "/images/bespoke-elemental/hero-01.png",
    alt: "Classic Porsche 911 in a dark studio with its body panels open",
    copy: "Bespoke Elemental now specializes in premium restoration or tuning parts & OE aftermarket parts for classic Porsche models, including the 911 (G-model, 964, 993, 996, 997)"
  },
  {
    image: "/images/bespoke-elemental/hero-02.png",
    alt: "Orange classic Porsche 911 Carrera in profile",
    copy: "From advanced carbon fiber composites to durable metal and plastic components, our parts are engineered for those who demand uncompromising quality."
  },
  {
    image: "/images/bespoke-elemental/hero-03.png",
    alt: "Orange classic Porsche 911 Carrera viewed from the rear",
    copy: "Born from the grueling demands of GT racing carbon fiber maintenance and development, our expertise is now available to elevate your driving experience. We don't just supply parts; we craft the components that keep automotive legends alive."
  }
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const dragStart = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    setActive((index + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [active]);

  const finishDrag = (clientX: number) => {
    if (dragStart.current === null) return;
    const distance = clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(distance) < 48) return;
    goTo(active + (distance < 0 ? 1 : -1));
  };

  return (
    <div
      className="hero-carousel"
      aria-roledescription="carousel"
      aria-label="Bespoke Elemental classic Porsche showcase"
      onPointerDown={(event) => {
        if (event.button !== 0 || (event.target as HTMLElement).closest("button, a")) return;
        dragStart.current = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event) => finishDrag(event.clientX)}
      onPointerCancel={() => {
        dragStart.current = null;
      }}
    >
      <div className="hero-carousel-track" style={{ transform: `translate3d(-${active * 100}%, 0, 0)` }}>
        {slides.map((slide, index) => (
          <article
            className="hero-carousel-slide"
            key={slide.image}
            aria-hidden={active !== index}
          >
            <img src={slide.image} alt={slide.alt} draggable={false} />
            {slide.copy && (
              <div className="hero-carousel-copy">
                <p>{slide.copy}</p>
              </div>
            )}
          </article>
        ))}
      </div>

      <button
        className="carousel-arrow carousel-arrow-left"
        type="button"
        onClick={() => goTo(active - 1)}
        aria-label="Previous image"
      >
        <ChevronLeft size={34} aria-hidden="true" />
      </button>
      <button
        className="carousel-arrow carousel-arrow-right"
        type="button"
        onClick={() => goTo(active + 1)}
        aria-label="Next image"
      >
        <ChevronRight size={34} aria-hidden="true" />
      </button>

      <div className="carousel-dots" aria-label="Choose image">
        {slides.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            className={active === index ? "active" : ""}
            onClick={() => goTo(index)}
            aria-label={`Show image ${index + 1}`}
            aria-current={active === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
