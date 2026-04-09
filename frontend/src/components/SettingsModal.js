import { useState } from "react";
import { X } from "lucide-react";
import { CURRENCY_SYMBOLS } from "./utils";

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  threshold, 
  setThreshold, 
  refreshInterval, 
  setRefreshInterval, 
  currency, 
  setCurrency 
}) => {
  const [tempThreshold, setTempThreshold] = useState(threshold);
  const [tempInterval, setTempInterval] = useState(refreshInterval / 1000); // Convert to seconds
  const [tempCurrency, setTempCurrency] = useState(currency);

  const handleSave = () => {
    setThreshold(tempThreshold);
    setRefreshInterval(tempInterval * 1000); // Convert back to ms
    setCurrency(tempCurrency);
    onClose();
  };

  const thresholdOptions = [
    { value: 50000, label: `${CURRENCY_SYMBOLS[tempCurrency]}50K` },
    { value: 100000, label: `${CURRENCY_SYMBOLS[tempCurrency]}100K` },
    { value: 250000, label: `${CURRENCY_SYMBOLS[tempCurrency]}250K` },
    { value: 500000, label: `${CURRENCY_SYMBOLS[tempCurrency]}500K` },
    { value: 1000000, label: `${CURRENCY_SYMBOLS[tempCurrency]}1M` },
  ];

  const intervalOptions = [
    { value: 10, label: "10s" },
    { value: 15, label: "15s" },
    { value: 30, label: "30s" },
    { value: 60, label: "1min" },
    { value: 120, label: "2min" },
  ];

  const currencyOptions = [
    { value: "USD", label: "USD $" },
    { value: "CAD", label: "CAD $" },
    { value: "EUR", label: "EUR €" },
    { value: "GBP", label: "GBP £" },
    { value: "AUD", label: "AUD $" },
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="settings-modal">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} data-testid="settings-close-btn">
          <X size={20} />
        </button>
        
        <h2 className="modal-title">SETTINGS</h2>
        <p className="modal-subtitle">Configure your whale tracker preferences</p>
        
        <div className="settings-group">
          <label className="settings-label">DISPLAY CURRENCY</label>
          <div className="settings-options">
            {currencyOptions.map((opt) => (
              <button
                key={opt.value}
                className={`settings-option ${tempCurrency === opt.value ? 'active' : ''}`}
                onClick={() => setTempCurrency(opt.value)}
                data-testid={`currency-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="settings-hint">Primary currency for displaying amounts</p>
        </div>
        
        <div className="settings-group">
          <label className="settings-label">WHALE THRESHOLD ({tempCurrency})</label>
          <div className="settings-options">
            {thresholdOptions.map((opt) => (
              <button
                key={opt.value}
                className={`settings-option ${tempThreshold === opt.value ? 'active' : ''}`}
                onClick={() => setTempThreshold(opt.value)}
                data-testid={`threshold-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="settings-hint">Only show transactions above this value</p>
        </div>

        <div className="settings-group">
          <label className="settings-label">AUTO-REFRESH INTERVAL</label>
          <div className="settings-options">
            {intervalOptions.map((opt) => (
              <button
                key={opt.value}
                className={`settings-option ${tempInterval === opt.value ? 'active' : ''}`}
                onClick={() => setTempInterval(opt.value)}
                data-testid={`interval-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="settings-hint">How often to check for new whale moves</p>
        </div>

        <button
          className="modal-submit"
          onClick={handleSave}
          data-testid="settings-save-btn"
        >
          SAVE SETTINGS
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
