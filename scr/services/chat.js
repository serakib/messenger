import { requireSupabase } from '../lib/supabase.js';

const MESSAGE_PAGE_SIZE = 40;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];

export async function listMyConversations() {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Please sign in to view your conversations.');

  const { data, error } = await client
    .from('conversation_members')
    .select(`
      role,
      joined_at,
      last_read_at,
      is_pinned,
      is_favorite,
      is_muted,
      is_archived,
      conversation:conversations (
        id, type, title, created_by, created_at, updated_at,
        members:conversation_members (
          user_id, role, profile:profiles (id, username, display_name, avatar_url)
        )
      )
    `)
    .eq('user_id', authData.user.id)
    .order('joined_at', { ascending: false })
    .limit(100);
  if (error) throw error;

  return Promise.all((data || []).filter(row => row.conversation).map(async row => {
    const { data: latestRows, error: latestError } = await client
      .from('messages')
      .select('id, body, sender_id, created_at, attachment_path, attachment_name, attachment_mime, attachment_size')
      .eq('conversation_id', row.conversation.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (latestError) throw latestError;
    return {
      ...row.conversation,
      latest_message: latestRows?.[0] || null,
      myRole: row.role,
      lastReadAt: row.last_read_at,
      is_pinned: row.is_pinned,
      is_favorite: row.is_favorite,
      is_muted: row.is_muted,
      is_archived: row.is_archived
    };
  }));
}

export async function updateConversationPreference(conversationId, updates) {
  const allowed = {};
  for (const key of ['is_pinned', 'is_favorite', 'is_muted', 'is_archived']) {
    if (typeof updates?.[key] === 'boolean') allowed[key] = updates[key];
  }
  if (!Object.keys(allowed).length) throw new Error('No conversation preference was provided.');

  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Please sign in first.');

  const { data, error } = await client
    .from('conversation_members')
    .update(allowed)
    .eq('conversation_id', conversationId)
    .eq('user_id', authData.user.id)
    .select('conversation_id, is_pinned, is_favorite, is_muted, is_archived')
    .single();
  if (error) throw error;
  return data;
}

export async function searchProfiles(search = '', limit = 40) {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Please sign in to find people.');

  const clean = String(search).trim().replace(/[^a-zA-Z0-9_ -]/g, ' ').replace(/\s+/g, ' ').slice(0, 60);
  let query = client
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .neq('id', authData.user.id)
    .order('display_name', { ascending: true })
    .limit(Math.min(Math.max(Number(limit) || 40, 1), 60));

  if (clean) {
    query = query.or('display_name.ilike.%' + clean + '%,username.ilike.%' + clean + '%');
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getMessages(conversationId, { before, limit = MESSAGE_PAGE_SIZE } = {}) {
  let query = requireSupabase()
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at, edited_at, deleted_at, attachment_path, attachment_name, attachment_mime, attachment_size')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || MESSAGE_PAGE_SIZE, 1), 100));

  if (before) query = query.lt('created_at', before);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).reverse();
}

export async function sendMessage(conversationId, body) {
  const text = String(body ?? '').trim();
  if (!text) throw new Error('Message cannot be empty.');
  if (text.length > 5000) throw new Error('Message is too long (maximum 5000 characters).');

  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Please sign in before sending a message.');

  const { data, error } = await client
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: authData.user.id, body: text })
    .select('id, conversation_id, sender_id, body, created_at, attachment_path, attachment_name, attachment_mime, attachment_size')
    .single();
  if (error) throw error;
  return data;
}

export async function createConversation({ memberIds, title = null, type = 'direct' }) {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Please sign in to start a conversation.');

  const uniqueMembers = [...new Set((memberIds || []).filter(id => id && id !== authData.user.id))];
  if (type === 'direct' && uniqueMembers.length !== 1) {
    throw new Error('A direct conversation needs exactly one other person.');
  }
  if (type === 'group' && uniqueMembers.length < 1) {
    throw new Error('Choose at least one person for a group.');
  }

  const { data: conversation, error } = await client
    .from('conversations')
    .insert({ type, title: title?.trim() || null, created_by: authData.user.id })
    .select()
    .single();
  if (error) throw error;

  if (uniqueMembers.length) {
    const { error: memberError } = await client.from('conversation_members').insert(
      uniqueMembers.map(user_id => ({ conversation_id: conversation.id, user_id }))
    );
    if (memberError) {
      await client.from('conversations').delete().eq('id', conversation.id);
      throw memberError;
    }
  }
  return conversation;
}

export async function markConversationRead(conversationId) {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Please sign in first.');

  const { error } = await client
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', authData.user.id);
  if (error) throw error;
}

export function subscribeToMessages(conversationId, onMessage) {
  const client = requireSupabase();
  const channel = client
    .channel('conversation:' + conversationId)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'conversation_id=eq.' + conversationId
      },
      payload => onMessage(payload.new)
    )
    .subscribe();

  return () => client.removeChannel(channel);
}

export function subscribeToMyMessages(onMessage) {
  const client = requireSupabase();
  const channel = client
    .channel('my-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      payload => onMessage(payload.new)
    )
    .subscribe();

  return () => client.removeChannel(channel);
}

export async function uploadAttachment(conversationId, file) {
  if (!(file instanceof File)) throw new Error('Choose a file to upload.');
  if (file.size < 1) throw new Error('The selected file is empty.');
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error('Attachments must be 10 MB or smaller.');
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) throw new Error('This file type is not supported.');

  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Please sign in before uploading.');

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'attachment';
  const objectPath = conversationId + '/' + crypto.randomUUID() + '-' + safeName;
  const { data, error } = await client.storage
    .from('chat-attachments')
    .upload(objectPath, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  return { ...data, originalName: file.name, mimeType: file.type, size: file.size };
}

export async function sendAttachmentMessage(conversationId, file) {
  const client = requireSupabase();
  const uploaded = await uploadAttachment(conversationId, file);
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) {
    await client.storage.from('chat-attachments').remove([uploaded.path]);
    throw authError || new Error('Please sign in before uploading.');
  }

  const { data, error } = await client
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: authData.user.id,
      body: '',
      attachment_path: uploaded.path,
      attachment_name: uploaded.originalName,
      attachment_mime: uploaded.mimeType,
      attachment_size: uploaded.size
    })
    .select('id, conversation_id, sender_id, body, created_at, attachment_path, attachment_name, attachment_mime, attachment_size')
    .single();

  if (error) {
    await client.storage.from('chat-attachments').remove([uploaded.path]);
    throw error;
  }
  return data;
}

export async function createAttachmentUrl(path, expiresIn = 60 * 5) {
  const { data, error } = await requireSupabase()
    .storage.from('chat-attachments')
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
