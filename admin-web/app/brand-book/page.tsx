import type { Metadata } from 'next';
import { BrandBookWorkspace } from './BrandBookWorkspace';
import './brand-book.css';

export const metadata: Metadata = { title: 'برند بوک' };

export default function BrandBookPage() {
  return <BrandBookWorkspace />;
}
