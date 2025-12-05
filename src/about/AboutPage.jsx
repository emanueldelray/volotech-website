// src/pages/AboutPage.jsx
import React from "react";
import { SectionHeader } from "../App"; // re-use the shared SectionHeader

const MID_TEXT = "#4b5563";
const MID_GRAY = "#e5e7eb";
const LIGHT_GRAY = "#f4f6f8";

function AboutPage({ lang = "en" }) {
  const isDe = lang === "de";

  return (
    <main style={{ backgroundColor: LIGHT_GRAY }} className="py-14">
      <div className="max-w-6xl mx-auto px-5">
        <SectionHeader
          title={isDe ? "Über Volotech" : "About Volotech"}
          subtitle={
            isDe
              ? "Ein engineering-geführtes Ein-Mann-Unternehmen mit einem kleinen Netzwerk vertrauenswürdiger Partner."
              : "An engineering-led one-person shop with a small network of trusted partners."
          }
        />

        {/* Intro block */}
        <section className="mt-8 grid lg:grid-cols-[1.4fr,1fr] gap-8 items-start">
          <div
            className="space-y-4 text-sm sm:text-base"
            style={{ color: MID_TEXT }}
          >
            <p>
              {isDe ? (
                <>
                  Volotech wird von <strong>Emanuel Chitic</strong> geführt, einem
                  Maschinenbauingenieur und Projektmanager mit Sitz in Gersthofen
                  (bei Augsburg). Der Fokus liegt auf der Lieferung von{" "}
                  <strong>
                    kundenspezifisch bearbeiteten und gefertigten Komponenten
                  </strong>{" "}
                  für Automatisierung, Intralogistik und Maschinenbau.
                </>
              ) : (
                <>
                  Volotech is run by <strong>Emanuel Chitic</strong>, a mechanical
                  engineer and project manager based in Gersthofen (near Augsburg,
                  Germany). The focus is on supplying{" "}
                  <strong>custom machined and fabricated components</strong> for
                  automation, intralogistics and machine building.
                </>
              )}
            </p>
            <p>
              {isDe ? (
                <>
                  Die Struktur ist bewusst schlank gehalten: Sie arbeiten direkt mit der
                  Person zusammen, die Ihre Zeichnungen, Toleranzen und
                  Projektrestriktionen versteht – nicht mit einer mehrstufigen
                  Vertriebsorganisation. Die Fertigung selbst erfolgt über ein{" "}
                  <strong>
                    kleines Netzwerk ISO-9001-zertifizierter Partner in der EU
                  </strong>
                  .
                </>
              ) : (
                <>
                  The setup is intentionally small: you work directly with the person who
                  understands your drawings, tolerances and project constraints, not a
                  multi-layer sales organisation. Manufacturing itself is carried out by a
                  <strong> small network of ISO 9001 certified partners in the EU</strong>.
                </>
              )}
            </p>
          </div>

          <aside
            className="rounded-xl border bg-white p-5 shadow-sm text-sm"
            style={{ borderColor: MID_GRAY, color: MID_TEXT }}
          >
            <h3 className="font-semibold text-neutral-800">
              {isDe ? "Kurzprofil" : "At a glance"}
            </h3>
            <ul className="mt-3 space-y-1">
              <li>
                •{" "}
                {isDe
                  ? "Maschinenbauingenieur (B.Eng.) mit Industrieerfahrung"
                  : "Mechanical engineer (B.Eng.) with industrial background"}
              </li>
              <li>
                •{" "}
                {isDe
                  ? "10+ Jahre in Fertigung, Instandhaltung & Automatisierung"
                  : "10+ years in manufacturing, maintenance & automation"}
              </li>
              <li>
                •{" "}
                {isDe
                  ? "Erfahrung in KMU, Amazon Operations und BMW Group AG"
                  : "Experience in SMEs, Amazon operations and BMW Group AG"}
              </li>
              <li>
                •{" "}
                {isDe
                  ? "MBA mit Schwerpunkt auf Operations und Projektarbeit"
                  : "MBA with focus on operations and project work"}
              </li>
              <li>
                •{" "}
                {isDe
                  ? "Netzwerk von CNC-, Blech- und Schweißpartnern in Europa"
                  : "Network of CNC, sheet metal and welding partners across Europe"}
              </li>
              <li>
                •{" "}
                {isDe
                  ? "Netzwerk von Web-Entwicklern in Europa"
                  : "Network of web designers & developers across Europe"}
              </li>
            </ul>
          </aside>
        </section>

        {/* Background / CV-ish section */}
        <section
          className="mt-10 rounded-xl border bg-white p-6 shadow-sm"
          style={{ borderColor: MID_GRAY }}
        >
          <h3 className="font-semibold text-neutral-800">
            {isDe
              ? "Engineering-Hintergrund & Industrieerfahrung"
              : "Engineering background & industrial experience"}
          </h3>
          <div
            className="mt-3 space-y-3 text-sm sm:text-base"
            style={{ color: MID_TEXT }}
          >
            <p>
              {isDe ? (
                <>
                  In den letzten zehn Jahren habe ich in verschiedenen industriellen
                  Umgebungen gearbeitet: in kleinen und mittelständischen
                  Unternehmen, bei Amazon (als Instandhaltungs-Teamleiter) und
                  aktuell bei BMW AG in München. Ein Großteil meiner Arbeit fand
                  in unmittelbarer Nähe von{" "}
                  <strong>
                    Maschinen, Fertigungslinien und technischen Projekten
                  </strong>{" "}
                  statt – nicht in reinen Büro-Rollen.
                </>
              ) : (
                <>
                  Over the last decade I have worked in different industrial environments:
                  small and mid-sized companies, Amazon (as a maintenance team lead) and
                  currently BMW AG in Munich. Most of my work has been close to{" "}
                  <strong>machines, production lines and technical projects</strong> – not
                  in pure office roles.
                </>
              )}
            </p>
            <p>
              {isDe ? (
                <>
                  Diese Mischung aus praxisnaher Technik und Projektkoordination ist die
                  Basis von Volotech: zu verstehen, was Konstrukteure,
                  Instandhaltungsteams und Projektleiter wirklich von Lieferanten
                  brauchen – und wo es häufig hakt (unklare Spezifikationen,
                  unrealistische Termine, fehlendes Feedback).
                </>
              ) : (
                <>
                  This mix of hands-on engineering and project coordination is what
                  Volotech is built on: understanding what designers, maintenance teams
                  and project managers actually need from suppliers – and where things
                  often go wrong (unclear specs, unrealistic deadlines, missing feedback).
                </>
              )}
            </p>
            <p>
              {isDe ? (
                <>
                  Das MBA-Studium hat strukturierte Werkzeuge für Operations, Finanzen und
                  Strategie auf den technischen Hintergrund aufgesetzt. Volotech ist der
                  praktische Ausdruck dieser Kombination: ein kleines, flexibles Setup,
                  das sowohl <strong>Engineering</strong> als auch{" "}
                  <strong>Business</strong> spricht.
                </>
              ) : (
                <>
                  The MBA added structured tools for operations, finance and strategy on
                  top of the technical background. Volotech is the practical outlet for
                  that combination: a small, flexible setup that speaks both{" "}
                  <strong>engineering</strong> and <strong>business</strong>.
                </>
              )}
            </p>
          </div>
        </section>

        {/* Manufacturing + digital positioning */}
        <section className="mt-10 grid lg:grid-cols-2 gap-8">
          <div
            className="rounded-xl border bg-white p-6 shadow-sm"
            style={{ borderColor: MID_GRAY }}
          >
            <h3 className="font-semibold text-neutral-800">
              {isDe
                ? "Kern: Fertigung & Lieferkoordination"
                : "Core: manufacturing & supply coordination"}
            </h3>
            <p
              className="mt-3 text-sm sm:text-base"
              style={{ color: MID_TEXT }}
            >
              {isDe ? (
                <>
                  Der Hauptfokus von Volotech liegt in der Koordination von{" "}
                  <strong>
                    CNC-Bearbeitung, Blechbearbeitung und einfachen Schweißkonstruktionen
                  </strong>{" "}
                  für Industriekunden. Dazu gehören:
                </>
              ) : (
                <>
                  The main focus of Volotech is coordinating{" "}
                  <strong>CNC machining, sheet metal and basic welded structures</strong>{" "}
                  for industrial customers. That includes:
                </>
              )}
            </p>
            <ul
              className="mt-3 text-sm sm:text-base"
              style={{ color: MID_TEXT }}
            >
              <li>
                •{" "}
                {isDe
                  ? "Prüfung von Zeichnungen und RFQs auf Machbarkeit"
                  : "Reviewing drawings and RFQs for feasibility"}
              </li>
              <li>
                •{" "}
                {isDe
                  ? "Zuordnung von Teilen zu geeigneten Partner-Maschinen"
                  : "Matching parts to suitable partner machines"}
              </li>
              <li>
                •{" "}
                {isDe
                  ? "Einholen von Preisen, Lieferzeiten und Risiken"
                  : "Collecting prices, lead times and risks"}
              </li>
              <li>
                •{" "}
                {isDe
                  ? "Bündelung von Lieferungen und Kommunikation über einen Ansprechpartner"
                  : "Bundling deliveries and communication through one contact"}
              </li>
            </ul>
            <p
              className="mt-3 text-sm sm:text-base"
              style={{ color: MID_TEXT }}
            >
              {isDe ? (
                <>
                  Sie können mit einem einzelnen Teil, einer Vorrichtung oder einem
                  kleinen Paket starten und von dort aus wachsen. Ziel ist eine{" "}
                  <strong>verlässliche, realistische Partnerschaft</strong> für
                  wiederkehrende Industrieaufträge – nicht die einmalige Job-Shop-Bearbeitung.
                </>
              ) : (
                <>
                  You can start with a single part, fixture or small package and grow from
                  there. The goal is to be a <strong>reliable, realistic partner</strong>{" "}
                  for recurring industrial work – not a one-off job shop.
                </>
              )}
            </p>
          </div>

          <div
            className="rounded-xl border bg-white p-6 shadow-sm"
            style={{ borderColor: MID_GRAY }}
          >
            <h3 className="font-semibold text-neutral-800">
              {isDe
                ? "Zusätzlich: Web & RFQ-Flows für Industrieunternehmen"
                : "Also offered: web & RFQ flows for industrial companies"}
            </h3>
            <p
              className="mt-3 text-sm sm:text-base"
              style={{ color: MID_TEXT }}
            >
              {isDe ? (
                <>
                  Als Nebenast unterstützt Volotech auch eine kleine Anzahl von{" "}
                  <strong>Web- und Digitalprojekten</strong> für Hersteller und
                  technische Dienstleister. Das ist keine klassische
                  Marketingagentur-Arbeit, sondern vielmehr:
                </>
              ) : (
                <>
                  As a side branch, Volotech also supports a small number of{" "}
                  <strong>web and digital projects</strong> for manufacturers and
                  technical service providers. This is not classic marketing agency work,
                  but rather:
                </>
              )}
            </p>
            <ul
              className="mt-3 text-sm sm:text-base"
              style={{ color: MID_TEXT }}
            >
              <li>
                •{" "}
                {isDe
                  ? "Klare, technische Leistungs- und Fähigkeitsseiten"
                  : "Clear, technical service & capability pages"}
              </li>
              <li>
                •{" "}
                {isDe
                  ? "Einfache RFQ- und Datei-Upload-Flows"
                  : "Simple RFQ and file-upload flows"}
              </li>
              <li>
                •{" "}
                {isDe
                  ? "Schlanke Websites, die es einfacher machen, Ihnen Arbeit zu schicken"
                  : "Lightweight sites that make it easier to send you work"}
              </li>
            </ul>
            <p
              className="mt-3 text-sm sm:text-base"
              style={{ color: MID_TEXT }}
            >
              {isDe ? (
                <>
                  Diese digitalen Projekte werden selektiv zusätzlich zum Kerngeschäft
                  Fertigung übernommen – vor allem dort, wo ein guter Fit mit
                  industriellen Inhalten und RFQ-Prozessen besteht.
                </>
              ) : (
                <>
                  These digital projects are taken on selectively alongside the core
                  manufacturing business – mainly where there is a good fit with industrial
                  content and RFQ processes.
                </>
              )}
            </p>
          </div>
        </section>

        {/* How you like to work */}
        <section
          className="mt-10 mb-4 rounded-xl border bg-white p-6 shadow-sm"
          style={{ borderColor: MID_GRAY }}
        >
          <h3 className="font-semibold text-neutral-800">
            {isDe ? "Wie ich gerne arbeite" : "How I like to work"}
          </h3>
          <ul
            className="mt-3 space-y-2 text-sm sm:text-base"
            style={{ color: MID_TEXT }}
          >
            <li>
              •{" "}
              {isDe
                ? "Klare Zeichnungen, ehrliche Fragen und schnelles Feedback auf beiden Seiten."
                : "Clear drawings, honest questions and fast feedback on both sides."}
            </li>
            <li>
              •{" "}
              {isDe
                ? "Realistische Zeitpläne und frühzeitige Hinweise, wenn etwas riskant aussieht."
                : "Realistic timelines and early flags when something looks risky."}
            </li>
            <li>
              •{" "}
              {isDe
                ? "Kleine, iterative Schritte statt riesiger Einmalprojekte."
                : "Small, iterative steps instead of huge one-shot projects."}
            </li>
            <li>
              •{" "}
              {isDe
                ? "Langfristige Zusammenarbeit, in der wir die Rahmenbedingungen des jeweils anderen kennen."
                : "Long-term cooperation where we both understand each other’s constraints."}
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}

export default AboutPage;
