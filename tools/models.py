# Every ship, prop and effect in the game, authored as parts with armature keys.
import math, random
from kit import Model, Geo, TAU, rot_x, rot_y, rot_z, trans, scale


# ---- key helpers -------------------------------------------------------------
def wave(axis, amp, frames, cycles=1, phase=0.0, steps=8, base=0.0):
    out = []
    for i in range(steps + 1):
        u = i / steps
        v = [0.0, 0.0, 0.0]
        v[axis] = base + amp * math.sin(u * TAU * cycles + phase)
        out.append((round(u * frames), tuple(v)))
    return out


def spin(axis, frames, turns=1, steps=16):
    out = []
    for i in range(steps + 1):
        v = [0.0, 0.0, 0.0]
        v[axis] = i / steps * TAU * turns
        out.append((round(i / steps * frames), tuple(v)))
    return out


def flicker(frames, lo, hi, seed, steps=10):
    r = random.Random(seed)
    vals = [r.uniform(lo, hi) for _ in range(steps)]
    vals.append(vals[0])
    return [(round(i / steps * frames), (v, v, v)) for i, v in enumerate(vals)]


def pulse(frames, lo, hi, cycles=1, phase=0.0, steps=8):
    out = []
    for i in range(steps + 1):
        u = i / steps
        v = lo + (hi - lo) * (.5 + .5 * math.sin(u * TAU * cycles + phase))
        out.append((round(u * frames), (v, v, v)))
    return out


def greeble(g, seed, n, xr, yr, zr, pals, size=.25):
    r = random.Random(seed)
    for i in range(n):
        c = (r.uniform(*xr), r.uniform(*yr), r.uniform(*zr))
        p = pals[r.randrange(len(pals))]
        if r.random() < .68:
            g.box(c, (r.uniform(.4, 1.2) * size, r.uniform(.25, .6) * size, r.uniform(.5, 1.6) * size), p)
        else:
            q = r.uniform(.2, .42) * size
            g.cyl((c[0], c[1] - q, c[2]), (c[0], c[1] + q, c[2]), q, q * .8, 8, p)


def studs(g, n, R, r, z, pal, h=None):
    h = h or r
    for i in range(n):
        t = i / n * TAU
        x, y = math.cos(t) * R, math.sin(t) * R
        g.cyl((x, y, z - h), (x, y, z + h), r, r * .78, 10, pal)


def nozzle(g, c, r, length, pal=('gun', 'dark', 'orange')):
    x, y, z = c
    g.lathe([(z + length, r * .72), (z + length * .5, r), (z, r * 1.02), (z - length * .34, r * .9), (z - length * .4, r * .55)], 18, list(pal), (x, y, 0))


def flame(m, name, c, r, length, cols=('f_white', 'f_yellow', 'f_orange', 'f_red')):
    x, y, z = c
    g = m.part(name, (x, y, z))
    prof = [(z, r * .7), (z - length * .12, r), (z - length * .34, r * .88), (z - length * .58, r * .6), (z - length * .82, r * .28), (z - length, 0.0)]
    g.lathe(prof, 14, [cols[0], cols[1], cols[2], cols[2], cols[3]], (x, y, 0))
    return g


# ---- player ------------------------------------------------------------------
def player():
    m = Model('player', bevel=.035)
    b = m.part('hull')
    b.hull([(5.4, .02, .02, -.05), (4.5, .26, .17, -.05), (3.0, .56, .36, 0), (1.4, .80, .56, .05), (-.4, .96, .68, .08), (-2.2, .92, .62, .05), (-3.6, .7, .46, 0), (-4.0, .52, .34, 0)], 28,
           ['pale', 'pale', 'blue', 'blue', 'pale', 'navy', 'gun'])
    b.hull([(2.9, .04, .04, .4), (2.2, .32, .24, .46), (1.0, .46, .38, .6), (-.2, .4, .34, .66), (-.8, .12, .1, .68)], 20, 'glass')
    b.box((0, .98, -1.6), (.1, .9, 2.2), 'crimson', taper=.3, taper_y=.4)
    greeble(b, 11, 22, (-.7, .7), (.55, .78), (-3.2, .4), ['gun', 'steel', 'dark', 'amber'], .32)
    greeble(b, 12, 12, (-.8, .8), (-.72, -.56), (-3.2, 2.0), ['gun', 'dark', 'steel'], .3)
    for s, nm in ((1, 'wingR'), (-1, 'wingL')):
        w = m.part(nm, (s * .8, 0, -.8))
        w.plate([(s * .7, 1.6), (s * 3.9, -1.3), (s * 4.5, -2.5), (s * 3.5, -2.7), (s * .7, -2.5)], .16, 'blue', y=-.05, edge='pale')
        w.plate([(s * 2.4, -.55), (s * 3.9, -1.5), (s * 4.3, -2.42), (s * 3.5, -2.55), (s * 2.4, -2.4)], .2, 'crimson', y=-.04)
        w.cyl((s * 4.45, -.05, -2.9), (s * 4.45, -.05, -.2), .13, .09, 12, 'gun')
        w.cyl((s * 4.45, -.05, -.2), (s * 4.45, -.05, .9), .06, .04, 10, 'dark')
        for i in range(5):
            w.box((s * (1.25 + i * .5), .06, -1.3 - i * .12), (.09, .05, .9), 'navy')
    for s, nm in ((1, 'podR'), (-1, 'podL')):
        p = m.part(nm, (s * 1.25, -.1, -2.4))
        p.lathe([(-.1, .0), (.2, .32), (.9, .52), (-.1 - 2.6, .55), (-.3 - 2.9, .42)], 18, ['steel', 'blue', 'gun', 'dark'], (s * 1.25, -.1, -1.0))
        nozzle(p, (s * 1.25, -.1, -3.9), .46, .7)
    flame(m, 'flameR', (1.25, -.1, -4.3), .36, 3.4, ('f_white', 'f_cyan', 'f_blue', 'f_blue'))
    flame(m, 'flameL', (-1.25, -.1, -4.3), .36, 3.4, ('f_white', 'f_cyan', 'f_blue', 'f_blue'))
    m.clip('idle', 60, {
        'hull': {'pos': wave(1, .05, 60)},
        'wingR': {'rot': wave(2, .015, 60, 1, .4)}, 'wingL': {'rot': wave(2, -.015, 60, 1, .4)},
        'podR': {'rot': wave(0, .018, 60, 2)}, 'podL': {'rot': wave(0, .018, 60, 2, 1)},
        'flameR': {'scl': flicker(60, .86, 1.16, 1)}, 'flameL': {'scl': flicker(60, .86, 1.16, 2)},
    })
    return m


# ---- enemies -----------------------------------------------------------------
def dart():
    m = Model('dart', bevel=.03)
    b = m.part('body')
    b.hull([(5.6, .02, .02, 0), (4.0, .46, .28, 0), (1.8, .92, .52, .06), (-.4, 1.2, .66, .1), (-2.6, 1.0, .56, .05), (-3.4, .66, .4, 0)], 22, ['crimson', 'crimson', 'wine', 'crimson', 'gun'])
    b.hull([(3.1, .05, .05, .32), (2.1, .34, .24, .44), (.7, .4, .3, .52), (.1, .08, .06, .55)], 16, 'glass_v')
    greeble(b, 21, 18, (-.9, .9), (.45, .68), (-2.8, 1.0), ['gun', 'dark', 'amber'], .34)
    greeble(b, 22, 8, (-.9, .9), (-.64, -.5), (-2.6, 1.6), ['dark', 'gun'], .3)
    nozzle(b, (0, 0, -3.4), .55, .8)
    for s, nm in ((1, 'finR'), (-1, 'finL')):
        f = m.part(nm, (s * .9, 0, -.6))
        f.plate([(s * .8, 1.7), (s * 4.4, 3.0), (s * 4.9, 2.4), (s * 3.1, -.5), (s * 2.5, -2.6), (s * .8, -2.2)], .16, 'crimson', edge='yellow')
        f.plate([(s * 2.2, .9), (s * 4.3, 2.75), (s * 3.0, -.1), (s * 2.4, -1.4)], .2, 'yellow')
        f.cyl((s * 4.6, 0, 1.4), (s * 4.75, 0, 3.6), .12, .03, 10, 'gun')
        for i in range(3):
            f.box((s * (1.3 + i * .42), .1, -.8 - i * .1), (.1, .06, 1.1), 'wine')
    flame(m, 'flame', (0, 0, -3.9), .46, 3.6)
    m.clip('idle', 48, {'body': {'rot': wave(2, .05, 48)},
                        'finR': {'rot': wave(1, .05, 48, 2)}, 'finL': {'rot': wave(1, -.05, 48, 2)},
                        'flame': {'scl': flicker(48, .8, 1.2, 3)}})
    return m


def wasp():
    m = Model('wasp', bevel=.03)
    b = m.part('thorax')
    b.hull([(3.2, .1, .1, 0), (2.4, .78, .66, .04), (1.0, 1.06, .92, .1), (-.5, .92, .82, .08), (-1.2, .5, .46, 0)], 22, ['amber', 'yellow', 'yellow', 'dark'])
    b.sphere((.48, .34, 2.5), .34, 14, 10, 'glass_r')
    b.sphere((-.48, .34, 2.5), .34, 14, 10, 'glass_r')
    for s in (1, -1):
        b.cyl((s * .3, -.3, 3.0), (s * .18, -.42, 4.4), .11, .03, 10, 'dark')
    greeble(b, 31, 14, (-.7, .7), (.74, .96), (-.9, 1.5), ['dark', 'gun', 'orange'], .3)
    tail = m.part('abdomen', (0, 0, -1.1))
    for i in range(6):
        z = -1.4 - i * .78
        r = 1.0 - abs(i - 1.6) * .17
        tail.lathe([(z + .42, r * .62), (z + .2, r), (z - .2, r), (z - .42, r * .62)], 18, ['dark', 'yellow' if i % 2 == 0 else 'dark', 'dark'])
    tail.cyl((0, 0, -6.1), (0, 0, -7.2), .2, .02, 10, 'crimson')
    for s, nm in ((1, 'wingR'), (-1, 'wingL')):
        w = m.part(nm, (s * .7, .7, .2))
        w.plate([(s * .6, 1.3), (s * 3.2, 2.1), (s * 5.2, 1.0), (s * 5.3, -.3), (s * 3.2, -1.1), (s * .6, -.8)], .07, 'glass', y=.72, edge='amber')
        for i in range(5):
            w.box((s * (1.3 + i * .78), .76, .3), (.05, .05, 2.6 - i * .28), 'dark')
    for s, nm in ((1, 'podR'), (-1, 'podL')):
        p = m.part(nm, (s * 1.5, -.5, .4))
        p.lathe([(2.0, 0), (1.7, .22), (.9, .38), (-.9, .42), (-1.3, .25)], 14, ['gun', 'orange', 'gun', 'dark'], (s * 1.5, -.5, .4))
    flame(m, 'flame', (0, .2, -2.0), .001 + .24, 1.0)
    m.clip('idle', 30, {'wingR': {'rot': wave(2, .5, 30, 3, steps=24)}, 'wingL': {'rot': wave(2, -.5, 30, 3, steps=24)},
                        'abdomen': {'rot': wave(0, .14, 30)}, 'thorax': {'pos': wave(1, .07, 30)},
                        'podR': {'rot': wave(0, .08, 30, 1, 1)}, 'podL': {'rot': wave(0, .08, 30, 1, 2)},
                        'flame': {'scl': flicker(30, .7, 1.2, 4)}})
    return m


