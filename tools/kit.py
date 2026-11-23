# Space Shooter 3D asset kit. Runs inside Blender 5.3 (headless).
# Geometry is authored here as parts; each part is baked to three LODs with
# bevels, decimation, per-vertex ambient occlusion and a compact binary layout.
# Game axes: +X right, +Y up, +Z toward the player (ship noses point +Z).
import math, os, struct, json, random
from contextlib import contextmanager

import bpy, bmesh
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')
TAU = math.tau
MIN_TRIS = 1000
MIN_BONES = 24

# name: (r, g, b, material)   material 0 metal, 1 rock, 2 glass, 3 flame, 4 lit panel, 5 smoke
PALETTE = {
    'steel': (.52, .57, .66, 0), 'gun': (.22, .25, .31, 0), 'dark': (.10, .12, .17, 0), 'pale': (.82, .85, .88, 0),
    'crimson': (.80, .11, .17, 0), 'wine': (.42, .06, .13, 0), 'orange': (.95, .42, .07, 0), 'amber': (.96, .68, .10, 0),
    'yellow': (.98, .85, .15, 0), 'lime': (.48, .82, .13, 0), 'green': (.09, .62, .30, 0), 'teal': (.04, .62, .62, 0),
    'cyan': (.10, .72, .92, 0), 'blue': (.10, .34, .86, 0), 'navy': (.07, .13, .38, 0), 'violet': (.46, .20, .86, 0),
    'purple': (.28, .10, .52, 0), 'magenta': (.88, .14, .62, 0), 'pink': (.96, .46, .66, 0), 'bone': (.86, .80, .66, 0),
    'copper': (.72, .38, .20, 0), 'brass': (.76, .60, .24, 0),
    'rock_a': (.42, .36, .31, 1), 'rock_b': (.30, .27, .26, 1), 'rock_c': (.55, .45, .34, 1), 'rock_d': (.25, .30, .36, 1),
    'ore': (.92, .58, .12, 4), 'crystal': (.20, .78, .86, 2),
    'glass': (.08, .46, .66, 2), 'glass_r': (.72, .14, .18, 2), 'glass_g': (.12, .68, .36, 2), 'glass_v': (.48, .24, .84, 2),
    'f_white': (1.0, .96, .80, 3), 'f_yellow': (1.0, .80, .18, 3), 'f_orange': (1.0, .46, .06, 3), 'f_red': (.90, .14, .06, 3),
    'f_cyan': (.45, .92, 1.0, 3), 'f_blue': (.14, .46, 1.0, 3), 'f_green': (.45, 1.0, .35, 3), 'f_magenta': (1.0, .32, .78, 3), 'f_violet': (.66, .40, 1.0, 3),
    'l_red': (.96, .16, .14, 4), 'l_orange': (1.0, .52, .08, 4), 'l_yellow': (1.0, .86, .16, 4), 'l_green': (.20, .92, .36, 4),
    'l_cyan': (.20, .86, 1.0, 4), 'l_blue': (.20, .46, 1.0, 4), 'l_violet': (.66, .36, 1.0, 4), 'l_magenta': (1.0, .28, .72, 4), 'l_white': (.92, .95, 1.0, 4),
    'ring_a': (.78, .58, .34, 1), 'ring_b': (.55, .40, .28, 1), 'ring_c': (.74, .76, .82, 1), 'ring_d': (.48, .52, .62, 1), 'dust': (.50, .57, .72, 4),
    'sm_a': (.30, .28, .29, 5), 'sm_b': (.44, .40, .38, 5), 'sm_c': (.20, .18, .19, 5),
    'smoke_a': (.20, .19, .20, 1), 'smoke_b': (.34, .31, .30, 1), 'scorch': (.13, .10, .09, 1),
}
PAL_NAMES = list(PALETTE)
PAL_INDEX = {n: i for i, n in enumerate(PAL_NAMES)}
PAL_RGBM = np.array([PALETTE[n] for n in PAL_NAMES], dtype=np.float32)


def _pal(p):
    return PAL_INDEX[p] if isinstance(p, str) else p


