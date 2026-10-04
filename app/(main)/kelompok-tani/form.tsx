// app/(main)/kelompok-tani/form.tsx
import { ActionForm, type ActionFn } from "../_components/action-form";
import { Section, SubSection, Field, inputCls } from "../_components/ui";
import { WilayahSelect } from "../_components/wilayah-select";
import { SubmitButton } from "../_components/submit-button";

export type KelompokTaniDefaults = {
    nama: string;
    kode: string | null;
    desaKode: string;
};

export function KelompokTaniForm({
                                     action,
                                     defaults,
                                 }: {
    action: ActionFn;
    defaults?: KelompokTaniDefaults;
}) {
    // "BM-KT01" → ["BM", "KT01"]; segmen pertama → kode1, sisanya → kode2
    const seg = defaults?.kode?.split("-") ?? [];

    return (
        <ActionForm action={action} className="space-y-6">
            <Section title="Data Kelompok Tani">
                <div className="space-y-6">
                    <SubSection title="Desa">
                        <WilayahSelect defaultDesaKode={defaults?.desaKode} />
                    </SubSection>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field
                            hint="Kelompok Tani [Nama]"
                            label="Nama Kelompok Tani" name="nama" required
                            defaultValue={defaults?.nama ?? ""}
                        />
                        <div>
                            <span className="mb-1.5 block text-xs font-medium text-gray-600">
                                Kode Kelompok Tani
                            </span>
                            <div className="flex items-center gap-2">
                                <div>
                                    <input
                                        name="kode1" placeholder="KR" data-label="Kode kelompok bagian 1"
                                        defaultValue={seg[0] ?? ""} className={`${inputCls} w-24 uppercase`}
                                    />
                                    <p className="mt-1 text-[11px] text-gray-400">Kode wilayah</p>
                                </div>
                                <span className="pb-5 text-gray-400">-</span>
                                <div>
                                    <input
                                        name="kode2" placeholder="KR01" data-label="Kode kelompok bagian 2"
                                        defaultValue={seg.slice(1).join("-")} className={`${inputCls} w-28 uppercase`}
                                    />
                                    <p className="mt-1 text-[11px] text-gray-400">Nomor urut</p>
                                </div>
                            </div>
                            <p className="mt-1 text-[11px] text-gray-400">
                                Contoh: KR-KR01. Boleh dikosongkan; kalau diisi harus unik per desa.
                            </p>
                        </div>
                    </div>
                </div>
            </Section>

            <div className="flex justify-end pb-10">
                <SubmitButton label="Simpan Kelompok Tani" />
            </div>
        </ActionForm>
    );
}