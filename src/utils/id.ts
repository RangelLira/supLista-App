// ===========================
// GERAÇÃO DE IDs
// ===========================
// IDs são timestamps em ms, mas Date.now() colide quando dois registros nascem
// no mesmo milissegundo (criar lista + item, herdar vários itens, toques rápidos).
// nextId() é estritamente crescente e único dentro da sessão: usa Date.now()
// quando o relógio avançou, senão incrementa 1 sobre o último emitido.
// Entre sessões não colide: o relógio sempre avança, então o Date.now() de uma
// nova sessão é maior que qualquer id emitido antes.

let lastId = 0;

export function nextId(): number {
  const now = Date.now();
  lastId = now > lastId ? now : lastId + 1;
  return lastId;
}
