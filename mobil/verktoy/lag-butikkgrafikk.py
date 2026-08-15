#!/usr/bin/env python3
"""
Lager grafikken butikkene ber om, men som ikke ligger i appen selv.

    python3 verktoy/lag-butikkgrafikk.py

Alt havner i verktoy/butikk/ og kan lastes rett opp:

  play-ikon-512.png     Google Play, appikonet — 512 × 500, 32-bits PNG
  play-promo-1024.png   Google Play, promografikken — 1024 × 500

Merket er det samme kirkevinduet som appikonet, tegnet av lag-ikoner.py,
med kirkeåret som en farget søyle inni. Skriftene er de appen faktisk
bruker: Fraunces til navnet, Schibsted Grotesk til underteksten.

Promografikken vises i ulike størrelser og blir beskåret i kantene på
noen flater, så alt som betyr noe holder seg godt innenfor.
"""

import importlib.util
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Dette skriptet trenger Pillow:  pip3 install Pillow")

HER = Path(__file__).resolve().parent
ROT = HER.parent.parent
UT = HER / "butikk"

SKALA = 3  # tegn stort og krymp, så kantene blir myke


def hent_generator():
    """Låner tegningen av kirkevinduet fra ikon-skriptet, så merket er ett sted."""
    sti = HER / "lag-ikoner.py"
    spec = importlib.util.spec_from_file_location("lag_ikoner", sti)
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return modul


def skrift(familie: str, vekt: str, storrelse: int):
    sti = ROT / "node_modules" / "@expo-google-fonts" / familie / vekt / f"{vekt.split('_')[0]}.ttf"
    # Filnavnet er «Fraunces_600SemiBold.ttf» — altså familie + vekt.
    navn = {"fraunces": "Fraunces", "schibsted-grotesk": "SchibstedGrotesk"}[familie]
    sti = ROT / "node_modules" / "@expo-google-fonts" / familie / vekt / f"{navn}_{vekt}.ttf"
    if not sti.exists():
        sys.exit(f"Fant ikke skriften {sti}. Kjør «npm install» først.")
    return ImageFont.truetype(str(sti), storrelse)


def lag_promo(g, bredde=1024, hoyde=500):
    """
    Promografikken. Vinduet til venstre, navnet til høyre — samme
    komposisjon som toppen av appen, bare lagt ned.
    """
    b, h = bredde * SKALA, hoyde * SKALA
    bilde = Image.new("RGB", (b, h), g.GRAN)
    d = ImageDraw.Draw(bilde)

    # Kirkeåret som en tynn stripe langs bunnen — samme tråd som kantene
    # på kortene i appen, og det eneste stedet farge brukes.
    stripe = round(h * 0.018)
    felt = b / len(g.KIRKEAARET)
    for i, farge in enumerate(g.KIRKEAARET):
        d.rectangle([i * felt, h - stripe, (i + 1) * felt, h], fill=farge)

    # Vinduet, i samme forhold som på ikonet.
    vindushoyde = h * 0.52
    vindusbredde = vindushoyde * 0.62
    v = b * 0.13
    t = (h - stripe - vindushoyde) / 2
    g.tegn_vindu(d, (v, t, v + vindusbredde, t + vindushoyde), g.KALK)

    # Teksten. Navnet i Fraunces, som titlene i appen.
    tekst_v = v + vindusbredde + b * 0.075
    navn = skrift("fraunces", "600SemiBold", round(h * 0.135))
    under = skrift("schibsted-grotesk", "400Regular", round(h * 0.062))

    linje1 = "Skjold menighet"
    linje2 = "Se hva kirken trenger hjelp til,"
    linje3 = "og si ja til det som passer."

    hoyde1 = d.textbbox((0, 0), linje1, font=navn)[3]
    hoyde2 = d.textbbox((0, 0), linje2, font=under)[3]
    mellomrom = h * 0.055
    total = hoyde1 + mellomrom + hoyde2 * 2.5
    y = (h - stripe - total) / 2

    d.text((tekst_v, y), linje1, font=navn, fill=g.KALK)
    y += hoyde1 + mellomrom
    for linje in (linje2, linje3):
        d.text((tekst_v, y), linje, font=under, fill=(150, 170, 160))
        y += hoyde2 * 1.25

    return bilde.resize((bredde, hoyde), Image.LANCZOS)


def main() -> None:
    g = hent_generator()
    UT.mkdir(parents=True, exist_ok=True)

    # Appikonet til Play: fullt, ugjennomsiktig kvadrat. Ikke det adaptive
    # ikonet, som er gjennomsiktig og har mye luft fordi Android klipper.
    g.UT = UT
    g.lag("play-ikon-512.png", 512, g.GRAN)

    promo = lag_promo(g)
    promo.save(UT / "play-promo-1024.png")
    print(f"  play-promo-1024.png  {promo.width}×{promo.height}")

    print(f"\nFerdig. Filene ligger i {UT}")


if __name__ == "__main__":
    main()
