import { Section, SubSection, Grid, Field, FieldUnitSelect, inputCls } from "./ui";
import { YesNoField, YesNoRow } from "./yes-no";
import { WilayahSelect } from "./wilayah-select";
import { MusimFields } from "./musim-fields";
import { KEBIJAKAN, LEMBAGA } from "./constants";
import { SubmitButton } from "./submit-button";
import type { getBaselineDesa } from "./queries";
import {UnsavedGuard} from "@/app/(main)/_components/unsaved-guard";

export type DesaDefaults = NonNullable<Awaited<ReturnType<typeof getBaselineDesa>>>;

// Konversi balik untuk prefill edit: nilai ternormalisasi → input kosong
const blankNum = (v: number | null | undefined) => (v == null || v === 0 ? "" : v);
const blankStr = (v: string | null | undefined) => (v == null || v === "-" ? "" : v);

export function DesaForm({
                             action,
                             defaults,
                         }: {
    action: (formData: FormData) => Promise<void>;
    defaults?: DesaDefaults;
}) {
    const kb = (jenis: string) => defaults?.kebijakan.find((x) => x.jenis === jenis);
    const lm = (jenis: string) => defaults?.kelembagaan.find((x) => x.jenis === jenis);

    return (
        <form action={action} className="space-y-6">
            <UnsavedGuard />
            {/* A – DATA DESA / WILAYAH */}
            <Section title="A – Data Desa / Wilayah">
                <div className="space-y-6">
                    <SubSection title="Wilayah Administratif">
                        <WilayahSelect defaultDesaKode={defaults?.desaKode} />
                    </SubSection>
                    <SubSection title="Umum">
                        <Grid>
                            <Field label="Tahun Pendataan" name="tahunPendataan" type="number" required defaultValue={defaults?.tahunPendataan} />
                            <Field label="Sumber Data" name="sumberData" defaultValue={blankStr(defaults?.sumberData)} />
                        </Grid>
                    </SubSection>
                    <SubSection title="Kependudukan & Lahan">
                        <Grid>
                            <Field label="Luas Wilayah" name="luasWilayahHa" type="number" unit="Ha" defaultValue={blankNum(defaults?.luasWilayahHa)} />
                            <Field label="Jumlah Penduduk" name="jumlahPenduduk" type="number" unit="jiwa" defaultValue={blankNum(defaults?.jumlahPenduduk)} />
                            <Field label="Jumlah KK" name="jumlahKK" type="number" unit="KK" defaultValue={blankNum(defaults?.jumlahKK)} />
                            <Field label="Jumlah Petani Kopi" name="jumlahPetaniKopi" type="number" unit="orang" defaultValue={blankNum(defaults?.jumlahPetaniKopi)} />
                            <Field label="Luas Areal Kopi" name="luasArealKopiHa" type="number" unit="Ha" defaultValue={blankNum(defaults?.luasArealKopiHa)} />
                            <Field label="Luas Area Komoditi Lainnya" name="luasKomoditiLainHa" type="number" unit="Ha" defaultValue={blankNum(defaults?.luasKomoditiLainHa)} />
                            <Field label="Latitude" name="latitude" type="number" allowNegative hint="Pakai titik (.), mis. -7.1234" defaultValue={defaults?.latitude ?? ""} />
                            <Field label="Longitude" name="longitude" type="number" allowNegative hint="Pakai titik (.), mis. 110.4567" defaultValue={defaults?.longitude ?? ""} />
                        </Grid>
                    </SubSection>
                    <SubSection title="Kondisi Fisik & Iklim">
                        <Grid>
                            <Field label="Topografi" name="topografi" defaultValue={blankStr(defaults?.topografi)} />
                            <Field label="Ketinggian" name="ketinggianMdpl" type="number" unit="mdpl" defaultValue={blankNum(defaults?.ketinggianMdpl)} />
                            <MusimFields defaultHujan={blankStr(defaults?.bulanHujan)} defaultKering={blankStr(defaults?.bulanKering)} />
                            <Field label="Suhu Rata-rata" name="suhuRataRataC" type="number" unit="°C" defaultValue={blankNum(defaults?.suhuRataRataC)} />
                            <Field label="Jenis Tanah" name="jenisTanah" defaultValue={blankStr(defaults?.jenisTanah)} />
                        </Grid>
                    </SubSection>
                    <SubSection title="Aksesibilitas & Kawasan Konservasi">
                        <Grid>
                            <Field label="Akses Jalan" name="aksesJalan" defaultValue={blankStr(defaults?.aksesJalan)} />
                            <Field label="Jarak ke Ibu Kota Kecamatan" name="jarakIbukotaKecamatanKm" type="number" unit="km" defaultValue={blankNum(defaults?.jarakIbukotaKecamatanKm)} />
                            <Field label="Jarak ke Pasar" name="jarakPasarKm" type="number" unit="km" defaultValue={blankNum(defaults?.jarakPasarKm)} />
                            <Field label="Jarak ke Kawasan Konservasi" name="jarakKonservasiKm" type="number" unit="km" defaultValue={blankNum(defaults?.jarakKonservasiKm)} />
                            <Field label="Luas Lahan APL" name="luasAPLHa" type="number" unit="Ha" defaultValue={blankNum(defaults?.luasAPLHa)} />
                            <Field label="Nama Kawasan Konservasi" name="namaKawasanKonservasi" defaultValue={blankStr(defaults?.namaKawasanKonservasi)} />
                        </Grid>
                    </SubSection>
                </div>
            </Section>

            {/* B – KEBIJAKAN LOKAL */}
            <Section title="B – Kebijakan Lokal">
                <div className="space-y-3">
                    {KEBIJAKAN.map((k) => (
                        <YesNoRow
                            key={k.jenis} name={`kb_${k.jenis}`} label={k.label}
                            labels={["Ada", "Tidak"]} defaultValue={kb(k.jenis)?.ada ?? false}
                        >
                            <input
                                name={`kb_${k.jenis}_ket`} placeholder="Keterangan"
                                data-requires={`kb_${k.jenis}`} data-label={`Keterangan ${k.label}`}
                                defaultValue={blankStr(kb(k.jenis)?.keterangan)} className={inputCls}
                            />
                        </YesNoRow>
                    ))}
                </div>
            </Section>

            {/* C – KELEMBAGAAN */}
            <Section title="C – Kelembagaan">
                <div className="space-y-3">
                    {LEMBAGA.map((l) => (
                        <div key={l.jenis} data-group={l.label} className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[140px_120px_1fr]">
                            <span className="text-sm font-medium text-gray-700">{l.label}</span>
                            <input name={`lm_${l.jenis}_jumlah`} type="number" placeholder="Jumlah" data-label="Jumlah" defaultValue={blankNum(lm(l.jenis)?.jumlah)} className={inputCls} />
                            <input name={`lm_${l.jenis}_kondisi`} placeholder="Kondisi" data-label="Kondisi" defaultValue={blankStr(lm(l.jenis)?.kondisi)} className={inputCls} />
                        </div>
                    ))}
                </div>
            </Section>

            {/* D – KONDISI BISNIS KOPI */}
            <Section title="D – Kondisi Bisnis Kopi Saat Ini">
                <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    Jumlah petani kopi dan luas kebun kopi otomatis memakai isian bagian A.
                </p>
                <Grid>
                    <Field label="Produktivitas Rata-rata" name="produktivitasKgHaTahun" type="number" unit="kg/Ha" hint="per tahun" defaultValue={blankNum(defaults?.produktivitasKgHaTahun)} />
                    <Field label="Harga Cherry" name="hargaCherryRp" type="number" unit="Rp" defaultValue={blankNum(defaults?.hargaCherryRp)} />
                    <Field label="Harga Green Bean" name="hargaGreenBeanRpKg" type="number" unit="Rp/kg" defaultValue={blankNum(defaults?.hargaGreenBeanRpKg)} />
                    <Field label="Pembeli Utama" name="pembeliUtama" defaultValue={blankStr(defaults?.pembeliUtama)} />
                    <Field label="Jumlah Pedagang Pengumpul" name="jumlahPedagangPengumpul" type="number" unit="orang" defaultValue={blankNum(defaults?.jumlahPedagangPengumpul)} />
                    <Field label="Koperasi Aktif" name="koperasiAktifUnit" type="number" unit="unit" defaultValue={blankNum(defaults?.koperasiAktifUnit)} />
                    <Field label="Eksportir" name="eksportir" defaultValue={blankStr(defaults?.eksportir)} />
                    <Field label="Industri Pengolahan" name="industriPengolahan" defaultValue={blankStr(defaults?.industriPengolahan)} />
                    <div className="sm:col-span-2 lg:col-span-3">
                        <Field label="Permasalahan Utama" name="permasalahanUtama" defaultValue={blankStr(defaults?.permasalahanUtama)} />
                    </div>
                </Grid>
            </Section>

            {/* E – KONDISI KONSERVASI */}
            <Section title="E – Kondisi Konservasi">
                <div className="space-y-4">
                    <YesNoField name="berbatasanKonservasi" label="Berbatasan dengan Kawasan Konservasi" defaultValue={defaults?.berbatasanKonservasi ?? false} />
                    <Grid>
                        <Field label="Luas Kawasan Penyangga" name="luasPenyanggaHa" type="number" unit="Ha" defaultValue={blankNum(defaults?.luasPenyanggaHa)} />
                        <FieldUnitSelect
                            label="Tutupan Hutan" name="tutupanHutan" unitName="tutupanHutanSatuan"
                            options={[{ value: "PERSEN", label: "%" }, { value: "HA", label: "Ha" }]}
                            defaultValue={blankNum(defaults?.tutupanHutan) as number | undefined}
                            defaultUnit={defaults?.tutupanHutanSatuan}
                        />
                        <FieldUnitSelect
                            label="Tutupan Agroforestry" name="tutupanAgroforestry" unitName="tutupanAgroforestrySatuan"
                            options={[{ value: "PERSEN", label: "%" }, { value: "HA", label: "Ha" }]}
                            defaultValue={blankNum(defaults?.tutupanAgroforestry) as number | undefined}
                            defaultUnit={defaults?.tutupanAgroforestrySatuan}
                        />
                    </Grid>
                    <div className="space-y-3">
                        <YesNoField name="rawanLongsor" label="Daerah Rawan Longsor" revealName="lokasiRawanLongsor" revealPlaceholder="Lokasi rawan longsor" defaultValue={defaults?.rawanLongsor ?? false} revealDefault={blankStr(defaults?.lokasiRawanLongsor) as string} />
                        <YesNoField name="rawanErosi" label="Daerah Rawan Erosi" revealName="lokasiRawanErosi" revealPlaceholder="Lokasi rawan erosi" defaultValue={defaults?.rawanErosi ?? false} revealDefault={blankStr(defaults?.lokasiRawanErosi) as string} />
                        <YesNoField name="konflikSatwa" label="Konflik Satwa" revealName="jenisSatwaKonflik" revealPlaceholder="Jenis satwa" defaultValue={defaults?.konflikSatwa ?? false} revealDefault={blankStr(defaults?.jenisSatwaKonflik) as string} />
                    </div>
                    <Field label="Praktik Konservasi yang Sudah Ada" name="praktikKonservasi" defaultValue={blankStr(defaults?.praktikKonservasi)} />
                </div>
            </Section>

            <div className="flex justify-end pb-10">
                <SubmitButton />
            </div>
        </form>
    );
}