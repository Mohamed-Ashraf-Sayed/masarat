'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface TeamMember {
  id: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  image: string | null;
  credentials: string | null;
}

export default function TeamSection() {
  const { language } = useLanguage();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch('/api/team');
        const result = await response.json();
        if (result.success) {
          setTeam(result.data);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  // لا تعرض السكشن لو مفيش أعضاء
  if (!loading && team.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
            {language === 'ar' ? 'فريقنا' : 'Our Team'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'فريق العمل' : 'Meet Our Team'}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'نخبة من الخبراء والمتخصصين في مجال تحليل السلوك التطبيقي'
              : 'A group of experts and specialists in Applied Behavior Analysis'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#4485b5] animate-spin" />
          </div>
        ) : (
          /* Team Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <div
                key={member.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-72 overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200">
                  <img
                    src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.nameEn)}&size=300&background=4485b5&color=fff&font-size=0.35`}
                    alt={language === 'ar' ? member.nameAr : member.nameEn}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.nameEn)}&size=300&background=4485b5&color=fff&font-size=0.35`;
                    }}
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#4485b5]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-5 text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {language === 'ar' ? member.nameAr : member.nameEn}
                  </h3>
                  <p className="text-[#4485b5] text-sm font-medium mb-1">
                    {language === 'ar' ? member.roleAr : member.roleEn}
                  </p>
                  {member.credentials && (
                    <p className="text-gray-500 text-xs">
                      {member.credentials}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
