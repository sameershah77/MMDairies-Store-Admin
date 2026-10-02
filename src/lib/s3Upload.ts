import { getUploadUrl, type MediaFolder } from '@/api/media';

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i;
const VIDEO_EXT = /\.(mp4|mov|webm|m4v|avi|mkv)$/i;
const UPLOAD_TIMEOUT_MS = 90000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

export type S3MediaType = 'image' | 'video';

function detectMediaType(file: File): S3MediaType | null {
  if (file.type.startsWith('image/') || IMAGE_EXT.test(file.name)) return 'image';
  if (file.type.startsWith('video/') || VIDEO_EXT.test(file.name)) return 'video';
  return null;
}

function resolveContentType(file: File, mediaType: S3MediaType): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  const name = file.name.toLowerCase();
  if (mediaType === 'video') {
    if (name.endsWith('.mov')) return 'video/quicktime';
    if (name.endsWith('.webm')) return 'video/webm';
    return 'video/mp4';
  }
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function uploadMediaToS3(
  file: File,
): Promise<{ url: string; mediaType: S3MediaType }> {
  const mediaType = detectMediaType(file);
  if (!mediaType) {
    throw new Error('Please select an image or video file.');
  }
  if (mediaType === 'image' && file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be under 10MB.');
  }
  if (mediaType === 'video' && file.size > MAX_VIDEO_BYTES) {
    throw new Error('Video must be under 40MB.');
  }

  const folder: MediaFolder =
    mediaType === 'video' ? 'complaints/videos' : 'complaints/images';
  const contentType = resolveContentType(file, mediaType);

  const presign = await getUploadUrl({
    folder,
    contentType,
    fileName: file.name,
  });

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const res = await fetch(presign.upload_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        detail.trim()
          ? `S3 upload failed (${res.status}): ${detail.slice(0, 300)}`
          : `S3 upload failed (${res.status}).`,
      );
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Upload timed out. Check your network and try again.');
    }
    if (err instanceof Error) throw err;
    throw new Error('Unable to upload to S3. Check your network connection.');
  } finally {
    window.clearTimeout(timer);
  }

  // publicUrl points at trash/ for pending preview; API promotes on save.
  return {
    url: presign.public_url || presign.file_name,
    mediaType,
  };
}
