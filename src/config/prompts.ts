export const ENTRY_TYPES = ['daily', 'weekly', 'monthly'] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

export const DOMAIN_TAGS = ['social', 'piano', 'body', 'mind', 'research', 'dev', 'admin'] as const;
export const STATE_TAGS = ['drift', 'win', 'bottleneck', 'clarity', 'decision'] as const;

export type DomainTag = (typeof DOMAIN_TAGS)[number];
export type StateTag = (typeof STATE_TAGS)[number];

export interface PromptItem {
  key: string;
  label: string;
  placeholder: string;
  helperText: string;
}

export interface EntryBlueprint {
  label: string;
  cadence: string;
  intro: string;
  prompts: PromptItem[];
}

export const ENTRY_BLUEPRINTS: Record<EntryType, EntryBlueprint> = {
  daily: {
    label: 'Daily',
    cadence: 'Day-level reset',
    intro: 'Preserve continuity, spot drift, and name the next right step before the day blurs.',
    prompts: [
      {
        key: 'supposed_to_matter',
        label: 'What was supposed to matter today?',
        placeholder: 'List the real priorities, not the noise.',
        helperText: 'Use short lines if there were multiple priorities.'
      },
      {
        key: 'actually_did',
        label: 'What did I actually do?',
        placeholder: 'Where did time, energy, and attention really go?',
        helperText: 'Be concrete. Reality matters more than intention.'
      },
      {
        key: 'evidence_of_progress',
        label: 'What evidence of progress exists?',
        placeholder: 'Capture outcomes, proof, or traction.',
        helperText: 'Screenshots, shipped work, resolved tasks, or visible forward motion all count.'
      },
      {
        key: 'drift_or_fragment',
        label: 'Where did I drift or fragment?',
        placeholder: 'Note any loops, context switches, or dead ends.',
        helperText: 'This is for pattern detection, not self-judgment.'
      },
      {
        key: 'operating_state',
        label: 'What state was I operating from?',
        placeholder: 'Calm, rushed, avoidant, clear, heavy, restless...',
        helperText: 'State often explains the pattern better than the task list does.'
      },
      {
        key: 'current_thread',
        label: 'What thread am I on now?',
        placeholder: 'Name the live thread that still has momentum or tension.',
        helperText: 'Keep it singular if possible.'
      },
      {
        key: 'next_right_step',
        label: 'What is the next right step?',
        placeholder: 'Write one concrete action that re-anchors tomorrow.',
        helperText: 'This becomes the app’s continuity anchor.'
      }
    ]
  },
  weekly: {
    label: 'Weekly',
    cadence: 'Week-level compression',
    intro: 'Compress the week, separate signal from noise, and set the next week’s operating focus.',
    prompts: [
      {
        key: 'progressed',
        label: 'What actually progressed?',
        placeholder: 'What moved in reality this week?',
        helperText: 'Name the real progress, not the effort theater.'
      },
      {
        key: 'proof_of_progress',
        label: 'What proof of progress exists?',
        placeholder: 'What can you point to as evidence?',
        helperText: 'Pull in deliverables, metrics, or resolved bottlenecks.'
      },
      {
        key: 'stayed_noise',
        label: 'What stayed noise?',
        placeholder: 'What consumed attention without moving the system?',
        helperText: 'This becomes a pattern to constrain.'
      },
      {
        key: 'where_now',
        label: 'Where am I now?',
        placeholder: 'Describe the current position clearly.',
        helperText: 'Anchor your actual state before planning next week.'
      },
      {
        key: 'bottlenecks_kept_showing_up',
        label: 'What bottlenecks kept showing up?',
        placeholder: 'Repeated blockers, friction, or self-created loops.',
        helperText: 'Recurring bottlenecks should shape next week’s constraints.'
      },
      {
        key: 'reduce_or_constrain',
        label: 'What gets reduced or constrained next week?',
        placeholder: 'Name the noise or pressure you are limiting.',
        helperText: 'Think in constraints, not motivation.'
      },
      {
        key: 'next_week_about',
        label: 'What is next week about?',
        placeholder: 'Write the main theme, focus, or operating angle.',
        helperText: 'This becomes the weekly continuity anchor.'
      }
    ]
  },
  monthly: {
    label: 'Monthly',
    cadence: 'Month-level pattern review',
    intro: 'Surface behavior patterns, directional growth, and the next month’s real theme.',
    prompts: [
      {
        key: 'consistent_actions',
        label: 'What did I consistently do this month?',
        placeholder: 'Capture the behaviors that actually repeated.',
        helperText: 'Patterns matter more than isolated spikes.'
      },
      {
        key: 'built',
        label: 'What did I build?',
        placeholder: 'Projects, systems, skills, or structure created this month.',
        helperText: 'Include internal systems if they changed your behavior.'
      },
      {
        key: 'improved',
        label: 'What improved?',
        placeholder: 'Name the areas that got stronger or cleaner.',
        helperText: 'Small but durable gains count.'
      },
      {
        key: 'regressed',
        label: 'What regressed?',
        placeholder: 'Where did quality, consistency, or clarity slip?',
        helperText: 'This should inform next month’s guardrails.'
      },
      {
        key: 'behavioral_learning',
        label: 'What did I learn about myself behaviorally?',
        placeholder: 'State the pattern plainly.',
        helperText: 'Look for triggers, energy patterns, and leverage points.'
      },
      {
        key: 'next_month_about',
        label: 'What is next month about?',
        placeholder: 'Name the month’s main direction in one sharp statement.',
        helperText: 'This becomes the long-range continuity anchor.'
      }
    ]
  }
};

export const PROMPTS = {
  daily: ENTRY_BLUEPRINTS.daily.prompts,
  weekly: ENTRY_BLUEPRINTS.weekly.prompts,
  monthly: ENTRY_BLUEPRINTS.monthly.prompts
} satisfies Record<EntryType, PromptItem[]>;

export function isEntryType(value: string | undefined): value is EntryType {
  return value !== undefined && ENTRY_TYPES.includes(value as EntryType);
}