def rot_x(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0, 0], [0, c, -s, 0], [0, s, c, 0], [0, 0, 0, 1.0]])


def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1.0]])


def rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1.0]])


def trans(x, y, z):
    m = np.eye(4)
    m[:3, 3] = (x, y, z)
    return m


def scale(x, y=None, z=None):
    return np.diag([x, x if y is None else y, x if z is None else z, 1.0])


class Geo:
    """A bag of faces in a local frame, with a matrix stack for placement."""

    def __init__(self):
        self.v, self.f, self.p, self.s = [], [], [], []
        self.M = np.eye(4)
        self.shells = 0
        self.bone = None

    @contextmanager
    def at(self, m):
        old = self.M
        self.M = old @ m
        yield self
        self.M = old

    def mirror(self, fn):
        fn(1)
        with self.at(scale(-1, 1, 1)):
            fn(-1)

    def radial(self, n, fn, axis='z', phase=0.0):
        rot = {'x': rot_x, 'y': rot_y, 'z': rot_z}[axis]
        for i in range(n):
            with self.at(rot(phase + i / n * TAU)):
                fn(i)

    def add(self, pts, faces, pal):
        base = len(self.v)
        pts = np.asarray(pts, dtype=float)
        w = (self.M[:3, :3] @ pts.T).T + self.M[:3, 3]
        self.v.extend(map(tuple, w))
        for i, f in enumerate(faces):
            self.f.append([base + q for q in f])
            self.p.append(_pal(pal[i] if isinstance(pal, (list, tuple)) else pal))
            self.s.append(self.shells)
        self.shells += 1

    def box(self, c, s, pal, taper=1.0, taper_y=None):
        """Box at c, size s. Taper narrows the +Z end."""
        x, y, z = s[0] / 2, s[1] / 2, s[2] / 2
        tx, ty = taper, taper if taper_y is None else taper_y
        pts = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z),
               (-x * tx, -y * ty, z), (x * tx, -y * ty, z), (x * tx, y * ty, z), (-x * tx, y * ty, z)]
        pts = [(a + c[0], b + c[1], d + c[2]) for a, b, d in pts]
        self.add(pts, [[3, 2, 1, 0], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], pal)

    def cyl(self, a, b, ra, rb, n, pal, caps=True):
        a, b = np.array(a, float), np.array(b, float)
        d = b - a
        d = d / (np.linalg.norm(d) or 1)
        up = np.array((0, 1.0, 0)) if abs(d[1]) < .9 else np.array((1.0, 0, 0))
        u = np.cross(d, up)
        u /= np.linalg.norm(u)
        w = np.cross(d, u)
        pts, faces = [], []
        for i in range(n):
            t = i / n * TAU
            pts.append(a + (u * math.cos(t) + w * math.sin(t)) * ra)
        for i in range(n):
            t = i / n * TAU
            pts.append(b + (u * math.cos(t) + w * math.sin(t)) * rb)
        for i in range(n):
            j = (i + 1) % n
            faces.append([i, j, n + j, n + i])
        if caps:
            faces.append(list(range(n))[::-1])
            faces.append([n + i for i in range(n)])
        self.add(pts, faces, pal)

    def lathe(self, prof, n, pal, c=(0, 0, 0), axis='z', phase=0.0, caps=True):
        """prof: [(along, radius), ...]. pal may be a list with one entry per band."""
        pts, faces, pals = [], [], []
        m = len(prof)
        for along, r in prof:
            for i in range(n):
                t = phase + i / n * TAU
                cx, cy = math.cos(t) * r, math.sin(t) * r
                p = {'z': (cx, cy, along), 'x': (along, cx, cy), 'y': (cx, along, cy)}[axis]
                pts.append((p[0] + c[0], p[1] + c[1], p[2] + c[2]))
        for k in range(m - 1):
            band = pal[min(k, len(pal) - 1)] if isinstance(pal, (list, tuple)) else pal
            for i in range(n):
                j = (i + 1) % n
                faces.append([k * n + i, k * n + j, (k + 1) * n + j, (k + 1) * n + i])
                pals.append(band)
        first = pal[0] if isinstance(pal, (list, tuple)) else pal
        last = pal[-1] if isinstance(pal, (list, tuple)) else pal
        if caps and prof[0][1] > 1e-5:
            faces.append(list(range(n))[::-1])
            pals.append(first)
        if caps and prof[-1][1] > 1e-5:
            faces.append([(m - 1) * n + i for i in range(n)])
            pals.append(last)
        self.add(pts, faces, pals)

    def hull(self, secs, n, pal, power=2.4):
        """Lofted superellipse hull. secs: [(z, half_w, half_h, y_offset), ...]."""
        pts, faces, pals = [], [], []
        m = len(secs)
        e = 2.0 / power
        for z, w, h, yo in secs:
            for i in range(n):
                t = i / n * TAU
                c, s = math.cos(t), math.sin(t)
                pts.append((math.copysign(abs(c) ** e, c) * w, math.copysign(abs(s) ** e, s) * h + yo, z))
        for k in range(m - 1):
            band = pal[min(k, len(pal) - 1)] if isinstance(pal, (list, tuple)) else pal
            for i in range(n):
                j = (i + 1) % n
                faces.append([k * n + i, k * n + j, (k + 1) * n + j, (k + 1) * n + i])
                pals.append(band)
        first = pal[0] if isinstance(pal, (list, tuple)) else pal
        last = pal[-1] if isinstance(pal, (list, tuple)) else pal
        faces.append(list(range(n))[::-1])
        pals.append(first)
        faces.append([(m - 1) * n + i for i in range(n)])
        pals.append(last)
        self.add(pts, faces, pals)

    def plate(self, poly, th, pal, y=0.0, edge=None):
        """Extruded polygon in the XZ plane, thickness along Y."""
        n = len(poly)
        pts = [(x, y - th / 2, z) for x, z in poly] + [(x, y + th / 2, z) for x, z in poly]
        faces = [list(range(n))[::-1], [n + i for i in range(n)]]
        pals = [pal, pal]
        for i in range(n):
            j = (i + 1) % n
            faces.append([i, j, n + j, n + i])
            pals.append(edge or pal)
        self.add(pts, faces, pals)

    def sphere(self, c, r, nu, nv, pal, sy=1.0):
        pts, faces = [], []
        for v in range(1, nv):
            phi = v / nv * math.pi
            for u in range(nu):
                t = u / nu * TAU
                pts.append((math.sin(phi) * math.cos(t) * r + c[0], math.cos(phi) * r * sy + c[1], math.sin(phi) * math.sin(t) * r + c[2]))
        top, bot = len(pts), len(pts) + 1
        pts += [(c[0], c[1] + r * sy, c[2]), (c[0], c[1] - r * sy, c[2])]
        for v in range(nv - 2):
            for u in range(nu):
                w = (u + 1) % nu
                faces.append([v * nu + u, v * nu + w, (v + 1) * nu + w, (v + 1) * nu + u])
        for u in range(nu):
            w = (u + 1) % nu
            faces.append([top, w, u])
            faces.append([bot, (nv - 2) * nu + u, (nv - 2) * nu + w])
        self.add(pts, faces, pal)

    def torus(self, c, R, r, nu, nv, pal, axis='z', ry=None):
        pts, faces = [], []
        ry = r if ry is None else ry
        for u in range(nu):
            t = u / nu * TAU
            for v in range(nv):
                a = v / nv * TAU
                rr = R + math.cos(a) * r
                p = (math.cos(t) * rr, math.sin(t) * rr, math.sin(a) * ry)
                p = {'z': p, 'y': (p[0], p[2], p[1]), 'x': (p[2], p[0], p[1])}[axis]
                pts.append((p[0] + c[0], p[1] + c[1], p[2] + c[2]))
        for u in range(nu):
            w = (u + 1) % nu
            for v in range(nv):
                x = (v + 1) % nv
                faces.append([u * nv + v, w * nv + v, w * nv + x, u * nv + x])
        self.add(pts, faces, pal)

    def rock(self, c, r, sub, seed, pals, squash=(1, 1, 1), rough=.34):
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0)
        pts = np.array([v.co[:] for v in bm.verts])
        faces = [[v.index for v in f.verts] for f in bm.faces]
        bm.free()
        rng = np.random.default_rng(seed)
        centers = rng.normal(size=(26, 3))
        centers /= np.linalg.norm(centers, axis=1, keepdims=True)
        widths = rng.uniform(.22, .62, 26)
        depths = rng.uniform(-.5, .85, 26) * rough
        d = np.ones(len(pts))
        for k in range(26):
            q = np.clip((pts @ centers[k] - (1 - widths[k])) / widths[k], 0, 1)
            d -= depths[k] * q * q * (3 - 2 * q)
        for fr, am in ((3.1, .10), (6.7, .05), (13.3, .022)):
            ph = rng.uniform(0, TAU, 3)
            d += am * np.sin(pts[:, 0] * fr + ph[0]) * np.sin(pts[:, 1] * fr * 1.13 + ph[1]) * np.sin(pts[:, 2] * fr * .91 + ph[2]) * (1 + rough)
        q = pts * d[:, None] * r * np.array(squash) + np.array(c)
        hgt = (d - d.min()) / (np.ptp(d) or 1)
        fp = []
        for f in faces:
            h = float(hgt[f].mean()) + rng.uniform(-.08, .08)
            fp.append(pals[min(len(pals) - 1, int(h * len(pals)))])
        self.add(q, faces, fp)


