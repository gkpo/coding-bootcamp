import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { FlameIcon } from '../components/icons';
import { ConceptIcon } from '../components/ConceptIcon';
import type { IconName } from '../components/iconNames';
import { useStore } from '../store/useStore';
import './OnboardingScreen.css';

/**
 * Three screens, no configuration: docs/01 is explicit that there is nothing
 * to choose. It exists to set expectations, then get out of the way.
 */
const SCREENS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'target',
    title: 'Interviews test a different skill',
    body: 'You can be good at the job and still lose interviews. On pattern recognition, on vocabulary, on saying the thing out loud. That gap is what this trains.',
  },
  {
    icon: 'clock',
    title: 'Five minutes a day',
    body: 'Eight short exercises, all tap or drag. No typing, no code editor. Get something wrong and it comes back later, until it sticks.',
  },
  {
    icon: 'key',
    title: 'Never a term you do not know',
    body: 'Every exercise links to a plain-words card with an everyday analogy, the phrases interviewers use, and a sentence to say back.',
  },
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const screen = SCREENS[index];
  const isLast = index === SCREENS.length - 1;

  const finish = () => {
    completeOnboarding();
    navigate('/session', { replace: true });
  };

  return (
    <main className="onboarding">
      <div className="onboarding__body">
        <span className="onboarding__icon">
          <ConceptIcon name={screen.icon} size={34} />
        </span>
        <h1 className="onboarding__title">{screen.title}</h1>
        <p className="onboarding__text">{screen.body}</p>
      </div>

      <div className="onboarding__dots" aria-hidden>
        {SCREENS.map((s, i) => (
          <span key={s.title} className={`onboarding__dot ${i === index ? 'is-on' : ''}`} />
        ))}
      </div>

      <div className="onboarding__cta">
        <Button onClick={() => (isLast ? finish() : setIndex(index + 1))}>
          {isLast ? (
            <>
              <FlameIcon size={20} /> Start your first session
            </>
          ) : (
            'Next'
          )}
        </Button>
        {!isLast && (
          <button type="button" className="onboarding__skip" onClick={finish}>
            Skip
          </button>
        )}
      </div>
    </main>
  );
}
