-- Voor een bestaande database: voegt de quiz-instellingen toe.
alter table quizzes add column if not exists meerdere_teams_per_vraag boolean not null default true;
alter table quizzes add column if not exists toon_vragen boolean not null default false;
alter table quizzes add column if not exists tussenstand_na_ronde boolean not null default true;
