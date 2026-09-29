// app/(main)/petani/[id]/export/docx/builder.ts
import {
    AlignmentType, BorderStyle, Document, ExternalHyperlink, Packer, PageOrientation,
    Paragraph, Table, TableCell, TableRow, TextRun, WidthType, VerticalAlign,
} from "docx";
import type { PetaniExportModel } from "@/app/(main)/petani/export-model";

const border = { style: BorderStyle.SINGLE, size: 2, color: "999999" } as const;
const borders = { top: border, bottom: border, left: border, right: border };
const margins = { top: 100, bottom: 100, left: 110, right: 110 };

function txt(text: string, bold = false, size = 20, color?: string) {
    return new TextRun({ text, bold, size, font: "Calibri", color });
}

function cell(text: string, opts?: {
    bold?: boolean; width?: number; fill?: string; color?: string; rowSpan?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
}) {
    return new TableCell({
        borders, margins,
        verticalAlign: VerticalAlign.CENTER,
        width: opts?.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
        shading: opts?.fill ? { fill: opts.fill } : undefined,
        rowSpan: opts?.rowSpan,
        children: [
            new Paragraph({
                alignment: opts?.align,
                children: text.split("\n").map((line, i) =>
                    new TextRun({
                        text: line, bold: opts?.bold, color: opts?.color,
                        size: 20, font: "Calibri", break: i > 0 ? 1 : undefined,
                    })
                ),
            }),
        ],
    });
}

// Header kolom: bold + abu + rata tengah
function head(text: string, width: number) {
    return cell(text, { bold: true, width, fill: "E5E5E5", align: AlignmentType.CENTER });
}

function tick(on: boolean, width: number) {
    return cell(on ? "✓" : "", { width, align: AlignmentType.CENTER });
}

function heading(text: string) {
    return new Paragraph({ spacing: { before: 280, after: 120 }, children: [txt(text, true, 22)] });
}

const spacer = () => new Paragraph({ children: [], spacing: { after: 60 } });

function fotoCell(r: { fotoUrl: string | null; fotoKoordinat: string | null }) {
    const children: Paragraph[] = [];
    if (r.fotoUrl) {
        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ExternalHyperlink({
                        link: r.fotoUrl,
                        children: [new TextRun({ text: "Lihat foto", color: "1D4ED8", underline: {}, size: 20, font: "Calibri" })],
                    }),
                ],
            })
        );
        if (r.fotoKoordinat) {
            children.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: r.fotoKoordinat, size: 14, color: "666666", font: "Calibri" })],
                })
            );
        }
    } else {
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [txt("-")] }));
    }
    return new TableCell({
        borders, margins,
        verticalAlign: VerticalAlign.CENTER,
        width: { size: 13, type: WidthType.PERCENTAGE },
        children,
    });
}

