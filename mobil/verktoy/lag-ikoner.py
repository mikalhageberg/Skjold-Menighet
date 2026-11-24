#!/usr/bin/env python3
"""
Lager appikonene til Skjold menighet.

Merket er Skjold kirke sett forfra: klokketårnet med korset, den hvite
gavlen, og korsvinduet fra koret. Vinduets topp har samme vinkel som taket,
slik den har i kirka, og blyet mellom rutene danner korset. Glasset er
kirkeåret ovenfra og ned: fiolett for advent og faste, gull for jul og påske,
rød for pinse, grønn for treenighetstiden. Det er samme tråd som går gjennom
kortene i appen.

Merket er tegnet på et lerret på 1024 × 1024 og består bare av mangekanter,
så det kan skrives ut både som bilde (her) og som SVG (flygebladet).

Kjør:  python3 verktoy/lag-ikoner.py
"""

from PIL import Image, ImageDraw
from pathlib import Path

GRAN = (22, 48, 42)
KALK = (239, 242, 238)
INGENTING = (0, 0, 0, 0)
HVIT = (255, 255, 255)

FIOLETT = (89, 70, 140)
GULL = (160, 122, 28)
ROD = (153, 51, 42)
GRONN = (61, 107, 85)

KIRKEAARET = [FIOLETT, GULL, ROD, GRONN]

# De samme fargene som glass med lys bak, til når gavlen er mørk.
GLASS = [(183, 164, 234), (227, 182, 76), (218, 106, 84), (100, 174, 142)]
KORSGULL = GLASS[1]

ROT = Path(__file__).resolve().parent.parent.parent
UT = ROT / "mobil" / "assets"
SKALA = 4  # tegn stort og krymp, så kantene blir myke

LERRET = 1024
MIDT = LERRET / 2

# Utstrekningen til den frittstående kirka: (venstre, topp, høyre, bunn).
FRITTSTAENDE = (112, 84, 912, 984)

HELNING = 1.04  # taket, og toppen av vinduet
GAVLTOPP = 412


def lysne(farge, andel: float):
    return tuple(round(k + (255 - k) * andel) for k in farge)


def rektangel(v, t, h, b):
    return [(v, t), (h, t), (h, b), (v, b)]


def vindu(farger):
    """Korsvinduet: spiss topp, korsarm og et langt skaft i fire farger."""
    topp, bunn = 512, 944
    arm, skaft, bly = 130, 65, 18
    halv = bly / 2

    y_arm = topp + arm * HELNING
    y_skaft = y_arm + (arm - skaft) * HELNING
    hoyde = bunn - y_skaft
    grenser = [y_skaft + hoyde * a for a in (0.29, 0.537, 0.784, 1)]

    former = []
    for side in (-1, 1):
        # Høyre side er litt lysere, som glass lyset faller skrått på.
        rute = [lysne(f, 0.12) for f in farger] if side == 1 else farger
        ytterst = arm - halv / HELNING

        def x(avstand):
            return MIDT + side * avstand

        former.append((
            [(x(halv), topp + halv * HELNING), (x(ytterst), y_arm - halv), (x(halv), y_arm - halv)],
            rute[0],
        ))
        former.append((
            [
                (x(halv), y_arm + halv), (x(ytterst), y_arm + halv), (x(skaft), y_skaft),
                (x(skaft), grenser[0] - halv), (x(halv), grenser[0] - halv),
            ],
            lysne(rute[0], 0.14),
        ))
        for i in (1, 2, 3):
            t = grenser[i - 1] + halv
            b = grenser[i] - (0 if i == 3 else halv)
            former.append(([(x(halv), t), (x(skaft), t), (x(skaft), b), (x(halv), b)], rute[i]))
    return former


def kirka(vegg, hull, farger, kors, *, frittstaende=False):
    """
    Kirka som en liste av (mangekant, farge), i rekkefølgen de skal tegnes.

    `hull` er fargen bak kirka, den som skal synes gjennom tårnåpningen.
    Frittstående får kirka vegger og golv; ellers går gavlen ut over kanten.
    """
    tv, topp = 98, 84
    gesims = topp + 92
    apning_t, apning_b = gesims + 32, gesims + 176

    def tak(y):
        ytre = 400 if frittstaende else 912
        bunn = FRITTSTAENDE[3] if frittstaende else 1600
        return [
            (MIDT, y), (MIDT + ytre, y + ytre * HELNING), (MIDT + ytre, bunn),
            (MIDT - ytre, bunn), (MIDT - ytre, y + ytre * HELNING),
        ]

    former = [
        # Tårnet
        ([
            (MIDT, topp), (MIDT + tv + 30, gesims), (MIDT + tv + 30, gesims + 12),
            (MIDT - tv - 30, gesims + 12), (MIDT - tv - 30, gesims),
        ], vegg),
        (rektangel(MIDT - tv, gesims + 10, MIDT + tv, GAVLTOPP + 300), vegg),
        (rektangel(MIDT - tv + 24, apning_t, MIDT + tv - 24, apning_b), hull),
    ]
    if kors:
        former += [
            (rektangel(MIDT - 12, apning_t + 18, MIDT + 12, apning_b - 16), kors),
            (rektangel(MIDT - 46, apning_t + 48, MIDT + 46, apning_t + 72), kors),
        ]
    # Skyggen mellom tårn og gavl, og så gavlen selv
    former += [(tak(GAVLTOPP - 44), hull), (tak(GAVLTOPP), vegg)]
    return former + vindu(farger)


