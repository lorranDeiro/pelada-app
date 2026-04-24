import { supabase } from './supabase';

const BUCKET = 'player-photos';
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'] as const;

export async function uploadPlayerPhoto(
  playerId: string,
  file: File
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error('Foto maior que 2 MB');
  }
  if (!ALLOWED.includes(file.type as (typeof ALLOWED)[number])) {
    throw new Error('Formato inválido (use JPG, PNG ou WebP)');
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${playerId}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) throw uploadErr;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  const { error: updateErr } = await supabase
    .from('players')
    .update({ photo_url: url, photo_updated_at: new Date().toISOString() })
    .eq('id', playerId);
  if (updateErr) throw updateErr;

  return url;
}

export async function deletePlayerPhoto(playerId: string, url: string | null) {
  if (!url) return;
  const path = url.split(`/${BUCKET}/`)[1]?.split('?')[0];
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }
  await supabase
    .from('players')
    .update({ photo_url: null, photo_updated_at: null })
    .eq('id', playerId);
}
