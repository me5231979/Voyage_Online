#!/usr/bin/env python3
"""Package Vanderbilt Voyage Online for an LMS.

Writes two zips to dist/:
  Vanderbilt-Voyage-Online-SCORM12.zip    SCORM 1.2 (works in nearly every LMS)
  Vanderbilt-Voyage-Online-SCORM2004.zip  SCORM 2004 4th edition

Both hold the same course files as the live site; assets/js/scorm.js talks to
the LMS when one is present. Run from anywhere:  python3 scripts/build-scorm.py
Rebuild after changing the course or re-recording narration.
"""
import datetime, glob, os, zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
TITLE = 'Vanderbilt Voyage Online'
DESC = ('The self-paced start of a new Vanderbilt staff member’s journey: the mission, '
        'five cities, our history and leadership, the four beliefs, and next steps. About thirty minutes.')
IDENT = 'edu.vanderbilt.voyage-online'

# the course, nothing else: no build scripts, raw recordings, or the full-size portrait upload
PATTERNS = ['index.html', 'app.js', 'config.js', 'narration-scripts.js', 'pager.js',
            'assets/css/*.css', 'assets/fonts/*.woff2', 'assets/js/*.js',
            'assets/img/*.png', 'assets/img/*.svg', 'assets/img/*.jpg', 'assets/img/course/*',
            'assets/audio/voyage/*.mp3', 'assets/video/*']
EXCLUDE = {'assets/img/Daniel_Diermeier_1323(1).png'}

def files():
    out = []
    for p in PATTERNS:
        for f in sorted(glob.glob(os.path.join(ROOT, p))):
            rel = os.path.relpath(f, ROOT).replace(os.sep, '/')
            if os.path.isfile(f) and rel not in EXCLUDE and not os.path.basename(rel).startswith('.'):
                out.append(rel)
    return out

def file_tags(fs, indent):
    return '\n'.join('%s<file href="%s"/>' % (indent, escape(f, {'"': '&quot;'})) for f in fs)

def manifest12(fs, version):
    return '''<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="%(id)s" version="%(v)s"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org">
    <organization identifier="org">
      <title>%(t)s</title>
      <item identifier="item" identifierref="sco" isvisible="true">
        <title>%(t)s</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="sco" type="webcontent" adlcp:scormtype="sco" href="index.html">
%(files)s
    </resource>
  </resources>
</manifest>
''' % {'id': IDENT, 'v': version, 't': escape(TITLE), 'files': file_tags(fs, '      ')}

def manifest2004(fs, version):
    return '''<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="%(id)s" version="%(v)s"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="org">
    <organization identifier="org">
      <title>%(t)s</title>
      <item identifier="item" identifierref="sco" isvisible="true">
        <title>%(t)s</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="sco" type="webcontent" adlcp:scormType="sco" href="index.html">
%(files)s
    </resource>
  </resources>
</manifest>
''' % {'id': IDENT, 'v': version, 't': escape(TITLE), 'files': file_tags(fs, '      ')}

def build(name, manifest, fs):
    os.makedirs(DIST, exist_ok=True)
    path = os.path.join(DIST, name)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('imsmanifest.xml', manifest)
        for f in fs:
            # audio and images are already compressed; store them as they are
            ct = zipfile.ZIP_STORED if f.endswith(('.mp3', '.jpg', '.png', '.woff2', '.mp4')) else zipfile.ZIP_DEFLATED
            z.write(os.path.join(ROOT, f), f, compress_type=ct)
    print('%s  %d files  %.1f MB' % (os.path.relpath(path, ROOT), len(fs) + 1, os.path.getsize(path) / 1e6))

if __name__ == '__main__':
    fs = files()
    version = datetime.date.today().strftime('%Y.%m.%d')
    build('Vanderbilt-Voyage-Online-SCORM12.zip', manifest12(fs, version), fs)
    build('Vanderbilt-Voyage-Online-SCORM2004.zip', manifest2004(fs, version), fs)
