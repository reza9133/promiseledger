import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";
import { setDemo } from "../lib/mode";
import { WalletProvider } from "../hooks/useWallet";
import { ToastProvider } from "../hooks/useToast";
import { ContractProvider } from "../hooks/useContract";
import { Ledger } from "./Ledger";
import { Case } from "./Case";
import { Docs } from "./Docs";
import { About } from "./About";
import { Promisors } from "./Promisors";
import { Stats } from "./Stats";
import { NotFound } from "./NotFound";

beforeAll(() => setDemo(true));

function at(path: string, routePath: string, el: JSX.Element) {
  return render(
    <WalletProvider>
      <ToastProvider>
        <ContractProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path={routePath} element={el} />
            </Routes>
          </MemoryRouter>
        </ContractProvider>
      </ToastProvider>
    </WalletProvider>,
  );
}

describe("pages (demo mode smoke)", () => {
  it("ledger lists entries", async () => {
    at("/ledger", "/ledger", <Ledger />);
    expect((await screen.findAllByRole("link", { name: /#\d{4}/ })).length).toBeGreaterThan(0);
  });
  it("case file renders a promise and its history", async () => {
    at("/promise/1", "/promise/:id", <Case />);
    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
  });
  it("case file handles a missing id", async () => {
    at("/promise/999999", "/promise/:id", <Case />);
    expect(await screen.findByText(/doesn.t exist|not found/i)).toBeInTheDocument();
  });
  it("promisor leaderboard", async () => {
    at("/promisors", "/promisors", <Promisors />);
    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
  });
  it("stats, docs, about, 404 render", async () => {
    for (const [el, path] of [
      [<Stats />, "/stats"],
      [<Docs />, "/docs"],
      [<About />, "/about"],
      [<NotFound />, "/nope"],
    ] as const) {
      const { unmount } = at(path, path, el);
      expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
      unmount();
    }
  });
});
