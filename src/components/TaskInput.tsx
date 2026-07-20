export function TaskInput({ value, onChange, onAdd }: { value: string; onChange: (v: string) => void; onAdd: () => void }) {
  return (
    <div className="add-task">
      <input type="text" placeholder="添加新行动..." value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAdd()} />
      <button onClick={onAdd}>添加</button>
    </div>
  );
}