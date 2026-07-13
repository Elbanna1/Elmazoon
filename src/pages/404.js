import Seo from '@/components/Seo';
import Button from '@/components/ui/Button';
import { Container, Section } from '@/components/ui/Layout';

export default function NotFoundPage() {
  return (
    <>
      <Seo title="الصفحة غير موجودة" noindex />

      <Section spacing="loose">
        <Container size="narrow" className="text-center">
          <p className="ltr-nums text-sm font-semibold tracking-[0.2em] text-gold-600">404</p>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            الصفحة غير موجودة
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-[1.9] text-ink-500">
            ربما تم نقل الصفحة أو حذفها. يمكنك العودة إلى الرئيسية أو تصفّح الفتاوى.
          </p>
          {/* The old 404 was in English, on an Arabic site, with a bare "go home"
              link and no styling at all. */}
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/" variant="ink" size="lg">
              العودة إلى الرئيسية
            </Button>
            <Button href="/articles" variant="secondary" size="lg">
              تصفّح الفتاوى
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
