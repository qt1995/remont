# -*- coding: utf-8 -*-
"""
Генератор SVG-заглушек для раздела «Наши работы».
Пока нет реальных фотографий объектов — рисуем узнаваемые интерьерные сцены
в фирменной палитре. Заменить на фото: положить jpg/webp в public/portfolio
и поправить пути в src/data/portfolio.ts.
"""
import os

W, H = 800, 600

PALETTES = [
    # wall, floor, accent, furniture, light
    ("#efe9df", "#c39a6b", "#7f8c7f", "#5d6a56", "#f7f2e8"),
    ("#f2efe9", "#d2b189", "#c9a227", "#8a6a44", "#fbf8f1"),
    ("#e8e4dd", "#b48a5f", "#8e9aa8", "#4c5866", "#f4f1ea"),
    ("#f0ece4", "#c9a578", "#a9705a", "#6f4b3e", "#faf6ee"),
    ("#eceae5", "#bf9a70", "#6b7f86", "#3f5158", "#f6f3ec"),
    ("#f3efe7", "#cfa87c", "#9b8ab0", "#54486b", "#fbf7f0"),
]


def head(idx, label):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
        'role="img" aria-label="%s">\n' % (W, H, W, H, label)
    )


def shell(p):
    wall, floor, _, _, light = p
    return f"""  <defs>
    <linearGradient id="w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{light}"/><stop offset="1" stop-color="{wall}"/>
    </linearGradient>
    <linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{floor}"/><stop offset="1" stop-color="#00000022"/>
    </linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eaf3fa"/><stop offset="1" stop-color="#cfe0ee"/>
    </linearGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="url(#w)"/>
  <rect y="410" width="{W}" height="190" fill="{floor}"/>
  <rect y="410" width="{W}" height="190" fill="url(#f)" opacity="0.35"/>
  <rect y="400" width="{W}" height="12" fill="#ffffff" opacity="0.85"/>
  <g stroke="#00000018" stroke-width="2">
    <path d="M0 470 L800 470"/><path d="M0 530 L800 530"/>
  </g>
"""


def window(x=470, y=90, w=250, h=250):
    return f"""  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#ffffff"/>
  <rect x="{x+12}" y="{y+12}" width="{w-24}" height="{h-24}" fill="url(#g)"/>
  <path d="M{x+w/2} {y+12} L{x+w/2} {y+h-12}" stroke="#ffffff" stroke-width="8"/>
  <rect x="{x-14}" y="{y+h}" width="{w+28}" height="14" fill="#ffffff"/>
"""


def sofa(p):
    _, _, accent, furn, _ = p
    return f"""  <rect x="90" y="330" width="300" height="80" rx="14" fill="{furn}"/>
  <rect x="90" y="290" width="300" height="60" rx="16" fill="{accent}"/>
  <rect x="120" y="300" width="80" height="52" rx="12" fill="#ffffff" opacity="0.35"/>
  <rect x="215" y="300" width="80" height="52" rx="12" fill="#ffffff" opacity="0.2"/>
  <ellipse cx="240" cy="470" rx="190" ry="24" fill="#000" opacity="0.12"/>
  <rect x="150" y="470" width="330" height="70" rx="10" fill="#00000022"/>
"""


def bed(p):
    _, _, accent, furn, _ = p
    return f"""  <rect x="120" y="300" width="340" height="110" rx="10" fill="{furn}"/>
  <rect x="120" y="270" width="340" height="46" rx="10" fill="{accent}"/>
  <rect x="150" y="316" width="120" height="34" rx="8" fill="#ffffff" opacity="0.55"/>
  <rect x="290" y="316" width="120" height="34" rx="8" fill="#ffffff" opacity="0.4"/>
  <rect x="120" y="190" width="340" height="80" rx="8" fill="{accent}" opacity="0.5"/>
  <ellipse cx="290" cy="452" rx="210" ry="22" fill="#000" opacity="0.12"/>
"""


def kitchen(p):
    _, _, accent, furn, _ = p
    return f"""  <rect x="60" y="300" width="360" height="110" fill="{furn}"/>
  <rect x="60" y="288" width="360" height="16" fill="#ffffff" opacity="0.85"/>
  <g stroke="#00000030" stroke-width="3">
    <path d="M150 304 L150 410"/><path d="M240 304 L240 410"/><path d="M330 304 L330 410"/>
  </g>
  <rect x="60" y="140" width="270" height="90" fill="{accent}"/>
  <circle cx="200" cy="284" r="10" fill="#ffffff" opacity="0.8"/>
  <ellipse cx="240" cy="452" rx="200" ry="20" fill="#000" opacity="0.1"/>
"""


