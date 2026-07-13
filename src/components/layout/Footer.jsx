import Link from 'next/link';
import { navLinks, services, site } from '@/lib/site';
import { Container } from '@/components/ui/Layout';
import { SocialLinks } from '@/components/ContactChannels';

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-surface">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Identity */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-sm font-bold text-gold-300">
                م
              </span>
              <div className="leading-none">
                <p className="text-[0.9375rem] font-semibold text-ink-900">{site.name}</p>
                <p className="mt-1 text-[0.6875rem] font-medium text-ink-400">{site.fullName}</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-[1.9] text-ink-500">{site.credentials}</p>

            {/* Neutral at rest, brand-coloured on hover — the icons announce
                which app they open before the label is read. */}
            <SocialLinks items={site.social} className="mt-6" />
          </div>

          {/* Pages */}
          <nav className="lg:col-span-3" aria-labelledby="footer-pages">
            <h2 id="footer-pages" className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
              الصفحات
            </h2>
            <ul className="mt-4 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-600 transition-colors duration-200 hover:text-gold-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services — internal-link surface for SEO, not just decoration */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">الخدمات</h2>
            <ul className="mt-4 space-y-3">
              {services.map((s) => (
                <li key={s.title} className="text-sm text-ink-600">
                  {s.title}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">تواصل</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={site.phone.href}
                  className="text-sm text-ink-600 transition-colors duration-200 hover:text-gold-600"
                >
                  <span className="ltr-nums">{site.phone.display}</span>
                </a>
              </li>
              <li>
                <a
                  href={site.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ink-600 transition-colors duration-200 hover:text-gold-600"
                >
                  واتساب — <span className="ltr-nums">{site.whatsapp.display}</span>
                </a>
              </li>
              <li className="text-sm text-ink-500">{site.address.serviceNote}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-400">
            © <span className="ltr-nums">{new Date().getFullYear()}</span> {site.name} — جميع الحقوق
            محفوظة.
          </p>
          <p className="text-xs text-ink-300">{site.address.coverage}</p>
        </div>
      </Container>
    </footer>
  );
}
