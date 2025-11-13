-- Criação da tabela de intervalos para testes de treino intervalado
create table if not exists public.interval_training_intervals (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.performance_tests(id) on delete cascade,
  order_index int not null,
  mode text not null check (mode in ('distance_intensity','distance_time')),
  distance_meters numeric not null,
  intensity_percentage numeric,
  time_minutes numeric,
  velocity_m_per_min numeric,
  o2_consumption_l numeric,
  kcal numeric,
  weight_loss_grams numeric,
  created_at timestamptz not null default now()
);

create index if not exists interval_training_intervals_test_id_idx on public.interval_training_intervals(test_id);

alter table public.interval_training_intervals enable row level security;

-- Políticas RLS: usuários só acessam registros dos seus próprios testes
create policy if not exists interval_training_intervals_select_policy
  on public.interval_training_intervals
  for select
  using (
    exists (
      select 1 from public.performance_tests pt
      where pt.id = interval_training_intervals.test_id
        and pt.user_id = auth.uid()
    )
  );

create policy if not exists interval_training_intervals_insert_policy
  on public.interval_training_intervals
  for insert
  with check (
    exists (
      select 1 from public.performance_tests pt
      where pt.id = interval_training_intervals.test_id
        and pt.user_id = auth.uid()
    )
  );

create policy if not exists interval_training_intervals_update_policy
  on public.interval_training_intervals
  for update
  using (
    exists (
      select 1 from public.performance_tests pt
      where pt.id = interval_training_intervals.test_id
        and pt.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.performance_tests pt
      where pt.id = interval_training_intervals.test_id
        and pt.user_id = auth.uid()
    )
  );

create policy if not exists interval_training_intervals_delete_policy
  on public.interval_training_intervals
  for delete
  using (
    exists (
      select 1 from public.performance_tests pt
      where pt.id = interval_training_intervals.test_id
        and pt.user_id = auth.uid()
    )
  );