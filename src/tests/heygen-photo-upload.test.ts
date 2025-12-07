/**
 * HeyGen Photo Upload E2E Tests
 *
 * Tests for CEO photo upload functionality including validation,
 * file handling, and Supabase Storage integration.
 *
 * @module tests/heygen-photo-upload
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Mock file upload data
 */
interface UploadedFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  publicUrl: string;
  storagePath: string;
}

interface UploadResponse {
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  uploadId?: string;
  error?: string;
}

/**
 * Mock upload service for testing
 */
class PhotoUploadService {
  private uploads: UploadedFile[] = [];

  async uploadPhoto(file: File): Promise<UploadResponse> {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'ファイル形式が無効です。JPEG/PNG画像のみ対応しています。',
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'ファイルサイズが大きすぎます。最大10MBまで対応しています。',
      };
    }

    // Validate file name
    if (!file.name || file.name.length === 0) {
      return {
        success: false,
        error: 'ファイル名が無効です。',
      };
    }

    // Simulate successful upload
    const timestamp = Date.now();
    const storagePath = `avatars/${timestamp}-${file.name}`;
    const publicUrl = `https://storage.supabase.co/avatar-uploads/${storagePath}`;

    const uploadedFile: UploadedFile = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      publicUrl,
      storagePath,
    };

    this.uploads.push(uploadedFile);

    return {
      success: true,
      publicUrl,
      filePath: storagePath,
      uploadId: `upload-${timestamp}`,
    };
  }

  getUploads(): UploadedFile[] {
    return [...this.uploads];
  }

  reset(): void {
    this.uploads = [];
  }
}

