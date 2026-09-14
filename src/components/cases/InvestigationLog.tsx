"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NotebookPen } from "lucide-react";
import { useAddInvestigationLogMutation, useInvestigationLogQuery } from "@/hooks/useCaseMutations";
import { formatAuditTimestamp } from "@/lib/auditLogger";

const STEPS = ["Reviewed evidence", "Contacted customer", "Escalated to L2", "Reversed transaction", "Closed — no action"] as const;

const draftSchema = z.object({
  step: z.string().nullable(),
  body: z.string().min(1),
});

type DraftForm = z.infer<typeof draftSchema>;

const AUTOSAVE_DEBOUNCE_MS = 1200;
const MIN_CHARS_TO_SAVE = 4;

export function InvestigationLog({ caseId }: { caseId: string }) {
  const { data: entries } = useInvestigationLogQuery(caseId);
  const addEntry = useAddInvestigationLogMutation(caseId);
  const [savedFlash, setSavedFlash] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { register, watch, reset, formState } = useForm<DraftForm>({
    resolver: zodResolver(draftSchema),
    defaultValues: { step: null, body: "" },
  });

  const body = watch("body");
  const step = watch("step");

  // Autosave on debounce, not on a separate "Save" click.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!body || body.trim().length < MIN_CHARS_TO_SAVE) return;

    debounceRef.current = setTimeout(() => {
      addEntry.mutate(
        { body: body.trim(), step: step || null },
        {
          onSuccess: () => {
            reset({ step: null, body: "" });
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 1500);
          },
        }
      );
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, step]);

  return (
    <div className="rounded border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <NotebookPen size={14} className="text-ink-faint" aria-hidden="true" />
          Investigation log
        </h3>
        <span className="text-xs text-ink-faint">
          {addEntry.isPending ? "Saving…" : savedFlash ? "Saved" : "Autosaves as you type"}
        </span>
      </div>

      <div className="space-y-2 border-b border-border p-3">
        <select
          {...register("step")}
          className="w-full rounded border border-border bg-surface-raised px-2 py-1.5 text-sm text-ink"
        >
          <option value="">No step (general note)</option>
          {STEPS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <textarea
          {...register("body")}
          rows={2}
          placeholder="Add a note — it saves automatically a moment after you stop typing…"
          className="w-full resize-none rounded border border-border bg-surface-raised px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        />
        {formState.errors.body && body.length > 0 && (
          <p className="text-xs text-risk-critical">Note can&rsquo;t be empty.</p>
        )}
      </div>

      <ul className="max-h-72 overflow-y-auto">
        {(entries ?? []).length === 0 && (
          <li className="p-3 text-sm text-ink-faint">No notes yet for this case.</li>
        )}
        {(entries ?? []).map((entry) => (
          <li key={entry.id} className="border-b border-border px-3 py-2 last:border-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-muted">
                {entry.author} {entry.step && <span className="text-ink-faint">· {entry.step}</span>}
              </p>
              <time className="text-xs text-ink-faint">{formatAuditTimestamp(entry.createdAt)}</time>
            </div>
            <p className="mt-0.5 text-sm text-ink">{entry.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
