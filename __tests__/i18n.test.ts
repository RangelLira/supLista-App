// ===========================
// TESTES: paridade de chaves i18n (pt / en / es)
// ===========================
// Regra do projeto: toda string nova entra nos 3 idiomas ao mesmo tempo.

import { _translations } from '../src/contexts/LanguageContext';

// Caminhos de todas as chaves folha, ex.: "settings.aboutVersion".
function leafPaths(obj: any, prefix = ''): string[] {
  const out: string[] = [];
  for (const k of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...leafPaths(v, path));
    else out.push(path);
  }
  return out.sort();
}

const pt = leafPaths(_translations.pt);
const en = leafPaths(_translations.en);
const es = leafPaths(_translations.es);

describe('i18n — chaves iguais nos 3 idiomas', () => {
  it('en tem exatamente as mesmas chaves de pt', () => {
    expect(en.filter(k => !pt.includes(k))).toEqual([]); // sobrando em en
    expect(pt.filter(k => !en.includes(k))).toEqual([]); // faltando em en
  });

  it('es tem exatamente as mesmas chaves de pt', () => {
    expect(es.filter(k => !pt.includes(k))).toEqual([]);
    expect(pt.filter(k => !es.includes(k))).toEqual([]);
  });

  it('as chaves novas de "Sobre" existem nos 3', () => {
    for (const key of ['aboutVersion', 'aboutTagline', 'aboutDevelopedBy', 'aboutViewTerms', 'aboutRights', 'termsCloseBtn']) {
      expect(pt).toContain(`settings.${key}`);
      expect(en).toContain(`settings.${key}`);
      expect(es).toContain(`settings.${key}`);
    }
  });
});
