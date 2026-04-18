import { GoogleGenAI } from '@google/genai';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data:...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}

async function uploadFileToStorage(file: File | Blob, uid: string, ext: string): Promise<string> {
  const storageRef = ref(storage, `avatars/${uid}/${Date.now()}.${ext}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/**
 * Generates an AI avatar from a user's uploaded photo using Gemini,
 * uploads the result to Firebase Storage, and returns the download URL.
 * Falls back to uploading the original photo if Gemini generation fails.
 */
export async function generateAndUploadAvatar(
  file: File,
  uid: string,
  onProgress?: (stage: 'uploading' | 'generating' | 'done') => void
): Promise<string> {
  onProgress?.('generating');

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');

    const base64Data = await fileToBase64(file);
    const ai = new GoogleGenAI({ apiKey });

    const response = await (ai.models as any).generateContent({
      model: 'gemini-2.0-flash-preview-image-generation',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: file.type || 'image/jpeg',
                data: base64Data,
              },
            },
            {
              text: `Transform this photo into a stylized illustrated avatar portrait.
Use a clean, modern cartoon/illustration art style with bold outlines and vibrant but harmonious colors.
Preserve the person's facial features but make them stylized and expressive.
Use a simple solid or subtly gradient background.
Show only the face and upper shoulders.
Make it look great as a circular social media profile picture.`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    const parts = response?.candidates?.[0]?.content?.parts as any[];
    const imagePart = parts?.find((p: any) => p?.inlineData?.data);

    if (imagePart?.inlineData?.data) {
      const generatedBase64: string = imagePart.inlineData.data;
      const mimeType: string = imagePart.inlineData.mimeType || 'image/jpeg';
      const ext = mimeType.split('/')[1]?.split(';')[0] || 'jpg';
      const blob = base64ToBlob(generatedBase64, mimeType);
      onProgress?.('uploading');
      const url = await uploadFileToStorage(blob, uid, ext);
      onProgress?.('done');
      return url;
    }

    throw new Error('No image in Gemini response');
  } catch (err) {
    console.warn('[AvatarGenerator] Gemini generation failed, using original photo:', err);
    onProgress?.('uploading');
    const ext = file.type?.split('/')[1] || 'jpg';
    const url = await uploadFileToStorage(file, uid, ext);
    onProgress?.('done');
    return url;
  }
}
