import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("drivesmart_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Downloads a file (e.g. an Excel export) from the API and saves it in the browser. */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const res = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: unknown } | undefined;
    if (typeof data?.error === "string") return data.error;
    if (data?.error && typeof data.error === "object") {
      const flat = data.error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
      const messages = [
        ...(flat.formErrors ?? []),
        ...Object.values(flat.fieldErrors ?? {}).flat(),
      ];
      if (messages.length > 0) return messages.join(", ");
    }
    return err.message;
  }
  return "Something went wrong";
}