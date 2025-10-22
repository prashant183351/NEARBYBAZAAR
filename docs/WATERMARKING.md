# NearbyBazaar Watermarking Pipeline Documentation

This document describes the watermarking approach used in NearbyBazaar for image uploads, including client-side and server-side steps, verification, and troubleshooting.

---

## Overview

Watermarking is enforced for classified images to prevent unauthorized reuse and ensure authenticity. The process includes:

- **Client-side watermarking**: Overlaying a visible watermark and embedding a digital signature before upload.
- **Server-side verification**: Checking for the presence and validity of the watermark signature during upload.

---

## Watermarking Flowchart

```mermaid
flowchart TD
    A[User selects image(s)] --> B[Client applies watermark]
    B --> C[Embed digital signature]
    C --> D[Preview image with watermark]
    D --> E[Upload to server]
    E --> F[Server extracts signature]
    F --> G{Signature valid?}
    G -- Yes --> H[Accept image]
    G -- No --> I[Reject image, show error]
```

---

## Watermarking Steps

1. **Client-side**
   - User selects or drags image(s) into uploader.
   - Watermark text/graphics are overlaid using HTMLCanvas.
   - A digital signature (hash) is embedded in the watermark region.
   - User previews the watermarked image before upload.
2. **Upload**
   - Image is sent to the server via API.
3. **Server-side**
   - Server extracts the watermark region (e.g. bottom-right corner).
   - Signature is read (OCR or pixel pattern).
   - Server recomputes expected signature and compares.
   - If valid, image is accepted; otherwise, rejected with a friendly error.

---

## Troubleshooting Tips

- **Watermark not detected**: Ensure the client watermark function is called before upload, and the signature is embedded in the correct region.
- **Signature mismatch**: Check that the secret used for signature generation matches the server’s expected value.
- **Image format issues**: Some formats may lose watermark data during conversion; prefer PNG or high-quality JPEG.
- **OCR failures**: If using text-based signature, ensure font and contrast are sufficient for OCR.
- **Plan limits exceeded**: If upload is rejected due to too many images, check your classified plan’s image limit.

---

## Example API Error Responses

```json
{
  "error": "Some images are missing the required watermark signature.",
  "failedImages": [0, 2]
}
```

---

_Last updated: 2025-10-19_
