import { createClient } from './server';
import { v4 as uuidv4 } from 'uuid';

export async function uploadImage(file: File): Promise<string | null> {
  const supabase = createClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('products')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function deleteImage(imageUrl: string): Promise<boolean> {
  const supabase = createClient();

  // Extract filename from URL
  const urlParts = imageUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];

  const { error } = await supabase.storage
    .from('products')
    .remove([fileName]);

  if (error) {
    console.error('Delete error:', error);
    return false;
  }

  return true;
}
