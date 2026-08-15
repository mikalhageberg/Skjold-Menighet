#!/usr/bin/env python3
"""
Gjør skjermbilder fra telefonen om til de målene App Store Connect krever.

    python3 verktoy/skjermbilder.py ~/Desktop/*.PNG

Ferdige bilder havner i verktoy/skjermbilder/ og kan dras rett inn i
App Store Connect.

Apple godtar bare noen få eksakte pikselstørrelser, og avviser alt annet
uten å si mer enn at «dimensions are wrong». En iPhone 15 tar bilder på
1179 × 2556; kravet for 6,5-tommers oppføringen er 1284 × 2778. Forholdet
mellom sidene er nesten identisk (0,461 mot 0,462), så bildet skaleres opp
til det dekker, og det som blir til overs — noen få piksler — klippes bort
i kantene. Ingen strekking, ingen svarte striper.

Trenger dere andre mål, står de i --hjelp.
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Dette skriptet trenger Pillow:  pip3 install Pillow")

# Målene Apple godtar. 6.5 er den App Store Connect ber om i dag; 6.9 er
# den nyeste, og dekker de andre om dere heller vil bruke den.
MAAL = {
    "6.5": (1284, 2778),
    "6.5-alt": (1242, 2688),
    "6.9": (1290, 2796),
    "ipad": (2048, 2732),
    # Google Play vil ha 16:9 eller 9:16 på nettbrett. Appen er låst til
    # stående, så da er det 9:16.
    "play-7": (1080, 1920),
    "play-10": (1440, 2560),
}

UT = Path(__file__).parent / "skjermbilder"


def tilpass(bilde: Image.Image, bredde: int, hoyde: int) -> Image.Image:
    """Skalerer så bildet dekker målet, og klipper midtstilt til rett størrelse."""
    faktor = max(bredde / bilde.width, hoyde / bilde.height)
    skalert = bilde.resize(
        (round(bilde.width * faktor), round(bilde.height * faktor)),
        Image.LANCZOS,
    )
    venstre = (skalert.width - bredde) // 2
    topp = (skalert.height - hoyde) // 2
    return skalert.crop((venstre, topp, venstre + bredde, topp + hoyde))


def main() -> None:
    argumenter = [a for a in sys.argv[1:] if not a.startswith("--")]
    valg = [a for a in sys.argv[1:] if a.startswith("--")]

    if "--hjelp" in valg or "--help" in valg or not argumenter:
        print(__doc__)
        print("Mål å velge mellom (--maal=6.5 er standard):")
        for navn, (b, h) in MAAL.items():
            print(f"  --maal={navn:9} {b} × {h}")
        return

    navn = next((v.split("=", 1)[1] for v in valg if v.startswith("--maal=")), "6.5")
    if navn not in MAAL:
        sys.exit(f"Ukjent mål «{navn}». Se --hjelp.")
    bredde, hoyde = MAAL[navn]

    UT.mkdir(exist_ok=True)
    print(f"Mål: {bredde} × {hoyde} piksler\n")

    for nummer, sti in enumerate(sorted(Path(p) for p in argumenter), start=1):
        if not sti.exists():
            print(f"  hopper over {sti} — finnes ikke")
            continue

        with Image.open(sti) as bilde:
            # App Store tar ikke imot gjennomsiktighet.
            bilde = bilde.convert("RGB")
            fra = f"{bilde.width} × {bilde.height}"
            ferdig = tilpass(bilde, bredde, hoyde)

        filnavn = UT / f"{nummer:02d}-{sti.stem.lower().replace(' ', '-')}.png"
        ferdig.save(filnavn, "PNG")
        print(f"  {fra:>13}  →  {bredde} × {hoyde}   {filnavn.name}")

    print(f"\nFerdig. Bildene ligger i {UT}")
    print("Dra dem inn i App Store Connect under «6.5\" Display».")


if __name__ == "__main__":
    main()
