import axios from "axios";
import type { PaginatedResponse, RequestCreate, RequestItem, RequestStatusUpdate, ListParams } from "../types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export function setAuthHeader(username: string, password: string) {
  const encoded = btoa(`${username}:${password}`);
  api.defaults.headers.common["Authorization"] = `Basic ${encoded}`;
}

export function clearAuthHeader() {
  delete api.defaults.headers.common["Authorization"];
}

export async function checkAuth(username: string, password: string): Promise<boolean> {
  const encoded = btoa(`${username}:${password}`);
  const res = await api.get("/auth/login", {
    headers: { Authorization: `Basic ${encoded}` },
  });
  return res.status === 200;
}

export async function getRequests(params: ListParams): Promise<PaginatedResponse> {
  const res = await api.get("/requests", { params });
  return res.data;
}

export async function createRequest(data: RequestCreate): Promise<RequestItem> {
  const res = await api.post("/requests", data);
  return res.data;
}

export async function updateRequestStatus(
  id: number,
  data: RequestStatusUpdate
): Promise<RequestItem> {
  const res = await api.patch(`/requests/${id}/status`, data);
  return res.data;
}

export async function deleteRequest(id: number): Promise<void> {
  await api.delete(`/requests/${id}`);
}
