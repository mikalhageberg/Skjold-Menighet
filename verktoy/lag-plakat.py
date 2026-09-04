#!/usr/bin/env python3
"""
Lager plakaten som skal henge i kirken.

    python3 verktoy/lag-plakat.py

Havner i verktoy/plakat/ som PDF til trykk og PNG til skjerm. A4 stående,
300 dpi.

Plakaten gjør én ting: får folk fra kirkebakken til nedlastingssiden. Der
velger de selv iPhone eller Android, og sida forklarer resten. Derfor står
det ikke noe her om App Store eller lukket test — det ville måtte byttes
hver gang appen flytter seg et steg videre, og en plakat på veggen henger
lenge.

Skriftene er appens egne, hentet fra node_modules. Fargene er kirkas:
gran og kalk, med kirkeåret som en stripe langs bunnen — samme tråd som
går gjennom kortene i appen.

Krever Pillow og segno:
    python3 -m pip install --user Pillow segno
"""

import importlib.util
import io
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Dette skriptet trenger Pillow:  python3 -m pip install --user Pillow")

HER = Path(__file__).resolve().parent
ROT = HER.parent
UT = HER / "plakat"

ADRESSE = "https://skjold.online/app"
ADRESSE_LEST = "skjold.online/app"

DPI = 300
BREDDE, HOYDE = 2480, 3508  # A4 stående i 300 dpi
MARG = 210

GRAN = (22, 48, 42)
GRAN_MYK = (63, 91, 83)
KALK = (239, 242, 238)
PAPIR = (250, 251, 248)
STREK = (211, 219, 213)
KIRKEAARET = [(89, 70, 140), (160, 122, 28), (153, 51, 42), (61, 107, 85)]

# ── Teksten ──────────────────────────────────────────────────────────
# Alt som står på plakaten, samlet her. Skal noe endres, endres det her og
# skriptet kjøres på nytt.

MERKE = "Skjold menighet"
TITTEL = "Appen på telefonen"
INGRESS = [
    "Se hva menigheten trenger hjelp til,",
    "meld deg på det som passer,",
    "og få en påminnelse dagen før.",
]
STEG = [
    "Åpne kameraet på telefonen.",
    "Hold det mot koden til det kommer opp en lenke.",
    "Trykk på lenken, og velg telefonen du har.",
]
RESERVE = f"Får du det ikke til, kan du skrive {ADRESSE_LEST} i nettleseren."


def skrift(familie: str, vekt: str, storrelse: int) -> ImageFont.FreeTypeFont:
    navn = {"fraunces": "Fraunces", "schibsted-grotesk": "SchibstedGrotesk"}[familie]
    sti = ROT / "node_modules" / "@expo-google-fonts" / familie / vekt / f"{navn}_{vekt}.ttf"
    if not sti.exists():
        sys.exit(f"Fant ikke skriften {sti}. Kjør «npm install» først.")
    return ImageFont.truetype(str(sti), storrelse)


def hent_qr():
    """Låner koden fra lag-qr.py, så adressen er bestemt ett sted."""
    spec = importlib.util.spec_from_file_location("lag_qr", HER / "lag-qr.py")
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return modul.kode_for(ADRESSE)


# Stillesonen standarden krever: fire tomme ruter hele veien rundt. Uten
# den leser mange telefoner koden tregt, og noen ikke i det hele tatt.
# Segno tegner den selv når border settes, så den blir riktig i forhold til
# rutestørrelsen uansett hvor stor koden gjøres.
STILLESONE = 4


def qr_bilde(mal_px: int) -> Image.Image:
    """
    QR-koden som bilde, med hele ruter.

    Skalaen må være et helt tall og bildet må ikke skaleres etterpå — en
    halv rute her og der er nettopp det som gjør at en kode leses tregt
    eller ikke i det hele tatt. Derfor blir koden sjelden nøyaktig så stor
    som det blir bedt om, og det er greit.
    """
    kode = hent_qr()
    ruter = kode.symbol_size(border=STILLESONE)[0]
    skala = max(1, round(mal_px / ruter))
    bufer = io.BytesIO()
    kode.save(bufer, kind="png", scale=skala, border=STILLESONE,
              dark="#16302A", light="#FAFBF8")
    bufer.seek(0)
    return Image.open(bufer).convert("RGB")


def midtstill(d: ImageDraw.ImageDraw, y: int, tekst: str, font, fill) -> int:
    """Skriver en linje midtstilt på arket og gir tilbake bunnen av den."""
    v, t, h, b = d.textbbox((0, 0), tekst, font=font)
    d.text(((BREDDE - (h - v)) / 2 - v, y - t), tekst, font=font, fill=fill)
    return y + (b - t)


