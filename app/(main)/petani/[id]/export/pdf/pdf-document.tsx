// app/(main)/petani/[id]/export/pdf/pdf-document.tsx
import {
    Document, Font, Link, Page, Path, StyleSheet, Svg, Text, View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { PetaniExportModel } from "@/app/(main)/petani/export-model";

Font.registerHyphenationCallback((word) => [word]);

const C = {
    border: "#999", label: "#e5e5e5", header: "#e5e5e5",
    link: "#1d4ed8", red: "#c62828", redFill: "#fdeaea",
};

const s = StyleSheet.create({
    page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
    title: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "center" },
    sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6 },
    legend: { fontSize: 8, color: "#444", marginTop: 4 },
    table: { borderTopWidth: 0.8, borderLeftWidth: 0.8, borderColor: C.border },
    row: { flexDirection: "row" },
    link: { color: C.link, textDecoration: "underline" },
});

function Cell({
                  width, flex, fill, bold, center, color, children,
              }: {
    width?: string; flex?: boolean; fill?: string; bold?: boolean; center?: boolean;
    color?: string; children?: string;
}) {
    return (
        <View
            style={{
                paddingVertical: 6, paddingHorizontal: 7,
                borderRightWidth: 0.8, borderBottomWidth: 0.8, borderColor: C.border,
                justifyContent: "center",
                ...(width !== undefined ? { width } : {}),
                ...(flex ? { flex: 1 } : {}),
                ...(fill ? { backgroundColor: fill } : {}),
                ...(center ? { alignItems: "center" as const } : {}),
            }}
        >
            {(children ?? "").split("\n").map((line, i) => (
                <Text
                    key={i}
                    style={{
                        ...(bold ? { fontFamily: "Helvetica-Bold" } : {}),
                        ...(color ? { color } : {}),
                        ...(center ? { textAlign: "center" as const } : {}),
                    }}
                >
                    {line}
                </Text>
            ))}
        </View>
    );
}

// Header kolom: bold + rata tengah horizontal & vertikal
function Head({ width, children }: { width: string; children: string }) {
    return <Cell width={width} fill={C.header} bold center>{children}</Cell>;
}

function LinkCell({ width, src, text }: { width: string; src: string | null; text: string }) {
    return (
        <View
            style={{
                paddingVertical: 6, paddingHorizontal: 7,
                borderRightWidth: 0.8, borderBottomWidth: 0.8, borderColor: C.border,
                justifyContent: "center", alignItems: "center", width,
            }}
        >
            {src ? (
                <>
                    <Link src={src} style={s.link}>{text}</Link>
                </>
            ) : (
                <Text>-</Text>
            )}
        </View>
    );
}

function Tick({ on }: { on: boolean }) {
    return (
        <View
            style={{
                width: 10, height: 10, borderWidth: 0.8, borderColor: "#333",
                alignItems: "center", justifyContent: "center",
            }}
        >
            {on && (
                <Svg width={7} height={7} viewBox="0 0 10 10">
                    <Path d="M1.5 5.5 L4 8 L8.5 2" stroke="#111" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            )}
        </View>
    );
}

