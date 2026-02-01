"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNotes } from "./NotesContext";

export default function NotesWidget() {
    const {
        buttonVisible,
        open,
        setOpen,
        panel,
        setPanel,
        notesText,
        setNotesText,
        annotations,
        updateAnnotation,
        deleteAnnotation,
        clearAllAnnotations,
        activeAnnotationId,
    } = useNotes();

    const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const annotationsScrollRef = useRef<HTMLDivElement | null>(null);

    const hasAnnotations = annotations.length > 0;
    const annotationsTitle = useMemo(() => {
        if (!hasAnnotations) return "Annotations";
        return `Annotations (${annotations.length})`;
    }, [annotations.length, hasAnnotations]);

    useEffect(() => {
        if (!open) return;

        const id = window.setTimeout(() => {
            if (panel === "notes") notesTextareaRef.current?.focus();
        }, 50);

        return () => window.clearTimeout(id);
    }, [open, panel]);

    useEffect(() => {
        if (!open) return;
        if (panel !== "annotations") return;
        if (!activeAnnotationId) return;

        const id = window.setTimeout(() => {
            const root = annotationsScrollRef.current;
            if (!root) return;
            const el = root.querySelector<HTMLElement>(`[data-annotation-id="${activeAnnotationId}"]`);
            if (!el) return;
            el.scrollIntoView({ block: "center", behavior: "smooth" });
            const textarea = el.querySelector<HTMLTextAreaElement>("textarea");
            textarea?.focus();
        }, 80);

        return () => window.clearTimeout(id);
    }, [open, panel, activeAnnotationId]);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    const clearNotes = useCallback(() => {
        setNotesText("");
    }, [setNotesText]);

    return (
        <>
            {buttonVisible && (
                <motion.div
                    className="fixed top-0 right-0 z-[55] p-6 md:p-8"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                >
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur border border-black/10 shadow-sm hover:bg-white transition-colors"
                        aria-label="Open notes"
                    >
                        <span className="text-sm font-medium">Notes</span>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                    </button>
                </motion.div>
            )}

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                        />

                        <motion.aside
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-white/95 backdrop-blur border-l border-black/10 z-[70] flex flex-col"
                            initial={{ x: 420 }}
                            animate={{ x: 0 }}
                            exit={{ x: 420 }}
                            transition={{ type: "spring", stiffness: 260, damping: 28 }}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Notes"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">Notes</span>
                                    <span className="text-xs opacity-60">Saved locally in this browser</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={panel === "notes" ? clearNotes : clearAllAnnotations}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-black/10 hover:bg-black/5 transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="w-9 h-9 rounded-xl bg-black/5 hover:bg-black/10 transition-colors flex items-center justify-center"
                                        aria-label="Close notes"
                                    >
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 14 14"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            aria-hidden="true"
                                        >
                                            <path d="M1 1l12 12M13 1L1 13" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="px-5 pt-4">
                                <div className="inline-flex rounded-xl border border-black/10 bg-white/60 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setPanel("notes")}
                                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${panel === "notes" ? "bg-white shadow-sm" : "hover:bg-white/70"
                                            }`}
                                    >
                                        Notes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPanel("annotations")}
                                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${panel === "annotations" ? "bg-white shadow-sm" : "hover:bg-white/70"
                                            }`}
                                    >
                                        {annotationsTitle}
                                    </button>
                                </div>
                            </div>

                            {panel === "notes" ? (
                                <div className="p-5 flex-1">
                                    <textarea
                                        ref={notesTextareaRef}
                                        value={notesText}
                                        onChange={(e) => setNotesText(e.target.value)}
                                        placeholder="Type your notes here..."
                                        className="w-full h-full resize-none rounded-2xl p-4 bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 font-sans text-sm leading-relaxed"
                                    />
                                </div>
                            ) : (
                                <div ref={annotationsScrollRef} className="p-5 flex-1 overflow-y-auto">
                                    {!hasAnnotations ? (
                                        <div className="text-sm opacity-70 leading-relaxed">
                                            Highlight text in an expanded card, then click <span className="font-medium">Annotate</span>.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {annotations.map((a) => (
                                                <div
                                                    key={a.id}
                                                    data-annotation-id={a.id}
                                                    className="rounded-2xl border border-black/10 bg-white/60 p-4"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex flex-col">
                                                            <div className="text-xs font-mono opacity-70">
                                                                {a.cardLabel} • {a.cardValue}
                                                            </div>
                                                            <div className="text-sm font-medium mt-1">Selected text</div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteAnnotation(a.id)}
                                                            className="text-xs px-2.5 py-1 rounded-lg border border-black/10 hover:bg-black/5 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>

                                                    <div className="mt-2 text-sm leading-relaxed rounded-xl bg-white/70 border border-black/10 p-3">
                                                        <span className="opacity-70">“</span>
                                                        {a.selectedText}
                                                        <span className="opacity-70">”</span>
                                                    </div>

                                                    <div className="mt-3">
                                                        <div className="text-xs font-medium opacity-70 mb-2">Your note</div>
                                                        <textarea
                                                            value={a.note}
                                                            onChange={(e) => updateAnnotation(a.id, { note: e.target.value })}
                                                            placeholder="Add your annotation..."
                                                            className="w-full min-h-[88px] resize-y rounded-xl p-3 bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 font-sans text-sm leading-relaxed"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
