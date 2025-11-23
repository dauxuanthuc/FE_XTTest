import React, { useState, useEffect } from 'react';
import authService from '../services/auth.service';
import notificationService from '../services/notification.service';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const user = authService.getCurrentUser();
  const token = authService.getToken();

  useEffect(() => {
    if (!user) return;

    let es;
    let reconnectTimeout = 1000;
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

    const connect = () => {
      try {
        es = new EventSource(`${API_URL}/api/notifications/stream?token=${token}`);

        es.addEventListener('connected', () => {
          // initial load
          notificationService.getUserNotifications().then(res => setNotes(res.data || [])).catch(() => {});
        });

        es.addEventListener('notification', (e) => {
          try {
            const data = JSON.parse(e.data);
            setNotes(prev => [data, ...prev]);
          } catch (err) {
            console.error('Invalid notification event', err);
          }
        });

        es.onerror = () => {
          // attempt reconnect
          try { es.close(); } catch (ex) {}
          setTimeout(() => {
            reconnectTimeout = Math.min(30000, reconnectTimeout * 2);
            connect();
          }, reconnectTimeout);
        };
      } catch (e) {
        console.error('SSE connection failed', e);
      }
    };

    connect();
    return () => { try { if (es) es.close(); } catch (e) {} };
  }, [user, token]);

  const unreadCount = notes.filter(n => !n.isRead).length;

  function toggle() {
    setOpen(!open);
    if (!open) {
      // refresh when opening
      notificationService.getUserNotifications().then(res => setNotes(res.data || [])).catch(() => {});
    }
  }

  function markReadLocal(id) {
    // Persist read state (user endpoint) and update UI
    notificationService.markUserAsRead(id).then(() => {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }).catch(() => {
      // still mark locally if server call fails
      setNotes(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    });
  }

  if (!user) return null;

  return (
    <div style={{ display: 'inline-block', marginLeft: 8, position: 'relative' }}>
      <button onClick={toggle} aria-label="Notifications" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
        🔔
        {unreadCount > 0 && (
          <span style={{ background: 'red', color: '#fff', borderRadius: 10, padding: '2px 6px', fontSize: 12, marginLeft: 6 }}>{unreadCount}</span>
        )}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #ddd', width: 320, zIndex: 1000 }}>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {notes.length === 0 && <div style={{ padding: 10 }}>Bạn chưa có thông báo.</div>}
              {notes.map(n => (
                <div key={n.id} style={{ padding: 10, borderBottom: '1px solid #eee', background: n.isRead ? '#fff' : '#f7fbff', cursor: 'pointer' }} onClick={() => markReadLocal(n.id)}>
                  <div style={{ fontSize: 14, fontWeight: n.isRead ? 'normal' : '600' }}>{n.message}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
        </div>
      )}
    </div>
  );
}
