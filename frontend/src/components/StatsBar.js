import { formatCurrency } from "./utils";

const StatsBar = ({ totalVolume, largestTx, solanaCount, baseCount, currency }) => {
  return (
    <div className="stats-bar" data-testid="stats-bar">
      <div className="stat-card">
        <div className="stat-label">TOTAL VOLUME ({currency})</div>
        <div className="stat-value" data-testid="total-volume">{formatCurrency(totalVolume, currency)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">LARGEST MOVE</div>
        <div className="stat-value" data-testid="largest-move">{formatCurrency(largestTx, currency)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">SOLANA TXS</div>
        <div className="stat-value" data-testid="solana-count">{solanaCount}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">BASE TXS</div>
        <div className="stat-value" data-testid="base-count">{baseCount}</div>
      </div>
    </div>
  );
};

export default StatsBar;
