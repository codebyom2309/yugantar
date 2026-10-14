'use client';

import { useEffect } from 'react';

export default function TurboBitsObserver() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Mobile scroll focus is only relevant on screens below 768px
    if (window.innerWidth >= 768) return;

    let isDestroyed = false;
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    const observedSet = new WeakSet<HTMLElement>();

    // Defer observer setup until after the browser has completed initial React hydration
    // to prevent mutating className before or during client tree hydration
    const initObserver = () => {
      if (isDestroyed || observer) return;
      if (window.innerWidth >= 768) return;

      observer = new IntersectionObserver(
        (entries) => {
          if (window.innerWidth >= 768) return;
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
          rootMargin: '-22% 0px -22% 0px',
          threshold: 0.15,
        }
      );

      const attachCards = () => {
        if (!observer) return;
        // Strictly target faculty cards and turbobits team cards on mobile
        // General site interactive cards (e.g. city map, competitions) rely on standard CSS hover
        const cards = document.querySelectorAll<HTMLElement>(
          '.turbobits-card, .faculty-card'
        );
        cards.forEach((card) => {
          if (!observedSet.has(card)) {
            observedSet.add(card);
            observer.observe(card);
          }
        });
      };

      // Initial attach after hydration
      attachCards();

      // Dynamically attach cards if loaded asynchronously
      mutationObserver = new MutationObserver(() => {
        attachCards();
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };

    // Activate on first user scroll or touch interaction (natural trigger for mobile scroll effect)
    // Ensures zero mutations occur prior to user engagement and hydration completion
    const handleInitialInteraction = () => {
      initObserver();
      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener('scroll', handleInitialInteraction);
      window.removeEventListener('touchmove', handleInitialInteraction);
      window.removeEventListener('pointerdown', handleInitialInteraction);
    };

    window.addEventListener('scroll', handleInitialInteraction, { passive: true });
    window.addEventListener('touchmove', handleInitialInteraction, { passive: true });
    window.addEventListener('pointerdown', handleInitialInteraction, { passive: true });

    // Fallback: only initialize after full window load and a safe buffer
    const onWindowLoad = () => {
      setTimeout(() => {
        initObserver();
        cleanupListeners();
      }, 2000);
    };

    if (document.readyState === 'complete') {
      onWindowLoad();
    } else {
      window.addEventListener('load', onWindowLoad, { once: true });
    }

    return () => {
      isDestroyed = true;
      cleanupListeners();
      window.removeEventListener('load', onWindowLoad);
      observer?.disconnect();
      mutationObserver?.disconnect();
    };
  }, []);

  return null;
}

