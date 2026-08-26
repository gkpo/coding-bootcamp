import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import './SortableList.css';

export interface SortableItem {
  id: string;
  content: ReactNode;
  /** Parsons pills carry their own indent. V1 never asks the user to choose it. */
  indent?: number;
}

interface Props {
  items: SortableItem[];
  onReorder: (ids: string[]) => void;
  /** Tap (as opposed to drag). Used for tap-to-move between lists. */
  onTap?: (id: string) => void;
  disabled?: boolean;
  /** Per-item colouring after grading. */
  stateOf?: (id: string, index: number) => 'idle' | 'correct' | 'wrong';
  emptyLabel?: string;
}

const TAP_SLOP = 8;

/**
 * Drag-to-reorder built on pointer events.
 *
 * docs/02 allows pointer events or dnd-kit; pointer events win here because
 * the interaction is narrow (one vertical list), it keeps the dependency
 * budget free, and it lets tap-to-move share the same gesture handler rather
 * than fighting a library's drag sensor.
 *
 * Tap-to-move is not a grudging fallback: on a phone it is often the faster
 * way in, and it is the accessible one.
 */
export function SortableList({ items, onReorder, onTap, disabled, stateOf, emptyLabel }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dy, setDy] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const start = useRef({ y: 0, index: 0, moved: false });

  const itemHeight = useCallback(() => {
    const first = listRef.current?.querySelector('.sortable__item');
    return first ? first.getBoundingClientRect().height + 8 : 48;
  }, []);

  const onPointerDown = (e: React.PointerEvent, id: string, index: number) => {
    if (disabled) return;
    start.current = { y: e.clientY, index, moved: false };
    setDragId(id);
    setDy(0);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragId === null) return;
    const delta = e.clientY - start.current.y;
    if (Math.abs(delta) > TAP_SLOP) start.current.moved = true;
    setDy(delta);
  };

  const finish = useCallback(() => {
    if (dragId === null) return;
    const { index, moved } = start.current;

    if (!moved) {
      onTap?.(dragId);
    } else {
      const shift = Math.round(dy / itemHeight());
      const target = Math.max(0, Math.min(items.length - 1, index + shift));
      if (target !== index) {
        const next = items.map((i) => i.id);
        const [moving] = next.splice(index, 1);
        next.splice(target, 0, moving);
        onReorder(next);
      }
    }
    setDragId(null);
    setDy(0);
  }, [dragId, dy, items, itemHeight, onReorder, onTap]);

  // A pointer released outside the element still has to end the drag.
  useEffect(() => {
    if (dragId === null) return;
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [dragId, finish]);

  if (items.length === 0 && emptyLabel) {
    return <p className="sortable__empty">{emptyLabel}</p>;
  }

  const height = itemHeight();
  const draggingIndex = items.findIndex((i) => i.id === dragId);
  const shift = dragId !== null ? Math.round(dy / height) : 0;
  const target = Math.max(0, Math.min(items.length - 1, draggingIndex + shift));

  return (
    <ul className="sortable" ref={listRef}>
      {items.map((item, index) => {
        const isDragging = item.id === dragId;
        // Everything between the origin and the target slides to make room.
        let offset = 0;
        if (dragId !== null && !isDragging) {
          if (index > draggingIndex && index <= target) offset = -height;
          else if (index < draggingIndex && index >= target) offset = height;
        }

        return (
          <li
            key={item.id}
            className={`sortable__item sortable__item--${stateOf?.(item.id, index) ?? 'idle'} ${
              isDragging ? 'is-dragging' : ''
            }`}
            style={{
              transform: isDragging ? `translateY(${dy}px)` : `translateY(${offset}px)`,
              marginLeft: `${(item.indent ?? 0) * 16}px`,
            }}
            onPointerDown={(e) => onPointerDown(e, item.id, index)}
            onPointerMove={onPointerMove}
          >
            {item.content}
          </li>
        );
      })}
    </ul>
  );
}