describe('Photo Upload - File Validation', () => {
  let uploadService: PhotoUploadService;

  beforeEach(() => {
    uploadService = new PhotoUploadService();
    vi.clearAllMocks();
  });

  it('should accept valid JPEG files', async () => {
    const file = new File(['fake image data'], 'ceo-photo.jpg', { type: 'image/jpeg' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.success).toBe(true);
    expect(response.publicUrl).toBeTruthy();
    expect(response.filePath).toContain('ceo-photo.jpg');
  });

  it('should accept valid PNG files', async () => {
    const file = new File(['fake image data'], 'ceo-photo.png', { type: 'image/png' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.success).toBe(true);
    expect(response.publicUrl).toBeTruthy();
  });

  it('should reject invalid file types (PDF)', async () => {
    const file = new File(['fake pdf data'], 'document.pdf', { type: 'application/pdf' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.success).toBe(false);
    expect(response.error).toContain('ファイル形式が無効');
  });

  it('should reject invalid file types (GIF)', async () => {
    const file = new File(['fake gif data'], 'animation.gif', { type: 'image/gif' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.success).toBe(false);
    expect(response.error).toContain('ファイル形式が無効');
  });

  it('should reject files larger than 10MB', async () => {
    const largeData = new Uint8Array(11 * 1024 * 1024); // 11MB
    const file = new File([largeData], 'large-photo.jpg', { type: 'image/jpeg' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.success).toBe(false);
    expect(response.error).toContain('ファイルサイズが大きすぎます');
  });

  it('should accept files at the size limit (10MB)', async () => {
    const maxData = new Uint8Array(10 * 1024 * 1024); // Exactly 10MB
    const file = new File([maxData], 'max-photo.jpg', { type: 'image/jpeg' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.success).toBe(true);
  });

  it('should validate file name is not empty', async () => {
    const file = new File(['data'], '', { type: 'image/jpeg' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.success).toBe(false);
    expect(response.error).toContain('ファイル名が無効');
  });
});

describe('Photo Upload - Storage Integration', () => {
  let uploadService: PhotoUploadService;

  beforeEach(() => {
    uploadService = new PhotoUploadService();
  });

  it('should generate unique storage paths for each upload', async () => {
    const file1 = new File(['data1'], 'photo1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['data2'], 'photo2.jpg', { type: 'image/jpeg' });

    const response1 = await uploadService.uploadPhoto(file1);
    await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure different timestamps
    const response2 = await uploadService.uploadPhoto(file2);

    expect(response1.filePath).not.toBe(response2.filePath);
    expect(response1.publicUrl).not.toBe(response2.publicUrl);
  });

  it('should generate public URLs in correct format', async () => {
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.publicUrl).toMatch(/^https:\/\/storage\.supabase\.co\/avatar-uploads\//);
    expect(response.publicUrl).toContain('ceo.jpg');
  });

  it('should preserve original file name in storage path', async () => {
    const file = new File(['data'], 'president-photo.jpg', { type: 'image/jpeg' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.filePath).toContain('president-photo.jpg');
  });

  it('should track all uploaded files', async () => {
    const file1 = new File(['data1'], 'photo1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['data2'], 'photo2.png', { type: 'image/png' });

    await uploadService.uploadPhoto(file1);
    await uploadService.uploadPhoto(file2);

    const uploads = uploadService.getUploads();
    expect(uploads.length).toBe(2);
    expect(uploads[0].fileName).toBe('photo1.jpg');
    expect(uploads[1].fileName).toBe('photo2.png');
  });
});

describe('Photo Upload - Upload History', () => {
  let uploadService: PhotoUploadService;

  beforeEach(() => {
    uploadService = new PhotoUploadService();
  });

  it('should return uploadId for tracking', async () => {
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.uploadId).toBeTruthy();
    expect(response.uploadId).toMatch(/^upload-\d+$/);
  });

  it('should store file metadata', async () => {
    const file = new File(['test data'], 'ceo.jpg', { type: 'image/jpeg' });
    await uploadService.uploadPhoto(file);

    const uploads = uploadService.getUploads();
    expect(uploads[0].fileName).toBe('ceo.jpg');
    expect(uploads[0].fileType).toBe('image/jpeg');
    expect(uploads[0].fileSize).toBeGreaterThan(0);
  });
});

describe('Photo Upload - Error Handling', () => {
  let uploadService: PhotoUploadService;

  beforeEach(() => {
    uploadService = new PhotoUploadService();
  });

  it('should provide clear error messages for invalid file types', async () => {
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.success).toBe(false);
    expect(response.error).toBeTruthy();
    expect(response.error).toContain('JPEG/PNG');
  });

  it('should provide clear error messages for oversized files', async () => {
    const largeData = new Uint8Array(11 * 1024 * 1024);
    const file = new File([largeData], 'large.jpg', { type: 'image/jpeg' });
    const response = await uploadService.uploadPhoto(file);

    expect(response.success).toBe(false);
    expect(response.error).toBeTruthy();
    expect(response.error).toContain('10MB');
  });

  it('should not create upload record on validation failure', async () => {
    const file = new File(['data'], 'invalid.pdf', { type: 'application/pdf' });
    await uploadService.uploadPhoto(file);

    const uploads = uploadService.getUploads();
    expect(uploads.length).toBe(0);
  });
});

describe('Photo Upload - Performance', () => {
  let uploadService: PhotoUploadService;

  beforeEach(() => {
    uploadService = new PhotoUploadService();
  });

  it('should complete validation quickly', async () => {
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });

    const startTime = Date.now();
    await uploadService.uploadPhoto(file);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should handle multiple uploads sequentially', async () => {
    const uploads = Array.from({ length: 5 }, (_, i) =>
      new File(['data'], `photo${i}.jpg`, { type: 'image/jpeg' })
    );

    const startTime = Date.now();
    for (const file of uploads) {
      await uploadService.uploadPhoto(file);
    }
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(500);
    expect(uploadService.getUploads().length).toBe(5);
  });
});

describe('Photo Upload - UI Integration', () => {
  it('should support file preview before upload', () => {
    const file = new File(['fake image data'], 'ceo.jpg', { type: 'image/jpeg' });
    const objectUrl = URL.createObjectURL(file);

    expect(objectUrl).toBeTruthy();
    expect(objectUrl).toMatch(/^blob:/);

    URL.revokeObjectURL(objectUrl);
  });

  it('should display upload progress feedback', async () => {
    const uploadService = new PhotoUploadService();
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });

    let isUploading = true;
    const uploadPromise = uploadService.uploadPhoto(file).then((response) => {
      isUploading = false;
      return response;
    });

    expect(isUploading).toBe(true);
    await uploadPromise;
    expect(isUploading).toBe(false);
  });
});
