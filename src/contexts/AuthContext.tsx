'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ENTITY_OWNER' | 'ADMIN' | 'SUPER_ADMIN';
  enrolledCourses?: string[];
  completedCourses?: string[];
  certificates?: string[];
}

interface LoginResult {
  success: boolean;
  error?: string;
  requires2FA?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<LoginResult>;
  register: (name: string, email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // تحميل بيانات المستخدم من localStorage عند بدء التطبيق
  useEffect(() => {
    setMounted(true);

    // التأكد من أننا في المتصفح وليس على السيرفر
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');

        console.log('Loading auth from localStorage:', { savedUser: !!savedUser, savedToken: !!savedToken });

        if (savedUser && savedToken) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setToken(savedToken);
          console.log('User loaded:', parsedUser.email, parsedUser.role);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        // مسح البيانات التالفة
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  // لا تعرض المحتوى حتى يتم التحميل
  if (!mounted) {
    return null;
  }

  // تسجيل الدخول من قاعدة البيانات
  const login = async (email: string, password: string, twoFactorCode?: string): Promise<LoginResult> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, twoFactorCode }),
      });

      const data = await response.json();

      // التحقق من طلب 2FA
      if (data.requires2FA) {
        setIsLoading(false);
        return { success: false, requires2FA: true };
      }

      if (data.success) {
        const userData = data.data.user;
        const userToken = data.data.token;

        // جلب الكورسات المسجل فيها والشهادات
        const enrollmentsRes = await fetch(`/api/users/${userData.id}/enrollments`, {
          headers: { Authorization: `Bearer ${userToken}` },
        }).catch(() => null);

        let enrolledCourses: string[] = [];
        let completedCourses: string[] = [];
        let certificates: string[] = [];

        if (enrollmentsRes?.ok) {
          const enrollmentsData = await enrollmentsRes.json();
          if (enrollmentsData.success) {
            enrolledCourses = enrollmentsData.data.enrollments?.map((e: any) => e.courseId) || [];
            completedCourses = enrollmentsData.data.enrollments?.filter((e: any) => e.completed).map((e: any) => e.courseId) || [];
            certificates = enrollmentsData.data.certificates?.map((c: any) => c.id) || [];
          }
        }

        const fullUser: User = {
          ...userData,
          enrolledCourses,
          completedCourses,
          certificates,
        };

        setUser(fullUser);
        setToken(userToken);
        localStorage.setItem('user', JSON.stringify(fullUser));
        localStorage.setItem('token', userToken);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: data.error || 'فشل تسجيل الدخول' };
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
    }
  };

  // تسجيل مستخدم جديد في قاعدة البيانات
  const register = async (
    name: string,
    email: string,
    password: string,
    role: string = 'STUDENT'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (data.success) {
        const userData = data.data.user;
        const userToken = data.data.token;

        const fullUser: User = {
          ...userData,
          enrolledCourses: [],
          completedCourses: [],
          certificates: [],
        };

        setUser(fullUser);
        setToken(userToken);
        localStorage.setItem('user', JSON.stringify(fullUser));
        localStorage.setItem('token', userToken);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: data.error || 'فشل التسجيل' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
    }
  };

  // تسجيل الخروج
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    // إعادة التوجيه لصفحة تسجيل الدخول
    window.location.href = '/login';
  };

  // تحديث الملف الشخصي
  const updateProfile = async (data: Partial<User>) => {
    if (user && token) {
      try {
        const response = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          const updatedUser = { ...user, ...result.data };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Update profile error:', error);
        // في حالة الفشل، نحدث محلياً فقط
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
