export interface VerificationResult {
  isValid: boolean;
  detectedType: string;
  message: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  aadhaar: 'Aadhaar Card',
  pan_card: 'PAN Card',
  voter_id: 'Voter ID',
  driving_license: 'Driving License',
  passport: 'Passport',
  birth_certificate: 'Birth Certificate',
  income_certificate: 'Income Certificate',
  caste_certificate: 'Caste Certificate',
  domicile_certificate: 'Domicile Certificate',
  other: 'Other',
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  // Use CDN worker URL — avoids Vite/browser module resolution issues
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  const maxPages = Math.min(pdf.numPages, 2);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText.trim();
}

function buildPrompt(selectedTypeLabel: string): string {
  return `You are a document verification AI for an Indian government document portal called Virtual Setu.

The user claims to be uploading a: "${selectedTypeLabel}"

Analyze the document content and identify what type of document it actually is.

Supported document types:
- Aadhaar Card
- PAN Card
- Voter ID
- Driving License
- Passport
- Birth Certificate
- Income Certificate
- Caste Certificate
- Domicile Certificate
- Other

Respond with ONLY valid JSON in this exact format:
{
  "detectedType": "<one of the supported types above>",
  "isValid": <true if detectedType matches the claimed type, false otherwise>,
  "message": "<a helpful 1-2 sentence message for the user>"
}

Rules:
- If the document clearly matches the claimed type, set isValid to true
- If it does not match, set isValid to false and explain what was found
- If you cannot determine the type confidently, set detectedType to "Other" and isValid to false
- Keep messages friendly and actionable`;
}

export async function verifyDocument(
  file: File,
  selectedType: string
): Promise<VerificationResult> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const selectedTypeLabel = DOCUMENT_TYPE_LABELS[selectedType] ?? selectedType;

  if (!apiKey) {
    return {
      isValid: true,
      detectedType: selectedTypeLabel,
      message: 'Verification skipped — GROQ API key not configured.',
    };
  }

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  let messages: object[];
  let model: string;

  if (isImage) {
    const base64 = await fileToBase64(file);
    model = 'meta-llama/llama-4-scout-17b-16e-instruct';
    messages = [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${file.type};base64,${base64}` },
          },
          {
            type: 'text',
            text: buildPrompt(selectedTypeLabel),
          },
        ],
      },
    ];
  } else if (isPdf) {
    model = 'llama3-70b-8192';
    let pdfText = '';
    try {
      pdfText = await extractPdfText(file);
    } catch {
      pdfText = `[PDF file: "${file.name}", size: ${(file.size / 1024).toFixed(1)} KB. Text could not be extracted — likely a scanned document.]`;
    }
    messages = [
      {
        role: 'user',
        content: `${buildPrompt(selectedTypeLabel)}\n\nExtracted document text:\n${pdfText || '[No readable text found]'}`,
      },
    ];
  } else {
    throw new Error('Unsupported file type. Please upload a JPG, PNG, or PDF.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GROQ API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '{}';

  try {
    const parsed = JSON.parse(content) as VerificationResult;
    return parsed;
  } catch {
    throw new Error('Unexpected response format from AI. Please try again.');
  }
}