export async function buildPetaniDocx(m: PetaniExportModel): Promise<Buffer> {
    // ---------- A ----------
    const aTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: m.sectionA.map(([k, v]) =>
            new TableRow({
                children: [
                    cell(k, { width: 38, fill: "E5E5E5", bold: true }),
                    cell(v),
                ],
            })
        ),
    });

    const petugasTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            ["Kode Petani / ID_Petani", m.petugas.kodePetani],
            ["Nama Kelompok Tani", m.petugas.namaKelompok],
            ["Kode Kelompok Tani", m.petugas.kodeKelompok],
        ].map(([k, v]) =>
            new TableRow({
                children: [
                    cell(k, { width: 38, fill: "FDEEEA", bold: true, color: "C62828" }),
                    cell(v),
                ],
            })
        ),
    });

    // ---------- B ----------
    const bChildren: (Paragraph | Table)[] = [heading("B.1 - DATA FISIK LOKASI PLOT")];
    if (m.sectionB1.length === 0) {
        bChildren.push(new Paragraph({ children: [txt("Belum ada data plot.")] }));
    } else {
        bChildren.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            head("Plot No.", 6), head("Nama/ Hamparan", 16), head("Varietas Kopi", 16),
                            head("Tahun Tanam", 10), head("Kode GPS", 14), head("Elevasi (mdpl)", 12),
                            head("Kemiringan (%)", 12), head("Luas Kopi (Ha)", 14),
                        ],
                    }),
                    ...m.sectionB1.map((r) =>
                        new TableRow({
                            children: [
                                cell(r[0], { width: 6, align: AlignmentType.CENTER }),
                                cell(r[1], { width: 16 }),
                                cell(r[2], { width: 16 }),
                                cell(r[3], { width: 10, align: AlignmentType.CENTER }),
                                cell(r[4], { width: 14 }),
                                cell(r[5], { width: 12, align: AlignmentType.CENTER }),
                                cell(r[6], { width: 12, align: AlignmentType.CENTER }),
                                cell(r[7], { width: 14, align: AlignmentType.CENTER }),
                            ],
                        })
                    ),
                ],
            })
        );
    }

    if (m.sectionB1b.length > 0) {
        bChildren.push(heading("B.1 - DATA FISIK LOKASI PLOT (lanjutan)"));
        bChildren.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            head("Plot No.", 5), head("Foto Geotagged", 13), head("Status Kepemilikan Lahan", 12),
                            head("Sistem Budidaya", 10), head("Area Konservasi", 18), head("Tanaman Baru", 11),
                            head("Pohon Produktif", 11), head("Pohon Tdk Produktif", 11), head("Pestisida Terakhir", 9),
                        ],
                    }),
                    ...m.sectionB1b.map((r) =>
                        new TableRow({
                            children: [
                                cell(r.no, { width: 5, align: AlignmentType.CENTER }),
                                fotoCell(r),
                                cell(r.status, { width: 12, align: AlignmentType.CENTER }),
                                cell(r.sistem, { width: 10, align: AlignmentType.CENTER }),
                                cell(r.konservasi, { width: 18 }),
                                cell(r.tanamanBaru, { width: 11, align: AlignmentType.CENTER }),
                                cell(r.pohonProduktif, { width: 11, align: AlignmentType.CENTER }),
                                cell(r.pohonTidakProduktif, { width: 11, align: AlignmentType.CENTER }),
                                cell(r.pestisida, { width: 9 }),
                            ],
                        })
                    ),
                ],
            })
        );
        bChildren.push(
            new Paragraph({
                spacing: { before: 80 },
                children: [txt("Kode Kepemilikan: MS = Milik Sendiri  |  SW = Sewa  |  BH = Bagi Hasil  |  TA = Tanah Adat  |  L = Lainnya      Kode Sistem Budidaya: AF = Agroforestry  |  MK = Monokultur", false, 16, "444444")],
            })
        );
    }

    if (m.sectionB2.length > 0) {
        bChildren.push(heading("B.2 - DATA FISIK LOKASI PLOT (lanjutan) - TANAMAN NAUNGAN, SELA, TEGAKAN"));
        bChildren.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            head("Plot No.", 6), head("Jenis Naungan/Sela/Tegakan", 20), head("Jumlah", 10),
                            head("Fungsi", 20), head("Apakah di lakukan Pemangkasan", 16),
                            head("Produksi/Tahun", 16), head("Tahun Tanam", 12),
                        ],
                    }),
                    ...m.sectionB2.map((r) =>
                        new TableRow({
                            children: [
                                cell(r[0], { width: 6, align: AlignmentType.CENTER }),
                                cell(r[1], { width: 20 }),
                                cell(r[2], { width: 10, align: AlignmentType.CENTER }),
                                cell(r[3], { width: 20 }),
                                cell(r[4], { width: 16, align: AlignmentType.CENTER }),
                                cell(r[5], { width: 16 }),
                                cell(r[6], { width: 12, align: AlignmentType.CENTER }),
                            ],
                        })
                    ),
                ],
            })
        );
    }

    // ---------- C (kelompok di-merge dengan rowSpan sungguhan) ----------
    const cTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                tableHeader: true,
                children: [
                    head(" ", 16), head("Jenis Praktik", 40), head("Ya", 7),
                    head("Tidak", 8), head("Kadang", 9), head("Keterangan", 20),
                ],
            }),
            ...m.sectionC.flatMap((g) =>
                g.rows.map((r, i) =>
                    new TableRow({
                        children: [
                            ...(i === 0 ? [cell(g.kelompok, { bold: true, width: 16, rowSpan: g.rows.length })] : []),
                            cell(r.label, { width: 40 }),
                            tick(r.jawaban === "YA", 7),
                            tick(r.jawaban === "TIDAK", 8),
                            tick(r.jawaban === "KADANG", 9),
                            cell(r.keterangan, { width: 20 }),
                        ],
                    })
                )
            ),
        ],
    });

    // ---------- D ----------
    const dTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                tableHeader: true,
                children: [
                    head("Tahun", 16), head("Satuan (Kg, Solup, Bambu, Kaleng)", 12), head("Cherry", 13),
                    head("Gabah Basah / Labu", 15), head("Gabah Kering", 14),
                    head("Green Bean", 14), head("Produktivitas", 16),
                ],
            }),
            ...m.sectionD.map((r) =>
                new TableRow({
                    children: [
                        cell(r[0], { width: 16, bold: true }),
                        cell(r[1], { width: 12, align: AlignmentType.CENTER }),
                        cell(r[2], { width: 13, align: AlignmentType.CENTER }),
                        cell(r[3], { width: 15, align: AlignmentType.CENTER }),
                        cell(r[4], { width: 14, align: AlignmentType.CENTER }),
                        cell(r[5], { width: 14, align: AlignmentType.CENTER }),
                        cell(r[6], { width: 16, align: AlignmentType.CENTER }),
                    ],
                })
            ),
        ],
    });

    // ---------- E.1 ----------
    const e1Table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                tableHeader: true,
                children: [head("Jenis Produk", 55), head("Ya", 10), head("Tidak", 10), head("Volume (Kg/Tahun)", 25)],
            }),
            ...m.sectionE1.map((r) =>
                new TableRow({
                    children: [
                        cell(r.label, { width: 55 }),
                        tick(r.aktif, 10),
                        tick(!r.aktif, 10),
                        cell(r.volume, { width: 25, align: AlignmentType.CENTER }),
                    ],
                })
            ),
        ],
    });

    // ---------- E.2 ----------
    const e2Table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                tableHeader: true,
                children: [
                    head("Kategori Pasar", 40), head("Ya", 10), head("Tidak", 10),
                    head("Persentase (%)", 12), head("Profil Penjual (Pengepul, Pabrik, Ekspor, dll.)", 28),
                ],
            }),
            ...m.sectionE2.map((r) =>
                new TableRow({
                    children: [
                        cell(r.label, { width: 40 }),
                        tick(r.aktif, 10),
                        tick(!r.aktif, 10),
                        cell(r.persentase, { width: 12, align: AlignmentType.CENTER }),
                        cell(r.profil, { width: 28 }),
                    ],
                })
            ),
        ],
    });

    // ---------- F ----------
    const fTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                tableHeader: true,
                children: [head("Kondisi Kebun", 50), head("Ya", 9), head("Tidak", 9), head("Keterangan", 32)],
            }),
            ...m.sectionF.map((r) =>
                new TableRow({
                    children: [
                        cell(r.label, { width: 50 }),
                        tick(r.jawaban, 9),
                        tick(!r.jawaban, 9),
                        cell(r.keterangan, { width: 32 }),
                    ],
                })
            ),
        ],
    });

    const P = PageOrientation.PORTRAIT;

    const doc = new Document({
        sections: [
            // A (portrait) — Word otomatis page break antar section
            {
                properties: { page: { size: { orientation: P } } },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [txt("FORMULIR DATA BASELINE PETANI KOPI", true, 28)],
                    }),
                    heading("A - DATA IDENTITAS PETANI"),
                    aTable,
                    spacer(),
                    petugasTable,
                ],
            },
            // B (landscape)
            {
                properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
                children: bChildren,
            },
            // C (portrait)
            {
                properties: { page: { size: { orientation: P } } },
                children: [heading("C - PRAKTIK GAP KEBUN"), cTable],
            },
            // D + E (portrait, satu section — tanpa break antar sesi)
            {
                properties: { page: { size: { orientation: P } } },
                children: [
                    heading("D - RIWAYAT ESTIMASI PRODUKSI"), dTable,
                    heading("E.1 - JENIS PRODUK YANG DIJUAL"), e1Table,
                    heading("E.2 - KATEGORI PASAR"), e2Table,
                ],
            },
            // F (portrait)
            {
                properties: { page: { size: { orientation: P } } },
                children: [heading("F - KONDISI KEBUN"), fTable],
            },
        ],
    });
    return Packer.toBuffer(doc);
}