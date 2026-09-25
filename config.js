/* ══════════ VANDERBILT VOYAGE ONLINE · settings ══════════
   The one place to change links without touching the course. Links marked
   CONFIRM were carried over from the original Rise course's buttons and
   should be checked by the program owner before launch. */
window.VVO_CONFIG = {
  contact: 'pcb@vanderbilt.edu',
  /* the Day One survey (replaces the REDCap link in the original course) */
  surveyUrl: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=OX9aur7js0q0UGf6gPrsreq8b35schZOi4vqfFyoXutUOThNNDdNUzhXRTRQU1IzSThPRFlWUzA1QiQlQCN0PWcu',
  links: {
    vision: 'https://news.vanderbilt.edu/2022/07/01/daring-to-grow-together-we-are-building-the-great-university-of-the-21st-century/',
    history: 'https://www.vanderbilt.edu/150/timeline/vanderbilt-timeline/',  /* the timeline, embedded on its own page */
    leadership: 'https://www.vanderbilt.edu/about/university-leadership/',  /* Meet the Vice Chancellors */
    quickFacts: 'https://www.vanderbilt.edu/about/facts/'      /* CONFIRM: Quick Facts */
  },
  /* where Exit goes; empty closes the tab (inside an LMS) or returns to the start */
  exitUrl: '',
  /* bump after re-recording narration so browsers fetch the new clips */
  mediaVersion: '20260925a'
};
