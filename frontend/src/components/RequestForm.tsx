import { useState } from "react";
import type { RequestCreate } from "../types";
import styles from "./RequestForm.module.css";

interface Props {
  onSubmit: (data: RequestCreate) => Promise<void>;
}

export default function RequestForm({ onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Название должно быть от 3 до 120 символов");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ title: title.trim(), description: description.trim() || undefined, priority });
      setTitle("");
      setDescription("");
      setPriority("normal");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Ошибка при создании заявки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Новая заявка</h3>
      {error && <div className={styles.error}>{error}</div>}
      <label className={styles.label}>
        Название *
        <input
          className={styles.input}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="От 3 до 120 символов"
          maxLength={120}
          required
        />
      </label>
      <label className={styles.label}>
        Описание
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="До 1000 символов (необязательно)"
          maxLength={1000}
          rows={3}
        />
      </label>
      <label className={styles.label}>
        Приоритет
        <select className={styles.select} value={priority} onChange={(e) => setPriority(e.target.value as any)}>
          <option value="low">Низкий</option>
          <option value="normal">Средний</option>
          <option value="high">Высокий</option>
        </select>
      </label>
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? "Создание..." : "Создать"}
      </button>
    </form>
  );
}
