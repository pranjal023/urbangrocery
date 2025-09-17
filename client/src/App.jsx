import React, { useEffect, useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import POS from './pages/POS.jsx'
import Inventory from './pages/Inventory.jsx'
import Reports from './pages/Reports.jsx'
import api from './api'
import RequireAuth from './components/RequireAuth.jsx'
import { validToken } from './utils/jwt'
import BrandMark from './components/BrandMark.jsx'   

export default function App(){
  const [authed, setAuthed] = useState(() => !!validToken())
  const [today, setToday] = useState(null)
  const nav = useNavigate()

  function logout(){
    localStorage.removeItem('token')
    setAuthed(false)
    nav('/login')
  }

  function dayBoundsISO(d = new Date()){
    const s = new Date(d); s.setHours(0,0,0,0)
    const e = new Date(d); e.setHours(23,59,59,999)
    return { from: s.toISOString(), to: e.toISOString() }
  }
  async function fetchToday(){
    try{
      const { from, to } = dayBoundsISO()
      const { data } = await api.get('/api/reports/daily-total', { params: { from, to } })
      setToday(data)
    }catch{ setToday(null) }
  }

  useEffect(() => {
    if (!authed) return setToday(null)
    fetchToday()
    const id = setInterval(fetchToday, 60_000)
    return () => clearInterval(id)
  }, [authed])

  useEffect(() => {
    const onLogout = () => { setAuthed(false); nav('/login') }
    window.addEventListener('auth-logout', onLogout)
    return () => window.removeEventListener('auth-logout', onLogout)
  }, [nav])

  return (
    <div>
      {authed && (
        <header className="header">
          <div className="navbar container">
            <div className="brand">
              {/* ⬇️ replaced logo image with UG badge */}
              <BrandMark text="UG" size={32} />
              <div>UrbanGrocery</div>
              <span className="badge">POS</span>
            </div>
            <nav className="nav-links">
              <NavLink to="/pos" className={({isActive})=> isActive ? 'active' : ''}>POS</NavLink>
              <NavLink to="/inventory" className={({isActive})=> isActive ? 'active' : ''}>Inventory</NavLink>
              <NavLink to="/reports" className={({isActive})=> isActive ? 'active' : ''}>Reports</NavLink>
            </nav>
            <div className="nav-right">
              {today && <span className="badge mono">Today ₹{today.total.toFixed(2)} • {today.bills} bills</span>}
              <button className="btn btn-ghost" onClick={logout}>Logout</button>
            </div>
          </div>
        </header>
      )}

      <main className="main container">
        <Routes>
          <Route path="/login" element={<Login onLogin={() => { setAuthed(true); nav('/pos') }} />} />
          <Route path="/pos" element={<RequireAuth><POS /></RequireAuth>} />
          <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
          <Route path="*" element={<Login onLogin={() => { setAuthed(true); nav('/pos') }} />} />
        </Routes>
      </main>
    </div>
  )
}
