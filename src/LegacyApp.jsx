import { useEffect } from 'react';

export default function LegacyApp() {
  useEffect(() => {
    import('../app.js').catch(() => {
      const toast = document.querySelector('#toast');
      if (toast) {
        toast.textContent = 'Could not load app interactions';
        toast.classList.add('show');
      }
    });
  }, []);

  return null;
}
