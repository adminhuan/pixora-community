import { Toast } from '../ui';

interface NotificationToastProps {
  message: string;
}

export const NotificationToast = ({ message }: NotificationToastProps) => {
  if (!message) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', right: 24, top: 80, zIndex: 999 }}>
      <Toast message={message} type="info" />
    </div>
  );
};
