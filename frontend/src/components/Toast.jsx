import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onDismiss, 3600);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;
  return <div className={`toast toast-${type}`} role="status">{message}<button aria-label="Dismiss notification" onClick={onDismiss}>×</button></div>;
}