const base = import.meta.env.BASE_URL;

/** Build a directory-safe URL for Astro's configured base path. */
export const withBase = (path: string) =>
  `${base.replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`;
