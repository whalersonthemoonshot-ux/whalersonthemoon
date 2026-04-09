import { Bell, Settings, Volume2, VolumeX, Zap } from "lucide-react";

const Header = ({ 
  navigate, 
  onSettingsClick, 
  onSubscribeClick, 
  soundEnabled, 
  onSoundToggle 
}) => {
  return (
    <header className="terminal-header">
      <div className="header-content">
        <div className="logo-section">
          <pre className="ascii-whale" data-testid="ascii-whale">
{`   __
  / _)
 ( (
  \\ \\__
   \\___)`}
          </pre>
          <div>
            <h1 className="app-title" data-testid="app-title">WHALERS ON THE MOON</h1>
            <p className="app-subtitle">REAL-TIME WHALE TRANSACTION TRACKER</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button
            className="upgrade-btn"
            onClick={() => navigate("/pricing")}
            data-testid="upgrade-btn"
            title="Upgrade for Telegram Alerts"
          >
            <Zap size={18} />
            UPGRADE
          </button>
          
          <button
            className="settings-btn"
            onClick={onSettingsClick}
            data-testid="settings-btn"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          
          <button
            className={`sound-toggle ${soundEnabled ? 'active' : ''}`}
            onClick={onSoundToggle}
            data-testid="sound-toggle-btn"
            title={soundEnabled ? "Sound On" : "Sound Off"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          
          <button 
            className="subscribe-btn" 
            onClick={onSubscribeClick}
            data-testid="subscribe-btn"
          >
            <Bell size={18} />
            SUBSCRIBE FOR ALERTS
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
