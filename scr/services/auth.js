import { requireSupabase } from '../lib/supabase.js';

export async function signUp({ email, password, username, displayName }) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        username: username?.trim() || null,
        display_name: displayName?.trim() || username?.trim() || 'New user'
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({
    email: email.trim(),
    password
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

export async function getMyProfile() {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Please sign in to view your profile.');

  const { data, error } = await client
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, created_at, updated_at')
    .eq('id', authData.user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(updates) {
  const allowed = {};
  if (typeof updates.display_name === 'string') allowed.display_name = updates.display_name.trim();
  if (typeof updates.username === 'string') allowed.username = updates.username.trim() || null;
  if (typeof updates.bio === 'string') allowed.bio = updates.bio.trim();
  if (typeof updates.avatar_url === 'string' || updates.avatar_url === null) {
    allowed.avatar_url = updates.avatar_url;
  }
  if (!Object.keys(allowed).length) throw new Error('There are no profile changes to save.');
  if (allowed.display_name !== undefined && !allowed.display_name) {
    throw new Error('Display name cannot be empty.');
  }

  const { data, error } = await requireSupabase()
    .from('profiles')
    .update(allowed)
    .select('id, username, display_name, avatar_url, bio, created_at, updated_at')
    .single();
  if (error) throw error;
  return data;
}


function normalizePhone(phone) {
  const normalized = String(phone || '').trim().replace(/[\\s().-]/g, '');
  if (!/^\\+[1-9]\\d{7,14}$/.test(normalized)) {
    throw new Error('Enter a valid phone number with country code, for example +8801XXXXXXXXX.');
  }
  return normalized;
}

export async function requestPhoneOtp({ phone, shouldCreateUser = false, username, displayName }) {
  const normalizedPhone = normalizePhone(phone);
  const options = { shouldCreateUser };
  if (shouldCreateUser) {
    options.data = {
      username: username?.trim() || null,
      display_name: displayName?.trim() || username?.trim() || 'New user'
    };
  }
  const { data, error } = await requireSupabase().auth.signInWithOtp({
    phone: normalizedPhone,
    options
  });
  if (error) throw error;
  return { ...data, phone: normalizedPhone };
}

export async function verifyPhoneOtp({ phone, token }) {
  const normalizedPhone = normalizePhone(phone);
  const cleanToken = String(token || '').replace(/\\D/g, '');
  if (!/^\\d{6}$/.test(cleanToken)) {
    throw new Error('Enter the 6-digit verification code sent to your phone.');
  }
  const { data, error } = await requireSupabase().auth.verifyOtp({
    phone: normalizedPhone,
    token: cleanToken,
    type: 'sms'
  });
  if (error) throw error;
  return data;
}
