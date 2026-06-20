import { useEffect, useState } from 'react';
export default function ThemeButton() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);
  return <button className="control" onClick={() => { const next = !dark; setDark(next); document.documentElement.classList.toggle('dark', next); localStorage.setItem('mobiles-theme', next ? 'dark' : 'light'); }}>{dark ? '☀ ライト' : '◐ ダーク'}</button>;
}
