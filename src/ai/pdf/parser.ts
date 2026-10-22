import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

export interface ParsedPDFDocument {
  text: string;
  pageCount: number;
  pages: Array<{ pageNumber: number; text: string }>;
}

/**
 * Extrae texto estructurado desde un buffer o archivo PDF
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedPDFDocument> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();

  const pages = (result.pages || []).map((p: any, idx: number) => ({
    pageNumber: p.num || idx + 1,
    text: (p.text || "").trim(),
  }));

  const fullText = pages.map((p: { text: string }) => p.text).join("\n\n");

  return {
    text: fullText || result.text || "",
    pageCount: result.total || pages.length || 1,
    pages,
  };
}

/**
 * Extrae texto directamente desde una ruta de archivo PDF
 */
export async function parsePdfFile(filePath: string): Promise<ParsedPDFDocument> {
  const buffer = await fs.readFile(filePath);
  return parsePdfBuffer(buffer);
}
