import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("drivesmart_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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