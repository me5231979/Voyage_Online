// Compass topic guard: questions Compass will not answer, checked before any
// call to Claude (no cost, no model judgment). The system prompt repeats the
// same rule, so a question that slips past these patterns is still declined.

const HR = 'https://hr.vanderbilt.edu/';

// Each rule: patterns (case-insensitive) and the reply Compass gives instead.
const RULES = [
  {
    topic: 'crisis',
    re: /\b(suicid\w*|kill (myself|me)|self[- ]harm|hurt(ing)? myself|end (my|it all)|want to die)\b/i,
    reply: 'I’m really sorry you’re going through this. Please reach out now: call or text 988 (the Suicide and Crisis Lifeline), or call 911 if you are in immediate danger. You can also contact Vanderbilt’s Employee Assistance Program through Human Resources. You do not have to handle this alone.',
    link: { title: 'Vanderbilt Human Resources', url: HR }
  },
  {
    topic: 'benefits',
    re: /\b(benefits?|insurance|medical plan|health plan|dental|vision plan|deductible|copay|hsa|fsa|401\s?\(?k\)?|403\s?\(?b\)?|retirement (plan|account|savings|benefits?|match)|pension|open enrollment|tuition (benefit|assistance|remission)|dependents?|life insurance|disability (insurance|benefit))\b/i,
    reply: 'Compass doesn’t answer questions about benefits. For accurate, personal answers, go to Vanderbilt Human Resources or complete the Benefits Information Course assigned to you.',
    link: { title: 'Vanderbilt Human Resources', url: HR }
  },
  {
    topic: 'pay',
    re: /\b(salary|salaries|pay ?(rate|check|day|stub|raise|grade|band)|paycheck|payroll|wages?|compensation|bonus|(pay|a|my|merit) raise|overtime|direct deposit|w-?2|tax(es)? withh?old)\b/i,
    reply: 'Compass doesn’t answer questions about pay or payroll. Please ask your manager, or contact Vanderbilt Human Resources.',
    link: { title: 'Vanderbilt Human Resources', url: HR }
  },
  {
    topic: 'leave',
    re: /\b(fmla|leave of absence|parental leave|maternity|paternity|sick (leave|time|days)|pto|paid time off|vacation (days|time|balance)|bereavement|workplace accommodations?|disability accommodations?)\b/i,
    reply: 'Compass doesn’t answer questions about leave, time off, or accommodations. Your manager and Vanderbilt Human Resources can help with your situation.',
    link: { title: 'Vanderbilt Human Resources', url: HR }
  },
  {
    topic: 'employee relations',
    re: /\b(harass\w*|discriminat\w*|retaliat\w*|title ix|complaint|grievance|report (my|a) (manager|supervisor|coworker|colleague)|hostile|bully\w*|hr investigation|disciplin\w*|fired|firing|terminat\w*|lay ?offs?|laid off|performance improvement plan|\bpip\b|labor union|unioniz\w*)\b/i,
    reply: 'Compass can’t help with workplace concerns, complaints, or personnel matters. Please talk with your manager or Vanderbilt Human Resources. If you need to report a concern confidentially, Human Resources can point you to the right office.',
    link: { title: 'Vanderbilt Human Resources', url: HR }
  },
  {
    topic: 'personal',
    re: /\b(my (diagnosis|medical|health condition|prescription|immigration|visa|green card|lawsuit)|immigration|visa sponsor\w*|h-?1b|legal advice|lawyer|attorney|social security number|\bssn\b|password|login credentials?)\b/i,
    reply: 'Compass can’t help with personal, medical, legal, or immigration questions, or with accounts and passwords. Human Resources (or the Vanderbilt IT help desk, for accounts) is the right place to ask.',
    link: { title: 'Vanderbilt Human Resources', url: HR }
  }
];

export function screen(text) {
  const t = String(text || '');
  for (const r of RULES) if (r.re.test(t)) return { topic: r.topic, answer: r.reply, sources: r.link ? [r.link] : [] };
  return null;
}
