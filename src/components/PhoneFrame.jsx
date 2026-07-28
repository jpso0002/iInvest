import './PhoneFrame.css';

export default function PhoneFrame({ children, statusBar = true, noPadding = false, bottomBar = null }) {
  return (
    <div className="phone-outer">
      <div className="phone-frame">
        <div className="phone-notch" aria-hidden="true" />
        {statusBar && <StatusBar />}
        <div className={noPadding ? 'phone-content phone-content--flush' : 'phone-content'}>
          {children}
        </div>
        {bottomBar}
      </div>
    </div>
  );
}

function StatusBar() {
  const time = '9:41';
  return (
    <div className="status-bar">
      <span className="status-bar-time">{time}</span>
      <div className="status-bar-icons">
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
          <rect x="0" y="6" width="3" height="4" rx="0.5" fill="currentColor" />
          <rect x="5" y="4" width="3" height="6" rx="0.5" fill="currentColor" />
          <rect x="10" y="2" width="3" height="8" rx="0.5" fill="currentColor" />
          <rect x="15" y="0" width="3" height="10" rx="0.5" fill="currentColor" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M8 2.5C10.5 2.5 12.7 3.5 14.3 5.1L15.8 3.6C13.8 1.6 11 0.4 8 0.4C5 0.4 2.2 1.6 0.2 3.6L1.7 5.1C3.3 3.5 5.5 2.5 8 2.5Z" fill="currentColor" />
          <path d="M8 6C9.3 6 10.5 6.5 11.4 7.4L8 10.6L4.6 7.4C5.5 6.5 6.7 6 8 6Z" fill="currentColor" />
        </svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
          <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" />
          <rect x="2" y="2" width="16" height="7" rx="1.2" fill="currentColor" />
          <rect x="21.5" y="3.5" width="1.6" height="4" rx="0.8" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
