#!/usr/bin/env python3
"""Fails (exit 1) if a shipped mesh or rig breaks the asset rules.
Reads the real binaries rather than trusting the stats in the manifest.
Rules: highest LOD >= 1000 triangles; animated models >= 24 armature bones;
every bone moves in at least one clip; vertex bone ids are valid."""
import json, os, struct, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')
MIN_TRIS, MIN_BONES = 1000, 24
# Rigid props that never animate. Everything else must carry a rig.
STATIC_PREFIXES = ('rock', 'bolt', 'tr_', 'beam', 'aimline', 'puff', 'station', 'planet', 'ring', 'sky', 'dust', 'ck_shell', 'ck_led', 'hud_')


def main():
    m = json.load(open(os.path.join(A, 'manifest.json')))
    bins = {k: open(os.path.join(A, v['file']), 'rb').read() for k, v in m['files'].items()}
    info = m['files']['anim']
    anim = struct.unpack('<%df' % (len(bins['anim']) // 4), bins['anim'])
    bad, rows = [], []
    for name, d in sorted(m['models'].items()):
        tris = [l['ic'] // 3 for l in d['lod']]
        if tris[0] < MIN_TRIS:
            bad.append(f'{name}: highest LOD has {tris[0]} triangles (< {MIN_TRIS})')
        if any(a < b for a, b in zip(tris, tris[1:])):
            bad.append(f'{name}: LOD triangle counts are not descending {tris}')
        phone = [l['ic'] // 3 for l in d['lod'] if l['bin'] != 'hi']
        if not phone or phone[0] < MIN_TRIS:
            bad.append(f'{name}: phone tier top LOD has {phone[:1]} triangles (< {MIN_TRIS})')
        nb = len(d['bones'])
        static = name.startswith(STATIC_PREFIXES)
        if not static and nb < MIN_BONES:
            bad.append(f'{name}: {nb} bones (< {MIN_BONES})')
        if nb and not d['clips']:
            bad.append(f'{name}: rig without clips')
        for l in d['lod']:
            b = bins[l['bin']]
            if l['vo'] + l['vc'] * 20 > len(b):
                bad.append(f'{name}: vertex range outside bin')
                continue
            if nb:
                ids = {struct.unpack_from('<h', b, l['vo'] + i * 12 + 6)[0] for i in range(l['vc'])}
                if max(ids) >= nb or min(ids) < 0:
                    bad.append(f'{name}: vertex bone id out of range')
        if nb:
            moved = [False] * nb
            for c in d['clips'].values():
                frames = c['frames'] + 1
                for bi in range(nb):
                    o = (c['base'] + bi * 2) * 4
                    first = anim[o:o + 8]
                    for f in range(1, frames):
                        o2 = (c['base'] + (f * nb + bi) * 2) * 4
                        if max(abs(x - y) for x, y in zip(first, anim[o2:o2 + 8])) > 1e-4:
                            moved[bi] = True
                            break
            still = [d['bones'][i][0] for i, v in enumerate(moved) if not v and d['bones'][i][1] >= 0]
            if still:
                bad.append(f'{name}: bones never move: {still[:4]}')
        rows.append((name, tris, nb))
    if '--table' in sys.argv:
        print('asset'.ljust(20), 'tris LOD0/1/2'.ljust(24), 'bones')
        for n, t, b in rows:
            print(n.ljust(20), '/'.join(map(str, t)).ljust(24), b or '-')
    print(f'{len(rows)} models checked, anim texture {info["w"]}x{info["h"]}')
    if bad:
        print('FAILED:')
        for x in bad:
            print(' -', x)
        return 1
    print('OK')
    return 0


if __name__ == '__main__':
    sys.exit(main())
