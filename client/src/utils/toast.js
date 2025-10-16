import toast from 'react-hot-toast';

// Custom toast styles matching the app theme
const toastStyle = {
  style: {
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.95)',
    color: '#fff',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    backdropFilter: 'blur(12px)',
    padding: '16px',
    fontSize: '14px',
    maxWidth: '500px',
  },
};

// Success toast with detailed messages
export const showSuccess = (title, message = '') => {
  const content = message ? `${title}\n${message}` : title;
  return toast.success(content, {
    ...toastStyle,
    duration: 4000,
    icon: '✅',
  });
};

// Error toast with concise messages
export const showError = (message) => {
  return toast.error(message, {
    ...toastStyle,
    duration: 5000,
    icon: '❌',
  });
};

// Warning toast for important notices
export const showWarning = (title, message = '') => {
  const content = message ? `${title}\n${message}` : title;
  return toast(content, {
    ...toastStyle,
    duration: 4000,
    icon: '⚠️',
  });
};

// Info toast for general information
export const showInfo = (title, message = '') => {
  const content = message ? `${title}\n${message}` : title;
  return toast(content, {
    ...toastStyle,
    duration: 3000,
    icon: 'ℹ️',
  });
};

// Loading toast for async operations
export const showLoading = (message) => {
  return toast.loading(message, toastStyle);
};

// Promise toast for handling async operations
export const showPromise = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success.message 
        ? `${messages.success.title}\n${messages.success.message}`
        : messages.success.title,
      error: (err) => messages.error || err?.message || 'Something went wrong',
    },
    toastStyle
  );
};
