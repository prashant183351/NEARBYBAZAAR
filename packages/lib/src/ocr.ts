// Stub OCR utility. Replace with real OCR integration (e.g. Tesseract, Google Vision).
export async function performOCR(_buffer: Buffer): Promise<{ pan?: string; gst?: string }> {
	// Simulate OCR extraction
	return { pan: 'ABCDE1234F', gst: '22ABCDE1234F1Z5' };
}
