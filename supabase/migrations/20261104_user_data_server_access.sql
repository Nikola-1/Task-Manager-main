-- Run after 20261104_messages_priorities_habits.sql.
-- Client roles remain blocked by RLS. Only the server accesses these tables.
begin;
grant usage on schema public to service_role;
grant select, insert, update, delete on public.chat_messages,
  public.task_priorities, public.habits, public.habit_completions to service_role;
commit;
