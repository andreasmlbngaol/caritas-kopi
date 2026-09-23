// app/(main)/desa/[id]/export/pdf/pdf-document.tsx
import {
    Document, Font, Page, Path, StyleSheet, Svg, Text, View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { DesaExportModel } from "@/app/(main)/desa/export-model";

// Kata tidak dipotong tanda hubung — "Kecamatan" turun utuh
Font.registerHyphenationCallback((word) => [word]);

const C = { border: "#999", label: "#e5e5e5", header: "#e5e5e5" };

const s = StyleSheet.create({
    page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
    title: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "center" },
    sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6 },
    table: { borderTopWidth: 0.8, borderLeftWidth: 0.8, borderColor: C.border },
    row: { flexDirection: "row" },
});

// Sel dasar: props primitif saja, tidak ada objek style dari luar
function Cell({
                  width, flex, fill, bold, center, children,
              }: {
    width?: string;
    flex?: boolean;
    fill?: string;
    bold?: boolean;
    center?: boolean;
    children: string;
}) {
    return (
        <View
            style={{
                paddingVertical: 6,
                paddingHorizontal: 7,
                borderRightWidth: 0.8,
                borderBottomWidth: 0.8,
                borderColor: C.border,
                justifyContent: "center",
                ...(width !== undefined ? { width } : {}),
                ...(flex ? { flex: 1 } : {}),
                ...(fill ? { backgroundColor: fill } : {}),
                ...(center ? { alignItems: "center" as const } : {}),
            }}
        >
            {children.split("\n").map((line, i) => (
                <Text key={i} style={bold ? { fontFamily: "Helvetica-Bold" } : undefined}>
                    {line}
                </Text>
            ))}
        </View>
    );
}

// Label section A: bold + bg gelap
function LabelCellA({ width, children }: { width: string; children: string }) {
    return <Cell width={width} fill={C.label} bold>{children}</Cell>;
}

// Label D/E: satuan "(…)" di ujung → italic + lebih kecil
function LabelCell({ width, children }: { width: string; children: string }) {
    const m = children.match(/^(.*?)\s*(\([^)]*\))$/);
    return (
        <View
            style={{
                paddingVertical: 6,
                paddingHorizontal: 7,
                borderRightWidth: 0.8,
                borderBottomWidth: 0.8,
                borderColor: C.border,
                justifyContent: "center",
                width,
                backgroundColor: C.label,
            }}
        >
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
                {m ? `${m[1]} ` : children}
                {m && (
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Oblique" }}>{m[2]}</Text>
                )}
            </Text>
        </View>
    );
}

function KVTable({ rows, labelWidth = "42%" }: { rows: [string, string][]; labelWidth?: string }) {
    return (
        <View style={s.table}>
            {rows.map(([k, v]) => (
                <View key={k} style={s.row} wrap={false}>
                    <LabelCell width={labelWidth}>{k}</LabelCell>
                    <Cell flex>{v}</Cell>
                </View>
            ))}
        </View>
    );
}

function FourColTable({ pairs }: { pairs: DesaExportModel["sectionA"] }) {
    return (
        <View style={s.table}>
            {pairs.map((p, i) => (
                <View key={i} style={s.row} wrap={false}>
                    <LabelCellA width="21%">{p.left[0]}</LabelCellA>
                    <Cell width="29%">{p.left[1]}</Cell>
                    <LabelCellA width="21%">{p.right[0]}</LabelCellA>
                    <Cell width="29%">{p.right[1]}</Cell>
                </View>
            ))}
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

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View wrap={false} style={{ marginTop: 14 }}>
            <Text style={s.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

export function DesaPdf({ m }: { m: DesaExportModel }) {
    return (
        <Document>
            <Page size="A4" style={s.page}>
                <Text style={s.title}>FORMULIR DATA BASELINE DESA</Text>

                <Section title="A – DATA DESA / WILAYAH">
                    <FourColTable pairs={m.sectionA} />
                </Section>

                <Section title="B – KEBIJAKAN LOKAL">
                    <View style={s.table}>
                        <View style={s.row} wrap={false}>
                            <Cell width="40%" fill={C.header} bold center>KEBIJAKAN LOKAL</Cell>
                            <Cell width="10%" fill={C.header} bold center>ADA</Cell>
                            <Cell width="10%" fill={C.header} bold center>TIDAK</Cell>
                            <Cell width="40%" fill={C.header} bold center>KETERANGAN</Cell>
                        </View>
                        {m.sectionB.map((r) => (
                            <View key={r.label} style={s.row} wrap={false}>
                                <Cell width="40%">{r.label}</Cell>
                                <View
                                    style={{
                                        paddingVertical: 6, paddingHorizontal: 7,
                                        borderRightWidth: 0.8, borderBottomWidth: 0.8, borderColor: C.border,
                                        justifyContent: "center", alignItems: "center", width: "10%",
                                    }}
                                >
                                    <Tick on={r.ada} />
                                </View>
                                <View
                                    style={{
                                        paddingVertical: 6, paddingHorizontal: 7,
                                        borderRightWidth: 0.8, borderBottomWidth: 0.8, borderColor: C.border,
                                        justifyContent: "center", alignItems: "center", width: "10%",
                                    }}
                                >
                                    <Tick on={!r.ada} />
                                </View>
                                <Cell width="40%">{r.keterangan}</Cell>
                            </View>
                        ))}
                    </View>
                </Section>

                <Section title="C – KELEMBAGAAN">
                    <View style={s.table}>
                        <View style={s.row} wrap={false}>
                            <Cell width="30%" fill={C.header} bold center>LEMBAGA</Cell>
                            <Cell width="20%" fill={C.header} bold center>JUMLAH</Cell>
                            <Cell width="50%" fill={C.header} bold center>KONDISI</Cell>
                        </View>
                        {m.sectionC.map((r) => (
                            <View key={r.label} style={s.row} wrap={false}>
                                <Cell width="30%" fill={C.label} bold>{r.label}</Cell>
                                <Cell width="20%" center>{r.jumlah}</Cell>
                                <Cell width="50%">{r.kondisi}</Cell>
                            </View>
                        ))}
                    </View>
                </Section>

                {/* D kiri, E kanan */}
                <View wrap={false} style={{ marginTop: 14, flexDirection: "row", gap: 14 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.sectionTitle}>D – KONDISI BISNIS KOPI SAAT INI</Text>
                        <KVTable rows={m.sectionD} labelWidth="55%" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.sectionTitle}>E – KONDISI KONSERVASI</Text>
                        <KVTable rows={m.sectionE} labelWidth="55%" />
                    </View>
                </View>

                <Text
                    fixed
                    style={{ position: "absolute", bottom: 20, right: 36, fontSize: 7, color: "#999" }}
                    render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
                />
            </Page>
        </Document>
    );
}