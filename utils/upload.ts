// Upload utility (stub for R2 integration)
export function validateFile(file: { mimetype: string; size: number }, allowedTypes: string[], maxSize: number) {
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
}