class Part:
    def __init__(self, name, pivot=(0, 0, 0)):
        self.name, self.pivot, self.geo = name, tuple(pivot), Geo()


class Model:
    """A named asset. Static models have one part in model space; animated ones
    store each part around its pivot and are driven by the baked transform texture."""

    def __init__(self, name, bevel=.04, segs=1, lods=(1.0, .46, .17), auto_smooth=38, ao=True):
        self.name, self.bevel, self.segs, self.lods = name, bevel, segs, lods
        self.auto_smooth, self.ao = auto_smooth, ao
        self.flex, self.bones = .018, []
        self.parts, self.clips = [], {}

    def part(self, name, pivot=(0, 0, 0)):
        p = Part(name, pivot)
        self.parts.append(p)
        return p.geo

    def clip(self, name, frames, tracks, loop=True, fps=30):
        self.clips[name] = {'frames': frames, 'tracks': tracks, 'loop': loop, 'fps': fps}

    @property
    def animated(self):
        return bool(self.clips)

    def build_rig(self, minimum=MIN_BONES):
        """Root > one control bone per part > deform bones grouping the part's shells."""
        self.bones = [{'name': 'root', 'parent': -1, 'head': (0.0, 0.0, 0.0)}]
        k = {}
        shells = {}
        for p in self.parts:
            v = np.array(p.geo.v, float)
            sid = np.array(p.geo.s)
            cent = {}
            for f, s_id in zip(p.geo.f, sid.tolist()):
                cent.setdefault(s_id, []).append(v[f].mean(axis=0))
            shells[p.name] = {a: np.mean(b, axis=0) for a, b in cent.items()}
            k[p.name] = 1
        def total():
            return 1 + len(self.parts) + sum(q for q in k.values() if q > 1)
        while total() < minimum + 2:
            open_parts = [p for p in self.parts if k[p.name] < len(shells[p.name])]
            if not open_parts:
                raise RuntimeError(f'{self.name}: only {total()} bones possible; add more shells')
            best = max(open_parts, key=lambda p: len(shells[p.name]) / k[p.name])
            k[best.name] += 1
        for p in self.parts:
            ctrl = len(self.bones)
            self.bones.append({'name': p.name, 'parent': 0, 'head': tuple(map(float, p.pivot))})
            ids = sorted(shells[p.name])
            pts = np.array([shells[p.name][i] for i in ids])
            n = k[p.name]
            if n == 1:
                p.geo.bone = [ctrl] * len(p.geo.f)
                continue
            rng = np.random.default_rng(len(self.bones) * 31 + 5)
            cen = pts[rng.choice(len(pts), n, replace=False)]
            lab = np.zeros(len(pts), int)
            for _ in range(24):
                lab = np.argmin(((pts[:, None] - cen[None]) ** 2).sum(-1), axis=1)
                for c in range(n):
                    if (lab == c).any():
                        cen[c] = pts[lab == c].mean(axis=0)
                    else:
                        far = int(np.argmax(((pts - cen[lab]) ** 2).sum(-1)))
                        lab[far] = c
                        cen[c] = pts[far]
            first = len(self.bones)
            for c in range(n):
                self.bones.append({'name': f'{p.name}.{c:02d}', 'parent': ctrl, 'head': tuple(map(float, cen[c]))})
            remap = {sid: first + int(l) for sid, l in zip(ids, lab)}
            p.geo.bone = [remap[x] for x in p.geo.s]


