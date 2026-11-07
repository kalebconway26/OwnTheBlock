// On a computer screen, shows the app inside an iPhone-sized outline (390 x 844, iPhone 14/15).
// On a real phone the wrappers use `display: contents`, so the app fills the screen as normal.
// Styles live in globals.css under "Phone frame".
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="pf-stage">
      <div className="pf-device">
        <div className="pf-status" aria-hidden="true">
          <span className="pf-time">9:41</span>
          <span className="pf-island" />
          <span className="pf-icons">
            <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
            <svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 2.2c2.1 0 4 .8 5.5 2.2l1.1-1.1A9.3 9.3 0 0 0 7.5.6 9.3 9.3 0 0 0 .9 3.3L2 4.4a7.7 7.7 0 0 1 5.5-2.2Zm0 3.2c1.2 0 2.3.5 3.2 1.3l1.1-1.1a6.1 6.1 0 0 0-8.6 0l1.1 1.1c.9-.8 2-1.3 3.2-1.3Zm0 3.2c-.4 0-.8.2-1.1.5l1.1 1.1 1.1-1.1a1.6 1.6 0 0 0-1.1-.5Z" /></svg>
            <svg width="25" height="12" viewBox="0 0 25 12"><rect x=".5" y=".5" width="21" height="11" rx="3" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="18" height="8" rx="1.8" /><rect x="22.5" y="4" width="1.6" height="4" rx=".8" opacity=".4" /></svg>
          </span>
        </div>
        <div className="pf-screen">{children}</div>
        <div className="pf-home" aria-hidden="true" />
      </div>
    </div>
  );
}
