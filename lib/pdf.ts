import fs from "node:fs";

import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(path.join(process.cwd(), "package.json"));

export async function extractPdfText(filePath: string): Promise<string> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
      require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"),
    ).href;
    const bytes = fs.readFileSync(filePath);
    const pdf = await pdfjs.getDocument({ data: Uint8Array.from(bytes) }).promise;

    const pages: string[] = [];

    for (let index = 1; index <= pdf.numPages; index += 1) {
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      if (pageText.trim()) {
        pages.push(pageText.trim());
      }
    }

    return pages.join("\n\n").trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown PDF extraction error";
    throw new Error(`Unable to extract text from this PDF: ${message}`);
  }
}
