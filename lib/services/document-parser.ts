import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdf = new PDFParse(new Uint8Array(buffer));
  const result = await pdf.getText();
  pdf.destroy();
  return String(result);
}

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  switch (ext) {
    case ".docx":
      return extractTextFromDocx(buffer);
    case ".pdf":
      return extractTextFromPdf(buffer);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}
