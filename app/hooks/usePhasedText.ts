import { useEffect, useMemo, useState } from "react";

type UsePhasedTextOptions = {
    stepMs?: number;
    finalHoldMs?: number;
    resetKey?: string | number;
};

export function usePhasedText(
    active: boolean,
    phases: string[],
    options: UsePhasedTextOptions = {},
) {
    const { stepMs = 900, finalHoldMs = 0, resetKey = 0 } = options;

    // Callers often pass array literals (new reference each render). Use a stable
    // key derived from content so we don't reset the timer on unrelated renders.
    const phasesKey = useMemo(() => phases.join("\n"), [phases]);
    const safePhases = useMemo(
        () => phases.filter((p) => p.trim().length > 0),
        [phasesKey],
    );
    const [index, setIndex] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!active) {
            setIndex(0);
            setDone(false);
            return;
        }

        if (safePhases.length <= 1) {
            setIndex(0);
            setDone(true);
            return;
        }

        setIndex(0);
        setDone(false);

        let timeout: number | undefined;

        const tick = (i: number) => {
            const isLast = i >= safePhases.length - 1;
            setIndex(i);
            if (isLast) {
                if (finalHoldMs > 0) {
                    timeout = window.setTimeout(() => setDone(true), finalHoldMs);
                } else {
                    setDone(true);
                }
                return;
            }
            timeout = window.setTimeout(() => tick(i + 1), stepMs);
        };

        timeout = window.setTimeout(() => tick(1), stepMs);

        return () => {
            if (timeout) window.clearTimeout(timeout);
        };
    }, [active, phasesKey, stepMs, finalHoldMs, resetKey]);

    const text = safePhases[Math.min(index, Math.max(0, safePhases.length - 1))] ?? "";

    return { text, done };
}
