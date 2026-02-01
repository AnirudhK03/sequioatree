"use client";

import { createContext, useContext } from "react";

export type NotePanel = "notes" | "annotations";

export type Annotation = {
    id: string;
    cardId: string;
    cardLabel: string;
    cardValue: string;
    selectedText: string;
    note: string;
    createdAt: number;
};

export type NotesContextValue = {
    buttonVisible: boolean;
    setButtonVisible: (visible: boolean) => void;

    open: boolean;
    setOpen: (open: boolean) => void;

    panel: NotePanel;
    setPanel: (panel: NotePanel) => void;

    notesText: string;
    setNotesText: (text: string) => void;

    annotations: Annotation[];
    addAnnotation: (input: Omit<Annotation, "id" | "createdAt" | "note"> & { note?: string }) => string;
    updateAnnotation: (id: string, patch: Partial<Pick<Annotation, "note">>) => void;
    deleteAnnotation: (id: string) => void;
    clearAllAnnotations: () => void;

    activeAnnotationId: string | null;
    openForAnnotation: (id: string) => void;
};

const NotesContext = createContext<NotesContextValue | null>(null);

export function useNotes(): NotesContextValue {
    const ctx = useContext(NotesContext);
    if (!ctx) throw new Error("useNotes must be used within NotesProvider");
    return ctx;
}

export default NotesContext;
