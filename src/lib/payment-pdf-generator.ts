import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import QRCode from 'qrcode';

/**
 * Genera un PDF profesional y empresarial para recibos de pago de VMEDIA COMUNICACIONES.
 * Incluye validación mediante código QR y datos de contacto actualizados.
 */
export async function generatePaymentPDF(payment: any, client: any, salespersonName: string): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Paleta de Colores Corporativa
  const COLOR_PRIMARY = [230, 23, 23]; // Rojo #E61717
  const COLOR_SECONDARY = [20, 20, 20]; // Negro casi puro
  const COLOR_GRAY_BG = [248, 248, 248]; // Gris muy claro para bloques
  const COLOR_TEXT_MUTED = [120, 120, 120];

  // --- 1. ENCABEZADO CORPORATIVO ---
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(0, 0, 6, 65, 'F');

  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('VMEDIA', margin, 25);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('COMUNICACIONES', margin + 0.5, 31);
  
  doc.setDrawColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setLineWidth(1);
  doc.line(margin, 36, margin + 45, 36);

  doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
  doc.setFontSize(9);
  doc.text('FOLIO DE RECIBO:', pageWidth - margin, 22, { align: 'right' });
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(String(payment.folio || 'N/A').toUpperCase(), pageWidth - margin, 29, { align: 'right' });
  
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const formattedDate = format(new Date(payment.date), "dd 'de' MMMM, yyyy", { locale: es });
  doc.text(`EMISIÓN: ${formattedDate.toUpperCase()}`, pageWidth - margin, 36, { align: 'right' });

  let y = 58;

  // --- 2. TÍTULO DEL DOCUMENTO ---
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE PAGO', pageWidth / 2, y, { align: 'center' });
  
  y += 15;

  // --- 3. BLOQUE: INFORMACIÓN DEL CLIENTE ---
  doc.setFillColor(COLOR_GRAY_BG[0], COLOR_GRAY_BG[1], COLOR_GRAY_BG[2]);
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE / PAGADOR', margin + 4, y + 6.5);

  y += 18;
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFontSize(10);

  const customerRows = [
    { label: 'NOMBRE COMERCIAL:', value: client?.name || payment.clientName },
    { label: 'RAZÓN SOCIAL:', value: client?.companyName || 'N/A' },
    { label: 'RFC:', value: client?.rfc || 'N/A' }
  ];

  customerRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(row.label, margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(row.value || 'N/A'), margin + 55, y);
    y += 7;
  });

  y += 8;

  // --- 4. BLOQUE: DETALLES DE LA TRANSACCIÓN ---
  doc.setFillColor(COLOR_GRAY_BG[0], COLOR_GRAY_BG[1], COLOR_GRAY_BG[2]);
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DEL MOVIMIENTO', margin + 4, y + 6.5);

  y += 18;
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);

  const paymentRows = [
    { label: 'MÉTODO DE PAGO:', value: payment.paymentMethod },
    { label: 'REFERENCIA / FOLIO:', value: payment.reference || 'S/N' },
    { label: 'ATENDIDO POR:', value: salespersonName }
  ];

  paymentRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(row.label, margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(row.value || 'N/A'), margin + 55, y);
    y += 7;
  });

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('CONCEPTO DEL PAGO:', margin + 5, y);
  y += 7;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
  const concept = payment.concept || 'Pago por concepto de servicios publicitarios contratados.';
  const splitConcept = doc.splitTextToSize(concept, contentWidth - 15);
  doc.text(splitConcept, margin + 5, y);

  y += (splitConcept.length * 6) + 15;

  // --- 5. CUADRO DE MONTO TOTAL Y QR ---
  const boxWidth = 75;
  const boxHeight = 25;
  const boxX = pageWidth - margin - boxWidth;
  
  doc.setFillColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.rect(boxX, y, boxWidth, boxHeight, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL RECIBIDO (MXN)', boxX + 5, y + 8);
  
  doc.setFontSize(20);
  const amountStr = `$${Number(payment.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  doc.text(amountStr, boxX + 5, y + 18);

  // QR de Validación solicitado por el usuario
  try {
    const qrContent = `Folio: ${payment.folio}
Cliente: ${client?.name || payment.clientName}
Fecha: ${payment.date}
Monto: ${amountStr}
Estado: Liquidado
ID: ${payment.id}`;

    const qrDataUri = await QRCode.toDataURL(qrContent, { margin: 1, width: 150 });
    doc.addImage(qrDataUri, 'PNG', margin + 5, y - 5, 32, 32);
    doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
    doc.setFontSize(6);
    doc.text('VALIDACIÓN DIGITAL', margin + 21, y + 30, { align: 'center' });
  } catch (err) {
    console.error("Error generating QR for payment:", err);
  }

  // --- 6. SECCIÓN DE FIRMA ---
  y = pageHeight - 65;
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth / 2 - 35, y, pageWidth / 2 + 35, y);
  
  y += 6;
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA AUTORIZADA', pageWidth / 2, y, { align: 'center' });
  
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
  doc.text('VMEDIA COMUNICACIONES S.A. DE C.V.', pageWidth / 2, y, { align: 'center' });

  // --- 7. PIE DE PÁGINA PROFESIONAL CON TELÉFONO CORRECTO ---
  doc.setDrawColor(COLOR_GRAY_BG[0], COLOR_GRAY_BG[1], COLOR_GRAY_BG[2]);
  doc.setLineWidth(0.2);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
  
  const footerAddress = 'AV. Juarez #321 Int 8, col. centro, Jiménez, Chihuahua, México C.P. 33980 | Tel: 629 688 15 51';
  doc.text(footerAddress, margin, pageHeight - 10);
  doc.text('www.vmediacomunicaciones.com', pageWidth - margin, pageHeight - 10, { align: 'right' });

  return doc.output('blob');
}
