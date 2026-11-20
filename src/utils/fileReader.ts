import { Attachment } from '../types';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function processUploadedFile(file: File): Promise<Attachment> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File "${file.name}" exceeds the maximum allowed size of 10MB.`);
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(extension);
  const isCode = ['py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'sql', 'cpp', 'c', 'h', 'java', 'cs', 'rb', 'go', 'rs', 'sh'].includes(extension);

  let category: 'image' | 'code' | 'doc' = 'doc';
  if (isImage) category = 'image';
  else if (isCode) category = 'code';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error(`Could not read file: ${file.name}`));
    };

    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        let textContent: string | undefined = undefined;

        // If it's a code file or plain text/doc, extract text content as well for easy chat context insertion
        if (!isImage) {
          try {
            textContent = await file.text();
          } catch {
            // fallback if text extraction fails
          }
        }

        const attachment: Attachment = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: file.type || (isImage ? 'image/png' : 'text/plain'),
          size: file.size,
          base64: base64Data,
          previewUrl: isImage ? base64Data : undefined,
          category,
          textContent,
        };

        resolve(attachment);
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
