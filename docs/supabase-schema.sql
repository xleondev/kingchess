-- Run this in your Supabase SQL editor to set up the database

create table games (
  id uuid default gen_random_uuid() primary key,
  room_code text unique not null,
  status text default 'waiting',
  pgn text default '',
  created_at timestamptz default now()
);

create table game_moves (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references games(id) on delete cascade,
  move text not null,
  fen text not null,
  created_at timestamptz default now()
);

alter table games enable row level security;
alter table game_moves enable row level security;

create policy "Anyone can read games" on games for select using (true);
create policy "Anyone can insert games" on games for insert with check (true);
create policy "Anyone can update games" on games for update using (true);
create policy "Anyone can read moves" on game_moves for select using (true);
create policy "Anyone can insert moves" on game_moves for insert with check (true);
