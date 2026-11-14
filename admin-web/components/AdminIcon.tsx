const paths = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-7H9v7H3z',
  book: 'M12 6c-3-2.5-6-2.5-9-1v14c3-1.5 6-1.5 9 1 3-2.5 6-2.5 9-1V5c-3-1.5-6-1.5-9 1zm0 0v14',
  chat: 'M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.7-3.4A7.5 7.5 0 1 1 20 11.5zM9 11.5h.01m3.5 0h.01m3.5 0h.01',
  edit: 'm14 6 4 4M5 19l4-.8L20 7a1.4 1.4 0 0 0 0-2l-1-1a1.4 1.4 0 0 0-2 0L6 15z',
  article: 'M5 3h11l3 3v15H5zM8 8h8M8 12h8M8 16h5',
  recipe: 'M5 3v6a3 3 0 0 0 6 0V3M8 3v18M19 21V3c-2.2 1.4-4 4-4 7.5V13h4',
  media: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M16 8h.01',
  inbox: 'M4 4h16l2 9v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6zM2 13h6l2 3h4l2-3h6',
  customers: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M20 21v-2a4 4 0 0 0-2-3.5M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM17 3.5a4 4 0 0 1 0 7',
  products: 'M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7m-9 4v10M7.5 5l9 4',
  account: 'M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  external: 'M13 5h6v6m0-6-9 9M9 5H5v14h14v-4',
  arrow: 'M20 12H4m6-6-6 6 6 6',
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zM14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  'eye-off': 'M3 3l18 18M10 6.2c.65-.13 1.32-.2 2-.2 6.5 0 10 6 10 6a17 17 0 0 1-3 3.35M6 7.8A17 17 0 0 0 2 12s3.5 6 10 6c1.4 0 2.7-.27 3.8-.71',
  lock: 'M5 10h14v11H5zM8 10V7a4 4 0 1 1 8 0v3M12 14v3',
  search: 'M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0zM16 16l5 5',
  plus: 'M12 5v14M5 12h14',
  logout: 'M10 4H4v16h6m-1-8h12m-5-5 5 5-5 5',
  close: 'M5 5l14 14M19 5 5 19',
  check: 'm5 12 4 4L19 6',
  upload: 'M12 17V4m-5 5 5-5 5 5M4 16v4h16v-4',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4',
} as const;

export type IconName = keyof typeof paths;

export function AdminIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
