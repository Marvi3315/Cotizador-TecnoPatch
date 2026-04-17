// lib/pdf.js - PDF profesional TecnoPatch (portado del cotizador fixed)
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatMXN, formatUSD, toUSD } from './fx'

const EMPRESA = {
  nombre: 'TecnoPatch',
  slogan: 'TELECOMUNICACIONES · GUADALAJARA, JAL.',
  telefono: '33 2849-6052  |  322 518-7656',
  email: 'serviciotecnopatch@gmail.com',
  direccion: 'Guadalajara, Jalisco, México',
}

export const formatDate = (d = new Date()) =>
  format(new Date(d), "d 'de' MMMM 'de' yyyy", { locale: es })

export const formatDateShort = (d = new Date()) =>
  format(new Date(d), 'dd/MM/yyyy', { locale: es })

export function calcularTotales(items, descuentoPct = 0, incluirIVA = true) {
  const subtotalBruto = items.reduce((s, i) => s + (i.precio * i.cantidad), 0)
  const descuentoAmt  = subtotalBruto * (descuentoPct / 100)
  const subtotal      = subtotalBruto - descuentoAmt
  const ivaAmt        = incluirIVA ? subtotal * 0.16 : 0
  const total         = subtotal + ivaAmt
  const costoTotal    = items.reduce((s, i) => s + ((i.costo || 0) * i.cantidad), 0)
  const ganancia      = subtotal - costoTotal
  const margen        = costoTotal > 0 ? ((ganancia / costoTotal) * 100).toFixed(1) : null
  return { subtotalBruto, descuentoAmt, subtotal, ivaAmt, total, costoTotal, ganancia, margen }
}

