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
