import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router does not scroll to a #hash target on its own, so a plain
// link to "/#pricing" used to land on the top of the landing page and
// look like navigation had done nothing. This scrolls to the section
// when the hash is present, and to the top on a normal page change.
export default function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