def splitter():
    m = Model('splitter', bevel=.035)
    c = m.part('core')
    c.lathe([(1.6, .15), (1.2, .9), (.2, 1.3), (-.9, 1.2), (-1.6, .5)], 22, ['gun', 'violet', 'purple', 'gun'])
    c.sphere((0, 0, 1.25), .5, 16, 10, 'glass_g')
    greeble(c, 41, 14, (-1.0, 1.0), (.82, 1.12), (-1.0, .8), ['dark', 'lime', 'gun'], .32)
    for s, nm in ((1, 'halfR'), (-1, 'halfL')):
        h = m.part(nm, (s * 2.8, 0, 0))
        h.hull([(4.4, .05, .05, 0), (3.0, .62, .46, 0), (.8, 1.1, .82, 0), (-1.8, 1.12, .84, 0), (-3.2, .7, .5, 0)], 20, ['lime', 'green', 'green', 'dark'])
        h.v = [(x + s * 2.8, y, z) for x, y, z in h.v]
        h.box((s * 1.4, 0, .2), (1.3, .34, 1.1), 'gun')
        h.cyl((s * 2.8, -.5, 2.0), (s * 2.8, -.5, 5.1), .17, .1, 12, 'dark')
        h.cyl((s * 3.4, .1, -3.2), (s * 3.4, .1, -3.9), .42, .3, 14, 'gun')
        h.cyl((s * 2.2, .1, -3.2), (s * 2.2, .1, -3.9), .42, .3, 14, 'gun')
        greeble(h, 42 + s, 13, (s * 2.1 - .5, s * 2.1 + 1.2) if s > 0 else (s * 2.1 - 1.2, s * 2.1 + .5), (.55, .9), (-2.2, 2.0), ['dark', 'yellow', 'gun'], .3)
    for s, nm in ((1, 'flameR'), (-1, 'flameL')):
        flame(m, nm, (s * 2.8, .1, -3.6), .36, 2.6, ('f_white', 'f_green', 'f_green', 'f_yellow'))
    m.clip('idle', 60, {'halfR': {'pos': wave(0, .22, 60)}, 'halfL': {'pos': wave(0, -.22, 60)},
                        'core': {'rot': spin(2, 60)},
                        'flameR': {'scl': flicker(60, .8, 1.2, 5), 'pos': wave(0, .22, 60)}, 'flameL': {'scl': flicker(60, .8, 1.2, 6), 'pos': wave(0, -.22, 60)}})
    return m


def orb():
    m = Model('orb', bevel=.03)
    c = m.part('shell')
    c.sphere((0, 0, 0), 3.0, 32, 20, 'teal')
    c.torus((0, 0, 0), 3.02, .12, 48, 8, 'dark', axis='y')
    c.torus((0, 0, 0), 3.02, .1, 48, 8, 'dark', axis='x')
    for i in range(16):
        t = i / 16 * TAU
        c.box((math.cos(t) * 2.8, math.sin(t) * 2.8, 1.35), (.5, .5, .22), 'cyan' if i % 2 else 'gun')
    e = m.part('eye', (0, 0, 2.1))
    e.lathe([(3.15, 0), (3.05, .55), (2.75, 1.0), (2.3, 1.18)], 26, ['l_magenta', 'magenta', 'dark'])
    e.torus((0, 0, 2.5), 1.22, .14, 32, 8, 'pale')
    ring = m.part('ring')
    ring.torus((0, 0, 0), 4.5, .26, 64, 10, 'steel', axis='z')
    for i in range(8):
        with ring.at(rot_z(i / 8 * TAU)):
            ring.box((4.5, 0, .12), (1.1, .68, .8), 'crimson' if i % 2 else 'gun')
            ring.cyl((4.5, 0, .4), (4.5, 0, 1.9), .16, .09, 10, 'dark')
            ring.box((3.72, 0, 0), (.6, .16, .18), 'gun')
    m.clip('idle', 72, {'ring': {'rot': spin(2, 72)}, 'shell': {'rot': wave(1, .1, 72)},
                        'eye': {'scl': pulse(72, .9, 1.06, 2)}})
    return m


def bomber():
    m = Model('bomber', bevel=.05)
    b = m.part('body')
    b.hull([(6.2, .3, .16, 0), (4.6, 2.0, .62, .05), (2.0, 3.0, 1.1, .12), (-1.6, 3.2, 1.2, .1), (-4.6, 2.4, .9, 0), (-5.4, 1.6, .6, 0)], 26, ['orange', 'orange', 'copper', 'gun', 'gun'])
    b.hull([(4.0, .08, .08, .55), (3.2, .62, .34, .68), (1.6, .86, .46, .94), (.5, .3, .16, 1.04)], 18, 'glass_r')
    greeble(b, 51, 34, (-2.6, 2.6), (.9, 1.26), (-4.2, 1.6), ['dark', 'gun', 'amber', 'steel'], .48)
    greeble(b, 52, 16, (-2.5, 2.5), (-1.18, -.92), (-3.8, 2.4), ['dark', 'gun'], .46)
    for s, nm in ((1, 'wingR'), (-1, 'wingL')):
        w = m.part(nm, (s * 2.8, 0, 0))
        w.plate([(s * 2.6, 2.8), (s * 8.4, -2.0), (s * 9.6, -4.0), (s * 7.2, -4.4), (s * 2.6, -3.6)], .32, 'orange', edge='amber')
        w.plate([(s * 5.2, -.6), (s * 8.5, -2.5), (s * 9.1, -3.7), (s * 7.2, -4.0), (s * 5.2, -3.4)], .4, 'gun')
        w.cyl((s * 9.1, 0, -4.2), (s * 9.1, 0, -1.0), .28, .16, 12, 'dark')
        for i in range(7):
            w.box((s * (3.4 + i * .72), .2, -1.8 - i * .1), (.18, .1, 1.8), 'copper')
    for s, nm in ((1, 'engR'), (-1, 'engL')):
        e = m.part(nm, (s * 4.0, -.5, -3.0))
        e.lathe([(.6, 0), (.3, .7), (-.6, 1.05), (-3.1, 1.12), (-3.8, .86)], 22, ['steel', 'gun', 'dark', 'orange'], (s * 4.0, -.5, -3.0))
        nozzle(e, (s * 4.0, -.5, -6.9), .96, 1.1)
    bay = m.part('bay', (0, -1.1, -.4))
    for s in (1, -1):
        bay.box((s * .95, -1.14, -.4), (1.8, .14, 3.8), 'crimson')
    flame(m, 'flameR', (4.0, -.5, -7.3), .78, 5.2)
    flame(m, 'flameL', (-4.0, -.5, -7.3), .78, 5.2)
    m.clip('idle', 72, {'body': {'pos': wave(1, .12, 72)}, 'wingR': {'rot': wave(2, .025, 72)}, 'wingL': {'rot': wave(2, -.025, 72)},
                        'engR': {'rot': wave(0, .04, 72, 2)}, 'engL': {'rot': wave(0, .04, 72, 2, 1)},
                        'bay': {'rot': [(0, (0, 0, 0)), (30, (0, 0, 0)), (40, (.6, 0, 0)), (60, (.6, 0, 0)), (72, (0, 0, 0))]},
                        'flameR': {'scl': flicker(72, .84, 1.14, 7)}, 'flameL': {'scl': flicker(72, .84, 1.14, 8)}})
    return m


def lancer():
    m = Model('lancer', bevel=.03)
    b = m.part('spine')
    b.hull([(8.6, .02, .02, 0), (6.0, .3, .3, 0), (1.4, .66, .66, 0), (-3.0, .92, .92, 0), (-4.2, .6, .6, 0)], 18, ['pale', 'cyan', 'blue', 'navy'])
    for i in range(7):
        z = 4.4 - i * 1.15
        r = .36 + i * .09
        b.torus((0, 0, z), r + .08, .09, 28, 6, 'l_cyan' if i % 2 == 0 else 'dark')
    greeble(b, 61, 12, (-.45, .45), (.5, .8), (-3.0, 1.2), ['dark', 'gun', 'pale'], .25)
    nozzle(b, (0, 0, -4.4), .6, .8, ('gun', 'dark', 'cyan'))
    for i, nm in enumerate(('prongA', 'prongB', 'prongC')):
        p = m.part(nm, (0, 0, -.5))
        with p.at(rot_z(i / 3 * TAU + math.pi / 2)):
            p.plate([(.6, -2.6), (2.5, -1.4), (3.0, 2.6), (1.9, 6.0), (1.1, 1.6)], .24, 'blue', edge='pale')
            p.cyl((1.9, 0, 5.8), (1.42, 0, 8.0), .15, .02, 10, 'l_cyan')
            for j in range(3):
                p.box((1.7, .15, -.8 + j * 1.2), (.7, .07, .6), 'navy')
    flame(m, 'flame', (0, 0, -4.9), .5, 3.6, ('f_white', 'f_cyan', 'f_blue', 'f_blue'))
    def open_rot(i):
        return [(0, (0, 0, 0)), (24, (0, 0, 0)), (40, (0, 0, .26 * (1 if i % 2 else -1))), (54, (0, 0, .26 * (1 if i % 2 else -1))), (60, (0, 0, 0))]
    m.clip('idle', 60, {'spine': {'rot': spin(2, 60)}, 'prongA': {'rot': open_rot(0)}, 'prongB': {'rot': open_rot(1)}, 'prongC': {'rot': open_rot(2)},
                        'flame': {'scl': flicker(60, .84, 1.2, 9)}})
    return m


