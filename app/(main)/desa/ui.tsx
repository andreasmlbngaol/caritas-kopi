// app/(main)/desa/ui.tsx
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export const inputCls =
    "w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-inset ring-gray-300 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-jade-700 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

export function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="mb-5 text-sm font-semibold tracking-tight">{title}</h2>
            {children}
        </section>
    );
}

export function SubSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {title}
            </h3>
            {children}
        </div>
    );
}

export function Grid({ children }: { children: ReactNode }) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function Field({
                          label, name, type = "text", required, hint, unit, defaultValue
                      }: {
    label: string; name: string; type?: string; required?: boolean; hint?: string; unit?: string; defaultValue?: string | number;
}) {
    return (
        <div>
            <label htmlFor={name} className="mb-1.5 block text-xs font-medium text-gray-600">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    id={name} name={name} type={type} required={required}
                    step={type === "number" ? "any" : undefined}
                    min={type === "number" ? 0 : undefined}   // ← tambahan
                    inputMode={type === "number" ? "decimal" : undefined}
                    className={`${inputCls} ${unit ? "pr-16" : ""}`}
                    defaultValue={defaultValue}
                />
                {unit && (
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-gray-400">
            {unit}
          </span>
                )}
            </div>
            {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
        </div>
    );
}

// Input angka + dropdown satuan kecil sebagai trailing content di dalam field
export function FieldUnitSelect({
                                    label, name, unitName, options, hint, required, defaultValue, defaultUnit,
                                }: {
    label: string; name: string; unitName: string;
    options: { value: string; label: string }[];
    hint?: string; required?: boolean;
    defaultValue?: number | null; defaultUnit?: string | null;
}) {
    return (
        <div>
            <label htmlFor={name} className="mb-1.5 block text-xs font-medium text-gray-600">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    id={name} name={name} type="number" required={required}
                    step="any" inputMode="decimal"
                    className={`${inputCls} pr-24`}
                    defaultValue={defaultValue ?? ""}
                />
                <div className="absolute inset-y-0 right-0 flex items-center border-l border-gray-200 pl-2 pr-1.5">
                    <div className="relative">
                        <select
                            name={unitName}
                            data-requires-value={name}
                            data-label={`Satuan ${label}`}
                            className="cursor-pointer appearance-none bg-transparent py-1 pl-1 pr-5 text-xs font-medium text-gray-500 outline-none transition-colors hover:text-gray-900"
                            defaultValue={defaultUnit ?? options[0].value}
                        >
                            {options.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <ChevronDown
                            size={12}
                            className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                    </div>
                </div>
            </div>
            {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
        </div>
    );
}