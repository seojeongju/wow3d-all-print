import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatKoreanDateISO } from '@/lib/date-utils';

export type OrderForPdf = {
  order_number: string;
  created_at: string;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  user_email?: string | null;
  guest_email?: string | null;
};

export type ItemForPdf = {
  file_name: string;
  print_method?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

/** pdf-lib 표준 폰트(WinAnsi)는 한글 미지원 → ASCII 인쇄 가능 문자만 사용 */
function toPdfSafeText(s: string, maxLen: number = 80): string {
  return String(s)
    .slice(0, maxLen)
    .replace(/[^\x20-\x7E]/g, '_');
}

/**
 * 견적서 PDF 생성 (표준 폰트 사용, 한글은 '_'로 대체되어 첨부 오류 방지)
 * Returns Uint8Array for attachment (base64 인코딩은 호출 측에서)
 */
export async function buildQuotationPdf(
  order: OrderForPdf,
  items: ItemForPdf[],
  companyName: string = 'WOW3D'
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const drawText = (text: string, x: number, yPos: number, size: number = 10, bold = false) => {
    const f = bold ? fontBold : font;
    const safe = toPdfSafeText(text, 80);
    if (safe) page.drawText(safe, { x, y: yPos, size, font: f, color: rgb(0, 0, 0) });
  };

  drawText('QUOTATION', margin, y, 20, true);
  y -= 24;
  drawText(`Order No. ${toPdfSafeText(order.order_number, 40)}`, width - margin - 150, y + 4, 10);
  drawText(`Date: ${formatKoreanDateISO(order.created_at)}`, margin, y, 10);
  y -= 20;

  drawText('Bill To:', margin, y, 11, true);
  y -= 16;
  drawText(`Name: ${toPdfSafeText(order.recipient_name || '-')}`, margin, y, 10);
  y -= 14;
  drawText(`Phone: ${toPdfSafeText(order.recipient_phone || '-')}`, margin, y, 10);
  y -= 14;
  drawText(`Address: ${toPdfSafeText((order.shipping_address || '-').slice(0, 60), 60)}`, margin, y, 10);
  y -= 20;

  const colW = [30, 180, 40, 70, 70];
  const tableLeft = margin;
  const rowH = 18;
  const headers = ['No', 'Item / Spec', 'Qty', 'Unit', 'Amount'];
  headers.forEach((h, i) => {
    const x = tableLeft + colW.slice(0, i).reduce((a, b) => a + b, 0);
    page.drawText(h, { x, y, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  });
  y -= rowH;

  items.forEach((item, idx) => {
    const fileName = toPdfSafeText(item.file_name || '-', 30);
    const spec = toPdfSafeText(item.print_method || '', 8);
    const row = [
      String(idx + 1),
      `${fileName}${spec ? ' ' + spec : ''}`.slice(0, 35),
      String(item.quantity),
      String(Number(item.unit_price).toLocaleString()),
      String(Number(item.subtotal).toLocaleString()),
    ];
    row.forEach((cell, i) => {
      const x = tableLeft + colW.slice(0, i).reduce((a, b) => a + b, 0) + (i >= 2 ? 4 : 0);
      page.drawText(toPdfSafeText(cell, 25), { x, y, size: 9, font, color: rgb(0, 0, 0) });
    });
    y -= rowH;
  });

  const totalSupply = items.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
  const totalVat = Math.floor(totalSupply * 0.1);
  const totalAmount = totalSupply + totalVat;
  y -= 10;
  drawText('Total (VAT 10% incl.):', margin, y, 11, true);
  drawText(`KRW ${totalAmount.toLocaleString()}`, width - margin - 120, y, 11, true);
  y -= 30;

  drawText(toPdfSafeText(companyName, 40), margin, y, 10);
  drawText('Thank you for your business.', margin, y - 14, 9);

  return doc.save();
}

/** Uint8Array → base64 (Worker/Edge 호환) */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(bytes).toString('base64');
}
