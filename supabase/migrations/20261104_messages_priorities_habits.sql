-- Run in the Supabase SQL Editor.
-- Assumes public."Users".id and public.tasks.id are integer/bigint keys.
-- The app currently uses custom login, not Supabase Auth.
-- RLS is enabled without client policies: connect a trusted backend or
-- implement a verified authentication mapping before allowing client access.

begin;

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id bigint not null references public."Users"(id) on delete cascade,
  recipient_id bigint not null references public."Users"(id) on delete cascade,
  content text not null check (length(btrim(content)) > 0),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint chat_messages_different_users check (sender_id <> recipient_id),
  constraint chat_messages_read_time check (read_at is null or read_at >= created_at)
);

create index chat_messages_conversation_idx
  on public.chat_messages (
    least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at, id
  );
create index chat_messages_inbox_idx
  on public.chat_messages (recipient_id, created_at desc);
create index chat_messages_sender_idx on public.chat_messages (sender_id);

-- Per-user priority matches the current localStorage behavior.
create table public.task_priorities (
  user_id bigint not null references public."Users"(id) on delete cascade,
  task_id bigint not null references public.tasks(id) on delete cascade,
  priority text not null default 'none'
    check (priority in ('none', 'low', 'medium', 'high')),
  primary key (user_id, task_id)
);
create index task_priorities_task_idx on public.task_priorities (task_id);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public."Users"(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  period text not null default 'Morning'
    check (period in ('Morning', 'Afternoon', 'Evening')),
  icon text not null default 'grow'
    check (icon in ('water', 'read', 'exercise', 'grow', 'rest')),
  created_on date not null default current_date
);
create index habits_user_idx on public.habits (user_id);

-- One row means the habit was completed on that date.
-- Unchecking a day deletes that row. Streaks are calculated from these rows.
create table public.habit_completions (
  habit_id uuid not null references public.habits(id) on delete cascade,
  completed_on date not null,
  primary key (habit_id, completed_on)
);

alter table public.chat_messages enable row level security;
alter table public.task_priorities enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;

revoke all on public.chat_messages, public.task_priorities,
  public.habits, public.habit_completions from anon, authenticated;

commit;
