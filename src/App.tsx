import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { SiteFooter } from "./components/SiteFooter";
import { DemoBanner } from "./components/ContractGate";
import { PageSkeleton } from "./components/Skeleton";
import { WalletProvider } from "./hooks/useWallet";
import { ToastProvider } from "./hooks/useToast";
import { ContractProvider } from "./hooks/useContract";
import { Home } from "./pages/Home";

const Ledger = lazy(() => import("./pages/Ledger").then((m) => ({ default: m.Ledger })));
const Case = lazy(() => import("./pages/Case").then((m) => ({ default: m.Case })));
const File = lazy(() => import("./pages/File").then((m) => ({ default: m.File })));
const Promisors = lazy(() => import("./pages/Promisors").then((m) => ({ default: m.Promisors })));
const PromisorProfile = lazy(() => import("./pages/Promisors").then((m) => ({ default: m.PromisorProfile })));
const Me = lazy(() => import("./pages/Me").then((m) => ({ default: m.Me })));
const Stats = lazy(() => import("./pages/Stats").then((m) => ({ default: m.Stats })));
const Docs = lazy(() => import("./pages/Docs").then((m) => ({ default: m.Docs })));
const About = lazy(() => import("./pages/About").then((m) => ({ default: m.About })));
const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));

export default function App() {
  return (
    <WalletProvider>
      <ToastProvider>
        <ContractProvider>
          <Header />
          <DemoBanner />
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/promise/:id" element={<Case />} />
              <Route path="/file" element={<File />} />
              <Route path="/promisors" element={<Promisors />} />
              <Route path="/promisors/:key" element={<PromisorProfile />} />
              <Route path="/me" element={<Me />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <SiteFooter />
        </ContractProvider>
      </ToastProvider>
    </WalletProvider>
  );
}
