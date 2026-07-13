import { Html, Head, Main, NextScript } from 'next/document';
import { API_BASE_URL } from '@/lib/config';

/**
 * The uploads host. Article images are served from it, and the browser cannot
 * discover it until it has already parsed the HTML and started rendering — by
 * which point the DNS lookup and TLS handshake sit directly on the critical path
 * of the LCP image. Warming the connection here removes that from LCP.
 */
const UPLOADS_ORIGIN = process.env.NEXT_PUBLIC_UPLOADS_URL || API_BASE_URL;

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* The API is hit by every page for questions/articles/comments. */}
        <link rel="preconnect" href={API_BASE_URL} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={API_BASE_URL} />
        {UPLOADS_ORIGIN !== API_BASE_URL && (
          <>
            <link rel="preconnect" href={UPLOADS_ORIGIN} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={UPLOADS_ORIGIN} />
          </>
        )}

        <link
          rel="alternate"
          type="application/rss+xml"
          title="فتاوى المأذون الشرعي"
          href="/rss.xml"
        />

        <meta name="theme-color" content="#FBFAF8" />
        {/* iOS Safari auto-links any run of digits as a phone number, which turns
            dates and article numerals into blue tappable links. The real phone
            numbers on the site are explicit `tel:` anchors already. */}
        <meta name="format-detection" content="telephone=no" />
      </Head>
      <body className="bg-paper">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
