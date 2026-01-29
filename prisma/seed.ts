import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // تنظيف قاعدة البيانات
  await prisma.quizAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.review.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ==================== إنشاء المستخدمين ====================
  const hashedPassword = await bcrypt.hash('123456', 12);
  const adminPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'د. رضا جاد محمد طه كرامه',
      email: 'admin@masarat.com',
      password: adminPassword,
      role: 'ADMIN',
      avatar: '/images/trainer.jpg',
      bio: 'محلل سلوك دولي معتمد - Ph.D, QBA, IBA, AC - أكثر من 15 عاماً من الخبرة في مجال تحليل السلوك التطبيقي وتأهيل العاملين مع ذوي الإعاقة',
    },
  });

  const instructor1 = await prisma.user.create({
    data: {
      name: 'د. أحمد العتيبي',
      email: 'ahmed@masarat.com',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      avatar: '/images/team/vecteezy_a-smiling-saudi-arabian-man-in-traditional-thobe-and-ghutra_72489870.PNG',
      bio: 'محلل سلوك معتمد BCBA بخبرة 10 سنوات في مجال تحليل السلوك التطبيقي والتدخل المبكر',
    },
  });

  const instructor2 = await prisma.user.create({
    data: {
      name: 'د. نورة القحطاني',
      email: 'noura@masarat.com',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      avatar: '/images/team/vecteezy_portrait-of-a-veiled-islamic-woman-in-a-black-hijab_57177538.png',
      bio: 'أخصائية تحليل سلوك معتمدة QBA, IBA مع خبرة واسعة في التدريب والإشراف على برامج التدخل السلوكي',
    },
  });

  const student = await prisma.user.create({
    data: {
      name: 'خالد الدوسري',
      email: 'student@masarat.com',
      password: hashedPassword,
      role: 'STUDENT',
      avatar: 'https://ui-avatars.com/api/?name=Khalid&background=4485b5&color=fff',
    },
  });

  console.log('✅ Users created');

  // ==================== إنشاء التصنيفات ====================
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        nameAr: 'تحليل السلوك التطبيقي',
        nameEn: 'Applied Behavior Analysis',
        icon: 'Brain',
        color: 'from-blue-500 to-blue-700',
      },
    }),
    prisma.category.create({
      data: {
        nameAr: 'الشهادات المهنية',
        nameEn: 'Professional Certifications',
        icon: 'Award',
        color: 'from-amber-500 to-amber-700',
      },
    }),
    prisma.category.create({
      data: {
        nameAr: 'التدخل المبكر',
        nameEn: 'Early Intervention',
        icon: 'Heart',
        color: 'from-rose-500 to-rose-700',
      },
    }),
    prisma.category.create({
      data: {
        nameAr: 'التوحد والإعاقات النمائية',
        nameEn: 'Autism & Developmental Disabilities',
        icon: 'Users',
        color: 'from-emerald-500 to-emerald-700',
      },
    }),
  ]);

  console.log('✅ Categories created');

  // ==================== إنشاء الكورسات ====================

  // 1. IBA Program
  const course1 = await prisma.course.create({
    data: {
      titleAr: 'برنامج محلل السلوك الدولي IBA®',
      titleEn: 'International Behavior Analyst IBA® Program',
      descriptionAr: `برنامج تأهيلي شامل ومعتمد دولياً للحصول على شهادة محلل السلوك الدولي (IBA®) من منظمة IBAO.

🎯 أهداف البرنامج:
• إعداد محللي سلوك مؤهلين قادرين على تصميم وتنفيذ برامج تحليل السلوك التطبيقي
• تطوير مهارات التقييم السلوكي الوظيفي وتحليل البيانات
• التأهيل للإشراف على فرق العمل وتقديم الاستشارات المتخصصة

📚 محتوى البرنامج:
• المبادئ الأساسية لتحليل السلوك
• التقييم السلوكي والقياس
• تصميم خطط التدخل السلوكي
• الأخلاقيات المهنية
• الإشراف والتدريب

👥 الفئة المستهدفة:
• الأخصائيون العاملون في مجال التربية الخاصة
• المعالجون السلوكيون
• أخصائيو التوحد والإعاقات النمائية

⏱️ مدة البرنامج: 120 ساعة تدريبية
📜 الشهادة: شهادة IBA® معتمدة من IBAO`,
      descriptionEn: `A comprehensive and internationally accredited qualifying program to obtain the International Behavior Analyst (IBA®) certificate from IBAO.

🎯 Program Objectives:
• Prepare qualified behavior analysts capable of designing and implementing ABA programs
• Develop functional behavior assessment and data analysis skills
• Qualify for supervising work teams and providing specialized consultations

📚 Program Content:
• Basic principles of behavior analysis
• Behavioral assessment and measurement
• Designing behavior intervention plans
• Professional ethics
• Supervision and training

👥 Target Audience:
• Specialists working in special education
• Behavior therapists
• Autism and developmental disabilities specialists

⏱️ Duration: 120 training hours
📜 Certificate: IBAO accredited IBA® certificate`,
      thumbnail: '/images/programs/IBA.jpg',
      price: 1500,
      originalPrice: 2000,
      level: 'ADVANCED',
      duration: 120,
      isPublished: true,
      isFeatured: true,
      categoryId: categories[1].id,
      instructorId: admin.id,
    },
  });

  // 2. IBT Program
  const course2 = await prisma.course.create({
    data: {
      titleAr: 'برنامج معالج السلوك الدولي IBT®',
      titleEn: 'International Behavior Therapist IBT® Program',
      descriptionAr: `برنامج تدريبي متخصص ومعتمد دولياً لتأهيل معالجي السلوك للعمل مع الأطفال ذوي اضطراب طيف التوحد والإعاقات النمائية.

🎯 أهداف البرنامج:
• تأهيل معالجين سلوكيين قادرين على تنفيذ برامج التدخل السلوكي
• تطوير مهارات التعامل المباشر مع الأطفال ذوي التوحد
• إكساب المتدربين تقنيات التعليم المبني على الدليل العلمي

📚 محتوى البرنامج:
• مقدمة في اضطراب طيف التوحد
• تقنيات تحليل السلوك التطبيقي الأساسية
• تعليم المهارات الجديدة (DTT, NET)
• إدارة السلوكيات التحدية
• جمع البيانات وتحليلها
• التواصل مع الأسرة

👥 الفئة المستهدفة:
• خريجو التربية الخاصة
• العاملون في مراكز التوحد
• الراغبون في دخول مجال العلاج السلوكي

⏱️ مدة البرنامج: 80 ساعة تدريبية
📜 الشهادة: شهادة IBT® معتمدة من IBAO`,
      descriptionEn: `A specialized and internationally accredited training program to qualify behavior therapists to work with children with autism spectrum disorder and developmental disabilities.

🎯 Program Objectives:
• Qualify behavior therapists capable of implementing behavior intervention programs
• Develop skills for direct interaction with children with autism
• Equip trainees with evidence-based teaching techniques

📚 Program Content:
• Introduction to autism spectrum disorder
• Basic ABA techniques
• Teaching new skills (DTT, NET)
• Managing challenging behaviors
• Data collection and analysis
• Family communication

👥 Target Audience:
• Special education graduates
• Workers in autism centers
• Those wishing to enter the field of behavior therapy

⏱️ Duration: 80 training hours
📜 Certificate: IBAO accredited IBT® certificate`,
      thumbnail: '/images/programs/IBT.jpg',
      price: 1200,
      originalPrice: 1600,
      level: 'INTERMEDIATE',
      duration: 80,
      isPublished: true,
      isFeatured: true,
      categoryId: categories[1].id,
      instructorId: instructor1.id,
    },
  });

  // 3. QBA Program
  const course3 = await prisma.course.create({
    data: {
      titleAr: 'برنامج محلل السلوك المؤهل QBA®',
      titleEn: 'Qualified Behavior Analyst QBA® Program',
      descriptionAr: `برنامج تدريبي متكامل ومعتمد للحصول على شهادة محلل السلوك المؤهل (QBA®). يركز على المهارات العملية والتطبيقية في تحليل السلوك.

🎯 أهداف البرنامج:
• إعداد محللي سلوك مؤهلين للعمل بشكل مستقل
• تطوير مهارات التقييم والتخطيط العلاجي
• التأهيل لتصميم وتنفيذ برامج التدخل الفردية

📚 محتوى البرنامج:
• أساسيات تحليل السلوك التطبيقي
• طرق التقييم السلوكي
• تصميم البرامج العلاجية الفردية
• استراتيجيات تعديل السلوك
• القياس وتحليل البيانات
• الممارسة الأخلاقية

👥 الفئة المستهدفة:
• حاملو شهادة البكالوريوس في التخصصات ذات الصلة
• العاملون في مجال التربية الخاصة
• المهتمون بتطوير مسارهم المهني في تحليل السلوك

⏱️ مدة البرنامج: 100 ساعة تدريبية
📜 الشهادة: شهادة QBA® معتمدة`,
      descriptionEn: `An integrated and accredited training program to obtain the Qualified Behavior Analyst (QBA®) certificate. Focuses on practical and applied skills in behavior analysis.

🎯 Program Objectives:
• Prepare qualified behavior analysts to work independently
• Develop assessment and treatment planning skills
• Qualify for designing and implementing individual intervention programs

📚 Program Content:
• Fundamentals of applied behavior analysis
• Behavioral assessment methods
• Individual treatment program design
• Behavior modification strategies
• Measurement and data analysis
• Ethical practice

👥 Target Audience:
• Bachelor's degree holders in related fields
• Special education workers
• Those interested in developing their career in behavior analysis

⏱️ Duration: 100 training hours
📜 Certificate: Accredited QBA® certificate`,
      thumbnail: '/images/programs/QBA.jpg',
      price: 1300,
      originalPrice: 1800,
      level: 'INTERMEDIATE',
      duration: 100,
      isPublished: true,
      isFeatured: true,
      categoryId: categories[1].id,
      instructorId: admin.id,
    },
  });

  // 4. QASP-S Program
  const course4 = await prisma.course.create({
    data: {
      titleAr: 'برنامج ممارس خدمات التوحد المؤهل - مشرف QASP-S®',
      titleEn: 'Qualified Autism Services Practitioner - Supervisor QASP-S®',
      descriptionAr: `برنامج متقدم ومعتمد للإشراف على خدمات التوحد. يؤهل المتدربين للإشراف على فرق العمل وتقديم خدمات عالية الجودة للأفراد ذوي التوحد.

🎯 أهداف البرنامج:
• تأهيل مشرفين متخصصين في خدمات التوحد
• تطوير مهارات القيادة والإشراف على فرق العمل
• ضمان جودة الخدمات المقدمة للأفراد ذوي التوحد

📚 محتوى البرنامج:
• الإشراف الفعال في مجال التوحد
• تقييم جودة الخدمات
• تدريب وتطوير فرق العمل
• إدارة الحالات المعقدة
• التواصل مع الأسر والجهات المعنية
• الأخلاقيات والمعايير المهنية

👥 الفئة المستهدفة:
• حاملو شهادات IBA أو QBA أو BCBA
• المشرفون الحاليون في مراكز التوحد
• القيادات في مجال خدمات ذوي الإعاقة

⏱️ مدة البرنامج: 90 ساعة تدريبية
📜 الشهادة: شهادة QASP-S® معتمدة`,
      descriptionEn: `An advanced and accredited program for supervising autism services. Qualifies trainees to supervise work teams and provide high-quality services to individuals with autism.

🎯 Program Objectives:
• Qualify specialized supervisors in autism services
• Develop leadership and team supervision skills
• Ensure quality of services provided to individuals with autism

📚 Program Content:
• Effective supervision in autism field
• Service quality assessment
• Training and developing work teams
• Managing complex cases
• Communication with families and stakeholders
• Ethics and professional standards

👥 Target Audience:
• IBA, QBA, or BCBA certificate holders
• Current supervisors in autism centers
• Leaders in disability services

⏱️ Duration: 90 training hours
📜 Certificate: Accredited QASP-S® certificate`,
      thumbnail: '/images/programs/QASP-S.jpg',
      price: 1400,
      originalPrice: 1900,
      level: 'ADVANCED',
      duration: 90,
      isPublished: true,
      isFeatured: false,
      categoryId: categories[1].id,
      instructorId: instructor2.id,
    },
  });

  // 5. ABAT Program
  const course5 = await prisma.course.create({
    data: {
      titleAr: 'برنامج فني تحليل السلوك التطبيقي ABAT®',
      titleEn: 'Applied Behavior Analysis Technician ABAT® Program',
      descriptionAr: `برنامج تأسيسي ومعتمد للعمل كفني تحليل سلوك تطبيقي. مثالي للمبتدئين الراغبين في دخول مجال تحليل السلوك والعمل مع الأطفال ذوي التوحد.

🎯 أهداف البرنامج:
• إعداد فنيين مؤهلين لتنفيذ برامج ABA تحت الإشراف
• تطوير المهارات الأساسية للتعامل مع الأطفال ذوي التوحد
• فهم مبادئ تحليل السلوك التطبيقي الأساسية

📚 محتوى البرنامج:
• مقدمة في تحليل السلوك التطبيقي
• فهم اضطراب طيف التوحد
• تقنيات التعليم الأساسية
• جمع البيانات الأساسية
• إدارة السلوك في الجلسات
• العمل ضمن فريق متعدد التخصصات

👥 الفئة المستهدفة:
• خريجو الثانوية العامة فما فوق
• المربيات والعاملات في الحضانات
• أولياء الأمور الراغبين في فهم ABA
• الراغبون في العمل كفنيين سلوكيين

⏱️ مدة البرنامج: 60 ساعة تدريبية
📜 الشهادة: شهادة ABAT® معتمدة`,
      descriptionEn: `A foundational and accredited program to work as an Applied Behavior Analysis Technician. Ideal for beginners wishing to enter the field of behavior analysis and work with children with autism.

🎯 Program Objectives:
• Prepare qualified technicians to implement ABA programs under supervision
• Develop basic skills for working with children with autism
• Understand basic ABA principles

📚 Program Content:
• Introduction to Applied Behavior Analysis
• Understanding autism spectrum disorder
• Basic teaching techniques
• Basic data collection
• Session behavior management
• Working within a multidisciplinary team

👥 Target Audience:
• High school graduates and above
• Nannies and nursery workers
• Parents wanting to understand ABA
• Those wishing to work as behavior technicians

⏱️ Duration: 60 training hours
📜 Certificate: Accredited ABAT® certificate`,
      thumbnail: '/images/programs/ABAT.jpg',
      price: 800,
      originalPrice: 1200,
      level: 'BEGINNER',
      duration: 60,
      isPublished: true,
      isFeatured: true,
      categoryId: categories[1].id,
      instructorId: instructor1.id,
    },
  });

  // 6. ABA Fundamentals
  const course6 = await prisma.course.create({
    data: {
      titleAr: 'أساسيات تحليل السلوك التطبيقي ABA',
      titleEn: 'Fundamentals of Applied Behavior Analysis ABA',
      descriptionAr: `دورة تمهيدية شاملة في أساسيات تحليل السلوك التطبيقي. مثالية لمن يرغب في فهم المبادئ الأساسية قبل الالتحاق بالبرامج المتقدمة.

🎯 أهداف الدورة:
• فهم المبادئ الأساسية لتحليل السلوك
• التعرف على تاريخ وتطور علم تحليل السلوك
• استيعاب المفاهيم الرئيسية في ABA

📚 محتوى الدورة:
• تعريف السلوك وخصائصه
• التعزيز الإيجابي والسلبي
• العقاب وآثاره
• الإطفاء والتعميم
• السلسلة السلوكية
• مقدمة في التقييم السلوكي

👥 الفئة المستهدفة:
• المهتمون بمجال تحليل السلوك
• أولياء أمور الأطفال ذوي التوحد
• طلاب التربية الخاصة وعلم النفس

⏱️ مدة الدورة: 20 ساعة تدريبية
📜 الشهادة: شهادة حضور`,
      descriptionEn: `A comprehensive introductory course in the fundamentals of Applied Behavior Analysis. Ideal for those who want to understand the basic principles before enrolling in advanced programs.

🎯 Course Objectives:
• Understand basic principles of behavior analysis
• Learn about the history and development of behavior analysis
• Grasp key concepts in ABA

📚 Course Content:
• Definition of behavior and its characteristics
• Positive and negative reinforcement
• Punishment and its effects
• Extinction and generalization
• Behavior chaining
• Introduction to behavioral assessment

👥 Target Audience:
• Those interested in behavior analysis
• Parents of children with autism
• Special education and psychology students

⏱️ Duration: 20 training hours
📜 Certificate: Attendance certificate`,
      thumbnail: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800',
      price: 299,
      originalPrice: 499,
      level: 'BEGINNER',
      duration: 20,
      isPublished: true,
      isFeatured: false,
      categoryId: categories[0].id,
      instructorId: admin.id,
    },
  });

  console.log('✅ Courses created');

  // ==================== إنشاء الدروس لكل كورس ====================

  // دروس برنامج IBA
  await Promise.all([
    prisma.lesson.create({ data: { titleAr: 'مقدمة في تحليل السلوك التطبيقي', titleEn: 'Introduction to ABA', duration: 45, order: 1, isFree: true, courseId: course1.id } }),
    prisma.lesson.create({ data: { titleAr: 'تاريخ وتطور علم السلوك', titleEn: 'History of Behavior Science', duration: 30, order: 2, isFree: true, courseId: course1.id } }),
    prisma.lesson.create({ data: { titleAr: 'المبادئ الأساسية للسلوك', titleEn: 'Basic Principles of Behavior', duration: 60, order: 3, isFree: false, courseId: course1.id } }),
    prisma.lesson.create({ data: { titleAr: 'التعزيز: أنواعه وتطبيقاته', titleEn: 'Reinforcement: Types & Applications', duration: 90, order: 4, isFree: false, courseId: course1.id } }),
    prisma.lesson.create({ data: { titleAr: 'العقاب والآثار الجانبية', titleEn: 'Punishment & Side Effects', duration: 60, order: 5, isFree: false, courseId: course1.id } }),
    prisma.lesson.create({ data: { titleAr: 'التقييم السلوكي الوظيفي FBA', titleEn: 'Functional Behavior Assessment', duration: 120, order: 6, isFree: false, courseId: course1.id } }),
    prisma.lesson.create({ data: { titleAr: 'تصميم خطط التدخل السلوكي', titleEn: 'Behavior Intervention Plans', duration: 90, order: 7, isFree: false, courseId: course1.id } }),
    prisma.lesson.create({ data: { titleAr: 'جمع البيانات وتحليلها', titleEn: 'Data Collection & Analysis', duration: 75, order: 8, isFree: false, courseId: course1.id } }),
    prisma.lesson.create({ data: { titleAr: 'الأخلاقيات المهنية', titleEn: 'Professional Ethics', duration: 60, order: 9, isFree: false, courseId: course1.id } }),
    prisma.lesson.create({ data: { titleAr: 'الإشراف والتدريب', titleEn: 'Supervision & Training', duration: 60, order: 10, isFree: false, courseId: course1.id } }),
  ]);

  // دروس برنامج IBT
  await Promise.all([
    prisma.lesson.create({ data: { titleAr: 'مقدمة في اضطراب طيف التوحد', titleEn: 'Introduction to ASD', duration: 45, order: 1, isFree: true, courseId: course2.id } }),
    prisma.lesson.create({ data: { titleAr: 'خصائص الأطفال ذوي التوحد', titleEn: 'Characteristics of Children with ASD', duration: 60, order: 2, isFree: true, courseId: course2.id } }),
    prisma.lesson.create({ data: { titleAr: 'تقنية التعليم المنفصل DTT', titleEn: 'Discrete Trial Training', duration: 90, order: 3, isFree: false, courseId: course2.id } }),
    prisma.lesson.create({ data: { titleAr: 'التعليم في البيئة الطبيعية NET', titleEn: 'Natural Environment Teaching', duration: 75, order: 4, isFree: false, courseId: course2.id } }),
    prisma.lesson.create({ data: { titleAr: 'تعليم مهارات التواصل', titleEn: 'Teaching Communication Skills', duration: 90, order: 5, isFree: false, courseId: course2.id } }),
    prisma.lesson.create({ data: { titleAr: 'إدارة السلوكيات التحدية', titleEn: 'Managing Challenging Behaviors', duration: 120, order: 6, isFree: false, courseId: course2.id } }),
    prisma.lesson.create({ data: { titleAr: 'جمع البيانات في الجلسات', titleEn: 'Session Data Collection', duration: 60, order: 7, isFree: false, courseId: course2.id } }),
    prisma.lesson.create({ data: { titleAr: 'التواصل مع الأسرة', titleEn: 'Family Communication', duration: 45, order: 8, isFree: false, courseId: course2.id } }),
  ]);

  // دروس برنامج QBA
  await Promise.all([
    prisma.lesson.create({ data: { titleAr: 'أساسيات تحليل السلوك', titleEn: 'ABA Fundamentals', duration: 60, order: 1, isFree: true, courseId: course3.id } }),
    prisma.lesson.create({ data: { titleAr: 'طرق التقييم السلوكي', titleEn: 'Behavioral Assessment Methods', duration: 90, order: 2, isFree: false, courseId: course3.id } }),
    prisma.lesson.create({ data: { titleAr: 'تصميم البرامج الفردية', titleEn: 'Individual Program Design', duration: 120, order: 3, isFree: false, courseId: course3.id } }),
    prisma.lesson.create({ data: { titleAr: 'استراتيجيات تعديل السلوك', titleEn: 'Behavior Modification Strategies', duration: 90, order: 4, isFree: false, courseId: course3.id } }),
    prisma.lesson.create({ data: { titleAr: 'القياس وتحليل البيانات', titleEn: 'Measurement & Data Analysis', duration: 75, order: 5, isFree: false, courseId: course3.id } }),
    prisma.lesson.create({ data: { titleAr: 'الممارسة الأخلاقية', titleEn: 'Ethical Practice', duration: 60, order: 6, isFree: false, courseId: course3.id } }),
  ]);

  // دروس برنامج QASP-S
  await Promise.all([
    prisma.lesson.create({ data: { titleAr: 'مقدمة في الإشراف', titleEn: 'Introduction to Supervision', duration: 45, order: 1, isFree: true, courseId: course4.id } }),
    prisma.lesson.create({ data: { titleAr: 'مهارات القيادة الفعالة', titleEn: 'Effective Leadership Skills', duration: 60, order: 2, isFree: false, courseId: course4.id } }),
    prisma.lesson.create({ data: { titleAr: 'تقييم جودة الخدمات', titleEn: 'Service Quality Assessment', duration: 90, order: 3, isFree: false, courseId: course4.id } }),
    prisma.lesson.create({ data: { titleAr: 'تدريب فرق العمل', titleEn: 'Training Work Teams', duration: 75, order: 4, isFree: false, courseId: course4.id } }),
    prisma.lesson.create({ data: { titleAr: 'إدارة الحالات المعقدة', titleEn: 'Managing Complex Cases', duration: 90, order: 5, isFree: false, courseId: course4.id } }),
    prisma.lesson.create({ data: { titleAr: 'أخلاقيات الإشراف', titleEn: 'Supervision Ethics', duration: 45, order: 6, isFree: false, courseId: course4.id } }),
  ]);

  // دروس برنامج ABAT
  await Promise.all([
    prisma.lesson.create({ data: { titleAr: 'ما هو تحليل السلوك التطبيقي؟', titleEn: 'What is ABA?', duration: 30, order: 1, isFree: true, courseId: course5.id } }),
    prisma.lesson.create({ data: { titleAr: 'فهم اضطراب طيف التوحد', titleEn: 'Understanding ASD', duration: 45, order: 2, isFree: true, courseId: course5.id } }),
    prisma.lesson.create({ data: { titleAr: 'تقنيات التعليم الأساسية', titleEn: 'Basic Teaching Techniques', duration: 60, order: 3, isFree: false, courseId: course5.id } }),
    prisma.lesson.create({ data: { titleAr: 'جمع البيانات للمبتدئين', titleEn: 'Data Collection for Beginners', duration: 45, order: 4, isFree: false, courseId: course5.id } }),
    prisma.lesson.create({ data: { titleAr: 'إدارة الجلسة العلاجية', titleEn: 'Managing Therapy Sessions', duration: 60, order: 5, isFree: false, courseId: course5.id } }),
    prisma.lesson.create({ data: { titleAr: 'العمل ضمن الفريق', titleEn: 'Working in a Team', duration: 30, order: 6, isFree: false, courseId: course5.id } }),
  ]);

  // دروس دورة الأساسيات
  await Promise.all([
    prisma.lesson.create({ data: { titleAr: 'تعريف السلوك', titleEn: 'Definition of Behavior', duration: 20, order: 1, isFree: true, courseId: course6.id } }),
    prisma.lesson.create({ data: { titleAr: 'التعزيز الإيجابي والسلبي', titleEn: 'Positive & Negative Reinforcement', duration: 30, order: 2, isFree: true, courseId: course6.id } }),
    prisma.lesson.create({ data: { titleAr: 'العقاب وآثاره', titleEn: 'Punishment & Its Effects', duration: 25, order: 3, isFree: false, courseId: course6.id } }),
    prisma.lesson.create({ data: { titleAr: 'الإطفاء والتعميم', titleEn: 'Extinction & Generalization', duration: 30, order: 4, isFree: false, courseId: course6.id } }),
  ]);

  console.log('✅ Lessons created');

  // ==================== إنشاء خطط الاشتراك ====================
  await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        nameAr: 'الخطة الأساسية',
        nameEn: 'Basic Plan',
        priceMonthly: 99,
        priceYearly: 990,
        features: JSON.stringify({
          ar: ['الوصول لـ 3 دورات', 'شهادات إتمام', 'دعم عبر البريد'],
          en: ['Access to 3 courses', 'Completion certificates', 'Email support'],
        }),
        isPopular: false,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        nameAr: 'الخطة الاحترافية',
        nameEn: 'Pro Plan',
        priceMonthly: 199,
        priceYearly: 1990,
        features: JSON.stringify({
          ar: ['وصول غير محدود', 'شهادات معتمدة من IBAO', 'دعم 24/7', 'جلسات إشراف مباشرة'],
          en: ['Unlimited access', 'IBAO accredited certificates', '24/7 support', 'Live supervision sessions'],
        }),
        isPopular: true,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        nameAr: 'خطة المؤسسات',
        nameEn: 'Enterprise Plan',
        priceMonthly: 499,
        priceYearly: 4990,
        features: JSON.stringify({
          ar: ['كل مميزات Pro', 'تدريب فريق العمل', 'تقارير مفصلة', 'برامج مخصصة'],
          en: ['All Pro features', 'Team training', 'Detailed reports', 'Custom programs'],
        }),
        isPopular: false,
      },
    }),
  ]);

  console.log('✅ Subscription plans created');

  // ==================== تسجيل الطالب وإضافة تقييمات ====================
  await prisma.enrollment.create({
    data: { userId: student.id, courseId: course5.id, progress: 50 },
  });

  await Promise.all([
    prisma.review.create({
      data: {
        userId: student.id,
        courseId: course5.id,
        rating: 5,
        comment: 'دورة ممتازة ومحتوى علمي متميز! استفدت كثيراً من التطبيقات العملية والأمثلة الواقعية.',
      },
    }),
    prisma.review.create({
      data: {
        userId: instructor2.id,
        courseId: course1.id,
        rating: 5,
        comment: 'برنامج شامل ومتكامل، أنصح به كل من يريد التخصص في تحليل السلوك.',
      },
    }),
  ]);

  console.log('✅ Enrollments and reviews created');

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📧 Test accounts:');
  console.log('   Admin: admin@masarat.com / admin123');
  console.log('   Instructor: ahmed@masarat.com / 123456');
  console.log('   Student: student@masarat.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
