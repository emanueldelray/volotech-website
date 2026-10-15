# Deutsch C2 – Lern-App (C1 → C2, Goethe-Zertifikat C2 GDS)

Lokale Lern-App ohne Framework, Build-Schritt oder Backend. Öffnen Sie einfach
`index.html` im Browser (auch per `file://`).

## Stand

| Phase | Inhalt | Status |
|---|---|---|
| 1 | App-Shell, Dashboard, Fokus/Beherrschung, Wiederholung (SM-2), Sicherung, **Grammatik** | ✅ |
| 2 | **Wortschatz** mit Spaced Repetition, Karteneditor | ✅ |
| 3 | **Schreiben** mit Claude-Brücke, Fehlerstatistik, Fehler → Übung | ✅ |
| 4 | **Lesen**, **Hören**, **Inhalte importieren** | ✅ |

## Ordnerstruktur

```
index.html
css/app.css
content/grammatik.js     Inhalte (window.DATA.grammatik) – hier ergänzen
content/wortschatz.js    Decks und Karten (window.DATA.wortschatz)
content/schreiben.js     Textsorten und Schreibaufgaben (window.DATA.schreiben)
js/util.js               Hilfsfunktionen, Antwortvergleich
js/store.js              localStorage, Export/Import
js/srs.js                SM-2-Algorithmus
js/progress.js           Beherrschung, Wiederholungsschlange, Serie, Zeitstatistik
js/timer.js              Zeiterfassung pro Modul/Tag
js/app.js                Modulregister, Navigation, Router
js/ui.js                 gemeinsame UI-Bausteine
js/dashboard.js          Startseite
js/wiederholung.js       täglicher Wartungsblock
js/daten.js              Sicherung & Einstellungen
js/grammatik.js          Modul Grammatik
js/wortschatz.js         Modul Wortschatz (Karteikarten, Editor)
js/schreiben.js          Modul Schreiben (Schreibansicht, Claude-Brücke, Statistik)
js/fragen.js             Verständnisfragen: Prompt, Prüfung, Durchlauf (Lesen + Hören)
js/lesen.js              Modul Lesen (Artikel, Wörter antippen → Karte)
js/hoeren.js             Modul Hören (Player, Diktat, Lückentext, Audio in IndexedDB)
js/import.js             Inhalte importieren + Prompt zum Erzeugen
```

Neue Inhalte: in `content/<modul>.js` eintragen – an der Logik muss nichts geändert
werden. Schema: siehe [SCHEMAS.md](SCHEMAS.md).

## Lernmodell

- **Fokus:** genau ein Modul (Auswahl auf dem Dashboard). Das Dashboard zeigt den
  Fokusanteil der letzten 7 Tage (Ziel ≥ 70 %, einstellbar).
- **Beherrscht:** ≥ 90 % richtig in den letzten 30 Aufgaben eines Themas, verteilt
  auf mindestens 3 verschiedene Tage (also mindestens 27 von 30).
- **Wiederholung:** Items beherrschter Themen kommen in eine SM-2-Schlange
  (gestaffelt ab dem Folgetag). Der tägliche Block ist auf ~10 Minuten begrenzt
  (gemessen an der tatsächlich verbrachten Zeit, einstellbar).
- **Zeiterfassung:** aktive Zeit pro Modul und Tag (Pause nach 90 s ohne Eingabe
  oder bei verstecktem Tab).
- **Wortschatz:** Decks sind die Themen. Während ein Deck gelernt wird, laufen
  seine fälligen Karten im Modul selbst (Lernstapel, max. 20 neue Lernkarten/Tag,
  einstellbar). Ist das Deck beherrscht, erscheinen seine fälligen Karten im
  täglichen Wartungsblock. Tastatur: Leertaste/Enter = aufdecken, 1–4 = bewerten.
- **Schreiben:** Textsorten sind die Themen, ein Text ist ein „Item“ mit dem
  Prozentwert aus Claudes Bewertung. Beherrscht = die letzten 5 Texte einer
  Textsorte im Schnitt ≥ 80 % (an mindestens 3 Tagen). Ablauf: schreiben →
  „Für Claude kopieren“ → in Claude einfügen → Antwort zurück einfügen →
  Auswertung. Fehler lassen sich per Klick in Grammatikaufgaben
  („Fehler aus meinen Texten“) oder Wortschatzkarten umwandeln – diese laufen
  dann über das normale Beherrschungs- und Wiederholungssystem.
- **Lesen:** Artikel einfügen (Titel, Quelle, Text). Wort antippen = auswählen,
  zweites Wort im selben Satz = Auswahl zur Wendung erweitern (oder frei mit der
  Maus markieren) → „Als Karte speichern“ öffnet den Karteneditor mit dem Satz
  als Lückensatz. „Fragen bei Claude anfordern“ kopiert einen Prompt; die
  JSON-Antwort zurück einfügen und die Fragen in der App beantworten.
- **Hören:** Audio per URL oder lokaler Datei (gespeichert in IndexedDB) plus
  Transkript. Player mit 0,75×/1×/1,25× und 5-Sekunden-Rücksprung. Diktat und
  Lückentext arbeiten mit Abschnitten des Transkripts; der Zeitbereich wird aus
  der Textposition geschätzt und lässt sich mit ±1 s anpassen (wird gespeichert).
- **Import:** JSON aus einem Claude-Chat einfügen, prüfen, übernehmen. Der
  passende Erzeugungs-Prompt wird auf derselben Seite erstellt.
- **Serie:** aufeinanderfolgende Tage mit mindestens 1 Minute Lernzeit.

## Daten

Alles liegt in `localStorage` (Schlüssel `deutschC2.state`) – also nur in diesem
Browser, an diesem Speicherort. Unter **Daten** gibt es Export/Import als eine
JSON-Datei; das Datum der letzten Sicherung steht auf dem Dashboard.

Hinweis: Einige Browser trennen den `localStorage` von `file://`-Seiten nach Pfad.
Verschieben Sie den Ordner, vorher exportieren und danach importieren.

### Auf dem Handy

Mobile Browser öffnen lokale HTML-Dateien oft nur eingeschränkt. Bewährte Wege:
- Ordner über einen beliebigen statischen Host bereitstellen (z. B. GitHub Pages,
  privates Repo), oder
- am Rechner `python3 -m http.server` im Ordner starten und im selben WLAN
  `http://<rechner-ip>:8000` öffnen.

Der Lernstand ist pro Gerät/Adresse getrennt – per Export/Import übertragen.

## Seed-Inhalte

Alle mitgelieferten Aufgaben sind als **ungeprüft** markiert. Unter
Grammatik → Thema → „Aufgaben ansehen“ können Sie jede Aufgabe mit Lösung und
Erklärung durchsehen und als geprüft abhaken (auch direkt per Klick auf das
„ungeprüft“-Etikett während des Übens).
