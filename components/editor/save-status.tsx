"use client";

import { createContext, useContext } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Window event the Save button dispatches to flush pending changes immediately. */
export const SAVE_CANVAS_EVENT = "ghostie:save-canvas";

type SaveStatusSetter = (status: SaveStatus) => void;

const SaveStatusContext = createContext<SaveStatusSetter>(() => {});

/** Lets the canvas (a child of the editor shell) report its save status to the navbar. */
export const SaveStatusProvider = SaveStatusContext.Provider;

export function useReportSaveStatus(): SaveStatusSetter {
  return useContext(SaveStatusContext);
}