function TickCell({ width, on }: { width: string; on: boolean }) {
    return (
        <View
            style={{
                paddingVertical: 6, paddingHorizontal: 7,
                borderRightWidth: 0.8, borderBottomWidth: 0.8, borderColor: C.border,
                justifyContent: "center", alignItems: "center", width,
            }}
        >
            <Tick on={on} />
        </View>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View wrap={false} style={{ marginTop: 14 }}>
            <Text style={s.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

// Tabel gabungan D (dengan header), dipakai di halaman D+E
function TabelD({ m }: { m: PetaniExportModel }) {
    return (
        <View style={s.table}>
            <View style={s.row} wrap={false}>
                <Head width="16%">Tahun</Head>
                <Head width="12%">Satuan (Kg, Solup, Bambu, Kaleng)</Head>
                <Head width="13%">Cherry</Head>
                <Head width="15%">Gabah Basah / Labu</Head>
                <Head width="14%">Gabah Kering</Head>
                <Head width="14%">Green Bean</Head>
                <Head width="16%">Produktivitas</Head>
            </View>
            {m.sectionD.map((r, i) => (
                <View key={i} style={s.row} wrap={false}>
                    <Cell width="16%" bold>{r[0]}</Cell>
                    <Cell width="12%" center>{r[1]}</Cell>
                    <Cell width="13%" center>{r[2]}</Cell>
                    <Cell width="15%" center>{r[3]}</Cell>
                    <Cell width="14%" center>{r[4]}</Cell>
                    <Cell width="14%" center>{r[5]}</Cell>
                    <Cell width="16%" center>{r[6]}</Cell>
                </View>
            ))}
        </View>
    );
}

const pageNum = (
    <Text
        fixed
        style={{ position: "absolute", bottom: 20, right: 36, fontSize: 7, color: "#999" }}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
    />
);

export function PetaniPdf({ m }: { m: PetaniExportModel }) {
    return (
        <Document>
            {/* ================= HALAMAN 1: A (portrait) ================= */}
            <Page size="A4" orientation="portrait" style={s.page}>
                <Text style={s.title}>FORMULIR DATA BASELINE PETANI KOPI</Text>

                <Section title="A - DATA IDENTITAS PETANI">
                    <View style={s.table}>
                        {m.sectionA.map(([k, v]) => (
                            <View key={k} style={s.row} wrap={false}>
                                <Cell width="38%" fill={C.label} bold>{k}</Cell>
                                <Cell flex>{v}</Cell>
                            </View>
                        ))}
                    </View>

                    {/* Tabel terpisah untuk blok petugas - dipisah satu baris kosong */}
                    <View style={[s.table, { marginTop: 10 }]}>
                        <View style={s.row} wrap={false}>
                            <Cell width="38%" fill={C.redFill} bold color={C.red}>Kode Petani / ID_Petani</Cell>
                            <Cell flex>{m.petugas.kodePetani}</Cell>
                        </View>
                        <View style={s.row} wrap={false}>
                            <Cell width="38%" fill={C.redFill} bold color={C.red}>Nama Kelompok Tani</Cell>
                            <Cell flex>{m.petugas.namaKelompok}</Cell>
                        </View>
                        <View style={s.row} wrap={false}>
                            <Cell width="38%" fill={C.redFill} bold color={C.red}>Kode Kelompok Tani</Cell>
                            <Cell flex>{m.petugas.kodeKelompok}</Cell>
                        </View>
                    </View>
                </Section>
                {pageNum}
            </Page>

            {/* ================= HALAMAN 2: B (landscape) ================= */}
            <Page size="A4" orientation="landscape" style={s.page}>
                <Section title="B.1 - DATA FISIK LOKASI PLOT">
                    {m.sectionB1.length === 0 ? (
                        <Text>Belum ada data plot.</Text>
                    ) : (
                        <View style={s.table}>
                            <View style={s.row} wrap={false}>
                                <Head width="6%">Plot No.</Head>
                                <Head width="16%">Nama/ Hamparan</Head>
                                <Head width="16%">Varietas Kopi</Head>
                                <Head width="10%">Tahun Tanam</Head>
                                <Head width="14%">Kode GPS</Head>
                                <Head width="12%">Elevasi (mdpl)</Head>
                                <Head width="12%">Kemiringan (%)</Head>
                                <Head width="14%">Luas Kopi (Ha)</Head>
                            </View>
                            {m.sectionB1.map((r, i) => (
                                <View key={i} style={s.row} wrap={false}>
                                    <Cell width="6%" center>{r[0]}</Cell>
                                    <Cell width="16%">{r[1]}</Cell>
                                    <Cell width="16%">{r[2]}</Cell>
                                    <Cell width="10%" center>{r[3]}</Cell>
                                    <Cell width="14%">{r[4]}</Cell>
                                    <Cell width="12%" center>{r[5]}</Cell>
                                    <Cell width="12%" center>{r[6]}</Cell>
                                    <Cell width="14%" center>{r[7]}</Cell>
                                </View>
                            ))}
                        </View>
                    )}
                </Section>

                {m.sectionB1b.length > 0 && (
                    <Section title="B.1 - DATA FISIK LOKASI PLOT (lanjutan)">
                        <View style={s.table}>
                            <View style={s.row} wrap={false}>
                                <Head width="5%">Plot No.</Head>
                                <Head width="13%">Foto Geotagged</Head>
                                <Head width="12%">Status Kepemilikan Lahan</Head>
                                <Head width="10%">Sistem Budidaya</Head>
                                <Head width="18%">Area Konservasi</Head>
                                <Head width="11%">Tanaman Baru</Head>
                                <Head width="11%">Pohon Produktif</Head>
                                <Head width="11%">Pohon Tdk Produktif</Head>
                                <Head width="9%">Pestisida Terakhir</Head>
                            </View>
                            {m.sectionB1b.map((r, i) => (
                                <View key={i} style={s.row} wrap={false}>
                                    <Cell width="5%" center>{r.no}</Cell>
                                    <LinkCell width="13%" src={r.fotoUrl} text="Lihat foto" />
                                    <Cell width="12%" center>{r.status}</Cell>
                                    <Cell width="10%" center>{r.sistem}</Cell>
                                    <Cell width="18%">{r.konservasi}</Cell>
                                    <Cell width="11%" center>{r.tanamanBaru}</Cell>
                                    <Cell width="11%" center>{r.pohonProduktif}</Cell>
                                    <Cell width="11%" center>{r.pohonTidakProduktif}</Cell>
                                    <Cell width="9%">{r.pestisida}</Cell>
                                </View>
                            ))}
                        </View>
                        <Text style={s.legend}>
                            Kode Kepemilikan: MS = Milik Sendiri  |  SW = Sewa  |  BH = Bagi Hasil  |  TA = Tanah Adat  |  L = Lainnya
                            {"    "}
                            Kode Sistem Budidaya: AF = Agroforestry  |  MK = Monokultur
                        </Text>
                    </Section>
                )}

                <Section title="B.2 - DATA TANAMAN NAUNGAN / SELA / TEGAKAN (TINGKAT PETANI)">
                    {m.sectionB2.length === 0 ? (
                        <Text>Tidak ada Tanaman Naungan, Sela, Tegakan.</Text>
                    ) : (
                        <View style={s.table}>
                            <View style={s.row} wrap={false}>
                                <Head width="6%">No.</Head>
                                <Head width="20%">Jenis Naungan/Sela/Tegakan</Head>
                                <Head width="9%">Jumlah</Head>
                                <Head width="20%">Fungsi</Head>
                                <Head width="15%">Apakah dilakukan pemangkasan</Head>
                                <Head width="18%">Produksi/Tahun</Head>
                                <Head width="12%">Tahun Tanam</Head>
                            </View>
                            {m.sectionB2.map((r, i) => (
                                <View key={i} style={s.row} wrap={false}>
                                    <Cell width="6%" center>{r[0]}</Cell>
                                    <Cell width="20%">{r[1]}</Cell>
                                    <Cell width="9%" center>{r[2]}</Cell>
                                    <Cell width="20%">{r[3]}</Cell>
                                    <Cell width="15%" center>{r[4]}</Cell>
                                    <Cell width="18%">{r[5]}</Cell>
                                    <Cell width="12%" center>{r[6]}</Cell>
                                </View>
                            ))}
                        </View>
                    )}
                </Section>
                {pageNum}
            </Page>

            {/* ================= HALAMAN 3: C (portrait) ================= */}
            <Page size="A4" orientation="portrait" style={s.page}>
                <Section title="C - PRAKTIK GAP KEBUN">
                    <View style={s.table}>
                        <View style={s.row} wrap={false}>
                            <Head width="16%"> </Head>
                            <Head width="35%">Jenis Praktik</Head>
                            <Head width="7%">Ya</Head>
                            <Head width="8%">Tidak</Head>
                            <Head width="9%">Kadang</Head>
                            <Head width="25%">Keterangan</Head>
                        </View>
                    </View>
                    {m.sectionC.map((g) => (
                        // Satu View per kelompok: sel label di-merge vertikal (satu sel besar di kiri)
                        <View key={g.kelompok} style={{ flexDirection: "row" }} wrap={false}>
                            <View
                                style={{
                                    width: "16%",
                                    borderRightWidth: 0.8,
                                    borderBottomWidth: 0.8,
                                    borderLeftWidth: 0.8,
                                    borderColor: C.border,
                                    justifyContent: "center",
                                    paddingVertical: 6,
                                    paddingHorizontal: 7,
                                }}
                            >
                                <Text style={{ fontFamily: "Helvetica-Bold" }}>{g.kelompok}</Text>
                            </View>
                            <View style={{ width: "84%", borderLeftWidth: -0.8 }}>
                                {g.rows.map((r, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            s.row,
                                            {
                                                borderTopWidth: 0.8,
                                                borderLeftWidth: 0.8,
                                                borderColor: C.border,
                                                marginLeft: -0.8,
                                            },
                                        ]}
                                        wrap={false}
                                    >
                                        <Cell width="41.7%">{r.label}</Cell>
                                        <TickCell width="8.4%" on={r.jawaban === "YA"} />
                                        <TickCell width="9.5%" on={r.jawaban === "TIDAK"} />
                                        <TickCell width="10.7%" on={r.jawaban === "KADANG"} />
                                        <Cell width="29.7%">{r.keterangan}</Cell>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </Section>
                {pageNum}
            </Page>

            {/* ================= HALAMAN 4: D + E (portrait, tanpa break antar sesi) ================= */}
            <Page size="A4" orientation="portrait" style={s.page}>
                <Section title="D - RIWAYAT ESTIMASI PRODUKSI">
                    <TabelD m={m} />
                </Section>

                <Section title="E.1 - JENIS PRODUK YANG DIJUAL">
                    <View style={s.table}>
                        <View style={s.row} wrap={false}>
                            <Head width="55%">Jenis Produk</Head>
                            <Head width="10%">Ya</Head>
                            <Head width="10%">Tidak</Head>
                            <Head width="25%">Volume (Kg/Tahun)</Head>
                        </View>
                        {m.sectionE1.map((r, i) => (
                            <View key={i} style={s.row} wrap={false}>
                                <Cell width="55%">{r.label}</Cell>
                                <TickCell width="10%" on={r.aktif} />
                                <TickCell width="10%" on={!r.aktif} />
                                <Cell width="25%" center>{r.volume}</Cell>
                            </View>
                        ))}
                    </View>
                </Section>

                <Section title="E.2 - KATEGORI PASAR">
                    <View style={s.table}>
                        <View style={s.row} wrap={false}>
                            <Head width="40%">Kategori Pasar</Head>
                            <Head width="10%">Ya</Head>
                            <Head width="10%">Tidak</Head>
                            <Head width="12%">Persentase (%)</Head>
                            <Head width="28%">Profil Penjual (Pengepul, Pabrik, Ekspor, dll.)</Head>
                        </View>
                        {m.sectionE2.map((r, i) => (
                            <View key={i} style={s.row} wrap={false}>
                                <Cell width="40%">{r.label}</Cell>
                                <TickCell width="10%" on={r.aktif} />
                                <TickCell width="10%" on={!r.aktif} />
                                <Cell width="12%" center>{r.persentase}</Cell>
                                <Cell width="28%">{r.profil}</Cell>
                            </View>
                        ))}
                    </View>
                </Section>
                {pageNum}
            </Page>

            {/* ================= HALAMAN 5: F (portrait) ================= */}
            <Page size="A4" orientation="portrait" style={s.page}>
                <Section title="F - KONDISI KEBUN">
                    <View style={s.table}>
                        <View style={s.row} wrap={false}>
                            <Head width="50%">Kondisi Kebun</Head>
                            <Head width="9%">Ya</Head>
                            <Head width="9%">Tidak</Head>
                            <Head width="32%">Keterangan</Head>
                        </View>
                        {m.sectionF.map((r, i) => (
                            <View key={i} style={s.row} wrap={false}>
                                <Cell width="50%">{r.label}</Cell>
                                <TickCell width="9%" on={r.jawaban} />
                                <TickCell width="9%" on={!r.jawaban} />
                                <Cell width="32%">{r.keterangan}</Cell>
                            </View>
                        ))}
                    </View>
                </Section>
                {pageNum}
            </Page>
        </Document>
    );
}