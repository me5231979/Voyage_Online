# Vanderbilt Voyage Online

The self-paced start of a new Vanderbilt staff member's journey, rebuilt
from the Rise course on the **Manager Foundations** engine
(`me5231979/Manager-Voyage`, `foundation/`) in the Vanderbilt brand. Six
modules, about forty minutes, one idea per page, every page narrated. The
structure follows the Manager Voyage simplified model (`foundation/simple/`):
a module page, modules that open one at a time, one activity per page, an Up
next button on every page, and a completion page at the end of each module.

| Module | Pages (`key/n`) | Activities (tracked) |
| --- | --- | --- |
| | Welcome (`home/1`), Your modules (`modules/1`) | |
| 1 · Welcome and the mission | The Chancellor's welcome (`welcome/1`), the mission (`mission/1`), five cities (`cities/1`), in the news (`press/1`), module complete (`press/2`) | Open all three areas of focus; tap all five campuses |
| 2 · Our history and leadership | The video (`history/1`), the timeline (`history/2`), meet your Chancellor (`leaders/1`), fact or fiction (`leaders/2`), the leadership team (`leaders/3`), module complete (`leaders/4`) | Visit every moment; four statements |
| 3 · Vanderbilt by the numbers | Guess the numbers (`numbers/1`), Quick Facts hunt, optional (`facts/1`), module complete (`facts/2`) | Guess all seven |
| 4 · The four beliefs | The compass rose (`beliefs/1`), your belief compass (`compass/1`), module complete (`compass/2`) | Each belief's moment; your compass |
| 5 · Dare to grow | Motto and video (`grow/1`), three moments (`grow/2`), module complete (`grow/3`) | All three moments |
| 6 · Quick check and next steps | Quick check (`quiz/1`), your next four moves (`nextstep/1`), tell your manager (`nextstep/2`), the end (`learn/1`) | Four of five; commit to all four moves |

A module is complete when every page in it has been opened and its activities
are done; then the next opens. Reviewers: add `?unlock=all` to the course URL
to open every module in that tab (`?unlock=off` to go back). The belief
compass replaces the chat agent in the original course; the belief it lands
on, and the learner's saved sentence, fill in the message to their manager.

## Design

One idea per page: a headline, one line of why, one interaction; narration carries the depth. See `AUDIT.md` for the adult learning audit behind it. Images come from the Rise course export (`assets/img/course/`); the Chancellor portrait is the photo uploaded to `assets/img/`, resized for the web.

## Live site

https://me5231979.github.io/Voyage_Online/ (GitHub Pages, served from the `gh-pages` branch, a mirror of the course branch).

## Files

- `index.html`: the course. `pager.js` turns it into a book (`#p/<key>/<n>`).
- `app.js`: narration, progress (localStorage `vvo2-*`; inside an LMS, also the LMS), and every activity.
- `assets/js/scorm.js`: the LMS bridge (SCORM 1.2 and 2004). `scripts/build-scorm.py` builds the packages.
- `narration-scripts.js`: the words for every clip (`window.VVO_NARR`).
- `config.js`: links to confirm before launch, the Day One Survey URL, the contact address, and the exit URL.
- `assets/css/course.css`, `foundation.css`: the Foundations styles (off-brand `#8C6822` and `#A94438` swapped for Oak `#946E24` and gray); `voyage.css`: this course's components.

## Narration

A strong, professional male narrator: ElevenLabs voice Brian
(`nPczCjzI2devNBz1zQrb`), settings in `.github/tts.json`, levelled to -16 LUFS.

1. Add the `ELEVENLABS_API_KEY` repository secret (Settings > Secrets and variables > Actions).
2. Run **Record narration with ElevenLabs** from the Actions tab (it also runs on any push that changes `narration-scripts.js`).
3. It writes `assets/audio/voyage/<key>.mp3` and commits them. Only changed clips are re-recorded.

All 39 clips are recorded (about 14 minutes) in `assets/audio/voyage/`, raw
ElevenLabs files in `source/`. If a clip is ever missing, the Listen button
reads the same words with the browser's built-in voice. After re-recording,
bump `mediaVersion` in `config.js`.

## Videos

