import '@/styles/globals.css';
import Head from 'next/head';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import SiteLayout from '@/components/layout/SiteLayout';
import RouteProgress from '@/components/layout/RouteProgress';

// The previous font was Montserrat with a `latin` subset only — it contains no
// Arabic glyphs, so every character on the site silently fell back to whatever
// the OS supplied. This one actually renders the content.
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export default function App({ Component, pageProps }) {
  // Per-page layouts: the admin panel opts out of the public site chrome
  // instead of having the navbar and marketing footer forced onto it.
  const getLayout = Component.getLayout ?? ((page) => <SiteLayout>{page}</SiteLayout>);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {/* Carries the font variable only — the layouts below own their own
          height, and a second min-h-screen here just stacked on theirs. */}
      <div className={`${arabic.variable} font-sans`}>
        <RouteProgress />
        {getLayout(<Component {...pageProps} />)}
      </div>
    </>
  );
}
