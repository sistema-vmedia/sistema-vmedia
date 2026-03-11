import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import QRCode from 'qrcode';

/**
 * Genera un PDF profesional y elegante para contratos de VMEDIA COMUNICACIONES.
 * Incluye secciones corporativas, validación QR y diseño premium.
 * 
 * @param contract Datos del contrato de Firestore.
 * @param client Datos del cliente asociado.
 * @param salespersonName Nombre del ejecutivo de ventas.
 * @returns Un Blob con el PDF generado.
 */
export async function generateContractPDF(contract: any, client: any, salespersonName: string): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Colores Corporativos
  const COLOR_PRIMARY = [230, 23, 23]; // Rojo VMEDIA #E61717
  const COLOR_SECONDARY = [30, 30, 30]; // Negro Corporativo
  const COLOR_GRAY_LIGHT = [245, 245, 245]; // Fondo gris para bloques
  const COLOR_TEXT_DIM = [100, 100, 100];

  // --- 1. ENCABEZADO PREMIUM ---
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(0, 0, 5, 60, 'F');

  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('VMEDIA', margin, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('COMUNICACIONES', margin + 0.5, 30);
  
  doc.setDrawColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, 34, margin + 40, 34);

  doc.setTextColor(COLOR_TEXT_DIM[0], COLOR_TEXT_DIM[1], COLOR_TEXT_DIM[2]);
  doc.setFontSize(8);
  doc.text('FOLIO DE CONTROL:', pageWidth - margin, 22, { align: 'right' });
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text((contract.id || 'N/A').substring(0, 10).toUpperCase(), pageWidth - margin, 28, { align: 'right' });
  
  doc.setTextColor(COLOR_TEXT_DIM[0], COLOR_TEXT_DIM[1], COLOR_TEXT_DIM[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`EMISIÓN: ${format(new Date(), 'dd / MMM / yyyy', { locale: es }).toUpperCase()}`, pageWidth - margin, 34, { align: 'right' });

  let y = 55;

  // --- 2. TÍTULO PRINCIPAL ---
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO PUBLICITARIO', pageWidth / 2, y, { align: 'center' });
  
  y += 12;

  // --- 3. SECCIÓN: DATOS DEL CLIENTE ---
  doc.setFillColor(COLOR_GRAY_LIGHT[0], COLOR_GRAY_LIGHT[1], COLOR_GRAY_LIGHT[2]);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('I. INFORMACIÓN DEL TITULAR / CLIENTE', margin + 3, y + 5.5);

  y += 15;
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFontSize(9);

  const clientData = [
    { label: 'RAZÓN SOCIAL:', value: client.companyName },
    { label: 'NOMBRE COMERCIAL:', value: client.name },
    { label: 'RFC:', value: client.rfc },
    { label: 'DOMICILIO FISCAL:', value: client.fiscalAddress },
    { label: 'TELÉFONO:', value: client.phone },
    { label: 'CORREO ELECTRÓNICO:', value: client.email }
  ];

  clientData.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, margin + 5, y);
    doc.setFont('helvetica', 'normal');
    const val = doc.splitTextToSize(String(item.value || 'N/A'), contentWidth - 55);
    doc.text(val, margin + 50, y);
    y += (val.length * 5);
  });

  // --- 4. SECCIÓN: ESPECIFICACIONES DE CONTRATACIÓN ---
  y += 5;
  doc.setFillColor(COLOR_GRAY_LIGHT[0], COLOR_GRAY_LIGHT[1], COLOR_GRAY_LIGHT[2]);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('II. DETALLES DE LA CAMPAÑA Y SERVICIOS', margin + 3, y + 5.5);

  y += 15;
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  
  const contractSpecs = [
    { label: 'ESTACIÓN EMISORA:', value: contract.station },
    { label: 'CONCEPTO / PAQUETE:', value: contract.campaignType },
    { label: 'FECHA DE INICIO:', value: contract.startDate },
    { label: 'FECHA DE TÉRMINO:', value: contract.endDate },
    { label: 'INVERSIÓN MENSUAL:', value: `$${Number(contract.monthlyAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` },
    { label: 'EJECUTIVO:', value: salespersonName }
  ];

  contractSpecs.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(item.value || 'N/A'), margin + 50, y);
    y += 6;
  });

  // --- 5. OBSERVACIONES ---
  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('III. OBSERVACIONES Y CONDICIONES ESPECIALES:', margin + 5, y);
  
  y += 6;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLOR_TEXT_DIM[0], COLOR_TEXT_DIM[1], COLOR_TEXT_DIM[2]);
  const obs = contract.observations || 'Sin observaciones adicionales registradas para este acuerdo.';
  const splitObs = doc.splitTextToSize(obs, contentWidth - 10);
  doc.text(splitObs, margin + 5, y);
  
  y += (splitObs.length * 5) + 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Este documento representa un acuerdo formal de prestación de servicios publicitarios entre el Cliente y VMEDIA COMUNICACIONES.', margin + 5, y);

  // --- 6. SECCIÓN DE FIRMAS ---
  y = pageHeight - 85;
  
  doc.setLineWidth(0.3);
  doc.setDrawColor(200, 200, 200);
  
  const colWidth = contentWidth / 2 - 10;

  doc.line(margin + 5, y, margin + 5 + colWidth, y);
  doc.line(pageWidth - margin - 5 - colWidth, y, pageWidth - margin - 5, y);

  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.text('POR EL CLIENTE', margin + 5 + (colWidth / 2), y, { align: 'center' });
  doc.text('POR VMEDIA COMUNICACIONES', pageWidth - margin - 5 - (colWidth / 2), y, { align: 'center' });

  y += 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_DIM[0], COLOR_TEXT_DIM[1], COLOR_TEXT_DIM[2]);
  const clientRepresentante = doc.splitTextToSize(String(client.companyName || client.name), colWidth);
  doc.text(clientRepresentante, margin + 5 + (colWidth / 2), y, { align: 'center' });
  doc.text('REPRESENTANTE AUTORIZADO', pageWidth - margin - 5 - (colWidth / 2), y, { align: 'center' });

  y += 12;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bolditalic');
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.text('Ambas partes aceptan los términos del presente contrato publicitario.', pageWidth / 2, y, { align: 'center' });

  // --- 7. QR DE VALIDACIÓN DIGITAL ---
  const validationUrl = `${window.location.origin}/validate-contract/${contract.id}`;
  const qrDataUri = await QRCode.toDataURL(validationUrl, {
    margin: 1,
    width: 150,
    color: {
      dark: '#1E1E1E',
      light: '#FFFFFF'
    }
  });

  const qrSize = 32;
  const qrX = pageWidth - margin - qrSize;
  const qrY = pageHeight - margin - qrSize - 5;
  
  doc.setDrawColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setLineWidth(0.1);
  doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 8);
  
  doc.addImage(qrDataUri, 'PNG', qrX, qrY, qrSize, qrSize);
  
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text('VALIDACIÓN DIGITAL', qrX + (qrSize / 2), qrY + qrSize + 4, { align: 'center' });

  // --- 8. PIE DE PÁGINA CON TELÉFONO CORRECTO ---
  doc.setDrawColor(COLOR_GRAY_LIGHT[0], COLOR_GRAY_LIGHT[1], COLOR_GRAY_LIGHT[2]);
  doc.setLineWidth(0.1);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_DIM[0], COLOR_TEXT_DIM[1], COLOR_TEXT_DIM[2]);
  const footerInfo = 'AV. Juarez #321 Int 8, col. centro, Jiménez, Chihuahua, México C.P. 33980 | Tel: 629 688 15 51 | www.vmediacomunicaciones.com';
  doc.text(footerInfo, margin, pageHeight - 8);
  doc.text(`ID: ${contract.id}`, pageWidth - margin, pageHeight - 8, { align: 'right' });

  return doc.output('blob');
}
