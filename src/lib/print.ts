import { formatCurrency } from './utils'
import { PAYMENT_LABELS, ORDER_STATUS_LABELS } from '@/types'

export function printOrder(order: any) {
  const items: string = order.order_items
    ?.map((item: any) => {
      const opts = item.order_item_options
        ?.map((o: any) => `  &nbsp;&nbsp;&#8627; ${o.option_item_name}${o.price_add > 0 ? ` (+${formatCurrency(o.price_add)})` : ''}`)
        .join('<br>') ?? ''
      const notes = item.item_notes ? `  &nbsp;&nbsp;<i>"${item.item_notes}"</i>` : ''
      return `
        <tr>
          <td>${item.quantity}x ${item.product_name}</td>
          <td style="text-align:right">${formatCurrency(item.subtotal)}</td>
        </tr>
        ${opts ? `<tr><td colspan="2" style="font-size:11px;color:#555">${opts}</td></tr>` : ''}
        ${notes ? `<tr><td colspan="2" style="font-size:11px;color:#555">${notes}</td></tr>` : ''}
      `
    })
    .join('') ?? ''

  const addr = order.addresses
  const addrBlock = addr
    ? `${addr.street}, ${addr.number}${addr.complement ? ` — ${addr.complement}` : ''}<br>${addr.neighborhood}${addr.city ? ` — ${addr.city}` : ''}${addr.zip_code ? `<br>CEP: ${addr.zip_code}` : ''}`
    : 'Retirada no local'

  const payLabel = (PAYMENT_LABELS as Record<string, string>)[order.payment_method] ?? order.payment_method
  const statusLabel = (ORDER_STATUS_LABELS as Record<string, string>)[order.status] ?? order.status
  const date = new Date(order.created_at).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Pedido #${order.order_number}</title>
<style>
  @page {
    size: 80mm auto;
    margin: 4mm 4mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    color: #000;
    width: 72mm;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .big { font-size: 16px; font-weight: bold; }
  .sm { font-size: 11px; }
  .sep { border-top: 1px dashed #000; margin: 5px 0; }
  .sep-solid { border-top: 1px solid #000; margin: 5px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  .totals td { padding: 1px 0; }
  .total-line { font-weight: bold; font-size: 15px; }
  .label { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; margin: 6px 0 2px; font-weight: bold; }
  .section { margin: 4px 0; }
  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div class="center">
  <div class="big">🍣 MASSASHIN</div>
  <div class="sm">Av. Marcelino Pires, 3600</div>
  <div class="sm">Shopping Avenida Center · Dourados-MS</div>
</div>

<div class="sep-solid"></div>

<div class="center bold" style="font-size:18px">PEDIDO #${order.order_number}</div>
<div class="center sm">${date}</div>
<div class="center sm">Status: ${statusLabel}</div>

<div class="sep-solid"></div>

<div class="label">Itens</div>
<table>${items}</table>

<div class="sep"></div>

<table class="totals">
  <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(order.subtotal)}</td></tr>
  <tr><td>Entrega</td><td style="text-align:right">${formatCurrency(order.delivery_fee)}</td></tr>
</table>

<div class="sep-solid"></div>

<table>
  <tr class="total-line">
    <td>TOTAL</td>
    <td style="text-align:right">${formatCurrency(order.total)}</td>
  </tr>
</table>

<div class="sep-solid"></div>

<div class="label">Pagamento</div>
<div>${payLabel}</div>

<div class="sep"></div>

<div class="label">Endereço de entrega</div>
<div class="sm">${addrBlock}</div>

${order.customer_notes ? `
<div class="sep"></div>
<div class="label">Observações</div>
<div class="sm">${order.customer_notes}</div>
` : ''}

<div class="sep-solid"></div>
<div class="center sm" style="margin-top:4px">Obrigado pela preferência!</div>
<div class="center sm">massashin.vercel.app</div>

<script>window.onload = function(){ window.print(); setTimeout(function(){ window.close(); }, 1000); }</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=400,height=600')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

export function printCashReport({ tab, tabLabel, current, byPayment, totalVendas, totalPedidos, ticketMedio, totalEntrega, totalProdutos }: {
  tab: 'day' | 'month' | 'year'
  tabLabel: string
  current: any[]
  byPayment: Record<string, { total: number; count: number }>
  totalVendas: number
  totalPedidos: number
  ticketMedio: number
  totalEntrega: number
  totalProdutos: number
}) {
  const now = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const periodLabel = tab === 'day' ? 'Fechamento do Dia' : tab === 'month' ? 'Relatório Mensal' : 'Relatório Anual'

  const paymentRows = Object.entries(byPayment).map(([method, data]) => {
    const label = (PAYMENT_LABELS as Record<string, string>)[method] ?? method
    const pct = totalVendas > 0 ? ((data.total / totalVendas) * 100).toFixed(1) : '0.0'
    return `<tr>
      <td>${label}</td>
      <td style="text-align:center">${data.count}</td>
      <td style="text-align:right">${formatCurrency(data.total)}</td>
      <td style="text-align:right">${pct}%</td>
    </tr>`
  }).join('')

  const orderRows = current.slice(0, 50).map(o => `<tr>
    <td>#${o.order_number}</td>
    <td>${new Date(o.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
    <td>${(PAYMENT_LABELS as Record<string, string>)[o.payment_method] ?? o.payment_method}</td>
    <td style="text-align:right">${formatCurrency(o.total)}</td>
  </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Caixa — ${tabLabel}</title>
<style>
  @page { size: A4; margin: 15mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
  h1 { font-size: 20px; color: #c8102e; }
  h2 { font-size: 13px; margin: 16px 0 6px; color: #444; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  .header { border-bottom: 2px solid #c8102e; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header-left p { color: #666; font-size: 11px; margin-top: 2px; }
  .header-right { text-align: right; font-size: 11px; color: #666; }
  .kpis { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
  .kpi { background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 6px; padding: 10px; }
  .kpi .label { font-size: 10px; color: #888; text-transform: uppercase; }
  .kpi .value { font-size: 16px; font-weight: bold; color: #c8102e; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  th { background: #f3f3f3; text-align: left; padding: 6px 8px; font-size: 10px; color: #666; text-transform: uppercase; }
  td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px; }
  tfoot td { background: #fff0f0; font-weight: bold; color: #c8102e; border-top: 2px solid #c8102e; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>🍣 MASSASHIN</h1>
    <p>Av. Marcelino Pires, 3600 · Shopping Avenida Center · Dourados-MS</p>
    <p style="font-size:14px;font-weight:bold;color:#111;margin-top:6px">${periodLabel} — ${tabLabel}</p>
  </div>
  <div class="header-right">
    <p>Emitido em: ${now}</p>
    <p>massashin.vercel.app</p>
  </div>
</div>

<div class="kpis">
  <div class="kpi"><div class="label">Total Vendido</div><div class="value">${formatCurrency(totalVendas)}</div></div>
  <div class="kpi"><div class="label">Nº Pedidos</div><div class="value">${totalPedidos}</div></div>
  <div class="kpi"><div class="label">Ticket Médio</div><div class="value">${formatCurrency(ticketMedio)}</div></div>
  <div class="kpi"><div class="label">Tx. Entrega</div><div class="value">${formatCurrency(totalEntrega)}</div></div>
</div>

<h2>Formas de pagamento</h2>
<table>
  <thead><tr><th>Forma</th><th style="text-align:center">Pedidos</th><th style="text-align:right">Total</th><th style="text-align:right">%</th></tr></thead>
  <tbody>${paymentRows}</tbody>
  <tfoot>
    <tr>
      <td>TOTAL GERAL</td>
      <td style="text-align:center">${totalPedidos}</td>
      <td style="text-align:right">${formatCurrency(totalVendas)}</td>
      <td style="text-align:right">100%</td>
    </tr>
  </tfoot>
</table>

<h2>Pedidos do período${current.length > 50 ? ' (primeiros 50)' : ''}</h2>
<table>
  <thead><tr><th>#</th><th>Data/Hora</th><th>Pagamento</th><th style="text-align:right">Valor</th></tr></thead>
  <tbody>${orderRows}</tbody>
</table>

<div class="footer">
  <p>Relatório gerado automaticamente pelo sistema Massashin · Plataforma desenvolvida por Hive Marketing Digital</p>
  <p>Pedidos cancelados não são incluídos neste relatório.</p>
</div>

<script>window.onload = function(){ window.print(); setTimeout(function(){ window.close(); }, 1500); }</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
