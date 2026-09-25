# Vanderbilt Voyage Online

The self-paced start of a new Vanderbilt staff member's journey, rebuilt
from the Rise course on the **Manager Foundations** engine
(`me5231979/Manager-Voyage`, `foundation/`) in the Vanderbilt brand. Six lessons,
about thirty minutes, one idea per page, every page narrated.

| Page | Key | Activity (tracked) |
| --- | --- | --- |
| Welcome | `home` | |
| The mission and the three areas of focus | `mission` | |
| Five cities: the campus network map | `cities` | |
| Our growth, in the news (press coverage) | `press` | |
| Lesson 1 · Welcome to the Voyage | `welcome` | Visit all six stops on the route |
| Lesson 2 · Our history | `history` | The video, then a twelve-moment timeline |
| Lesson 2 · Our leadership | `leaders` | Fact or fiction, four statements |
| Lesson 3 · By the numbers | `numbers` | Guess seven numbers |
| Lesson 3 · Quick facts | `facts` | Scavenger hunt on the real Quick Facts page |
| Lesson 4 · The four beliefs | `beliefs` | Compass rose; one moment per belief |
| Lesson 4 · Belief compass | `compass` | Four questions, one belief, a reflection |
| Lesson 5 · Dare to grow | `grow` | Three situations |
| Lesson 6 · Quick check | `quiz` | Four of five |
| Lesson 6 · Next steps | `nextstep` | Commit to four moves |
| Keep going | `learn` | Links, the Day One Survey, exit |

The mission page (vision, how we operate, the three areas of focus, and the
map of Nashville, Chattanooga, New York City, West Palm Beach, and San
Francisco) is carried over from Manager Foundations and reworded for every
staff member. The belief compass replaces the chat agent in the original
course; the belief it lands on, and the learner's reflection, fill in the
message to their manager on the next steps page.

## Design

One idea per page: a headline, one line of why, one interaction; narration carries the depth. See `AUDIT.md` for the adult learning audit behind it. Images come from the Rise course export (`assets/img/course/`); the Chancellor portrait is the photo uploaded to `assets/img/`, resized for the web.

## Live site

https://me5231979.github.io/Voyage_Online/ (GitHub Pages, served from the `gh-pages` branch, a mirror of the course branch).

## Files

- `index.html`: the course. `pager.js` turns it into a book (`#p/<key>/<n>`).
- `app.js`: narration, progress (localStorage `vvo-*`, nothing sent anywhere), and every activity.
- `narration-scripts.js`: the words for every clip (`window.VVO_NARR`).
- `config.js`: links to confirm before launch, the Day One Survey URL, the contact address, and the exit URL.
- `assets/css/course.css`, `foundation.css`: the Foundations styles (off-brand `#8C6822` and `#A94438` swapped for Oak `#946E24` and gray); `voyage.css`: this course's components.

## Narration

The same narrator as Manager Foundations: ElevenLabs voice
`i4CzbCVWoqvD0P1QJCUL`, settings in `.github/tts.json`, levelled to -16 LUFS.

1. Add the `ELEVENLABS_API_KEY` repository secret (Settings > Secrets and variables > Actions).
2. Run **Record narration with ElevenLabs** from the Actions tab (it also runs on any push that changes `narration-scripts.js`).
3. It writes `assets/audio/voyage/<key>.mp3` and commits them. Only changed clips are re-recorded.

All 39 clips are recorded (about 14 minutes) in `assets/audio/voyage/`, raw
ElevenLabs files in `source/`. If a clip is ever missing, the Listen button
reads the same words with the browser's built-in voice. After re-recording,
bump `mediaVersion` in `config.js`.

## Videos

Three slots: the Chancellor's message (lesson 1), Our History (lesson 2),
and Dare to Grow (lesson 5). Each shows a placeholder still from the Rise
course (`assets/img/course/`) with "Video coming soon" until its file is set.

To swap one in:
1. Upload the MP4 to `assets/video/` (GitHub rejects files over 100 MB; compress to about 80 MB at 1080p if needed) and a WebVTT captions file beside it.
2. In `config.js`, set `videos.<slot>.src` and `videos.<slot>.captions`, for example `'./assets/video/our-history.mp4'`.

A hosted video (Vimeo, YouTube) goes in `videos.<slot>.embed` instead: the
player URL from the embed code's `src`, plus `ratio` if it is not 16:9. The
still shows with a play button, and the player loads when it is tapped.
Our History is on Vimeo this way.

Keep the files in `assets/video/` with relative paths so the course can be
packaged as SCORM later without changes.

## Check before launch

- Record the narration (above).

## Verification

Last run 2026-09-25, Playwright in Chromium at 1440x900, 390px, and 320px:
every page renders with no horizontal scroll and no console errors apart
from the not-yet-recorded MP3s (the speech fallback covers them). All nine
activities complete, the completion dialog opens, the compass result and
reflection carry into the manager message, and the survey link appears on
next steps, the last page, and the completion dialog. Zero em or en dashes
in the course files.
