'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { ikUrl } from '@/lib/imagekit';
import { Building2, Building, Target, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface Initiative {
  id: string;
  titleAr: string;
  titleEn: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface Entity {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  logo?: string;
  initiatives: Initiative[];
  _count: { initiatives: number };
}

interface Union {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  logo?: string;
  entities: Entity[];
  _count: { entities: number };
}

export default function UnionPage() {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [unions, setUnions] = useState<Union[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUnions, setExpandedUnions] = useState<Set<string>>(new Set());
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/unions')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUnions(data.data);
          if (data.data.length > 0) setExpandedUnions(new Set([data.data[0].id]));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleUnion = (id: string) => {
    setExpandedUnions(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleEntity = (id: string) => {
    setExpandedEntities(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir={ar ? 'rtl' : 'ltr'}>
      <Navbar variant="solid" />

      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-bold mb-4">{ar ? 'هيكل الاتحاد' : 'Union Structure'}</h1>
          <p className="text-xl opacity-80">{ar ? 'تعرف على الاتحادات والجهات والمبادرات' : 'Explore our unions, entities, and initiatives'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        {unions.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{ar ? 'لا يوجد اتحادات حالياً' : 'No unions available yet'}</p>
          </div>
        ) : (
          unions.map(union => (
            <div key={union.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleUnion(union.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {union.logo ? (
                    <img src={ikUrl(union.logo, { width: 100 })} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-primary-600" />
                    </div>
                  )}
                  <div className="text-start">
                    <h2 className="text-xl font-bold text-gray-900">{ar ? union.nameAr : union.nameEn}</h2>
                    <p className="text-sm text-gray-500 mt-1">{union.entities.length} {ar ? 'جهة' : 'entities'}</p>
                  </div>
                </div>
                {expandedUnions.has(union.id) ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {expandedUnions.has(union.id) && (
                <div className="border-t border-gray-100">
                  <div className="p-6 pt-4">
                    <p className="text-gray-600 mb-6">{ar ? union.descriptionAr : union.descriptionEn}</p>
                    {union.entities.length === 0 ? (
                      <p className="text-gray-400 text-sm">{ar ? 'لا يوجد جهات بعد' : 'No entities yet'}</p>
                    ) : (
                      <div className="space-y-4">
                        {union.entities.map(entity => (
                          <div key={entity.id} className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                              onClick={() => toggleEntity(entity.id)}
                              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {entity.logo ? (
                                  <img src={ikUrl(entity.logo, { width: 100 })} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Building className="w-5 h-5 text-blue-600" />
                                  </div>
                                )}
                                <div className="text-start">
                                  <h3 className="font-semibold text-gray-900">{ar ? entity.nameAr : entity.nameEn}</h3>
                                  <p className="text-xs text-gray-500">{entity.initiatives.length} {ar ? 'مبادرة نشطة' : 'active initiatives'}</p>
                                </div>
                              </div>
                              {expandedEntities.has(entity.id) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>

                            {expandedEntities.has(entity.id) && (
                              <div className="border-t border-gray-100 p-4 bg-gray-50">
                                {(ar ? entity.descriptionAr : entity.descriptionEn) && (
                                  <p className="text-sm text-gray-600 mb-3">{ar ? entity.descriptionAr : entity.descriptionEn}</p>
                                )}
                                {entity.initiatives.length === 0 ? (
                                  <p className="text-xs text-gray-400 text-center py-2">{ar ? 'لا توجد مبادرات نشطة حالياً' : 'No active initiatives yet'}</p>
                                ) : (
                                  <div className="space-y-2">
                                    {entity.initiatives.map(initiative => (
                                      <div key={initiative.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                                        <Target className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        <div className="flex-1 text-start">
                                          <p className="text-sm font-medium text-gray-900">{ar ? initiative.titleAr : initiative.titleEn}</p>
                                          {(initiative.startDate || initiative.endDate) && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                              <Calendar className="w-3 h-3" />
                                              <span>
                                                {initiative.startDate && new Date(initiative.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}
                                                {initiative.endDate && ` - ${new Date(initiative.endDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}`}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{ar ? 'نشطة' : 'Active'}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Footer />
    </div>
  );
}
