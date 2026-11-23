# blender --background --python tools/bake_textures.py
# Detail map, four sector skies and four planet surfaces. All rendered here, none downloaded.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import numpy as np
from kit import ASSETS

TEX = os.path.join(ASSETS, 'tex')
os.makedirs(TEX, exist_ok=True)


def save_jpg(rgb, path, q=86):
    h, w = rgb.shape[:2]
    a = np.ones((h, w, 4), np.float32)
    a[..., :3] = np.clip(rgb, 0, 1)
    img = bpy.data.images.new('t', w, h, alpha=False)
    img.colorspace_settings.name = 'sRGB'
    img.pixels.foreach_set(a[::-1].reshape(-1))
    s = bpy.context.scene.render.image_settings
    s.media_type = 'IMAGE'
    s.file_format = 'JPEG'
    s.color_mode = 'RGB'
    s.quality = q
    # raw sRGB values: bypass the view transform
    bpy.context.scene.view_settings.view_transform = 'Standard'
    bpy.context.scene.view_settings.look = 'None'
    img.save_render(path)
    bpy.data.images.remove(img)
    print('wrote', os.path.basename(path), os.path.getsize(path), flush=True)


def fbm(n, seed, beta=2.0):
    r = np.random.default_rng(seed)
    f = np.fft.fft2(r.normal(size=(n, n)))
    fx = np.fft.fftfreq(n)[:, None]
    fy = np.fft.fftfreq(n)[None, :]
    a = np.sqrt(fx * fx + fy * fy)
    a[0, 0] = 1
    out = np.real(np.fft.ifft2(f / a ** beta))
    return (out - out.min()) / np.ptp(out)


def detail_map(n=1024):
    r = np.random.default_rng(77)
    panels = np.ones((n, n), np.float32)
    def split(x, y, w, h, d):
        if d <= 0 or (d < 4 and r.random() < .18) or min(w, h) < 48:
            shade = r.uniform(.84, 1.0)
            xs = np.arange(x, x + w) % n
            ys = np.arange(y, y + h) % n
            panels[np.ix_(ys, xs)] = shade
            panels[ys[:2], :][:, xs] = .42
            panels[np.ix_(ys[:2], xs)] = .42
            panels[np.ix_(ys, xs[:2])] = .42
            panels[np.ix_(ys[2:3], xs)] = np.minimum(shade + .1, 1)
            if min(w, h) > 90:
                for cx, cy in ((x + 9, y + 9), (x + w - 9, y + 9), (x + 9, y + h - 9), (x + w - 9, y + h - 9)):
                    for dx in range(-2, 3):
                        for dy in range(-2, 3):
                            if dx * dx + dy * dy <= 5:
                                panels[(cy + dy) % n, (cx + dx) % n] = .5
            return
        if (w > h) ^ (r.random() < .16):
            c = int(w * r.uniform(.3, .7))
            split(x, y, c, h, d - 1); split(x + c, y, w - c, h, d - 1)
        else:
            c = int(h * r.uniform(.3, .7))
            split(x, y, w, c, d - 1); split(x, y + c, w, h - c, d - 1)
    split(0, 0, n, n, 6)
    grit = fbm(n, 3, 1.2)
    rock = np.clip(fbm(n, 5, 1.55) * .72 + fbm(n, 6, .85) * .4, 0, 1)
    wear = np.clip((fbm(n, 9, 1.7) - .28) * 2, 0, 1)
    rgb = np.stack([panels * (.86 + grit * .14), rock, wear * .55 + grit * .45], axis=2)
    save_jpg(rgb, os.path.join(TEX, 'detail.jpg'), 88)
    height = panels * .8 + grit * .2
    nx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * 2.4
    ny = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * 2.4
    save_jpg(np.stack([np.clip(.5 - nx, 0, 1), np.clip(.5 + ny, 0, 1), np.clip(.35 + wear * .45 + grit * .2, 0, 1)], axis=2), os.path.join(TEX, 'detail_n.jpg'), 90)


def setup_pano(w, h, samples):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == 'METAL'
    sc.cycles.device = 'GPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = False
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    if not sc.camera:
        cd = bpy.data.cameras.new('c')
        ob = bpy.data.objects.new('c', cd)
        sc.collection.objects.link(ob)
        sc.camera = ob
    cd = sc.camera.data
    cd.type = 'PANO'
    if hasattr(cd, 'panorama_type'):
        cd.panorama_type = 'EQUIRECTANGULAR'
    else:
        cd.cycles.panorama_type = 'EQUIRECTANGULAR'
    sc.camera.rotation_euler = (1.5708, 0, 0)
    sc.camera.location = (0, 0, 0)


