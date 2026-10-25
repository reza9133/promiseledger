import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LedgerEntry } from "./LedgerEntry";
import { LogoLockup, LogoMark } from "./Logo";
import { DisputeTag, StatusSeal } from "./StatusSeal";
import { __demoData } from "../lib/demo";

describe("StatusSeal", () => {
  it.each(["PENDING", "IN_PROGRESS", "FULFILLED", "BROKEN", "UNVERIFIABLE"])("renders %s", (s) => {
    const { container } = render(<StatusSeal status={s} />);
    expect(container.querySelector(`.seal-${s.toLowerCase()}`)).toBeTruthy();
  });
  it("dispute tags", () => {
    render(<DisputeTag status="UPHELD" />);
    expect(screen.getByText(/upheld/)).toBeInTheDocument();
  });
});

describe("Logo", () => {
  it("is decorative by default and labelled when titled", () => {
    const a = render(<LogoMark />);
    expect(a.container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    a.unmount();
    render(<LogoMark title="PromiseLedger" />);
    expect(screen.getByRole("img", { name: "PromiseLedger" })).toBeInTheDocument();
  });
  it("lockup shows the wordmark", () => {
    render(<LogoLockup tagline />);
    expect(screen.getByText(/Ledger/)).toBeInTheDocument();
    expect(screen.getByText(/kept & broken promises/)).toBeInTheDocument();
  });
});

describe("LedgerEntry", () => {
  it("links to the case file and shows tags", () => {
    const p = __demoData().promises.find((x) => x.kept_late || x.revision_count > 1) ?? __demoData().promises[0];
    render(
      <MemoryRouter>
        <LedgerEntry promise={p} nowUnix={Date.now() / 1000} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", `/promise/${p.id}`);
    expect(screen.getByText(p.title)).toBeInTheDocument();
    if (p.kept_late) expect(screen.getByText("kept late")).toBeInTheDocument();
  });
});
