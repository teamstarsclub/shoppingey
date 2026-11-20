import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { SchemaMarkup } from './components/SchemaMarkup';
import { CategoryPage } from './pages/CategoryPage';
import { HomePage } from './pages/HomePage';
import { LegalPages } from './pages/LegalPages';
import { NotFoundPage } from './pages/NotFoundPage';
import { ReviewPage } from './pages/ReviewPage';
import { buildSitewideJsonLd } from './utils/catalog';
import { useRouter } from './utils/router';

const SITEWIDE_SCHEMAS = buildSitewideJsonLd();

export interface AppProps {
  initialPathname?: string;
}

export default function App({ initialPathname }: AppProps) {
  const { pathname, route } = useRouter(initialPathname);

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] text-[#111827]">
      {/* Sitewide Organization & WebSite SearchAction JSON-LD */}
      <SchemaMarkup id="sitewide" schemas={SITEWIDE_SCHEMAS} />

      <Header activePath={pathname} />

      <main className="flex-1">
        {route.type === 'home' && <HomePage initialQuery={route.query} />}
        {route.type === 'category' && <CategoryPage slug={route.slug} />}
        {route.type === 'review' && <ReviewPage slug={route.slug} />}
        {route.type === 'legal' && <LegalPages page={route.page} />}
        {route.type === 'not-found' && <NotFoundPage path={route.path} />}
      </main>

      <Footer />
    </div>
  );
}
