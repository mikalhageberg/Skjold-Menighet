#!/usr/bin/env python3
"""
Lager QR-koden til nedlastingssiden.

Den skal på plakaten på kirkebakken og i menighetsbladet, så den lages i to
utgaver: SVG til trykk, som tåler hvilken som helst størrelse, og PNG til
skjerm og til dem som bare skal lime den inn et sted.

Fargene er kirkas egne — gran på kalk, ikke svart på hvitt. Kontrasten
mellom dem er langt over det skannere trenger, så den leses like lett.

Feilkorreksjonen står på «H», det høyeste nivået. Det gir mest å gå på når
koden er brettet i bladet, har fått en kaffeflekk eller har hengt ute en
uke — som er der en trykt kode ender.

Kjør:  python3 verktoy/lag-qr.py [adresse]

Krever segno:  python3 -m pip install --user segno
"""

import sys
from pathlib import Path

import segno

ADRESSE = "https://skjold.online/app"

GRAN = "#16302A"
KALK = "#EFF2EE"

UT = Path(__file__).resolve().parent / "qr"


def lag(adresse: str) -> None:
    UT.mkdir(parents=True, exist_ok=True)
    kode = segno.make_qr(adresse, error="h")

    # border=4 er stillesonen standarden krever. Uten den leser mange
    # telefoner koden tregere, og noen ikke i det hele tatt.
    svg = UT / "skjold-app-qr.svg"
    kode.save(svg, scale=10, border=4, dark=GRAN, light=KALK)

    # Rundt 1200 px — romslig nok til en plakat i A4 og til å legges i et
    # dokument uten at noen trenger å tenke på oppløsning. Skalaen må være
    # et helt tall, ellers blir rutene ulikt store og kanten uskarp.
    png = UT / "skjold-app-qr.png"
    kode.save(png, scale=1200 // kode.symbol_size(border=4)[0], border=4,
              dark=GRAN, light=KALK)

    for fil in (svg, png):
        print(f"{fil.relative_to(Path.cwd())}  ({fil.stat().st_size // 1024} kB)")
    print(f"peker på: {adresse}")


if __name__ == "__main__":
    lag(sys.argv[1] if len(sys.argv) > 1 else ADRESSE)
