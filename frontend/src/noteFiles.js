function getFileExtension(fileName) {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

function isTextBasedFile(extension) {
  return extension === 'txt' || extension === 'md' || extension === 'markdown';
}

export function resolvePdfJsModule(moduleValue) {
  return moduleValue?.default ?? moduleValue;
}

async function extractDocxText(file) {
  // .docx files are zip-compressed XML, so we use Mammoth to convert the readable content
  // into plain text before we turn it into flashcards.
  const mammoth = await import('mammoth/mammoth.browser');
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

async function extractPdfText(file) {
  // PDF content is not plain text in the browser, so we use pdf.js to read each page and
  // join the extracted text back into a single string for the AI card generator.
  const [pdfModule, pdfWorkerModule] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ]);

  const pdfjs = resolvePdfJsModule(pdfModule);
  const pdfWorker = resolvePdfJsModule(pdfWorkerModule);

  if (!pdfjs || !pdfjs.GlobalWorkerOptions) {
    throw new Error('The PDF reader could not load correctly. Please try a different file or refresh the page.');
  }

  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

  const pdfDocument = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;

  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }

  return pages.join('\n');
}

export async function extractNoteText(file) {
  const extension = getFileExtension(file.name);

  if (isTextBasedFile(extension)) {
    return file.text();
  }

  if (extension === 'docx') {
    return extractDocxText(file);
  }

  if (extension === 'pdf') {
    return extractPdfText(file);
  }

  throw new Error('Choose a PDF, Word document (.docx), Markdown, or plain-text notes file.');
}
