export interface Course {
  id: string;
  title: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  instructor: {
    name: string;
    avatar: string;
    bio: {
      ar: string;
      en: string;
    };
  };
  thumbnail: string;
  price: number;
  originalPrice?: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  lessonsCount: number;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  isFeatured: boolean;
  isNew: boolean;
  lessons: Lesson[];
  requirements: { ar: string[]; en: string[] };
  outcomes: { ar: string[]; en: string[] };
}

export interface Lesson {
  id: string;
  title: {
    ar: string;
    en: string;
  };
  duration: number;
  videoUrl: string;
  isFree: boolean;
  order: number;
}

export interface Category {
  id: string;
  name: {
    ar: string;
    en: string;
  };
  icon: string;
  coursesCount: number;
  color: string;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  role: {
    ar: string;
    en: string;
  };
  content: {
    ar: string;
    en: string;
  };
  rating: number;
}

export interface PricingPlan {
  id: string;
  name: {
    ar: string;
    en: string;
  };
  price: {
    monthly: number;
    yearly: number;
  };
  features: {
    ar: string[];
    en: string[];
  };
  isPopular: boolean;
}

export const categories: Category[] = [
  {
    id: '1',
    name: { ar: 'البرمجة وتطوير الويب', en: 'Programming & Web Development' },
    icon: 'Code',
    coursesCount: 45,
    color: 'from-blue-500 to-blue-700',
  },
  {
    id: '2',
    name: { ar: 'التصميم الجرافيكي', en: 'Graphic Design' },
    icon: 'Palette',
    coursesCount: 32,
    color: 'from-purple-500 to-purple-700',
  },
  {
    id: '3',
    name: { ar: 'التسويق الرقمي', en: 'Digital Marketing' },
    icon: 'TrendingUp',
    coursesCount: 28,
    color: 'from-green-500 to-green-700',
  },
  {
    id: '4',
    name: { ar: 'إدارة الأعمال', en: 'Business Management' },
    icon: 'Briefcase',
    coursesCount: 24,
    color: 'from-orange-500 to-orange-700',
  },
  {
    id: '5',
    name: { ar: 'تعلم اللغات', en: 'Language Learning' },
    icon: 'Globe',
    coursesCount: 18,
    color: 'from-red-500 to-red-700',
  },
  {
    id: '6',
    name: { ar: 'علوم البيانات', en: 'Data Science' },
    icon: 'BarChart',
    coursesCount: 22,
    color: 'from-cyan-500 to-cyan-700',
  },
];