def warden():
    m = Model('warden', bevel=.05)
    b = m.part('body')
    b.hull([(3.0, .8, .6, 0), (1.6, 1.9, 1.3, 0), (-1.2, 2.2, 1.5, 0), (-3.2, 1.5, 1.0, 0), (-3.8, 1.0, .7, 0)], 24, ['gun', 'green', 'teal', 'dark'])
    greeble(b, 71, 26, (-1.8, 1.8), (1.2, 1.6), (-3.0, 1.4), ['dark', 'gun', 'lime'], .42)
    for s in (1, -1):
        b.cyl((s * 1.3, -.8, .4), (s * 1.3, -.8, 4.4), .22, .14, 12, 'dark')
        nozzle(b, (s * 1.2, 0, -3.8), .62, .7)
    sh = m.part('shield', (0, 0, 3.4))
    for i in range(9):
        ang = (i - 4) * .25
        edge = abs(i - 4) / 4
        h = 5.6 - edge * 1.7
        with sh.at(trans(math.sin(ang) * 6.6, 0, math.cos(ang) * 6.6 - 3.2) @ rot_y(ang)):
            sh.box((0, 0, 0), (1.56, h, .3), 'steel' if i % 2 else 'teal', taper=.96)
            sh.box((0, 0, .19), (.2, h * .86, .08), 'l_cyan')
            sh.box((0, h / 2 - .22, .17), (1.3, .16, .1), 'dark')
            sh.box((0, -h / 2 + .22, .17), (1.3, .16, .1), 'dark')
            for sd in (1, -1):
                sh.cyl((sd * .6, h * .36, .14), (sd * .6, h * .36, .24), .07, .06, 8, 'pale')
                sh.cyl((sd * .6, -h * .36, .14), (sd * .6, -h * .36, .24), .07, .06, 8, 'pale')
    for s, nm in ((1, 'armR'), (-1, 'armL')):
        a = m.part(nm, (s * 2.0, 0, 1.6))
        a.box((s * 3.2, 0, 1.8), (2.6, .5, .7), 'gun')
        a.cyl((s * 4.4, -.6, 1.8), (s * 4.4, .6, 1.8), .4, .4, 14, 'lime')
    flame(m, 'flameR', (1.2, 0, -4.3), .5, 2.8, ('f_white', 'f_green', 'f_green', 'f_yellow'))
    flame(m, 'flameL', (-1.2, 0, -4.3), .5, 2.8, ('f_white', 'f_green', 'f_green', 'f_yellow'))
    m.clip('idle', 60, {'body': {'pos': wave(1, .1, 60)}, 'shield': {'rot': wave(1, .09, 60), 'scl': pulse(60, .985, 1.02, 2)},
                        'armR': {'rot': wave(1, .1, 60)}, 'armL': {'rot': wave(1, -.1, 60)},
                        'flameR': {'scl': flicker(60, .85, 1.15, 10)}, 'flameL': {'scl': flicker(60, .85, 1.15, 11)}})
    return m


def mine():
    m = Model('mine', bevel=.025)
    c = m.part('core')
    c.sphere((0, 0, 0), 2.1, 28, 18, 'gun')
    c.torus((0, 0, 0), 2.12, .1, 40, 8, 'yellow', axis='y')
    c.torus((0, 0, 0), 2.12, .08, 40, 8, 'dark', axis='x')
    light = m.part('light')
    light.sphere((0, 0, 2.0), .48, 16, 12, 'l_red')
    sp = m.part('spikes')
    dirs = []
    phi = math.pi * (3 - math.sqrt(5))
    for i in range(26):
        y = 1 - i / 25 * 2
        r = math.sqrt(max(0, 1 - y * y))
        dirs.append((math.cos(phi * i) * r, y, math.sin(phi * i) * r))
    for d in dirs:
        if d[2] > .86:
            continue
        sp.cyl((d[0] * 1.9, d[1] * 1.9, d[2] * 1.9), (d[0] * 3.2, d[1] * 3.2, d[2] * 3.2), .24, .03, 10, 'crimson' if int(d[0] * 9) % 2 else 'steel')
        sp.cyl((d[0] * 1.95, d[1] * 1.95, d[2] * 1.95), (d[0] * 2.2, d[1] * 2.2, d[2] * 2.2), .36, .34, 12, 'dark')
    m.clip('idle', 60, {'spikes': {'rot': spin(1, 60), 'scl': pulse(60, .94, 1.08, 2)}, 'core': {'rot': spin(1, 60)},
                        'light': {'scl': [(0, (.55, .55, .55)), (10, (1.25, 1.25, 1.25)), (22, (.55, .55, .55)), (40, (1.25, 1.25, 1.25)), (60, (.55, .55, .55))]}})
    return m


def missile(name, body, band, fin, fl_cols, length=4.2):
    m = Model(name, bevel=.018)
    b = m.part('body')
    b.lathe([(length, 0), (length - .5, .14), (length - 1.2, .32), (.6, .4), (-length * .5, .4), (-length * .5 - .22, .28)], 22, [band, body, body, 'gun', 'dark'])
    for i in range(8):
        z = length - 1.6 - i * .55
        b.torus((0, 0, z), .405, .025, 26, 5, 'dark')
    studs(b, 12, .36, .035, .3, 'pale')
    fins = m.part('fins', (0, 0, -1.4))
    for i in range(4):
        with fins.at(rot_z(i / 4 * TAU + .785)):
            fins.plate([(.34, -.6), (1.25, -2.3), (1.3, -2.8), (.34, -2.1)], .06, fin)
            fins.plate([(.34, 1.0), (.62, .4), (.62, .1), (.34, .3)], .05, fin)
    flame(m, 'flame', (0, 0, -length * .5 - .22), .24, 2.6, fl_cols)
    m.clip('idle', 30, {'body': {'rot': spin(2, 30)}, 'fins': {'rot': spin(2, 30)}, 'flame': {'scl': flicker(30, .78, 1.2, 12)}})
    return m


# ---- rocks (static, spun per instance) -----------------------------------------
def rock(name, r, seed, pals, sq, sub=4):
    m = Model(name, bevel=0, lods=(1.0, .34, .1), auto_smooth=56)
    g = m.part('rock')
    g.rock((0, 0, 0), r, sub, seed, pals, sq)
    rr = random.Random(seed)
    for i in range(5):
        t, p = rr.uniform(0, TAU), rr.uniform(-1, 1)
        q = math.sqrt(1 - p * p)
        g.rock((math.cos(t) * q * r * .86, p * r * .86, math.sin(t) * q * r * .86), r * rr.uniform(.08, .16), 2, seed + i, ['ore', 'crystal'] if i % 2 else ['ore'], (1, 1.4, 1), .2)
    return m


# ---- bolts and small static objects --------------------------------------------
def bolt(name, cols, rad, length):
    m = Model(name, bevel=0, lods=(1.0, .2, .04), ao=False, auto_smooth=120)
    g = m.part('bolt')
    n = 26
    prof = []
    for i in range(21):
        u = i / 20
        z = length * (.5 - u)
        r = rad * (math.sin(min(1, u * 5) * math.pi / 2) * (1 - u) ** .5 + .02)
        prof.append((z, r if 0 < i < 20 else 0.0))
    bands = [cols[min(len(cols) - 1, int(i / 20 * len(cols)))] for i in range(20)]
    g.lathe(prof, n, bands)
    return m


def orb_shot(name, cols, r):
    m = Model(name, bevel=0, lods=(1.0, .2, .05), ao=False, auto_smooth=120)
    g = m.part('shot')
    g.sphere((0, 0, 0), r, 32, 18, cols[0])
    g.torus((0, 0, 0), r * .98, r * .13, 36, 6, cols[1], axis='y')
    g.torus((0, 0, 0), r * .98, r * .13, 36, 6, cols[1], axis='x')
    return m


def beam():
    m = Model('beam', bevel=0, lods=(1.0, .4, .12), ao=False)
    g = m.part('beam')
    prof = [(float(i) / 24 - .5, 1.0) for i in range(25)]
    g.lathe(prof, 24, ['f_white', 'f_cyan'] * 12)
    return m


def beam_warn():
    m = Model('beam_warn', bevel=0, lods=(1.0, .4, .12), ao=False)
    g = m.part('w')
    g.lathe([(float(i) / 24 - .5, 1.0) for i in range(25)], 24, ['l_red', 'dark'] * 12)
    return m


def dust():
    m = Model('dust', bevel=0, lods=(1.0, .1, .012), ao=False)
    g = m.part('d')
    g.lathe([(float(i) / 20 - .5, .05 * math.sin(i / 20 * math.pi) + .002) for i in range(21)], 26, 'dust')
    return m


# ---- pickups -----------------------------------------------------------------
def pickup(kind, col, lit, icon):
    m = Model('pick_' + kind, bevel=.015)
    s = m.part('shell')
    s.lathe([(1.5, 0), (1.42, .42), (1.08, .86), (.5, 1.1), (-.5, 1.1), (-1.08, .86), (-1.42, .42), (-1.5, 0)], 28, ['pale', 'pale', col, 'dark', col, 'pale', 'pale'], axis='y')
    studs_y = 16
    for i in range(studs_y):
        t = i / studs_y * TAU
        s.box((math.cos(t) * 1.12, 0, math.sin(t) * 1.12), (.16, .36, .16), lit)
    ring = m.part('ring')
    ring.torus((0, 0, 0), 1.72, .09, 48, 8, lit, axis='y')
    for i in range(8):
        t = i / 8 * TAU
        ring.box((math.cos(t) * 1.72, 0, math.sin(t) * 1.72), (.26, .26, .26), 'gun')
    g = m.part('icon')
    icon(g, lit)
    m.clip('idle', 60, {'shell': {'rot': spin(1, 60)}, 'ring': {'rot': [(i * 5, (.5, i / 12 * TAU, 0)) for i in range(13)]},
                        'icon': {'rot': spin(1, 60, 2), 'scl': pulse(60, .92, 1.1, 2)}})
    return m


def icon_gun(g, c):
    g.box((0, 0, 0), (.3, .3, 2.5), c, taper=.3)
    g.box((0, -.05, -.5), (1.2, .18, .5), c)


def icon_rkt(g, c):
    g.lathe([(1.3, 0), (.7, .3), (-.8, .3), (-1.1, .15)], 16, c)
    for i in range(3):
        with g.at(rot_z(i / 3 * TAU)):
            g.box((.48, 0, -.8), (.56, .08, .55), c)


def icon_shield(g, c):
    g.plate([(0, 1.3), (1.0, .8), (.85, -.5), (0, -1.3), (-.85, -.5), (-1.0, .8)], .22, c, y=0)


def icon_cross(g, c):
    g.box((0, 0, 0), (.5, .5, 2.2), c)
    g.box((0, 0, 0), (2.2, .5, .5), c)


def icon_nova(g, c):
    for i in range(6):
        with g.at(rot_y(i / 6 * TAU)):
            g.cyl((0, 0, .2), (0, 0, 1.4), .3, .02, 10, c)
    g.sphere((0, 0, 0), .42, 14, 10, c)


def icon_bolt(g, c):
    g.plate([(.35, 1.4), (-.6, -.1), (-.05, -.1), (-.4, -1.4), (.7, .25), (.1, .25)], .25, c)


