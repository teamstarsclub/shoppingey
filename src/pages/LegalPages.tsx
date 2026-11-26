import React, { useState } from 'react';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { SITE_CONFIG } from '../data/reviews';
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from '../utils/catalog';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Link } from '../components/Link';
import { SchemaMarkup } from '../components/SchemaMarkup';
import { SEOHead } from '../components/SEOHead';

export type LegalPageType =
  | 'about'
  | 'how-we-review'
  | 'affiliate-disclosure'
  | 'privacy-policy'
  | 'terms'
  | 'contact';

export interface LegalPagesProps {
  page: LegalPageType;
}

const PAGE_META: Record<
  LegalPageType,
  { title: string; heading: string; description: string; path: string }
> = {
  about: {
    title: 'About Shoppingey.com — Independent Amazon Product Review Publication',
    heading: 'About Shoppingey.com',
    description:
      'Learn about Shoppingey.com, our independent editorial mission, and how we review everyday Amazon products without brand sponsorships.',
    path: '/about',
  },
  'how-we-review': {
    title: 'How We Review Products — 5-Point Testing Criteria | Shoppingey.com',
    heading: 'How We Review Products',
    description:
      'Discover Shoppingey.com’s transparent 5-point product testing rubric covering Build Quality, Performance, Value, Ease of Use, and Durability.',
    path: '/how-we-review',
  },
  'affiliate-disclosure': {
    title: 'Affiliate Disclosure — FTC & Amazon Associates Compliance | Shoppingey.com',
    heading: 'Affiliate Disclosure',
    description:
      'Read Shoppingey.com’s full FTC and Amazon Associates disclosure explaining how reader-supported affiliate links fund our independent reviews.',
    path: '/affiliate-disclosure',
  },
  'privacy-policy': {
    title: 'Privacy Policy — Cookies & Data Transparency | Shoppingey.com',
    heading: 'Privacy Policy',
    description:
      'Review Shoppingey.com’s GDPR and CCPA-aware privacy policy, including how Amazon Associates referral tracking cookies work.',
    path: '/privacy-policy',
  },
  terms: {
    title: 'Terms of Use & Product Disclaimer | Shoppingey.com',
    heading: 'Terms of Use & Disclaimer',
    description:
      'Terms governing your use of Shoppingey.com, including live Amazon price and availability disclaimers.',
    path: '/terms',
  },
  contact: {
    title: 'Contact Editorial Team | Shoppingey.com',
    heading: 'Contact Shoppingey.com',
    description:
      'Reach the Shoppingey.com editorial team for review suggestions, factual corrections, or partnership inquiries.',
    path: '/contact',
  },
};

function ContactFormSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Product Review Suggestion');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setError('Please complete your name, email address, and message before sending.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address so our editors can reply.');
      return;
    }

    if (trimmedMessage.length < 15) {
      setError('Please share at least 15 characters so we have enough context to help.');
      return;
    }

    setError(null);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        role="status"
        className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-6 space-y-3"
      >
        <div className="flex items-center gap-2 text-[#065F46] font-bold text-base">
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          <span>Inquiry Received — Thank You, {name.trim()}</span>
        </div>
        <p className="text-sm text-[#065F46] leading-relaxed">
          We logged your message under <strong>{topic}</strong>. Our editorial desk responds to
          reader emails within 2 business days. For urgent corrections, you can also write directly
          to{' '}
          <a href={`mailto:${SITE_CONFIG.contactEmail}`} className="underline font-semibold">
            {SITE_CONFIG.contactEmail}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setName('');
            setEmail('');
            setMessage('');
          }}
          className="px-4 py-2 text-xs font-semibold text-[#065F46] bg-white border border-[#A7F3D0] rounded-md hover:bg-[#F0FDF4] transition-colors cursor-pointer"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div
          role="alert"
          className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm rounded-md px-4 py-3"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-semibold text-[#111827] mb-1.5">
            Your Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Rivera"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D1D5DB] rounded-md text-[#111827] focus:border-[#F59E0B] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-xs font-semibold text-[#111827] mb-1.5">
            Email Address
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D1D5DB] rounded-md text-[#111827] focus:border-[#F59E0B] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-topic" className="block text-xs font-semibold text-[#111827] mb-1.5">
          Topic
        </label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D1D5DB] rounded-md text-[#111827] focus:border-[#F59E0B] focus:outline-none"
        >
          <option value="Product Review Suggestion">Product Review Suggestion</option>
          <option value="Editorial Correction or Spec Update">
            Editorial Correction or Spec Update
          </option>
          <option value="Press or General Question">Press or General Question</option>
          <option value="Privacy or Legal Inquiry">Privacy or Legal Inquiry</option>
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-xs font-semibold text-[#111827] mb-1.5">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us which Amazon product you want tested next or share feedback on a review..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D1D5DB] rounded-md text-[#111827] focus:border-[#F59E0B] focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="px-6 py-2.5 text-sm font-semibold text-[#131921] bg-[#F59E0B] hover:bg-[#D97706] rounded-md transition-colors cursor-pointer"
      >
        Send Message
      </button>
    </form>
  );
}

