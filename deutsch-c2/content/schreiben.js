/*
 * Inhalte: Schreiben (Aufgabenbibliothek)
 * ------------------------------------------------------------------
 * types = Textsorten (= Themen für Fokus/Beherrschung)
 * tasks = Aufgaben. Felder siehe SCHEMAS.md.
 *   source: Ausgangstext (nur bei Umformulierung)
 *   words:  [min, max] Zielumfang
 *   minutes: Bearbeitungszeit
 *
 * Die Aufgaben sind C2-typisch, aber keine Original-Prüfungsaufgaben.
 */
window.DATA = window.DATA || {};

window.DATA.schreiben = {
  types: [
    { id: 'eroerterung', title: 'Erörterung', description: 'Argumentativer Text: Positionen abwägen und begründet Stellung beziehen.' },
    { id: 'kommentar', title: 'Kommentar', description: 'Meinungsbetonter Pressetext mit klarer These und rhetorischen Mitteln.' },
    { id: 'umformulierung', title: 'Umformulierung in anderes Register', description: 'Einen Ausgangstext für andere Adressaten und eine andere Stilebene neu schreiben.' },
    { id: 'brief', title: 'Formeller Brief', description: 'Geschäfts- und Behördenkorrespondenz: Anliegen präzise, höflich und verbindlich formulieren.' }
  ],

  tasks: [
    /* ---------------- Erörterung ---------------- */
    { id: 's-er-01', type: 'eroerterung', title: 'Rechtsanspruch auf Homeoffice',
      prompt: 'Sollte der Gesetzgeber Beschäftigten einen Rechtsanspruch auf Arbeit im Homeoffice einräumen, sofern die Tätigkeit dies zulässt?\n\nErörtern Sie die Frage. Gehen Sie dabei auf folgende Aspekte ein:\n• Produktivität und Zusammenarbeit im Team\n• Gerechtigkeit zwischen Berufsgruppen, die zu Hause arbeiten können, und solchen, die es nicht können\n• Folgen für Innenstädte, Verkehr und Wohnungsmarkt\n\nWägen Sie Argumente ab und beziehen Sie am Ende begründet Stellung.',
      words: [350, 450], minutes: 70, status: 'ungeprüft' },
    { id: 's-er-02', type: 'eroerterung', title: 'Generative KI in Schule und Studium',
      prompt: 'Sollten Schulen und Hochschulen den Einsatz generativer KI bei Hausarbeiten und Prüfungen grundsätzlich erlauben?\n\nErörtern Sie die Frage unter Berücksichtigung folgender Punkte:\n• Erwerb grundlegender Kompetenzen (Schreiben, Argumentieren, Recherchieren)\n• Chancengleichheit\n• Wie Prüfungen in Zukunft aussehen sollten\n\nKommen Sie zu einem begründeten eigenen Urteil.',
      words: [350, 450], minutes: 70, status: 'ungeprüft' },
    { id: 's-er-03', type: 'eroerterung', title: 'Verpflichtendes Gesellschaftsjahr',
      prompt: 'In der politischen Debatte wird immer wieder ein verpflichtendes Gesellschaftsjahr für alle Schulabgängerinnen und Schulabgänger gefordert – etwa in Pflege, Katastrophenschutz oder Bundeswehr.\n\nErörtern Sie diesen Vorschlag. Berücksichtigen Sie:\n• gesellschaftlichen Zusammenhalt und Solidarität\n• den Eingriff in die persönliche Freiheit und Lebensplanung junger Menschen\n• den Personalmangel in sozialen Einrichtungen\n\nBeziehen Sie abschließend begründet Stellung.',
      words: [350, 450], minutes: 70, status: 'ungeprüft' },

    /* ---------------- Kommentar ---------------- */
    { id: 's-ko-01', type: 'kommentar', title: 'Autofreie Innenstadt',
      prompt: 'Der Stadtrat Ihrer Stadt erwägt, die Innenstadt ab 2028 weitgehend für private Pkw zu sperren. Einzelhandel und Teile der Bevölkerung protestieren.\n\nSchreiben Sie für die Meinungsseite der Lokalzeitung einen Kommentar. Vertreten Sie eine klare Position, setzen Sie sich mit dem stärksten Gegenargument auseinander und nutzen Sie gezielt sprachliche Mittel (z. B. pointierter Einstieg, rhetorische Fragen, prägnanter Schluss).',
      words: [300, 400], minutes: 60, status: 'ungeprüft' },
    { id: 's-ko-02', type: 'kommentar', title: 'Viertagewoche bei vollem Lohn',
      prompt: 'Eine große Gewerkschaft fordert die Viertagewoche bei vollem Lohnausgleich. Arbeitgeberverbände warnen vor Wettbewerbsnachteilen und verschärftem Fachkräftemangel.\n\nVerfassen Sie einen Kommentar für eine überregionale Tageszeitung. Ihre Haltung soll eindeutig erkennbar sein; argumentieren Sie zugespitzt, aber sachlich fundiert.',
      words: [300, 400], minutes: 60, status: 'ungeprüft' },
    { id: 's-ko-03', type: 'kommentar', title: 'Freier Eintritt in Museen',
      prompt: 'Mehrere Bundesländer diskutieren, den Eintritt in staatliche Museen dauerhaft kostenlos zu machen. Kritiker verweisen auf leere Kassen und bezweifeln, dass dadurch neue Besuchergruppen erreicht werden.\n\nSchreiben Sie einen Kommentar für das Feuilleton einer Wochenzeitung.',
      words: [300, 400], minutes: 60, status: 'ungeprüft' },

    /* ---------------- Umformulierung ---------------- */
    { id: 's-um-01', type: 'umformulierung', title: 'Kollegen-Mail → Mitteilung an die Geschäftsleitung',
      prompt: 'Sie haben die folgende E-Mail eines Kollegen erhalten. Formulieren Sie den Inhalt als sachliche, formelle Mitteilung an die Geschäftsleitung um. Alle Informationen müssen erhalten bleiben; Umgangssprache, Übertreibungen und persönliche Bewertungen sind in neutrale Formulierungen zu überführen.',
      source: 'Hi, kurz zur Info: Das mit dem neuen Buchungssystem ist echt ein Desaster. Seit Montag stürzt das Ding andauernd ab, und keiner weiß, woran’s liegt. Die Kunden rufen ständig an und sind total sauer, weil ihre Buchungen weg sind – gestern waren’s mindestens 40 Anrufe! Der Dienstleister meldet sich einfach nicht, obwohl wir dem schon dreimal geschrieben haben. Ich find, wir sollten das alte System erst mal wieder anschmeißen, bis die das hinkriegen. Sonst laufen uns die Leute weg. Kann das mal jemand von oben entscheiden? Bis Freitag muss da echt was passieren. Gruß, Jonas',
      words: [120, 200], minutes: 30, status: 'ungeprüft' },
    { id: 's-um-02', type: 'umformulierung', title: 'Behördenbescheid → Erklärung für einen Freund',
      prompt: 'Ein Freund hat den folgenden Auszug aus einem Bescheid erhalten und versteht ihn nicht. Erklären Sie ihm den Inhalt in einer persönlichen E-Mail in verständlicher, informeller (aber korrekter) Sprache. Der Inhalt muss vollständig und richtig wiedergegeben werden.',
      source: 'Ihrem Antrag auf Gewährung von Wohngeld vom 12.03. kann nach Prüfung der eingereichten Unterlagen derzeit nicht entsprochen werden, da die Nachweise über das Einkommen der im Haushalt lebenden Personen unvollständig sind. Es wird Ihnen hiermit Gelegenheit gegeben, die fehlenden Unterlagen, insbesondere die Lohnabrechnungen der letzten drei Monate, binnen einer Frist von vier Wochen ab Zugang dieses Schreibens nachzureichen. Sollten die Unterlagen nicht fristgerecht eingehen, ist der Antrag wegen fehlender Mitwirkung abzulehnen. Gegen diesen Bescheid kann innerhalb eines Monats nach Bekanntgabe Widerspruch erhoben werden.',
      words: [150, 230], minutes: 30, status: 'ungeprüft' },
    { id: 's-um-03', type: 'umformulierung', title: 'Forumsbeitrag → sachlicher Zeitungsbericht',
      prompt: 'Formulieren Sie den folgenden Erfahrungsbericht aus einem Internetforum als sachlichen Bericht für die Lokalseite einer Zeitung um (dritte Person, neutraler Ton, Nominalstil wo sinnvoll, keine Wertungen).',
      source: 'Leute, ich muss das jetzt einfach mal loswerden. Am Samstag war ja das große Stadtfest, und ich sag euch: Chaos pur! Um acht Uhr abends ist auf dem Marktplatz plötzlich der Strom ausgefallen, mitten im Konzert. Alles stockdunkel, die Leute haben geschrien, ein paar sind sogar über die Absperrungen geklettert. Hat bestimmt eine halbe Stunde gedauert, bis die Feuerwehr da war und Notlicht aufgestellt hat. Zum Glück ist niemand ernsthaft verletzt worden, nur zwei, drei Leute sind umgeknickt. Die Stadt sagt jetzt, ein Kabel sei überlastet gewesen. Ganz ehrlich: Bei so vielen Besuchern hätte man das doch vorher checken müssen!',
      words: [150, 220], minutes: 30, status: 'ungeprüft' },

    /* ---------------- Formeller Brief ---------------- */
    { id: 's-br-01', type: 'brief', title: 'Beschwerde an die Hausverwaltung',
      prompt: 'In Ihrer Mietwohnung ist die Heizung seit drei Wochen nur eingeschränkt funktionsfähig; eine Reparatur vor zehn Tagen hat das Problem nicht behoben. Schreiben Sie an die Hausverwaltung.\n\nIhr Brief soll:\n• den Sachverhalt und den bisherigen Verlauf präzise schildern\n• eine angemessene Frist zur Behebung setzen\n• auf mögliche rechtliche Konsequenzen (Mietminderung) hinweisen, ohne unhöflich zu werden\n• um eine schriftliche Bestätigung bitten',
      words: [250, 350], minutes: 45, status: 'ungeprüft' },
    { id: 's-br-02', type: 'brief', title: 'Anerkennung von Studienleistungen',
      prompt: 'Sie möchten an einer deutschen Universität einen Masterstudiengang aufnehmen und haben im Ausland bereits Studienleistungen erbracht. Schreiben Sie an das Prüfungsamt.\n\nIhr Brief soll:\n• Ihr Anliegen und Ihre Ausgangssituation klar darstellen\n• konkrete Fragen zum Verfahren und zu benötigten Unterlagen stellen\n• nach Fristen und Ansprechpersonen fragen\n• einen angemessenen Abschluss finden',
      words: [250, 350], minutes: 45, status: 'ungeprüft' },
    { id: 's-br-03', type: 'brief', title: 'Förderantrag an das Kulturamt',
      prompt: 'Sie planen mit einem Verein eine Lesereihe mit Autorinnen und Autoren aus Osteuropa und möchten beim Kulturamt Ihrer Stadt eine Förderung beantragen. Schreiben Sie ein formelles Anschreiben zu Ihrem Antrag.\n\nGehen Sie ein auf:\n• Ziel und Zielgruppe des Projekts\n• Ablauf und Zeitraum\n• die beantragte Summe und deren Verwendung\n• den Nutzen für die Stadt',
      words: [250, 350], minutes: 45, status: 'ungeprüft' }
  ]
};
