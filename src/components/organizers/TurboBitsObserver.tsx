'use client';

import { useEffect, useRef } from 'react';

export default function TurboBitsObserver() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedSetRef = useRef<WeakSet<HTMLElement>>(new WeakSet());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isDestroyed = false;
    let hasHydrated = false;

    // Mobile scroll focus is only relevant on screens below 768px
    if (window.innerWidth >= 768) return;

    const attachCards = () => {
      const currentObserver = observerRef.current;
      if (!currentObserver || isDestroyed) return;
      const cards = document.querySelectorAll<HTMLElement>(
        '.turbobits-card, .faculty-card, .yugantar-card-interactive, .nexus-card, .nexus-skeuo-card'
      );
      cards.forEach((card) => {
        if (!observedSetRef.current.has(card)) {
          observedSetRef.current.add(card);
          currentObserver.observe(card);
        }
      });
    };

    const initObserver = () => {
      if (isDestroyed || observerRef.current) return;
      if (window.innerWidth >= 768) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (window.innerWidth >= 768 || !hasHydrated) return;
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('mobile-focused-card');
              entry.target.setAttribute('data-mobile-focused', 'true');
            } else {
              entry.target.classList.remove('mobile-focused-card');
              entry.target.removeAttribute('data-mobile-focused');
            }
          });
        },
        {
          root: null,
          rootMargin: '-20% 0px -20% 0px',
          threshold: 0.12,
        }
      );

      attachCards();
    };

    // Mark hydrated after microtask/event-loop turns have cleared initial React hydration
    const hydrationTimer = setTimeout(() => {
      hasHydrated = true;
      initObserver();
    }, 400);

    // Also activate on user scroll/touch once hydrated
    const handleInitialInteraction = () => {
      hasHydrated = true;
      initObserver();
    };

    window.addEventListener('scroll', handleInitialInteraction, { passive: true });
    window.addEventListener('touchmove', handleInitialInteraction, { passive: true });
    window.addEventListener('pointerdown', handleInitialInteraction, { passive: true });
    window.addEventListener('popstate', attachCards);

    // MutationObserver to catch dynamically injected cards
    const mutationObserver = new MutationObserver(() => {
      if (hasHydrated && observerRef.current) {
        attachCards();
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      isDestroyed = true;
      clearTimeout(hydrationTimer);
      window.removeEventListener('scroll', handleInitialInteraction);
      window.removeEventListener('touchmove', handleInitialInteraction);
      window.removeEventListener('pointerdown', handleInitialInteraction);
      window.removeEventListener('popstate', attachCards);
      observerRef.current?.disconnect();
      observerRef.current = null;
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
