import styles from "./StatusBadge.module.css";

const labels: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Готово",
};

const priorities: Record<string, string> = {
  low: "Низкий",
  normal: "Средний",
  high: "Высокий",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`${styles.badge} ${styles[status] || ""}`}>
      {labels[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`${styles.priority} ${styles[`p_${priority}`] || ""}`}>
      {priorities[priority] || priority}
    </span>
  );
}
