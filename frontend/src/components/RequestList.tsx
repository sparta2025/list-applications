import { useState, useEffect, useMemo } from "react";
import type { RequestItem, ListParams } from "../types";
import { getRequests, updateRequestStatus, deleteRequest } from "../api/client";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import styles from "./RequestList.module.css";

interface Props {
  isAdmin: boolean;
  refreshKey: number;
  onRefresh: () => void;
}

const PAGE_SIZES = [10, 20, 50, 100, 0] as const;

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export default function RequestList({ isAdmin, refreshKey, onRefresh }: Props) {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [goToPage, setGoToPage] = useState("");

  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  const loadData = async (params: ListParams) => {
    setLoading(true);
    setError("");
    try {
      const data = await getRequests(params);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Ошибка загрузки заявок");
    } finally {
      setLoading(false);
    }
  };

  const buildParams = (overrides: Partial<ListParams> = {}): ListParams => ({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    search: search || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    page: 1,
    page_size: pageSize,
    ...overrides,
  });

  const handleFilterChange = (updates: Partial<ListParams>) => {
    loadData(buildParams(updates));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({ search: search || undefined, page: 1 });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setGoToPage("");
    handleFilterChange({ page_size: newSize, page: 1 });
  };

  const goTo = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    setGoToPage("");
    handleFilterChange({ page: p });
  };

  const handleGoToSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(goToPage, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) goTo(p);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setStatusUpdating(id);
    try {
      await updateRequestStatus(id, { status: newStatus as any });
      onRefresh();
      loadData(buildParams({ page }));
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Ошибка изменения статуса");
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await deleteRequest(id);
      setDeleteConfirm(null);
      onRefresh();
      loadData(buildParams({ page: page > totalPages ? totalPages : page }));
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(newOrder);
    handleFilterChange({ sort_by: field, sort_order: newOrder });
  };

  const sortArrow = (field: string) => {
    if (sortBy !== field) return "";
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  useEffect(() => {
    loadData(buildParams());
  }, [refreshKey]);

  const showPagination = totalPages > 1;

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filters}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Поиск по названию и описанию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={styles.searchBtn} type="submit">Поиск</button>
        </form>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            handleFilterChange({ status: e.target.value || undefined, page: 1 });
          }}
        >
          <option value="">Все статусы</option>
          <option value="new">Новая</option>
          <option value="in_progress">В работе</option>
          <option value="done">Готово</option>
        </select>
        <select
          className={styles.filterSelect}
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            handleFilterChange({ priority: e.target.value || undefined, page: 1 });
          }}
        >
          <option value="">Все приоритеты</option>
          <option value="low">Низкий</option>
          <option value="normal">Средний</option>
          <option value="high">Высокий</option>
        </select>
      </div>

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Loading */}
      {loading && !error && (
        <div className={styles.center}>
          <div className={styles.spinner}></div>
          <p>Загрузка...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className={styles.center}>
          <p className={styles.empty}>Нет заявок</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && items.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Статус</th>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort("priority")}
                  >
                    Приоритет{sortArrow("priority")}
                  </th>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort("created_at")}
                  >
                    Создана{sortArrow("created_at")}
                  </th>
                  {isAdmin && <th>Действия</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={item.status === "done" ? styles.doneRow : ""}>
                    <td className={styles.cellId}>{item.id}</td>
                    <td>
                      <div className={styles.titleCell}>{item.title}</div>
                      {item.description && (
                        <div className={styles.desc}>{item.description}</div>
                      )}
                    </td>
                    <td>
                      {item.status === "done" && !isAdmin ? (
                        <StatusBadge status={item.status} />
                      ) : (
                        <select
                          className={styles.statusSelect}
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          disabled={statusUpdating === item.id}
                        >
                          <option value="new">Новая</option>
                          <option value="in_progress">В работе</option>
                          <option value="done">Готово</option>
                        </select>
                      )}
                    </td>
                    <td><PriorityBadge priority={item.priority} /></td>
                    <td className={styles.date}>
                      {new Date(item.created_at).toLocaleString("ru-RU")}
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setDeleteConfirm(item.id)}
                        >
                          Удалить
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <div className={styles.pageSizeGroup}>
              <span className={styles.pageSizeLabel}>Показать:</span>
              {PAGE_SIZES.map((s) => (
                <button
                  key={s}
                  className={`${styles.pageSizeBtn} ${pageSize === s ? styles.pageSizeBtnActive : ""}`}
                  onClick={() => handlePageSizeChange(s)}
                >
                  {s === 0 ? "Все" : s}
                </button>
              ))}
            </div>

            {showPagination && (
              <div className={styles.pageNavGroup}>
                <button
                  className={styles.pageArrow}
                  disabled={page <= 1}
                  onClick={() => goTo(1)}
                  title="Первая страница"
                >
                  &laquo;
                </button>
                <button
                  className={styles.pageArrow}
                  disabled={page <= 1}
                  onClick={() => goTo(page - 1)}
                  title="Назад"
                >
                  &lsaquo;
                </button>
                {pageNumbers.map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className={styles.pageEllipsis}>&hellip;</span>
                  ) : (
                    <button
                      key={p}
                      className={`${styles.pageNum} ${page === p ? styles.pageNumActive : ""}`}
                      onClick={() => goTo(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  className={styles.pageArrow}
                  disabled={page >= totalPages}
                  onClick={() => goTo(page + 1)}
                  title="Вперёд"
                >
                  &rsaquo;
                </button>
                <button
                  className={styles.pageArrow}
                  disabled={page >= totalPages}
                  onClick={() => goTo(totalPages)}
                  title="Последняя страница"
                >
                  &raquo;
                </button>

                <form className={styles.goToForm} onSubmit={handleGoToSubmit}>
                  <span className={styles.goToLabel}>Стр.</span>
                  <input
                    className={styles.goToInput}
                    type="text"
                    value={goToPage}
                    onChange={(e) => setGoToPage(e.target.value)}
                    placeholder={`1-${totalPages}`}
                  />
                </form>
              </div>
            )}

            <div className={styles.pageInfo}>
              {total} записей
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm !== null && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Подтверждение удаления</h3>
            <p>Вы уверены, что хотите удалить заявку #{deleteConfirm}?</p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Отмена
              </button>
              <button
                className={styles.confirmBtn}
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
              >
                {deleting ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
