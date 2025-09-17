import { create } from 'zustand'

export const useCart = create((set, get) => ({
  lines: [],
  add(item) {
    const lines = [...get().lines]
    const idx = lines.findIndex(l => l.itemId === item._id)
    if (idx >= 0) lines[idx].qty += 1
    else lines.push({ itemId: item._id, name: item.name, sku: item.sku, taxSlab: item.taxSlab, unitPrice: item.price, qty: 1 })
    set({ lines })
  },
  inc(i){ const lines = [...get().lines]; lines[i].qty++; set({ lines }) },
  dec(i){ const lines = [...get().lines]; lines[i].qty = Math.max(1, lines[i].qty-1); set({ lines }) },
  remove(i){ const lines = [...get().lines]; lines.splice(i,1); set({ lines }) },
  clear(){ set({ lines: [] }) },
  totals(){
    let subtotal = 0, tax5 = 0, total = 0;
    for (const l of get().lines){
      const lineSubtotal = l.qty * l.unitPrice;
      const tax = l.taxSlab === 5 ? lineSubtotal * 0.05 : 0;
      subtotal += lineSubtotal; tax5 += tax; total += lineSubtotal + tax;
    }
    return { subtotal: +subtotal.toFixed(2), tax5: +tax5.toFixed(2), total: +total.toFixed(2) }
  }
}))
