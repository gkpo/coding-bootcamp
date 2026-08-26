import { CodeBlock } from '../components/CodeBlock';
import type { SpotBugExercise } from '../content/types';

interface Props {
  exercise: SpotBugExercise;
  revealed: boolean;
  wrongTaps: number[];
  onTapLine: (index: number) => void;
}

/** Every line is tappable; wrong taps highlight amber-ish with their hint. */
export function SpotBugRenderer({ exercise, revealed, wrongTaps, onTapLine }: Props) {
  return (
    <CodeBlock
      code={exercise.code}
      onLineTap={(i) => !revealed && onTapLine(i)}
      lineState={(i) => {
        if (revealed && i === exercise.buggyLineIndex) return 'correct';
        if (wrongTaps.includes(i)) return 'wrong';
        return 'idle';
      }}
    />
  );
}