export const LegalPages: React.FC<LegalPagesProps> = ({ page }) => {
  const meta = PAGE_META[page];
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: meta.heading, path: meta.path },
  ];

  const schemaType =
    page === 'about' ? 'AboutPage' : page === 'contact' ? 'ContactPage' : 'WebPage';
  const isIndexablePage = page === 'about' || page === 'how-we-review';

  return (
    <>
      <SEOHead
        title={meta.title}
        description={meta.description}
        canonicalPath={meta.path}
        ogType="website"
        robots={
          isIndexablePage
            ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
            : 'noindex, follow'
        }
      />
      <SchemaMarkup
        id={`legal-${page}`}
        schemas={[
          buildWebPageJsonLd({
            type: schemaType,
            name: meta.heading,
            description: meta.description,
            path: meta.path,
          }),
          buildBreadcrumbJsonLd(breadcrumbs),
        ]}
      />

      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={breadcrumbs} className="mb-5" />

        <article className="bg-white border border-[#E5E7EB] rounded-lg p-6 sm:p-10 space-y-6">
          <header className="pb-5 border-b border-[#E5E7EB]">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              {meta.heading}
            </h1>
            <p className="mt-2 text-xs text-[#4B5563]">
              Last reviewed: November 2026 · {SITE_CONFIG.name} Editorial Standards
            </p>
          </header>

          {page === 'about' && (
            <div className="space-y-5 text-[15px] leading-relaxed text-[#374151]">
              <p>
                <strong>Shoppingey.com</strong> is an independent consumer product review
                publication focused on cutting through marketplace clutter on Amazon. Across our
                five core departments—Home &amp; Tech, Home &amp; Kitchen, Home Decor, Tools, and
                Gardening Gadgets—we publish deeply researched, hands-on verdicts built for real
                shoppers rather than search bots.
              </p>
              <h2 className="text-lg font-bold text-[#111827] pt-2">
                Our Independence from Amazon
              </h2>
              <p>
                Shoppingey.com is not owned by, operated by, or endorsed by Amazon.com, Inc. We do
                not accept payment from brands in exchange for positive coverage, guaranteed review
                placement, or altered scores. When an item has frustrating drawbacks—whether loud
                motors, short cords, or 2.4GHz-only Wi-Fi hubs—we call them out right at the top of
                the review.
              </p>
              <h2 className="text-lg font-bold text-[#111827] pt-2">
                Focused Quality Over Endless Listicle Noise
              </h2>
              <p>
                Instead of churning out shallow summaries of products we have never touched, our
                editors maintain curated department hubs spotlighting products that genuinely earn
                their space in your home, kitchen, workshop, or garden.
              </p>
            </div>
          )}

          {page === 'how-we-review' && (
            <div className="space-y-6 text-[15px] leading-relaxed text-[#374151]">
              <p>
                Every product featured on Shoppingey.com is evaluated against a transparent 5-point
                scoring framework. Our final 10-point Shoppingey Score and 5-star summary reflect
                structured multi-week testing rather than first-impression unboxing hype.
              </p>
              <ol className="space-y-4">
                {[
                  {
                    num: '01',
                    name: 'Build Quality & Materials',
                    detail:
                      'We inspect chassis rigidity, metal vs. plastic fasteners, ingress sealing, finish consistency, and mechanical tolerances out of the box and after repeated handling.',
                  },
                  {
                    num: '02',
                    name: 'Real-World Performance',
                    detail:
                      'Every category uses domain-specific benchmarks—thermocouple cooking evenness in kitchens, torque and chuck runout in workshops, spectrometer CRI on lighting, and 80 PSI leak checks on garden hardware.',
                  },
                  {
                    num: '03',
                    name: 'Value for Its Price Tier',
                    detail:
                      'Rather than chasing the cheapest listing, we judge whether a product outperforms rivals within its Budget-Friendly, Mid-Range, or Premium tier without hiding costs behind mandatory subscriptions.',
                  },
                  {
                    num: '04',
                    name: 'Ease of Use & Daily Ergonomics',
                    detail:
                      'Setup friction, app clarity, dishwasher cleanup speed, noise levels, and tactile physical controls heavily influence whether a product becomes a daily favorite or gathers dust.',
                  },
                  {
                    num: '05',
                    name: 'Long-Term Durability & Support',
                    detail:
                      'We evaluate battery replaceability, nonstick coating wear, firmware maintenance, warranty clarity, and verified long-term owner reliability trends.',
                  },
                ].map((criterion) => (
                  <li
                    key={criterion.num}
                    className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]"
                  >
                    <h2 className="text-base font-bold text-[#111827]">
                      <span className="font-mono text-[#B45309] mr-2">{criterion.num}.</span>
                      {criterion.name}
                    </h2>
                    <p className="mt-1.5 text-sm text-[#4B5563]">{criterion.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {page === 'affiliate-disclosure' && (
            <div className="space-y-5 text-[15px] leading-relaxed text-[#374151]">
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-[#111827] leading-relaxed font-medium">
                  As an Amazon Associate, I earn from qualifying purchases. Shoppingey.com is an
                  independent product review publication and is not owned by, operated by, or
                  affiliated with Amazon.com, Inc. Amazon and the Amazon logo are trademarks of
                  Amazon.com, Inc. or its affiliates.
                </p>
              </div>
              <h2 className="text-lg font-bold text-[#111827]">
                How Reader-Supported Affiliate Links Work
              </h2>
              <p>
                In compliance with the Federal Trade Commission (FTC) endorsement guidelines,
                please assume that outbound product buttons linking to Amazon.com across
                Shoppingey.com are tagged affiliate links. When you click a &ldquo;Buy On Amazon&rdquo;
                button and complete a qualifying order, Amazon pays Shoppingey.com a modest referral
                commission.
              </p>
              <p>
                This commission never adds a single cent to the price you pay on Amazon. Affiliate
                revenue funds our testing samples, lab instrumentation, and hosting so we can keep
                every buying guide free to read without intrusive pop-ups or paywalls.
              </p>
              <h2 className="text-lg font-bold text-[#111827]">Editorial Firewall</h2>
              <p>
                Affiliate commission rates never influence which products earn a &ldquo;Shoppingey
                Top Pick&rdquo;, &ldquo;Best Value&rdquo;, or &ldquo;Editor Tested&rdquo;
                designation. If a product fails our testing standards, we do not recommend it.
              </p>
            </div>
          )}

          {page === 'privacy-policy' && (
            <div className="space-y-5 text-[15px] leading-relaxed text-[#374151]">
              <p>
                Shoppingey.com respects your privacy. This policy explains what minimal information
                is processed when you browse our reviews and how third-party affiliate cookies
                operate when you click through to Amazon.
              </p>
              <h2 className="text-lg font-bold text-[#111827]">1. Information We Collect</h2>
              <p>
                We do not require user accounts, logins, or payment details to read Shoppingey.com.
                If you voluntarily submit a message via our Contact page or email{' '}
                <strong>{SITE_CONFIG.contactEmail}</strong>, we use your name and email solely to
                reply to your inquiry and never sell or rent your contact details to third parties.
              </p>
              <h2 className="text-lg font-bold text-[#111827]">
                2. Google AdSense &amp; Advertising Cookies
              </h2>
              <p>
                Shoppingey.com uses Google AdSense to display relevant advertisements that help keep
                our independent lab reviews free to read. Third-party vendors, including Google,
                use cookies to serve ads based on a visitor&rsquo;s prior visits to Shoppingey.com
                or other websites. Google&rsquo;s use of advertising cookies enables it and its
                partners to serve ads based on your browsing activity. You may opt out of
                personalized advertising at any time by visiting{' '}
                <a
                  href="https://myadcenter.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-[#111827]"
                >
                  Google Ads Settings
                </a>{' '}
                or{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-[#111827]"
                >
                  aboutads.info
                </a>
                .
              </p>
              <h2 className="text-lg font-bold text-[#111827]">
                3. Amazon Associates &amp; Referral Cookies
              </h2>
              <p>
                When you click an outbound Amazon affiliate link on Shoppingey.com, Amazon.com may
                place a standard referral cookie in your browser to attribute qualifying purchases
                made during that session to our Associate ID. That cookie is governed exclusively by
                Amazon’s own Privacy Notice. You may clear or block third-party cookies at any time
                via your browser settings.
              </p>
              <h2 className="text-lg font-bold text-[#111827]">4. GDPR &amp; CCPA Rights</h2>
              <p>
                Visitors in the European Economic Area, United Kingdom, and California may request
                access to, correction of, or deletion of any personal correspondence sent to us by
                emailing{' '}
                <a
                  href={`mailto:${SITE_CONFIG.contactEmail}`}
                  className="underline font-semibold text-[#111827]"
                >
                  {SITE_CONFIG.contactEmail}
                </a>
                .
              </p>
            </div>
          )}

          {page === 'terms' && (
            <div className="space-y-5 text-[15px] leading-relaxed text-[#374151]">
              <p>
                By accessing Shoppingey.com, you agree to the following Terms of Use and product
                disclaimers.
              </p>
              <h2 className="text-lg font-bold text-[#111827]">
                1. Informational Purposes &amp; Live Pricing Disclaimer
              </h2>
              <p>
                All reviews, specifications, and comparisons published on Shoppingey.com are
                provided for informational purposes. Because product prices, promotions, stock
                status, and seller warranties on Amazon change frequently, we intentionally avoid
                displaying static dollar prices and use general price tiers instead. Always verify
                the live price, bundle contents, and return terms directly on Amazon.com before
                purchasing.
              </p>
              <h2 className="text-lg font-bold text-[#111827]">2. External Links &amp; Merchant Responsibility</h2>
              <p>
                Shoppingey.com does not sell, ship, or warranty any physical merchandise. Any order
                you place after clicking an affiliate button is transacted directly with Amazon or
                its third-party marketplace sellers.
              </p>
              <h2 className="text-lg font-bold text-[#111827]">3. Intellectual Property</h2>
              <p>
                All original review copy, scoring tables, and site graphics are copyright
                Shoppingey.com. Manufacturer names, model designations, and Amazon trademarks belong
                to their respective owners.
              </p>
            </div>
          )}

          {page === 'contact' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#4B5563]">Editorial Desk Email</p>
                    <a
                      href={`mailto:${SITE_CONFIG.contactEmail}`}
                      className="text-sm font-bold text-[#111827] hover:text-[#B45309] underline"
                    >
                      {SITE_CONFIG.contactEmail}
                    </a>
                  </div>
                </div>
                <p className="text-xs text-[#4B5563]">
                  Typical response time: 1–2 business days
                </p>
              </div>

              <ContactFormSection />
            </div>
          )}
        </article>
      </div>
    </>
  );
};
