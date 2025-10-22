import React, { useEffect, useState } from 'react';

interface PendingAgreement {
  type: string;
  version: string;
  title: string;
  content: string;
}

export default function CompliancePrompt() {
  const [pending, setPending] = useState<PendingAgreement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agreements/pending')
      .then((res) => res.json())
      .then((data) => {
        setPending(data.pending || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch pending agreements:', err);
        setLoading(false);
      });
  }, []);

  const handleAccept = async (agreementId: string) => {
    try {
      await fetch(`/api/agreements/${agreementId}/accept`, { method: 'POST' });

      // Move to next agreement or close
      if (currentIndex < pending.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setPending([]);
      }
    } catch (err) {
      console.error('Failed to accept agreement:', err);
    }
  };

  if (loading) {
    return <div>Loading compliance terms...</div>;
  }

  if (pending.length === 0) {
    return null;
  }

  const current = pending[currentIndex];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: 32,
          borderRadius: 8,
          maxWidth: 600,
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <h2>{current.title}</h2>
        <p>
          <em>Version {current.version}</em>
        </p>
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <div dangerouslySetInnerHTML={{ __html: current.content }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>
            {currentIndex + 1} of {pending.length}
          </span>
          <button onClick={() => handleAccept(current.type)}>Accept &amp; Continue</button>
        </div>
      </div>
    </div>
  );
}
