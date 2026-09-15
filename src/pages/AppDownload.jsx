import { Link, useParams } from 'react-router-dom';
import { AndroidLogo, AppleLogo, ArrowLeft, ArrowUpRight, Bell, DeviceMobile, ShieldCheck } from '@phosphor-icons/react';
import { useContent } from '../hooks/useContent';
import { safeDownloadUrl } from '../utils/urls';
import './Downloads.css';

export function AppDownload() {
  const { platform } = useParams();
  const isIos = platform === 'ios';
  const isSupported = isIos || platform === 'android';
  const content = useContent('/downloads');
  const item = isSupported ? (content.data || []).find((entry) => String(entry.category || '').toLowerCase().includes(isIos ? 'ios' : 'android')) : null;
  const downloadUrl = safeDownloadUrl(item?.file_url);
  const Icon = isIos ? AppleLogo : AndroidLogo;
  if (!isSupported) return <div className="downloads-page container"><Link to="/downloads" className="back-link"><ArrowLeft weight="bold" /><span>Downloads</span></Link><h1>Platform not found.</h1></div>;
  return (
    <div className="downloads-page container">
      <Link to="/downloads" className="back-link"><ArrowLeft weight="bold" /><span>Downloads</span></Link>
      <section className="app-download-hero">
        <div>
          <Icon size={42} weight="bold" />
          <h1>Deadsmile Games for {isIos ? 'iOS' : 'Android'}</h1>
          <p>Follow releases, manage your wishlist and keep up with everything from Deadsmile Games.</p>
          {downloadUrl ? (
            <a className="btn btn--primary" href={downloadUrl}><span>Get the app</span><ArrowUpRight weight="bold" /></a>
          ) : (
            <button className="btn btn--secondary" disabled><span>Not available yet</span></button>
          )}
        </div>
        <div className="app-download-features">
          <div><Bell size={22} weight="bold" /><span>Release updates</span></div>
          <div><DeviceMobile size={22} weight="bold" /><span>Mobile-first library</span></div>
          <div><ShieldCheck size={22} weight="bold" /><span>Same secure account</span></div>
        </div>
      </section>
    </div>
  );
}
