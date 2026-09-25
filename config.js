/* ══════════ VANDERBILT VOYAGE ONLINE · settings ══════════
   The one place to change links without touching the course. */
window.VVO_CONFIG = {
  contact: 'pcb@vanderbilt.edu',
  /* the Day One survey (replaces the REDCap link in the original course) */
  surveyUrl: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=OX9aur7js0q0UGf6gPrsreq8b35schZOi4vqfFyoXutUOThNNDdNUzhXRTRQU1IzSThPRFlWUzA1QiQlQCN0PWcu',
  links: {
    vision: 'https://news.vanderbilt.edu/2022/07/01/daring-to-grow-together-we-are-building-the-great-university-of-the-21st-century/',
    history: 'https://www.vanderbilt.edu/150/timeline/vanderbilt-timeline/',  /* the timeline, embedded on its own page */
    leadership: 'https://www.vanderbilt.edu/about/university-leadership/',  /* Meet the Vice Chancellors */
    quickFacts: 'https://www.vanderbilt.edu/about/quick-facts/'  /* Quick Facts, embedded on its own page */
  },
  /* Course videos. Each slot shows its placeholder image until a file is
     set here. To swap one in: add the MP4 (under 100 MB) to assets/video/,
     put its path in src, and a WebVTT captions file in captions. Keep the
     files in assets/video/ (relative paths) so the course can later be
     packaged as SCORM without changes. */
  videos: {
    chancellor: { src: '', captions: '' },   /* e.g. './assets/video/chancellor-message.mp4', './assets/video/chancellor-message.vtt' */
    history:    { src: '', captions: '' },   /* e.g. './assets/video/our-history.mp4', './assets/video/our-history.vtt' */
    grow:       { src: '', captions: '' }    /* e.g. './assets/video/dare-to-grow.mp4', './assets/video/dare-to-grow.vtt' */
  },
  /* where Exit goes; empty closes the tab (inside an LMS) or returns to the start */
  exitUrl: '',
  /* bump after re-recording narration so browsers fetch the new clips */
  mediaVersion: '20260925a'
};
