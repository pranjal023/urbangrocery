import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Inventory(){
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ sku:'', name:'', price:0, taxSlab:0, stockQty:0, reorderLevel:0 })
  const [lowOnly, setLowOnly] = useState(false)
  const [restock, setRestock] = useState({}) // { [itemId]: qtyToAdd }

  async function load(){
    const { data } = await api.get('/api/items', { params: { lowStock: lowOnly ? '1' : undefined } })
    setItems(data)
  }
  useEffect(()=>{ load() },[lowOnly])

  async function create(){
    if(!form.sku || !form.name) return alert('SKU and Name are required')
    await api.post('/api/items', form)
    setForm({ sku:'', name:'', price:0, taxSlab:0, stockQty:0, reorderLevel:0 })
    await load()
  }

  async function doRestock(id){
    const qty = Number(restock[id] || 0)
    if (!qty || qty <= 0) return alert('Enter a positive qty')
    await api.post(`/api/items/${id}/restock`, { qty })
    setRestock({...restock, [id]: ''})
    await load()
  }

  return (
    <div className="grid-2 stack-lg">
      <section className="card">
        <div className="card-header">Items</div>
        <div className="card-body stack">
          <label className="badge">
            <input type="checkbox" checked={lowOnly} onChange={e=>setLowOnly(e.target.checked)} />
            Low stock only
          </label>
          <table className="table">
            <thead>
              <tr>
                <th>Name (SKU)</th>
                <th>Price</th>
                <th>GST</th>
                <th>Stock</th>
                <th>Reorder</th>
                <th className="right">Restock</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i._id}>
                  <td>{i.name} <span className="muted">({i.sku})</span></td>
                  <td>₹{i.price}</td>
                  <td>{i.taxSlab}%</td>
                  <td>{i.stockQty}</td>
                  <td>{i.reorderLevel}</td>
                  <td className="right">
                    <div style={{display:'inline-flex', gap:8, alignItems:'center'}}>
                      <input
                        className="input"
                        style={{width:100}}
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={restock[i._id] ?? ''}
                        onChange={e=>setRestock({...restock, [i._id]: e.target.value})}
                      />
                      <button className="btn" onClick={()=>doRestock(i._id)}>Add</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">Add Item</div>
        <div className="card-body stack">
          <label>SKU
            <input className="input" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} />
          </label>
          <label>Name
            <input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          </label>
          <label>Price
            <input className="input" type="number" value={form.price} onChange={e=>setForm({...form, price:+e.target.value})} />
          </label>
          <label>GST
            <select className="select" value={form.taxSlab} onChange={e=>setForm({...form, taxSlab:+e.target.value})}>
              <option value={0}>0%</option>
              <option value={5}>5%</option>
            </select>
          </label>
          <label>Stock
            <input className="input" type="number" value={form.stockQty} onChange={e=>setForm({...form, stockQty:+e.target.value})} />
          </label>
          <label>Reorder level
            <input className="input" type="number" value={form.reorderLevel} onChange={e=>setForm({...form, reorderLevel:+e.target.value})} />
          </label>
          <div className="toolbar">
            <button className="btn btn-primary" onClick={create}>Create</button>
          </div>
        </div>
      </section>
    </div>
  )
}
