'use client';

import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AboutVideoSection from '@/components/AboutVideoSection';
import StatsSection from '@/components/StatsSection';
import PopularProgramsSection from '@/components/PopularProgramsSection';
import ConsultationsSection from '@/components/ConsultationsSection';
import FeaturesSection from '@/components/FeaturesSection';
import CoursesSection from '@/components/CoursesSection';
import UpcomingEventsSection from '@/components/UpcomingEventsSection';
import ActiveInitiativesSection from '@/components/ActiveInitiativesSection';
import TeamSection from '@/components/TeamSection';
import AccreditationsSection from '@/components/AccreditationsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar variant="solid" />
      <HeroSection />
      <AboutVideoSection />
      <StatsSection />
      <PopularProgramsSection />
      <ConsultationsSection />
      <FeaturesSection />
      <CoursesSection />
      <UpcomingEventsSection />
      <ActiveInitiativesSection />
      <TeamSection />
      <AccreditationsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
