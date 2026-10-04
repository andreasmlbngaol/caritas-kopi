// app/(main)/desa/delete-button.tsx - wrapper API lama di atas DeleteButton generik
"use client";

import { DeleteButton as DeleteButtonBase } from "../_components/delete-button";
import { deleteBaselineDesa } from "./actions";

export function DeleteButton({ id, namaDesa }: { id: string; namaDesa: string }) {
    return (
        <DeleteButtonBase
            action={deleteBaselineDesa}
            id={id}
            title="Hapus data baseline?"
            message={
                <>
                    Data baseline Desa <strong>{namaDesa}</strong> beserta data kebijakan
                    dan kelembagaannya akan dihapus permanen dan tidak bisa dikembalikan.
                </>
            }
        />
    );
}