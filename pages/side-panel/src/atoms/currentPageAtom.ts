import { atom } from 'jotai';

export interface CurrentPage {
  url: string;
  // 必要に応じて他のプロパティも追加
}

export const currentPageAtom = atom<CurrentPage | null>(null);
