import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowUpRight, MagnifyingGlass, X, Heart, File, LockKey, UserCircle } from '@phosphor-icons/react';
import { FOCUSABLE_SELECTOR, lockBodyScroll } from '../../utils/dom';
import './MobileMenu.css';

export function MobileMenu({ open, onClose, onOpenSearch }) {
    const { user, status } = useAuth();
    const { t } = useLanguage();
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const previousFocus = document.activeElement;
        const unlock = lockBodyScroll();
        const key = (event) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }
            if (event.key !== 'Tab' || !panelRef.current) return;
            const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
                (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
            );
            if (!focusable.length) {
                event.preventDefault();
                panelRef.current.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', key);
        panelRef.current?.focus();
        return () => {
            unlock();
            document.removeEventListener('keydown', key);
            if (previousFocus instanceof HTMLElement) previousFocus.focus();
        };
    }, [open, onClose]);

    const links = [
        ['/', 'nav.home'],
        ['/games', 'nav.games'],
        ['/downloads', 'nav.downloads'],
        ['/news', 'nav.news'],
        ['/videos', 'nav.videos'],
        ['/support', 'nav.support'],
    ];

    return (
        <div className={`mobile-menu ${open ? 'mobile-menu--open' : ''}`} aria-hidden={!open} inert={open ? undefined : ''}>
            <div className="mobile-menu__backdrop" onClick={onClose} />
            <div
                className="mobile-menu__panel"
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                ref={panelRef}
            >
                <div className="mobile-menu__top">
                    <button
                        type="button"
                        className="mobile-menu__close"
                        onClick={onClose}
                        aria-label="Close menu"
                    >
                        <X weight="bold" />
                    </button>
                </div>

                <nav className="mobile-menu__nav">
                    {links.map(([to, key], i) => (
                        <Link
                            key={to}
                            to={to}
                            onClick={onClose}
                            className="mobile-menu__link"
                            style={{ '--menu-delay': `${i * 45}ms` }}
                        >
                            <span>{t(key)}</span>
                            <ArrowUpRight weight="bold" className="mobile-menu__arrow" />
                        </Link>
                    ))}

                    {status === 'authenticated' && (
                        <Link to="/wishlist" onClick={onClose} className="mobile-menu__link" style={{ '--menu-delay': '290ms' }}>
                            <span>Wishlist</span>
                            <Heart weight="bold" className="mobile-menu__arrow" />
                        </Link>
                    )}
                </nav>

                <div className="mobile-menu__footer">
                    {status === 'authenticated' ? (
                        <Link to="/account" className="mobile-menu__account" onClick={onClose}>
                            <UserCircle size={32} weight="bold" />
                        </Link>
                    ) : (
                        <Link to="/login" className="mobile-menu__account" onClick={onClose}>
                            <UserCircle size={32} weight="bold" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
