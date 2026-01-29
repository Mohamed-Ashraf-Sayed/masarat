import nodemailer from 'nodemailer';

// إعداد transporter للإيميل
// في الإنتاج، استخدم SMTP حقيقي مثل SendGrid, Mailgun, أو Gmail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  try {
    // في وضع التطوير، اطبع الإيميل في الكونسول بدلاً من إرساله
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      console.log('========== EMAIL (Development Mode) ==========');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html);
      console.log('==============================================');
      return true;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"مسارات" <noreply@eduplatform.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// قالب إيميل تأكيد البريد الإلكتروني
export function getEmailVerificationTemplate(verifyUrl: string, userName: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد البريد الإلكتروني</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">مسارات</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #333; margin-top: 0;">مرحباً ${userName}! 👋</h2>

      <p style="color: #666; font-size: 16px; line-height: 1.8;">
        شكراً لتسجيلك في منصتنا التعليمية!
        لتفعيل حسابك والبدء في رحلة التعلم، يرجى تأكيد بريدك الإلكتروني.
      </p>

      <!-- Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
          تأكيد البريد الإلكتروني
        </a>
      </div>

      <p style="color: #999; font-size: 14px; line-height: 1.6;">
        أو انسخ الرابط التالي وألصقه في متصفحك:
        <br>
        <a href="${verifyUrl}" style="color: #10b981; word-break: break-all;">${verifyUrl}</a>
      </p>

      <div style="background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin-top: 20px;">
        <p style="color: #065f46; margin: 0; font-size: 14px;">
          ✅ هذا الرابط صالح لمدة 24 ساعة.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} مسارات. جميع الحقوق محفوظة.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// قالب إيميل إعادة تعيين كلمة المرور
export function getPasswordResetEmailTemplate(resetUrl: string, userName: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">مسارات</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #333; margin-top: 0;">مرحباً ${userName}،</h2>

      <p style="color: #666; font-size: 16px; line-height: 1.8;">
        لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.
        إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد الإلكتروني.
      </p>

      <p style="color: #666; font-size: 16px; line-height: 1.8;">
        لإعادة تعيين كلمة المرور، انقر على الزر أدناه:
      </p>

      <!-- Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
          إعادة تعيين كلمة المرور
        </a>
      </div>

      <p style="color: #999; font-size: 14px; line-height: 1.6;">
        أو انسخ الرابط التالي وألصقه في متصفحك:
        <br>
        <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
      </p>

      <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-top: 20px;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          ⚠️ هذا الرابط صالح لمدة ساعة واحدة فقط.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} مسارات. جميع الحقوق محفوظة.
      </p>
      <p style="color: #999; font-size: 12px; margin: 10px 0 0;">
        هذا بريد إلكتروني آلي، يرجى عدم الرد عليه.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
