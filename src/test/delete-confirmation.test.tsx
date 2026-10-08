import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";

afterEach(cleanup);
describe("delete confirmation", () => {
  it("cancels without deleting data", () => {
    const remove = vi.fn();
    const close = vi.fn();
    render(<DeleteConfirmation open onOpenChange={close} title="Hapus data?" description="Data akan dihapus." onConfirm={remove} />);
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(remove).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledWith(false);
  });
  it("waits for deletion to succeed before closing", async () => {
    let finish: (() => void) | undefined;
    const remove = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const close = vi.fn();
    render(<DeleteConfirmation open onOpenChange={close} title="Hapus data?" description="Data akan dihapus." onConfirm={remove} />);
    fireEvent.click(screen.getByRole("button", { name: "Ya, hapus" }));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    finish?.();
    await waitFor(() => expect(close).toHaveBeenCalledWith(false));
  });
  it("keeps the confirmation open when deletion fails", async () => {
    const remove = vi.fn().mockRejectedValue(new Error("Tidak dapat menghapus"));
    const close = vi.fn();
    render(<DeleteConfirmation open onOpenChange={close} title="Hapus data?" description="Data akan dihapus." onConfirm={remove} />);
    fireEvent.click(screen.getByRole("button", { name: "Ya, hapus" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Ya, hapus" })).toBeEnabled());
    expect(close).not.toHaveBeenCalled();
  });
});