def sperret(d: ImageDraw.ImageDraw, y: int, tekst: str, font, fill, sperre: int) -> int:
    """Versaler med luft mellom bokstavene — merkelappen over tittelen."""
    tegn = list(tekst.upper())
    bredder = [d.textlength(t, font=font) for t in tegn]
    total = sum(bredder) + sperre * (len(tegn) - 1)
    x = (BREDDE - total) / 2
    hoyde = 0
    for t, b in zip(tegn, bredder):
        _, topp, _, bunn = d.textbbox((0, 0), t, font=font)
        d.text((x, y - topp), t, font=font, fill=fill)
        hoyde = max(hoyde, bunn - topp)
        x += b + sperre
    return y + hoyde


def rundet_maske(storrelse: int, radius: int) -> Image.Image:
    maske = Image.new("L", (storrelse, storrelse), 0)
    ImageDraw.Draw(maske).rounded_rectangle([0, 0, storrelse - 1, storrelse - 1],
                                            radius=radius, fill=255)
    return maske


def lag_plakat() -> Image.Image:
    ark = Image.new("RGB", (BREDDE, HOYDE), KALK)
    d = ImageDraw.Draw(ark)

    # ── Appikonet, slik det ser ut på telefonen ──────────────────────
    ikonfil = ROT / "mobil" / "assets" / "icon.png"
    if not ikonfil.exists():
        sys.exit(f"Fant ikke appikonet {ikonfil}.")
    ikon_px = 430
    ikon = Image.open(ikonfil).convert("RGB").resize((ikon_px, ikon_px), Image.LANCZOS)
    ark.paste(ikon, ((BREDDE - ikon_px) // 2, 220), rundet_maske(ikon_px, round(ikon_px * 0.22)))

    y = 220 + ikon_px + 140

    # ── Navn og tittel ───────────────────────────────────────────────
    y = sperret(d, y, MERKE, skrift("schibsted-grotesk", "500Medium", 52), GRAN_MYK, 10)
    y += 58
    y = midtstill(d, y, TITTEL, skrift("fraunces", "600SemiBold", 186), GRAN)

    y += 78
    ingress = skrift("schibsted-grotesk", "400Regular", 66)
    for linje in INGRESS:
        y = midtstill(d, y, linje, ingress, GRAN_MYK) + 26

    # ── QR-koden på et eget kort ─────────────────────────────────────
    # Koden har stillesonen sin innebygd, så kortet legger bare til litt
    # luft og en hårfin kant — det samme kortet som i appen.
    y += 96
    qr = qr_bilde(1000)
    luft = 46
    kort = qr.width + luft * 2
    kort_v = (BREDDE - kort) // 2
    d.rectangle([kort_v, y, kort_v + kort, y + kort], fill=PAPIR, outline=STREK, width=3)
    ark.paste(qr, (kort_v + luft, y + luft))
    y += kort + 54

    y = midtstill(d, y, ADRESSE_LEST, skrift("fraunces", "500Medium", 76), GRAN)

    # ── Slik gjør du ─────────────────────────────────────────────────
    y += 104
    d.line([MARG, y, BREDDE - MARG, y], fill=STREK, width=3)
    y += 82

    tall = skrift("fraunces", "600SemiBold", 76)
    steg = skrift("schibsted-grotesk", "400Regular", 64)
    innrykk = MARG + 124
    for i, linje in enumerate(STEG, start=1):
        _, topp, _, bunn = d.textbbox((0, 0), linje, font=steg)
        d.text((MARG + 20, y - d.textbbox((0, 0), f"{i}", font=tall)[1]), f"{i}", font=tall, fill=GRAN_MYK)
        d.text((innrykk, y - topp), linje, font=steg, fill=GRAN)
        y += (bunn - topp) + 56

    y += 26
    reserve = skrift("schibsted-grotesk", "400Regular", 50)
    _, topp, _, bunn = d.textbbox((0, 0), RESERVE, font=reserve)
    d.text((MARG, y - topp), RESERVE, font=reserve, fill=GRAN_MYK)
    bunnkant = y + (bunn - topp)

    # Går noe utenfor arket, skal det oppdages her og ikke på trykkeriet.
    if bunnkant > HOYDE - 100:
        sys.exit(f"Teksten går for langt ned ({bunnkant} av {HOYDE}). Stram inn avstandene.")

    # ── Kirkeåret langs bunnen ───────────────────────────────────────
    stripe = 34
    felt = BREDDE / len(KIRKEAARET)
    for i, farge in enumerate(KIRKEAARET):
        d.rectangle([i * felt, HOYDE - stripe, (i + 1) * felt, HOYDE], fill=farge)

    return ark


def main() -> None:
    UT.mkdir(parents=True, exist_ok=True)
    ark = lag_plakat()

    png = UT / "skjold-app-plakat-a4.png"
    pdf = UT / "skjold-app-plakat-a4.pdf"
    ark.save(png, dpi=(DPI, DPI))
    ark.save(pdf, "PDF", resolution=DPI)

    for fil in (pdf, png):
        print(f"{fil.relative_to(Path.cwd())}  ({fil.stat().st_size // 1024} kB)")
    print(f"A4 stående, {DPI} dpi — peker på {ADRESSE}")


if __name__ == "__main__":
    main()
