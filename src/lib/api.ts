// API Helper Functions
const API_BASE_URL = '/api';

// Generic fetch function
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// ==================== Auth API ====================

export const authAPI = {
  login: async (email: string, password: string) => {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (name: string, email: string, password: string) => {
    return fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },
};

// ==================== Courses API ====================

export const coursesAPI = {
  getAll: async (params?: {
    category?: string;
    level?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.level) searchParams.append('level', params.level);
    if (params?.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    return fetchAPI(`/courses${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return fetchAPI(`/courses/${id}`);
  },

  create: async (courseData: any) => {
    return fetchAPI('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  },

  update: async (id: string, courseData: any) => {
    return fetchAPI(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  },

  delete: async (id: string) => {
    return fetchAPI(`/courses/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== Users API ====================

export const usersAPI = {
  getAll: async (params?: { role?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    return fetchAPI(`/users${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return fetchAPI(`/users/${id}`);
  },
};

// ==================== Enrollments API ====================

export const enrollmentsAPI = {
  enroll: async (userId: string, courseId: string) => {
    return fetchAPI('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
  },

  getUserEnrollments: async (userId: string) => {
    return fetchAPI(`/enrollments?userId=${userId}`);
  },

  updateProgress: async (enrollmentId: string, lessonId: string) => {
    return fetchAPI(`/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ lessonId }),
    });
  },
};

// ==================== Payments API ====================

export const paymentsAPI = {
  create: async (data: {
    userId: string;
    courseId: string;
    amount: number;
    paymentMethod?: string;
  }) => {
    return fetchAPI('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getHistory: async (userId: string) => {
    return fetchAPI(`/payments?userId=${userId}`);
  },
};

// ==================== Export all ====================

export default {
  auth: authAPI,
  courses: coursesAPI,
  users: usersAPI,
  enrollments: enrollmentsAPI,
  payments: paymentsAPI,
};
