import { PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function createCourses() {
  // Get instructor
  const instructor = await prisma.user.findFirst({ where: { role: 'INSTRUCTOR' } });
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });

  if (!instructor) {
    console.log('No instructor found!');
    return;
  }

  // Get or create category
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: {
        nameAr: 'برمجة',
        nameEn: 'Programming',
        slug: 'programming'
      }
    });
  }

  // =====================================================
  // الدورة الأولى: Python للمبتدئين
  // =====================================================
  console.log('Creating Python Course...');

  const pythonCourse = await prisma.course.create({
    data: {
      titleAr: 'تعلم Python من الصفر للاحتراف',
      titleEn: 'Learn Python from Zero to Hero',
      descriptionAr: 'دورة شاملة لتعلم لغة Python من البداية حتى الاحتراف. ستتعلم أساسيات البرمجة، هياكل البيانات، البرمجة الكائنية، والتعامل مع الملفات وقواعد البيانات.',
      descriptionEn: 'A comprehensive course to learn Python from scratch to professional level. You will learn programming basics, data structures, OOP, file handling and databases.',
      thumbnail: '/images/courses/python.jpg',
      price: 79.99,
      originalPrice: 149.99,
      level: 'BEGINNER',
      isPublished: true,
      isFeatured: true,
      instructorId: instructor.id,
      categoryId: category.id
    }
  });

  // Python Lessons
  const pythonLessons = [
    { titleAr: 'مقدمة في Python', titleEn: 'Introduction to Python', duration: 15, order: 1, isFree: true },
    { titleAr: 'تثبيت Python وإعداد البيئة', titleEn: 'Installing Python and Setup', duration: 20, order: 2, isFree: true },
    { titleAr: 'المتغيرات وأنواع البيانات', titleEn: 'Variables and Data Types', duration: 30, order: 3, isFree: false },
    { titleAr: 'العمليات الحسابية والمنطقية', titleEn: 'Arithmetic and Logical Operations', duration: 25, order: 4, isFree: false },
    { titleAr: 'الجمل الشرطية If-Else', titleEn: 'Conditional Statements If-Else', duration: 35, order: 5, isFree: false },
    { titleAr: 'الحلقات التكرارية For و While', titleEn: 'Loops: For and While', duration: 40, order: 6, isFree: false },
    { titleAr: 'الدوال Functions', titleEn: 'Functions', duration: 45, order: 7, isFree: false },
    { titleAr: 'القوائم Lists', titleEn: 'Lists', duration: 35, order: 8, isFree: false },
    { titleAr: 'القواميس Dictionaries', titleEn: 'Dictionaries', duration: 30, order: 9, isFree: false },
    { titleAr: 'البرمجة الكائنية OOP', titleEn: 'Object-Oriented Programming', duration: 60, order: 10, isFree: false }
  ];

  const createdPythonLessons = [];
  for (const lesson of pythonLessons) {
    const created = await prisma.lesson.create({
      data: { ...lesson, courseId: pythonCourse.id }
    });
    createdPythonLessons.push(created);
  }

  // Python Quiz
  const pythonQuiz = await prisma.quiz.create({
    data: {
      titleAr: 'اختبار أساسيات Python',
      titleEn: 'Python Basics Quiz',
      descriptionAr: 'اختبر معرفتك بأساسيات Python',
      descriptionEn: 'Test your knowledge of Python basics',
      passingScore: 70,
      timeLimit: 20,
      isPublished: true,
      showResults: true,
      courseId: pythonCourse.id,
      lessonId: createdPythonLessons[2].id
    }
  });

  // Python Quiz Questions
  const pythonQuestions = [
    {
      questionAr: 'ما هو نوع البيانات الناتج من: type(3.14)؟',
      questionEn: 'What is the data type of: type(3.14)?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: JSON.stringify([
        { ar: 'int', en: 'int', isCorrect: false },
        { ar: 'float', en: 'float', isCorrect: true },
        { ar: 'str', en: 'str', isCorrect: false },
        { ar: 'bool', en: 'bool', isCorrect: false }
      ]),
      correctAnswer: '1',
      points: 1,
      order: 1
    },
    {
      questionAr: 'كيف تطبع Hello World في Python؟',
      questionEn: 'How do you print Hello World in Python?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: JSON.stringify([
        { ar: 'echo("Hello World")', en: 'echo("Hello World")', isCorrect: false },
        { ar: 'print("Hello World")', en: 'print("Hello World")', isCorrect: true },
        { ar: 'console.log("Hello World")', en: 'console.log("Hello World")', isCorrect: false },
        { ar: 'printf("Hello World")', en: 'printf("Hello World")', isCorrect: false }
      ]),
      correctAnswer: '1',
      points: 1,
      order: 2
    },
    {
      questionAr: 'Python لغة مفسرة وليست مترجمة',
      questionEn: 'Python is an interpreted language, not compiled',
      type: QuestionType.TRUE_FALSE,
      options: JSON.stringify([
        { ar: 'صحيح', en: 'True', isCorrect: true },
        { ar: 'خطأ', en: 'False', isCorrect: false }
      ]),
      correctAnswer: '0',
      points: 1,
      order: 3
    },
    {
      questionAr: 'ما هي الطريقة الصحيحة لإنشاء قائمة في Python؟',
      questionEn: 'What is the correct way to create a list in Python?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: JSON.stringify([
        { ar: 'list = (1, 2, 3)', en: 'list = (1, 2, 3)', isCorrect: false },
        { ar: 'list = [1, 2, 3]', en: 'list = [1, 2, 3]', isCorrect: true },
        { ar: 'list = {1, 2, 3}', en: 'list = {1, 2, 3}', isCorrect: false },
        { ar: 'list = <1, 2, 3>', en: 'list = <1, 2, 3>', isCorrect: false }
      ]),
      correctAnswer: '1',
      points: 1,
      order: 4
    }
  ];

  for (const q of pythonQuestions) {
    await prisma.question.create({ data: { ...q, quizId: pythonQuiz.id } });
  }

  console.log('✅ Python Course created with 10 lessons and 1 quiz');

  // =====================================================
  // الدورة الثانية: تصميم UI/UX
  // =====================================================
  console.log('Creating UI/UX Course...');

  const uiuxCourse = await prisma.course.create({
    data: {
      titleAr: 'تصميم واجهات المستخدم UI/UX',
      titleEn: 'UI/UX Design Masterclass',
      descriptionAr: 'تعلم تصميم واجهات المستخدم وتجربة المستخدم باستخدام Figma. من الأساسيات إلى التصميمات المتقدمة والـ Prototyping.',
      descriptionEn: 'Learn UI/UX design using Figma. From basics to advanced designs and prototyping.',
      thumbnail: '/images/courses/uiux.jpg',
      price: 89.99,
      originalPrice: 179.99,
      level: 'BEGINNER',
      isPublished: true,
      isFeatured: true,
      instructorId: instructor.id,
      categoryId: category.id
    }
  });

  const uiuxLessons = [
    { titleAr: 'مقدمة في تصميم UI/UX', titleEn: 'Introduction to UI/UX Design', duration: 20, order: 1, isFree: true },
    { titleAr: 'الفرق بين UI و UX', titleEn: 'Difference between UI and UX', duration: 15, order: 2, isFree: true },
    { titleAr: 'أساسيات Figma', titleEn: 'Figma Basics', duration: 40, order: 3, isFree: false },
    { titleAr: 'نظرية الألوان', titleEn: 'Color Theory', duration: 30, order: 4, isFree: false },
    { titleAr: 'الخطوط والطباعة', titleEn: 'Typography', duration: 25, order: 5, isFree: false },
    { titleAr: 'تصميم الأيقونات', titleEn: 'Icon Design', duration: 35, order: 6, isFree: false },
    { titleAr: 'تصميم الأزرار والنماذج', titleEn: 'Buttons and Forms Design', duration: 40, order: 7, isFree: false },
    { titleAr: 'Wireframing', titleEn: 'Wireframing', duration: 45, order: 8, isFree: false },
    { titleAr: 'Prototyping التفاعلي', titleEn: 'Interactive Prototyping', duration: 50, order: 9, isFree: false },
    { titleAr: 'مشروع تطبيقي كامل', titleEn: 'Complete Practical Project', duration: 90, order: 10, isFree: false }
  ];

  const createdUiuxLessons = [];
  for (const lesson of uiuxLessons) {
    const created = await prisma.lesson.create({
      data: { ...lesson, courseId: uiuxCourse.id }
    });
    createdUiuxLessons.push(created);
  }

  const uiuxQuiz = await prisma.quiz.create({
    data: {
      titleAr: 'اختبار أساسيات التصميم',
      titleEn: 'Design Basics Quiz',
      descriptionAr: 'اختبر معرفتك بأساسيات تصميم UI/UX',
      descriptionEn: 'Test your knowledge of UI/UX design basics',
      passingScore: 70,
      timeLimit: 15,
      isPublished: true,
      showResults: true,
      courseId: uiuxCourse.id,
      lessonId: createdUiuxLessons[3].id
    }
  });

  const uiuxQuestions = [
    {
      questionAr: 'ما الفرق الرئيسي بين UI و UX؟',
      questionEn: 'What is the main difference between UI and UX?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: JSON.stringify([
        { ar: 'لا يوجد فرق', en: 'No difference', isCorrect: false },
        { ar: 'UI هو الشكل، UX هو التجربة', en: 'UI is the look, UX is the experience', isCorrect: true },
        { ar: 'UI أهم من UX', en: 'UI is more important than UX', isCorrect: false },
        { ar: 'UX فقط للمواقع', en: 'UX is only for websites', isCorrect: false }
      ]),
      correctAnswer: '1',
      points: 1,
      order: 1
    },
    {
      questionAr: 'ما هي أداة Figma؟',
      questionEn: 'What is Figma?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: JSON.stringify([
        { ar: 'لغة برمجة', en: 'Programming language', isCorrect: false },
        { ar: 'أداة تصميم واجهات', en: 'UI design tool', isCorrect: true },
        { ar: 'قاعدة بيانات', en: 'Database', isCorrect: false },
        { ar: 'نظام تشغيل', en: 'Operating system', isCorrect: false }
      ]),
      correctAnswer: '1',
      points: 1,
      order: 2
    },
    {
      questionAr: 'Wireframe هو تصميم تفصيلي بالألوان',
      questionEn: 'Wireframe is a detailed design with colors',
      type: QuestionType.TRUE_FALSE,
      options: JSON.stringify([
        { ar: 'صحيح', en: 'True', isCorrect: false },
        { ar: 'خطأ', en: 'False', isCorrect: true }
      ]),
      correctAnswer: '1',
      points: 1,
      order: 3
    },
    {
      questionAr: 'ما هو الهدف الرئيسي من Prototyping؟',
      questionEn: 'What is the main goal of Prototyping?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: JSON.stringify([
        { ar: 'كتابة الكود', en: 'Writing code', isCorrect: false },
        { ar: 'اختبار التفاعل قبل التطوير', en: 'Testing interaction before development', isCorrect: true },
        { ar: 'تصميم الشعار', en: 'Logo design', isCorrect: false },
        { ar: 'إدارة المشروع', en: 'Project management', isCorrect: false }
      ]),
      correctAnswer: '1',
      points: 1,
      order: 4
    }
  ];

  for (const q of uiuxQuestions) {
    await prisma.question.create({ data: { ...q, quizId: uiuxQuiz.id } });
  }

  console.log('✅ UI/UX Course created with 10 lessons and 1 quiz');

  // =====================================================
  // الدورة الثالثة: تطوير تطبيقات الموبايل
  // =====================================================
  console.log('Creating Mobile Development Course...');

  const mobileCourse = await prisma.course.create({
    data: {
      titleAr: 'تطوير تطبيقات الموبايل مع React Native',
      titleEn: 'Mobile App Development with React Native',
      descriptionAr: 'تعلم بناء تطبيقات iOS و Android باستخدام React Native. من الصفر إلى نشر التطبيق على المتاجر.',
      descriptionEn: 'Learn to build iOS and Android apps using React Native. From zero to publishing on app stores.',
      thumbnail: '/images/courses/mobile.jpg',
      price: 99.99,
      originalPrice: 199.99,
      level: 'INTERMEDIATE',
      isPublished: true,
      isFeatured: false,
      instructorId: instructor.id,
      categoryId: category.id
    }
  });

  const mobileLessons = [
    { titleAr: 'مقدمة في React Native', titleEn: 'Introduction to React Native', duration: 20, order: 1, isFree: true },
    { titleAr: 'إعداد بيئة التطوير', titleEn: 'Development Environment Setup', duration: 30, order: 2, isFree: true },
    { titleAr: 'المكونات الأساسية', titleEn: 'Core Components', duration: 40, order: 3, isFree: false },
    { titleAr: 'التنسيق مع Flexbox', titleEn: 'Styling with Flexbox', duration: 35, order: 4, isFree: false },
    { titleAr: 'التنقل بين الشاشات', titleEn: 'Navigation between Screens', duration: 45, order: 5, isFree: false },
    { titleAr: 'إدارة الحالة مع Redux', titleEn: 'State Management with Redux', duration: 50, order: 6, isFree: false },
    { titleAr: 'التعامل مع APIs', titleEn: 'Working with APIs', duration: 40, order: 7, isFree: false },
    { titleAr: 'التخزين المحلي', titleEn: 'Local Storage', duration: 30, order: 8, isFree: false },
    { titleAr: 'الإشعارات Push Notifications', titleEn: 'Push Notifications', duration: 35, order: 9, isFree: false },
    { titleAr: 'نشر التطبيق على المتاجر', titleEn: 'Publishing to App Stores', duration: 45, order: 10, isFree: false }
  ];

  const createdMobileLessons = [];
  for (const lesson of mobileLessons) {
    const created = await prisma.lesson.create({
      data: { ...lesson, courseId: mobileCourse.id }
    });
    createdMobileLessons.push(created);
  }

  const mobileQuiz = await prisma.quiz.create({
    data: {
      titleAr: 'اختبار React Native',
      titleEn: 'React Native Quiz',
      descriptionAr: 'اختبر معرفتك بـ React Native',
      descriptionEn: 'Test your knowledge of React Native',
      passingScore: 70,
      timeLimit: 20,
      isPublished: true,
      showResults: true,
      courseId: mobileCourse.id,
      lessonId: createdMobileLessons[2].id
    }
  });

  const mobileQuestions = [
    {
      questionAr: 'React Native يستخدم لبناء تطبيقات:',
      questionEn: 'React Native is used to build:',
      type: QuestionType.MULTIPLE_CHOICE,
      options: JSON.stringify([
        { ar: 'مواقع ويب فقط', en: 'Web apps only', isCorrect: false },
        { ar: 'iOS فقط', en: 'iOS only', isCorrect: false },
        { ar: 'Android فقط', en: 'Android only', isCorrect: false },
        { ar: 'iOS و Android معاً', en: 'Both iOS and Android', isCorrect: true }
      ]),
      correctAnswer: '3',
      points: 1,
      order: 1
    },
    {
      questionAr: 'ما هو المكون الأساسي لعرض النص في React Native؟',
      questionEn: 'What is the basic component to display text in React Native?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: JSON.stringify([
        { ar: '<p>', en: '<p>', isCorrect: false },
        { ar: '<Text>', en: '<Text>', isCorrect: true },
        { ar: '<div>', en: '<div>', isCorrect: false },
        { ar: '<span>', en: '<span>', isCorrect: false }
      ]),
      correctAnswer: '1',
      points: 1,
      order: 2
    },
    {
      questionAr: 'يمكن استخدام CSS العادي في React Native',
      questionEn: 'Regular CSS can be used in React Native',
      type: QuestionType.TRUE_FALSE,
      options: JSON.stringify([
        { ar: 'صحيح', en: 'True', isCorrect: false },
        { ar: 'خطأ', en: 'False', isCorrect: true }
      ]),
      correctAnswer: '1',
      points: 1,
      order: 3
    },
    {
      questionAr: 'ما هي المكتبة الأكثر استخداماً للتنقل في React Native؟',
      questionEn: 'What is the most used library for navigation in React Native?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: JSON.stringify([
        { ar: 'React Router', en: 'React Router', isCorrect: false },
        { ar: 'React Navigation', en: 'React Navigation', isCorrect: true },
        { ar: 'Vue Router', en: 'Vue Router', isCorrect: false },
        { ar: 'Angular Router', en: 'Angular Router', isCorrect: false }
      ]),
      correctAnswer: '1',
      points: 1,
      order: 4
    }
  ];

  for (const q of mobileQuestions) {
    await prisma.question.create({ data: { ...q, quizId: mobileQuiz.id } });
  }

  console.log('✅ Mobile Development Course created with 10 lessons and 1 quiz');

  // تسجيل الطالب في الدورات الجديدة
  if (student) {
    await prisma.enrollment.createMany({
      data: [
        { userId: student.id, courseId: pythonCourse.id, status: 'ACTIVE' },
        { userId: student.id, courseId: uiuxCourse.id, status: 'ACTIVE' },
        { userId: student.id, courseId: mobileCourse.id, status: 'ACTIVE' }
      ]
    });
    console.log('✅ Student enrolled in all new courses');
  }

  // ملخص
  const totalCourses = await prisma.course.count();
  const totalLessons = await prisma.lesson.count();
  const totalQuizzes = await prisma.quiz.count();
  const totalQuestions = await prisma.question.count();

  console.log('\n========================================');
  console.log('✅ تم إنشاء 3 دورات جديدة بنجاح!');
  console.log('========================================');
  console.log('إجمالي الدورات:', totalCourses);
  console.log('إجمالي الدروس:', totalLessons);
  console.log('إجمالي الاختبارات:', totalQuizzes);
  console.log('إجمالي الأسئلة:', totalQuestions);
}

createCourses()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
