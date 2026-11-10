import { requireSupabase } from '../lib/supabase.js';

const MESSAGE_PAGE_SIZE = 40;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export async function listMyConversations() {
  const { data, error } = await requireSupabase()
    .from('conversation_members')
    .select(`
      role,
      joined_at,
      last_read_at,
      conversation:conversations (
        id, type, title, created_by, created_at, updated_at,
        members:conversation_members (
          user_id, role, profile:profiles (id, username, display_name, avatar_url)
        ),
        latest_message:messages (id, body, sender_id, created_at)
      )
    `)
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({ ...row.conversation, myRole: row.role, lastReadAt: row.last_read_at }));
}

export async function getMessages(conversationId, { before, limit = MESSAGE_PAGE_SIZE } = {}) {
  let query = requireSupabase()
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at, edited_at, deleted_at')
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
    .select()
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
      uniqueMembers.map(user_id => ({ conversation_id: conversation.id, user_id, role: 'member' }))
    );
    if (memberError) {
      // The owner-delete policy lets us roll back this incomplete conversation.
      await client.from('conversations').delete().eq('id', conversation.id);
      throw memberError;
    }
  }
  return conversation;
}

export async function markConversationRead(conversationId) {
  const { data: authData, error: authError } = await requireSupabase().auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Please sign in first.');

  const { error } = await requireSupabase()
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', authData.user.id);
  if (error) throw error;
}

export function subscribeToMessages(conversationId, onMessage) {
  const client = requireSupabase();
  const channel = client
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      payload => onMessage(payload.new)
    )
    .subscribe();

  return () => client.removeChannel(channel);
}

export async function uploadAttachment(conversationId, file) {
  if (!(file instanceof File)) throw new Error('Choose a file to upload.');
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error('Attachments must be 10 MB or smaller.');
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];
  if (!allowed.includes(file.type)) throw new Error('This file type is not supported.');

  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Please sign in before uploading.');

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'attachment';
  const objectPath = `${conversationId}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await client.storage
    .from('chat-attachments')
    .upload(objectPath, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  return data;
}

export async function createAttachmentUrl(path, expiresIn = 60 * 5) {
  const { data, error } = await requireSupabase()
    .storage.from('chat-attachments')
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
