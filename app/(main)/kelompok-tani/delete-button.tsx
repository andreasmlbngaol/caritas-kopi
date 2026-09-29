// app/(main)/kelompok-tani/delete-button.tsx
"use client";

import { DeleteButton as DeleteButtonBase } from "../_components/delete-button";
import { deleteKelompokTani } from "./actions";

export function DeleteButton({ id, nama }: { id: string; nama: string }) {
    return (
        <DeleteButtonBase
            action={deleteKelompokTani}
            id={id}
            title="Hapus kelompok tani?"
            message={
                <>
                    Kelompok tani <strong>{nama}</strong> akan dihapus permanen.
                    Hanya bisa dihapus bila tidak ada petani yang tergabung di dalamnya.
                </>
            }
        />
    );
}