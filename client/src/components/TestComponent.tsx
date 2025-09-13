import React from 'react';

export function TestComponent() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      color: '#333', 
      fontSize: '16px',
      minHeight: '100vh'
    }}>
      <h1>🔧 Teste de Debug</h1>
      <p>Se você está vendo esta mensagem, o React está funcionando!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Status do Sistema:</h2>
        <ul>
          <li>✅ React renderizando</li>
          <li>✅ TypeScript compilando</li>
          <li>✅ Vite servindo conteúdo</li>
        </ul>
      </div>
    </div>
  );
}
