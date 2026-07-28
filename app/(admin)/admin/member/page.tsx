import { apiUrl } from '@/lib/api';

export class AdminMemberApiError extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name = 'AdminMemberApiError';
    this.status = status;
  }
}

export async function adminMemberApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (typeof window === 'undefined') {
    throw new AdminMemberApiError(
      '브라우저에서만 사용할 수 있습니다.',
      500
    );
  }

  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/login/';

    throw new AdminMemberApiError(
      '로그인이 필요합니다.',
      401
    );
  }

  const headers = new Headers(
    options.headers
  );

  headers.set(
    'Authorization',
    `Bearer ${token}`
  );

  const isFormData =
    typeof FormData !== 'undefined' &&
    options.body instanceof FormData;

  if (options.body && !isFormData) {
    headers.set(
      'Content-Type',
      'application/json'
    );
  }

  const response = await fetch(
    apiUrl(path),
    {
      ...options,
      headers,
      cache: 'no-store',
    }
  );

  let responseData: {
    message?: string;
  } | null = null;

  try {
    responseData =
      await response.json();
  } catch {
    responseData = null;
  }

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.href = '/login/';
  }

  if (!response.ok) {
    throw new AdminMemberApiError(
      responseData?.message ||
        `요청 처리에 실패했습니다. (${response.status})`,
      response.status
    );
  }

  return responseData as T; 
}