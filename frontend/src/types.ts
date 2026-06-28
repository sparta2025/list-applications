export interface RequestItem {
  id: number;
  title: string;
  description: string | null;
  status: "new" | "in_progress" | "done";
  priority: "low" | "normal" | "high";
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse {
  items: RequestItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RequestCreate {
  title: string;
  description?: string;
  priority: "low" | "normal" | "high";
}

export interface RequestStatusUpdate {
  status: "new" | "in_progress" | "done";
}

export interface ListParams {
  status?: string;
  priority?: string;
  search?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
}
