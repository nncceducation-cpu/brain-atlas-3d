"""Inline every asset into a single self-contained HTML atlas."""
import io, os, re

def rd(p):
    return io.open(p, encoding='utf8').read()

three  = rd('vendor/three.min.js')
orbit  = rd('vendor/OrbitControls.legacy.js')
css    = rd('src/style.css')
app    = '\n'.join(rd('src/' + f) for f in ('app_geom.js', 'app_data.js', 'app_main.js'))
shell  = rd('src/shell.html')

for name, blob in (('three', three), ('orbit', orbit), ('app', app), ('css', css)):
    assert '</script' not in blob.lower(), name + ' contains a script terminator'

out = (shell.replace('/*__CSS__*/', css)
            .replace('/*__THREE__*/', three)
            .replace('/*__ORBIT__*/', orbit)
            .replace('/*__APP__*/', app))
for k in ('__CSS__', '__THREE__', '__ORBIT__', '__APP__'):
    assert '/*%s*/' % k not in out, 'placeholder %s not filled' % k

io.open('brain_atlas_3d.html', 'w', encoding='utf8').write(out)
print('brain_atlas_3d.html', round(len(out) / 1024, 1), 'KB')
print('app js lines:', app.count('\n'))
