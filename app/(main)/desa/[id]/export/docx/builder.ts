import {
    AlignmentType, BorderStyle, Document, Packer, Paragraph,
    Table, TableCell, TableRow, TextRun, WidthType, VerticalAlign
} from "docx";
import type { DesaExportModel } from "@/app/(main)/desa/export-model";

const border = { style: BorderStyle.SINGLE, size: 2, color: "999999" } as const;
const borders = { top: border, bottom: border, left: border, right: border };
const margins = { top: 100, bottom: 100, left: 110, right: 110 }; // ← sel lebih tinggi

function txt(text: string, bold = false, size = 20) {
    return new TextRun({ text, bold, size, font: "Calibri" });
}

function cell(text: string, opts?: { bold?: boolean; width?: number; fill?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
}) {
    return new TableCell({
        borders, margins,
        verticalAlign: VerticalAlign.CENTER,
        width: opts?.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
        shading: opts?.fill ? { fill: opts.fill } : undefined,
        children: [
            new Paragraph({
                alignment: opts?.align,
                children: text.split("\n").map((line, i) =>
                    new TextRun({
                        text: line,
                        bold: opts?.bold,
                        size: 20,
                        font: "Calibri",
                        break: i > 0 ? 1 : undefined, // ← line break sebelum baris ke-2 dst
                    })
                ),
            }),
        ],
    });
}

// Label D/E: satuan "(…)" italic + lebih kecil
function labelRuns(text: string): TextRun[] {
    const m = text.match(/^(.*?)\s*(\([^)]*\))$/);
    if (!m) return [txt(text, true)];
    return [
        txt(`${m[1]} `, true),
        new TextRun({ text: m[2], bold: true, italics: true, size: 16, font: "Calibri" }),
    ];
}

function kvTable(rows: [string, string][]) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map(([k, v]) =>
            new TableRow({
                children: [
                    new TableCell({
                        borders, margins,
                        verticalAlign: VerticalAlign.CENTER,
                        width: { size: 42, type: WidthType.PERCENTAGE },
                        shading: { fill: "E5E5E5" },
                        children: [new Paragraph({ children: labelRuns(k) })],
                    }),
                    cell(v),
                ],
            })
        ),
    });
}

// A: 12 baris × 4 kolom, label lebih gelap
function fourColTable(pairs: DesaExportModel["sectionA"]) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: pairs.map((p) =>
            new TableRow({
                children: [
                    cell(p.left[0], { width: 21, fill: "E5E5E5", bold: true }),
                    cell(p.left[1], { width: 29 }),
                    cell(p.right[0], { width: 21, fill: "E5E5E5", bold: true }),
                    cell(p.right[1], { width: 29 }),
                ],
            })
        ),
    });
}

function heading(text: string) {
    return new Paragraph({ spacing: { before: 280, after: 120 }, children: [txt(text, true, 22)] });
}

export async function buildDesaDocx(m: DesaExportModel): Promise<Buffer> {
    const bTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                tableHeader: true,
                children: [
                    cell("KEBIJAKAN LOKAL", { bold: true, fill: "E5E5E5", width: 40 }),
                    cell("ADA", { bold: true, fill: "E5E5E5", width: 10, align: AlignmentType.CENTER }),
                    cell("TIDAK", { bold: true, fill: "E5E5E5", width: 10, align: AlignmentType.CENTER }),
                    cell("KETERANGAN", { bold: true, fill: "E5E5E5", width: 40 }),
                ],
            }),
            ...m.sectionB.map((r) =>
                new TableRow({
                    children: [
                        cell(r.label),
                        cell(r.ada ? "✓" : "", { align: AlignmentType.CENTER }),
                        cell(!r.ada ? "✓" : "", { align: AlignmentType.CENTER }),
                        cell(r.keterangan),
                    ],
                })
            ),
        ],
    });

    const cTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                tableHeader: true,
                children: [
                    cell("LEMBAGA", { bold: true, fill: "E5E5E5", width: 30, align: AlignmentType.CENTER }),
                    cell("JUMLAH", { bold: true, fill: "E5E5E5", width: 20, align: AlignmentType.CENTER }),
                    cell("KONDISI", { bold: true, fill: "E5E5E5", width: 50, align: AlignmentType.CENTER }),
                ],
            }),
            ...m.sectionC.map((r) =>
                new TableRow({
                    children: [cell(r.label, { bold: true }), cell(r.jumlah, { align: AlignmentType.CENTER }), cell(r.kondisi)],
                })
            ),
        ],
    });

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [txt("FORMULIR DATA BASELINE DESA", true, 28)],
                }),
                heading("A – DATA DESA / WILAYAH"),
                fourColTable(m.sectionA),
                heading("B – KEBIJAKAN LOKAL"),
                bTable,
                heading("C – KELEMBAGAAN"),
                cTable,
                heading("D – KONDISI BISNIS KOPI SAAT INI"),
                kvTable(m.sectionD),
                heading("E – KONDISI KONSERVASI"),
                kvTable(m.sectionE),
            ],
        }],
    });
    return Packer.toBuffer(doc);
}