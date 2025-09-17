import React, { useState } from 'react'
import api from '../api'

export default function Login({ onLogin }){
  const [email, setEmail] = useState('admin@urbangrocery.local')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')

  async function submit(e){
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      onLogin?.()
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed')
    }
  }

  return (
    <form onSubmit={submit} className="card auth-card stack">
      <div className="card-header">Sign in</div>
      <div className="card-body stack">
        <div className="stack">
          <label>Email</label>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="stack">
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {error && <div className="badge" style={{borderColor: 'var(--danger)', color:'#ffaaaa'}}> {error} </div>}
        <button className="btn btn-primary" type="submit">Sign in</button>
      </div>
    </form>
  )
}
