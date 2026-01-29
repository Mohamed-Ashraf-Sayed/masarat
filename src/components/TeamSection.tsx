'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Linkedin, Mail } from 'lucide-react';

export default function TeamSection() {
  const { language } = useLanguage();

  const team = [
    {
      id: 1,
      name: { ar: 'د. أحمد العتيبي', en: 'Dr. Ahmed Al-Otaibi' },
      role: { ar: 'محلل سلوك معتمد BCBA', en: 'Board Certified Behavior Analyst' },
      image: '/images/team/vecteezy_a-smiling-saudi-arabian-man-in-traditional-thobe-and-ghutra_72489870.PNG',
      credentials: 'BCBA, M.Ed',
    },
    {
      id: 2,
      name: { ar: 'د. نورة القحطاني', en: 'Dr. Noura Al-Qahtani' },
      role: { ar: 'أخصائية تحليل سلوك', en: 'Behavior Analysis Specialist' },
      image: '/images/team/vecteezy_portrait-of-a-veiled-islamic-woman-in-a-black-hijab_57177538.png',
      credentials: 'QBA, IBA',
    },
    {
      id: 3,
      name: { ar: 'أ. خالد الدوسري', en: 'Mr. Khalid Al-Dosari' },
      role: { ar: 'مشرف برامج تدريبية', en: 'Training Programs Supervisor' },
      image: '/images/team/vecteezy_a-smiling-saudi-arabian-man-in-traditional-thobe-and-ghutra_72489870.PNG',
      credentials: 'IBT, QASP-S',
    },
    {
      id: 4,
      name: { ar: 'د. منى الشمري', en: 'Dr. Mona Al-Shammari' },
      role: { ar: 'استشارية تطوير المناهج', en: 'Curriculum Development Consultant' },
      image: '/images/team/vecteezy_portrait-of-a-veiled-islamic-woman-in-a-black-hijab_57177538.png',
      credentials: 'Ph.D, BCBA-D',
    },
  ];

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

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member) => (
            <div
              key={member.id}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-72 overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200">
                <img
                  src={member.image}
                  alt={member.name[language]}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name.en)}&size=300&background=4485b5&color=fff&font-size=0.35`;
                  }}
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#4485b5]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                  <div className="flex gap-3">
                    <a
                      href="#"
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#4485b5] hover:bg-[#4485b5] hover:text-white transition-colors"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#4485b5] hover:bg-[#4485b5] hover:text-white transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {member.name[language]}
                </h3>
                <p className="text-[#4485b5] text-sm font-medium mb-1">
                  {member.role[language]}
                </p>
                <p className="text-gray-500 text-xs">
                  {member.credentials}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
