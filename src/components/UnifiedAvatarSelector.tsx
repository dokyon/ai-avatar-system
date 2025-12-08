/**
 * UnifiedAvatarSelector Component
 *
 * UI component for selecting both standard HeyGen avatars and custom Photo Avatars.
 *
 * @module components/UnifiedAvatarSelector
 */

'use client';

import React, { useState, useEffect } from 'react';

interface AvatarOption {
  id: string;
  name: string;
  description?: string | null;
  thumbnail_url?: string | null;
  category?: string;
  type: 'd-id' | 'custom';
  heygen_avatar_id?: string | null;
  d_id_source_url?: string;
}

interface UnifiedAvatarSelectorProps {
  onAvatarSelect: (avatar: AvatarOption) => void;
  initialAvatarId?: string;
  className?: string;
}

export function UnifiedAvatarSelector({
  onAvatarSelect,
  initialAvatarId,
  className = '',
}: UnifiedAvatarSelectorProps): React.ReactElement {
  const [avatars, setAvatars] = useState<AvatarOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null);

  /**
   * Fetch both standard HeyGen avatars and custom Photo Avatars
   */
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        setIsLoading(true);

        // Fetch standard HeyGen avatars
        const standardResponse = await fetch('/api/avatars?activeOnly=true');
        const standardData = await standardResponse.json();

        // Fetch custom avatars
        const customResponse = await fetch('/api/custom-avatars?status=completed');
        const customData = await customResponse.json();

        const allAvatars: AvatarOption[] = [];

        // Add standard HeyGen avatars
        if (standardData.success && standardData.avatars) {
          allAvatars.push(
            ...standardData.avatars.map((avatar: any) => ({
              id: avatar.id,
              name: avatar.name,
              description: avatar.description,
              thumbnail_url: avatar.thumbnail_url,
              category: avatar.category,
              type: 'd-id' as const,
              d_id_source_url: avatar.d_id_source_url,
            }))
          );
        }

        // Add custom avatars
        if (customData.success && customData.avatars) {
          allAvatars.push(
            ...customData.avatars.map((avatar: any) => ({
              id: avatar.id,
              name: avatar.avatar_name,
              description: 'カスタムアバター',
              thumbnail_url: avatar.preview_image_url,
              category: 'custom',
              type: 'custom' as const,
              heygen_avatar_id: avatar.heygen_avatar_id,
            }))
          );
        }

        setAvatars(allAvatars);

        // Set initial avatar
        if (allAvatars.length > 0) {
          const initial = initialAvatarId
            ? allAvatars.find((a) => a.id === initialAvatarId)
            : allAvatars[0];

          if (initial) {
            setSelectedAvatar(initial);
            onAvatarSelect(initial);
          }
        }
      } catch (err) {
        console.error('[UnifiedAvatarSelector] Failed to fetch avatars:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch avatars'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatars();
  }, [initialAvatarId, onAvatarSelect]);

  /**
   * Handle avatar selection change
   */
  const handleAvatarChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const avatarId = event.target.value;
    const avatar = avatars.find((a) => a.id === avatarId);

    if (avatar) {
      setSelectedAvatar(avatar);
      onAvatarSelect(avatar);
    }
  };

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className={`unified-avatar-selector ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AIアバターを選択
        </label>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <div className={`unified-avatar-selector ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AIアバターを選択
        </label>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">
            アバター情報の読み込みに失敗しました
          </p>
          <p className="text-xs text-red-500 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  /**
   * No avatars available
   */
  if (avatars.length === 0) {
    return (
      <div className={`unified-avatar-selector ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AIアバターを選択
        </label>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            利用可能なアバターがありません
          </p>
        </div>
      </div>
    );
  }

  // Group avatars by type
  const standardAvatars = avatars.filter((a) => a.type === 'd-id');
  const customAvatars = avatars.filter((a) => a.type === 'custom');

  return (
    <div className={`unified-avatar-selector ${className}`}>
      <label
        htmlFor="avatar-select"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        AIアバターを選択
      </label>

      {/* Avatar Dropdown with Optgroups */}
      <select
        id="avatar-select"
        value={selectedAvatar?.id || ''}
        onChange={handleAvatarChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-4"
        aria-label="アバター選択"
      >
        {standardAvatars.length > 0 && (
          <optgroup label="標準アバター (HeyGen)">
            {standardAvatars.map((avatar) => (
              <option key={avatar.id} value={avatar.id}>
                {avatar.name} - {avatar.description || avatar.category}
              </option>
            ))}
          </optgroup>
        )}

        {customAvatars.length > 0 && (
          <optgroup label="カスタムアバター (社長の写真)">
            {customAvatars.map((avatar) => (
              <option key={avatar.id} value={avatar.id}>
                {avatar.name} - {avatar.description}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {/* Avatar Preview */}
      {selectedAvatar && (
        <div className="avatar-preview bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Thumbnail */}
            {selectedAvatar.thumbnail_url ? (
              <img
                src={selectedAvatar.thumbnail_url}
                alt={selectedAvatar.name}
                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-300 flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-300 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-500 text-xs">No Image</span>
              </div>
            )}

            {/* Avatar Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1">
                {selectedAvatar.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {selectedAvatar.description || 'アバターの説明はありません'}
              </p>
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    selectedAvatar.type === 'custom'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedAvatar.type === 'custom' ? 'カスタム' : selectedAvatar.category}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                  利用可能
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnifiedAvatarSelector;
