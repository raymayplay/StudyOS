import fs from "node:fs";

const STOP_WORDS = new Set([
  "the","a","an","and","or","for","with","from","into","that","this","these","those","about","using","study","lecture","notes","chapter","section","module","course","class","pdf","document","page","pages","key","concept","concepts","include","including","into","over","under","what","when","where","your","their","there","here","then","than","such","more","most","any","all","will","should","could","would","also","each","every","based","example","examples","review","important","need","needs","learn","learning","topic","topics","exam","exams","material","materials","help","helps","make","made","just","very","often","through","within","before","after","while","because","without","during","among","between","same","different","type","types","part","parts","due","use","used","using","shows","show","first","second","third","list","lists"
]);

export async function extractPdfText(filePath: string): Promise<string> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const bytes = fs.readFileSync(filePath);
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;

    const pages: string[] = [];

    for (let index = 1; index <= pdf.numPages; index += 1) {
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ("str" in item ? item.str : ""))
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

export function fallbackBasicTopics(text: string): Array<{ title: string; description: string; difficulty: string }> {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const rawSegments = normalized.split(/[.;\n]/).filter((value) => value.trim().length > 16);
  const segments = rawSegments.slice(0, 8);

  return segments.map((segment, index) => {
    const base = segment.trim();
    const title = base.split(" ").slice(0, 5).join(" ") || `Topic ${index + 1}`;
    return {
      title: title.length > 60 ? `${title.slice(0, 57)}...` : title,
      description: `Review the key concept described in the extracted document excerpt: ${base.slice(0, 140)}`,
      difficulty: ["Beginner", "Intermediate", "Advanced"][index % 3],
    };
  });
}

export function buildVideoRecommendations(rawText: string, courseName?: string) {
  const sourceText = (rawText || "").replace(/\s+/g, " ").trim();
  const baseName = (courseName || "study guide").replace(/\.[^.]+$/, "").trim();

  if (!sourceText) {
    return [
      {
        title: `${baseName || "Course"} overview`,
        query: `${baseName || "course"} beginner explanation`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${baseName || "course"} beginner explanation`)}`,
      },
    ];
  }

  const tokens = sourceText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token));

  const counts = new Map<string, number>();
  tokens.forEach((token) => {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  });

  const keywords = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([token]) => token)
    .slice(0, 4);

  const queryPool = [] as string[];
  const primary = keywords.length > 0 ? keywords : [baseName.replace(/\s+/g, " ")];

  queryPool.push(`${primary.slice(0, 2).join(" ")} explained`);
  queryPool.push(`${primary.slice(0, 2).join(" ")} tutorial`);
  queryPool.push(`${primary.slice(0, 2).join(" ")} beginner crash course`);
  queryPool.push(`${baseName || "course"} study guide`);

  const uniqueQueries = [...new Set(queryPool.map((value) => value.replace(/\s+/g, " ").trim()).filter(Boolean))];

  return uniqueQueries.slice(0, 3).map((query, index) => ({
    title: index === 0 ? `${baseName || "Course"} essentials` : index === 1 ? `${baseName || "Course"} walkthrough` : `${baseName || "Course"} revision`,
    query,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  }));
}

export function buildStudyNotes(rawText: string, documentName: string): string {
  const text = rawText.replace(/\s+/g, " ").trim();
  if (!text) {
    return `# ${documentName}\n\nNo readable text was extracted from this PDF. Scanned pages may need OCR before study notes can be generated.`;
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token));
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const keywords = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([word]) => word);
  const keyPoints = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: keywords.reduce(
        (score, keyword) => score + (sentence.toLowerCase().includes(keyword) ? 1 : 0),
        0,
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 5)
    .map(({ sentence }) => sentence);
  const summary = sentences.slice(0, 3).join(" ") || text.slice(0, 700);

  return [
    `# Study notes: ${documentName}`,
    "",
    "## Quick summary",
    summary,
    "",
    "## Key terms from the document",
    ...(keywords.length ? keywords.map((keyword) => `- ${keyword}`) : ["- No recurring terms found."]),
    "",
    "## Key points to review",
    ...(keyPoints.length ? keyPoints.map((point) => `- ${point}`) : ["- Review the extracted text and add your own key points."]),
    "",
    "_Drafted from extracted PDF text. Check the source before relying on these notes._",
  ].join("\n");
}
