// src/pages/ImpressumPage.jsx
import React from "react";

export default function ImpressumPage({ lang = "de" }) {
  const isDe = lang === "de";

  return (
    <div className="section-wrap" style={{ paddingTop: "3rem", paddingBottom: "4rem", maxWidth: "48rem" }}>
      <h1>{isDe ? "Impressum" : "Legal Notice"}</h1>

      <p style={{ color: "var(--muted)", marginTop: "0.5rem", marginBottom: "2rem" }}>
        {isDe ? "Angaben gemäß § 5 TMG" : "Information pursuant to § 5 TMG"}
      </p>

      <Section title={isDe ? "Diensteanbieter" : "Service Provider"}>
        <p>Emanuel Chitic</p>
        <p>Volotech</p>
        <p>86368 Gersthofen</p>
        <p>{isDe ? "Deutschland" : "Germany"}</p>
      </Section>

      <Section title={isDe ? "Kontakt" : "Contact"}>
        <p>
          {isDe ? "Telefon" : "Phone"}:{" "}
          <a href="tel:+491726518119" style={{ color: "var(--brand)" }}>+49 172 6518119</a>
        </p>
        <p>
          E-Mail:{" "}
          <a href="mailto:emanuel.chitic@volotech.de" style={{ color: "var(--brand)" }}>
            emanuel.chitic@volotech.de
          </a>
        </p>
      </Section>

      <Section title={isDe ? "Umsatzsteuer-ID" : "VAT ID"}>
        <p>
          {isDe
            ? "Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG wird bei Bedarf nachgereicht."
            : "VAT identification number pursuant to § 27a UStG will be provided upon request."}
        </p>
      </Section>

      <Section title={isDe ? "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV" : "Responsible for content pursuant to § 18 (2) MStV"}>
        <p>Emanuel Chitic</p>
        <p>86368 Gersthofen</p>
        <p>{isDe ? "Deutschland" : "Germany"}</p>
      </Section>

      <Section title={isDe ? "Haftung für Inhalte" : "Liability for content"}>
        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
          {isDe
            ? "Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen."
            : "As a service provider, we are responsible for our own content on these pages in accordance with general legislation pursuant to § 7 (1) TMG. According to §§ 8 to 10 TMG, however, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity. Obligations to remove or block the use of information under general law remain unaffected. However, liability in this regard is only possible from the point in time at which a concrete legal infringement becomes known. If we become aware of any such legal infringements, we will remove the relevant content immediately."}
        </p>
      </Section>

      <Section title={isDe ? "Haftung für Links" : "Liability for links"}>
        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
          {isDe
            ? "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen."
            : "Our website contains links to external third-party websites over whose content we have no influence. Therefore, we cannot accept any liability for this external content. The respective provider or operator of the linked pages is always responsible for their content. The linked pages were checked for possible legal violations at the time of linking. Illegal content was not recognizable at the time of linking. However, permanent monitoring of the content of linked pages is not reasonable without concrete evidence of a legal violation. If we become aware of any legal infringements, we will remove such links immediately."}
        </p>
      </Section>

      <Section title={isDe ? "Urheberrecht" : "Copyright"}>
        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
          {isDe
            ? "Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet."
            : "The content and works created by the site operator on these pages are subject to German copyright law. Duplication, processing, distribution, and any form of commercialization of such material beyond the scope of copyright law require the written consent of its respective author or creator. Downloads and copies of this site are only permitted for private, non-commercial use."}
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <h3 style={{ marginBottom: "0.5rem", color: "var(--ink)" }}>{title}</h3>
      {children}
    </div>
  );
}
