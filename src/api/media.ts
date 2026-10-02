import { apiRequest } from '@/lib/apiClient';

export type MediaFolder = 'complaints/images' | 'complaints/videos';

export type GetUploadUrlResponse = {
  upload_url: string;
  file_name: string;
  object_key: string;
  public_url: string;
  content_type: string;
  expires_in: number;
};

export function getUploadUrl(body: {
  folder: MediaFolder;
  contentType: string;
  fileName?: string;
}) {
  return apiRequest<GetUploadUrlResponse>('/api/v1/Media/GetUploadUrl', {
    method: 'POST',
    body: {
      folder: body.folder,
      contentType: body.contentType,
      fileName: body.fileName,
    },
  });
}