export const courses: Course[] = [
  {
    id: '1',
    title: {
      ar: 'دورة تطوير الويب الشاملة 2024',
      en: 'Complete Web Development Bootcamp 2024',
    },
    description: {
      ar: 'تعلم تطوير الويب من الصفر حتى الاحتراف. HTML, CSS, JavaScript, React, Node.js والمزيد!',
      en: 'Learn web development from scratch to professional level. HTML, CSS, JavaScript, React, Node.js and more!',
    },
    instructor: {
      name: 'محمد أحمد',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      bio: {
        ar: 'مطور ويب محترف بخبرة 10 سنوات في المجال',
        en: 'Professional web developer with 10 years of experience',
      },
    },
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    price: 199,
    originalPrice: 399,
    category: '1',
    level: 'beginner',
    duration: 42,
    lessonsCount: 156,
    studentsCount: 12500,
    rating: 4.8,
    reviewsCount: 2340,
    isFeatured: true,
    isNew: false,
    requirements: {
      ar: ['لا يتطلب خبرة سابقة', 'حاسوب متصل بالإنترنت', 'رغبة في التعلم'],
      en: ['No prior experience required', 'Computer with internet connection', 'Willingness to learn'],
    },
    outcomes: {
      ar: [
        'بناء مواقع ويب احترافية من الصفر',
        'تطوير تطبيقات React متقدمة',
        'إنشاء API باستخدام Node.js',
        'العمل مع قواعد البيانات',
      ],
      en: [
        'Build professional websites from scratch',
        'Develop advanced React applications',
        'Create APIs using Node.js',
        'Work with databases',
      ],
    },
    lessons: [
      { id: '1-1', title: { ar: 'مقدمة في تطوير الويب', en: 'Introduction to Web Development' }, duration: 15, videoUrl: '', isFree: true, order: 1 },
      { id: '1-2', title: { ar: 'أساسيات HTML', en: 'HTML Basics' }, duration: 45, videoUrl: '', isFree: true, order: 2 },
      { id: '1-3', title: { ar: 'تنسيق الصفحات بـ CSS', en: 'Styling with CSS' }, duration: 60, videoUrl: '', isFree: false, order: 3 },
      { id: '1-4', title: { ar: 'JavaScript للمبتدئين', en: 'JavaScript for Beginners' }, duration: 90, videoUrl: '', isFree: false, order: 4 },
      { id: '1-5', title: { ar: 'مقدمة في React', en: 'Introduction to React' }, duration: 75, videoUrl: '', isFree: false, order: 5 },
    ],
  },
  {
    id: '2',
    title: {
      ar: 'التصميم الجرافيكي باستخدام Photoshop',
      en: 'Graphic Design with Photoshop',
    },
    description: {
      ar: 'احترف التصميم الجرافيكي وتعلم أسرار الفوتوشوب من البداية حتى الاحتراف',
      en: 'Master graphic design and learn Photoshop secrets from beginner to professional',
    },
    instructor: {
      name: 'سارة علي',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bio: {
        ar: 'مصممة جرافيك محترفة ومدربة معتمدة من Adobe',
        en: 'Professional graphic designer and Adobe certified trainer',
      },
    },
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800',
    price: 149,
    originalPrice: 299,
    category: '2',
    level: 'intermediate',
    duration: 28,
    lessonsCount: 98,
    studentsCount: 8200,
    rating: 4.9,
    reviewsCount: 1580,
    isFeatured: true,
    isNew: true,
    requirements: {
      ar: ['معرفة أساسية بالحاسوب', 'برنامج Photoshop (أي إصدار)', 'الرغبة في الإبداع'],
      en: ['Basic computer knowledge', 'Photoshop software (any version)', 'Desire to be creative'],
    },
    outcomes: {
      ar: [
        'تصميم منشورات السوشيال ميديا',
        'تعديل وتحسين الصور باحترافية',
        'إنشاء هويات بصرية للشركات',
        'تصميم الإعلانات والبانرات',
      ],
      en: [
        'Design social media posts',
        'Edit and enhance photos professionally',
        'Create corporate visual identities',
        'Design ads and banners',
      ],
    },
    lessons: [
      { id: '2-1', title: { ar: 'واجهة البرنامج والأدوات', en: 'Interface and Tools' }, duration: 30, videoUrl: '', isFree: true, order: 1 },
      { id: '2-2', title: { ar: 'الطبقات والماسكات', en: 'Layers and Masks' }, duration: 45, videoUrl: '', isFree: true, order: 2 },
      { id: '2-3', title: { ar: 'تعديل الألوان', en: 'Color Correction' }, duration: 40, videoUrl: '', isFree: false, order: 3 },
    ],
  },
  {
    id: '3',
    title: {
      ar: 'التسويق الرقمي المتكامل',
      en: 'Complete Digital Marketing',
    },
    description: {
      ar: 'دورة شاملة في التسويق الرقمي تغطي SEO، إعلانات Google، التسويق عبر السوشيال ميديا والمزيد',
      en: 'Comprehensive digital marketing course covering SEO, Google Ads, Social Media Marketing and more',
    },
    instructor: {
      name: 'أحمد خالد',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: {
        ar: 'خبير تسويق رقمي ومستشار للشركات الكبرى',
        en: 'Digital marketing expert and consultant for major companies',
      },
    },
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    price: 179,
    originalPrice: 359,
    category: '3',
    level: 'beginner',
    duration: 35,
    lessonsCount: 124,
    studentsCount: 9800,
    rating: 4.7,
    reviewsCount: 1920,
    isFeatured: true,
    isNew: false,
    requirements: {
      ar: ['لا يتطلب خبرة سابقة', 'اهتمام بالتسويق', 'حساب على منصات التواصل'],
      en: ['No prior experience required', 'Interest in marketing', 'Social media accounts'],
    },
    outcomes: {
      ar: [
        'إنشاء حملات إعلانية ناجحة',
        'تحسين محركات البحث (SEO)',
        'إدارة صفحات السوشيال ميديا',
        'تحليل البيانات التسويقية',
      ],
      en: [
        'Create successful ad campaigns',
        'Search Engine Optimization (SEO)',
        'Manage social media pages',
        'Analyze marketing data',
      ],
    },
    lessons: [
      { id: '3-1', title: { ar: 'مقدمة في التسويق الرقمي', en: 'Introduction to Digital Marketing' }, duration: 20, videoUrl: '', isFree: true, order: 1 },
      { id: '3-2', title: { ar: 'أساسيات SEO', en: 'SEO Fundamentals' }, duration: 50, videoUrl: '', isFree: true, order: 2 },
      { id: '3-3', title: { ar: 'إعلانات Google', en: 'Google Ads' }, duration: 60, videoUrl: '', isFree: false, order: 3 },
    ],
  },
  {
    id: '4',
    title: {
      ar: 'برمجة تطبيقات الموبايل بـ Flutter',
      en: 'Mobile App Development with Flutter',
    },
    description: {
      ar: 'تعلم تطوير تطبيقات iOS و Android باستخدام Flutter و Dart',
      en: 'Learn to develop iOS and Android apps using Flutter and Dart',
    },
    instructor: {
      name: 'يوسف محمد',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      bio: {
        ar: 'مطور تطبيقات موبايل بخبرة 7 سنوات',
        en: 'Mobile app developer with 7 years of experience',
      },
    },
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
    price: 249,
    originalPrice: 449,
    category: '1',
    level: 'intermediate',
    duration: 38,
    lessonsCount: 145,
    studentsCount: 6500,
    rating: 4.8,
    reviewsCount: 1250,
    isFeatured: false,
    isNew: true,
    requirements: {
      ar: ['معرفة أساسية بالبرمجة', 'حاسوب بمواصفات جيدة', 'Android Studio أو VS Code'],
      en: ['Basic programming knowledge', 'Computer with good specs', 'Android Studio or VS Code'],
    },
    outcomes: {
      ar: [
        'بناء تطبيقات للـ iOS و Android',
        'العمل مع قواعد البيانات Firebase',
        'نشر التطبيقات على المتاجر',
        'تصميم واجهات مستخدم جذابة',
      ],
      en: [
        'Build apps for iOS and Android',
        'Work with Firebase databases',
        'Publish apps to stores',
        'Design attractive user interfaces',
      ],
    },
    lessons: [
      { id: '4-1', title: { ar: 'تثبيت بيئة التطوير', en: 'Setting up Development Environment' }, duration: 25, videoUrl: '', isFree: true, order: 1 },
      { id: '4-2', title: { ar: 'أساسيات Dart', en: 'Dart Basics' }, duration: 55, videoUrl: '', isFree: true, order: 2 },
      { id: '4-3', title: { ar: 'Widgets في Flutter', en: 'Flutter Widgets' }, duration: 70, videoUrl: '', isFree: false, order: 3 },
    ],
  },
  {
    id: '5',
    title: {
      ar: 'إدارة المشاريع باحترافية - PMP',
      en: 'Professional Project Management - PMP',
    },
    description: {
      ar: 'استعد لاختبار PMP وتعلم أفضل ممارسات إدارة المشاريع',
      en: 'Prepare for PMP exam and learn best project management practices',
    },
    instructor: {
      name: 'د. فاطمة حسن',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      bio: {
        ar: 'مستشارة إدارية وحاصلة على شهادة PMP',
        en: 'Management consultant and PMP certified',
      },
    },
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    price: 299,
    originalPrice: 599,
    category: '4',
    level: 'advanced',
    duration: 45,
    lessonsCount: 168,
    studentsCount: 4200,
    rating: 4.9,
    reviewsCount: 890,
    isFeatured: false,
    isNew: false,
    requirements: {
      ar: ['خبرة في إدارة المشاريع', 'معرفة أساسية بالأعمال', 'الالتزام بالدراسة'],
      en: ['Project management experience', 'Basic business knowledge', 'Commitment to study'],
    },
    outcomes: {
      ar: [
        'اجتياز اختبار PMP',
        'إدارة المشاريع باحترافية',
        'قيادة فرق العمل بفعالية',
        'استخدام أدوات إدارة المشاريع',
      ],
      en: [
        'Pass the PMP exam',
        'Manage projects professionally',
        'Lead teams effectively',
        'Use project management tools',
      ],
    },
    lessons: [
      { id: '5-1', title: { ar: 'مقدمة في إدارة المشاريع', en: 'Introduction to Project Management' }, duration: 30, videoUrl: '', isFree: true, order: 1 },
      { id: '5-2', title: { ar: 'مراحل المشروع', en: 'Project Phases' }, duration: 45, videoUrl: '', isFree: false, order: 2 },
    ],
  },
  {
    id: '6',
    title: {
      ar: 'تحليل البيانات باستخدام Python',
      en: 'Data Analysis with Python',
    },
    description: {
      ar: 'تعلم تحليل البيانات والتصور البياني باستخدام Python وأدواتها',
      en: 'Learn data analysis and visualization using Python and its tools',
    },
    instructor: {
      name: 'عمر حسين',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      bio: {
        ar: 'عالم بيانات في شركة تقنية كبرى',
        en: 'Data scientist at a major tech company',
      },
    },
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    price: 219,
    originalPrice: 399,
    category: '6',
    level: 'intermediate',
    duration: 32,
    lessonsCount: 112,
    studentsCount: 7300,
    rating: 4.7,
    reviewsCount: 1450,
    isFeatured: true,
    isNew: false,
    requirements: {
      ar: ['معرفة أساسية بـ Python', 'فهم الرياضيات الأساسية', 'حاسوب بـ 8GB RAM'],
      en: ['Basic Python knowledge', 'Basic math understanding', 'Computer with 8GB RAM'],
    },
    outcomes: {
      ar: [
        'تحليل مجموعات البيانات الكبيرة',
        'إنشاء تصورات بيانية احترافية',
        'استخدام Pandas و NumPy',
        'بناء نماذج تنبؤية بسيطة',
      ],
      en: [
        'Analyze large datasets',
        'Create professional visualizations',
        'Use Pandas and NumPy',
        'Build simple predictive models',
      ],
    },
    lessons: [
      { id: '6-1', title: { ar: 'مقدمة في تحليل البيانات', en: 'Introduction to Data Analysis' }, duration: 25, videoUrl: '', isFree: true, order: 1 },
      { id: '6-2', title: { ar: 'مكتبة Pandas', en: 'Pandas Library' }, duration: 60, videoUrl: '', isFree: true, order: 2 },
      { id: '6-3', title: { ar: 'التصور البياني', en: 'Data Visualization' }, duration: 55, videoUrl: '', isFree: false, order: 3 },
    ],
  },
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'خالد العمري',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: { ar: 'مطور ويب', en: 'Web Developer' },
    content: {
      ar: 'غيرت هذه المنصة مساري المهني. الدورات عالية الجودة والمدربين محترفين جداً.',
      en: 'This platform changed my career path. High quality courses and very professional instructors.',
    },
    rating: 5,
  },
  {
    id: '2',
    name: 'نورة السالم',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    role: { ar: 'مصممة جرافيك', en: 'Graphic Designer' },
    content: {
      ar: 'أفضل منصة تعليمية عربية. تعلمت التصميم من الصفر وأصبحت أعمل كمستقلة.',
      en: 'Best Arabic educational platform. I learned design from scratch and now work as a freelancer.',
    },
    rating: 5,
  },
  {
    id: '3',
    name: 'عبدالله محمد',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    role: { ar: 'مسوق رقمي', en: 'Digital Marketer' },
    content: {
      ar: 'محتوى ممتاز ودعم فني سريع. أنصح بها لكل من يريد تطوير مهاراته.',
      en: 'Excellent content and fast technical support. I recommend it to anyone who wants to develop their skills.',
    },
    rating: 5,
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    id: '1',
    name: { ar: 'الخطة الأساسية', en: 'Basic Plan' },
    price: { monthly: 29, yearly: 290 },
    features: {
      ar: [
        'الوصول لـ 10 دورات',
        'شهادات إتمام',
        'دعم عبر البريد الإلكتروني',
        'تحديثات المحتوى',
      ],
      en: [
        'Access to 10 courses',
        'Completion certificates',
        'Email support',
        'Content updates',
      ],
    },
    isPopular: false,
  },
  {
    id: '2',
    name: { ar: 'الخطة الاحترافية', en: 'Pro Plan' },
    price: { monthly: 59, yearly: 590 },
    features: {
      ar: [
        'وصول غير محدود لجميع الدورات',
        'شهادات معتمدة',
        'دعم على مدار الساعة',
        'جلسات مباشرة أسبوعية',
        'مشاريع تطبيقية',
        'مجتمع خاص',
      ],
      en: [
        'Unlimited access to all courses',
        'Accredited certificates',
        '24/7 support',
        'Weekly live sessions',
        'Practical projects',
        'Private community',
      ],
    },
    isPopular: true,
  },
  {
    id: '3',
    name: { ar: 'خطة المؤسسات', en: 'Enterprise Plan' },
    price: { monthly: 199, yearly: 1990 },
    features: {
      ar: [
        'كل مميزات الخطة الاحترافية',
        'لوحة تحكم للإدارة',
        'تقارير تقدم الموظفين',
        'دورات مخصصة',
        'مدير حساب مخصص',
        'تكامل مع أنظمة HR',
      ],
      en: [
        'All Pro Plan features',
        'Admin dashboard',
        'Employee progress reports',
        'Custom courses',
        'Dedicated account manager',
        'HR system integration',
      ],
    },
    isPopular: false,
  },
];
