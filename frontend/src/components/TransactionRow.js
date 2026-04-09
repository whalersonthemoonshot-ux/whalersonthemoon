import { ExternalLink } from "lucide-react";
import { formatCurrency, formatUSD, formatTime, convertFromUSD } from "./utils";

const TransactionRow = ({ transaction, isNew, currency }) => {
  // Convert amount to selected currency
  const amountInCurrency = convertFromUSD(transaction.amount_usd, currency);
  
  return (
    <div 
      className={`transaction-row ${isNew ? 'new-transaction' : ''}`} 
      data-testid={`transaction-${transaction.signature.slice(0, 8)}`}
    >
      <div>
        <span className={`network-badge ${transaction.network}`}>
          {transaction.network.toUpperCase()}
        </span>
      </div>
      
      <div className="token-info">
        <span className="token-name">
          {transaction.token_name} ({transaction.token_symbol})
          {isNew && <span className="new-badge">NEW</span>}
        </span>
        <span className="token-addresses">
          {transaction.from_address} → {transaction.to_address}
        </span>
        <span className="timestamp">
          {formatTime(transaction.timestamp)} | {transaction.transaction_type.toUpperCase()}
        </span>
      </div>
      
      <div className="amount-info">
        <div className="amount-cad" data-testid={`amount-${transaction.signature.slice(0, 8)}`}>
          {formatCurrency(amountInCurrency, currency)}
        </div>
        <div className="amount-usd">
          {formatUSD(transaction.amount_usd)} USD
        </div>
      </div>
      
      <div>
        <a
          href={transaction.explorer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="explorer-link"
          data-testid="explorer-link"
        >
          <ExternalLink size={14} />
          View on Explorer
        </a>
      </div>
    </div>
  );
};

export default TransactionRow;
