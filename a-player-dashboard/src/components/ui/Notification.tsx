// Notification Component
// Provides consistent success, error, warning, and info notifications

import React, { useState, useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  type: NotificationType;
  title?: string;
  message: string;
  dismissible?: boolean;
  autoHideDuration?: number; // in milliseconds, 0 = no auto hide
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
  const iconClasses = "h-5 w-5";
  
  switch (type) {
    case 'success':
      return (
        <svg className={`${iconClasses} text-green-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className={`${iconClasses} text-red-400`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={`${iconClasses} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    case 'info':
      return (
        <svg className={`${iconClasses} text-blue-400`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
};

export const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  dismissible = true,
  autoHideDuration = 5000,
  onDismiss,
  actions = []
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide functionality
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  // Styling based on notification type
  const getNotificationStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border border-green-200',
          title: 'text-green-800',
          message: 'text-green-700',
          icon: 'text-green-400'
        };
      case 'error':
        return {
          container: 'bg-red-50 border border-red-200',
          title: 'text-red-800',
          message: 'text-red-700',
          icon: 'text-red-400'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border border-yellow-200',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          icon: 'text-yellow-400'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border border-blue-200',
          title: 'text-blue-800',
          message: 'text-blue-700',
          icon: 'text-blue-400'
        };
      default:
        return {
          container: 'bg-gray-50 border border-gray-200',
          title: 'text-gray-800',
          message: 'text-gray-700',
          icon: 'text-gray-400'
        };
    }
  };

  const styles = getNotificationStyles();

  return (
    <div className={`rounded-lg p-4 ${styles.container}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <NotificationIcon type={type} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title} mb-1`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${styles.message}`}>
            {message}
          </div>
          {actions.length > 0 && (
            <div className="mt-3 flex space-x-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`text-sm font-medium ${
                    action.variant === 'primary'
                      ? `${styles.title} hover:opacity-75`
                      : `${styles.message} hover:opacity-75`
                  } underline`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={handleDismiss}
                className={`inline-flex rounded-md p-1.5 ${styles.message} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for managing notifications state
export interface NotificationState {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  dismissible?: boolean;
  autoHideDuration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const addNotification = (notification: Omit<NotificationState, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods for different notification types
  const showSuccess = (message: string, title?: string, options?: Partial<NotificationState>) => {
    addNotification({ type: 'success', message, title, ...options });
  };

  const showError = (message: string, title?: string, options?: Partial<NotificationState>) => {
    addNotification({ type: 'error', message, title, ...options });
  };

  const showWarning = (message: string, title?: string, options?: Partial<NotificationState>) => {
    addNotification({ type: 'warning', message, title, ...options });
  };

  const showInfo = (message: string, title?: string, options?: Partial<NotificationState>) => {
    addNotification({ type: 'info', message, title, ...options });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// Container component for rendering multiple notifications
export const NotificationContainer: React.FC<{
  notifications: NotificationState[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}> = ({ notifications, onDismiss, position = 'top-right' }) => {
  if (notifications.length === 0) {
    return null;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'fixed top-4 right-4 z-50';
      case 'top-left':
        return 'fixed top-4 left-4 z-50';
      case 'bottom-right':
        return 'fixed bottom-4 right-4 z-50';
      case 'bottom-left':
        return 'fixed bottom-4 left-4 z-50';
      case 'top-center':
        return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50';
      default:
        return 'fixed top-4 right-4 z-50';
    }
  };

  return (
    <div className={`${getPositionClasses()} max-w-sm w-full space-y-2`}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onDismiss={() => onDismiss(notification.id)}
        />
      ))}
    </div>
  );
};

export default Notification;


