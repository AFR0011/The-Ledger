import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PromptCard } from './PromptCard';

describe('PromptCard', () => {
  it('moves focus to the textarea for the active step', () => {
    render(
      <PromptCard
        onChange={() => {}}
        prompt={{
          key: 'current_thread',
          label: 'What thread am I on now?',
          placeholder: 'Name the live thread.',
          helperText: 'Keep it singular if possible.'
        }}
        step={2}
        total={8}
        value=""
      />
    );

    expect(screen.getByLabelText('What thread am I on now?')).toHaveFocus();
  });
});
