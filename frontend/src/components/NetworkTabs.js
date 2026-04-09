const NetworkTabs = ({ activeNetwork, setActiveNetwork }) => {
  return (
    <div className="network-tabs" data-testid="network-tabs">
      <button
        className={`network-tab ${activeNetwork === "all" ? "active" : ""}`}
        onClick={() => setActiveNetwork("all")}
        data-testid="tab-all"
      >
        ALL
      </button>
      <button
        className={`network-tab ${activeNetwork === "solana" ? "active" : ""}`}
        onClick={() => setActiveNetwork("solana")}
        data-testid="tab-solana"
      >
        SOLANA
      </button>
      <button
        className={`network-tab ${activeNetwork === "base" ? "active" : ""}`}
        onClick={() => setActiveNetwork("base")}
        data-testid="tab-base"
      >
        BASE
      </button>
    </div>
  );
};

export default NetworkTabs;