def ramp(nt, stops):
    r = nt.nodes.new('ShaderNodeValToRGB')
    cr = r.color_ramp
    cr.elements[0].position = 0.0
    cr.elements[1].position = 1.0
    for p, _ in stops[1:-1]:
        cr.elements.new(p)
    cr.elements[0].position = stops[0][0]
    cr.elements[-1].position = stops[-1][0]
    for e, (p, c) in zip(cr.elements, stops):
        e.color = (c[0], c[1], c[2], 1)
    return r


def lin(c):
    c = np.array(c, float)
    return tuple(np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4))


def hexc(h):
    return lin([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)])


def noise(nt, tc, scale, detail, rough, dist, w):
    n = nt.nodes.new('ShaderNodeTexNoise')
    n.noise_dimensions = '4D'
    n.inputs['W'].default_value = w
    n.inputs['Scale'].default_value = scale
    n.inputs['Detail'].default_value = detail
    n.inputs['Roughness'].default_value = rough
    n.inputs['Distortion'].default_value = dist
    nt.links.new(tc, n.inputs['Vector'])
    return n


def world_for(fn):
    w = bpy.data.worlds.new('w')
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    bg = nt.nodes.new('ShaderNodeBackground')
    out = nt.nodes.new('ShaderNodeOutputWorld')
    nt.links.new(bg.outputs[0], out.inputs['Surface'])
    tc = nt.nodes.new('ShaderNodeTexCoord').outputs['Generated']
    col = fn(nt, tc)
    nt.links.new(col, bg.inputs['Color'])
    bg.inputs['Strength'].default_value = 1
    bpy.context.scene.world = w


def render_array():
    sc = bpy.context.scene
    tmp = os.path.join(bpy.app.tempdir or '/tmp', 'space_tex.exr')
    s = sc.render.image_settings
    s.media_type = 'IMAGE'
    s.file_format = 'OPEN_EXR'
    s.color_mode = 'RGB'
    s.color_depth = '32'
    sc.render.filepath = tmp
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(tmp)
    img.colorspace_settings.name = 'Non-Color'
    w, h = img.size
    px = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(px)
    bpy.data.images.remove(img)
    os.remove(tmp)
    a = px.reshape(h, w, 4)[::-1, :, :3]
    return np.where(a <= .0031308, a * 12.92, 1.055 * np.power(np.maximum(a, 1e-6), 1 / 2.4) - .055)


SKIES = [
    (['#05071c', '#101a58', '#2a2f96', '#5a2f9e'], ['#000000', '#6a2c86', '#b0407a'], 11),
    (['#03121a', '#07363f', '#0d6a6a', '#1c8f78'], ['#000000', '#124f7a', '#2a9ab0'], 23),
    (['#16040f', '#3e0b2a', '#7f1c3f', '#b23f2d'], ['#000000', '#5a1f7a', '#c9702c'], 37),
    (['#06080f', '#161f36', '#2c3f63', '#55617f'], ['#000000', '#3f3460', '#7f8fb0'], 53),
]


def sky(i, spec):
    base, accent, seed = spec
    def fn(nt, tc):
        n1 = noise(nt, tc, 1.5, 9, .58, .55, seed * .37)
        n2 = noise(nt, tc, 3.4, 8, .6, .9, seed * .91)
        n3 = noise(nt, tc, 8.5, 6, .55, .2, seed * 1.7)
        r1 = ramp(nt, [(.34, hexc(base[0])), (.47, hexc(base[1])), (.58, hexc(base[2])), (.69, hexc(base[3]))])
        r2 = ramp(nt, [(.5, hexc(accent[0])), (.6, hexc(accent[1])), (.72, hexc(accent[2]))])
        dark = ramp(nt, [(.42, (.22, .22, .22)), (.62, (1, 1, 1))])
        nt.links.new(n1.outputs[0], r1.inputs[0])
        nt.links.new(n2.outputs[0], r2.inputs[0])
        nt.links.new(n3.outputs[0], dark.inputs[0])
        add = nt.nodes.new('ShaderNodeMixRGB')
        add.blend_type = 'ADD'
        add.inputs[0].default_value = .62
        nt.links.new(r1.outputs[0], add.inputs[1])
        nt.links.new(r2.outputs[0], add.inputs[2])
        mul = nt.nodes.new('ShaderNodeMixRGB')
        mul.blend_type = 'MULTIPLY'
        mul.inputs[0].default_value = .8
        nt.links.new(add.outputs[0], mul.inputs[1])
        nt.links.new(dark.outputs[0], mul.inputs[2])
        return mul.outputs[0]
    world_for(fn)
    setup_pano(1600, 800, 6)
    a = np.clip(render_array(), 0, 1) * .8
    for face, tag in ((512, ''), (336, '_lo')):
        save_jpg(cube_strip(a, face), os.path.join(TEX, f'neb{i}{tag}.jpg'), 86)