def varselmerke():
    """
    Merket i statuslinja på Android: bare én farge, og 24 punkter høyt.
    Omrisset av vinduet alene blir en pil når blyet ikke synes, så her er
    det korset i blyet som er skåret ut av gavlen.
    """
    former = kirka(HVIT, INGENTING, KIRKEAARET, None, frittstaende=True)
    uten_vindu = former[:-len(vindu(KIRKEAARET))]
    return uten_vindu + [
        (rektangel(MIDT - 42, 560, MIDT + 42, 910), INGENTING),
        (rektangel(MIDT - 140, 660, MIDT + 140, 744), INGENTING),
    ]


def tegn(d: ImageDraw.ImageDraw, former, skala: float, dx=0.0, dy=0.0):
    for punkter, farge in former:
        d.polygon([(x * skala + dx, y * skala + dy) for x, y in punkter], fill=farge)


def tegn_frittstaende(d: ImageDraw.ImageDraw, former, v: float, t: float, hoyde: float) -> float:
    """Tegner en frittstående kirke med hjørnet i (v, t). Gir tilbake bredden."""
    fv, ft, fh, fb = FRITTSTAENDE
    skala = hoyde / (fb - ft)
    tegn(d, former, skala, v - fv * skala, t - ft * skala)
    return (fh - fv) * skala


def som_svg(former, klasse: str) -> str:
    """Den frittstående kirka som SVG, til flygebladet."""
    v, t, h, b = FRITTSTAENDE
    ut = [f'<svg class="{klasse}" viewBox="{v} {t} {h - v} {b - t}" aria-hidden="true">']
    for punkter, farge in former:
        sti = " ".join(f"{x:.1f},{y:.1f}" for x, y in punkter)
        ut.append(f'<polygon points="{sti}" fill="#{"".join(f"{k:02x}" for k in farge[:3])}"/>')
    return "".join(ut) + "</svg>"


def lagre(bilde: Image.Image, storrelse: int, sti: Path):
    sti.parent.mkdir(parents=True, exist_ok=True)
    bilde.resize((storrelse, storrelse), Image.LANCZOS).save(sti)
    print(f"  {sti.name}  {storrelse}×{storrelse}")


def lag(navn: str, storrelse: int, bakgrunn, *, gjennomsiktig=False, andel=1.0, mappe=None):
    """Ikonet. `andel` krymper kirka mot midten; gavlen når likevel ut til kanten."""
    s = storrelse * SKALA
    bilde = Image.new("RGBA", (s, s), INGENTING if gjennomsiktig else bakgrunn)
    hull = INGENTING if gjennomsiktig else bakgrunn
    skala = s / LERRET * andel
    luft = (s - LERRET * skala) / 2
    tegn(ImageDraw.Draw(bilde), kirka(KALK, hull, KIRKEAARET, KORSGULL), skala, luft, luft)
    lagre(bilde, storrelse, (mappe or UT) / navn)


def lag_frittstaende(navn: str, storrelse: int, former, andel: float):
    """Kirka alene på gjennomsiktig, `andel` av lerretet høy."""
    s = storrelse * SKALA
    bilde = Image.new("RGBA", (s, s), INGENTING)
    v, t, h, b = FRITTSTAENDE
    hoyde = s * andel
    bredde = hoyde * (h - v) / (b - t)
    tegn_frittstaende(ImageDraw.Draw(bilde), former, (s - bredde) / 2, (s - hoyde) / 2, hoyde)
    lagre(bilde, storrelse, UT / navn)


if __name__ == "__main__":
    print("Lager ikoner:")
    lag("icon.png", 1024, GRAN)
    # Android viser bare de midterste to tredelene og klipper til sirkel.
    lag("adaptive-icon.png", 1024, GRAN, gjennomsiktig=True, andel=0.572)
    # Splash: mørk kirke mot den kalkede bakgrunnen, med lys i vinduet.
    lag_frittstaende(
        "splash-icon.png", 512, kirka(GRAN, INGENTING, GLASS, GULL, frittstaende=True), 0.78
    )
    lag_frittstaende("varsel-ikon.png", 96, varselmerke(), 0.92)
    lag("favicon.png", 64, GRAN)
    lag("icon.png", 192, GRAN, mappe=ROT / "web" / "app")
    print("Ferdig.")
