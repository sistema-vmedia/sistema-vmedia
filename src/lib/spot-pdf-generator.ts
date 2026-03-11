import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Genera un PDF profesional para la Ficha de Producción de un Spot.
 */
export async function generateSpotPDF(spot: any, userName: string): Promise<Blob> {
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
  const COLOR_PRIMARY = [230, 23, 23]; // Rojo VMEDIA
  const COLOR_SECONDARY = [20, 20, 20]; // Negro
  const COLOR_GRAY_BG = [248, 248, 248];
  const COLOR_TEXT_MUTED = [120, 120, 120];

  // --- ENCABEZADO ---
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
  doc.text('FOLIO PRODUCCIÓN:', pageWidth - margin, 22, { align: 'right' });
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(String(spot.folio || 'N/A').toUpperCase(), pageWidth - margin, 29, { align: 'right' });
  
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const dateObj = spot.createdAt?.toDate ? spot.createdAt.toDate() : new Date(spot.createdAt || Date.now());
  const formattedDate = format(dateObj, "dd 'de' MMMM, yyyy", { locale: es });
  doc.text(`SOLICITUD: ${formattedDate.toUpperCase()}`, pageWidth - margin, 36, { align: 'right' });

  let y = 58;

  // --- TÍTULO ---
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA DE PRODUCCIÓN', pageWidth / 2, y, { align: 'center' });
  
  y += 15;

  // --- BLOQUE: INFORMACIÓN GENERAL ---
  doc.setFillColor(COLOR_GRAY_BG[0], COLOR_GRAY_BG[1], COLOR_GRAY_BG[2]);
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES TÉCNICOS', margin + 4, y + 6.5);

  y += 18;
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFontSize(10);

  const infoRows = [
    { label: 'CLIENTE:', value: spot.clientName },
    { label: 'ESTACIÓN:', value: spot.station },
    { label: 'NOMBRE DEL SPOT:', value: spot.spotName },
    { label: 'DURACIÓN ESTIMADA:', value: spot.duration },
    { label: 'SOLICITADO POR:', value: spot.requestedByName || userName }
  ];

  infoRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(row.label, margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(row.value || 'N/A'), margin + 55, y);
    y += 7;
  });

  y += 8;

  // --- BLOQUE: GUION ---
  doc.setFillColor(COLOR_GRAY_BG[0], COLOR_GRAY_BG[1], COLOR_GRAY_BG[2]);
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('GUION / TEXTO PARA GRABACIÓN', margin + 4, y + 6.5);

  y += 18;
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(12);
  
  const script = spot.spotText || 'Sin guion registrado.';
  const splitScript = doc.splitTextToSize(`"${script}"`, contentWidth - 15);
  doc.text(splitScript, margin + 5, y);

  // --- PIE DE PÁGINA CON TELÉFONO CORRECTO ---
  y = pageHeight - 20;
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
  doc.text('AV. Juarez #321 Int 8, col. centro, Jiménez, Chihuahua, México C.P. 33980 | Tel: 629 688 15 51', margin, y + 5);
  doc.text('www.vmediacomunicaciones.com', pageWidth - margin, y + 5, { align: 'right' });

  return doc.output('blob');
}
