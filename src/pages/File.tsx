import { RequireContract } from "../components/ContractGate";
import { FileForm } from "../components/FileForm";
import { useTitle } from "../hooks/useData";

export function File() {
  useTitle("File a promise");
  return (
    <main id="main" className="page page-narrow">
      <div className="page-head">
        <h1 className="page-title">File a promise</h1>
      </div>
      <p className="lede">
        Point it at the page where progress should show up. Validators take a baseline snapshot right now and every future check is
        compared against what the page really says.
      </p>
      <RequireContract>
        <FileForm />
      </RequireContract>
    </main>
  );
}
