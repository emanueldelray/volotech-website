# JSON-Schemas

> Stand Phase 1: Grammatik. Wortschatz-Karten und Lese-/Hörfragen sowie der
> fertige Claude-Prompt für die Inhaltserstellung folgen in Phase 4 zusammen mit
> dem Bildschirm „Inhalte importieren“.

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
