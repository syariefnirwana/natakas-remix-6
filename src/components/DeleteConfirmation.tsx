import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { errMsg } from "@/lib/format";

export function DeleteConfirmation({ open, onOpenChange, title, description, onConfirm }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (busy) return;
    setBusy(true);
    try { await onConfirm(); onOpenChange(false); }
    catch (error) { toast.error(errMsg(error)); }
    finally { setBusy(false); }
  };
  return (
    <AlertDialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}>
      <AlertDialogContent className="retro rounded-2xl bg-card">
        <div className="retro-sm flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><Trash2 className="size-6" /></div>
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="break-words text-xl font-extrabold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="break-words leading-relaxed">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0">
          <AlertDialogCancel disabled={busy} className="m-0">Batal</AlertDialogCancel>
          <Button variant="destructive" disabled={busy} onClick={remove}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}{busy ? "Menghapus…" : "Ya, hapus"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}