'use client';

import { useEffect } from 'react';

export default function TurboBitsObserver() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cards = document.querySelectorAll<HTMLElement>('.turbobits-card');
    if (!cards || cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && window.innerWidth < 640) {
            entry.target.classList.add('mobile-focused-card');
          } else {
            entry.target.classList.remove('mobile-focused-card');
          }
        });
      },
      {
        root: null,
        rootMargin: '-25% 0px -25% 0px',
        threshold: 0.5,
      }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return null;
}
