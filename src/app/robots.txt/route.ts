import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://eduplatform.com';

export async function GET() {
  const robotsTxt = `# Robots.txt for Masarat
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /checkout/
Disallow: /_next/

# Sitemap
Sitemap: ${BASE_URL}/api/sitemap

# Crawl-delay
Crawl-delay: 1
`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
