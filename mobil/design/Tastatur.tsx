import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type KeyboardEvent,
  type ScrollViewProps,
} from "react-native";
import { rom } from "./tema";

/**
 * En ScrollView som ruller feltet man skriver i fram over tastaturet.
 *
 * Brukes i stedet for KeyboardAvoidingView + ScrollView på alle skjermer
 * med tekstfelt. Felt (i Grunnelementer) melder selv fra når det får
 * fokus, så skjermene trenger ikke gjøre noe annet enn å bruke denne.
 *
 * Alt regnes i vinduets koordinater: hvor tastaturet begynner, og hvor
 * feltet og rullevinduet ligger. Da blir det riktig både når Android
 * krymper vinduet for tastaturet og når det legger seg over (kant til
 * kant, som i Expo 54). Den delen av rullevinduet tastaturet dekker, blir
 * lagt til som luft nederst, så også det siste feltet kan rulles fram.
 *
 * Bare JavaScript — ingen ny native modul — så det kan sendes over lufta.
 */

type Kontekst = { fokus: (felt: View) => void };

const TastaturKontekst = createContext<Kontekst | null>(null);

/** Brukes av Felt. Utenfor en TastaturRulle gjør den ingenting. */
export function useTastaturFokus() {
  return useContext(TastaturKontekst);
}

/** Luft mellom feltet og tastaturet, så det ikke står klistret til kanten. */
const LUFT = rom.xl;

// iOS sier fra før tastaturet kommer, så rullingen går samtidig med det.
// Android sier bare fra etterpå.
const VIS = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const SKJUL = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

export function TastaturRulle({
  contentContainerStyle,
  onScroll,
  children,
  ...resten
}: ScrollViewProps) {
  const rulle = useRef<ScrollView>(null);
  const rulleboks = useRef<View>(null);
  const forskyvning = useRef(0);
  const aktivtFelt = useRef<View | null>(null);
  /** Hvor tastaturets øvre kant står i vinduet, eller null når det er borte. */
  const tastaturtopp = useRef<number | null>(null);
  const [luftNederst, settLuftNederst] = useState(0);

  const rullTilFelt = useCallback(() => {
    const felt = aktivtFelt.current;
    const topp = tastaturtopp.current;
    if (!felt || topp === null || !rulleboks.current) return;

    rulleboks.current.measureInWindow((_x, boksY, _b, boksH) => {
      felt.measureInWindow((_fx, feltY, _fb, feltH) => {
        const synligTopp = boksY + LUFT;
        const synligBunn = Math.min(boksY + boksH, topp) - LUFT;
        let flytt = 0;
        // Et felt høyere enn det som er synlig (et langt fritekstfelt),
        // skal vise toppen, der man begynner å skrive.
        if (feltY + feltH > synligBunn && feltH <= synligBunn - synligTopp) {
          flytt = feltY + feltH - synligBunn;
        } else if (feltY < synligTopp || feltY > synligBunn) {
          flytt = feltY - synligTopp;
        }
        if (Math.abs(flytt) < 1) return;
        rulle.current?.scrollTo({
          y: Math.max(0, forskyvning.current + flytt),
          animated: true,
        });
      });
    });
  }, []);

  useEffect(() => {
    const vis = Keyboard.addListener(VIS, (e: KeyboardEvent) => {
      tastaturtopp.current = e.endCoordinates.screenY;
      rulleboks.current?.measureInWindow((_x, boksY, _b, boksH) => {
        settLuftNederst(Math.max(0, boksY + boksH - e.endCoordinates.screenY));
        // Vent til lufta nederst er lagt til, og på Android til vinduet
        // eventuelt har krympet, før vi måler feltet.
        setTimeout(rullTilFelt, Platform.OS === "ios" ? 0 : 60);
      });
    });
    const skjul = Keyboard.addListener(SKJUL, () => {
      tastaturtopp.current = null;
      settLuftNederst(0);
    });
    return () => {
      vis.remove();
      skjul.remove();
    };
  }, [rullTilFelt]);

  const kontekst = useMemo<Kontekst>(
    () => ({
      fokus: (felt) => {
        aktivtFelt.current = felt;
        // Står tastaturet alt oppe — man hopper fra ett felt til det neste —
        // kommer det ingen ny beskjed fra det, så vi ruller med én gang.
        if (tastaturtopp.current !== null) setTimeout(rullTilFelt, 0);
      },
    }),
    [rullTilFelt],
  );

  // Lufta legges oppå den bunnmargen skjermen alt har, ikke i stedet for den.
  const innhold = StyleSheet.flatten(contentContainerStyle) ?? {};
  const bunn =
    Number(innhold.paddingBottom ?? innhold.paddingVertical ?? innhold.padding ?? 0) || 0;

  return (
    <TastaturKontekst.Provider value={kontekst}>
      {/* Rullevinduet måles gjennom en vanlig View rundt det. */}
      <View ref={rulleboks} style={{ flex: 1 }} collapsable={false}>
        <ScrollView
          ref={rulle}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          {...resten}
          onScroll={(e) => {
            forskyvning.current = e.nativeEvent.contentOffset.y;
            onScroll?.(e);
          }}
          contentContainerStyle={[contentContainerStyle, { paddingBottom: bunn + luftNederst }]}
        >
          {children}
        </ScrollView>
      </View>
    </TastaturKontekst.Provider>
  );
}
