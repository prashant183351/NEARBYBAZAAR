import React, { useState } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('cookieConsent'));

  const accept = () => {
    fetch('/compliance/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cookie', accepted: true }),
      credentials: 'include',
    });
    localStorage.setItem('cookieConsent', '1');
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', bottom: 0, width: '100%', background: '#222', color: '#fff', padding: 16, zIndex: 1000 }}>
      <span>This site uses cookies to enhance your experience. See our privacy policy.</span>
      <button style={{ marginLeft: 16 }} onClick={accept}>Accept</button>
    </div>
  );
}