/** PDF cliente (azul oscuro profesional — formato del cotizador fixed) */
export async function generarPDFCliente(cotizacion, fxRate = 17.5, currency = 'MXN') {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const W = 215.9, margin = 18, PAGE_H = 279, FOOTER_H = 10

  const items = cotizacion.items || []
  const descPct = cotizacion.descuento || 0
  const totales = calcularTotales(items, descPct, cotizacion.incluye_iva !== false)

  const fmtAmt = (mxn) => currency === 'USD'
    ? 'USD ' + formatUSD(toUSD(mxn, fxRate)).replace('US$','').replace('USD','').trim()
    : '$' + mxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })

  const dateStr = formatDate(cotizacion.created_at || new Date())
  const qNum = cotizacion.folio || 'TP-000000'
  const SAFE_BOTTOM = PAGE_H - FOOTER_H - 3
  const BLOQUE_FINAL = (descPct > 0 ? 38 : 32) + 6 + 44 + FOOTER_H + 6

  const drawHeader = () => {
    doc.setFillColor(10, 22, 50); doc.rect(0, 0, W, 55, 'F')
    doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold')
    doc.text(EMPRESA.nombre, margin + 2, 20)
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(0,212,255)
    doc.text(EMPRESA.slogan, margin + 2, 27)
    doc.setTextColor(160,185,220); doc.setFontSize(7)
    doc.text(EMPRESA.telefono + '  |  ' + EMPRESA.email, margin + 2, 33)
    doc.setFontSize(6.5); doc.text(EMPRESA.direccion, margin + 2, 39)
    doc.setTextColor(0,212,255); doc.setFontSize(10); doc.setFont('helvetica','bold')
    doc.text(qNum, W - margin, 20, { align:'right' })
    doc.setTextColor(160,185,220); doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.text(dateStr, W - margin, 28, { align:'right' })
    doc.setFontSize(7); doc.setTextColor(100,140,180)
    doc.text('Vigencia: 15 días naturales', W - margin, 35, { align:'right' })
    if (currency === 'USD') {
      doc.setTextColor(255,200,100); doc.setFontSize(7)
      doc.text(`Tipo de cambio: $${fxRate.toFixed(2)} MXN/USD`, W - margin, 42, { align:'right' })
    }
    doc.setDrawColor(26,106,255); doc.setLineWidth(0.8); doc.line(0, 55, W, 55)
  }

  const drawFooter = (pageNum, totalPages) => {
    doc.setFillColor(10,22,50); doc.rect(0, PAGE_H - FOOTER_H, W, FOOTER_H, 'F')
    doc.setDrawColor(26,106,255); doc.setLineWidth(0.3)
    doc.line(0, PAGE_H - FOOTER_H, W, PAGE_H - FOOTER_H)
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(100,140,180)
    doc.text('TecnoPatch  ·  Guadalajara, Jalisco  |  Documento confidencial', margin, PAGE_H - 3)
    doc.text('Pág. ' + pageNum + '/' + totalPages, W - margin, PAGE_H - 3, { align:'right' })
  }

  const cX = { num: margin+4, desc: margin+14, pu: W-margin-52, cant: W-margin-32, imp: W-margin-14 }
  const drawTableHeader = (yy) => {
    doc.setFillColor(13,79,214); doc.rect(margin, yy, W-margin*2, 8, 'F')
    doc.setTextColor(255,255,255); doc.setFontSize(7); doc.setFont('helvetica','bold')
    doc.text('#', cX.num, yy+5.5)
    doc.text('DESCRIPCIÓN / MODELO', cX.desc, yy+5.5)
    doc.text(`P.UNIT (${currency})`, cX.pu, yy+5.5)
    doc.text('CANT', cX.cant, yy+5.5)
    doc.text(`IMPORTE (${currency})`, cX.imp, yy+5.5)
    return yy + 8
  }

  drawHeader()
  let y = 65
  const cW = W - margin * 2

  // Bloque cliente
  doc.setFillColor(17,29,53); doc.roundedRect(margin, y, cW, 38, 3, 3, 'F')
  doc.setTextColor(0,212,255); doc.setFontSize(7); doc.setFont('helvetica','bold')
  doc.text('DATOS DEL CLIENTE', margin+6, y+7)
  const col1x=margin+6, col2x=margin+cW*0.47, col3x=margin+cW*0.67
  doc.setTextColor(40,80,160); doc.setFontSize(6.5); doc.setFont('helvetica','normal')
  doc.text('EMPRESA / CLIENTE', col1x, y+13)
  doc.text('RFC', col2x, y+13)
  doc.text('CONTACTO', col3x, y+13)
  doc.setTextColor(220,235,255); doc.setFontSize(8.5); doc.setFont('helvetica','bold')
  doc.text((cotizacion.cliente_nombre||'-').substring(0,28), col1x, y+20)
  doc.setFont('helvetica','normal')
  doc.text((cotizacion.cliente_rfc||'-').substring(0,14), col2x, y+20)
  doc.text((cotizacion.cliente_contacto||cotizacion.cliente_telefono||'-').substring(0,24), col3x, y+20)
  doc.setDrawColor(30,50,90); doc.setLineWidth(0.2)
  doc.line(margin+4, y+24, margin+cW-4, y+24)
  doc.setTextColor(40,80,160); doc.setFontSize(6.5); doc.setFont('helvetica','normal')
  doc.text('PROYECTO / REFERENCIA', col1x, y+29)
  doc.setTextColor(200,220,255); doc.setFontSize(8); doc.setFont('helvetica','bold')
  const proyLines = doc.splitTextToSize(cotizacion.titulo||'Sin referencia', cW-12)
  doc.text(proyLines[0], col1x, y+35)
  y += 46

  y = drawTableHeader(y)
  let rowAlt=false, rowNum=1
  const descMaxW = cX.pu - cX.desc - 4
  const ROW_H = 11

  items.forEach((item, idx) => {
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5)
    const nomLines = doc.splitTextToSize(item.nombre||item.descripcion||'', descMaxW)
    const lineCount = Math.min(nomLines.length, 2)
    const hasNota = item.nota && item.nota.trim()
    const dynamicH = lineCount > 1 ? (hasNota ? 18 : 14) : (hasNota ? 15 : ROW_H)
    const isLast = idx === items.length - 1
    const spaceNeeded = isLast ? dynamicH + BLOQUE_FINAL : dynamicH

    if (y + spaceNeeded > SAFE_BOTTOM) {
      doc.addPage(); drawHeader(); y = 63; y = drawTableHeader(y); rowAlt = false
    }

    doc.setFillColor(rowAlt ? 235 : 255, rowAlt ? 241 : 255, rowAlt ? 255 : 255)
    doc.rect(margin, y, W-margin*2, dynamicH, 'F')
    doc.setTextColor(13,79,214); doc.setFont('helvetica','bold'); doc.setFontSize(7.5)
    doc.text(String(rowNum), cX.num, y+dynamicH/2+1)
    doc.setTextColor(15,30,70); doc.setFont('helvetica','bold'); doc.setFontSize(7.5)
    doc.text(nomLines.slice(0,2), cX.desc, y+4.5)
    const skuStr = item.sku && !item.sku.startsWith('MAN-') ? item.sku : ''
    const marcaStr = item.marca ? item.marca + ' · ' : ''
    doc.setFont('helvetica','normal'); doc.setTextColor(80,110,160); doc.setFontSize(6)
    doc.text((skuStr ? marcaStr + skuStr : item.cat||'').substring(0,52), cX.desc, y+dynamicH-2.5)
    if (hasNota) {
      doc.setFont('helvetica','italic'); doc.setTextColor(180,130,40); doc.setFontSize(5.5)
      doc.text('📝 ' + item.nota.substring(0,60), cX.desc, y+dynamicH+1.5)
    }
    doc.setTextColor(20,40,90); doc.setFontSize(7); doc.setFont('helvetica','normal')
    doc.text(fmtAmt(item.precio), cX.pu, y+dynamicH/2+1)
    doc.setTextColor(13,79,214); doc.setFont('helvetica','bold'); doc.setFontSize(8)
    doc.text(String(item.cantidad), cX.cant+6, y+dynamicH/2+1, { align:'right' })
    doc.setTextColor(0,100,55); doc.setFont('helvetica','bold'); doc.setFontSize(7)
    doc.text(fmtAmt(item.precio*item.cantidad), W-margin-2, y+dynamicH/2+1, { align:'right' })
    doc.setDrawColor(205,218,240); doc.setLineWidth(0.15)
    doc.line(margin, y+dynamicH, W-margin, y+dynamicH)
    y += dynamicH; rowAlt = !rowAlt; rowNum++
  })

  y += 5

  // Totales
  const boxX = W - margin - 82
  const TOTALES_H = descPct > 0 ? 38 : 32
  doc.setFillColor(10,22,50); doc.rect(boxX, y, 82, TOTALES_H, 'F')
  doc.setDrawColor(26,106,255); doc.setLineWidth(0.5); doc.rect(boxX, y, 82, TOTALES_H)
  const tw = (label, val, ly, bold, accent) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 9 : 8)
    doc.setTextColor(accent?0:160, accent?212:185, accent?255:220)
    doc.text(label, boxX+5, ly)
    doc.setTextColor(accent?0:200, accent?229:220, accent?160:255)
    doc.text(val, boxX+77, ly, { align:'right' })
  }
  if (descPct > 0) {
    tw('Subtotal:', fmtAmt(totales.subtotalBruto), y+8, false, false)
    doc.setTextColor(255,112,112); doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.text(`Descuento (${descPct}%):`, boxX+5, y+16)
    doc.text('-'+fmtAmt(totales.descuentoAmt), boxX+77, y+16, { align:'right' })
    tw('IVA (16%):', fmtAmt(totales.ivaAmt), y+24, false, false)
    doc.setFillColor(26,106,255); doc.rect(boxX, y+27, 82, 0.5, 'F')
    tw(`TOTAL ${currency}:`, fmtAmt(totales.total), y+35, true, true)
  } else {
    tw('Subtotal:', fmtAmt(totales.subtotalBruto), y+9, false, false)
    tw('IVA (16%):', fmtAmt(totales.ivaAmt), y+18, false, false)
    doc.setFillColor(26,106,255); doc.rect(boxX, y+21, 82, 0.5, 'F')
    tw(`TOTAL ${currency}:`, fmtAmt(totales.total), y+29, true, true)
  }

  // Anticipo 60%
  y += TOTALES_H + 6
  const anticipo = Math.round(totales.total * 0.60 * 100) / 100
  const restante = Math.round(totales.total * 0.40 * 100) / 100
  const finalNotes = cotizacion.notas?.trim() || [
    '• Precios en ' + currency + '. IVA (16%) desglosado en este documento.',
    '• Vigencia de cotización: 15 días naturales a partir de la fecha de emisión.',
    '• Tiempo de entrega sujeto a disponibilidad de equipos.',
    '• Forma de pago: 50% anticipo para iniciar, 50% contra entrega y pruebas.',
    '• Garantía de instalación: 6 meses. Equipos: garantía del fabricante.',
    '• No incluye obra civil (demolición, resane, pintura o albañilería).',
  ].join('\n')

  doc.setFontSize(6.2); doc.setFont('helvetica','normal')
  const notesLines = doc.splitTextToSize(finalNotes, W-margin*2-12)
  const lineH = 2.55
  const notesH = notesLines.length * lineH + 17

  if (y + notesH > SAFE_BOTTOM) { doc.addPage(); drawHeader(); y = 63 }

  doc.setFillColor(17,29,53); doc.roundedRect(margin, y, cW, notesH, 3, 3, 'F')
  doc.setDrawColor(26,106,255); doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, cW, notesH, 3, 3, 'S')
  doc.setFillColor(0,60,100); doc.roundedRect(margin, y, cW-88, 14, 2, 2, 'F')
  doc.setTextColor(0,212,255); doc.setFontSize(6.5); doc.setFont('helvetica','bold')
  doc.text('ANTICIPO 60%:', margin+4, y+5.5)
  doc.setTextColor(255,255,255); doc.setFont('helvetica','normal')
  doc.text(fmtAmt(anticipo), margin+38, y+5.5)
  doc.setTextColor(100,160,200); doc.setFontSize(6)
  doc.text('Saldo al concluir: ' + fmtAmt(restante), margin+4, y+11)
  y += 18
  doc.setTextColor(0,212,255); doc.setFontSize(7); doc.setFont('helvetica','bold')
  doc.text('NOTAS Y CONDICIONES', margin+5, y+6)
  doc.setTextColor(180,200,230); doc.setFont('helvetica','normal'); doc.setFontSize(6.2)
  doc.text(notesLines, margin+5, y+13)

  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) { doc.setPage(p); drawFooter(p, totalPages) }

  doc.save(`${qNum}_${(cotizacion.cliente_nombre||'Cliente').replace(/\s+/g,'_').substring(0,20)}.pdf`)
}

