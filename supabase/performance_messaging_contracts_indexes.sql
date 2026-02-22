-- Performance / stabilité messagerie + contrats + rendez-vous
-- Exécuter dans Supabase SQL Editor

-- Messages: lecture par conversation + tri temps
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_desc
  ON public.messages (conversation_id, created_at DESC);

-- Messages: accélère certains écrans / diagnostics / listes perso
CREATE INDEX IF NOT EXISTS idx_messages_sender_created_desc
  ON public.messages (sender_id, created_at DESC);

-- Messages: partages de contrats et rendez-vous (accès ciblés)
CREATE INDEX IF NOT EXISTS idx_messages_type_conversation_created_desc
  ON public.messages (message_type, conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_shared_contract_partial
  ON public.messages (shared_contract_id)
  WHERE shared_contract_id IS NOT NULL;

-- Appointments: lookup par message (MessageBubble), conversations, participants
CREATE INDEX IF NOT EXISTS idx_appointments_message_id
  ON public.appointments (message_id);

CREATE INDEX IF NOT EXISTS idx_appointments_conversation_datetime
  ON public.appointments (conversation_id, appointment_datetime DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_recipient_status_datetime
  ON public.appointments (recipient_id, status, appointment_datetime DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_sender_status_datetime
  ON public.appointments (sender_id, status, appointment_datetime DESC);

-- Conversations: listing et tri des discussions directes
CREATE INDEX IF NOT EXISTS idx_conversations_user1_last_message
  ON public.conversations (user1_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user2_last_message
  ON public.conversations (user2_id, last_message_at DESC);

-- Contrats: ouverture/modification/liste par parties
CREATE INDEX IF NOT EXISTS idx_contracts_creator_created_desc
  ON public.contracts (creator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contracts_counterparty_created_desc
  ON public.contracts (counterparty_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contracts_post_created_desc
  ON public.contracts (post_id, created_at DESC);

-- Brouillons de contrats (si multi-brouillons)
CREATE INDEX IF NOT EXISTS idx_contract_drafts_user_updated_desc
  ON public.contract_drafts (user_id, updated_at DESC);

-- Applications (page contrats / annonces acceptées)
CREATE INDEX IF NOT EXISTS idx_applications_post_status_created
  ON public.applications (post_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_applicant_status_created
  ON public.applications (applicant_id, status, created_at DESC);
