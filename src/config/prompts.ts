export type EntryType = 'daily' | 'weekly' | 'monthly';

export interface PromptItem {
  key: string;
  label: string;
  placeholder: string;
}

export const PROMPTS: Record<EntryType, PromptItem[]> = {
  daily: [
    {
      key: 'supposed_to_matter',
      label: 'What was supposed to matter today?',
      placeholder: 'What were the intended priorities?'
    },
    {
      key: 'actually_did',
      label: 'What did I actually do?',
      placeholder: 'Where did time and effort really go?'
    }
  ],
  weekly: [
    {
      key: 'progressed',
      label: 'What actually progressed?',
      placeholder: 'What moved in reality this week?'
    }
  ],
  monthly: [
    {
      key: 'consistent_actions',
      label: 'What did I consistently do this month?',
      placeholder: 'What behaviors repeated?'
    }
  ]
};
