import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { GripIcon } from './icons';
import './SortableList.css';

export interface SortableItem {
  id: string;
  content: ReactNode;
  /** Parsons pills carry their own indent. V1 never asks the user to choose it. */
  indent?: number;
}

/** Vertical gap between pills, kept in step with `.sortable { gap }`. */
const GAP = 8;
const TAP_SLOP = 8;

interface DragState {
  id: string;
  fromZone: string;
  /** Zone the pointer is currently over. */
  toZone: string;
  /** Insertion index in the target zone, counted with the dragged pill removed. */
  insertIndex: number;
  dy: number;
  /** Pill height plus the gap: one slot's worth of travel. */
  slot: number;
  moved: boolean;
}

interface GroupApi {
  drag: DragState | null;
  registerZone: (zone: string, el: HTMLElement | null) => void;
  begin: (zone: string, id: string, e: React.PointerEvent, onTap?: (id: string) => void) => void;
}

const GroupCtx = createContext<GroupApi | null>(null);

/** A pill's resting midpoint, in document coordinates. */
interface Slot {
  zone: string;
  id: string;
  mid: number;
}

interface ZoneBox {
  zone: string;
  top: number;
  bottom: number;
}

/** Which zone the pointer sits in, falling back to the nearest one. */
function zoneAt(boxes: ZoneBox[], y: number, fallback: string) {
  const inside = boxes.find((b) => y >= b.top && y <= b.bottom);
  if (inside) return inside.zone;
  let best = fallback;
  let bestGap = Infinity;
  for (const b of boxes) {
    const gap = y < b.top ? b.top - y : y - b.bottom;
    if (gap < bestGap) {
      bestGap = gap;
      best = b.zone;
    }
  }
  return best;
}

/** How many of the zone's other pills rest above the pointer. */
function indexIn(slots: Slot[], zone: string, y: number, draggedId: string) {
  return slots.filter((s) => s.zone === zone && s.id !== draggedId && s.mid < y).length;
}

/**
 * Owns one drag gesture shared by every `SortableZone` inside it, so a pill can
 * be dragged from one list into another (docs/02: parsons lines are dragged
 * into the solution area, with tap-to-move as the equal-footing alternative).
 *
 * `onMove` reports the drop as "this id belongs in that zone at that index",
 * where the index is counted against the target list minus the dragged pill.
 */
