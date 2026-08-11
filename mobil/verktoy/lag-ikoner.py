#!/usr/bin/env python3
"""
Lager appikonene til Skjold menighet.

Merket er et kirkevindu — rundbue på rektangel — kalket lyst mot gran,
med kirkeåret som en farget søyle inni: fiolett for advent og faste,
gull for jul og påske, rød for pinse, grønn for treenighetstiden.
Det er samme tråd som går gjennom kortene i appen.

Kjør:  python3 verktoy/lag-ikoner.py
"""

from PIL import Image, ImageDraw
from pathlib import Path

GRAN = (22, 48, 42)
KALK = (239, 242, 238)

FIOLETT = (89, 70, 140)
GULL = (160, 122, 28)
ROD = (153, 51, 42)
GRONN = (61, 107, 85)

KIRKEAARET = [FIOLETT, GULL, ROD, GRONN]

UT = Path(__file__).resolve().parent.parent / "assets"
SKALA = 4  # tegn stort og krymp, så kantene blir myke


def tegn_vindu(d: ImageDraw.ImageDraw, boks, kalkfarge, med_kirkeaar=True):
    """Rundbuet vindu. boks = (venstre, topp, høyre, bunn)."""
    v, t, h, b = boks
    bredde = h - v
    bue = bredde / 2

    d.pieslice([v, t, h, t + bredde], 180, 360, fill=kalkfarge)
    d.rectangle([v, t + bue, h, b], fill=kalkfarge)

    if not med_kirkeaar:
        return

    # Søylen inni: kirkeåret ovenfra og ned.
    sb = bredde * 0.13
    sv = (bredde - sb) / 2
    st = t + bue * 0.60
    hoyde = b - st - bredde * 0.16
    bit = hoyde / len(KIRKEAARET)

    for i, farge in enumerate(KIRKEAARET):
        d.rectangle(
            [v + sv, st + i * bit, v + sv + sb, st + (i + 1) * bit],
            fill=farge,
        )


def lag(navn: str, storrelse: int, bakgrunn, *, gjennomsiktig=False, andel=0.56):
    s = storrelse * SKALA
    bilde = Image.new("RGBA", (s, s), (0, 0, 0, 0) if gjennomsiktig else bakgrunn)
    d = ImageDraw.Draw(bilde)

    bredde = s * andel * 0.62
    hoyde = s * andel
    v = (s - bredde) / 2
    t = (s - hoyde) / 2

    tegn_vindu(d, (v, t, v + bredde, t + hoyde), KALK if not gjennomsiktig else KALK)

    bilde = bilde.resize((storrelse, storrelse), Image.LANCZOS)
    UT.mkdir(parents=True, exist_ok=True)
    bilde.save(UT / navn)
    print(f"  {navn}  {storrelse}×{storrelse}")


def lag_splash(navn: str, storrelse: int):
    """Splash-merket: gran vindu på gjennomsiktig, mot kalket bakgrunn."""
    s = storrelse * SKALA
    bilde = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(bilde)

    bredde = s * 0.46 * 0.62
    hoyde = s * 0.46
    v = (s - bredde) / 2
    t = (s - hoyde) / 2

    tegn_vindu(d, (v, t, v + bredde, t + hoyde), GRAN)

    bilde = bilde.resize((storrelse, storrelse), Image.LANCZOS)
    bilde.save(UT / navn)
    print(f"  {navn}  {storrelse}×{storrelse}")


if __name__ == "__main__":
    print("Lager ikoner:")
    lag("icon.png", 1024, GRAN)
    # Android beskjærer hjørnene, så merket må ligge godt innenfor midten.
    lag("adaptive-icon.png", 1024, GRAN, gjennomsiktig=True, andel=0.34)
    lag_splash("splash-icon.png", 512)
    lag("favicon.png", 64, GRAN)
    print("Ferdig.")
