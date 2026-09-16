import { Link } from 'react-router-dom';
import './NotFound.css';
import { useLanguage } from '../context/LanguageContext';

export function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="not-found">
      <p className="not-found__code">404</p>
      <h1>PAGE NOT FOUND</h1>
      <Link to="/" className="btn btn--primary">{t('nav.home')}</Link>
    </div>
  );
}
