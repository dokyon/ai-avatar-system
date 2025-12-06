/**
 * AvatarSelector Component
 *
 * UI component for selecting D-ID avatars.
 * Displays avatar dropdown, preview thumbnail, and description.
 *
 * @module components/AvatarSelector
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAvatars, getDefaultAvatar, getAvatarById } from '@/hooks/useAvatars';
import type { Avatar } from '@/types/avatar';

/**
 * AvatarSelector Props
 */
interface AvatarSelectorProps {
  /** Callback when avatar is selected */
  onAvatarSelect: (avatar: Avatar) => void;
  /** Initial selected avatar ID (optional) */
  initialAvatarId?: string;
  /** Custom CSS class */
  className?: string;
}

/**
 * AvatarSelector Component
 *
 * Provides avatar selection interface with:
 * - Dropdown list of available avatars
 * - Thumbnail preview of selected avatar
 * - Avatar description display
 * - Responsive design support
 *
 * @param props - Component props
 * @returns Avatar selector UI
 *
 * @example
 * ```tsx
 * <AvatarSelector
 *   onAvatarSelect={(avatar) => setSelectedAvatar(avatar)}
 *   initialAvatarId="550e8400-e29b-41d4-a716-446655440001"
 * />
 * ```
 */
export function AvatarSelector({
  onAvatarSelect,
  initialAvatarId,
  className = '',
}: AvatarSelectorProps): React.ReactElement {
  const { avatars, isLoading, error } = useAvatars({ activeOnly: true });
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);

  /**
   * Set default avatar when avatars are loaded
   */
  useEffect(() => {
    if (avatars.length > 0 && !selectedAvatar) {
      // Use initial avatar if provided, otherwise use default
      const defaultAvatar = initialAvatarId
        ? getAvatarById(avatars, initialAvatarId) || getDefaultAvatar(avatars)
        : getDefaultAvatar(avatars);

      if (defaultAvatar) {
        setSelectedAvatar(defaultAvatar);
        onAvatarSelect(defaultAvatar);
      }
    }
  }, [avatars, selectedAvatar, initialAvatarId, onAvatarSelect]);

  /**
   * Handle avatar selection change
   */
  const handleAvatarChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const avatarId = event.target.value;
    const avatar = getAvatarById(avatars, avatarId);

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
      <div className={`avatar-selector ${className}`}>
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
      <div className={`avatar-selector ${className}`}>
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
      <div className={`avatar-selector ${className}`}>
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

  return (
    <div className={`avatar-selector ${className}`}>
      <label
        htmlFor="avatar-select"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        AIアバターを選択
      </label>

      {/* Avatar Dropdown */}
      <select
        id="avatar-select"
        value={selectedAvatar?.id || ''}
        onChange={handleAvatarChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-4"
        aria-label="アバター選択"
      >
        {avatars.map((avatar) => (
          <option key={avatar.id} value={avatar.id}>
            {avatar.name} - {avatar.description || avatar.category}
          </option>
        ))}
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
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  {selectedAvatar.category}
                </span>
                {selectedAvatar.is_active && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    利用可能
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvatarSelector;
