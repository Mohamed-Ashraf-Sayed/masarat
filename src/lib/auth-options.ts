import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { twoFactor: true },
        });

        if (!user || !user.password) {
          throw new Error('بيانات الدخول غير صحيحة');
        }

        if (!user.isActive) {
          throw new Error('الحساب معطل');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error('بيانات الدخول غير صحيحة');
        }

        // Check 2FA if enabled
        if (user.twoFactor?.isEnabled) {
          if (!credentials.twoFactorCode) {
            throw new Error('2FA_REQUIRED');
          }

          const { authenticator } = await import('otplib');
          const isValidToken = authenticator.verify({
            token: credentials.twoFactorCode,
            secret: user.twoFactor.secret,
          });

          if (!isValidToken) {
            // Check backup codes
            const backupCodes = JSON.parse(user.twoFactor.backupCodes || '[]');
            const hashedCode = await bcrypt.hash(credentials.twoFactorCode, 10);
            const backupCodeIndex = backupCodes.findIndex(
              (code: string) => bcrypt.compareSync(credentials.twoFactorCode!, code)
            );

            if (backupCodeIndex === -1) {
              throw new Error('رمز التحقق غير صحيح');
            }

            // Remove used backup code
            backupCodes.splice(backupCodeIndex, 1);
            await prisma.twoFactorSecret.update({
              where: { userId: user.id },
              data: { backupCodes: JSON.stringify(backupCodes) },
            });
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
      }

      if (trigger === 'update' && session) {
        token.name = session.name;
        token.avatar = session.avatar;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Update user points for daily login
      if (user.id) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const userPoints = await prisma.userPoints.findUnique({
          where: { userId: user.id },
        });

        if (userPoints) {
          const lastActive = new Date(userPoints.lastActiveAt);
          lastActive.setHours(0, 0, 0, 0);

          const dayDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

          if (dayDiff === 1) {
            // Consecutive day - increase streak
            await prisma.userPoints.update({
              where: { userId: user.id },
              data: {
                streak: userPoints.streak + 1,
                lastActiveAt: new Date(),
                totalPoints: userPoints.totalPoints + 5, // Daily login points
              },
            });

            await prisma.pointTransaction.create({
              data: {
                userId: user.id,
                points: 5,
                type: 'DAILY_LOGIN',
                description: 'نقاط تسجيل الدخول اليومي',
              },
            });
          } else if (dayDiff > 1) {
            // Streak broken
            await prisma.userPoints.update({
              where: { userId: user.id },
              data: {
                streak: 1,
                lastActiveAt: new Date(),
              },
            });
          }
        } else {
          // First time - create points record
          await prisma.userPoints.create({
            data: {
              userId: user.id,
              totalPoints: 10,
              streak: 1,
            },
          });

          await prisma.pointTransaction.create({
            data: {
              userId: user.id,
              points: 10,
              type: 'FIRST_ENROLLMENT',
              description: 'نقاط الانضمام للمنصة',
            },
          });
        }
      }

      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Create initial points for new users
      await prisma.userPoints.create({
        data: {
          userId: user.id,
          totalPoints: 10,
          streak: 1,
        },
      });

      await prisma.pointTransaction.create({
        data: {
          userId: user.id,
          points: 10,
          type: 'FIRST_ENROLLMENT',
          description: 'نقاط الانضمام للمنصة',
        },
      });
    },
  },
};
