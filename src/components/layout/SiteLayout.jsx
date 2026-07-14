import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import WelcomeModal from '@/components/WelcomeModal';
import { api, endpoints } from '@/lib/api';

export default function SiteLayout({ children }) {
  /**
   * Record the visit, once per page load.
   *
   * This is also what establishes the visitor's identity: the server sets its
   * HttpOnly `visitor_id` cookie in response, and every later "my questions" /
   * "my notifications" call is scoped to it. So this is not merely analytics —
   * without it, a visitor has no identity and can never be shown their own answer.
   */
  useEffect(() => {
    api.post(endpoints.visit).catch(() => {
      /* Analytics must never be able to break the page. */
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Standard practice, and free: lets keyboard users jump the nav. */}
      <a
        href="#main"
        // Logical `start`, not physical `right` — the physical value would put
        // the skip link on the wrong side the moment the document is LTR.
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        تخطَّ إلى المحتوى
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      {/* Renders nothing until it triggers, and never more than once a session. */}
      <WelcomeModal />
    </div>
  );
}