def scrap():
    m = Model('pick_scrap', bevel=.01)
    g = m.part('gear')
    n = 12
    pts = []
    for i in range(n * 4):
        t = i / (n * 4) * TAU
        r = .9 if (i % 4) < 2 else .68
        pts.append((math.cos(t) * r, math.sin(t) * r))
    g.plate(pts, .26, 'brass', edge='copper')
    g.torus((0, 0, 0), .32, .07, 28, 6, 'dark', axis='y')
    b = m.part('bits')
    for i in range(24):
        t = i / 24 * TAU
        b.box((math.cos(t) * .52, .17, math.sin(t) * .52), (.09, .07, .12), 'amber' if i % 2 else 'gun')
    m.clip('idle', 45, {'gear': {'rot': [(i * 3, (i / 15 * TAU, i / 15 * TAU * 2, 0)) for i in range(16)]},
                        'bits': {'rot': [(i * 3, (i / 15 * TAU, i / 15 * TAU * 2, 0)) for i in range(16)]}})
    return m


# ---- effects, every chunk a keyed bone ------------------------------------------
def _dir(r):
    t, p = r.uniform(0, TAU), r.uniform(-1, 1)
    q = math.sqrt(1 - p * p)
    return math.cos(t) * q, p, math.sin(t) * q


