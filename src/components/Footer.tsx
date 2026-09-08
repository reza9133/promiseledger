export function Footer() {
  return (
    <footer style={{
      maxWidth: '850px',
      margin: '40px auto 40px auto',
      padding: '28px 32px',
      backgroundColor: 'rgba(20, 25, 35, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      color: '#94a3b8',
      lineHeight: '1.7',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(12px)',
      fontFamily: 'inherit'
    }}>
      {/* بخش How it works */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          color: '#f1f5f9', 
          fontSize: '1.15rem', 
          marginBottom: '12px', 
          fontWeight: '600', 
          letterSpacing: '0.5px' 
        }}>
          💡 How it works
        </h3>
        <p style={{ margin: 0, fontSize: '0.95rem', textAlign: 'justify' }}>
          PromiseLedger is a decentralized oracle for tracking public commitments. 
          Anyone can register a promise alongside an evidence URL. The GenLayer Intelligent Contract 
          fetches the page and uses AI consensus to evaluate the progress (Fulfilled, In Progress, or Broken). 
          It then stores an immutable snapshot and a verbatim citation directly on the blockchain.
        </p>
      </div>
      
      {/* بخش About و لینک‌ها */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
        paddingTop: '20px',
        fontSize: '0.9rem',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: '#64748b' }}>About:</span>
          <a 
            href="https://github.com/reza9133/promiseledger" 
            target="_blank" 
            rel="noreferrer" 
            style={{ 
              color: '#e2e8f0', 
              textDecoration: 'none', 
              borderBottom: '1px solid #475569', 
              paddingBottom: '2px',
              transition: 'all 0.2s ease'
            }}
          >
            GitHub Repository
          </a>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: '#64748b' }}>Created by</span>
          <a 
            href="https://x.com/amirhp771" 
            target="_blank" 
            rel="noreferrer" 
            style={{ 
              color: '#38bdf8', 
              textDecoration: 'none', 
              fontWeight: '600', 
              letterSpacing: '0.5px',
              borderBottom: '1px solid transparent'
            }}
          >
            @amirhp771
          </a>
        </div>
      </div>
    </footer>
  );
}