# ---- Mesh baking -------------------------------------------------------------
def _new_object(geo, name):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in geo.v], [], geo.f)
    a = me.attributes.new('pal', 'INT', 'FACE')
    a.data.foreach_set('value', np.array(geo.p, dtype=np.int32))
    b = me.attributes.new('bone', 'INT', 'FACE')
    b.data.foreach_set('value', np.array(geo.bone if geo.bone is not None else [0] * len(geo.f), dtype=np.int32))
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def _evaluated(ob, bevel, segs, ratio):
    if bevel > 0:
        m = ob.modifiers.new('b', 'BEVEL')
        m.width, m.segments, m.limit_method, m.angle_limit = bevel, segs, 'ANGLE', math.radians(32)
        m.miter_outer = 'MITER_ARC'
    if ratio < .999:
        d = ob.modifiers.new('d', 'DECIMATE')
        d.ratio = ratio
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg), depsgraph=dg)
    ob.modifiers.clear()
    return me


def _mesh_arrays(me, auto_smooth):
    me.set_sharp_from_angle(angle=math.radians(auto_smooth))
    me.calc_loop_triangles()
    nt = len(me.loop_triangles)
    nl = len(me.loops)
    tri_loops, tri_poly = np.zeros(nt * 3, np.int32), np.zeros(nt, np.int32)
    me.loop_triangles.foreach_get('loops', tri_loops)
    me.loop_triangles.foreach_get('polygon_index', tri_poly)
    vi = np.zeros(nl, np.int32)
    me.loops.foreach_get('vertex_index', vi)
    co = np.zeros(len(me.vertices) * 3, np.float32)
    me.vertices.foreach_get('co', co)
    co = co.reshape(-1, 3)
    nor = np.zeros(nl * 3, np.float32)
    me.corner_normals.foreach_get('vector', nor)
    nor = nor.reshape(-1, 3)
    pal = np.zeros(len(me.polygons), np.int32)
    me.attributes['pal'].data.foreach_get('value', pal)
    bone = np.zeros(len(me.polygons), np.int32)
    me.attributes['bone'].data.foreach_get('value', bone)
    fn = np.zeros(len(me.polygons) * 3, np.float32)
    me.polygons.foreach_get('normal', fn)
    fn = fn.reshape(-1, 3)
    return tri_loops.reshape(-1, 3), tri_poly, vi, co, nor, pal, fn, bone


