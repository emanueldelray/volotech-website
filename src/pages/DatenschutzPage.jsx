// src/pages/DatenschutzPage.jsx
import React from "react";

export default function DatenschutzPage({ lang = "de" }) {
  const isDe = lang === "de";

  return (
    <div className="section-wrap" style={{ paddingTop: "3rem", paddingBottom: "4rem", maxWidth: "48rem" }}>
      <h1>{isDe ? "Datenschutzerklärung" : "Privacy Policy"}</h1>

      <p style={{ color: "var(--muted)", marginTop: "0.5rem", marginBottom: "2rem" }}>
        {isDe ? "Stand: Februar 2026" : "Last updated: February 2026"}
      </p>

      <Section title={isDe ? "1. Verantwortlicher" : "1. Data Controller"}>
        <p style={prose}>
          {isDe ? "Verantwortlich im Sinne der DSGVO:" : "Responsible within the meaning of the GDPR:"}
        </p>
        <p>Emanuel Chitic</p>
        <p>Volotech</p>
        <p>86368 Gersthofen, {isDe ? "Deutschland" : "Germany"}</p>
        <p>
          E-Mail:{" "}
          <a href="mailto:emanuel.chitic@volotech.de" style={{ color: "var(--brand)" }}>
            emanuel.chitic@volotech.de
          </a>
        </p>
        <p>
          {isDe ? "Telefon" : "Phone"}:{" "}
          <a href="tel:+491726518119" style={{ color: "var(--brand)" }}>+49 172 6518119</a>
        </p>
      </Section>

      <Section title={isDe ? "2. Allgemeine Hinweise zur Datenverarbeitung" : "2. General information on data processing"}>
        <p style={prose}>
          {isDe
            ? "Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung. Die Nutzung unserer Website ist in der Regel ohne Angabe personenbezogener Daten möglich."
            : "We take the protection of your personal data very seriously. We treat your personal data confidentially and in accordance with the statutory data protection regulations and this privacy policy. The use of our website is generally possible without providing personal data."}
        </p>
      </Section>

      <Section title={isDe ? "3. Hosting" : "3. Hosting"}>
        <p style={prose}>
          {isDe
            ? "Diese Website wird bei Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, USA) gehostet. Beim Besuch unserer Website erfasst Vercel automatisch technische Zugriffsdaten (Server-Logfiles), darunter: IP-Adresse, Browsertyp und -version, Betriebssystem, Referrer-URL, aufgerufene Seite, Datum und Uhrzeit des Zugriffs. Diese Daten werden zur Sicherstellung eines störungsfreien Betriebs der Website verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)."
            : "This website is hosted by Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, USA). When you visit our website, Vercel automatically collects technical access data (server log files), including: IP address, browser type and version, operating system, referrer URL, page visited, date and time of access. This data is processed to ensure the smooth operation of the website. The legal basis is Art. 6(1)(f) GDPR (legitimate interest)."}
        </p>
        <p style={{ ...prose, marginTop: "0.75rem" }}>
          {isDe
            ? "Da Vercel ihren Sitz in den USA hat, kann eine Übermittlung personenbezogener Daten in die USA stattfinden. Vercel ist unter dem EU-U.S. Data Privacy Framework zertifiziert, was ein angemessenes Datenschutzniveau gewährleistet."
            : "As Vercel is based in the USA, personal data may be transferred to the USA. Vercel is certified under the EU-U.S. Data Privacy Framework, which ensures an adequate level of data protection."}
        </p>
      </Section>

      <Section title={isDe ? "4. Kontaktaufnahme per E-Mail" : "4. Contact via email"}>
        <p style={prose}>
          {isDe
            ? "Wenn Sie uns per E-Mail kontaktieren, werden Ihre Angaben (Name, E-Mail-Adresse, Nachrichteninhalt, ggf. Telefonnummer und angehängte Dateien) zum Zweck der Bearbeitung Ihrer Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bearbeitung der Anfrage)."
            : "When you contact us by email, your details (name, email address, message content, phone number if applicable, and attached files) are stored for the purpose of processing your inquiry and in case of follow-up questions. We will not share this data without your consent. Processing is based on Art. 6(1)(b) GDPR (pre-contractual measures) or Art. 6(1)(f) GDPR (legitimate interest in processing the inquiry)."}
        </p>
        <p style={{ ...prose, marginTop: "0.75rem" }}>
          {isDe
            ? "Die von Ihnen übermittelten Daten verbleiben bei uns, bis der Zweck für die Datenverarbeitung entfällt (z. B. nach abgeschlossener Bearbeitung Ihrer Anfrage) oder Sie uns zur Löschung auffordern. Zwingende gesetzliche Aufbewahrungsfristen bleiben unberührt."
            : "The data you submit remains with us until the purpose for data processing ceases (e.g. after your inquiry has been fully processed) or you request deletion. Mandatory statutory retention periods remain unaffected."}
        </p>
      </Section>

      <Section title={isDe ? "5. Cookies" : "5. Cookies"}>
        <p style={prose}>
          {isDe
            ? "Diese Website verwendet keine eigenen Cookies und setzt keine Tracking-Tools ein. Es werden keine Analyse- oder Marketing-Cookies gesetzt. Technisch notwendige Cookies, die durch den Hosting-Anbieter (Vercel) gesetzt werden können, dienen ausschließlich dem Betrieb der Website."
            : "This website does not use its own cookies and does not employ any tracking tools. No analytics or marketing cookies are set. Technically necessary cookies that may be set by the hosting provider (Vercel) serve exclusively for the operation of the website."}
        </p>
      </Section>

      <Section title={isDe ? "6. Ihre Rechte" : "6. Your rights"}>
        <p style={prose}>
          {isDe
            ? "Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf:"
            : "Within the framework of applicable legislation, you have the right at any time to:"}
        </p>
        <ul style={{ color: "var(--muted)", paddingLeft: "1.1rem", lineHeight: 1.8, marginTop: "0.5rem" }}>
          <li>{isDe ? "Auskunft über Ihre bei uns gespeicherten Daten (Art. 15 DSGVO)" : "Information about your data stored with us (Art. 15 GDPR)"}</li>
          <li>{isDe ? "Berichtigung unrichtiger personenbezogener Daten (Art. 16 DSGVO)" : "Rectification of inaccurate personal data (Art. 16 GDPR)"}</li>
          <li>{isDe ? "Löschung Ihrer bei uns gespeicherten Daten (Art. 17 DSGVO)" : "Erasure of your data stored with us (Art. 17 GDPR)"}</li>
          <li>{isDe ? "Einschränkung der Datenverarbeitung (Art. 18 DSGVO)" : "Restriction of data processing (Art. 18 GDPR)"}</li>
          <li>{isDe ? "Datenübertragbarkeit (Art. 20 DSGVO)" : "Data portability (Art. 20 GDPR)"}</li>
          <li>{isDe ? "Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)" : "Objection to processing (Art. 21 GDPR)"}</li>
        </ul>
        <p style={{ ...prose, marginTop: "0.75rem" }}>
          {isDe
            ? "Zur Ausübung Ihrer Rechte genügt eine E-Mail an emanuel.chitic@volotech.de."
            : "To exercise your rights, simply send an email to emanuel.chitic@volotech.de."}
        </p>
      </Section>

      <Section title={isDe ? "7. Beschwerderecht bei einer Aufsichtsbehörde" : "7. Right to lodge a complaint"}>
        <p style={prose}>
          {isDe
            ? "Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt, haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Die für uns zuständige Aufsichtsbehörde ist:"
            : "If you believe that the processing of your personal data violates the GDPR, you have the right to lodge a complaint with a supervisory authority. The supervisory authority responsible for us is:"}
        </p>
        <p style={{ marginTop: "0.5rem" }}>
          Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)<br />
          Promenade 18, 91522 Ansbach<br />
          {isDe ? "Deutschland" : "Germany"}<br />
          <a href="https://www.lda.bayern.de" style={{ color: "var(--brand)" }} target="_blank" rel="noopener noreferrer">
            www.lda.bayern.de
          </a>
        </p>
      </Section>

      <Section title={isDe ? "8. SSL-/TLS-Verschlüsselung" : "8. SSL/TLS encryption"}>
        <p style={prose}>
          {isDe
            ? "Diese Seite nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an dem Schloss-Symbol in Ihrer Browserzeile und daran, dass die Adresszeile mit https beginnt."
            : "For security reasons, this site uses SSL/TLS encryption. You can recognize an encrypted connection by the lock icon in your browser bar and the address starting with https."}
        </p>
      </Section>
    </div>
  );
}

const prose = { color: "var(--muted)", lineHeight: 1.7 };

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <h3 style={{ marginBottom: "0.5rem", color: "var(--ink)" }}>{title}</h3>
      {children}
    </div>
  );
}
