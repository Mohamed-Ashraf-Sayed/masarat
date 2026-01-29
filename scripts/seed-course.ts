import { PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting to seed course data...');

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    console.log('❌ No admin user found. Please create an admin first.');
    return;
  }

  // Get or create category
  let category = await prisma.category.findFirst({
    where: { slug: 'programming' },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        nameAr: 'البرمجة',
        nameEn: 'Programming',
        slug: 'programming',
        description: 'Learn programming languages and software development',
        icon: 'code',
        color: '#3B82F6',
      },
    });
  }

  // Create course
  const course = await prisma.course.create({
    data: {
      titleAr: 'أساسيات البرمجة بلغة JavaScript',
      titleEn: 'JavaScript Programming Fundamentals',
      descriptionAr: 'تعلم أساسيات البرمجة باستخدام لغة JavaScript من الصفر. ستتعلم المتغيرات والدوال والحلقات والمصفوفات وغيرها من المفاهيم الأساسية.',
      descriptionEn: 'Learn programming fundamentals using JavaScript from scratch. You will learn variables, functions, loops, arrays, and other basic concepts.',
      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
      price: 0,
      originalPrice: 99,
      level: 'BEGINNER',
      duration: 180,
      isPublished: true,
      isFeatured: true,
      categoryId: category.id,
      instructorId: admin.id,
    },
  });

  console.log('✅ Course created:', course.titleEn);

  // Create lessons
  const lessonsData = [
    {
      titleAr: 'مقدمة في JavaScript',
      titleEn: 'Introduction to JavaScript',
      description: 'تعرف على لغة JavaScript وتاريخها واستخداماتها',
      videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
      duration: 15,
      isFree: true,
      order: 1,
    },
    {
      titleAr: 'المتغيرات وأنواع البيانات',
      titleEn: 'Variables and Data Types',
      description: 'تعلم كيفية تعريف المتغيرات وأنواع البيانات المختلفة',
      videoUrl: 'https://www.youtube.com/watch?v=9emXNzqCKyg',
      duration: 20,
      isFree: true,
      order: 2,
    },
    {
      titleAr: 'العمليات والمشغلات',
      titleEn: 'Operators and Operations',
      description: 'تعلم العمليات الحسابية والمنطقية',
      videoUrl: 'https://www.youtube.com/watch?v=FZzyij43A54',
      duration: 18,
      isFree: false,
      order: 3,
    },
    {
      titleAr: 'الجمل الشرطية',
      titleEn: 'Conditional Statements',
      description: 'تعلم if, else, switch وكيفية اتخاذ القرارات',
      videoUrl: 'https://www.youtube.com/watch?v=IsG4Xd6LlsM',
      duration: 25,
      isFree: false,
      order: 4,
    },
    {
      titleAr: 'الحلقات التكرارية',
      titleEn: 'Loops',
      description: 'تعلم for, while, do-while loops',
      videoUrl: 'https://www.youtube.com/watch?v=s9wW2PpJsmQ',
      duration: 22,
      isFree: false,
      order: 5,
    },
  ];

  const lessons = [];
  for (const lessonData of lessonsData) {
    const lesson = await prisma.lesson.create({
      data: {
        ...lessonData,
        courseId: course.id,
      },
    });
    lessons.push(lesson);
    console.log('✅ Lesson created:', lesson.titleEn);
  }

  // Create main course quiz
  const courseQuiz = await prisma.quiz.create({
    data: {
      titleAr: 'الاختبار النهائي - أساسيات JavaScript',
      titleEn: 'Final Exam - JavaScript Fundamentals',
      descriptionAr: 'اختبار شامل لقياس مستواك في أساسيات JavaScript',
      descriptionEn: 'Comprehensive test to measure your JavaScript fundamentals level',
      passingScore: 60,
      timeLimit: 30,
      isPublished: true,
      showResults: true,
      shuffleQuestions: true,
      maxAttempts: 3,
      courseId: course.id,
    },
  });

  console.log('✅ Course quiz created:', courseQuiz.titleEn);

  // Create lesson quizzes
  const lessonQuizzes = [];
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const quiz = await prisma.quiz.create({
      data: {
        titleAr: `اختبار: ${lesson.titleAr}`,
        titleEn: `Quiz: ${lesson.titleEn}`,
        descriptionAr: `اختبار قصير على درس ${lesson.titleAr}`,
        descriptionEn: `Short quiz on ${lesson.titleEn} lesson`,
        passingScore: 70,
        timeLimit: 10,
        isPublished: true,
        showResults: true,
        shuffleQuestions: false,
        maxAttempts: 5,
        courseId: course.id,
        lessonId: lesson.id,
      },
    });
    lessonQuizzes.push(quiz);
    console.log('✅ Lesson quiz created:', quiz.titleEn);
  }

  // Questions for main course quiz
  const courseQuizQuestions = [
    {
      questionAr: 'ما هي JavaScript؟',
      questionEn: 'What is JavaScript?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        { ar: 'لغة برمجة للويب', en: 'A web programming language', isCorrect: true },
        { ar: 'نظام تشغيل', en: 'An operating system', isCorrect: false },
        { ar: 'قاعدة بيانات', en: 'A database', isCorrect: false },
        { ar: 'محرر نصوص', en: 'A text editor', isCorrect: false },
      ],
      correctAnswer: '',
      points: 10,
      explanation: 'JavaScript هي لغة برمجة تستخدم بشكل أساسي لتطوير تطبيقات الويب',
      order: 1,
    },
    {
      questionAr: 'أي من التالي طريقة صحيحة لتعريف متغير في JavaScript؟',
      questionEn: 'Which of the following is a correct way to declare a variable in JavaScript?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        { ar: 'let x = 5;', en: 'let x = 5;', isCorrect: true },
        { ar: 'variable x = 5;', en: 'variable x = 5;', isCorrect: false },
        { ar: 'int x = 5;', en: 'int x = 5;', isCorrect: false },
        { ar: 'declare x = 5;', en: 'declare x = 5;', isCorrect: false },
      ],
      correctAnswer: '',
      points: 10,
      explanation: 'في JavaScript نستخدم let أو const أو var لتعريف المتغيرات',
      order: 2,
    },
    {
      questionAr: 'JavaScript يمكن تشغيلها فقط في المتصفح',
      questionEn: 'JavaScript can only run in the browser',
      type: QuestionType.TRUE_FALSE,
      options: [
        { ar: 'صح', en: 'True', isCorrect: false },
        { ar: 'خطأ', en: 'False', isCorrect: true },
      ],
      correctAnswer: '',
      points: 10,
      explanation: 'JavaScript يمكن تشغيلها أيضاً على السيرفر باستخدام Node.js',
      order: 3,
    },
    {
      questionAr: 'ما هو ناتج: 5 + "5"؟',
      questionEn: 'What is the result of: 5 + "5"?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        { ar: '55', en: '55', isCorrect: true },
        { ar: '10', en: '10', isCorrect: false },
        { ar: 'خطأ', en: 'Error', isCorrect: false },
        { ar: 'undefined', en: 'undefined', isCorrect: false },
      ],
      correctAnswer: '',
      points: 10,
      explanation: 'عند جمع رقم مع نص، JavaScript يحول الرقم إلى نص ويدمجهما',
      order: 4,
    },
    {
      questionAr: 'أي حلقة تنفذ الكود مرة واحدة على الأقل؟',
      questionEn: 'Which loop executes the code at least once?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        { ar: 'do-while', en: 'do-while', isCorrect: true },
        { ar: 'for', en: 'for', isCorrect: false },
        { ar: 'while', en: 'while', isCorrect: false },
        { ar: 'forEach', en: 'forEach', isCorrect: false },
      ],
      correctAnswer: '',
      points: 10,
      explanation: 'حلقة do-while تنفذ الكود أولاً ثم تتحقق من الشرط',
      order: 5,
    },
  ];

  for (const q of courseQuizQuestions) {
    await prisma.question.create({
      data: {
        ...q,
        options: JSON.stringify(q.options),
        quizId: courseQuiz.id,
      },
    });
  }
  console.log('✅ Added', courseQuizQuestions.length, 'questions to course quiz');

  // Questions for lesson quizzes
  const lessonQuestionsData = [
    // Lesson 1 - Introduction
    [
      {
        questionAr: 'متى تم إنشاء JavaScript؟',
        questionEn: 'When was JavaScript created?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          { ar: '1995', en: '1995', isCorrect: true },
          { ar: '2000', en: '2000', isCorrect: false },
          { ar: '1990', en: '1990', isCorrect: false },
          { ar: '2005', en: '2005', isCorrect: false },
        ],
        correctAnswer: '',
        points: 10,
        order: 1,
      },
      {
        questionAr: 'JavaScript و Java هما نفس اللغة',
        questionEn: 'JavaScript and Java are the same language',
        type: QuestionType.TRUE_FALSE,
        options: [
          { ar: 'صح', en: 'True', isCorrect: false },
          { ar: 'خطأ', en: 'False', isCorrect: true },
        ],
        correctAnswer: '',
        points: 10,
        order: 2,
      },
    ],
    // Lesson 2 - Variables
    [
      {
        questionAr: 'أي كلمة مفتاحية تُستخدم لتعريف متغير لا يمكن تغيير قيمته؟',
        questionEn: 'Which keyword is used to declare a variable that cannot be reassigned?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          { ar: 'const', en: 'const', isCorrect: true },
          { ar: 'let', en: 'let', isCorrect: false },
          { ar: 'var', en: 'var', isCorrect: false },
          { ar: 'final', en: 'final', isCorrect: false },
        ],
        correctAnswer: '',
        points: 10,
        order: 1,
      },
      {
        questionAr: 'ما هو نوع البيانات للقيمة "Hello"؟',
        questionEn: 'What is the data type of the value "Hello"?',
        type: QuestionType.SHORT_ANSWER,
        options: [],
        correctAnswer: 'string',
        points: 10,
        order: 2,
      },
    ],
    // Lesson 3 - Operators
    [
      {
        questionAr: 'ما هو ناتج: 10 % 3؟',
        questionEn: 'What is the result of: 10 % 3?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          { ar: '1', en: '1', isCorrect: true },
          { ar: '3', en: '3', isCorrect: false },
          { ar: '0', en: '0', isCorrect: false },
          { ar: '10', en: '10', isCorrect: false },
        ],
        correctAnswer: '',
        points: 10,
        order: 1,
      },
      {
        questionAr: '=== يقارن القيمة والنوع معاً',
        questionEn: '=== compares both value and type',
        type: QuestionType.TRUE_FALSE,
        options: [
          { ar: 'صح', en: 'True', isCorrect: true },
          { ar: 'خطأ', en: 'False', isCorrect: false },
        ],
        correctAnswer: '',
        points: 10,
        order: 2,
      },
    ],
    // Lesson 4 - Conditionals
    [
      {
        questionAr: 'أي جملة شرطية تُستخدم للاختيار بين عدة حالات؟',
        questionEn: 'Which conditional statement is used to choose between multiple cases?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          { ar: 'switch', en: 'switch', isCorrect: true },
          { ar: 'if', en: 'if', isCorrect: false },
          { ar: 'for', en: 'for', isCorrect: false },
          { ar: 'while', en: 'while', isCorrect: false },
        ],
        correctAnswer: '',
        points: 10,
        order: 1,
      },
      {
        questionAr: 'else if يمكن استخدامها بدون if',
        questionEn: 'else if can be used without if',
        type: QuestionType.TRUE_FALSE,
        options: [
          { ar: 'صح', en: 'True', isCorrect: false },
          { ar: 'خطأ', en: 'False', isCorrect: true },
        ],
        correctAnswer: '',
        points: 10,
        order: 2,
      },
    ],
    // Lesson 5 - Loops
    [
      {
        questionAr: 'كم مرة تنفذ الحلقة: for(let i=0; i<5; i++)؟',
        questionEn: 'How many times does the loop execute: for(let i=0; i<5; i++)?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          { ar: '5', en: '5', isCorrect: true },
          { ar: '4', en: '4', isCorrect: false },
          { ar: '6', en: '6', isCorrect: false },
          { ar: 'لا نهائي', en: 'Infinite', isCorrect: false },
        ],
        correctAnswer: '',
        points: 10,
        order: 1,
      },
      {
        questionAr: 'break تُستخدم للخروج من الحلقة',
        questionEn: 'break is used to exit a loop',
        type: QuestionType.TRUE_FALSE,
        options: [
          { ar: 'صح', en: 'True', isCorrect: true },
          { ar: 'خطأ', en: 'False', isCorrect: false },
        ],
        correctAnswer: '',
        points: 10,
        order: 2,
      },
    ],
  ];

  for (let i = 0; i < lessonQuizzes.length; i++) {
    const quiz = lessonQuizzes[i];
    const questions = lessonQuestionsData[i] || [];

    for (const q of questions) {
      await prisma.question.create({
        data: {
          ...q,
          options: JSON.stringify(q.options),
          quizId: quiz.id,
        },
      });
    }
    console.log('✅ Added', questions.length, 'questions to lesson quiz:', quiz.titleEn);
  }

  console.log('\n🎉 Seeding completed successfully!');
  console.log('📚 Course ID:', course.id);
  console.log('📝 Total quizzes:', lessonQuizzes.length + 1);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
