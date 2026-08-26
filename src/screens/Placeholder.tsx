interface PlaceholderProps {
  title: string;
  lede: string;
  /** Which roadmap milestone fills this screen in — keeps the scaffold honest. */
  milestone: string;
}

export function Placeholder({ title, lede, milestone }: PlaceholderProps) {
  return (
    <div className="stack">
      <div>
        <h1 className="screen-title">{title}</h1>
        <p className="screen-lede">{lede}</p>
      </div>
      <section className="card">
        <p style={{ color: 'var(--text-dim)', fontSize: 'var(--fs-secondary)' }}>
          Arrives in {milestone}.
        </p>
      </section>
    </div>
  );
}
