import React, { useEffect, useState } from 'react';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsInbox() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const unreadOnly = filter === 'unread' ? 'true' : 'false';
      const res = await fetch(`/api/notifications?unreadOnly=${unreadOnly}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: 32 }}>Loading notifications...</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2>Notifications ({unreadCount} unread)</h2>
        <div>
          <button onClick={() => setFilter('all')} style={{ marginRight: 8 }}>
            All
          </button>
          <button onClick={() => setFilter('unread')} style={{ marginRight: 8 }}>
            Unread
          </button>
          {unreadCount > 0 && <button onClick={markAllAsRead}>Mark All as Read</button>}
        </div>
      </div>

      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <div>
          {notifications.map((notif) => (
            <div
              key={notif._id}
              style={{
                padding: 16,
                marginBottom: 8,
                border: '1px solid #ddd',
                borderRadius: 4,
                background: notif.read ? '#fff' : '#f0f8ff',
                cursor: 'pointer',
              }}
              onClick={() => !notif.read && markAsRead(notif._id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{notif.title}</strong>
                <small>{new Date(notif.createdAt).toLocaleString()}</small>
              </div>
              <p style={{ margin: '8px 0 0 0' }}>{notif.message}</p>
              {!notif.read && <span style={{ fontSize: 12, color: '#007bff' }}>● Unread</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
