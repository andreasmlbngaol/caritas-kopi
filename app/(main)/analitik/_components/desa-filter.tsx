"use client";

import { useId, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter } from "lucide-react";

export type DesaOption = { kode: string; nama: string; kecamatan: string };

// Dropdown filter desa. Nilai disimpan di query string (?desa=kode) agar
// bisa dibaca server component tanpa state tambahan.
export function DesaFilter({
    options, value = "", label = "Filter desa", className = "",
}: {
    options: DesaOption[];
    value?: string;
    label?: string;
    className?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [pending, startTransition] = useTransition();
    const id = useId();

    function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const qs = new URLSearchParams(searchParams.toString());
        if (e.target.value) qs.set("desa", e.target.value);
        else qs.delete("desa");
        const query = qs.toString();
        startTransition(() => {
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        });
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <label htmlFor={id} className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-600">
                <Filter size={14} className="text-jade-700" />
                {label}
            </label>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    disabled={pending}
                    className="w-full cursor-pointer appearance-none rounded-xl bg-white py-2 pl-3 pr-9 text-sm ring-1 ring-inset ring-gray-300 outline-none transition focus:ring-2 focus:ring-inset focus:ring-jade-700 disabled:cursor-wait disabled:text-gray-400"
                >
                    <option value="">Semua desa (gabungan)</option>
                    {options.map((d) => (
                        <option key={d.kode} value={d.kode}>
                            {d.nama} - {d.kecamatan}
                        </option>
                    ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
        </div>
    );
}