def _ao(pos, nor, tris, reach, seed=7):
    tree = BVHTree.FromPolygons([tuple(p) for p in pos.tolist()], tris.tolist(), all_triangles=True, epsilon=1e-5)
    rng = np.random.default_rng(seed)
    dirs = rng.normal(size=(9, 3))
    dirs /= np.linalg.norm(dirs, axis=1, keepdims=True)
    out = np.ones(len(pos), np.float32)
    for i, (p, n) in enumerate(zip(pos.tolist(), nor.tolist())):
        nv, hits, count = Vector(n), 0.0, 0
        start = Vector(p) + nv * (reach * .012)
        for d in dirs.tolist():
            dv = Vector(d)
            dt = dv.dot(nv)
            if dt < 0:
                dv, dt = -dv, -dt
            count += 1
            hit = tree.ray_cast(start, dv, reach)
            if hit[0] is not None:
                hits += 1 - min(1.0, hit[3] / reach)
        out[i] = 1 - min(.82, hits / max(count, 1) * 1.55)
    return out


def bake_lod(model, ratio, lod_index):
    """Returns compact arrays for one LOD of a model."""
    all_pos, all_nor, all_pal, all_part, all_uv, all_tri = [], [], [], [], [], []
    offset = 0
    for pi, part in enumerate(model.parts):
        if not part.geo.f:
            continue
        alt = getattr(model, 'alt', {}).get(lod_index)  # clean authored LOD instead of decimating banded or round shapes
        ob = _new_object(alt or part.geo, f'{model.name}_{part.name}')
        bevel = model.bevel if lod_index == 0 else model.bevel * .8 if lod_index == 1 else 0
        segs = model.segs if lod_index == 0 else 1
        me = _evaluated(ob, bevel, segs, 1.0 if alt else ratio)
        tl, tp, vi, co, nor, pal, fn, bone = _mesh_arrays(me, model.auto_smooth)
        corners = tl.reshape(-1)
        polys = np.repeat(tp, 3)
        pos = co[vi[corners]]
        bid = bone[polys]
        src = pos.copy()
        if model.animated:
            heads = np.array([b['head'] for b in model.bones], np.float32)
            pos = pos - heads[bid]
        n = nor[corners]
        p = pal[polys]
        f = np.abs(fn[polys])
        ax = np.argmax(f, axis=1)
        uu = np.choose(ax, [src[:, 2], src[:, 0], src[:, 0]])
        vv = np.choose(ax, [src[:, 1], src[:, 2], src[:, 1]])
        uv = np.stack([uu, vv], axis=1) * getattr(model, 'tex', TEX_DENSITY)
        qp = np.round(pos * 400).astype(np.int32)
        qn = np.round(n * 120).astype(np.int32)
        quv = np.round(uv * 900).astype(np.int32)
        key = np.column_stack([qp, qn, p, quv, bid])
        _, first, inverse = np.unique(key, axis=0, return_index=True, return_inverse=True)
        inverse = inverse.reshape(-1)
        all_pos.append(pos[first]); all_nor.append(n[first]); all_pal.append(p[first])
        all_part.append(bid[first]); all_uv.append(uv[first])
        all_tri.append(inverse.reshape(-1, 3) + offset)
        offset += len(first)
        bpy.data.objects.remove(ob); bpy.data.meshes.remove(me)
    for arr_name, arr in (('pos', all_pos), ('uv', all_uv), ('nor', all_nor)):
        bad = sum(int((~np.isfinite(x)).sum()) for x in arr)
        if bad:
            print('NONFINITE', model.name, lod_index, arr_name, bad, flush=True)
    pos = np.concatenate(all_pos); nor = np.concatenate(all_nor); pal = np.concatenate(all_pal)
    part = np.concatenate(all_part); uv = np.concatenate(all_uv); tri = np.concatenate(all_tri)
    length = np.linalg.norm(nor, axis=1, keepdims=True)
    nor = nor / np.where(length < 1e-6, 1, length)
    radius = float(np.linalg.norm(pos, axis=1).max())
    if model.ao:
        wp = pos.copy()
        if model.animated:
            wp += np.array([b['head'] for b in model.bones], np.float32)[part]
        ao = _ao(wp, nor, tri, max(radius * .42, .6))
    else:
        ao = np.ones(len(pos), np.float32)
    return dict(pos=pos, nor=nor, pal=pal, part=part, uv=uv, tri=tri, ao=ao, radius=radius)


