import { AlertTriangle } from "lucide-react";

const DataNotice = () => {
  return (
    <div className="data-notice" data-testid="data-notice">
      <AlertTriangle size={14} />
      <span>
        <strong>DATA NOTICE:</strong> Base network data may experience delays due to external API latency. Solana data is typically real-time.
      </span>
    </div>
  );
};

export default DataNotice;
