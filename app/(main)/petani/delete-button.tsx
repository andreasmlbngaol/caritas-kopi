// app/(main)/petani/delete-button.tsx
"use client";

import { DeleteButton as DeleteButtonBase } from "../_components/delete-button";
import { deletePetani } from "./actions";

export function DeleteButton({ id, nama }: { id: string; nama: string }) {
    return (
        <DeleteButtonBase
            action={deletePetani}
            id={id}
            title="Hapus data petani?"
            message={
                <>
                    Data baseline petani <strong>{nama}</strong> beserta data plot, praktik GAP,
                    produksi, dan kondisi kebunnya akan dihapus permanen dan tidak bisa dikembalikan.
                </>
            }
        />
    );
}