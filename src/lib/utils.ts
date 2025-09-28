import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadBase64File(base64: string, filename: string) {
  const linkSource = base64.startsWith("data:")
    ? base64
    : `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

  const downloadLink = document.createElement("a");
  downloadLink.href = linkSource;
  downloadLink.download = filename;
  downloadLink.click();
}