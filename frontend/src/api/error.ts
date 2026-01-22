import axios from 'axios';

type BackendErrorPayload = {
  success?: false;
  error?: {
    message?: string;
    code?: string;
  };
};

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as BackendErrorPayload | undefined;
    const backendMessage = data?.error?.message;
    if (backendMessage) return backendMessage;

    if (error.code === 'ERR_NETWORK') return 'Network error. Please check your connection.';

    const status = error.response?.status;
    if (status === 401) return 'Your session has expired. Please log in again.';
    if (status === 403) return 'You do not have permission to do this.';
    if (status === 404) return 'Not found.';
    if (status === 429) return 'Too many requests. Please try again soon.';
    if (typeof status === 'number' && status >= 500) return 'Server error. Please try again.';

    return fallback;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

