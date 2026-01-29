import { Metadata } from 'next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'course';
  locale?: 'ar' | 'en';
  noIndex?: boolean;
}

const siteConfig = {
  name: 'Masarat',
  nameAr: 'مسارات',
  description: 'منصة تعليمية متكاملة للدورات أونلاين',
  descriptionEn: 'Comprehensive online learning platform',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://eduplatform.com',
  twitterHandle: '@eduplatform',
  defaultImage: '/images/og-default.png',
};

export function generateMetadata({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  locale = 'ar',
  noIndex = false,
}: SEOProps): Metadata {
  const fullTitle = title
    ? `${title} | ${locale === 'ar' ? siteConfig.nameAr : siteConfig.name}`
    : locale === 'ar'
    ? siteConfig.nameAr
    : siteConfig.name;

  const fullDescription =
    description ||
    (locale === 'ar' ? siteConfig.description : siteConfig.descriptionEn);

  const fullUrl = url ? `${siteConfig.url}${url}` : siteConfig.url;
  const fullImage = image || siteConfig.defaultImage;

  // Map custom types to valid OpenGraph types
  const ogType = type === 'course' ? 'website' : type;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: keywords.join(', '),
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: fullUrl,
      languages: {
        ar: `${fullUrl}?lang=ar`,
        en: `${fullUrl}?lang=en`,
      },
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
      creator: siteConfig.twitterHandle,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

// Course structured data
export function generateCourseSchema(course: {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  instructorName: string;
  thumbnail?: string;
  price: number;
  rating?: number;
  reviewsCount?: number;
  duration?: number;
  level?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.titleEn,
    description: course.descriptionEn,
    provider: {
      '@type': 'Organization',
      name: siteConfig.name,
      sameAs: siteConfig.url,
    },
    instructor: {
      '@type': 'Person',
      name: course.instructorName,
    },
    image: course.thumbnail || siteConfig.defaultImage,
    offers: {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${siteConfig.url}/courses/${course.id}`,
    },
    aggregateRating: course.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: course.rating,
          reviewCount: course.reviewsCount || 0,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    educationalLevel: course.level,
    timeRequired: course.duration ? `PT${course.duration}M` : undefined,
  };
}

// Organization structured data
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [
      `https://twitter.com/${siteConfig.twitterHandle}`,
      'https://facebook.com/eduplatform',
      'https://linkedin.com/company/eduplatform',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-234-567-8900',
      contactType: 'customer service',
      availableLanguage: ['Arabic', 'English'],
    },
  };
}

// Breadcrumb structured data
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}

// FAQ structured data
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