Three slots: the Chancellor's message (module 1), Our History (module 2),
and Dare to Grow (module 5). Each shows a placeholder still from the Rise
course (`assets/img/course/`) with "Video coming soon" until its file is set.

To swap one in:
1. Upload the MP4 to `assets/video/` (GitHub rejects files over 100 MB; compress to about 80 MB at 1080p if needed) and a WebVTT captions file beside it.
2. In `config.js`, set `videos.<slot>.src` and `videos.<slot>.captions`, for example `'./assets/video/our-history.mp4'`.

A hosted video (Vimeo, YouTube) goes in `videos.<slot>.embed` instead: the
player URL from the embed code's `src`, plus `ratio` if it is not 16:9. The
still shows with a play button, and the player loads when it is tapped.
Our History is on Vimeo this way.

Keep the files in `assets/video/` with relative paths; the SCORM build picks them up.

## Compass, the question helper

**Ask Compass** opens a chat panel in the corner of every page. Compass answers questions about the course and about Vanderbilt, using the course narration and vanderbilt.edu pages it searches and reads live (Claude, with web search and web fetch limited to vanderbilt.edu). Each answer links the pages it used.

It does not answer benefits, pay, leave, personnel, medical, legal, immigration, or account questions. `compass-api/lib/guard.js` catches these before any AI call and points the learner to Human Resources (and to 988 if someone appears to be in crisis); the system prompt repeats the rule for anything the patterns miss.

- **Server:** `compass-api/`, a Vercel function (project `voyage-compass`). It needs one environment variable, `ANTHROPIC_API_KEY`, set in Vercel (Project, Settings, Environment Variables, type Sensitive). Optional: `COMPASS_ALLOWED_ORIGINS` (comma-separated sites allowed to call it; default all), `COMPASS_RATE_LIMIT` (questions per person per 10 minutes; default 20), `COMPASS_MODEL`.
- **Switch it on:** put the function URL in `config.js` as `compassApi` (it ends in `/api/compass`). Empty hides the button; nothing is sent anywhere.
- **Cost:** each question is one Claude call with up to four searches; set a monthly spend limit on the Anthropic account.
- **After changing the narration:** run `node scripts/build-compass-notes.mjs` so Compass knows the new wording, then push.
- The conversation is kept in the browser tab only. Inside an LMS, Compass needs internet access to the function's host.

## SCORM package (LMS)

Two ready-to-upload packages in `dist/`, the same course as the live site:

- `Vanderbilt-Voyage-Online-SCORM12.zip`: SCORM 1.2, the safest choice for most LMSs.
- `Vanderbilt-Voyage-Online-SCORM2004.zip`: SCORM 2004 4th edition, if your LMS prefers it.

Download links (served from the live site):
https://me5231979.github.io/Voyage_Online/dist/Vanderbilt-Voyage-Online-SCORM12.zip
https://me5231979.github.io/Voyage_Online/dist/Vanderbilt-Voyage-Online-SCORM2004.zip

What the LMS receives (`assets/js/scorm.js`):

- **Completion:** completed once all ten activities are done (2004 also reports progress as a fraction).
- **Score:** the quick check, as a percentage (4 of 5 = 80). In 2004, passed at 4 of 5. No mastery score is set, so the score never overrides completion.
- **Resume:** answers, progress, the belief compass, commitments, and the Quick Facts hunt are kept in suspend_data, and the page is the bookmark, so a learner picks up where they left off on any computer.
- **Learner name:** the welcome and the printed takeaway use the name from the LMS.
- **Time and exit:** session time is reported; Exit (and closing the window) suspends the attempt.

Outside an LMS the script finds no API and does nothing. Videos (Vimeo) and the outside links need internet access; everything else, narration included, is in the package. Rebuild after any change to the course or the narration: `python3 scripts/build-scorm.py`.

## Check before launch

- Record the narration (above).

## Verification

Last run 2026-09-25, Playwright in Chromium at 1440x900, 390px, and 320px:
every page renders with no horizontal scroll and no console errors apart
from the not-yet-recorded MP3s (the speech fallback covers them). All ten
activities complete, the completion dialog opens, the compass result and
reflection carry into the manager message, and the survey link appears on
next steps, the last page, and the completion dialog. Zero em or en dashes
in the course files.