def bath(p):
    _, _, accent, furn, _ = p
    return f"""  <rect x="90" y="300" width="300" height="110" rx="24" fill="#ffffff"/>
  <rect x="110" y="316" width="260" height="80" rx="18" fill="{accent}" opacity="0.35"/>
  <path d="M150 300 L150 210 L200 210" stroke="{furn}" stroke-width="10" fill="none"/>
  <g fill="#ffffff" opacity="0.5">
    <rect x="480" y="250" width="120" height="160" rx="8"/>
  </g>
  <g stroke="#ffffff" stroke-width="3" opacity="0.7">
    <path d="M0 120 L440 120"/><path d="M0 200 L440 200"/>
  </g>
  <ellipse cx="240" cy="452" rx="180" ry="20" fill="#000" opacity="0.1"/>
"""


def table(p):
    _, _, accent, furn, _ = p
    return f"""  <ellipse cx="250" cy="330" rx="170" ry="40" fill="{furn}"/>
  <g stroke="{furn}" stroke-width="14" stroke-linecap="round">
    <path d="M150 350 L130 440"/><path d="M350 350 L370 440"/>
  </g>
  <g fill="{accent}">
    <rect x="90" y="290" width="60" height="70" rx="10"/>
    <rect x="350" y="290" width="60" height="70" rx="10"/>
  </g>
  <circle cx="250" cy="318" r="22" fill="#ffffff" opacity="0.7"/>
  <ellipse cx="250" cy="455" rx="190" ry="22" fill="#000" opacity="0.1"/>
"""


def plant(p, x=650):
    _, _, accent, furn, _ = p
    return f"""  <path d="M{x-30} 410 L{x+30} 410 L{x+22} 340 L{x-22} 340 Z" fill="{furn}"/>
  <g fill="{accent}">
    <path d="M{x} 340 q-50 -50 -66 -120 q46 24 66 92 z"/>
    <path d="M{x} 340 q48 -60 54 -134 q-46 30 -54 106 z"/>
  </g>
"""


def lamp(p, x=430):
    _, _, accent, furn, _ = p
    return f"""  <path d="M{x} 410 L{x+8} 250" stroke="{furn}" stroke-width="7" stroke-linecap="round"/>
  <path d="M{x-26} 250 L{x+42} 250 L{x+30} 196 L{x-14} 196 Z" fill="{accent}"/>
  <ellipse cx="{x+4}" cy="412" rx="30" ry="8" fill="{furn}"/>
"""


def art(p, x=120, y=140, w=150, h=110):
    _, _, accent, furn, _ = p
    return f"""  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#ffffff" stroke="{furn}" stroke-width="6"/>
  <path d="M{x+14} {y+h-16} L{x+w*0.4} {y+26} L{x+w*0.62} {y+64} L{x+w-14} {y+18} L{x+w-14} {y+h-16} Z" fill="{accent}" opacity="0.7"/>
"""


SCENES = [
    ("Гостиная после ремонта под ключ", lambda p: window() + sofa(p) + art(p) + plant(p)),
    ("Светлая спальня после ремонта", lambda p: window(500, 80, 230, 240) + bed(p) + lamp(p, 520)),
    ("Кухня-гостиная после капитального ремонта", lambda p: window(520, 90, 230, 220) + kitchen(p) + plant(p, 690)),
    ("Санузел после ремонта", lambda p: bath(p)),
    ("Обеденная зона студии", lambda p: window(520, 90, 230, 230) + table(p) + plant(p, 700)),
    ("Гостиная с панорамным окном", lambda p: window(430, 70, 330, 300) + sofa(p) + lamp(p, 700)),
]


def main():
    out = os.path.join(os.path.dirname(__file__), '..', 'public', 'portfolio')
    os.makedirs(out, exist_ok=True)

    for i, (label, draw) in enumerate(SCENES):
        p = PALETTES[i % len(PALETTES)]
        svg = head(i, label) + shell(p) + draw(p)
        svg += '  <rect width="%d" height="%d" fill="#0b1220" opacity="0.04"/>\n</svg>\n' % (W, H)
        path = os.path.join(out, 'work-%d.svg' % (i + 1))
        with open(path, 'w', encoding='utf-8') as f:
            f.write(svg)
        print('written', path)


if __name__ == '__main__':
    main()
