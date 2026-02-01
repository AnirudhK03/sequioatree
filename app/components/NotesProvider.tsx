"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import NotesContext, { Annotation, NotePanel } from "./NotesContext";
import NotesWidget from "./NotesWidget";

const STORAGE_TEXT_KEY = "sequioatree_notes_text";
const STORAGE_ANNOTATIONS_KEY = "sequioatree_notes_annotations";
const LEGACY_STORAGE_KEY = "sequioatree_notes";

function createId() {
    // Prefer crypto.randomUUID when available
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return (crypto as Crypto).randomUUID();
    }
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function NotesProvider({ children }: { children: ReactNode }) {
    const [buttonVisible, setButtonVisible] = useState(false);
    const [open, setOpen] = useState(false);
    const [panel, setPanel] = useState<NotePanel>("notes");
    const [notesText, setNotesTextState] = useState("");
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

    // Always start with a clean slate on refresh.
    useEffect(() => {
        try {
            window.localStorage.removeItem(STORAGE_TEXT_KEY);
            window.localStorage.removeItem(STORAGE_ANNOTATIONS_KEY);
            window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
            // ignore
        }
        setNotesTextState("");
        setAnnotations([]);
        setActiveAnnotationId(null);
    }, []);

    const setNotesText = useCallback((text: string) => {
        setNotesTextState(text);
    }, []);

    const persistAnnotations = useCallback((next: Annotation[]) => {
        setAnnotations(next);
    }, []);

    const addAnnotation = useCallback(
        (input: Omit<Annotation, "id" | "createdAt" | "note"> & { note?: string }) => {
            const id = createId();
            const createdAt = Date.now();
            const next: Annotation = {
                id,
                createdAt,
                note: input.note ?? "",
                cardId: input.cardId,
                cardLabel: input.cardLabel,
                cardValue: input.cardValue,
                selectedText: input.selectedText,
            };
            persistAnnotations([next, ...annotations]);
            return id;
        },
        [annotations, persistAnnotations],
    );

    const updateAnnotation = useCallback(
        (id: string, patch: Partial<Pick<Annotation, "note">>) => {
            const next = annotations.map((a) => (a.id === id ? { ...a, ...patch } : a));
            persistAnnotations(next);
        },
        [annotations, persistAnnotations],
    );

    const deleteAnnotation = useCallback(
        (id: string) => {
            const next = annotations.filter((a) => a.id !== id);
            persistAnnotations(next);
            setActiveAnnotationId((curr) => (curr === id ? null : curr));
        },
        [annotations, persistAnnotations],
    );

    const clearAllAnnotations = useCallback(() => {
        persistAnnotations([]);
        setActiveAnnotationId(null);
    }, [persistAnnotations]);

    const openForAnnotation = useCallback((id: string) => {
        setOpen(true);
        setPanel("annotations");
        setActiveAnnotationId(id);
    }, []);

    const value = useMemo(
        () => ({
            buttonVisible,
            setButtonVisible,
            open,
            setOpen,
            panel,
            setPanel,
            notesText,
            setNotesText,
            annotations,
            addAnnotation,
            updateAnnotation,
            deleteAnnotation,
            clearAllAnnotations,
            activeAnnotationId,
            openForAnnotation,
        }),
        [
            buttonVisible,
            setButtonVisible,
            open,
            panel,
            notesText,
            setNotesText,
            annotations,
            addAnnotation,
            updateAnnotation,
            deleteAnnotation,
            clearAllAnnotations,
            activeAnnotationId,
            openForAnnotation,
        ],
    );

    return (
        <NotesContext.Provider value={value}>
            <NotesWidget />
            {children}
        </NotesContext.Provider>
    );
}
