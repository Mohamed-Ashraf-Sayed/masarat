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
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f5fa; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(68, 133, 181, 0.15);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4485b5 0%, #3a7299 100%); padding: 40px 30px; text-align: center;">
      <img src="https://masaratedu.com/images/logo.png" alt="Masarat" style="height: 50px; margin-bottom: 10px;" />
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">تأكيد البريد الإلكتروني</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1a1a2e; margin-top: 0; font-size: 20px;">مرحباً ${userName}!</h2>

      <p style="color: #555; font-size: 15px; line-height: 1.8;">
        شكراً لتسجيلك في منصة مسارات!
        لتفعيل حسابك والبدء في رحلة التعلم، يرجى تأكيد بريدك الإلكتروني.
      </p>

      <!-- Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: #4485b5; color: #ffffff; text-decoration: none; padding: 14px 50px; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(68, 133, 181, 0.3);">
          تأكيد البريد الإلكتروني
        </a>
      </div>

      <p style="color: #999; font-size: 13px; line-height: 1.6;">
        أو انسخ الرابط التالي وألصقه في متصفحك:
        <br>
        <a href="${verifyUrl}" style="color: #4485b5; word-break: break-all;">${verifyUrl}</a>
      </p>

      <div style="background-color: #e8f4fc; border: 1px solid #4485b5; border-radius: 10px; padding: 15px; margin-top: 25px;">
        <p style="color: #2c6e9e; margin: 0; font-size: 14px;">
          هذا الرابط صالح لمدة 24 ساعة.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e8edf2;">
      <p style="color: #888; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} مسارات لخدمات تحليل السلوك التطبيقي. جميع الحقوق محفوظة.
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
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f5fa; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(68, 133, 181, 0.15);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4485b5 0%, #3a7299 100%); padding: 40px 30px; text-align: center;">
      <img src="https://masaratedu.com/images/logo.png" alt="Masarat" style="height: 50px; margin-bottom: 10px;" />
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">إعادة تعيين كلمة المرور</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1a1a2e; margin-top: 0; font-size: 20px;">مرحباً ${userName}،</h2>

      <p style="color: #555; font-size: 15px; line-height: 1.8;">
        لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منصة مسارات.
        إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد الإلكتروني.
      </p>

      <!-- Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #4485b5; color: #ffffff; text-decoration: none; padding: 14px 50px; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(68, 133, 181, 0.3);">
          إعادة تعيين كلمة المرور
        </a>
      </div>

      <p style="color: #999; font-size: 13px; line-height: 1.6;">
        أو انسخ الرابط التالي وألصقه في متصفحك:
        <br>
        <a href="${resetUrl}" style="color: #4485b5; word-break: break-all;">${resetUrl}</a>
      </p>

      <div style="background-color: #e8f4fc; border: 1px solid #4485b5; border-radius: 10px; padding: 15px; margin-top: 25px;">
        <p style="color: #2c6e9e; margin: 0; font-size: 14px;">
          هذا الرابط صالح لمدة ساعة واحدة فقط.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e8edf2;">
      <p style="color: #888; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} مسارات لخدمات تحليل السلوك التطبيقي. جميع الحقوق محفوظة.
      </p>
      <p style="color: #aaa; font-size: 11px; margin: 8px 0 0;">
        هذا بريد إلكتروني آلي، يرجى عدم الرد عليه.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
