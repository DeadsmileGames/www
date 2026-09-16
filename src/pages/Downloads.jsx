import { Link } from 'react-router-dom';
import { AndroidLogo, AppleLogo, ArrowLeft, ArrowUpRight, Archive, DownloadSimple, File, HardDrives, Image, WindowsLogo } from '@phosphor-icons/react';
import { useContent } from '../hooks/useContent';
import { useToast } from '../components/ui/Toast';
import { safeDownloadUrl } from '../utils/urls';
import './Downloads.css';

const iconFor = (category = '') => {
  const value = category.toLowerCase();
  if (value.includes('press')) return Archive;
  if (value.includes('wallpaper') || value.includes('image')) return Image;
  if (value.includes('launcher')) return HardDrives;
  return File;
};

export function Downloads() {
  const content = useContent('/downloads');
  const { push } = useToast();
  const items = content.data || [];
  const launcher = items.find((item) => String(item.category || '').toLowerCase().includes('launcher'));
  const launcherUrl = safeDownloadUrl(launcher?.file_url);
  const resources = items.filter((item) => item !== launcher && !/android|ios/i.test(item.category || ''));
  return (
    <div className="downloads-page container">
      <Link to="/" className="back-link"><ArrowLeft weight="bold" /><span>Back</span></Link>
      <header className="downloads-hero">
        <div><h1>Downloads</h1><p>Install the launcher, get the companion apps and find every official Deadsmile Games file in one place.</p></div>
        <HardDrives size={56} weight="bold" />
      </header>
      <section className="launcher-download-card">
        <div><h2>Everything ready to play</h2><p>Install games, receive updates, synchronize supported saves and keep your library together.</p></div>
        {launcherUrl ? (
          <a className="btn btn--primary" href={launcherUrl} onClick={() => push('Your launcher download has started.', 'success')}><DownloadSimple size={18} weight="bold" /><span>Download for Windows</span></a>
        ) : <a className="btn btn--primary" href="https://github.com/deadsmilegames/launcher/releases/latest"><ArrowUpRight size={18} weight="bold" /><span>View latest release</span></a>}
      </section>
      <section className="downloads-section">
        <div className="downloads-section__head"><h2>Mobile companion</h2><p>Wishlist, releases and news without game downloads.</p></div>
        <div className="mobile-download-grid">
          <Link to="/downloads/app/android" className="mobile-download-card"><AndroidLogo size={30} weight="bold" /><div><strong>Android</strong><span>Availability and install</span></div><ArrowUpRight size={19} weight="bold" /></Link>
          <Link to="/downloads/app/ios" className="mobile-download-card"><AppleLogo size={30} weight="bold" /><div><strong>iOS</strong><span>Availability and install</span></div><ArrowUpRight size={19} weight="bold" /></Link>
        </div>
      </section>
      <section className="downloads-section">
        <div className="downloads-section__head"><h2>Files and resources</h2><p>Press materials, patches, wallpapers and extras.</p></div>
        {content.status === 'loading' && <div className="downloads-state">Loading official files…</div>}
        {content.status === 'error' && <div className="downloads-state downloads-state--error">Files are unavailable right now. Please try again shortly.</div>}
        {content.status === 'success' && (
          <div className="download-list">
            {resources.length ? resources.map((item) => {
              const Icon = iconFor(item.category);
              return <article className="download-row" key={item.id}>
                <div className="download-row__icon"><Icon weight="bold" size={22} /></div>
                <div className="download-row__info"><span>{item.category || 'Official file'}</span><h3>{item.title}</h3><small>{[item.file_type, item.resolution, item.file_size].filter(Boolean).join(' · ') || 'Deadsmile Games resource'}</small></div>
                {safeDownloadUrl(item.file_url) ? <a href={safeDownloadUrl(item.file_url)} className="download-row__action" onClick={() => push(`${item.title} is ready to download.`, 'success')}><DownloadSimple size={18} weight="bold" /><span>Download</span></a> : <span className="download-row__soon">Coming soon</span>}
              </article>;
            }) : <div className="downloads-state">No additional files have been published yet.</div>}
          </div>
        )}
      </section>
    </div>
  );
}
