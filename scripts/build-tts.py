#!/usr/bin/env python3
"""Record the course narration with ElevenLabs (the Manager Foundations voice).

Reads every script in narration-scripts.js (window.VVO_NARR), the voice and
settings in .github/tts.json, and the ELEVENLABS_API_KEY environment variable.
Raw clips go to assets/audio/voyage/source/, loudness-matched course clips
(-16 LUFS, the Foundations level) to assets/audio/voyage/<key>.mp3, where the
key's slash becomes a dash (home/1 -> home-1.mp3). A hash per clip in
.github/tts-cache.json means a re-run only pays for clips whose words or
voice changed. Runs in .github/workflows/build-tts.yml, or locally with the
key exported and ffmpeg on PATH."""
import hashlib, json, os, subprocess, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, '.github', 'tts.json')))
CACHE_P = os.path.join(ROOT, '.github', 'tts-cache.json')
OUT = os.path.join(ROOT, 'assets', 'audio', 'voyage')
SRC = os.path.join(OUT, 'source')
KEY = os.environ.get('ELEVENLABS_API_KEY', '').strip()
LOUD = 'I=-16:TP=-1.5:LRA=11'

def scripts():
    js = "const vm=require('vm'),fs=require('fs');const w={};vm.runInNewContext(fs.readFileSync(%r,'utf8'),{window:w});console.log(JSON.stringify(w.VVO_NARR||{}))" % os.path.join(ROOT, 'narration-scripts.js')
    return json.loads(subprocess.run(['node', '-e', js], check=True, stdout=subprocess.PIPE, text=True).stdout)

def sig(text):
    return hashlib.sha256(json.dumps([CFG['voice_id'], CFG['model_id'], CFG.get('output_format'), CFG.get('voice_settings'), CFG.get('audio_filter'), text], sort_keys=True).encode()).hexdigest()

def speak(text, dest):
    url = 'https://api.elevenlabs.io/v1/text-to-speech/%s?output_format=%s' % (CFG['voice_id'], CFG.get('output_format', 'mp3_44100_128'))
    body = json.dumps({'text': text, 'model_id': CFG['model_id'], 'voice_settings': CFG.get('voice_settings') or {}}).encode()
    req = urllib.request.Request(url, data=body, headers={'xi-api-key': KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as r, open(dest, 'wb') as f: f.write(r.read())
            if os.path.getsize(dest) > 1000: return
        except urllib.error.HTTPError as e:
            msg = e.read()[:400].decode('utf-8', 'replace')
            if e.code in (401, 402, 403) or 'quota' in msg.lower(): raise SystemExit('ElevenLabs refused the request (%d): %s' % (e.code, msg))
            sys.stderr.write('attempt %d failed (%d): %s\n' % (attempt + 1, e.code, msg))
        except Exception as e:
            sys.stderr.write('attempt %d failed: %s\n' % (attempt + 1, e))
        time.sleep(3 * (attempt + 1))
    raise SystemExit('could not generate ' + dest)

def run(*a):
    return subprocess.run(a, check=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True).stdout

def level(src, dest):
    """Two-pass linear loudnorm: the recording is untouched apart from level."""
    pre = CFG.get('audio_filter') or ''
    chain = (pre + ',' if pre else '')
    out = run('ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', chain + 'loudnorm=' + LOUD + ':print_format=json', '-f', 'null', '-')
    m = json.loads(out[out.rindex('{'):out.rindex('}') + 1])
    ln = 'loudnorm=%s:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s:linear=true' % (LOUD, m['input_i'], m['input_tp'], m['input_lra'], m['input_thresh'], m['target_offset'])
    run('ffmpeg', '-y', '-v', 'error', '-i', src, '-af', chain + ln, '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', dest)

if __name__ == '__main__':
    if not KEY: raise SystemExit('ELEVENLABS_API_KEY is not set. Add it as a repository secret (Settings > Secrets and variables > Actions).')
    os.makedirs(SRC, exist_ok=True)
    cache = json.load(open(CACHE_P)) if os.path.exists(CACHE_P) else {}
    narr = scripts(); made = kept = 0
    for k, text in narr.items():
        name = k.replace('/', '-') + '.mp3'
        raw, dest, h = os.path.join(SRC, name), os.path.join(OUT, name), sig(text)
        if cache.get(name) == h and os.path.isfile(raw) and os.path.isfile(dest): kept += 1; continue
        speak(text, raw); level(raw, dest)
        cache[name] = h; made += 1
        json.dump(cache, open(CACHE_P, 'w'), indent=1, sort_keys=True)
        print('recorded', name); time.sleep(0.5)
    # clips whose script was removed
    for f in os.listdir(OUT):
        if f.endswith('.mp3') and f not in {k.replace('/', '-') + '.mp3' for k in narr}:
            os.remove(os.path.join(OUT, f)); print('removed', f)
    print('narration: recorded %d, unchanged %d, total %d' % (made, kept, len(narr)))
