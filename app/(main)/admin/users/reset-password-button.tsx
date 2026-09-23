"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { resetUserPassword } from "./actions";
import { CredentialsDialog } from "./credentials-dialog";

type Credentials = { username: string; password: string };

export function ResetPasswordButton({ userId }: { userId: string }) {
    const [error, setError] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<Credentials | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleReset() {
        setError(null);
        startTransition(async () => {
            const formData = new FormData();
            formData.set("userId", userId);
            const result = await resetUserPassword(null, formData);
            if (result?.error) setError(result.error);
            else if (result?.credentials) setCredentials(result.credentials);
        });
    }

    return (
        <>
            <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                title="Reset password"
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-jade-800 disabled:opacity-50"
            >
        <span className="flex items-center gap-1.5">
          <KeyRound size={13} />
            {isPending ? "..." : "Reset"}
        </span>
            </button>

            {credentials && (
                <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
            )}

            {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
        </>
    );
}