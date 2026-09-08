export function Footer() {
  return (
    <footer className="mt-16 pb-8 text-sm text-slate-400 max-w-4xl mx-auto px-4">
      {/* How it works Section */}
      <div className="bg-[#1e2330] rounded-xl p-6 border border-slate-700/50 mb-6">
        <h3 className="text-slate-200 font-semibold text-base mb-2">How it works</h3>
        <p className="leading-relaxed">
          PromiseLedger is a decentralized oracle for tracking public commitments. 
          Anyone can register a promise alongside an evidence URL. The GenLayer Intelligent Contract 
          fetches the page and uses AI consensus to evaluate the progress (Fulfilled, In Progress, or Broken). 
          It then stores an immutable snapshot and a verbatim citation directly on the blockchain.
        </p>
      </div>
      
      {/* About Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-800/80 pt-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">About:</span>
          <a 
            href="https://github.com/reza9133/promiseledger" 
            target="_blank" 
            rel="noreferrer" 
            className="text-slate-300 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4"
          >
            GitHub Repository
          </a>
        </div>
        <div>
          <span className="text-slate-500">Created by </span>
          <a 
            href="https://x.com/amirhp771" 
            target="_blank" 
            rel="noreferrer" 
            className="text-slate-300 hover:text-white transition-colors font-medium underline decoration-slate-600 underline-offset-4"
          >
            @amirhp771
          </a>
        </div>
      </div>
    </footer>
  );
}
