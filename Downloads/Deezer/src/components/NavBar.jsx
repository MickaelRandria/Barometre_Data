import { Home, Compass, Music, Search } from 'lucide-react';

const tabs = [
  { id: 'home',    label: 'Accueil',      Icon: Home },
  { id: 'explore', label: 'Explorer',     Icon: Compass },
  { id: 'library', label: 'Bibliothèque', Icon: Music },
  { id: 'search',  label: 'Recherche',    Icon: Search },
];

export default function NavBar({ activeTab, onTabChange }) {
  return (
    <nav
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 'var(--z-navbar)',
        height: 'var(--navbar-h)',
        background: 'var(--bg-base)',
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'env(safe-area-inset-bottom, var(--safe-bottom))',
        display: 'flex',
        alignItems: 'flex-start',
        paddingTop: '10px',
      }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              transition: 'color var(--t-fast)',
              padding: '0 4px',
            }}
          >
            <Icon
              size={24}
              strokeWidth={isActive ? 2.5 : 2}
              style={{ transition: 'color var(--t-fast)' }}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: isActive ? '500' : '400',
                lineHeight: 1,
                fontFamily: 'var(--font-primary)',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
