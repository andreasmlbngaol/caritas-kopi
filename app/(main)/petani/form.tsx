// app/(main)/petani/form.tsx
import { Section, SubSection, Grid, Field, inputCls } from "../_components/ui";
import { YesNoRow } from "../_components/yes-no";
import { ActionForm, type ActionFn } from "../_components/action-form";
import { SubmitButton } from "../_components/submit-button";
import { WilayahKelompokFields } from "./wilayah-kelompok-fields";
import { PlotFields } from "./plot-fields";
import { GapFields, type GapDefaults } from "./gap-fields";
import { ProdukFields } from "./produk-fields";
import { PasarFields } from "./pasar-fields";
import { DatePicker } from "../_components/date-picker";
import {
    JENIS_KELAMIN, KONDISI_KEBUN,
} from "./constants";
import type { getPetani } from "./queries";
import {UnsavedGuard} from "@/app/(main)/_components/unsaved-guard";
import { ProduksiFields } from "./produksi-fields";

export type PetaniDefaults = NonNullable<Awaited<ReturnType<typeof getPetani>>>;

// Konversi balik untuk prefill edit: nilai ternormalisasi → input kosong
const blankStr = (v: string | null | undefined) => (v == null || v === "-" ? "" : v);
const toDateInput = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

export function PetaniForm({
                               action,
                               defaults,
                           }: {
    action: ActionFn;
    defaults?: PetaniDefaults;
}) {
    const gapDefaults: GapDefaults | undefined = defaults
        ? Object.fromEntries(
            defaults.praktikGap.map((g) => [
                g.jenis,
                { jawaban: g.jawaban, keterangan: g.keterangan ?? "-" },
            ])
        )
        : undefined;

    const kd = (jenis: string) => defaults?.kondisiKebun.find((x) => x.jenis === jenis);

    // Helper dipanggil sebagai fungsi (bukan <Komponen/>) agar input tidak remount
    return (
        <ActionForm action={action} className="space-y-6">
            <UnsavedGuard />
            {/* A – DATA IDENTITAS PETANI */}
            <Section title="A – Data Identitas Petani">
                <div className="space-y-6">
                    <SubSection title="Wilayah & Kode">
                        <WilayahKelompokFields
                            defaultDesaKode={defaults?.desaKode}
                            defaultKelompokTaniId={defaults?.kelompokTaniId ?? undefined}
                            defaultKodePetani={defaults?.kodePetani}
                        />
                    </SubSection>
                    <SubSection title="Identitas">
                        <Grid>
                            <Field label="Nama Lengkap (sesuai KTP)" name="namaLengkap" required defaultValue={blankStr(defaults?.namaLengkap)} />
                            <Field label="Nama Panggilan" name="namaPanggilan" defaultValue={blankStr(defaults?.namaPanggilan)} />
                            <div>
                                <label htmlFor="jenisKelamin" className="mb-1.5 block text-xs font-medium text-gray-600">
                                    Jenis Kelamin
                                </label>
                                <select
                                    id="jenisKelamin" name="jenisKelamin" data-label="Jenis Kelamin"
                                    defaultValue={defaults?.jenisKelamin ?? ""} className={inputCls}
                                >
                                    <option value="">— pilih —</option>
                                    {JENIS_KELAMIN.map((j) => (
                                        <option key={j.value} value={j.value}>{j.label}</option>
                                    ))}
                                </select>
                            </div>
                            <DatePicker
                            label="Tanggal Lahir" name="tanggalLahir"
                            defaultValue={toDateInput(defaults?.tanggalLahir)}
                            yearRange={[1940, new Date().getFullYear()]}
                            />

                            <Field label="Nomor Telepon / HP" name="telepon" defaultValue={blankStr(defaults?.telepon)} />
                            <DatePicker
                            label="Tanggal Pendaftaran" name="tanggalPendaftaran"
                            defaultValue={toDateInput(defaults?.tanggalPendaftaran)}
                            />
                            <Field label="Nama Petugas Pendaftar" name="namaPetugasPendaftar" defaultValue={blankStr(defaults?.namaPetugasPendaftar)} />
                            <div className="sm:col-span-2 lg:col-span-3">
                                <Field label="Alamat Domisili" name="alamatDomisili" defaultValue={blankStr(defaults?.alamatDomisili)} />
                            </div>
                        </Grid>
                    </SubSection>
                    <SubSection title="Kontak Darurat">
                        <Grid>
                            <Field label="Nama Kontak Darurat" name="kontakDaruratNama" defaultValue={blankStr(defaults?.kontakDaruratNama)} />
                            <Field label="No. Telepon / HP Kontak Darurat" name="kontakDaruratTelepon" defaultValue={blankStr(defaults?.kontakDaruratTelepon)} />
                            <Field label="Hubungan dengan Kontak Darurat" name="kontakDaruratHubungan" defaultValue={blankStr(defaults?.kontakDaruratHubungan)} />
                        </Grid>
                    </SubSection>
                </div>
            </Section>

            {/* B – DATA FISIK LOKASI PLOT */}
            <Section title="B – Data Fisik Lokasi Plot">
                <PlotFields defaults={defaults?.plot} />
            </Section>

            {/* C – PRAKTIK GAP KEBUN */}
            <Section title="C – Praktik GAP Kebun">
                <GapFields defaults={gapDefaults} />
            </Section>

            {/* D – RIWAYAT ESTIMASI PRODUKSI (kartu per tahun) */}
            <Section title="D – Riwayat Estimasi Produksi">
                <ProduksiFields defaults={defaults?.produksi} />
            </Section>

            {/* E – PENJUALAN */}
            <Section title="E – Penjualan">
                <div className="space-y-6">
                    <SubSection title="E.1 – Jenis Produk yang Dijual">
                        <ProdukFields defaults={defaults?.produk} />
                    </SubSection>
                    <SubSection title="E.2 – Kategori Pasar">
                        <PasarFields defaults={defaults?.pasar} />
                    </SubSection>
                </div>
            </Section>

            {/* F – KONDISI KEBUN */}
            <Section title="F – Kondisi Kebun">
                <div className="space-y-3">
                    {KONDISI_KEBUN.map((k) => (
                        <YesNoRow
                            key={k.jenis} name={`kb_${k.jenis}`} label={k.label}
                            defaultValue={kd(k.jenis)?.jawaban ?? false}
                        >
                            <input
                                name={`kb_${k.jenis}_ket`} placeholder="Keterangan"
                                data-requires={`kb_${k.jenis}`} data-label={`Keterangan ${k.label}`}
                                defaultValue={blankStr(kd(k.jenis)?.keterangan)} className={inputCls}
                            />
                        </YesNoRow>
                    ))}
                </div>
            </Section>

            <div className="flex justify-end pb-10">
                <SubmitButton />
            </div>
        </ActionForm>
    );
}