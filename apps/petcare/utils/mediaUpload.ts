import { supabase } from '../config/supabase';

export async function uploadPetPhoto(
  localUri: string,
  petId: string,
): Promise<string> {
  const ext = localUri.split('.').pop() ?? 'jpg';
  const fileName = `pet-photos/${petId}-${Date.now()}.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('pet-media')
    .upload(fileName, blob, {
      contentType: `image/${ext}`,
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from('pet-media').getPublicUrl(fileName);
  return data.publicUrl;
}
