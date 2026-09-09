import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { SiteFooter } from "./components/SiteFooter";
import { LedgerPage } from "./pages/LedgerPage";
import { CasePage } from "./pages/CasePage";
import { WalletProvider } from "./hooks/useWallet";
import { ToastProvider } from "./hooks/useToast";

export default function App() {
  return (
    <WalletProvider>
      <ToastProvider>
        <Header />
        <Routes>
          <Route path="/" element={<LedgerPage />} />
          <Route path="/promise/:id" element={<CasePage />} />
          <Route path="*" element={<LedgerPage />} />
        </Routes>
        <SiteFooter />
      </ToastProvider>
    </WalletProvider>
  );
}
