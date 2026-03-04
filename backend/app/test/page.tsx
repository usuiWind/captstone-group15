'use client'

import { useState } from 'react'

export default function TestPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true)
    setResult('')
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }
      
      if (body && method !== 'GET') {
        options.body = JSON.stringify(body)
      }
      
      const response = await fetch(endpoint, options)
      const data = await response.json()
      
      setResult(`Status: ${response.status}\n\n${JSON.stringify(data, null, 2)}`)
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>API Testing Dashboard</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Public Endpoints</h2>
        <button onClick={() => testEndpoint('/api/staff')} disabled={loading}>
          Test GET /api/staff
        </button>
        <button onClick={() => testEndpoint('/api/sponsors')} disabled={loading} style={{ marginLeft: '10px' }}>
          Test GET /api/sponsors
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Registration Test</h2>
        <input 
          type="text" 
          id="regToken" 
          placeholder="Token (from Stripe webhook)" 
          style={{ width: '300px', marginRight: '10px' }}
        />
        <input 
          type="text" 
          id="regName" 
          placeholder="Name" 
          style={{ width: '200px', marginRight: '10px' }}
        />
        <input 
          type="password" 
          id="regPassword" 
          placeholder="Password (complex)" 
          style={{ width: '200px', marginRight: '10px' }}
        />
        <button 
          onClick={() => {
            const token = (document.getElementById('regToken') as HTMLInputElement).value
            const name = (document.getElementById('regName') as HTMLInputElement).value
            const password = (document.getElementById('regPassword') as HTMLInputElement).value
            testEndpoint('/api/auth/register', 'POST', { token, name, password })
          }}
          disabled={loading}
        >
          Test Registration
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Custom Endpoint Test</h2>
        <input 
          type="text" 
          id="customEndpoint" 
          placeholder="/api/your-endpoint" 
          style={{ width: '300px', marginRight: '10px' }}
        />
        <select id="customMethod" style={{ marginRight: '10px' }}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <button 
          onClick={() => {
            const endpoint = (document.getElementById('customEndpoint') as HTMLInputElement).value
            const method = (document.getElementById('customMethod') as HTMLSelectElement).value
            if (endpoint) testEndpoint(endpoint, method)
          }}
          disabled={loading}
        >
          Test Custom Endpoint
        </button>
      </div>

      <div>
        <h2>Results:</h2>
        {loading && <p>Loading...</p>}
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '4px', 
          whiteSpace: 'pre-wrap',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {result || 'Click a test button to see results...'}
        </pre>
      </div>
    </div>
  )
}
