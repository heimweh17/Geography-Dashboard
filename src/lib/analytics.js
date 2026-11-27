import { inject } from '@vercel/analytics';

export function startAnalytics() {
  inject({ mode: 'production' });

  const project = import.meta.env.VITE_STATCOUNTER_PROJECT_ID;
  const security = import.meta.env.VITE_STATCOUNTER_SECURITY;
  if (!project || !security) return;

  window.sc_project = Number(project);
  window.sc_security = security;
  window.sc_invisible = 1;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.statcounter.com/counter/counter.js';
  document.head.appendChild(script);
}
