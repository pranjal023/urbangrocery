import React, { useEffect, useState } from 'react'
import api from '../api'
import { useCart } from '../store/cart'
import Receipt from '../shared/Receipt.jsx'

export default function POS(){
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [err, setErr] = useState('')
  const { lines, add, inc, dec, remove, clear, totals } = useCart()
  const [sale, setSale] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [toast, setToast] = useState('')
  const [lowStock, setLowStock] = useState([]);


  async function search(){
    try {
      setErr('')
      const { data } = await api.get('/api/items', { params: { search: query || undefined } })
      setItems(data)
    } catch (e) {
      setErr('Failed to load items: ' + (e.response?.data?.error || e.message))
      setItems([])
    }
  }
  useEffect(()=>{ search() },[])

  const t = totals()

  async function checkout(){

    
    if (!lines.length) {
      setToast('Add items to cart first')
      setTimeout(()=>setToast(''), 1800)
      return
    }
    try {
      const payload = {
        items: lines.map(l => ({ itemId: l.itemId, qty: l.qty, unitPrice: l.unitPrice })),
        payment: { mode: 'upi' }
      }
      const { data } = await api.post('/api/sales', payload)  // inventory updates in DB here
      setSale(data)  
      setLowStock(data.lowStock || []);     // show receipt
      clear()             // empty cart

      // Build UPI QR for this bill
      const store = 'UrbanGrocery'
      const vpa = 'urbangrocery@upi'
      const payloadStr = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(store)}&am=${encodeURIComponent(data.total)}&cu=INR&tn=${encodeURIComponent('Bill ' + data.billNo)}`
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(payloadStr)
      setQrDataUrl(url)
    } catch (e) {
      setErr('Checkout failed: ' + (e.response?.data?.error || e.message))
    }
  }

  function handlePrinted(origin){
    // origin = 'afterprint' | 'fallback' | 'error'
    setToast('Payment success. Ready for next bill.')
    setSale(null)     // hide preview for next customer
    setQrDataUrl('')
    search()          // refresh product list (stock changed)
    window.dispatchEvent(new CustomEvent('refresh-daily-total'))
    setTimeout(()=> setToast(''), 2500)
  }

  

  return (
    <div className="grid-2 responsive stack-lg">
      <section className="card">
        <div className="card-header">Products</div>
        <div className="card-body stack">
          <div className="search-bar">
            <input className="input" placeholder="Search item name / scan barcode" value={query} onChange={e=>setQuery(e.target.value)} />
            <button className="btn" onClick={search}>Search</button>
          </div>
          {err && <div className="badge" style={{borderColor:'var(--danger)', color:'#ffaaaa'}}>{err}</div>}
          <div className="items-list stack">
            {items.map(it => (
              <div key={it._id} className="row">
                <div>
                  <div>{it.name}</div>
                  <div className="muted">₹{it.price} • GST {it.taxSlab}%</div>
                </div>
                <button className="btn btn-primary" onClick={()=>add(it)}>Add</button>
              </div>
            ))}
            {!items.length && !err && <div className="muted">No items found.</div>}
          </div>
        </div>
      </section>

      <aside className="card">
        <div className="card-header">Cart</div>
        <div className="card-body stack">
          <div className="cart-table stack">
            {lines.map((l,i)=>(
              <div key={i} className="row">
                <div>{l.name}</div>
                <div>₹{l.unitPrice}</div>
                <div>GST {l.taxSlab}%</div>
                <div className="badge">
                  <button className="btn btn-ghost" onClick={()=>dec(i)}>-</button>
                  <span className="mono">{l.qty}</span>
                  <button className="btn btn-ghost" onClick={()=>inc(i)}>+</button>
                </div>
                <button className="btn btn-danger" onClick={()=>remove(i)}>Remove</button>
              </div>
            ))}
            {!lines.length && <div className="muted">Cart is empty</div>}
          </div>

          <div className="total-box">
            <div>Subtotal: <span className="right mono">₹{t.subtotal}</span></div>
            <div>GST 5%: <span className="right mono">₹{t.tax5}</span></div>
            <div style={{fontWeight:700}}>Total: <span className="right mono">₹{t.total}</span></div>
          </div>

          <div className="toolbar">
            <button className="btn btn-primary" disabled={!lines.length} onClick={checkout}>Checkout</button>
            <button className="btn" onClick={()=>clear()}>Clear</button>
          </div>

          {sale && (
            <div className="card">
              <div className="card-header">Receipt Preview</div>
              <div className="card-body">
                <Receipt sale={sale} qrDataUrl={qrDataUrl} onPrinted={handlePrinted} />
              </div>
            </div>
          )}
        </div>
      </aside>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
