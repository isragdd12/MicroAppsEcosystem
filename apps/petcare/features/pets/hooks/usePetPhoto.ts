import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { uploadPetPhoto } from '../../../utils/mediaUpload';

import { useUpdatePet } from './useUpdatePet';

export function usePetPhoto(petId: string) {
  const { mutateAsync: updatePet } = useUpdatePet();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAndUploadPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    if (!asset) return;

    try {
      setUploading(true);
      setError(null);
      const photoUrl = await uploadPetPhoto(asset.uri, petId);
      await updatePet({ id: petId, patch: { photoUrl } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return { pickAndUploadPhoto, uploading, error };
}