TEX_DENSITY = .42  # detail texture repeats per world unit


def pack_lod(d, q_scale):
    """Three contiguous typed blocks (20 bytes per vertex) that map straight onto
    WebGL buffers: i16 [x y z bone u v], i8 [nx ny nz material], u8 [r g b ao]."""
    n = len(d['pos'])
    rgbm = PAL_RGBM[d['pal']]
    a = np.zeros((n, 6), '<i2')
    a[:, :3] = np.clip(np.round(d['pos'] / q_scale * 32767), -32767, 32767)
    a[:, 3] = d['part']
    a[:, 4:] = np.clip(np.round(d['uv'] / 32 * 32767), -32767, 32767)
    b = np.zeros((n, 4), 'i1')
    b[:, :3] = np.clip(np.round(d['nor'] * 127), -127, 127)
    b[:, 3] = rgbm[:, 3].astype(np.int8)
    c = np.zeros((n, 4), 'u1')
    c[:, :3] = np.clip(np.round(rgbm[:, :3] * 255), 0, 255)
    c[:, 3] = np.clip(np.round(d['ao'] * 255), 0, 255)
    idx = d['tri'].reshape(-1)
    bits = 16 if n < 65535 else 32
    ib = idx.astype('<u2' if bits == 16 else '<u4')
    return a.tobytes() + b.tobytes() + c.tobytes(), ib.tobytes(), bits