def cube_strip(eq, n):
    """+X -X +Y -Y +Z -Z faces side by side, resampled from the equirect render."""
    h, w = eq.shape[:2]
    u = (np.arange(n) + .5) / n * 2 - 1
    xx, yy = np.meshgrid(u, u)
    one = np.ones_like(xx)
    # WebGL cube face conventions, row 0 is the top of each face
    faces = [(one, -yy, -xx), (-one, -yy, xx), (xx, one, yy), (xx, -one, -yy), (xx, -yy, one), (-xx, -yy, -one)]
    out = np.zeros((n, n * 6, 3), np.float32)
    for k, (dx, dy, dz) in enumerate(faces):
        l = np.sqrt(dx * dx + dy * dy + dz * dz)
        lon = np.arctan2(dx / l, -dz / l) / (2 * np.pi) + .5
        lat = .5 - np.arcsin(np.clip(dy / l, -1, 1)) / np.pi
        fx = lon * w - .5
        fy = np.clip(lat * h - .5, 0, h - 1.001)
        x0 = np.floor(fx).astype(int)
        y0 = np.floor(fy).astype(int)
        tx, ty = (fx - x0)[..., None], (fy - y0)[..., None]
        x0 %= w
        x1 = (x0 + 1) % w
        c = eq[y0, x0] * (1 - tx) * (1 - ty) + eq[y0, x1] * tx * (1 - ty) + eq[y0 + 1, x0] * (1 - tx) * ty + eq[y0 + 1, x1] * tx * ty
        out[:, k * n:(k + 1) * n] = c
    return out


def stars():
    """Crisp star points: unit direction, size, rgb as float32."""
    r = np.random.default_rng(4242)
    n = 3000
    d = r.normal(size=(n, 3))
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    mag = r.random(n) ** 3.2
    size = 1 + mag * 2.1
    tint = np.array([(1, 1, 1), (.76, .86, 1), (1, .88, .7), (.86, .92, 1), (1, .68, .56)], np.float32)[r.integers(0, 5, n)]
    rgb = tint * (.34 + mag[:, None] * .66)
    data = np.column_stack([d, size, rgb]).astype('<f4')
    os.makedirs(os.path.join(ASSETS, 'mesh'), exist_ok=True)
    data.tofile(os.path.join(ASSETS, 'mesh', 'stars.bin'))
    print('stars', n, flush=True)


PLANETS = [
    ([(.2, '#5b1d16'), (.42, '#b54a22'), (.58, '#e88f3a'), (.75, '#f5c67a')], 'bands', 41),
    ([(.3, '#07345a'), (.47, '#0d6e8c'), (.53, '#c9c28a'), (.66, '#2f8a4f')], 'land', 43),
    ([(.3, '#1a0a12'), (.52, '#4a1524'), (.62, '#d8401e'), (.72, '#ffc23c')], 'lava', 47),
    ([(.25, '#34466d'), (.48, '#7f97bf'), (.68, '#c8d6ea'), (.85, '#f2f6fb')], 'ice', 53),
]


def planet(i, spec):
    stops, kind, seed = spec
    def fn(nt, tc):
        coord = tc
        if kind == 'bands':
            mp = nt.nodes.new('ShaderNodeMapping')
            mp.inputs['Scale'].default_value = (.3, .3, 3.2)
            nt.links.new(tc, mp.inputs['Vector'])
            coord = mp.outputs[0]
        n = noise(nt, coord, 2.6 if kind != 'lava' else 4.2, 10, .56, 1.2 if kind == 'bands' else .35, seed)
        r = ramp(nt, [(p, hexc(c)) for p, c in stops])
        nt.links.new(n.outputs[0], r.inputs[0])
        return r.outputs[0]
    world_for(fn)
    setup_pano(1024, 512, 8)
    a = np.clip(render_array(), 0, 1)
    save_jpg(a, os.path.join(TEX, f'planet{i}.jpg'), 84)


for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob)
detail_map()
stars()
for i, s in enumerate(SKIES):
    sky(i, s)
if '--planets' in sys.argv:
    for i, p in enumerate(PLANETS):
        planet(i, p)
print('TEXTURES DONE', flush=True)
