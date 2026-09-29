#!/usr/bin/env python3
"""
Lager flygebladet om appen: ett A4-ark, tosidig, brettet til et hefte.

    python3 verktoy/lag-flygeblad.py

Havner i verktoy/flygeblad/ som PDF til trykk, og PNG av hver side til å
se på. Selve innholdet står i verktoy/flygeblad.html — skal noe endres,
endres det der og skriptet kjøres på nytt.

Skriv ut tosidig, vend på kortsiden, og brett på midten. På A4 blir heftet
A5; skrives samme PDF ut på A3 («tilpass til siden»), blir heftet A4.

Skriftene er appens egne, hentet fra node_modules. QR-koden til
nedlastingssiden er den samme som på plakaten (lag-qr.py).

Krever Google Chrome, segno og pymupdf (bare til PNG-ene):
    python3 -m pip install --user segno pymupdf
"""

import importlib.util
import subprocess
import sys
from pathlib import Path

HER = Path(__file__).resolve().parent
ROT = HER.parent
UT = HER / "flygeblad"

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PERSONVERN = "https://skjold.online/personvern"
GRAN, PAPIR, KALK = "#16302A", "#FAFBF8", "#EFF2EE"


def lag_qr():
    spec = importlib.util.spec_from_file_location("lag_qr", HER / "lag-qr.py")
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return modul


def svg(kode, lys: str) -> str:
    # border=4 er stillesonen standarden krever — se lag-qr.py.
    return kode.svg_inline(scale=1, border=4, dark=GRAN, light=lys, omitsize=True)


def main() -> None:
    if not Path(CHROME).exists():
        sys.exit(f"Fant ikke Chrome på {CHROME}.")
    fonter = ROT / "node_modules" / "@expo-google-fonts"
    if not fonter.exists():
        sys.exit("Fant ikke skriftene. Kjør «npm install» først.")

    qr = lag_qr()
    html = (HER / "flygeblad.html").read_text(encoding="utf-8")
    for navn, verdi in {
        "{{FONTER}}": fonter.as_uri(),
        "{{LOGO}}": (HER / "hageberg-logo.png").as_uri(),
        "{{LOGO_KIRKA}}": (HER / "dnk-skjold-logo.png").as_uri(),
        "{{ILLUSTRASJON}}": (HER / "kirkekaffe.jpg").as_uri(),
        "{{QR_APP}}": svg(qr.kode_for(qr.ADRESSE), PAPIR),
        "{{QR_PERSONVERN}}": svg(qr.segno.make_qr(PERSONVERN, error="h"), KALK),
    }.items():
        html = html.replace(navn, verdi)

    UT.mkdir(parents=True, exist_ok=True)
    kilde = UT / "flygeblad.html"
    kilde.write_text(html, encoding="utf-8")

    pdf = UT / "skjold-app-flygeblad.pdf"
    subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
         "--virtual-time-budget=5000", f"--print-to-pdf={pdf}", kilde.as_uri()],
        check=True, capture_output=True,
    )

    try:
        import pymupdf
    except ImportError:
        print("(uten pymupdf blir det ingen PNG-er å se på)")
    else:
        dok = pymupdf.open(pdf)
        if dok.page_count != 2:
            sys.exit(f"PDF-en fikk {dok.page_count} sider, ikke 2. Noe renner over.")
        for i, side in enumerate(dok, start=1):
            navn = "utside" if i == 1 else "innside"
            side.get_pixmap(dpi=150).save(UT / f"ark-{i}-{navn}.png")

    print(f"{pdf.relative_to(ROT)}  ({pdf.stat().st_size // 1024} kB)")
    print("Skriv ut tosidig, vend på kortsiden, brett på midten.")


if __name__ == "__main__":
    main()
