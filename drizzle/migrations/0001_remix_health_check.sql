drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.user_roles, public.account_status, public.admin_audit to authenticated;
grant select, insert on public.announcements to authenticated;
grant select, insert, update, delete on public.banners, public.categories, public.transactions, public.wallets to authenticated;
grant select, update on public.feature_flags, public.reminder_settings to authenticated;
grant all on public.user_roles, public.account_status, public.admin_audit, public.announcements, public.banners, public.categories, public.transactions, public.wallets, public.feature_flags, public.reminder_settings to service_role;

insert into public.profiles (id, email, display_name, avatar_url, provider)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email,'@',1)), u.raw_user_meta_data->>'avatar_url', coalesce(u.raw_app_meta_data->>'provider','email')
from auth.users u where not exists (select 1 from public.profiles p where p.id=u.id);

drop policy if exists "public avatars read" on storage.objects;
create policy "public avatars read" on storage.objects for select to anon, authenticated using (bucket_id = 'avatars');