import './ConfirmDialog.css';

interface Props {
  title: string;
  body: string;
  /** The label for staying put. It is the safe choice, so it is the loud one. */
  stayLabel: string;
  leaveLabel: string;
  onStay: () => void;
  onLeave: () => void;
}

/**
 * The one dialog in the app: leaving something half-finished.
 *
 * The primary action is staying, not leaving. A user who reaches this has
 * usually mistapped, and the loud button should be the one that undoes the
 * mistake rather than the one that costs them their progress.
 */
export function ConfirmDialog({ title, body, stayLabel, leaveLabel, onStay, onLeave }: Props) {
  return (
    <div className="confirm-layer">
      <div className="confirm" role="dialog" aria-modal="true">
        <p className="confirm__title">{title}</p>
        <p className="confirm__body">{body}</p>
        <div className="confirm__actions">
          <button type="button" className="confirm__stay" onClick={onStay}>
            {stayLabel}
          </button>
          <button type="button" className="confirm__leave" onClick={onLeave}>
            {leaveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
