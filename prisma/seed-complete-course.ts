import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating complete course with all data...');

  // 1. Get or create category
  let category = await prisma.category.findFirst({
    where: { nameEn: 'Programming' }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        nameAr: 'البرمجة',
        nameEn: 'Programming',
        icon: 'Code',
        color: '#3B82F6',
        slug: 'programming',
        description: 'دورات البرمجة وتطوير البرمجيات'
      }
    });
  }

  // 2. Get or create instructor
  let instructor = await prisma.user.findFirst({
    where: { email: 'instructor@example.com' }
  });

  if (!instructor) {
    const hashedPassword = await bcrypt.hash('123456', 12);
    instructor = await prisma.user.create({
      data: {
        name: 'أحمد محمد',
        email: 'instructor@example.com',
        password: hashedPassword,
        role: 'INSTRUCTOR',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        bio: 'مطور برمجيات محترف بخبرة أكثر من 10 سنوات في تطوير تطبيقات الويب والموبايل',
        isActive: true
      }
    });
  }

  // 3. Get or create student
  let student = await prisma.user.findFirst({
    where: { email: 'student@example.com' }
  });

  if (!student) {
    const hashedPassword = await bcrypt.hash('123456', 12);
    student = await prisma.user.create({
      data: {
        name: 'محمد علي',
        email: 'student@example.com',
        password: hashedPassword,
        role: 'STUDENT',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        isActive: true
      }
    });
  }

  // 4. Create the complete course
  const course = await prisma.course.create({
    data: {
      titleAr: 'دورة تطوير تطبيقات الويب الشاملة باستخدام React و Next.js',
      titleEn: 'Complete Web Development with React & Next.js',
      descriptionAr: `دورة شاملة ومتكاملة لتعلم تطوير تطبيقات الويب الحديثة باستخدام React و Next.js.

ستتعلم في هذه الدورة:
- أساسيات React وكيفية بناء مكونات قابلة لإعادة الاستخدام
- إدارة الحالة باستخدام useState و useReducer و Context API
- التعامل مع الـ Side Effects باستخدام useEffect
- بناء تطبيقات كاملة باستخدام Next.js 14
- التعامل مع قواعد البيانات باستخدام Prisma
- المصادقة والتفويض
- نشر التطبيقات على الإنترنت

الدورة تتضمن مشاريع عملية وتمارين تطبيقية.`,
      descriptionEn: `A comprehensive course to learn modern web application development using React and Next.js.

In this course you will learn:
- React fundamentals and building reusable components
- State management using useState, useReducer, and Context API
- Handling Side Effects with useEffect
- Building complete applications with Next.js 14
- Working with databases using Prisma
- Authentication and Authorization
- Deploying applications

The course includes practical projects and hands-on exercises.`,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      price: 99,
      originalPrice: 199,
      level: 'INTERMEDIATE',
      duration: 40,
      isPublished: true,
      isFeatured: true,
      categoryId: category.id,
      instructorId: instructor.id,
    }
  });

  console.log('Course created:', course.titleEn);

  // 5. Create lessons
  const lessonsData = [
    {
      titleAr: 'مقدمة في تطوير الويب',
      titleEn: 'Introduction to Web Development',
      description: 'نظرة عامة على تطوير الويب والتقنيات المستخدمة',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: 15,
      order: 1,
      isFree: true,
      requireQuizPass: false
    },
    {
      titleAr: 'أساسيات HTML و CSS',
      titleEn: 'HTML & CSS Fundamentals',
      description: 'تعلم أساسيات HTML و CSS لبناء صفحات الويب',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: 45,
      order: 2,
      isFree: true,
      requireQuizPass: false
    },
    {
      titleAr: 'مقدمة في JavaScript',
      titleEn: 'Introduction to JavaScript',
      description: 'تعلم أساسيات لغة JavaScript',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: 60,
      order: 3,
      isFree: false,
      requireQuizPass: true
    },
    {
      titleAr: 'React - المفاهيم الأساسية',
      titleEn: 'React - Core Concepts',
      description: 'تعلم المفاهيم الأساسية في React مثل Components و Props و State',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: 90,
      order: 4,
      isFree: false,
      requireQuizPass: true
    },
    {
      titleAr: 'React Hooks',
      titleEn: 'React Hooks',
      description: 'تعلم استخدام React Hooks مثل useState و useEffect و useContext',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: 75,
      order: 5,
      isFree: false,
      requireQuizPass: true
    },
    {
      titleAr: 'مقدمة في Next.js',
      titleEn: 'Introduction to Next.js',
      description: 'تعلم أساسيات Next.js وكيفية إنشاء تطبيقات Full-Stack',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: 60,
      order: 6,
      isFree: false,
      requireQuizPass: true
    },
    {
      titleAr: 'التعامل مع قواعد البيانات',
      titleEn: 'Working with Databases',
      description: 'تعلم استخدام Prisma للتعامل مع قواعد البيانات',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: 80,
      order: 7,
      isFree: false,
      requireQuizPass: true
    },
    {
      titleAr: 'المصادقة والتفويض',
      titleEn: 'Authentication & Authorization',
      description: 'تعلم تنفيذ نظام المصادقة والتفويض في تطبيقات Next.js',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: 70,
      order: 8,
      isFree: false,
      requireQuizPass: false
    },
    {
      titleAr: 'مشروع عملي - بناء تطبيق كامل',
      titleEn: 'Practical Project - Building a Complete App',
      description: 'بناء تطبيق متكامل من الصفر باستخدام كل ما تعلمناه',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: 120,
      order: 9,
      isFree: false,
      requireQuizPass: false
    },
    {
      titleAr: 'نشر التطبيق على الإنترنت',
      titleEn: 'Deploying the Application',
      description: 'تعلم كيفية نشر تطبيقك على Vercel و Railway',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: 45,
      order: 10,
      isFree: false,
      requireQuizPass: false
    }
  ];

  const createdLessons = [];
  for (const lessonData of lessonsData) {
    const lesson = await prisma.lesson.create({
      data: {
        ...lessonData,
        courseId: course.id
      }
    });
    createdLessons.push(lesson);
    console.log('Lesson created:', lesson.titleEn);
  }

  // 6. Create quizzes for some lessons
  const quizzesData = [
    {
      lessonIndex: 1, // HTML & CSS
      titleAr: 'اختبار أساسيات HTML و CSS',
      titleEn: 'HTML & CSS Fundamentals Quiz',
      descriptionAr: 'اختبر معرفتك بأساسيات HTML و CSS',
      descriptionEn: 'Test your knowledge of HTML & CSS fundamentals',
      passingScore: 70,
      timeLimit: 15,
      questions: [
        {
          questionAr: 'ما هو الوسم المستخدم لإنشاء رابط في HTML؟',
          questionEn: 'What tag is used to create a link in HTML?',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([
            { ar: '<link>', en: '<link>', isCorrect: false },
            { ar: '<a>', en: '<a>', isCorrect: true },
            { ar: '<href>', en: '<href>', isCorrect: false },
            { ar: '<url>', en: '<url>', isCorrect: false }
          ]),
          correctAnswer: '1',
          points: 1,
          explanation: 'الوسم <a> يستخدم لإنشاء الروابط في HTML'
        },
        {
          questionAr: 'أي خاصية CSS تستخدم لتغيير لون الخلفية؟',
          questionEn: 'Which CSS property is used to change the background color?',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([
            { ar: 'color', en: 'color', isCorrect: false },
            { ar: 'bgcolor', en: 'bgcolor', isCorrect: false },
            { ar: 'background-color', en: 'background-color', isCorrect: true },
            { ar: 'bg-color', en: 'bg-color', isCorrect: false }
          ]),
          correctAnswer: '2',
          points: 1,
          explanation: 'خاصية background-color تستخدم لتغيير لون الخلفية'
        },
        {
          questionAr: 'HTML هي اختصار لـ HyperText Markup Language',
          questionEn: 'HTML stands for HyperText Markup Language',
          type: 'TRUE_FALSE',
          options: JSON.stringify([
            { ar: 'صحيح', en: 'True', isCorrect: true },
            { ar: 'خطأ', en: 'False', isCorrect: false }
          ]),
          correctAnswer: '0',
          points: 1,
          explanation: 'نعم، HTML هي اختصار لـ HyperText Markup Language'
        }
      ]
    },
    {
      lessonIndex: 2, // JavaScript
      titleAr: 'اختبار أساسيات JavaScript',
      titleEn: 'JavaScript Fundamentals Quiz',
      descriptionAr: 'اختبر معرفتك بأساسيات JavaScript',
      descriptionEn: 'Test your knowledge of JavaScript fundamentals',
      passingScore: 70,
      timeLimit: 20,
      questions: [
        {
          questionAr: 'ما هو الناتج من: typeof []',
          questionEn: 'What is the output of: typeof []',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([
            { ar: 'array', en: 'array', isCorrect: false },
            { ar: 'object', en: 'object', isCorrect: true },
            { ar: 'undefined', en: 'undefined', isCorrect: false },
            { ar: 'null', en: 'null', isCorrect: false }
          ]),
          correctAnswer: '1',
          points: 1,
          explanation: 'في JavaScript، المصفوفات هي نوع من الـ objects'
        },
        {
          questionAr: 'أي من التالي يستخدم للتعريف عن متغير ثابت؟',
          questionEn: 'Which of the following is used to declare a constant?',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([
            { ar: 'var', en: 'var', isCorrect: false },
            { ar: 'let', en: 'let', isCorrect: false },
            { ar: 'const', en: 'const', isCorrect: true },
            { ar: 'constant', en: 'constant', isCorrect: false }
          ]),
          correctAnswer: '2',
          points: 1,
          explanation: 'الكلمة المفتاحية const تستخدم لتعريف ثوابت'
        },
        {
          questionAr: 'ما هو الناتج من: 2 + "2"',
          questionEn: 'What is the output of: 2 + "2"',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([
            { ar: '4', en: '4', isCorrect: false },
            { ar: '22', en: '22', isCorrect: true },
            { ar: 'NaN', en: 'NaN', isCorrect: false },
            { ar: 'Error', en: 'Error', isCorrect: false }
          ]),
          correctAnswer: '1',
          points: 1,
          explanation: 'عند جمع رقم مع نص، يتم تحويل الرقم إلى نص ودمجهما'
        },
        {
          questionAr: '=== تقارن القيمة والنوع معاً',
          questionEn: '=== compares both value and type',
          type: 'TRUE_FALSE',
          options: JSON.stringify([
            { ar: 'صحيح', en: 'True', isCorrect: true },
            { ar: 'خطأ', en: 'False', isCorrect: false }
          ]),
          correctAnswer: '0',
          points: 1,
          explanation: 'نعم، === تقارن القيمة والنوع معاً (strict equality)'
        }
      ]
    },
    {
      lessonIndex: 3, // React Core Concepts
      titleAr: 'اختبار React - المفاهيم الأساسية',
      titleEn: 'React Core Concepts Quiz',
      descriptionAr: 'اختبر معرفتك بالمفاهيم الأساسية في React',
      descriptionEn: 'Test your knowledge of React core concepts',
      passingScore: 70,
      timeLimit: 20,
      questions: [
        {
          questionAr: 'ما هو JSX؟',
          questionEn: 'What is JSX?',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([
            { ar: 'لغة برمجة جديدة', en: 'A new programming language', isCorrect: false },
            { ar: 'امتداد لـ JavaScript يسمح بكتابة HTML داخل JS', en: 'A JavaScript extension that allows writing HTML in JS', isCorrect: true },
            { ar: 'مكتبة CSS', en: 'A CSS library', isCorrect: false },
            { ar: 'قاعدة بيانات', en: 'A database', isCorrect: false }
          ]),
          correctAnswer: '1',
          points: 1,
          explanation: 'JSX هو امتداد لـ JavaScript يسمح بكتابة عناصر HTML داخل كود JavaScript'
        },
        {
          questionAr: 'ما الفرق بين Props و State؟',
          questionEn: 'What is the difference between Props and State?',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([
            { ar: 'لا يوجد فرق', en: 'No difference', isCorrect: false },
            { ar: 'Props تمرر من الأب للابن، State محلية للمكون', en: 'Props are passed from parent, State is local to component', isCorrect: true },
            { ar: 'State تمرر من الأب للابن، Props محلية للمكون', en: 'State is passed from parent, Props is local to component', isCorrect: false },
            { ar: 'كلاهما محلي للمكون', en: 'Both are local to component', isCorrect: false }
          ]),
          correctAnswer: '1',
          points: 1,
          explanation: 'Props تمرر من المكون الأب إلى الابن وهي للقراءة فقط، بينما State محلية للمكون ويمكن تغييرها'
        },
        {
          questionAr: 'React هي مكتبة لبناء واجهات المستخدم',
          questionEn: 'React is a library for building user interfaces',
          type: 'TRUE_FALSE',
          options: JSON.stringify([
            { ar: 'صحيح', en: 'True', isCorrect: true },
            { ar: 'خطأ', en: 'False', isCorrect: false }
          ]),
          correctAnswer: '0',
          points: 1,
          explanation: 'نعم، React هي مكتبة JavaScript لبناء واجهات المستخدم'
        },
        {
          questionAr: 'يمكن تغيير قيمة Props مباشرة داخل المكون',
          questionEn: 'Props can be directly modified inside the component',
          type: 'TRUE_FALSE',
          options: JSON.stringify([
            { ar: 'صحيح', en: 'True', isCorrect: false },
            { ar: 'خطأ', en: 'False', isCorrect: true }
          ]),
          correctAnswer: '1',
          points: 1,
          explanation: 'خطأ، Props هي للقراءة فقط ولا يمكن تغييرها مباشرة'
        }
      ]
    },
    {
      lessonIndex: 4, // React Hooks
      titleAr: 'اختبار React Hooks',
      titleEn: 'React Hooks Quiz',
      descriptionAr: 'اختبر معرفتك بـ React Hooks',
      descriptionEn: 'Test your knowledge of React Hooks',
      passingScore: 70,
      timeLimit: 15,
      questions: [
        {
          questionAr: 'أي Hook يستخدم لإدارة الحالة المحلية؟',
          questionEn: 'Which Hook is used to manage local state?',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([
            { ar: 'useEffect', en: 'useEffect', isCorrect: false },
            { ar: 'useState', en: 'useState', isCorrect: true },
            { ar: 'useContext', en: 'useContext', isCorrect: false },
            { ar: 'useRef', en: 'useRef', isCorrect: false }
          ]),
          correctAnswer: '1',
          points: 1,
          explanation: 'useState يستخدم لإدارة الحالة المحلية في المكونات الوظيفية'
        },
        {
          questionAr: 'متى يتم تنفيذ useEffect؟',
          questionEn: 'When does useEffect execute?',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([
            { ar: 'قبل الـ render', en: 'Before render', isCorrect: false },
            { ar: 'بعد الـ render', en: 'After render', isCorrect: true },
            { ar: 'أثناء الـ render', en: 'During render', isCorrect: false },
            { ar: 'لا يتم تنفيذه أبداً', en: 'Never executes', isCorrect: false }
          ]),
          correctAnswer: '1',
          points: 1,
          explanation: 'useEffect يتم تنفيذه بعد أن ينتهي React من عرض المكون'
        },
        {
          questionAr: 'يمكن استخدام Hooks داخل الشروط والحلقات',
          questionEn: 'Hooks can be used inside conditions and loops',
          type: 'TRUE_FALSE',
          options: JSON.stringify([
            { ar: 'صحيح', en: 'True', isCorrect: false },
            { ar: 'خطأ', en: 'False', isCorrect: true }
          ]),
          correctAnswer: '1',
          points: 1,
          explanation: 'خطأ، يجب استدعاء Hooks في المستوى الأعلى من المكون فقط'
        }
      ]
    },
    {
      lessonIndex: 5, // Next.js
      titleAr: 'اختبار Next.js',
      titleEn: 'Next.js Quiz',
      descriptionAr: 'اختبر معرفتك بـ Next.js',
      descriptionEn: 'Test your knowledge of Next.js',
      passingScore: 70,
      timeLimit: 15,
      questions: [
        {
          questionAr: 'ما هي ميزة Next.js الرئيسية؟',
          questionEn: 'What is the main feature of Next.js?',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([
            { ar: 'Server-Side Rendering و Static Generation', en: 'Server-Side Rendering and Static Generation', isCorrect: true },
            { ar: 'فقط Client-Side Rendering', en: 'Only Client-Side Rendering', isCorrect: false },
            { ar: 'لا يدعم React', en: 'Does not support React', isCorrect: false },
            { ar: 'فقط للموبايل', en: 'Only for mobile', isCorrect: false }
          ]),
          correctAnswer: '0',
          points: 1,
          explanation: 'Next.js يوفر SSR و SSG بالإضافة إلى CSR'
        },
        {
          questionAr: 'أين يتم وضع ملفات الصفحات في Next.js App Router؟',
          questionEn: 'Where are page files placed in Next.js App Router?',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([
            { ar: 'مجلد pages', en: 'pages folder', isCorrect: false },
            { ar: 'مجلد app', en: 'app folder', isCorrect: true },
            { ar: 'مجلد src', en: 'src folder', isCorrect: false },
            { ar: 'مجلد public', en: 'public folder', isCorrect: false }
          ]),
          correctAnswer: '1',
          points: 1,
          explanation: 'في App Router الجديد، الصفحات توضع في مجلد app'
        },
        {
          questionAr: 'Next.js مبني على React',
          questionEn: 'Next.js is built on top of React',
          type: 'TRUE_FALSE',
          options: JSON.stringify([
            { ar: 'صحيح', en: 'True', isCorrect: true },
            { ar: 'خطأ', en: 'False', isCorrect: false }
          ]),
          correctAnswer: '0',
          points: 1,
          explanation: 'نعم، Next.js هو framework مبني على React'
        }
      ]
    }
  ];

  for (const quizData of quizzesData) {
    const lesson = createdLessons[quizData.lessonIndex];
    const quiz = await prisma.quiz.create({
      data: {
        titleAr: quizData.titleAr,
        titleEn: quizData.titleEn,
        descriptionAr: quizData.descriptionAr,
        descriptionEn: quizData.descriptionEn,
        passingScore: quizData.passingScore,
        timeLimit: quizData.timeLimit,
        isPublished: true,
        showResults: true,
        shuffleQuestions: true,
        courseId: course.id,
        lessonId: lesson.id
      }
    });

    // Create questions for this quiz
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      await prisma.question.create({
        data: {
          questionAr: q.questionAr,
          questionEn: q.questionEn,
          type: q.type as any,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          order: i + 1,
          explanation: q.explanation,
          quizId: quiz.id
        }
      });
    }

    console.log('Quiz created:', quiz.titleEn, 'with', quizData.questions.length, 'questions');
  }

  // 7. Create a course-level final quiz
  const finalQuiz = await prisma.quiz.create({
    data: {
      titleAr: 'الاختبار النهائي - دورة تطوير الويب',
      titleEn: 'Final Exam - Web Development Course',
      descriptionAr: 'اختبار شامل لجميع محتويات الدورة',
      descriptionEn: 'Comprehensive test covering all course content',
      passingScore: 80,
      timeLimit: 45,
      isPublished: true,
      showResults: true,
      shuffleQuestions: true,
      maxAttempts: 3,
      courseId: course.id,
      lessonId: null
    }
  });

  const finalQuizQuestions = [
    {
      questionAr: 'ما هو الفرق الرئيسي بين == و === في JavaScript؟',
      questionEn: 'What is the main difference between == and === in JavaScript?',
      type: 'MULTIPLE_CHOICE',
      options: JSON.stringify([
        { ar: 'لا يوجد فرق', en: 'No difference', isCorrect: false },
        { ar: '=== تقارن القيمة فقط', en: '=== compares value only', isCorrect: false },
        { ar: '=== تقارن القيمة والنوع', en: '=== compares value and type', isCorrect: true },
        { ar: '== أسرع من ===', en: '== is faster than ===', isCorrect: false }
      ]),
      correctAnswer: '2',
      points: 2,
      explanation: '=== تقارن القيمة والنوع معاً (strict equality)'
    },
    {
      questionAr: 'أي من التالي ليس Hook في React؟',
      questionEn: 'Which of the following is NOT a React Hook?',
      type: 'MULTIPLE_CHOICE',
      options: JSON.stringify([
        { ar: 'useState', en: 'useState', isCorrect: false },
        { ar: 'useEffect', en: 'useEffect', isCorrect: false },
        { ar: 'useComponent', en: 'useComponent', isCorrect: true },
        { ar: 'useContext', en: 'useContext', isCorrect: false }
      ]),
      correctAnswer: '2',
      points: 2,
      explanation: 'useComponent ليس Hook موجود في React'
    },
    {
      questionAr: 'ما هو Virtual DOM؟',
      questionEn: 'What is Virtual DOM?',
      type: 'MULTIPLE_CHOICE',
      options: JSON.stringify([
        { ar: 'نسخة افتراضية من DOM الحقيقي في الذاكرة', en: 'A virtual copy of real DOM in memory', isCorrect: true },
        { ar: 'قاعدة بيانات', en: 'A database', isCorrect: false },
        { ar: 'خادم ويب', en: 'A web server', isCorrect: false },
        { ar: 'لغة برمجة', en: 'A programming language', isCorrect: false }
      ]),
      correctAnswer: '0',
      points: 2,
      explanation: 'Virtual DOM هو نسخة خفيفة من DOM الحقيقي تُحفظ في الذاكرة لتحسين الأداء'
    },
    {
      questionAr: 'Next.js يدعم Server-Side Rendering',
      questionEn: 'Next.js supports Server-Side Rendering',
      type: 'TRUE_FALSE',
      options: JSON.stringify([
        { ar: 'صحيح', en: 'True', isCorrect: true },
        { ar: 'خطأ', en: 'False', isCorrect: false }
      ]),
      correctAnswer: '0',
      points: 2,
      explanation: 'نعم، Next.js يدعم SSR بشكل أساسي'
    },
    {
      questionAr: 'Prisma هو ORM للتعامل مع قواعد البيانات',
      questionEn: 'Prisma is an ORM for working with databases',
      type: 'TRUE_FALSE',
      options: JSON.stringify([
        { ar: 'صحيح', en: 'True', isCorrect: true },
        { ar: 'خطأ', en: 'False', isCorrect: false }
      ]),
      correctAnswer: '0',
      points: 2,
      explanation: 'نعم، Prisma هو Object-Relational Mapping للتعامل مع قواعد البيانات'
    }
  ];

  for (let i = 0; i < finalQuizQuestions.length; i++) {
    const q = finalQuizQuestions[i];
    await prisma.question.create({
      data: {
        questionAr: q.questionAr,
        questionEn: q.questionEn,
        type: q.type as any,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points,
        order: i + 1,
        explanation: q.explanation,
        quizId: finalQuiz.id
      }
    });
  }

  console.log('Final quiz created with', finalQuizQuestions.length, 'questions');

  // 8. Create resources for some lessons
  const resourcesData = [
    { lessonIndex: 0, title: 'ملخص المحاضرة', type: 'PDF', url: '/resources/intro-summary.pdf' },
    { lessonIndex: 0, title: 'روابط مفيدة', type: 'LINK', url: 'https://developer.mozilla.org' },
    { lessonIndex: 1, title: 'تمارين HTML', type: 'PDF', url: '/resources/html-exercises.pdf' },
    { lessonIndex: 2, title: 'كود المثال', type: 'CODE', url: 'https://github.com/example/js-basics' },
    { lessonIndex: 3, title: 'مشروع React التطبيقي', type: 'CODE', url: 'https://github.com/example/react-project' },
    { lessonIndex: 5, title: 'دليل Next.js الرسمي', type: 'LINK', url: 'https://nextjs.org/docs' },
    { lessonIndex: 6, title: 'Prisma Documentation', type: 'LINK', url: 'https://www.prisma.io/docs' },
  ];

  for (const res of resourcesData) {
    await prisma.resource.create({
      data: {
        title: res.title,
        type: res.type as any,
        url: res.url,
        lessonId: createdLessons[res.lessonIndex].id
      }
    });
  }

  console.log('Resources created');

  // 9. Enroll the student in the course
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course.id,
      progress: 20,
      status: 'ACTIVE'
    }
  });

  console.log('Student enrolled in course');

  // 10. Create lesson progress for first 2 lessons
  for (let i = 0; i < 2; i++) {
    await prisma.lessonProgress.create({
      data: {
        userId: student.id,
        lessonId: createdLessons[i].id,
        isCompleted: true,
        watchedTime: createdLessons[i].duration * 60,
        completedAt: new Date()
      }
    });
  }

  console.log('Lesson progress created');

  // 11. Create a review
  await prisma.review.create({
    data: {
      userId: student.id,
      courseId: course.id,
      rating: 5,
      comment: 'دورة ممتازة ومحتوى رائع! المدرب شرحه واضح ومفهوم. أنصح بها بشدة.'
    }
  });

  console.log('Review created');

  // 12. Create a notification for the student
  await prisma.notification.create({
    data: {
      userId: student.id,
      titleAr: 'مرحباً بك في الدورة!',
      titleEn: 'Welcome to the course!',
      messageAr: 'تم تسجيلك بنجاح في دورة تطوير تطبيقات الويب. ابدأ التعلم الآن!',
      messageEn: 'You have been successfully enrolled in Web Development course. Start learning now!',
      type: 'enrollment',
      isRead: false
    }
  });

  console.log('Notification created');

  // 13. Create a quiz attempt for the first quiz
  const firstQuiz = await prisma.quiz.findFirst({
    where: { courseId: course.id, lessonId: { not: null } },
    include: { questions: true }
  });

  if (firstQuiz) {
    await prisma.quizAttempt.create({
      data: {
        userId: student.id,
        quizId: firstQuiz.id,
        score: 100,
        passed: true,
        earnedPoints: firstQuiz.questions.reduce((sum, q) => sum + q.points, 0),
        totalPoints: firstQuiz.questions.reduce((sum, q) => sum + q.points, 0),
        timeSpent: 8 * 60, // 8 minutes
        answers: JSON.stringify(firstQuiz.questions.map(q => ({
          questionId: q.id,
          selectedAnswer: q.correctAnswer,
          isCorrect: true
        }))),
        completedAt: new Date()
      }
    });

    console.log('Quiz attempt created');
  }

  console.log('\n✅ Complete course created successfully!');
  console.log('\nCourse details:');
  console.log('- Title:', course.titleEn);
  console.log('- Lessons:', lessonsData.length);
  console.log('- Quizzes:', quizzesData.length + 1, '(including final exam)');
  console.log('- Resources:', resourcesData.length);
  console.log('\nTest accounts:');
  console.log('- Student: student@example.com / 123456');
  console.log('- Instructor: instructor@example.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
