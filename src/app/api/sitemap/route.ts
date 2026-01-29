import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://eduplatform.com';

export async function GET() {
  try {
    // Get all published courses
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    // Get all categories
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
        createdAt: true,
      },
    });

    // Get all instructors with courses
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        courses: {
          some: {
            isPublished: true,
          },
        },
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    const staticPages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/courses', priority: 0.9, changefreq: 'daily' },
      { url: '/instructors', priority: 0.8, changefreq: 'weekly' },
      { url: '/pricing', priority: 0.7, changefreq: 'weekly' },
      { url: '/contact', priority: 0.5, changefreq: 'monthly' },
      { url: '/login', priority: 0.3, changefreq: 'monthly' },
      { url: '/register', priority: 0.3, changefreq: 'monthly' },
    ];

    const urls = [
      // Static pages
      ...staticPages.map((page) => ({
        loc: `${BASE_URL}${page.url}`,
        lastmod: new Date().toISOString(),
        changefreq: page.changefreq,
        priority: page.priority,
      })),
      // Course pages
      ...courses.map((course) => ({
        loc: `${BASE_URL}/courses/${course.id}`,
        lastmod: course.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      })),
      // Category pages
      ...categories
        .filter((c) => c.slug)
        .map((category) => ({
          loc: `${BASE_URL}/courses?category=${category.slug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.7,
        })),
      // Instructor pages
      ...instructors.map((instructor) => ({
        loc: `${BASE_URL}/instructors/${instructor.id}`,
        lastmod: instructor.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.6,
      })),
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
}
