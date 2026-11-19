-- Pubquiz-score schema voor Supabase (Postgres)
-- Plak dit in de Supabase SQL editor van je project en voer het uit.

create extension if not exists pgcrypto;

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  aantal_rondes int not null default 6 check (aantal_rondes between 1 and 20),
  admin_token text not null unique,
  view_token text not null unique,
  -- 4-cijferige code waarmee gasten zonder link naar het scorebord kunnen.
  quizcode text unique check (quizcode ~ '^[0-9]{4}$'),
  created_at timestamptz not null default now()
);

-- Spelers worden eerst aangemaakt en daarna in een team geselecteerd.
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  naam text not null,
  created_at timestamptz not null default now(),
  unique (quiz_id, naam)
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  naam text not null,
  -- Een team verwijderen maakt de spelers weer vrij.
  team_id uuid references teams(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (quiz_id, naam)
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  nummer int not null,
  titel text,
  -- 'open' = loopt nog (punten zijn live zichtbaar), 'afgerond' = telt
  -- definitief mee in het scorebord.
  status text not null default 'open' check (status in ('open', 'afgerond')),
  unique (quiz_id, nummer)
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  round_id uuid not null references rounds(id) on delete cascade,
  volgorde int not null default 0,
  tekst text not null,
  punten numeric not null default 1 check (punten > 0 and punten <= 100),
  created_at timestamptz not null default now()
);

-- Eén rij = dit team heeft deze vraag goed en krijgt de punten.
create table if not exists question_scores (
  question_id uuid not null references questions(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, team_id)
);

create index if not exists teams_quiz_idx on teams(quiz_id);
create index if not exists players_quiz_idx on players(quiz_id);
create index if not exists rounds_quiz_idx on rounds(quiz_id);
create index if not exists questions_quiz_idx on questions(quiz_id);
create index if not exists question_scores_quiz_idx on question_scores(quiz_id);

-- Alle toegang loopt via de server (service role key); anon-toegang dicht.
alter table quizzes enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table rounds enable row level security;
alter table questions enable row level security;
alter table question_scores enable row level security;