export function DragGroup({
  onMove,
  children,
}: {
  onMove: (id: string, fromZone: string, toZone: string, index: number) => void;
  children: ReactNode;
}) {
  const zones = useRef(new Map<string, HTMLElement>());
  const [drag, setDrag] = useState<DragState | null>(null);
  const live = useRef<DragState | null>(null);
  const startY = useRef(0);
  const slots = useRef<Slot[]>([]);
  const boxes = useRef<ZoneBox[]>([]);
  const tapHandler = useRef<((id: string) => void) | undefined>(undefined);
  const dragging = drag !== null;

  const registerZone = useCallback((zone: string, el: HTMLElement | null) => {
    if (el) zones.current.set(zone, el);
    else zones.current.delete(zone);
  }, []);

  const begin = useCallback(
    (zone: string, id: string, e: React.PointerEvent, onTap?: (id: string) => void) => {
      const el = e.currentTarget as HTMLElement;
      const scroll = window.scrollY;

      // Snapshot the resting layout once. Live rects would be skewed by the
      // very transforms this drag applies, and would feed back into themselves.
      slots.current = [];
      boxes.current = [];
      for (const [z, zoneEl] of zones.current) {
        const box = zoneEl.getBoundingClientRect();
        boxes.current.push({ zone: z, top: box.top + scroll, bottom: box.bottom + scroll });
        zoneEl.querySelectorAll<HTMLElement>('[data-sortable-id]').forEach((node) => {
          const r = node.getBoundingClientRect();
          slots.current.push({
            zone: z,
            id: node.dataset.sortableId ?? '',
            mid: r.top + r.height / 2 + scroll,
          });
        });
      }

      startY.current = e.clientY;
      tapHandler.current = onTap;
      const state: DragState = {
        id,
        fromZone: zone,
        toZone: zone,
        insertIndex: indexIn(slots.current, zone, e.clientY + scroll, id),
        dy: 0,
        slot: el.getBoundingClientRect().height + GAP,
        moved: false,
      };
      live.current = state;
      setDrag(state);
    },
    [],
  );

  useEffect(() => {
    if (!dragging) return;

    const move = (e: PointerEvent) => {
      const state = live.current;
      if (!state) return;
      const dy = e.clientY - startY.current;
      const y = e.clientY + window.scrollY;
      const toZone = zoneAt(boxes.current, y, state.fromZone);
      const next: DragState = {
        ...state,
        dy,
        toZone,
        insertIndex: indexIn(slots.current, toZone, y, state.id),
        moved: state.moved || Math.abs(dy) > TAP_SLOP,
      };
      live.current = next;
      setDrag(next);
    };

    // A pointer released outside the pill still has to end the drag.
    const finish = () => {
      const state = live.current;
      live.current = null;
      setDrag(null);
      if (!state) return;
      if (!state.moved) tapHandler.current?.(state.id);
      else onMove(state.id, state.fromZone, state.toZone, state.insertIndex);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [dragging, onMove]);

  return <GroupCtx.Provider value={{ drag, registerZone, begin }}>{children}</GroupCtx.Provider>;
}

interface ZoneProps {
  /** Unique within the surrounding `DragGroup`. */
  zone: string;
  items: SortableItem[];
  /** Tap (as opposed to drag). Used for tap-to-move between lists. */
  onTap?: (id: string) => void;
  disabled?: boolean;
  /** Per-item colouring after grading. */
  stateOf?: (id: string, index: number) => 'idle' | 'correct' | 'wrong';
  emptyLabel?: string;
}

/**
 * One drag surface. It is rendered even when empty, so an empty solution area
 * is still somewhere a pill can be dropped.
 *
 * docs/02 allows pointer events or dnd-kit; pointer events win here because
 * the interaction is narrow (vertical lists of pills), it keeps the dependency
 * budget free, and it lets tap-to-move share the same gesture handler rather
 * than fighting a library's drag sensor.
 */
export function SortableZone({ zone, items, onTap, disabled, stateOf, emptyLabel }: ZoneProps) {
  const group = useContext(GroupCtx);
  const drag = group?.drag ?? null;
  const registerZone = group?.registerZone;
  const begin = group?.begin;
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    registerZone?.(zone, listRef.current);
    return () => registerZone?.(zone, null);
  }, [registerZone, zone]);

  const dragIndex = drag ? items.findIndex((i) => i.id === drag.id) : -1;
  const active = drag !== null && drag.moved;
  const leaving = active && drag.fromZone === zone && dragIndex >= 0;
  const arriving = active && drag.toZone === zone;

  /** How far item `index` slides to open (or close) a gap during the drag. */
  const offsetOf = (index: number) => {
    if (drag === null || !active) return 0;
    let offset = 0;
    if (leaving && index > dragIndex) offset -= drag.slot;
    if (arriving) {
      const withoutDragged = leaving && index > dragIndex ? index - 1 : index;
      if (withoutDragged >= drag.insertIndex) offset += drag.slot;
    }
    return offset;
  };

  return (
    <ul
      className={`sortable ${arriving && drag.fromZone !== zone ? 'is-drop-target' : ''}`}
      ref={listRef}
    >
      {items.length === 0 && emptyLabel && <li className="sortable__empty">{emptyLabel}</li>}

      {items.map((item, index) => {
        const isDragging = drag !== null && item.id === drag.id && drag.fromZone === zone;
        const offset = isDragging ? drag.dy : offsetOf(index);

        return (
          <li
            key={item.id}
            data-sortable-id={item.id}
            className={`sortable__item sortable__item--${stateOf?.(item.id, index) ?? 'idle'} ${
              isDragging && active ? 'is-dragging' : ''
            }`}
            style={{
              transform: `translateY(${offset}px)`,
              marginLeft: `${(item.indent ?? 0) * 16}px`,
            }}
            onPointerDown={(e) => {
              if (!disabled) begin?.(zone, item.id, e, onTap);
            }}
          >
            <span className="sortable__grip">
              <GripIcon size={20} />
            </span>
            {item.content}
          </li>
        );
      })}
    </ul>
  );
}

interface ListProps extends Omit<ZoneProps, 'zone'> {
  onReorder: (ids: string[]) => void;
}

/**
 * A single self-contained sortable list: the common case, where reordering is
 * all there is. Lists that exchange pills wrap their own `DragGroup` around
 * several `SortableZone`s instead.
 */
export function SortableList({ items, onReorder, ...rest }: ListProps) {
  const move = useCallback(
    (id: string, _from: string, _to: string, index: number) => {
      const next = items.map((i) => i.id).filter((x) => x !== id);
      next.splice(index, 0, id);
      onReorder(next);
    },
    [items, onReorder],
  );

  return (
    <DragGroup onMove={move}>
      <SortableZone zone="list" items={items} {...rest} />
    </DragGroup>
  );
}
