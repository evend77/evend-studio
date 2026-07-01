import React from 'react';
import { useParams } from 'react-router-dom'; // si tu utilises React Router

interface GuideTemplateProps {
  addonName: string;
}

export default function GuideTemplate({ addonName }: GuideTemplateProps) {
  return (
    <div style={{
      padding: '40px',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '48px',
        textAlign: 'center',
        maxWidth: '600px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🚧</div>
        <h1 style={{ fontSize: '28px', marginBottom: '16px', color: '#333' }}>
          Page en construction
        </h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>
          Le guide pour <strong>{addonName}</strong> sera bientôt disponible.
        </p>
        <div style={{
          width: '100px',
          height: '4px',
          backgroundColor: '#2d6a9f',
          margin: '0 auto',
          borderRadius: '2px',
        }} />
      </div>
    </div>
  );
}
