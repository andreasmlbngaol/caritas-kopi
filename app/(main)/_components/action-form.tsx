// app/(main)/_components/action-form.tsx
"use client";

import { useActionState } from "react";

export type ActionState = { error?: string } | undefined;
export type ActionFn = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function ActionForm({
                               action, children, className,
                           }: {
    action: ActionFn;
    children: React.ReactNode;
    className?: string;
}) {
    const [state, formAction] = useActionState(action, undefined);

    return (
        <form action={formAction} className={className}>
            {children}
            {state?.error && (
                <div
                    role="alert"
                    className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200"
                >
                    {state.error}
                </div>
            )}
        </form>
    );
}