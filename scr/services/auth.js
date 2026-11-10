import { requireSupabase } from '../lib/supabase.js';

export async function signUp({ email, password, username, displayName }) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        username: username?.trim() || null,
        display_name: displayName?.trim() || username?.trim() || 'New user',
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await requireSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback) {
  const { data } = requireSupabase().auth.onAuthStateChange((event, session) => {
    callback({ event, session });
  });
  return () => data.subscription.unsubscribe();
}

export async function updateMyProfile(updates) {
  const allowed = {};
  if (typeof updates.display_name === 'string') allowed.display_name = updates.display_name.trim();
  if (typeof updates.username === 'string') allowed.username = updates.username.trim();
  if (typeof updates.bio === 'string') allowed.bio = updates.bio.trim();
  if (typeof updates.avatar_url === 'string' || updates.avatar_url === null) {
    allowed.avatar_url = updates.avatar_url;
  }

  const { data, error } = await requireSupabase()
    .from('profiles')
    .update(allowed)
    .select()
    .single();
  if (error) throw error;
  return data;
}