class Packer:
    def __init__(self):
        self.bins = {'hi': bytearray(), 'base': bytearray()}
        self.anim = []
        self.anim_len = 0
        self.models = {}
        self.stats = {}

    def _put(self, bin_name, data, align):
        b = self.bins[bin_name]
        while len(b) % align:
            b.append(0)
        o = len(b)
        b.extend(data)
        return o

    def bake_clip(self, model, arm, name, clip):
        """Keys the armature in Blender, evaluates it, stores bone transforms."""
        length, loop = clip['frames'], clip['loop']
        n = len(model.bones)
        action = bpy.data.actions.new(f'{model.name}_{name}')
        arm.animation_data_create()
        arm.animation_data.action = action
        for pb in arm.pose.bones:
            pb.rotation_mode = 'XYZ'
            pb.location, pb.rotation_euler, pb.scale = (0, 0, 0), (0, 0, 0), (1, 1, 1)
        rng = random.Random(hash_name(model.name + name))
        by_name = {b['name']: b for b in model.bones}
        for b in model.bones:
            pb = arm.pose.bones[b['name']]
            tr = clip['tracks'].get(b['name'])
            if tr:
                for key, prop, conv in (('pos', 'location', tuple), ('rot', 'rotation_euler', tuple), ('scl', 'scale', lambda v: (max(v[0], .001),) * 3)):
                    for f, v in tr.get(key, ()):
                        setattr(pb, prop, conv(v))
                        pb.keyframe_insert(prop, frame=f + 1)
                    if key in tr:
                        setattr(pb, prop, (0, 0, 0) if key != 'scl' else (1, 1, 1))
            elif b['parent'] > 0:
                # secondary motion: each deform bone flexes on its own phase
                amp, ph, cyc = model.flex * rng.uniform(.6, 1.2), rng.uniform(0, TAU), max(1, round(length / 40))
                ax = rng.randrange(3)
                steps = 8
                for j in range(steps + 1):
                    u = j / steps
                    env = 1.0 if loop else math.sin(u * math.pi)
                    e = [0.0, 0.0, 0.0]
                    e[ax] = amp * math.sin(u * TAU * cyc + ph) * env
                    if loop:
                        e[ax] -= amp * math.sin(ph)
                    pb.rotation_euler = e
                    pb.keyframe_insert('rotation_euler', frame=round(u * length) + 1)
                pb.rotation_euler = (0, 0, 0)
        data = np.zeros(((length + 1) * n, 8), np.float32)
        scene = bpy.context.scene
        names = [b['name'] for b in model.bones]
        prev = [None] * n
        for f in range(length + 1):
            scene.frame_set(f + 1)
            dg = bpy.context.evaluated_depsgraph_get()
            ev = arm.evaluated_get(dg)
            for bi, nm in enumerate(names):
                loc, q, sc = ev.pose.bones[nm].matrix.decompose()
                qa = np.array((q.x, q.y, q.z, q.w), np.float32)
                if prev[bi] is not None and np.dot(prev[bi], qa) < 0:
                    qa = -qa
                prev[bi] = qa
                data[f * n + bi] = (loc.x, loc.y, loc.z, sc.y, qa[0], qa[1], qa[2], qa[3])
        arm.animation_data.action = None
        bpy.data.actions.remove(action)
        base = self.anim_len
        self.anim.append(data)
        self.anim_len += data.shape[0] * 2
        return {'base': base, 'frames': length, 'fps': clip['fps'], 'loop': loop}

    def make_armature(self, model):
        data = bpy.data.armatures.new(model.name + '_rig')
        arm = bpy.data.objects.new(model.name + '_rig', data)
        bpy.context.scene.collection.objects.link(arm)
        bpy.context.view_layer.objects.active = arm
        arm.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT')
        made = []
        for b in model.bones:
            e = data.edit_bones.new(b['name'])
            e.head = b['head']
            e.tail = (b['head'][0], b['head'][1] + .25, b['head'][2])
            e.roll = 0
            if b['parent'] >= 0:
                e.parent = made[b['parent']]
            made.append(e)
        bpy.ops.object.mode_set(mode='OBJECT')
        return arm

    def add(self, model):
        print('bake', model.name, flush=True)
        if model.animated:
            model.build_rig()
        lods = [bake_lod(model, r, i) for i, r in enumerate(model.lods)]
        radius = max(l['radius'] for l in lods)
        q = max(float(np.abs(l['pos']).max()) for l in lods) * 1.001
        out = []
        for i, l in enumerate(lods):
            vb, ib, bits = pack_lod(l, q)
            # phones skip the 'hi' bin, so LOD0 stays in base unless LOD1 still meets the 1,000 triangle floor
            target = 'hi' if i == 0 and lods[1]['tri'].shape[0] >= MIN_TRIS else 'base'
            vo = self._put(target, vb, 4)
            io = self._put(target, ib, 4)
            out.append({'bin': target, 'vo': vo, 'vc': len(l['pos']), 'io': io, 'ic': int(l['tri'].size), 'bits': bits})
        clips = {}
        if model.animated:
            arm = self.make_armature(model)
            clips = {k: self.bake_clip(model, arm, k, c) for k, c in model.clips.items()}
            bpy.data.objects.remove(arm)
        self.models[model.name] = {'r': round(radius, 4), 'q': round(q, 5), 'parts': len(model.bones) if model.animated else 0,
                                   'bones': [[b['name'], b['parent']] for b in model.bones] if model.animated else [],
                                   'partIndex': {p.name: i for i, p in enumerate(model.parts)}, 'lod': out, 'clips': clips}
        self.stats[model.name] = {'tris': [int(l['tri'].shape[0]) for l in lods], 'bones': len(model.bones) if model.animated else 0}

    def write(self, extra):
        os.makedirs(os.path.join(ASSETS, 'mesh'), exist_ok=True)
        files = {}
        for k, b in self.bins.items():
            fn = f'mesh/models_{k}.bin'
            with open(os.path.join(ASSETS, fn), 'wb') as fh:
                fh.write(b)
            files[k] = {'file': fn, 'bytes': len(b)}
        anim = np.concatenate(self.anim).astype('<f4') if self.anim else np.zeros((0, 8), '<f4')
        tw = 1024
        th = max(1, math.ceil(anim.shape[0] * 2 / tw))
        tex = np.zeros((th, tw, 4), '<f4')
        tex.reshape(-1, 4)[:anim.shape[0] * 2] = anim.reshape(-1, 4)
        with open(os.path.join(ASSETS, 'mesh/anim.bin'), 'wb') as fh:
            fh.write(tex.tobytes())
        files['anim'] = {'file': 'mesh/anim.bin', 'bytes': tex.nbytes, 'w': tw, 'h': th}
        manifest = {'version': 1, 'files': files, 'models': self.models, 'stats': self.stats}
        manifest.update(extra)
        with open(os.path.join(ASSETS, 'manifest.json'), 'w') as fh:
            json.dump(manifest, fh, separators=(',', ':'))
        return manifest


def hash_name(s):
    h = 2166136261
    for ch in s.encode():
        h = ((h ^ ch) * 16777619) & 0xffffffff
    return h


def clear_scene():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)
