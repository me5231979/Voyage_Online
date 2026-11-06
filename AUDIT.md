# Adult learning audit · Vanderbilt Voyage Online

Audit of the first build against adult learning principles (Knowles), the
multimedia principles (Mayer), and cognitive load, followed by the redesign
that answers it. Content and sections come from the Rise course; its look
does not.

## What the audit found

| Finding | Principle | Evidence (first build) |
| --- | --- | --- |
| Too much to read before doing anything | Coherence, cognitive load | About 2,600 words on screen across 14 pages; 140 to 280 per page |
| Narration and on-screen text said the same thing | Redundancy | Every page read aloud what was already printed |
| Two framing boxes on every page ("What you will learn", "Why it matters") | Signaling, cognitive load | The same two-box header on 11 pages, before any content |
| Objectives front-loaded as a paragraph list | Self-direction | Six objectives in the hero, ahead of the first action |
| Reading-first pages: the history, leadership, and belief text sat above the activity | Problem-centered learning | Activities started below the fold on most pages |
| Numbers shown before the learner thinks about them | Pretesting effect | Question and answer arrived together |
| Beliefs taught as four parallel text tabs | Signaling | Nothing tied the four beliefs into one picture |

## What the redesign does

- **One idea per page.** A headline that carries the point, one line of why, one interaction. About 720 words on screen across 14 pages (down 72%).
- **Narration carries the depth.** The long explanations moved into the narration (modality principle); the screen keeps the headline, the interaction, and the facts the learner acts on.
- **Detail on demand.** The objectives, the full areas of focus, and "what each belief means" sit one tap away, not in the way.
- **Do first, then read.** Every page leads with its activity: tap the six stops, tap four years, fact or fiction, guess the number, tap the compass, find your belief, commit to four moves.
- **Guess before the reveal.** The seven numbers are tiles you guess first; the answer and its story come after.
- **One picture for the beliefs.** A compass rose, a real Voyage motif, holds all four beliefs; the belief compass then points its needle at the one that fits you.
- **Experience and relevance (Knowles).** The compass result and your own sentence go straight into the message to your manager, which is the course's L3 behavior.
- **Always know where you are.** A six-segment lesson rail on every page, and a gold check on each task when it is done.

## Kirkpatrick
- L1: the Vanderbilt Voyage Day One Survey (next steps, last page, completion dialog).
- L2: the five-question check (four of five) plus each activity's feedback.
- L3: four commitments and the message to the manager, with the learner's belief and plan in it.

## Second audit: the Manager Voyage simplified model (November 2026)

Measured against the simplified pattern in Manager Voyage (`foundation/simple/`): one idea per screen, one activity per page, one bar, an Up next button at the end of every page, and modules that open one at a time. Each page was measured at 1440×900 and 390 px for words, screens of scroll, controls, videos, and activities.

| Page before | What was busy | What changed |
| --- | --- | --- |
| Welcome | A video and a six-stop route preview on one page | The video stands alone. The route is gone: the module page now shows what is ahead. |
| In the news | Ten stories and a filter; 3.7 screens on a phone | Five stories, one per new campus and one on the strategy; no filter. |
| Our history | A video and a twelve-moment timeline on one page | Two pages: the video, then the timeline. |
| Our leadership | Bio, a fold-out, a four-statement drill, and eleven area tiles; 2.1 screens on a phone | Three pages: meet your Chancellor, fact or fiction, the leadership team. |
| Quick facts | A hunt that sends the learner off the course, required in practice | Marked optional; it never holds up a module. |
| Dare to grow | A video and three situations on one page | Two pages: the motto and video, then three moments. |
| Next steps | Four commitments, the manager message, the survey, print, and a visit note | Two pages: your next four moves, then tell your manager (message, survey, print). |

Also:

- **Six modules, one at a time.** A module page after the welcome; a module opens when the one before it is complete (every page opened, every activity done). Reviewers can open all of them with `?unlock=all`.
- **A completion page for modules 1 to 5:** what you covered, how to use it this week, what is next, and anything still left to do.
- **Up next** at the end of every page names the next page, so the way forward is never a hunt.
- **One bar:** the page dots are gone; the bar shows the module and Page x of y within it.
- **Activities:** ten, never two on one page. Opening the three areas of focus and tapping the five campuses now count, since the route preview no longer does.
- **Honest time:** about forty minutes in six modules (it said thirty in six lessons).
- **Narration:** every new page has its own clip, and each clip reads only its own page.

Every page now fits one screen at 1440×900 (the optional hunt runs 1.16), and no page scrolls sideways at 320, 390, or 768 px.
