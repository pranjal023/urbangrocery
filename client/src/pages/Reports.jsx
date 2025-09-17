import React, { useEffect, useState } from 'react'
import api from '../api'

function toISODate(d){ return d.toISOString().slice(0,10) }
function startOfDayISO(s){ return new Date(s + 'T00:00:00.000').toISOString() }
function endOfDayISO(s){ return new Date(s + 'T23:59:59.999').toISOString() }

export default function Reports(){
  const [from, setFrom] = useState(()=>toISODate(new Date(Date.now()-7*864e5)))
  const [to, setTo] = useState(()=>toISODate(new Date()))
  const [top, setTop] = useState([])
  const [least, setLeast] = useState([])
  const [summary, setSummary] = useState(null)
  const [err, setErr] = useState('')

  async function load(){
    try{
      setErr('')
      const params = { from: startOfDayISO(from), to: endOfDayISO(to), limit: 10, by: 'qty' }

      // ✅ get all three in parallel and unpack as [a,b,s]
      const [a, b, s] = await Promise.all([
        api.get('/api/reports/top-sellers',   { params }),
        api.get('/api/reports/least-sellers', { params }),
        api.get('/api/reports/daily-total',   { params: { from: params.from, to: params.to } }),
      ])

      setTop(a.data)
      setLeast(b.data)
      setSummary(s.data)
    }catch(e){
      setErr(e.response?.data?.error || e.message)
      setTop([]); setLeast([]); setSummary(null)
    }
  }

  useEffect(()=>{ load() },[]) // auto-run on open

  return (
    <div className="stack-lg">
      <div className="card">
        <div className="card-header">Filters</div>
        <div className="card-body toolbar">
          <label>From <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label>
          <label>To <input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} /></label>
          <button className="btn" onClick={load}>Run</button>
          {err && <div className="badge" style={{borderColor:'var(--danger)', color:'#ffaaaa'}}>{err}</div>}
        </div>
      </div>

      {summary && (
        <div className="card">
          <div className="card-header">Summary</div>
          <div className="card-body">
            Total: <b className="mono">₹{summary.total.toFixed(2)}</b> •{' '}
            Bills: <b className="mono">{summary.bills}</b> •{' '}
            Avg bill: <b className="mono">₹{summary.avgBill.toFixed(2)}</b>
          </div>
        </div>
      )}

      <div className="grid-2">
        <section className="card">
          <div className="card-header">Top Sellers</div>
          <div className="card-body stack">
            {top.map((r,i)=>(
              <div key={i} className="list-row">
                <div>{r.name}</div>
                <div className="muted">Qty {r.qty}</div>
                <div className="right mono">₹{r.revenue?.toFixed?.(2)}</div>
              </div>
            ))}
            {!top.length && <div className="muted">No data</div>}
          </div>
        </section>

        <section className="card">
          <div className="card-header">Least Sellers</div>
          <div className="card-body stack">
            {least.map((r,i)=>(
              <div key={i} className="list-row">
                <div>{r.name}</div>
                <div className="muted">Qty {r.qty}</div>
                <div className="right mono">₹{r.revenue?.toFixed?.(2)}</div>
              </div>
            ))}
            {!least.length && <div className="muted">No data</div>}
          </div>
        </section>
      </div>
    </div>
  )
}