/** PDF interno con costos y utilidades */
export async function generarPDFInterno(cotizacion, fxRate = 17.5) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
  const W=279.4, margin=12, PAGE_H=215.9, FOOTER_H=8, SAFE_BOTTOM=PAGE_H-FOOTER_H-4
  const items = cotizacion.items || []
  const totales = calcularTotales(items, cotizacion.descuento||0, cotizacion.incluye_iva!==false)
  const qNum = cotizacion.folio || 'TP-000000'
  const client = cotizacion.cliente_nombre || 'Cliente'
  const project = cotizacion.titulo || ''
  const dateStr = formatDate(cotizacion.created_at || new Date())

  doc.setFillColor(12,30,12); doc.rect(0, 0, W, 16, 'F')
  doc.setTextColor(0,229,160); doc.setFontSize(10); doc.setFont('helvetica','bold')
  doc.text('DOCUMENTO INTERNO — CONFIDENCIAL — TECNOPATCH', margin, 10)
  doc.setTextColor(80,160,80); doc.setFontSize(7.5); doc.setFont('helvetica','normal')
  doc.text(qNum+'  ·  '+client+(project?'  ·  '+project:'')+'  ·  '+dateStr, W-margin, 10, { align:'right' })

  const C = {
    num:margin, name:margin+8, cat:margin+90, prov:margin+118,
    costoU:margin+140, precioU:margin+163, cant:margin+186,
    utilU:margin+198, impV:W-margin-18, impC:W-margin
  }
  const drawIntHeader = (yy) => {
    doc.setFillColor(15,55,15); doc.rect(margin, yy, W-margin*2, 7, 'F')
    doc.setTextColor(0,229,160); doc.setFontSize(6); doc.setFont('helvetica','bold')
    doc.text('#',C.num,yy+5); doc.text('PRODUCTO',C.name,yy+5); doc.text('CAT',C.cat,yy+5)
    doc.text('PROV',C.prov,yy+5); doc.text('COSTO/U',C.costoU,yy+5)
    doc.text('P.CLIENTE',C.precioU,yy+5)
    doc.text('CANT',C.cant+3,yy+5,{align:'right'})
    doc.text('UTIL/U',C.utilU,yy+5)
    doc.text('IMP.VENTA',C.impV,yy+5,{align:'right'})
    doc.text('IMP.COSTO',C.impC,yy+5,{align:'right'})
    return yy+7
  }

  let y=20, costoTotal=0, ventaTotal=0, rowNum=1, rowAlt=false
  y = drawIntHeader(y)
  items.forEach((item, idx) => {
    const costo = item.costo || 0
    const venta = item.precio || 0
    const qty   = item.cantidad || 1
    const util  = (venta - costo) * qty
    costoTotal += costo * qty; ventaTotal += venta * qty
    const rowH=10
    if (y+rowH > SAFE_BOTTOM) {
      doc.addPage(); y=10; y=drawIntHeader(y); rowAlt=false
    }
    doc.setFillColor(rowAlt?15:12, rowAlt?50:30, rowAlt?15:12)
    doc.rect(margin, y, W-margin*2, rowH, 'F')
    doc.setFontSize(6); doc.setFont('helvetica','normal')
    doc.setTextColor(0,229,160); doc.text(String(rowNum),C.num,y+7)
    doc.setTextColor(200,240,200); doc.setFont('helvetica','bold')
    doc.text((item.nombre||'').substring(0,40),C.name,y+7)
    doc.setFont('helvetica','normal'); doc.setTextColor(100,180,100)
    doc.text((item.cat||'').substring(0,14),C.cat,y+7)
    doc.text((item.proveedor||'Syscom').substring(0,10),C.prov,y+7)
    doc.setTextColor(255,180,60)
    doc.text('$'+costo.toLocaleString('es-MX',{minimumFractionDigits:2}),C.costoU,y+7)
    doc.setTextColor(180,230,180)
    doc.text('$'+venta.toLocaleString('es-MX',{minimumFractionDigits:2}),C.precioU,y+7)
    doc.text(String(qty),C.cant+3,y+7,{align:'right'})
    doc.setTextColor(util>=0?0:255,util>=0?229:80,util>=0?160:60)
    doc.text('$'+util.toLocaleString('es-MX',{minimumFractionDigits:2}),C.utilU,y+7)
    doc.setTextColor(180,230,180)
    doc.text('$'+(venta*qty).toLocaleString('es-MX',{minimumFractionDigits:2}),C.impV,y+7,{align:'right'})
    doc.setTextColor(255,180,60)
    doc.text('$'+(costo*qty).toLocaleString('es-MX',{minimumFractionDigits:2}),C.impC,y+7,{align:'right'})
    y+=rowH; rowAlt=!rowAlt; rowNum++
  })

  y+=4
  const ganancia = ventaTotal - costoTotal
  const margenPct = costoTotal>0?((ganancia/costoTotal)*100).toFixed(1):'—'
  doc.setFillColor(10,50,10); doc.rect(margin, y, W-margin*2, 14, 'F')
  doc.setDrawColor(0,229,160); doc.setLineWidth(0.5); doc.rect(margin,y,W-margin*2,14)
  doc.setTextColor(0,229,160); doc.setFontSize(7); doc.setFont('helvetica','bold')
  doc.text('RESUMEN:',margin+4,y+5)
  doc.setFont('helvetica','normal'); doc.setTextColor(100,200,100)
  doc.text('Costo total:',margin+30,y+5)
  doc.setTextColor(255,180,60)
  doc.text('$'+costoTotal.toLocaleString('es-MX',{minimumFractionDigits:2}),margin+60,y+5)
  doc.setTextColor(100,200,100); doc.text('Venta total:',margin+90,y+5)
  doc.setTextColor(180,230,180)
  doc.text('$'+ventaTotal.toLocaleString('es-MX',{minimumFractionDigits:2}),margin+120,y+5)
  doc.setTextColor(100,200,100); doc.text('Ganancia:',margin+155,y+5)
  doc.setTextColor(ganancia>=0?0:255,ganancia>=0?229:80,ganancia>=0?160:60)
  doc.text('$'+ganancia.toLocaleString('es-MX',{minimumFractionDigits:2})+' ('+margenPct+'%)',margin+180,y+5)

  doc.setFillColor(10,22,50); doc.rect(0, PAGE_H-FOOTER_H, W, FOOTER_H, 'F')
  doc.setTextColor(0,80,40); doc.setFontSize(6); doc.setFont('helvetica','normal')
  doc.text('INTERNO · TecnoPatch · Confidencial · No compartir con el cliente', margin, PAGE_H-3)
  doc.save(`${qNum}_INTERNO_${client.replace(/\s+/g,'_').substring(0,15)}.pdf`)
}
