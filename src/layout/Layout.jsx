// src/layout/Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";

export default function Layout({ Navbar, Footer }) {
  return (
    <>
      {Navbar ? <Navbar /> : null}
      <main>
        <Outlet />
      </main>
      {Footer ? <Footer /> : null}
    </>
  );
}
