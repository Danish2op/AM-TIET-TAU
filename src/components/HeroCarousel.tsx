import { useEffect, useRef, useState } from "react";
import { GalleryItem } from "../content/siteContent";
import { nextIndex, prevIndex } from "../lib/carousel";

const ADVANCE_MS = 4000;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroCarousel({ items }: { items: GalleryItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || prefersReducedMotion() || items.length <= 1) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((current) => nextIndex(current, items.length));
    }, ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, items.length]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      setIndex((current) => nextIndex(current, items.length));
    } else if (event.key === "ArrowLeft") {
      setIndex((current) => prevIndex(current, items.length));
    }
  };

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label="Facility image carousel"
      tabIndex={0}
    >
      <div className="hero-carousel-frame">
        {items.map((item, itemIndex) => (
          <figure
            className={`hero-carousel-slide${itemIndex === index ? " active" : ""}`}
            key={item.src}
            aria-hidden={itemIndex === index ? undefined : true}
          >
            <img src={item.src} alt={item.alt} loading={itemIndex === 0 ? "eager" : "lazy"} />
            <figcaption>{item.tag}</figcaption>
          </figure>
        ))}
      </div>
      <div className="hero-carousel-dots" role="tablist" aria-label="Choose carousel slide">
        {items.map((item, itemIndex) => (
          <button
            key={item.src}
            role="tab"
            aria-selected={itemIndex === index}
            aria-label={`Show slide ${itemIndex + 1}: ${item.tag}`}
            className={itemIndex === index ? "active" : undefined}
            onClick={() => setIndex(itemIndex)}
          />
        ))}
      </div>
    </div>
  );
}
