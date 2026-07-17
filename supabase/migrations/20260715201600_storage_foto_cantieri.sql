-- Creazione del bucket privato 'foto-cantieri' se non esiste
insert into storage.buckets (id, name, public)
values ('foto-cantieri', 'foto-cantieri', false)
on conflict (id) do nothing;

update storage.buckets
set public = false
where id = 'foto-cantieri';

-- Abilita RLS su storage.objects (sicurezza)
alter table storage.objects enable row level security;

-- Rimuovi eventuali policy preesistenti per evitare conflitti
drop policy if exists "Consentito l'inserimento delle proprie foto" on storage.objects;
drop policy if exists "Consentita la lettura delle proprie foto" on storage.objects;
drop policy if exists "Consentita l'eliminazione delle proprie foto" on storage.objects;

-- Policy 1: Inserimento consentito solo agli utenti autenticati nella propria cartella
create policy "Consentito l'inserimento delle proprie foto"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'foto-cantieri'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Lettura consentita solo agli utenti autenticati per le proprie foto.
-- L'app genera URL firmati temporanei, non URL pubblici permanenti.
create policy "Consentita la lettura delle proprie foto"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'foto-cantieri'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Eliminazione consentita solo all'utente proprietario della foto
create policy "Consentita l'eliminazione delle proprie foto"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'foto-cantieri'
  and (storage.foldername(name))[1] = auth.uid()::text
);
