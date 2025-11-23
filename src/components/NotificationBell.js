import React, { useState, useEffect } from 'react';
import authService from '../services/auth.service';
import notificationService from '../services/notification.service';

// Module-level singleton holder to avoid creating multiple EventSource connections
const _esHolder = { es: null, token: null, listeners: 0, lastFetch: 0 };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const user = authService.getCurrentUser();
  const token = authService.getToken();

  useEffect(() => {
    if (!user) return;
    if (!authService.isTokenValid()) return; // do not attempt SSE with missing/expired token

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    const currentToken = token;

    // if there's an existing ES with different token, close it
    if (_esHolder.es && _esHolder.token !== currentToken) {
      try { _esHolder.es.close(); } catch (e) {}
      _esHolder.es = null;
      _esHolder.token = null;
      _esHolder.listeners = 0;
    }

    let es = _esHolder.es;
    const onConnected = () => {
      // initial load (debounced across reconnects)
      const now = Date.now();
      if (! _esHolder.lastFetch || now - _esHolder.lastFetch > 5000) {
        _esHolder.lastFetch = now;
        notificationService.getUserNotifications().then(res => setNotes(res.data || [])).catch(() => {});
      }
    };
    const onHeartbeat = () => { /* noop: keep connection alive */ };
    const onNotification = (e) => {
      try {
        const data = JSON.parse(e.data);
        setNotes(prev => [data, ...prev]);
      } catch (err) {
        console.error('Invalid notification event', err);
      }
    };

    if (!es) {
      try {
        es = new EventSource(`${API_URL}/api/notifications/stream?token=${currentToken}`);
        _esHolder.es = es;
        _esHolder.token = currentToken;
      } catch (e) {
        console.error('SSE connection failed', e);
        return;
      }
    }

    // attach listeners for this component
    es.addEventListener('connected', onConnected);
    es.addEventListener('notification', onNotification);
    es.addEventListener('heartbeat', onHeartbeat);
    _esHolder.listeners += 1;

    // error handling: if server never sends 'connected' we stop after short timeout
    let connected = false;
    const connectTimeout = setTimeout(() => {
      if (!connected) {
        try { es.close(); } catch (e) {}
        if (_esHolder.es === es) { _esHolder.es = null; _esHolder.token = null; }
      }
    }, 5000);
    const connectedHandler = () => { connected = true; clearTimeout(connectTimeout); };
    es.addEventListener('connected', connectedHandler);

    return () => {
      try {
        es.removeEventListener('connected', onConnected);
        es.removeEventListener('notification', onNotification);
        es.removeEventListener('connected', connectedHandler);
      } catch (e) {}
      _esHolder.listeners = Math.max(0, _esHolder.listeners - 1);
      // close underlying ES if no listeners remain
      if (_esHolder.listeners === 0 && _esHolder.es) {
        try { _esHolder.es.close(); } catch (e) {}
        _esHolder.es = null;
        _esHolder.token = null;
      }
      try { clearTimeout(connectTimeout); } catch (e) {}
    };
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