def spike_burst(name, count, frames, reach, seed, cols, rad=.16, length=1.0, cone=0.0):
    """Sharp flame blades: each bone aims one spindle outward and stretches it."""
    m = Model(name, bevel=0, lods=(1.0, .55, .25), ao=False, auto_smooth=70)
    m.flex = 0
    r = random.Random(seed)
    tracks = {}
    for i in range(count):
        nm = f'c{i:02d}'
        g = m.part(nm)
        L = length * r.uniform(.55, 1.3)
        w = rad * r.uniform(.6, 1.35)
        if r.random() < .68:  # most tongues are short and full, a few long ones break the silhouette
            L *= r.uniform(.36, .58)
            w *= r.uniform(1.5, 2.1)
        g.lathe([(0, 0), (L * .07, w * .72), (L * .26, w), (L * .55, w * .62), (L * .82, w * .22), (L, 0)], 8, list(cols))
        d = _dir(r)
        if cone:
            d = (d[0] * cone, d[1] * cone, abs(d[2]) + .55)
            n = math.sqrt(d[0] ** 2 + d[1] ** 2 + d[2] ** 2)
            d = (d[0] / n, d[1] / n, d[2] / n)
        yaw, pit = math.atan2(d[0], d[2]), -math.asin(max(-1, min(1, d[1])))
        roll_end = r.uniform(-.7, .7)
        delay = r.randint(0, max(1, frames // 7))
        far = reach * r.uniform(.32, 1.0)
        peak = r.uniform(.8, 1.25)
        key = lambda u: min(frames, delay + round(u * (frames - delay)))
        tracks[nm] = {
            'rot': [(0, (pit, yaw, 0)), (frames, (pit, yaw, roll_end))],
            'pos': [(key(u), (d[0] * far * e, d[1] * far * e, d[2] * far * e)) for u, e in ((0, 0), (.3, .62), (.65, .9), (1, 1))],
            'scl': [(0, (.03,) * 3), (key(.12), (peak,) * 3), (key(.42), (peak * .92,) * 3), (key(.78), (peak * .4,) * 3), (frames, (.02,) * 3)],
        }
    m.clip('play', frames, tracks, loop=False)
    return m


def smoke(name, count, frames, reach, seed, size):
    m = Model(name, bevel=0, lods=(1.0, .6, .3), ao=False, auto_smooth=180)
    m.flex = 0
    r = random.Random(seed)
    tracks = {}
    for i in range(count):
        nm = f'c{i:02d}'
        g = m.part(nm)
        g.rock((0, 0, 0), size * r.uniform(.34, .8), 2, seed + i, [['sm_a', 'sm_b', 'sm_c'][i % 3]], (1, r.uniform(.85, 1.12), 1), .07)
        d = _dir(r)
        far = reach * r.uniform(.3, 1)
        delay = r.randint(0, frames // 5)
        key = lambda u: min(frames, delay + round(u * (frames - delay)))
        tr = (r.uniform(-1, 1), r.uniform(-1, 1), r.uniform(-1, 1))
        tracks[nm] = {'pos': [(key(u), (d[0] * far * e, d[1] * far * e + u * size * .7, d[2] * far * e)) for u, e in ((0, .05), (.25, .55), (.6, .86), (1, 1))],
                      'rot': [(0, (0, 0, 0)), (frames, tr)],
                      'scl': [(0, (.04,) * 3), (key(.14), (.7,) * 3), (key(.42), (1.05,) * 3), (key(.72), (.62,) * 3), (frames, (.02,) * 3)]}
    m.clip('play', frames, tracks, loop=False)
    return m


def shards(name, count, frames, reach, seed):
    m = Model(name, bevel=0, lods=(1.0, .6, .3), ao=False, auto_smooth=25)
    m.flex = 0
    r = random.Random(seed)
    cols = ['steel', 'gun', 'dark', 'pale', 'crimson', 'copper']
    tracks = {}
    for i in range(count):
        nm = f'c{i:02d}'
        g = m.part(nm)
        sz = r.uniform(.2, .62)
        poly = []
        for k in range(8):
            a = k / 8 * TAU
            q = sz * r.uniform(.42, 1.0)
            poly.append((math.cos(a) * q, math.sin(a) * q * r.uniform(.5, 1.1)))
        g.plate(poly, sz * .16, cols[i % len(cols)], edge='f_orange' if i % 5 == 0 else 'dark')
        d = _dir(r)
        far = reach * r.uniform(.35, 1.05)
        sp = (r.uniform(-9, 9), r.uniform(-9, 9), r.uniform(-9, 9))
        tracks[nm] = {'pos': [(round(u * frames), (d[0] * far * e, d[1] * far * e, d[2] * far * e)) for u, e in ((0, 0), (.14, .46), (.4, .78), (.72, .94), (1, 1))],
                      'rot': [(round(u * frames), (sp[0] * u, sp[1] * u, sp[2] * u)) for u in (0, .34, .67, 1)],
                      'scl': [(0, (1,) * 3), (round(frames * .72), (.92,) * 3), (frames, (.02,) * 3)]}
    m.clip('play', frames, tracks, loop=False)
    return m


def imp_shield():
    m = Model('imp_shield', bevel=0, lods=(1.0, .7, .4), ao=False, auto_smooth=30)
    m.flex = 0
    r = random.Random(77)
    tracks = {}
    cells = [(0, 0)]
    for ring in range(1, 4):
        for k in range(ring * 6):
            a = k / (ring * 6) * TAU
            cells.append((math.cos(a) * ring * .62, math.sin(a) * ring * .62))
    for i, (x, y) in enumerate(cells[:32]):
        nm = f'c{i:02d}'
        g = m.part(nm, (x, y, 0))
        g.lathe([(-.05, 0), (-.02, .3), (.03, .3), (.06, 0)], 6, ['f_blue', 'f_cyan', 'f_white'], (x, y, 0), phase=math.pi / 6)
        d = math.hypot(x, y)
        t0 = round(d * 2.4)
        tracks[nm] = {'scl': [(0, (.02,) * 3), (t0, (.02,) * 3), (t0 + 2, (1.05,) * 3), (t0 + 6, (.72,) * 3), (16, (.02,) * 3)],
                      'pos': [(0, (0, 0, 0)), (t0 + 2, (0, 0, .12)), (16, (0, 0, -.05 + r.uniform(0, .04)))]}
    m.clip('play', 16, tracks, loop=False)
    return m


def shock():
    m = Model('shock', bevel=0, lods=(1.0, .5, .25), ao=False, auto_smooth=60)
    m.flex = 0
    tracks = {}
    n = 28
    for i in range(n):
        nm = f's{i:02d}'
        a = (i + .5) / n * TAU
        c, s_ = math.cos(a), math.sin(a)
        g = m.part(nm, (c, s_, 0))
        with g.at(trans(c, s_, 0) @ rot_z(a)):
            g.lathe([(-.13, 0), (-.08, .018), (.0, .03), (.08, .018), (.13, 0)], 10, ['f_orange', 'f_yellow', 'f_white', 'f_yellow'], axis='y')
        tracks[nm] = {'pos': [(0, (-c * .92, -s_ * .92, 0)), (5, (c * .9, s_ * .9, 0)), (11, (c * 1.9, s_ * 1.9, 0)), (20, (c * 2.6, s_ * 2.6, 0))],
                      'scl': [(0, (.5,) * 3), (5, (1.5,) * 3), (12, (1.0,) * 3), (20, (.02,) * 3)]}
    m.clip('play', 20, tracks, loop=False)
    return m


def tracer(name, cols):
    m = Model(name, bevel=0, lods=(1.0, .24, .05), ao=False, auto_smooth=120)
    g = m.part('t')
    prof = [(.5 - i / 20, .5 * min(1, (i / 20) * 7) ** .6 * (1 - i / 20) ** .55 + .002) for i in range(21)]
    prof[0] = (.5, 0)
    prof[-1] = (-.5, 0)
    bands = [cols[min(len(cols) - 1, int(i / 20 * len(cols)))] for i in range(20)]
    g.lathe(prof, 26, bands)
    return m


def muzzle():
    m = Model('bolt_muzzle', bevel=0, lods=(1.0, .35, .12), ao=False, auto_smooth=70)
    g = m.part('m')
    spin_ = [(0, 2.5, .26), (1, .95, .17), (2, 1.4, .2), (3, .95, .17), (4, 1.9, .22), (5, .95, .17), (6, 1.4, .2), (7, .95, .17)]
    for k, L, w in spin_:
        with g.at(rot_z(k / 8 * TAU)):
            g.lathe([(0, w), (L * .2, w * .82), (L * .5, w * .42), (L * .8, w * .12), (L, 0)], 14, ['f_white', 'f_yellow', 'f_orange', 'f_red'], axis='y')
    g.lathe([(0, .3), (.8, .22), (1.7, .1), (2.6, 0)], 16, ['f_white', 'f_white', 'f_yellow'])
    return m


def aimline():
    m = Model('aimline', bevel=0, lods=(1.0, .5, .2), ao=False, auto_smooth=120)
    g = m.part('a')
    g.lathe([(i / 36 - .5, 1.0) for i in range(37)], 16, ['l_cyan', 'dark'] * 18)
    return m


def puff():
    m = Model('puff', bevel=0, lods=(1.0, .12, .03), ao=False, auto_smooth=180)
    g = m.part('p')
    g.rock((0, 0, 0), 1.0, 4, 91, ['smoke_b', 'smoke_a', 'smoke_b'], (1, .9, 1), .2)
    return m


def _strip(g, a, b, w, pal, n=24):
    ax, ay = a
    bx, by = b
    ln = math.hypot(bx - ax, by - ay) or 1
    ang = math.atan2(by - ay, bx - ax)
    for i in range(n):
        u = (i + .5) / n
        with g.at(trans(ax + (bx - ax) * u, ay + (by - ay) * u, 0) @ rot_z(ang)):
            g.box((0, 0, 0), (ln / n * 1.02, w, .01), pal)


def hud_cross():
    m = Model('hud_cross', bevel=0, lods=(1.0, .7, .5), ao=False)
    g = m.part('h')
    for k in range(4):
        with g.at(rot_z(k / 4 * TAU)):
            _strip(g, (.42, 0), (1.0, 0), .075, 'l_green', 18)
            _strip(g, (.42, .06), (.42, -.06), .05, 'l_white', 4)
    for k in range(4):
        a0, a1 = (k + .12) / 4 * TAU, (k + .38) / 4 * TAU
        for j in range(10):
            u0, u1 = a0 + (a1 - a0) * j / 10, a0 + (a1 - a0) * (j + 1) / 10
            _strip(g, (math.cos(u0) * .78, math.sin(u0) * .78), (math.cos(u1) * .78, math.sin(u1) * .78), .035, 'l_green', 2)
    g.lathe([(-.01, 0), (0, .07), (.01, .07), (.012, 0)], 16, 'l_white')
    return m


def hud_shape(name, lines, pal, w=.09, n=24):
    m = Model(name, bevel=0, lods=(1.0, .7, .5), ao=False)
    g = m.part('h')
    for a, b in lines:
        _strip(g, a, b, w, pal, n)
    return m


def hud_marks():
    corners = []
    for sx, sy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
        corners += [((sx, sy), (sx * .58, sy)), ((sx, sy), (sx, sy * .58))]
    return [hud_cross(),
            hud_shape('hud_lock', corners, 'l_orange', .07, 12),
            hud_shape('hud_lead', [((0, .62), (.62, 0)), ((.62, 0), (0, -.62)), ((0, -.62), (-.62, 0)), ((-.62, 0), (0, .62))], 'l_yellow', .11, 24),
            hud_shape('hud_hit', [((.34, .34), (1, 1)), ((-.34, .34), (-1, 1)), ((.34, -.34), (1, -1)), ((-.34, -.34), (-1, -1))], 'l_white', .13, 24),
            hud_shape('hud_kill', [((.3, .3), (1.1, 1.1)), ((-.3, .3), (-1.1, 1.1)), ((.3, -.3), (1.1, -1.1)), ((-.3, -.3), (-1.1, -1.1))], 'l_red', .17, 24),
            hud_shape('hud_arrow', [((1, 0), (-.5, .8)), ((1, 0), (-.5, -.8)), ((-.5, .8), (-.1, 0)), ((-.5, -.8), (-.1, 0))], 'l_red', .16, 24)]


# ---- bosses -----------------------------------------------------------------
def boss0_core():
    m = Model('boss0_core', bevel=.09, segs=2)
    b = m.part('carapace')
    b.hull([(11, 7.5, 3.4, .6), (8, 11.5, 5.6, .9), (1, 15, 7.4, 1.2), (-8, 14, 6.8, .8), (-15, 10, 5, .2), (-18, 7, 3.4, 0)], 36, ['wine', 'crimson', 'crimson', 'gun', 'dark'], power=3.0)
    # overlapping armour plates over the brow, like a beetle's shell
    for i in range(7):
        w = 21 - i * 1.5
        z = 10.5 - i * 3.3
        y = 6.2 + math.sin(i * .55) * 1.3
        b.box((0, y, z), (w, .9, 4.2), 'crimson' if i % 2 else 'orange', taper=.8, taper_y=.55)
        for sd in (1, -1):
            b.box((sd * (w * .5 - .4), y - 1.9, z - .4), (2.0, 3.4, 3.8), 'wine', taper=.7)
    for sd in (1, -1):
        for i in range(5):
            b.cyl((sd * (7.5 + i * 1.3), 4.6 + i * .25, 9.4 - i * 3.2), (sd * (9.6 + i * 1.3), 7.6 + i * .25, 7.4 - i * 3.2), .62, .04, 10, 'bone')
    greeble(b, 101, 58, (-11, 11), (6.0, 7.8), (-15, 7), ['gun', 'dark', 'amber', 'steel'], 1.5)
    greeble(b, 102, 40, (-11, 11), (-7.0, -5.4), (-14, 8), ['dark', 'gun', 'copper'], 1.5)
    for s in (1, -1):
        b.cyl((s * 8, 2, -17), (s * 8, 2, -22), 2.7, 2.2, 20, 'gun')
    b.cyl((0, -1, -17), (0, -1, -24), 3.2, 2.5, 22, 'gun')
    # mandibles: two hard wedges with a row of teeth
    jaw = m.part('jaw', (0, -2.4, 9))
    for sd in (1, -1):
        jaw.plate([(sd * .5, 8.4), (sd * 8.6, 9.0), (sd * 11.6, 13.0), (sd * 7.2, 15.6), (sd * 3.0, 19.0), (sd * .5, 15.0)], 1.5, 'gun', y=-3.5, edge='orange')
        jaw.plate([(sd * 2.0, 12.0), (sd * 8.4, 11.0), (sd * 7.0, 14.4), (sd * 3.2, 17.0)], 1.8, 'wine', y=-3.5)
        for i in range(7):
            x = sd * (1.5 + i * 1.3)
            z = 17.2 - i * .95
            jaw.cyl((x, -3.0, z - .2), (x, -.9, z + .25), .5, .03, 10, 'bone')
    eye = m.part('eye', (0, 2.2, 11))
    eye.box((0, 2.9, 11.3), (11.5, 2.3, 1.4), 'dark', taper=.9)
    for i in range(5):
        x = (i - 2) * 2.25
        eye.lathe([(11.6, .96 - abs(i - 2) * .12), (12.2, .84 - abs(i - 2) * .1), (12.45, 0.0)], 16, ['l_orange', 'l_yellow'], (x, 2.9, 0))
        eye.torus((x, 2.9, 11.75), 1.02 - abs(i - 2) * .12, .15, 22, 6, 'amber')
    tracks0 = {'carapace': {'pos': wave(1, .55, 90)}, 'jaw': {'rot': [(0, (0, 0, 0)), (40, (.08, 0, 0)), (60, (.3, 0, 0)), (75, (.05, 0, 0)), (90, (0, 0, 0))]}, 'eye': {'scl': pulse(90, .92, 1.08, 2)}}
    tracks1 = {'carapace': {'pos': wave(1, .8, 60), 'rot': wave(2, .05, 60)}, 'jaw': {'rot': [(0, (.1, 0, 0)), (20, (.4, 0, 0)), (36, (.08, 0, 0)), (60, (.1, 0, 0))]}, 'eye': {'scl': pulse(60, .86, 1.14, 3)}}
    tracks2 = {'carapace': {'pos': wave(1, 1.1, 40), 'rot': wave(2, .09, 40, 2)}, 'jaw': {'rot': [(0, (.25, 0, 0)), (12, (.55, 0, 0)), (24, (.2, 0, 0)), (40, (.25, 0, 0))]}, 'eye': {'scl': pulse(40, .78, 1.22, 4)}}
    die = {'carapace': {'rot': [(0, (0, 0, 0)), (30, (.1, .08, .2)), (63, (.34, -.1, -.26))], 'pos': [(0, (0, 0, 0)), (63, (0, -6, -4))]}, 'jaw': {'rot': [(0, (0, 0, 0)), (20, (.65, 0, 0)), (63, (.9, 0, .2))]}, 'eye': {'scl': [(0, (1,) * 3), (40, (.7,) * 3), (63, (.05,) * 3)]}}
    m.clip('p0', 90, tracks0); m.clip('p1', 60, tracks1); m.clip('p2', 40, tracks2); m.clip('die', 63, die, loop=False)
    return m


def boss0_arm(name, s):
    m = Model(name, bevel=.07, segs=2)
    sh = m.part('shoulder', (0, 0, 0))
    sh.sphere((0, 0, 0), 4.6, 26, 16, 'gun')
    sh.torus((0, 0, 0), 4.6, .45, 42, 8, 'orange', axis='x')
    greeble(sh, 111 + s, 22, (-3, 3), (2.7, 4.2), (-3, 3), ['dark', 'amber', 'steel'], 1.2)
    up = m.part('upper', (s * 2, 0, 0))
    up.hull([(1, 2.3, 2.4, 0), (-1, 3.0, 2.8, 0), (-6, 2.6, 2.3, 0), (-9, 1.9, 1.8, 0)], 20, ['crimson', 'wine', 'crimson'])
    up.v = [(x * .9 + s * 7, y, -z * .2 + (x * .4)) for x, y, z in up.v]
    up.cyl((s * 2, 0, 0), (s * 11, 0, 3), 2.0, 1.5, 22, 'crimson')
    for i in range(7):
        t = i / 6
        up.box((s * (3.5 + t * 6.5), 2.2 - t * .7, .4 + t * 2.4), (1.2, .7, 1.8), 'orange' if i % 2 else 'dark')
    fore = m.part('fore', (s * 11, 0, 3))
    fore.cyl((s * 11, 0, 3), (s * 13, -.5, 14), 2.1, 1.6, 22, 'wine')
    fore.sphere((s * 11, 0, 3), 2.5, 22, 14, 'steel')
    for i in range(7):
        t = i / 6
        fore.box((s * (11 + 2 * t), 1.6 - t * .5 - .05, 4.5 + t * 8.5), (2.2, .6, .8), 'orange' if i % 2 else 'dark')
    for k, (nm, sg) in enumerate((('clawUp', 1), ('clawDn', -1))):
        c = m.part(nm, (s * 13, -.5, 14))
        c.plate([(s * 10.8, 13.4), (s * 15.4, 13.6), (s * 16.4, 19), (s * 14.2, 24.5), (s * 13.2, 25), (s * 13.6, 19.5)], 2.0, 'crimson', y=-.5 + sg * 1.3, edge='amber')
        for j in range(6):
            c.cyl((s * (13.6 + j * .28), -.5 + sg * .2, 15.6 + j * 1.45), (s * (13.0 + j * .28), -.5 - sg * .8, 16 + j * 1.45), .46, .03, 10, 'bone')
    cl_open = lambda sg, a: [(0, (sg * a * .3, 0, 0)), (30, (sg * a, 0, 0)), (60, (sg * a * .3, 0, 0)), (90, (sg * a * .3, 0, 0))]
    base = {'shoulder': {'rot': wave(1, .04, 90)}, 'upper': {'rot': wave(1, s * .1, 90, 1, .6)},
            'fore': {'rot': wave(1, s * -.15, 90, 1, 1.2)}, 'clawUp': {'rot': cl_open(1, .24)}, 'clawDn': {'rot': cl_open(-1, .24)}}
    fast = {'shoulder': {'rot': wave(1, .08, 60)}, 'upper': {'rot': wave(1, s * .18, 60, 1, .6)},
            'fore': {'rot': wave(1, s * -.26, 60, 1, 1.2)}, 'clawUp': {'rot': wave(0, .3, 60, 2, base=.14)}, 'clawDn': {'rot': wave(0, -.3, 60, 2, base=-.14)}}
    rage = {'shoulder': {'rot': wave(1, .12, 40, 2)}, 'upper': {'rot': wave(1, s * .28, 40, 2, .6)},
            'fore': {'rot': wave(1, s * -.36, 40, 2, 1.2)}, 'clawUp': {'rot': wave(0, .42, 40, 3, base=.2)}, 'clawDn': {'rot': wave(0, -.42, 40, 3, base=-.2)}}
    m.clip('p0', 90, base); m.clip('p1', 60, fast); m.clip('p2', 40, rage)
    return m


def boss1_core():
    m = Model('boss1_core', bevel=.08, segs=2)
    s = m.part('sphere')
    s.sphere((0, 0, 0), 13, 56, 36, 'navy')
    for la in range(-3, 4):
        y = la * 3.1
        R = math.sqrt(max(1, 13.1 ** 2 - y * y))
        s.torus((0, y, 0), R, .24, 72, 8, 'teal' if la % 2 else 'cyan', axis='y')
    for i in range(36):
        a = i / 36 * TAU
        for la in (-1, 1):
            y = la * 5.5
            R = math.sqrt(13.2 ** 2 - y * y)
            s.box((math.cos(a) * R, y, math.sin(a) * R), (1.2, .7, 1.2), 'gun' if i % 3 else 'l_cyan')
    iris = m.part('iris', (0, 0, 11))
    iris.lathe([(14.6, 0), (14.3, 1.6), (13.5, 3.5), (12.0, 5.4), (11.0, 6.2)], 40, ['dark', 'l_violet', 'violet', 'purple'])
    pupil = m.part('pupil', (0, 0, 14))
    pupil.sphere((0, 0, 14.2), 1.5, 22, 14, 'l_white')
    for i in range(14):
        with iris.at(rot_z(i / 14 * TAU)):
            iris.box((4.7, 0, 13.3), (1.8, .32, .34), 'l_magenta')
    r1 = m.part('ringA')
    r1.torus((0, 0, 0), 22, .9, 96, 12, 'steel', axis='z')
    for i in range(18):
        with r1.at(rot_z(i / 18 * TAU)):
            r1.box((22, 0, 0), (2.4, 2.6, 2.6), 'violet' if i % 3 == 0 else 'gun')
            if i % 3 == 0:
                r1.cyl((22, 0, 1.2), (22, 0, 4.4), .45, .25, 10, 'dark')
    r2 = m.part('ringB')
    r2.torus((0, 0, 0), 17.4, .55, 84, 10, 'teal', axis='y')
    for i in range(12):
        with r2.at(rot_y(i / 12 * TAU)):
            r2.box((17.4, 0, 0), (2, 1.2, 1.2), 'cyan' if i % 2 else 'dark')
    m.clip('p0', 120, {'ringA': {'rot': spin(2, 120)}, 'ringB': {'rot': spin(1, 120, -1)}, 'sphere': {'rot': wave(1, .05, 120)}, 'iris': {'rot': spin(2, 120, -1), 'scl': pulse(120, .96, 1.05, 3)}, 'pupil': {'scl': pulse(120, .8, 1.2, 3)}})
    m.clip('p1', 80, {'ringA': {'rot': spin(2, 80)}, 'ringB': {'rot': spin(1, 80, -1)}, 'sphere': {'rot': wave(1, .08, 80)}, 'iris': {'rot': spin(2, 80, -1), 'scl': pulse(80, .92, 1.1, 3)}, 'pupil': {'scl': pulse(80, .7, 1.3, 4)}})
    m.clip('p2', 60, {'ringA': {'rot': spin(2, 60, 2)}, 'ringB': {'rot': spin(1, 60, -2)}, 'sphere': {'rot': wave(1, .12, 60, 2)}, 'iris': {'rot': spin(2, 60, -2), 'scl': pulse(60, .86, 1.16, 4)}, 'pupil': {'scl': pulse(60, .6, 1.5, 5)}})
    m.clip('die', 63, {'ringA': {'rot': [(0, (0, 0, 0)), (63, (1.2, .8, 6.0))], 'scl': [(0, (1,) * 3), (45, (1.08,) * 3), (63, (.04,) * 3)]}, 'ringB': {'rot': [(0, (0, 0, 0)), (63, (-.8, -4.0, .6))], 'scl': [(0, (1,) * 3), (40, (.94,) * 3), (63, (.04,) * 3)]},
                       'sphere': {'scl': [(0, (1,) * 3), (50, (.94,) * 3), (63, (.7,) * 3)]}, 'iris': {'scl': [(0, (1,) * 3), (30, (1.2,) * 3), (63, (.04,) * 3)]}, 'pupil': {'scl': [(0, (1,) * 3), (20, (1.9,) * 3), (63, (.02,) * 3)]}}, loop=False)
    return m


def boss1_emitter():
    m = Model('boss1_emitter', bevel=.05)
    b = m.part('pod')
    b.lathe([(4.6, 0), (4.2, 1.1), (2.6, 2.5), (-.6, 3.1), (-3.2, 2.5), (-4.2, 1.1), (-4.6, 0)], 28, ['l_cyan', 'teal', 'navy', 'navy', 'gun', 'dark'])
    b.torus((0, 0, 0), 3.2, .22, 40, 8, 'pale')
    for i in range(14):
        with b.at(rot_z(i / 14 * TAU)):
            b.box((3.0, 0, -1.4), (.5, .5, 1.1), 'gun' if i % 2 else 'cyan')
    pet = m.part('petals', (0, 0, 2.6))
    for i in range(6):
        with pet.at(rot_z(i / 6 * TAU)):
            pet.plate([(1.0, 2.4), (2.9, 3.6), (3.4, 5.8), (1.9, 6.4), (1.1, 4.6)], .24, 'violet', edge='l_magenta')
    c = m.part('crystal', (0, 0, 3.6))
    c.lathe([(6.2, 0), (5.2, .6), (3.6, .9), (2.6, .5), (2.2, 0)], 14, ['crystal', 'crystal', 'glass_v', 'glass_v'])
    m.clip('idle', 60, {'pod': {'rot': spin(2, 60)}, 'petals': {'rot': spin(2, 60, -1)}, 'crystal': {'scl': pulse(60, .86, 1.16, 2)}})
    return m


def boss2_core():
    m = Model('boss2_core', bevel=.1, segs=2)
    b = m.part('tower')
    b.box((0, -3, 0), (26, 24, 18), 'gun', taper=.72, taper_y=.8)
    b.box((0, 12, -2), (15, 11, 12), 'dark', taper=.7)
    b.box((0, -17, 0), (36, 5, 24), 'navy', taper=.8)
    b.box((0, 19, 2), (8, 4, 5), 'gun', taper=.6)
    for i in range(11):
        x = (i - 5) * 2.6
        b.box((x, -3.5, 9.2), (1.3, 19, .9), 'pale' if i % 2 else 'steel')
    for i in range(6):
        y = -11 + i * 3.8
        b.box((0, y, 9.7), (24 - i * 1.6, .5, .5), 'brass')
    greeble(b, 121, 80, (-12, 12), (-14, 8), (8.4, 10.2), ['dark', 'brass', 'gun', 'steel'], 1.4)
    greeble(b, 122, 44, (-16, 16), (-19, -15), (-10, 11.5), ['gun', 'brass', 'dark'], 1.8)
    crown = m.part('crown', (0, 21, 1))
    for i in range(9):
        a = (i - 4) * .3
        h = 11 - abs(i - 4) * 1.3
        with crown.at(trans(math.sin(a) * 9, 20, math.cos(a) * 3 + 1) @ rot_z(-a * .8)):
            crown.lathe([(0, .9), (h * .6, .55), (h, 0)], 12, ['brass', 'amber'], axis='y')
    crown.torus((0, 21.5, 1), 9.6, .6, 64, 8, 'brass', axis='y')
    eye = m.part('visor', (0, 12, 4.3))
    eye.box((0, 13, 4.4), (11, 2, .6), 'l_red', taper=.84)
    for i in range(6):
        eye.box(((i - 2.5) * 1.8, 13, 4.9), (.5, .42, .24), 'l_white')
    seal = m.part('seal', (0, -3.5, 10.4))
    seal.torus((0, -3.5, 10.4), 5.4, .5, 56, 8, 'brass', axis='z')
    seal.lathe([(11.4, 0), (11.2, 2.6), (10.6, 4.4), (10.2, 5)], 40, ['l_violet', 'violet', 'purple'], (0, -3.5, 0))
    for i in range(8):
        with seal.at(trans(0, -3.5, 0) @ rot_z(i / 8 * TAU)):
            seal.box((4.2, 0, 11.3), (1.4, .34, .3), 'l_white')
    m.clip('p0', 120, {'crown': {'rot': wave(2, .025, 120)}, 'visor': {'scl': pulse(120, .95, 1.05, 2)}, 'seal': {'rot': spin(2, 120)}, 'tower': {'pos': wave(1, .4, 120)}})
    m.clip('p1', 80, {'crown': {'rot': wave(2, .05, 80, 2)}, 'visor': {'scl': pulse(80, .9, 1.1, 3)}, 'seal': {'rot': spin(2, 80, 2)}, 'tower': {'pos': wave(1, .6, 80)}})
    m.clip('p2', 60, {'crown': {'rot': wave(2, .09, 60, 3), 'pos': wave(1, .6, 60, 2)}, 'visor': {'scl': pulse(60, .8, 1.2, 4)}, 'seal': {'rot': spin(2, 60, 3)}, 'tower': {'pos': wave(1, .9, 60, 2), 'rot': wave(2, .02, 60)}})
    m.clip('die', 63, {'crown': {'pos': [(0, (0, 0, 0)), (20, (2, 4, 1)), (63, (6, -22, 10))], 'rot': [(0, (0, 0, 0)), (63, (1.4, .4, -2.2))]},
                       'tower': {'pos': [(0, (0, 0, 0)), (63, (0, -9, -4))], 'rot': [(0, (0, 0, 0)), (63, (.22, 0, .16))]},
                       'visor': {'scl': [(0, (1,) * 3), (24, (1.4,) * 3), (63, (.03,) * 3)]}, 'seal': {'rot': spin(2, 63, 3), 'scl': [(0, (1,) * 3), (63, (.05,) * 3)]}}, loop=False)
    return m


def boss2_gun(name, s):
    m = Model(name, bevel=.07, segs=2)
    mount = m.part('mount')
    mount.box((0, 0, -1), (10, 9, 10), 'gun', taper=.82)
    mount.box((0, 5, -1), (7, 2, 7), 'brass', taper=.8)
    greeble(mount, 131 + s, 26, (-4.6, 4.6), (3.6, 5.4), (-5, 3), ['dark', 'brass', 'steel'], 1.1)
    bar = m.part('barrels', (0, 0, 4))
    for i in range(6):
        t = i / 6 * TAU
        x, y = math.cos(t) * 2.2, math.sin(t) * 2.2
        bar.cyl((x, y, 2), (x, y, 15), .78, .62, 14, 'steel' if i % 2 else 'gun')
        bar.cyl((x, y, 15), (x, y, 16.2), .9, .7, 14, 'dark')
    for z in (6, 10, 13.5):
        bar.torus((0, 0, z), 3.0, .34, 40, 8, 'brass')
    bar.cyl((0, 0, 2), (0, 0, 14), 1.2, 1.0, 16, 'dark')
    hood = m.part('hood', (0, 3, 3))
    hood.plate([(-3.9, 2), (3.9, 2), (2.8, 13), (-2.8, 13)], .6, 'navy', y=3.8, edge='brass')
    m.clip('p0', 60, {'barrels': {'rot': spin(2, 60)}, 'hood': {'rot': wave(0, .05, 60)}, 'mount': {'pos': wave(1, .18, 60)}})
    m.clip('p1', 30, {'barrels': {'rot': spin(2, 30)}, 'hood': {'rot': wave(0, .09, 30)}, 'mount': {'pos': wave(1, .3, 30)}})
    m.clip('p2', 20, {'barrels': {'rot': spin(2, 20)}, 'hood': {'rot': wave(0, .14, 20)}, 'mount': {'pos': wave(1, .44, 20)}})
    return m


# ---- cockpit (camera space: looks down -Z, eye at origin) -----------------------
def ck_shell():
    m = Model('ck_shell', bevel=.004, lods=(1.0, .6, .3), ao=True)
    m.tex = 3.4
    g = m.part('frame')
    # main console: a dark sculpted slab with a raised instrument hood
    g.hull([(-.56, .8, .15, -.53), (-.74, .96, .19, -.49), (-.98, 1.04, .21, -.47), (-1.2, .98, .17, -.48)], 32, ['dark', 'gun', 'dark'], power=3.6)
    g.box((0, -.318, -.875), (1.32, .03, .25), 'gun', taper=.92)
    g.box((0, -.292, -.965), (1.22, .05, .05), 'dark', taper=.96)
    g.box((0, -.56, -.46), (1.9, .24, .26), 'dark', taper=.94)
    g.box((0, -.436, -.585), (1.74, .012, .012), 'blue')
    # canopy struts, bow and side sills
    for s in (1, -1):
        g.cyl((s * .93, -.34, -.98), (s * .56, .66, -1.22), .034, .027, 16, 'gun')
        g.cyl((s * .955, -.32, -.94), (s * .58, .68, -1.18), .012, .01, 10, 'blue')
        g.cyl((s * 1.2, -.42, -.28), (s * .86, .55, -.5), .05, .036, 16, 'gun')
        g.cyl((s * .56, .66, -1.22), (s * .86, .55, -.5), .026, .03, 14, 'gun')
        for k in range(7):
            u = (k + .5) / 7
            g.cyl((s * (.93 - .37 * u), -.34 + u, -.98 - .24 * u), (s * (.915 - .37 * u), -.335 + u, -.965 - .24 * u), .008, .008, 8, 'steel')
        g.box((s * 1.0, -.5, -.55), (.34, .18, .96), 'gun', taper=.9)
        g.box((s * .93, -.392, -.56), (.22, .024, .66), 'dark')
        for i in range(8):
            g.cyl((s * .85, -.378, -.3 - i * .078), (s * .85, -.366, -.3 - i * .078), .011, .009, 10, ['l_red', 'l_green', 'l_yellow', 'l_cyan'][i % 4])
            g.box((s * .96, -.376, -.3 - i * .078), (.09, .012, .034), 'steel' if i % 2 else 'gun')
    g.cyl((-.56, .66, -1.22), (.56, .66, -1.22), .03, .03, 16, 'gun')
    g.cyl((-.6, .71, -.86), (.6, .71, -.86), .022, .022, 12, 'gun')
    # multi-function displays: dark glass, grid of lit cells
    for x, cols in ((-.46, ('l_green', 'l_cyan')), (.46, ('l_cyan', 'l_orange'))):
        g.box((x, -.303, -.86), (.3, .012, .17), 'navy')
        g.box((x, -.3, -.86), (.33, .004, .19), 'dark')
    g.box((0, -.298, -.865), (.46, .012, .17), 'navy')
    for row in range(5):
        for i in range(11):
            lit = (i * 3 + row * 5) % 7 < 3
            g.box(((i - 5) * .036, -.29, -.92 + row * .027), (.027, .004, .018), ('l_cyan' if row % 2 else 'l_green') if lit else 'gun')
    for i in range(18):
        g.box(((i - 8.5) * .066, -.332, -.74), (.046, .012, .02), 'steel' if i % 3 == 0 else 'gun')
        g.cyl(((i - 8.5) * .066, -.327, -.74), ((i - 8.5) * .066, -.32, -.74), .007, .006, 8, 'l_orange' if i % 4 == 0 else 'pale')
    for s in (1, -1):
        for i in range(6):
            g.cyl((s * (.27 + i * .06), -.305, -.96), (s * (.27 + i * .06), -.292, -.96), .012, .01, 10, 'l_orange' if i % 2 else 'pale')
    greeble(g, 201, 46, (-.78, .78), (-.336, -.318), (-1.0, -.72), ['gun', 'dark', 'steel'], .032)
    return m


def ck_stick():
    m = Model('ck_stick', bevel=.003, lods=(1.0, .55, .3))
    m.tex = 3.4
    b = m.part('base', (0, -.55, -.48))
    b.lathe([(-.62, .08), (-.56, .07), (-.5, .05), (-.48, .03)], 22, ['gun', 'dark', 'steel'], (0, 0, 0), axis='y')
    b.v = [(x, y, z - .48) for x, y, z in b.v]
    s = m.part('shaft', (0, -.5, -.48))
    s.cyl((0, -.52, -.48), (0, -.34, -.46), .017, .014, 16, 'steel')
    s.torus((0, -.48, -.48), .022, .007, 22, 6, 'dark', axis='y')
    gr = m.part('grip', (0, -.34, -.46))
    gr.hull([(-.52, .028, .036, -.33), (-.47, .034, .043, -.3), (-.42, .03, .04, -.275), (-.395, .02, .028, -.268)], 18, 'dark', power=3)
    gr.cyl((.0, -.262, -.42), (.0, -.256, -.405), .012, .011, 12, 'l_red')
    gr.box((.022, -.27, -.44), (.012, .018, .012), 'yellow')
    # glove: palm + five fingers with three phalanges each
    pm = m.part('palm', (.045, -.32, -.45))
    pm.hull([(-.36, .03, .046, -.33), (-.41, .04, .056, -.315), (-.47, .036, .05, -.31)], 16, 'navy', power=2.6)
    pm.v = [(x + .04, y, z) for x, y, z in pm.v]
    pm.cyl((.04, -.33, -.3), (.04, -.36, -.18), .034, .04, 14, 'blue')
    for fi in range(5):
        fy = -.305 - fi * .017 if fi else -.285
        fx = .048 if fi else .03
        pv = (fx, fy, -.46)
        for seg in range(3):
            nm = f'f{fi}_{seg}'
            pg = m.part(nm, pv)
            L = (.026 - seg * .004) * (.85 if fi == 0 else 1)
            r = .0105 - seg * .001
            tip = (pv[0] - L * (.8 + seg * .2), pv[1], pv[2] - L * .55 + seg * L * .55)
            pg.cyl(pv, tip, r, r * .9, 12, 'navy' if seg < 2 else 'gun')
            pg.sphere(tip, r * .95, 10, 6, 'navy')
            pv = tip
    tr = {'base': {'pos': wave(1, .0007, 60)}, 'shaft': {'rot': wave(0, .018, 60)}, 'grip': {'rot': wave(1, .02, 60)}, 'palm': {'rot': wave(0, .012, 60, 1, 1)}}
    for fi in range(5):
        for seg in range(3):
            tr[f'f{fi}_{seg}'] = {'rot': wave(2, .018 + seg * .006, 60, 1, fi * .7)}
    m.clip('idle', 60, tr)
    fire = {'shaft': {'rot': wave(0, .03, 12)}, 'grip': {'rot': wave(1, .03, 12)}, 'palm': {'rot': wave(0, .02, 12)}}
    for fi in range(5):
        for seg in range(3):
            amp = .22 if fi == 1 else .03
            fire[f'f{fi}_{seg}'] = {'rot': [(0, (0, 0, 0)), (4, (0, 0, -amp)), (12, (0, 0, 0))]}
    m.clip('fire', 12, fire)
    return m


def ck_throttle():
    m = Model('ck_throttle', bevel=.003, lods=(1.0, .55, .3))
    m.tex = 3.4
    b = m.part('rail', (-.62, -.42, -.52))
    b.box((-.62, -.438, -.53), (.09, .04, .3), 'gun')
    for i in range(12):
        b.box((-.62, -.414, -.65 + i * .022), (.06, .006, .008), 'l_cyan' if i % 3 == 0 else 'dark')
    h = m.part('lever', (-.62, -.41, -.53))
    h.cyl((-.62, -.42, -.53), (-.62, -.33, -.5), .012, .01, 14, 'steel')
    h.hull([(-.52, .028, .018, -.32), (-.49, .034, .022, -.315), (-.46, .028, .018, -.31)], 16, 'crimson', power=3)
    h.v = [(x - .62, y, z) for x, y, z in h.v]
    pm = m.part('palm', (-.62, -.3, -.49))
    pm.hull([(-.52, .03, .03, -.3), (-.47, .036, .036, -.29), (-.42, .03, .03, -.3)], 14, 'navy')
    pm.v = [(x - .62, y + .012, z) for x, y, z in pm.v]
    pm.cyl((-.62, -.3, -.42), (-.72, -.42, -.2), .032, .04, 14, 'blue')
    for fi in range(5):
        pv = (-.598 - fi * .012, -.285 - (.006 if fi else 0), -.518 + fi * .012)
        for seg in range(3):
            nm = f't{fi}_{seg}'
            pg = m.part(nm, pv)
            L = .024 - seg * .003
            tip = (pv[0] + L * .3, pv[1] - L * (.5 + seg * .3), pv[2] - L * .7)
            pg.cyl(pv, tip, .009, .008, 12, 'navy' if seg < 2 else 'gun')
            pg.sphere(tip, .0085, 10, 6, 'navy')
            pv = tip
    tr = {'lever': {'rot': wave(0, .05, 90)}, 'palm': {'rot': wave(0, .03, 90)}, 'rail': {'pos': wave(1, .0006, 90)}}
    for fi in range(5):
        for seg in range(3):
            tr[f't{fi}_{seg}'] = {'rot': wave(2, .025, 90, 1, fi * .9)}
    m.clip('idle', 90, tr)
    return m


def ck_gauge(name, col):
    m = Model(name, bevel=.001, lods=(1.0, .6, .3), ao=False)
    b = m.part('dial')
    b.lathe([(-.008, .058), (0, .056), (.002, .05), (.002, 0)], 40, ['gun', 'dark', 'navy'], axis='y')
    b2 = m.part('ticks')
    for i in range(25):
        a = -2.2 + i / 24 * 4.4
        b2.box((math.sin(a) * .042, .003, -math.cos(a) * .042), (.002, .002, .009 if i % 4 else .014), col if i < 18 else 'l_red')
    n = m.part('needle', (0, .005, 0))
    n.cyl((0, .005, .008), (0, .005, -.042), .0022, .0006, 10, 'l_orange')
    n.cyl((0, .002, 0), (0, .008, 0), .006, .005, 16, 'pale')
    keys = [(0, (0, 2.2, 0)), (30, (0, -2.2, 0))]
    m.flex = .006
    m.clip('sweep', 30, {'needle': {'rot': keys}, 'dial': {'pos': [(0, (0, 0, 0)), (15, (0, .0006, 0)), (30, (0, 0, 0))]}, 'ticks': {'pos': [(0, (0, 0, 0)), (15, (0, .0008, 0)), (30, (0, 0, 0))]}}, loop=False)
    return m


def led(name, col):
    m = Model(name, bevel=0, lods=(1.0, .5, .2), ao=False)
    g = m.part('l')
    g.lathe([(float(j) / 12 * .006, .0085 * math.sqrt(max(0.0, 1 - (j / 12) ** 2)) + .0002) for j in range(13)], 42, col, axis='y')
    g.torus((0, 0, 0), .0095, .0014, 42, 6, 'gun', axis='y')
    return m


# ---- backdrop bodies ----------------------------------------------------------
def _sphere_lods(m, g):
    m.alt = {}
    for lod, (nu, nv) in ((1, (48, 28)), (2, (32, 18))):
        q = Geo()
        q.sphere((0, 0, 0), 1.0, nu, nv, 'steel')
        m.alt[lod] = q
    g.sphere((0, 0, 0), 1.0, 72, 40, 'steel')


def planet(name):
    m = Model(name, bevel=0, ao=False, auto_smooth=180)
    _sphere_lods(m, m.part('sphere'))
    return m


def sky():
    m = Model('sky', bevel=0, ao=False, auto_smooth=180)
    _sphere_lods(m, m.part('sphere'))
    return m


def _ring_geo(g, a, b, segments):
    n = 14
    radii = [1.42 + i / n * .84 for i in range(n + 1)]
    th = .006
    prof = [(th, r) for r in radii] + [(-th, r) for r in reversed(radii)] + [(th, radii[0])]
    bands = [a, b, a, 'scorch', b, b, a, 'scorch', a, b, b, a, 'scorch', b]
    g.lathe(prof, segments, bands + ['scorch'] + bands[::-1] + ['scorch'], axis='y', caps=False)


def planet_ring(name, a, b):
    m = Model(name, bevel=0, ao=False, auto_smooth=20)
    _ring_geo(m.part('ring'), a, b, 96)
    m.alt = {}
    for lod, seg in ((1, 72), (2, 48)):
        q = Geo()
        _ring_geo(q, a, b, seg)
        m.alt[lod] = q
    return m


def station(i):
    m = Model(f'station{i}', bevel=.12, lods=(1.0, .82, .36))
    g = m.part('st')
    cols = [('steel', 'crimson', 'l_orange'), ('pale', 'teal', 'l_cyan'), ('gun', 'magenta', 'l_yellow'), ('steel', 'blue', 'l_white')][i]
    if i == 0:
        g.torus((0, 0, 0), 24, 2.4, 96, 16, cols[0], axis='z')
        g.lathe([(9, 0), (7, 3), (3, 5.2), (-6, 5.2), (-10, 3), (-12, 0)], 32, [cols[1], cols[0], 'gun', cols[1], 'dark'])
        for k in range(6):
            with g.at(rot_z(k / 6 * TAU)):
                g.box((14, 0, 0), (19, 1.3, 1.3), 'gun')
                g.box((24, 0, 0), (5.4, 6, 6), cols[1])
        for k in range(48):
            with g.at(rot_z(k / 48 * TAU)):
                g.box((26.6, 0, 0), (.5, 1.1, 1.9), cols[2] if k % 3 == 0 else 'dark')
    elif i == 1:
        g.lathe([(38, 0), (32, .9), (14, 1.6), (6, 4), (0, 8), (-5, 8), (-10, 3), (-24, 1.6), (-34, 0)], 32, [cols[1], cols[0], 'gun', cols[0], cols[1], 'gun', cols[0], 'dark'], axis='y')
        for y in (-16, 14, 22):
            g.torus((0, y, 0), 7 if y != 22 else 4.6, .5, 56, 8, cols[1], axis='y')
        for k in range(8):
            with g.at(rot_y(k / 8 * TAU)):
                g.box((15, 2, 0), (14, .8, 3.6), cols[0], taper=.9)
                for j in range(8):
                    g.box((9 + j * 1.6, 2.5, 0), (.9, .2, 3), cols[2] if j % 2 else 'navy')
    elif i == 2:
        for k in range(5):
            for j in range(3):
                x, y = (k - 2) * 13, (j - 1) * 13
                g.cyl((x, y, -16), (x, y, 16), .7, .7, 10, 'gun')
                if k:
                    g.cyl((x - 13, y, 0), (x, y, 0), .5, .5, 8, cols[0])
                if j:
                    g.cyl((x, y - 13, 0), (x, y, 0), .5, .5, 8, cols[0])
                g.box((x, y, 6), (5.6, 5.6, 5.6), cols[1] if (k + j) % 2 else 'dark')
                g.box((x, y, 9), (1.8, 1.8, .4), cols[2])
    else:
        for k in range(7):
            a = (k - 3) * .22
            with g.at(rot_y(a) @ trans(0, 0, -30)):
                h = 40 - abs(k - 3) * 6
                g.box((0, 0, 30), (6, h, 3), cols[0], taper=.86)
                for j in range(int(h / 2.4)):
                    g.box((0, -h / 2 + 1.5 + j * 2.4, 31.7), (4.6, .5, .2), cols[2] if j % 4 == 0 else cols[1])
    return m


# ---- everything ----------------------------------------------------------------
def build_all():
    out = [player(), dart(), wasp(), splitter(), orb(), bomber(), lancer(), warden(), mine(),
           missile('srocket', 'crimson', 'yellow', 'gun', ('f_white', 'f_yellow', 'f_orange', 'f_red')),
           missile('rocket', 'pale', 'orange', 'blue', ('f_white', 'f_cyan', 'f_blue', 'f_blue')),
           missile('nova', 'violet', 'yellow', 'magenta', ('f_white', 'f_magenta', 'f_violet', 'f_violet'), 5.6)]
    rp = [['rock_b', 'rock_a', 'rock_a', 'rock_c'], ['rock_d', 'rock_b', 'rock_a'], ['scorch', 'rock_b', 'rock_c', 'rock_c']]
    for sz, (nm, r) in enumerate((('S', 4.0), ('M', 7.0), ('L', 11.0))):
        for v in range(3):
            out.append(rock(f'rock{nm}{v}', r, 300 + sz * 10 + v, rp[v], [(1, .82, 1.1), (1.18, .86, .92), (.9, 1.08, 1.0)][v]))
    for nm, cols, rd, ln in (('bolt_e0', ['f_white', 'f_red', 'f_orange'], .3, 2.6), ('bolt_e3', ['f_white', 'f_green', 'f_green'], .32, 3.0)):
        out.append(bolt(nm, cols, rd, ln))
    out += [orb_shot('bolt_e1', ('f_magenta', 'f_white'), .62), orb_shot('bolt_e2', ('f_orange', 'f_yellow'), .74), orb_shot('bolt_e4', ('f_violet', 'f_white'), .68),
            beam(), beam_warn(), muzzle(), dust(), aimline(), puff(), tracer('tr_p', ['f_white', 'f_white', 'f_cyan', 'f_blue']), tracer('tr_h', ['f_white', 'f_yellow', 'f_orange', 'f_red'])] + hud_marks()
    out += [pickup('w', 'orange', 'l_orange', icon_gun), pickup('r', 'crimson', 'l_red', icon_rkt), pickup('s', 'cyan', 'l_cyan', icon_shield),
            pickup('h', 'green', 'l_green', icon_cross), pickup('b', 'violet', 'l_violet', icon_nova), pickup('o', 'amber', 'l_yellow', icon_bolt), scrap()]
    fire = ('f_white', 'f_yellow', 'f_orange', 'f_orange', 'f_red')
    out += [spike_burst('boom_s', 40, 20, 2.4, 401, fire, .27, 4.0), spike_burst('boom_m', 56, 27, 4.4, 402, fire, .42, 7.0), spike_burst('boom_l', 76, 36, 8.0, 403, fire, .68, 12.5),
            spike_burst('fx_flash', 26, 7, .4, 406, ('f_white', 'f_white', 'f_yellow', 'f_orange', 'f_orange'), .3, 4.4),
            spike_burst('sparks', 34, 24, 13.0, 407, ('f_white', 'f_yellow', 'f_yellow', 'f_orange', 'f_red'), .05, 2.2),
            spike_burst('boom_hit', 26, 9, 1.5, 404, ('f_white', 'f_yellow', 'f_orange', 'f_orange', 'f_red'), .07, 1.5, cone=.8),
            spike_burst('imp_armor', 28, 11, 2.4, 408, ('f_white', 'f_white', 'f_yellow', 'f_orange', 'f_orange'), .05, 2.0, cone=1.1), imp_shield(),
            smoke('smoke_s', 30, 36, 3.8, 411, .95), smoke('smoke_m', 36, 46, 7.0, 412, 1.6), smoke('smoke_l', 44, 60, 12.0, 413, 2.5),
            shards('debris', 40, 48, 12.0, 405), shock()]
    out += [boss0_core(), boss0_arm('boss0_armR', 1), boss0_arm('boss0_armL', -1), boss1_core(), boss1_emitter(), boss2_core(), boss2_gun('boss2_gunR', 1), boss2_gun('boss2_gunL', -1)]
    out += [ck_shell(), ck_stick(), ck_throttle(), ck_gauge('ck_gauge_hull', 'l_green'), ck_gauge('ck_gauge_heat', 'l_cyan'),
            led('ck_led_g', 'l_green'), led('ck_led_r', 'l_red'), led('ck_led_off', 'dark'), led('ck_led_c', 'l_cyan'), led('ck_led_a', 'l_orange')]
    out += [sky()] + [planet(f'planet{i}') for i in range(4)] + [planet_ring('ring0', 'ring_a', 'ring_b'), planet_ring('ring3', 'ring_c', 'ring_d')]
    out += [station(i) for i in range(4)]
    return out
