<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Money queries/helpers live in src/lib/tx.ts and exports in src/lib/export.ts (lazy-loaded jspdf/exceljs); why: keep report rules testable and heavy libs out of the main bundle.
- Destructive delete flows use the shared DeleteConfirmation with awaited writes; why: keep confirmation, cancellation and pending/error states consistent.
- Profiles are provisioned by the signup trigger and repaired through migrations, not client upserts; why: keep profile creation trusted and updates owner-scoped.
- Cross-user public data (e.g. activity ticker) is exposed only through SECURITY DEFINER functions returning anonymised columns; why: transactions RLS stays owner-only.
