import { useEffect, useState } from 'react';

const readFavorites = (): string[] => {
  try { const parsed: unknown = JSON.parse(localStorage.getItem('mobiles-favorites') ?? '[]'); return Array.isArray(parsed) && parsed.every(id => typeof id === 'string') ? parsed : []; }
  catch { return []; }
};

export default function ModelActions({id}:{id:string}) {
  const [favorite,setFavorite]=useState(false);
  useEffect(()=>setFavorite(readFavorites().includes(id)),[id]);
  const toggle=()=>{ const favorites=new Set(readFavorites()); favorite?favorites.delete(id):favorites.add(id); localStorage.setItem('mobiles-favorites',JSON.stringify([...favorites])); setFavorite(!favorite); };
  const add=()=>{ const p=new URLSearchParams(location.search); const ids=(p.get('compare')??'').split(',').filter(Boolean); if(!ids.includes(id)&&ids.length<5)ids.push(id); location.href=`${import.meta.env.BASE_URL}compare?ids=${ids.join(',')}`; };
  return <div className="flex gap-2"><button className="control" onClick={toggle}>{favorite?'★ お気に入り':'☆ お気に入り'}</button><button className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white" onClick={add}>比較に追加</button></div>;
}
