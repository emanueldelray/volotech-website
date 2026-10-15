# JSON-Schemas

Alle Inhalte lassen sich auf zwei Wegen ergänzen:

1. **Dauerhaft im Code:** in `content/<modul>.js` eintragen (Seed-Inhalte).
2. **Per Import:** JSON unter **Import** einfügen (wird im Lernstand gespeichert
   und ist in der Sicherung enthalten). Fehlende `id`s vergibt die App selbst;
   importierte Inhalte sind als „ungeprüft“ markiert.

Am Ende dieser Datei steht ein [fertiger Prompt](#prompt-für-claude) zum
Erzeugen neuer Inhalte. Die App erzeugt unter **Import → 1. Prompt für Claude**
dieselben Prompts automatisch passend zu Thema/Deck und Anzahl.

## Import-Format (Umschlag)

```json
{
  "schema": "deutsch-c2-import-1",
  "grammatik":  { "topics": [ … ], "items": [ … ] },
  "wortschatz": { "decks":  [ … ], "cards": [ … ] },
  "schreiben":  { "tasks":  [ … ] },
  "fragen":     [ … ]
}
```

Alle Teile sind optional. Ebenfalls erkannt werden Kurzformen wie
`{ "items": [...] }`, `{ "cards": [...] }`, `{ "tasks": [...] }`,
`{ "fragen": [...] }` oder ein reines Array. Eine komplette Claude-Antwort mit
` ```json `-Block kann direkt eingefügt werden. Bei Fehlern wird nichts
importiert; jede Meldung nennt die Stelle (z. B. `grammatik.items[3]`).

## Grammatik

Datei: `content/grammatik.js` → `window.DATA.grammatik = { topics: [...], items: [...] }`

### Thema

```json
{ "id": "konj1", "title": "Konjunktiv I in indirekter Rede", "description": "optional" }
```

| Feld | Typ | Pflicht | Hinweis |
|---|---|---|---|
| `id` | string | ja | eindeutig, nur `a-z0-9-` |
| `title` | string | ja | |
| `description` | string | nein | |

### Aufgabe (Item)

Gemeinsame Felder:

| Feld | Typ | Pflicht | Hinweis |
|---|---|---|---|
| `id` | string | ja | global eindeutig, z. B. `g-konj1-11` |
| `topic` | string | ja | `id` eines Themas |
| `type` | `"gap"` \| `"transform"` \| `"error"` \| `"mc"` | ja | |
| `instruction` | string | nein | Arbeitsanweisung |
| `text` | string | ja | Satz / Frage |
| `explanation` | string | ja | kurze Erklärung, nach dem Antworten sichtbar |
| `status` | `"ungeprüft"` | nein | wird als Etikett angezeigt |
| `prefill` | boolean | nein | Eingabefeld mit `text` vorbelegen (bei `error` automatisch) |

Je nach Typ:

| Typ | Zusatzfelder | Bewertung |
|---|---|---|
| `gap` | `text` enthält genau eine Lücke `___`; `answers: string[]` | automatisch, Override „Ich lag doch richtig“ |
| `transform` | `answers: string[]` (alle akzeptierten Lösungen) | automatisch; sonst Selbstbewertung „Ich lag richtig / falsch“ |
| `error` | `text` = fehlerhafter Satz; `answers: string[]` = korrigierte Sätze | wie `transform` |
| `mc` | `options: string[]`, `correct: number` (Index ab 0) | automatisch |

Antwortvergleich: Leerzeichen, Anführungszeichen-Varianten und Satzendezeichen
(`.` `!` `?`) am Ende werden ignoriert. Kommas und Groß-/Kleinschreibung zählen.

Beispiele:

```json
{ "id": "g-konj1-11", "topic": "konj1", "type": "gap",
  "instruction": "Setzen Sie das Verb im Konjunktiv I ein (können).",
  "text": "Der Sprecher sagte, man ___ noch keine Angaben machen.",
  "answers": ["könne"],
  "explanation": "3. Person Singular Konjunktiv I von „können“: könne." }

{ "id": "g-passiv-11", "topic": "passiv", "type": "mc",
  "text": "Der Fehler ___ sich leicht beheben.",
  "options": ["lässt", "wird", "ist", "hat"], "correct": 0,
  "explanation": "sich lassen + Infinitiv = kann … werden." }
```

## Wortschatz

Datei: `content/wortschatz.js` → `window.DATA.wortschatz = { decks: [...], cards: [...] }`

### Deck

```json
{ "id": "redewendungen", "title": "Redewendungen", "description": "optional" }
```

### Karte

| Feld | Typ | Pflicht | Hinweis |
|---|---|---|---|
| `id` | string | ja | global eindeutig, z. B. `w-rw-16` |
| `deck` | string | ja | `id` eines Decks |
| `term` | string | ja | deutscher Begriff/Ausdruck in Grundform, Nomen mit Artikel |
| `meaning` | string | ja | deutsche Definition – darf den Begriff selbst nicht enthalten (wird bei „Produzieren“ als Frage gezeigt) |
| `meaningEn` | string | nein | englische Entsprechung (nur auf der Rückseite) |
| `example` | string | nein | Beispielsatz; `[[…]]` markiert die Lücke für den Lückensatz in der Form, wie sie im Satz steht |
| `register` | `"neutral"` \| `"gehoben"` \| `"umgangssprachlich"` \| `"fachsprachlich"` | nein | Standard: neutral |
| `collocations` | string[] | nein | |
| `tags` | string[] | nein | |
| `status` | `"ungeprüft"` | nein | |

Aus jeder Karte entstehen bis zu drei Lernkarten:

| Richtung | Vorderseite | Freischaltung |
|---|---|---|
| Erkennen | Begriff | sofort (zählt zum Tageslimit für neue Karten) |
| Lückensatz | Beispielsatz mit Lücke + Bedeutung | frühestens am Tag nach „Erkennen“; nur mit Beispielsatz |
| Produzieren | Bedeutung → Begriff eintippen (optional) | frühestens am Tag nach dem Lückensatz |

Bewertung: Nochmal (SM-2-Qualität 1) · Schwer (3) · Gut (4) · Leicht (5).
„Nochmal“ wiederholt die Karte am Ende der Runde.

Beispiel:

```json
{ "id": "w-geh-16", "deck": "gehoben", "term": "die Causa",
  "meaning": "Angelegenheit, (Streit-)Fall – oft in der Presse für einen Skandal",
  "meaningEn": "case, affair",
  "example": "Die [[Causa]] beschäftigt den Untersuchungsausschuss seit Monaten.",
  "register": "gehoben", "collocations": ["die Causa X"], "tags": ["Presse"] }
```

Eigene Karten (Editor) und Korrekturen an mitgelieferten Karten werden im
Lernstand gespeichert (`content.wortschatz.cards` / `.overrides`) und sind im
Export enthalten.

## Schreiben

Datei: `content/schreiben.js` → `window.DATA.schreiben = { types: [...], tasks: [...] }`

### Textsorte (Typ)

```json
{ "id": "eroerterung", "title": "Erörterung", "description": "optional" }
```

### Aufgabe

| Feld | Typ | Pflicht | Hinweis |
|---|---|---|---|
| `id` | string | ja | eindeutig, z. B. `s-er-04` |
| `type` | string | ja | `id` einer Textsorte |
| `title` | string | ja | |
| `prompt` | string | ja | Aufgabenstellung (Zeilenumbrüche mit `\n`) |
| `source` | string | nein | Ausgangstext, v. a. für Umformulierungen |
| `words` | [number, number] | ja | Zielumfang min/max |
| `minutes` | number | ja | Bearbeitungszeit |
| `status` | `"ungeprüft"` | nein | |

### Feedback-JSON von Claude (fest vorgegeben)

Der Prompt „Für Claude kopieren“ verlangt am Ende der Antwort genau einen
` ```json `-Block in diesem Format:

```json
{
  "schema": "deutsch-c2-schreiben-1",
  "bewertung": {
    "aufgabenerfuellung": 3, "kohaerenz": 3.5, "wortschatz": 3, "strukturen": 4,
    "prozent": 68,
    "niveau": "C1"
  },
  "fehler": [
    {
      "kategorie": "Grammatik",
      "original": "Wegen dem Fachkräftemangel",
      "korrektur": "Wegen des Fachkräftemangels",
      "satz": "Wegen dem Fachkräftemangel sollten Firmen flexibel sein.",
      "satzKorrigiert": "Wegen des Fachkräftemangels sollten Firmen flexibel sein.",
      "erklaerung": "„wegen“ verlangt schriftsprachlich den Genitiv.",
      "regel": "Präposition wegen + Genitiv"
    }
  ]
}
```

| Feld | Pflicht | Hinweis |
|---|---|---|
| `bewertung.aufgabenerfuellung` / `kohaerenz` / `wortschatz` / `strukturen` | ja | 0–5 (Dezimalzahlen erlaubt) |
| `bewertung.prozent` | ja | 0–100; zählt als Ergebnis des Textes für die Beherrschung |
| `bewertung.niveau` | nein | „C2“, „C1“, „B2“, „unter B2“ |
| `fehler[].kategorie` | ja | Grammatik, Wortschatz, Register, Stil, Kohärenz, Rechtschreibung/Zeichensetzung (ähnliche Schreibweisen werden zugeordnet) |
| `fehler[].original` | ja | exaktes Zitat – wird im Text markiert |
| `fehler[].korrektur` | ja | |
| `fehler[].satz` / `satzKorrigiert` | nein | ganze Sätze → werden zur Grammatik-Korrekturaufgabe |
| `fehler[].erklaerung` | nein | |
| `fehler[].regel` | nein | kurzer Regelname; gruppiert wiederkehrende Fehler in der Statistik |

Aus einem Fehler erzeugte Grammatikaufgaben landen im Thema
`eigene-fehler` („Fehler aus meinen Texten“), Wortschatzkarten im Deck
`aus-texten` („Aus meinen Texten“).

## Verständnisfragen (Lesen und Hören)

Wird über „Fragen bei Claude anfordern“ im Artikel bzw. Hörtext erzeugt oder
unter **Import** einem Artikel/Hörtext zugeordnet. Neue Fragen ersetzen die
bisherigen.

```json
{
  "schema": "deutsch-c2-fragen-1",
  "fragen": [
    { "typ": "mc", "frage": "Worauf stützen sich die Befürworter?",
      "optionen": ["Umfragen", "Pilotprojekte", "Gesetze", "Auslandsstudien"],
      "loesung": 1, "erklaerung": "…", "beleg": "verweisen auf Pilotprojekte" },
    { "typ": "richtigfalsch", "aussage": "Der Bundestag hat bereits entschieden.",
      "loesung": "falsch", "erklaerung": "…", "beleg": "…" },
    { "typ": "offen", "frage": "Welche Haltung nimmt der Autor ein?",
      "musterantwort": "…", "erklaerung": "…" }
  ]
}
```

| Typ | Pflichtfelder | Bewertung |
|---|---|---|
| `mc` | `frage`, `optionen` (≥ 2), `loesung` (Index ab 0; auch „B“ oder der Optionstext werden erkannt) | automatisch |
| `richtigfalsch` | `aussage`, `loesung`: `"richtig"` \| `"falsch"` \| `"nicht im Text"` | automatisch |
| `offen` | `frage`, `musterantwort` | Selbstbewertung: richtig (1) / teilweise (0,5) / falsch (0) |

`erklaerung` und `beleg` (wörtliches Kurzzitat) sind optional und werden nach
dem Antworten angezeigt.

Beherrschung: Lesen hat die Themen *Detailverständnis (mc)*,
*Richtig/Falsch/Nicht im Text (rf)* und *Globalverständnis (offen)*; Hören hat
*Diktat*, *Lückentext* und *Verständnisfragen*. Es gilt die Standardregel
(≥ 90 % über die letzten 30 Antworten an ≥ 3 Tagen); Diktat und Lückentext
zählen mit ihrem Prozentwert.

## Lesen und Hören (gespeicherte Daten)

Artikel (`reading.articles[]`): `id`, `title`, `source`, `url`, `text`,
`questions`, `runs` (Ergebnisse), `saved` (gespeicherte Begriffe).

Hörtexte (`listening.entries[]`): `id`, `title`, `source`, `url` *oder*
`fileName`, `transcript`, `segments` (angepasste Zeitbereiche je Abschnitt),
`questions`, `runs`. Lokale Audiodateien liegen in IndexedDB und sind **nicht**
Teil der JSON-Sicherung – nach einem Import auf einem anderen Gerät fragt die
App nach der Datei.

## Prompt für Claude

Diesen Prompt in einen Claude-Chat kopieren und die Platzhalter in
`<…>` ersetzen. Die Antwort (oder nur ihren JSON-Block) unter **Import**
einfügen.

````text
Erstelle Lernmaterial für eine Deutsch-Lern-App (Niveau C1 → C2, Orientierung:
Goethe-Zertifikat C2: Großes Deutsches Sprachdiplom).

Gewünscht: <Anzahl> <Grammatikaufgaben zum Thema „…“ (Themen-ID: …) |
Wortschatzkarten für das Deck „…“ (Deck-ID: …) | Schreibaufgaben der Textsorte …>
Zusätzlicher Wunsch: <optional, z. B. Schwerpunkt Wirtschaftsdeutsch>

Qualitätsregeln:
- Authentische, anspruchsvolle Sprache aus Presse, Wissenschaft und Verwaltung.
- Grammatik: Typen "gap" (genau eine Lücke ___), "transform", "error" (ein Satz
  mit genau einem Fehler) und "mc" (4 Optionen) mischen; bei "transform" und
  "error" alle gängigen korrekten Varianten in "answers" aufnehmen;
  "explanation" in 1–2 Sätzen.
- Wortschatz: "term" in der Grundform (Nomen mit Artikel); "meaning" ist eine
  deutsche Definition, die den Begriff selbst NICHT enthält; im "example" die
  Stelle mit dem Begriff mit [[…]] markieren; "register" ist "neutral",
  "gehoben", "umgangssprachlich" oder "fachsprachlich"; 1–3 Kollokationen.
- Schreibaufgaben: "type" ist "eroerterung", "kommentar", "umformulierung" oder
  "brief"; Umformulierungen brauchen einen Ausgangstext in "source".
- Keine "id"-Felder – die App vergibt IDs.
- Neue Themen bzw. Decks unter "topics" bzw. "decks" definieren
  (id: nur a–z, 0–9 und „-“).

Antworte ausschließlich mit einem einzigen ```json-Codeblock in diesem Format
(nur die benötigten Teile):

{
  "schema": "deutsch-c2-import-1",
  "grammatik": {
    "topics": [{ "id": "themen-id", "title": "Titel" }],
    "items": [
      { "topic": "themen-id", "type": "gap", "instruction": "…",
        "text": "Satz mit ___ .", "answers": ["…"], "explanation": "…" },
      { "topic": "themen-id", "type": "mc", "text": "…",
        "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "…" }
    ]
  },
  "wortschatz": {
    "decks": [{ "id": "deck-id", "title": "Titel" }],
    "cards": [
      { "deck": "deck-id", "term": "…", "meaning": "…", "meaningEn": "…",
        "example": "… [[…]] …", "register": "gehoben",
        "collocations": ["…"], "tags": ["…"] }
    ]
  },
  "schreiben": {
    "tasks": [
      { "type": "kommentar", "title": "…", "prompt": "…",
        "words": [300, 400], "minutes": 60 }
    ]
  }
}
````
