import { Waves, RefreshCw } from "lucide-react";
import { formatTime, formatCurrency } from "./utils";
import TransactionRow from "./TransactionRow";

const TransactionList = ({ 
  loading, 
  error, 
  transactions, 
  isRefreshing, 
  lastUpdated, 
  newTransactionIds, 
  currency,
  threshold 
}) => {
  return (
    <div className="transactions-section" data-testid="transactions-section">
      <div className="section-header">
        <h2 className="section-title">
          <Waves size={18} />
          BIG MOVES
        </h2>
        <div className="live-indicator">
          {isRefreshing ? (
            <RefreshCw size={12} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <span className="live-dot" />
          )}
          <span>
            {isRefreshing ? "UPDATING..." : "LIVE"} 
            {lastUpdated && ` | ${formatTime(lastUpdated)}`}
          </span>
        </div>
      </div>

      <div className="transaction-list" data-testid="transaction-list">
        {loading ? (
          <div className="loading-container">
            <pre className="ascii-loading">
{`  |  
 -+-
  |  `}
            </pre>
            <p className="loading-text">SCANNING BLOCKCHAIN...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <p className="empty-text" style={{ color: 'var(--terminal-error)' }}>{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <pre className="empty-whale">
{`        .
       ":"
     ___:____     |"\\/"|
   ,'        \`.    \\  /
   |  O        \\___/  |
 ~^~^~^~^~^~^~^~^~^~^~^~^~`}
            </pre>
            <p className="empty-text">NO WHALE ACTIVITY DETECTED</p>
            <p className="empty-text" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
              MONITORING FOR TRANSACTIONS &gt; {formatCurrency(threshold, currency)}
            </p>
          </div>
        ) : (
          transactions.map((tx) => (
            <TransactionRow 
              key={tx.id || tx.signature} 
              transaction={tx} 
              isNew={newTransactionIds.has(tx.signature)}
              currency={currency}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;
