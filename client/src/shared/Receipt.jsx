import React, { useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

export default function Receipt({ sale, qrDataUrl, onPrinted }) {
  const ref = useRef()
  const fallbackTimer = useRef(null)

  const print = useReactToPrint({
    content: () => ref.current,
    copyStyles: true,
    pageStyle: '@page { size: auto; margin: 10mm }',
    onAfterPrint: () => {
      // Browser signaled printing is done (or canceled)
      if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null }
      onPrinted?.('afterprint')
    },
    onPrintError: (err) => {
      if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null }
      // Treat as success flow anyway (you can change to error toast if you prefer)
      onPrinted?.('error', err)
    }
  })

  useEffect(() => () => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current)
  }, [])

  if (!sale) return null // only render if we have a sale

  function handleClickPrint() {
    // Fallback: if onAfterPrint never fires (some browsers), proceed in 5s
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current)
    fallbackTimer.current = setTimeout(() => {
      fallbackTimer.current = null
      onPrinted?.('fallback')
    }, 5000)

    try { print() } catch (e) {
      if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null }
      onPrinted?.('error', e)
    }
  }

  const store = import.meta.env.VITE_STORE_NAME || 'UrbanGrocery'
  const logo = import.meta.env.VITE_STORE_LOGO || '' // URL or data URL

  return (
    <div className="stack">
      <div ref={ref} className="receipt card" style={{color:'#111', background:'#fff'}}>
        <div style={{display:'grid', placeItems:'center', gap:6, marginBottom:6}}>
          {logo ? <img src={logo} alt="logo" style={{ width: 80 }} /> : <div className="logo-circle" />}
          <h3 style={{margin:0, color:'#111'}}>{store}</h3>
        </div>
        <div style={{fontSize:12, color:'#333'}}>Bill No: {sale.billNo}</div>
        <div style={{fontSize:12, color:'#333'}}>Date: {new Date(sale.soldAt).toLocaleString()}</div>
        <hr/>
        {sale.items.map((l, i)=>(
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:6, fontSize:14 }}>
            <div>{l.name} x{l.qty}</div>
            <div>₹{l.lineTotal.toFixed(2)}</div>
          </div>
        ))}
        <hr/>
        <div style={{fontSize:14}}>Subtotal: ₹{sale.subtotal.toFixed(2)}</div>
        {'cgst2_5' in sale.taxBreakup && <div style={{fontSize:14}}>CGST 2.5%: ₹{(sale.taxBreakup.cgst2_5||0).toFixed(2)}</div>}
        {'sgst2_5' in sale.taxBreakup && <div style={{fontSize:14}}>SGST 2.5%: ₹{(sale.taxBreakup.sgst2_5||0).toFixed(2)}</div>}
        {'igst5' in sale.taxBreakup && sale.taxBreakup.igst5>0 && <div style={{fontSize:14}}>IGST 5%: ₹{(sale.taxBreakup.igst5||0).toFixed(2)}</div>}
        <div style={{fontWeight:700, fontSize:16}}>Total: ₹{sale.total.toFixed(2)}</div>
        {qrDataUrl && (
          <div style={{ marginTop: 8, textAlign:'center' }}>
            <img src={qrDataUrl} alt="UPI QR" style={{ width: 160, height: 160 }} />
            <div style={{ fontSize: 12, color:'#333' }}>Scan to pay via UPI</div>
          </div>
        )}
      </div>
      <button className="btn no-print" onClick={handleClickPrint}>Print Receipt</button>
    </div>
  )
}
