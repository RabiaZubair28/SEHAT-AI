import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const URDU_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap";

/** Load the Naskh font once so Urdu renders with correct joining (NA-25). */
export function ensureUrduFont() {
  if (document.querySelector(`link[href="${URDU_FONT_HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = URDU_FONT_HREF;
  document.head.appendChild(link);
}

/**
 * Rasterise each handout page with the browser's own text shaping (so Urdu
 * right-to-left script stays correct) and assemble an A4 PDF.
 */
export async function buildHandoutPdf(container: HTMLElement): Promise<Blob> {
  await document.fonts?.ready;
  const pages = Array.from(container.querySelectorAll<HTMLElement>(".na-handout-page"));
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: 794,
    });
    if (i > 0) pdf.addPage();
    // A page that grew past A4 is scaled down to fit, never clipped.
    const naturalHeight = (canvas.height / canvas.width) * width;
    const drawHeight = Math.min(height, naturalHeight);
    const drawWidth = naturalHeight > height ? (width * height) / naturalHeight : width;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.88), "JPEG", (width - drawWidth) / 2, 0, drawWidth, drawHeight, undefined, "FAST");
  }
  return pdf.output("blob");
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
