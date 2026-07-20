import type { Task } from "../storage";
export function TaskList({ tasks, onToggle, onDelete }: { tasks: (Task & { completed: boolean })[]; onToggle: (id: number) => void; onDelete: (id: number) => void }) {
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className={task.completed ? "completed" : ""}>
          <label>
            <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} />
            <span className="task-text">{task.text}</span>
            <span className="task-xp">+{task.xp}</span>
          </label>
          <button className="delete" onClick={() => onDelete(task.id)} title="删除任务">&times;</button>
        </li>
      ))}
    </ul>
  );
}