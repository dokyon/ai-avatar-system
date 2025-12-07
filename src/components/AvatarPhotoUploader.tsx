'use client';

import { useState, useRef, ChangeEvent } from 'react';

interface UploadResult {
  uploadId: string;
  fileName: string;
  publicUrl: string;
  filePath: string;
}

interface AvatarPhotoUploaderProps {
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export function AvatarPhotoUploader({
  onUploadSuccess,
  onUploadError,
  className = '',
}: AvatarPhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarName, setAvatarName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('JPEG または PNG ファイルのみアップロード可能です。');
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('ファイルサイズが大きすぎます。最大10MBまでアップロード可能です。');
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('ファイルを選択してください。');
      return;
    }

    if (!avatarName.trim()) {
      setError('アバター名を入力してください。');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('avatarName', avatarName.trim());

      const response = await fetch('/api/avatars/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'アップロードに失敗しました');
      }

      console.log('[AvatarPhotoUploader] Upload successful:', data);

      onUploadSuccess?.({
        uploadId: data.uploadId,
        fileName: data.fileName,
        publicUrl: data.publicUrl,
        filePath: data.filePath,
      });

      // Reset form
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';
      console.error('[AvatarPhotoUploader] Upload error:', error);
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setAvatarName('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`avatar-photo-uploader ${className}`}>
      <div className="uploader-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Avatar Name Input */}
        <div className="avatar-name-section" style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="avatar-name-input"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            アバター名
          </label>
          <input
            id="avatar-name-input"
            type="text"
            value={avatarName}
            onChange={(e) => setAvatarName(e.target.value)}
            placeholder="例: 社長のアバター"
            disabled={isUploading}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        {/* File Input */}
        <div className="file-input-section" style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="avatar-file-input"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            社長の写真をアップロード
          </label>
          <input
            ref={fileInputRef}
            id="avatar-file-input"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            disabled={isUploading}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
            }}
          />
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
            JPEG または PNG 形式、最大10MB
          </p>
        </div>

        {/* Preview */}
        {preview && (
          <div className="preview-section" style={{ marginBottom: '1rem' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>プレビュー:</p>
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto',
                border: '2px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <img
                src={preview}
                alt="プレビュー"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </div>
            {selectedFile && (
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                ファイル名: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="error-message"
            style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c00',
            }}
          >
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons" style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !avatarName.trim() || isUploading}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              backgroundColor: !selectedFile || !avatarName.trim() || isUploading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: !selectedFile || !avatarName.trim() || isUploading ? 'not-allowed' : 'pointer',
            }}
          >
            {isUploading ? 'アップロード中...' : 'アップロード'}
          </button>

          {(selectedFile || preview) && !isUploading && (
            <button
              onClick={handleClear}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              クリア
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
