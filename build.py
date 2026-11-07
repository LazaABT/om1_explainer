"""Bundles src/ and vendor/ into one offline file: OM-1.html"""
import base64, pathlib, re

root = pathlib.Path(__file__).parent
src, vendor = root / "src", root / "vendor"

fonts = [
    ("Instrument Serif", 400, "normal", "iserif.woff2"),
    ("Instrument Serif", 400, "italic", "iserif-i.woff2"),
    ("DM Sans", 400, "normal", "dmsans400.woff2"),
    ("DM Sans", 700, "normal", "dmsans700.woff2"),
    ("DM Mono", 500, "normal", "dmmono500.woff2"),
]
face = "".join(
    '@font-face{font-family:"%s";font-weight:%d;font-style:%s;font-display:block;'
    "src:url(data:font/woff2;base64,%s) format('woff2')}\n"
    % (n, w, s, base64.b64encode((vendor / f).read_bytes()).decode())
    for n, w, s, f in fonts
)

three = (vendor / "three.min.js").read_text(encoding="utf8")
# the library opens with: console.warn('...'),<the real code>  (a comma expression)
three, n = re.subn(r"^console\.warn\('Scripts [^\n]*?'\),", "0,", three, count=1)
assert n == 1, "three.js deprecation warning not found"
js = "\n".join((src / f).read_text(encoding="utf8") for f in
               ["util.js", "audio.js", "model.js", "world.js", "story.js", "main.js"])
photos = {"mirror": "refs/mirror/om1_screen_release.jpg", "shutter": "refs/chamber.jpg", "screen": "refs/screen1.jpg"}
js = "const PHOTOS = {" + ",".join('%s:"data:image/jpeg;base64,%s"' % (k, base64.b64encode((root / f).read_bytes()).decode()) for k, f in photos.items()) + "};\n" + js
for text in (three, js):
    assert "</script" not in text.lower()

html = (src / "index.html").read_text(encoding="utf8")
html = html.replace("/*FONTS*/", face).replace("/*CSS*/", (src / "style.css").read_text(encoding="utf8"))
html = html.replace("<!--SCRIPTS-->", "<script>" + three + "</script>\n<script>" + js + "</script>")
(root / "OM-1.html").write_text(html, encoding="utf8")
print("OM-1.html", round(len(html) / 1024), "KB")

# Artifact build: the host wraps the page in its own document, so no doctype/html/head/body here.
# The host has a notch-aware viewport, so the bar at the top also clears the phone's safe area.
head, body = html.split("<body>", 1)
body = body.rsplit("</body>", 1)[0]
style = re.search(r"<style>.*?</style>", head, re.S).group(0)
style = style.replace("</style>", "#hud{padding-top:max(18px,env(safe-area-inset-top,0px));padding-left:max(24px,env(safe-area-inset-left,0px));padding-right:max(24px,env(safe-area-inset-right,0px))}html{background:#EDE9E1}</style>")
art = ("<title>Inside the OM-1</title>\n" + style +
       "\n<script>document.documentElement.classList.add('loading')</script>\n" + body)
(root / "OM-1.artifact.html").write_text(art, encoding="utf8")
print("OM-1.artifact.html", round(len(art) / 1024), "KB")
