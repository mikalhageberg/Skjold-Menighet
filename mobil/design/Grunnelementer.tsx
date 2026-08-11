import { forwardRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextProps,
  View,
  type ViewProps,
} from "react-native";
import { farge, radius, rom, skrift, storrelse, TREFF } from "./tema";

/* ── Tekst ───────────────────────────────────────────────────────────── */

type TekstProps = TextProps & {
  variant?: "mega" | "stor" | "mellom" | "brod" | "liten" | "etikett";
  farget?: "gran" | "myk" | "svak" | "messing" | "rod" | "papir";
  halvfet?: boolean;
};

export function Tekst({
  variant = "brod",
  farget = "gran",
  halvfet,
  style,
  ...resten
}: TekstProps) {
  const erDisplay = variant === "mega" || variant === "stor" || variant === "mellom";
  return (
    <Text
      style={[
        {
          fontFamily: erDisplay
            ? halvfet
              ? skrift.displayHalvfet
              : skrift.display
            : halvfet
              ? skrift.tekstHalvfet
              : skrift.tekst,
          fontSize: storrelse[variant],
          lineHeight: erDisplay ? storrelse[variant] * 1.15 : storrelse[variant] * 1.5,
          color: {
            gran: farge.gran,
            myk: farge.granMyk,
            svak: farge.granSvak,
            messing: farge.messing,
            rod: farge.rod,
            papir: farge.papir,
          }[farget],
        },
        variant === "etikett" && {
          letterSpacing: 1.2,
          textTransform: "uppercase",
          fontFamily: skrift.tekstMedium,
        },
        style,
      ]}
      {...resten}
    />
  );
}

/* ── Knapper ─────────────────────────────────────────────────────────── */

type KnappProps = {
  tittel: string;
  onPress: () => void;
  variant?: "fylt" | "stille" | "fare";
  travel?: boolean;
  deaktivert?: boolean;
  fyllBredde?: boolean;
};

export function Knapp({
  tittel,
  onPress,
  variant = "fylt",
  travel,
  deaktivert,
  fyllBredde,
}: KnappProps) {
  const av = deaktivert || travel;
  return (
    <Pressable
      onPress={onPress}
      disabled={av}
      accessibilityRole="button"
      accessibilityLabel={tittel}
      accessibilityState={{ disabled: Boolean(av), busy: Boolean(travel) }}
      style={({ pressed }) => [
        stil.knapp,
        variant === "fylt" && stil.knappFylt,
        variant === "stille" && stil.knappStille,
        variant === "fare" && stil.knappFare,
        fyllBredde && { alignSelf: "stretch" },
        pressed && !av && { opacity: 0.82 },
        av && stil.knappAv,
      ]}
    >
      {travel ? (
        <ActivityIndicator color={variant === "fylt" ? farge.papir : farge.gran} />
      ) : (
        <Text
          style={[
            stil.knappTekst,
            variant === "fylt" ? { color: farge.papir } : { color: farge.gran },
            variant === "fare" && { color: farge.rod },
            av && { color: farge.granSvak },
          ]}
        >
          {tittel}
        </Text>
      )}
    </Pressable>
  );
}

/* ── Skjemafelt ──────────────────────────────────────────────────────── */

import { TextInput, type TextInputProps } from "react-native";

type FeltProps = TextInputProps & {
  etikett: string;
  hjelp?: string;
  feil?: string;
};

export const Felt = forwardRef<TextInput, FeltProps>(function Felt(
  { etikett, hjelp, feil, style, ...resten },
  ref,
) {
  return (
    <View style={{ gap: rom.xs }}>
      <Tekst halvfet>{etikett}</Tekst>
      {hjelp ? (
        <Tekst variant="liten" farget="myk">
          {hjelp}
        </Tekst>
      ) : null}
      <TextInput
        ref={ref}
        accessibilityLabel={etikett}
        placeholderTextColor={farge.granSvak}
        style={[stil.felt, feil ? { borderColor: farge.rod } : null, style]}
        {...resten}
      />
      {feil ? (
        <Tekst variant="liten" farget="rod">
          {feil}
        </Tekst>
      ) : null}
    </View>
  );
});

/* ── Avkryssing ──────────────────────────────────────────────────────── */

export function Avkryss({
  merket,
  onEndre,
  tekst,
  hjelp,
}: {
  merket: boolean;
  onEndre: (verdi: boolean) => void;
  tekst: string;
  hjelp?: string;
}) {
  return (
    <Pressable
      onPress={() => onEndre(!merket)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: merket }}
      accessibilityLabel={tekst}
      style={stil.avkryss}
    >
      <View style={[stil.boks, merket && stil.boksMerket]}>
        {merket ? <View style={stil.hake} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Tekst>{tekst}</Tekst>
        {hjelp ? (
          <Tekst variant="liten" farget="myk">
            {hjelp}
          </Tekst>
        ) : null}
      </View>
    </Pressable>
  );
}

/* ── Beskjeder ───────────────────────────────────────────────────────── */

export function Notis({
  tone = "noytral",
  children,
  ...resten
}: ViewProps & { tone?: "noytral" | "fare" | "klar" }) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        stil.notis,
        {
          borderLeftColor: {
            noytral: farge.messing,
            fare: farge.rod,
            klar: "#3D6B55",
          }[tone],
        },
      ]}
      {...resten}
    >
      {children}
    </View>
  );
}

const stil = StyleSheet.create({
  knapp: {
    minHeight: TREFF,
    paddingHorizontal: rom.xl,
    borderRadius: radius.knapp,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  knappFylt: { backgroundColor: farge.gran, borderColor: farge.gran },
  knappStille: { backgroundColor: "transparent", borderColor: farge.strek },
  knappFare: { backgroundColor: "transparent", borderColor: farge.strek },
  knappAv: { backgroundColor: farge.strek, borderColor: farge.strek },
  knappTekst: {
    fontFamily: skrift.tekstMedium,
    fontSize: storrelse.brod,
  },
  felt: {
    minHeight: TREFF,
    borderWidth: 1,
    borderColor: farge.strek,
    borderRadius: radius.knapp,
    backgroundColor: farge.papir,
    paddingHorizontal: rom.m,
    paddingVertical: rom.m,
    fontFamily: skrift.tekst,
    fontSize: storrelse.brod,
    color: farge.gran,
  },
  avkryss: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: rom.m,
    paddingVertical: rom.s,
    minHeight: TREFF,
  },
  boks: {
    width: 26,
    height: 26,
    borderRadius: radius.liten,
    borderWidth: 1,
    borderColor: farge.granMyk,
    backgroundColor: farge.papir,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  boksMerket: { backgroundColor: farge.gran, borderColor: farge.gran },
  hake: {
    width: 8,
    height: 14,
    borderColor: farge.papir,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    transform: [{ rotate: "45deg" }],
    marginTop: -3,
  },
  notis: {
    backgroundColor: farge.papir,
    borderLeftWidth: 3,
    paddingHorizontal: rom.l,
    paddingVertical: rom.m,
    gap: rom.xs,
  },
});
