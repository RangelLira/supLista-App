# TaskFlowV3 — Checklist de Testes Manuais

**Versão testada:** ___________  
**Data do teste:** ___________  
**Testador(a):** ___________  
**Dispositivo:** ___________  (ex: Pixel 7 Android 14 / iPhone 15 iOS 17)  
**Resultado geral:** ☐ APROVADO  ☐ REPROVADO  ☐ PARCIALMENTE APROVADO

---

## Legenda
- ☐ Não testado
- ✅ Passou
- ❌ Falhou
- ⚠️ Passou com ressalvas (anotar abaixo)

---

## 1. INICIALIZAÇÃO E ONBOARDING

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 1.1 | App abre sem crashar na primeira vez (storage limpo) | ☐ | |
| 1.2 | Tela de onboarding aparece na primeira vez | ☐ | |
| 1.3 | Campo de nome do usuário é obrigatório — não avança sem preencher | ☐ | |
| 1.4 | Nome salvo aparece no dashboard ("Olá Fulano,") | ☐ | |
| 1.5 | Onboarding não aparece na segunda abertura | ☐ | |
| 1.6 | App abre direto na tela Hoje após onboarding | ☐ | |
| 1.7 | Injetar banco de dados artificial via seedLoader e verificar que app carrega dados | ☐ | |
| 1.8 | Auto-migração de eventos vencidos → pendências executa no startup | ☐ | |
| 1.9 | Cleanup de itens concluídos antigos executa no startup (conforme política configurada) | ☐ | |

---

## 2. NAVEGAÇÃO ENTRE TELAS

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 2.1 | Tab "Eventos" (hoje) abre tela correta | ☐ | |
| 2.2 | Tab "Calendário" abre tela correta | ☐ | |
| 2.3 | Tab "Listas" abre tela correta | ☐ | |
| 2.4 | Tab "Pendências" abre tela correta | ☐ | |
| 2.5 | Tab "Config" abre tela correta | ☐ | |
| 2.6 | Botão voltar Android (hardware) fecha modais sem crashar | ☐ | |
| 2.7 | Botão "← Voltar" em TaskDetailScreen retorna à tela anterior | ☐ | |
| 2.8 | Todos os headers têm aparência idêntica (altura, padding, sem elementos extras) | ☐ | |

---

## 3. TELA HOJE (HOME SCREEN)

### 3.1 Dashboard Principal (Overview)

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 3.1.1 | Exibe saudação com nome do usuário | ☐ | |
| 3.1.2 | Exibe contagem de eventos de hoje | ☐ | |
| 3.1.3 | Exibe contagem de rotinas de hoje | ☐ | |
| 3.1.4 | Bloco "MEUS COMPROMISSOS" exibe apenas eventos do dia atual | ☐ | |
| 3.1.5 | Bloco "MINHAS ROTINAS" exibe apenas rotinas do dia atual | ☐ | |
| 3.1.6 | Quando não há eventos nem rotinas: exibe mensagem "Tudo em paz!" | ☐ | |
| 3.1.7 | Animação de entrada executa apenas uma vez por sessão | ☐ | |
| 3.1.8 | Duplo-tap em data do calendário navega para essa data na tela Hoje | ☐ | |

### 3.2 Hydration Tracker

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 3.2.1 | Widget de hidratação aparece quando habilitado nas configurações | ☐ | |
| 3.2.2 | Widget não aparece quando desabilitado | ☐ | |
| 3.2.3 | Botão "+" registra 250ml e atualiza barra de progresso | ☐ | |
| 3.2.4 | Meta diária configurável (padrão 2000ml) é respeitada | ☐ | |
| 3.2.5 | Progresso reseta à meia-noite (novo dia) | ☐ | |

### 3.3 Cards de Evento (na tela Hoje)

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 3.3.1 | Tap no card abre TaskDetailScreen | ☐ | |
| 3.3.2 | Swipe direito → conclui o evento | ☐ | |
| 3.3.3 | Swipe esquerdo → exclui com confirmação | ☐ | |
| 3.3.4 | Badge 🔗 aparece quando evento tem lista vinculada | ☐ | |
| 3.3.5 | Badge 📝 aparece quando evento tem anotações | ☐ | |
| 3.3.6 | Badge 👥 aparece quando evento está compartilhado | ☐ | |

---

## 4. CRIAÇÃO DE EVENTOS

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 4.1 | Botão "Novo Evento" abre formulário | ☐ | |
| 4.2 | Campo título é obrigatório — não salva sem preencher | ☐ | |
| 4.3 | Campo tag é selecionável | ☐ | |
| 4.4 | Data e hora podem ser selecionadas via picker | ☐ | |
| 4.5 | Opção "Dia Todo" remove o campo de hora | ☐ | |
| 4.6 | Evento salvo aparece na lista correta (hoje ou calendário) | ☐ | |
| 4.7 | Detecção automática de data no título funciona (ex: "Reunião 25/12") | ☐ | |
| 4.8 | Campo de anotações (notas) salva texto corretamente | ☐ | |
| 4.9 | Evento pré-preenchido (isPreFilled) aparece com dados preenchidos | ☐ | |
| 4.10 | Cancelar formulário não salva dados | ☐ | |
| 4.11 | Botão voltar Android fecha formulário sem salvar | ☐ | |

---

## 5. EDIÇÃO DE EVENTOS

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 5.1 | Botão Editar em TaskDetailScreen abre formulário com dados preenchidos | ☐ | |
| 5.2 | Alterar título e salvar reflete na lista | ☐ | |
| 5.3 | Alterar data/hora e salvar reflete no calendário | ☐ | |
| 5.4 | Alterar tag e salvar reflete no card | ☐ | |
| 5.5 | Evento editado mantém anotações existentes | ☐ | |
| 5.6 | Evento editado mantém lista vinculada | ☐ | |

---

## 6. CONCLUSÃO E REABERTURA DE EVENTOS

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 6.1 | Botão "Concluir" marca evento como concluído | ☐ | |
| 6.2 | Evento concluído move para seção "Concluídas" | ☐ | |
| 6.3 | completedAt é salvo com timestamp correto | ☐ | |
| 6.4 | Botão "Reabrir" reabre evento concluído com data futura | ☐ | |
| 6.5 | Reabrir evento com data passada + autoMigração ON → mostra Alert com opções | ☐ | |
| 6.6 | Alert de reabrir: "Mover para Pendências" → vira pendência | ☐ | |
| 6.7 | Alert de reabrir: "Reagendar" → abre formulário de edição | ☐ | |
| 6.8 | Reabrir evento com data passada + autoMigração OFF → reabre normalmente | ☐ | |
| 6.9 | Swipe direito em evento ativo → conclui | ☐ | |
| 6.10 | Swipe direito em evento concluído → reabre | ☐ | |

---

## 7. EXCLUSÃO DE EVENTOS

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 7.1 | Botão Excluir em TaskDetailScreen mostra confirmação | ☐ | |
| 7.2 | Confirmar exclusão remove o evento da lista | ☐ | |
| 7.3 | Cancelar exclusão mantém o evento | ☐ | |
| 7.4 | Swipe esquerdo mostra confirmação de exclusão | ☐ | |
| 7.5 | Excluir evento com lista vinculada: desvínculo da lista ocorre | ☐ | |

---

## 8. ADIAMENTO DE EVENTOS

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 8.1 | Botão "Adiar" em TaskDetailScreen (evento ativo) move para pendências | ☐ | |
| 8.2 | Evento adiado: is_pending=true, start_time=null | ☐ | |
| 8.3 | Evento adiado aparece na tela de Pendências | ☐ | |
| 8.4 | Evento adiado não aparece mais no calendário | ☐ | |
| 8.5 | Notas e vínculo de lista são preservados após adiar | ☐ | |

---

## 9. PENDÊNCIAS

### 9.1 Criação e Gestão

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 9.1.1 | Botão "Nova Pendência" abre formulário | ☐ | |
| 9.1.2 | Nome é obrigatório | ☐ | |
| 9.1.3 | Não permite pendência com nome duplicado | ☐ | |
| 9.1.4 | Pendência salva aparece na lista | ☐ | |
| 9.1.5 | Seção "CONCLUÍDAS" agrupa pendências concluídas | ☐ | |
| 9.1.6 | Swipe direito conclui pendência | ☐ | |
| 9.1.7 | Swipe esquerdo exclui com confirmação | ☐ | |

### 9.2 Agendamento de Pendência

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 9.2.1 | Botão "Agendar" em TaskDetailScreen (pendência) abre seleção de data | ☐ | |
| 9.2.2 | Selecionar data converte pendência em evento agendado | ☐ | |
| 9.2.3 | Evento agendado aparece no calendário na data correta | ☐ | |
| 9.2.4 | isScheduledFromPending=true no evento agendado | ☐ | |

---

## 10. ROTINAS

### 10.1 Criação de Rotinas

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 10.1.1 | Botão de adicionar rotina abre formulário | ☐ | |
| 10.1.2 | Tipo "Diária" cria ocorrências todos os dias | ☐ | |
| 10.1.3 | Tipo "Semanal" com dias selecionados cria ocorrências apenas nesses dias | ☐ | |
| 10.1.4 | Tipo "Mensal" cria ocorrência no dia configurado de cada mês | ☐ | |
| 10.1.5 | Tipo "Anual" cria ocorrência anual | ☐ | |
| 10.1.6 | Tipo "Personalizado" (ex: a cada 2 semanas) cria ocorrências corretas | ☐ | |
| 10.1.7 | Rotina com hora "Dia Todo" (sem hora) exibe sem horário | ☐ | |
| 10.1.8 | Data de fim é gerada automaticamente (máx. 2 anos) | ☐ | |

### 10.2 Conclusão de Instância de Rotina

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 10.2.1 | Swipe direito em instância de rotina → conclui | ☐ | |
| 10.2.2 | Instância concluída é adicionada a completed_instances | ☐ | |
| 10.2.3 | Desconcluir instância remove de completed_instances | ☐ | |
| 10.2.4 | Concluir uma instância não afeta outras datas | ☐ | |

### 10.3 Suspender / Retomar Rotina

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 10.3.1 | Botão "Suspender" em TaskDetailScreen (rotina) suspende a rotina | ☐ | |
| 10.3.2 | Rotina suspensa: instâncias futuras aparecem como "SUSPENSA" | ☐ | |
| 10.3.3 | Instâncias passadas (antes da suspensão) não são afetadas | ☐ | |
| 10.3.4 | Botão "Retomar" remove suspensão | ☐ | |
| 10.3.5 | Rotina retomada volta a aparecer normalmente | ☐ | |

---

## 11. LISTAS DE COMPRAS E TAREFAS

### 11.1 Criação de Listas

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 11.1.1 | Botão "Nova Lista" abre formulário | ☐ | |
| 11.1.2 | Tipo "Compras" e "Tarefas" são selecionáveis | ☐ | |
| 11.1.3 | Nome da lista é obrigatório | ☐ | |
| 11.1.4 | Adicionar itens no formulário de criação | ☐ | |
| 11.1.5 | Lista salva aparece na tela de Listas | ☐ | |

### 11.2 Gestão de Itens

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 11.2.1 | Adicionar item com nome, quantidade, unidade e preço | ☐ | |
| 11.2.2 | Marcar item como checked | ☐ | |
| 11.2.3 | Desmarcar item checked | ☐ | |
| 11.2.4 | Excluir item da lista | ☐ | |
| 11.2.5 | Total da lista calcula corretamente (qty × preço) | ☐ | |
| 11.2.6 | priceType "unit" multiplica por quantidade | ☐ | |
| 11.2.7 | priceType "total" usa o valor como total | ☐ | |
| 11.2.8 | Herança de lista anterior importa itens corretamente | ☐ | |

### 11.3 Modo Compras

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 11.3.1 | Toggle "Modo Compras" ativa visualização especial | ☐ | |
| 11.3.2 | Total exibido reflete apenas itens checados | ☐ | |
| 11.3.3 | totalSpent é atualizado ao finalizar lista no modo compras | ☐ | |

### 11.4 Anotações de Lista

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 11.4.1 | Toggle "Anotações/Itens" alterna entre as views | ☐ | |
| 11.4.2 | Campo de texto em Anotações salva ao sair da tela | ☐ | |
| 11.4.3 | Anotação aparece no campo na próxima abertura | ☐ | |

### 11.5 Conclusão e Arquivamento de Listas

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 11.5.1 | Botão "Concluir" marca lista como concluída | ☐ | |
| 11.5.2 | Lista concluída move para seção "CONCLUÍDAS / ARQUIVADAS" | ☐ | |
| 11.5.3 | Botão "Arquivar" em lista concluída → isArchived=true | ☐ | |
| 11.5.4 | Lista arquivada aparece filtrada nas configurações | ☐ | |
| 11.5.5 | Reabrir lista concluída → volta para ativas | ☐ | |

---

## 12. VINCULAÇÃO (Listas ↔ Eventos/Pendências)

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 12.1 | Botão "Vincular Lista" em TaskDetailScreen (evento) abre seletor | ☐ | |
| 12.2 | Selecionar lista vincula bidirecialmente (evento.linkedListId e lista.linkedEventId) | ☐ | |
| 12.3 | Badge 🔗 aparece no card do evento após vínculo | ☐ | |
| 12.4 | Badge 🔗 aparece no card da lista após vínculo | ☐ | |
| 12.5 | Botão "Ver lista" abre a lista vinculada | ☐ | |
| 12.6 | Botão "Desvincular" remove vínculo dos dois lados | ☐ | |
| 12.7 | Vincular pendência a lista funciona da mesma forma | ☐ | |
| 12.8 | Vincular rotina (instância) a lista funciona | ☐ | |
| 12.9 | Criar nova lista diretamente da tela de detalhes e vincular | ☐ | |
| 12.10 | Excluir evento com lista vinculada: lista perde vínculo | ☐ | |
| 12.11 | Excluir lista vinculada a evento: evento perde vínculo | ☐ | |

---

## 13. ANOTAÇÕES EM EVENTOS E ROTINAS

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 13.1 | Campo de notas em TaskDetailScreen é editável | ☐ | |
| 13.2 | Notas salvas persistem após fechar e reabrir o item | ☐ | |
| 13.3 | Múltiplas linhas de anotação são suportadas | ☐ | |
| 13.4 | Notas em rotina são compartilhadas entre todas as instâncias | ☐ | |
| 13.5 | Anotações de rotinas aparecem em TaskDetailScreen | ☐ | |
| 13.6 | Badge 📝 aparece em cards com anotações | ☐ | |

---

## 14. CALENDÁRIO

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 14.1 | Calendário exibe eventos na data correta | ☐ | |
| 14.2 | Calendário exibe rotinas nas datas corretas | ☐ | |
| 14.3 | Navegar para mês anterior e posterior | ☐ | |
| 14.4 | Tap em data filtra eventos/rotinas daquele dia | ☐ | |
| 14.5 | Duplo-tap em data navega para HomeScreen com aquela data | ☐ | |
| 14.6 | Botão "Ir para Hoje" retorna ao mês atual | ☐ | |
| 14.7 | Dias com eventos têm indicador visual | ☐ | |
| 14.8 | Eventos "Dia Todo" aparecem sem horário | ☐ | |
| 14.9 | Carrossel de dias mostra eventos do dia selecionado | ☐ | |
| 14.10 | Busca de evento (SearchModal) encontra por título parcial | ☐ | |

---

## 15. COMPARTILHAMENTO (FIRESTORE)

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 15.1 | Compartilhamento requer que o usuário esteja logado (Firebase Auth) | ☐ | |
| 15.2 | Criar código de convite (8 chars, único) | ☐ | |
| 15.3 | Conectar com parceiro via código de convite | ☐ | |
| 15.4 | Compartilhar evento: aparece no dispositivo do parceiro | ☐ | |
| 15.5 | Atualizar evento compartilhado: parceiro recebe atualização em tempo real | ☐ | |
| 15.6 | Descompartilhar evento: some do dispositivo do parceiro | ☐ | |
| 15.7 | Sair do compartilhamento: remove todos os dados compartilhados | ☐ | |
| 15.8 | Indicador de sincronização aparece durante operações Firestore | ☐ | |
| 15.9 | Badge 👥 aparece em itens compartilhados | ☐ | |

---

## 16. CONFIGURAÇÕES

### 16.1 Aparência

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 16.1.1 | Tema "Escuro" aplica cores escuras | ☐ | |
| 16.1.2 | Tema "Claro" aplica cores claras | ☐ | |
| 16.1.3 | Tema "Auto" segue tema do sistema | ☐ | |
| 16.1.4 | Mudança de tema é aplicada imediatamente sem reiniciar | ☐ | |

### 16.2 Idioma

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 16.2.1 | Português: todas as strings em PT | ☐ | |
| 16.2.2 | English: todas as strings em EN | ☐ | |
| 16.2.3 | Español: todas as strings em ES | ☐ | |
| 16.2.4 | Mudança de idioma aplica imediatamente | ☐ | |
| 16.2.5 | Nenhuma string hardcoded encontrada (buscar visualmente) | ☐ | |

### 16.3 Auto-Exclusão

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 16.3.1 | Política "Nunca" para eventos não exclui nada | ☐ | |
| 16.3.2 | Política "1 Dia" exclui eventos concluídos há mais de 24h | ☐ | |
| 16.3.3 | Política "1 Semana" exclui após 7 dias | ☐ | |
| 16.3.4 | Política "1 Mês" exclui após 30 dias | ☐ | |
| 16.3.5 | Política independente para eventos x pendências | ☐ | |
| 16.3.6 | Política independente para rotinas | ☐ | |
| 16.3.7 | Política independente para listas | ☐ | |
| 16.3.8 | Ação "Arquivar" para listas arquiva ao invés de excluir | ☐ | |
| 16.3.9 | Ação "Excluir" para listas remove permanentemente | ☐ | |

### 16.4 Notificações Locais

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 16.4.1 | Ativar notificações solicita permissão | ☐ | |
| 16.4.2 | Negar permissão reverte toggle para OFF | ☐ | |
| 16.4.3 | Modo "Resumo Diário": 1 notificação/dia no horário configurado | ☐ | |
| 16.4.4 | Modo "Por Evento": notificação X minutos antes de cada evento | ☐ | |
| 16.4.5 | Horário de notificação é configurável | ☐ | |
| 16.4.6 | Antecedência em minutos é configurável (modo per-event) | ☐ | |
| 16.4.7 | Eventos "Dia Todo" notificados no horário matinal | ☐ | |
| 16.4.8 | Criar evento reagenda notificações | ☐ | |
| 16.4.9 | Excluir evento cancela notificação correspondente | ☐ | |
| 16.4.10 | Concluir evento cancela notificação correspondente | ☐ | |

### 16.5 Hidratação

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 16.5.1 | Ativar hidratação mostra widget na tela Hoje | ☐ | |
| 16.5.2 | Meta diária em ml é configurável | ☐ | |
| 16.5.3 | Intervalo de lembrete é configurável | ☐ | |
| 16.5.4 | Horário de início e fim do lembrete são configuráveis | ☐ | |
| 16.5.5 | 0 minutos de intervalo desativa lembretes | ☐ | |

### 16.6 Perfil de Usuário

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 16.6.1 | Nome de exibição editável nas configurações | ☐ | |
| 16.6.2 | Nome alterado aparece imediatamente na saudação | ☐ | |
| 16.6.3 | Auto-migração de eventos ativa/inativa conforme configuração | ☐ | |

### 16.7 Listas Arquivadas

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 16.7.1 | Lista de listas arquivadas exibe listas com isArchived=true | ☐ | |
| 16.7.2 | Possível desarquivar lista | ☐ | |

---

## 17. TASK DETAIL SCREEN (Tela de Detalhe)

### 17.1 Layout Geral

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 17.1.1 | Título do item exibido corretamente | ☐ | |
| 17.1.2 | Tag exibida como badge colorido | ☐ | |
| 17.1.3 | Área de notas editável (textarea flex) | ☐ | |
| 17.1.4 | Barra de ações fixa no rodapé (não sobrepõe conteúdo) | ☐ | |
| 17.1.5 | Scroll funciona sem overlap com barra de ações | ☐ | |
| 17.1.6 | paddingBottom 240 no conteúdo evita sobreposição | ☐ | |

### 17.2 Grid de Ações — Pendência Ativa

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 17.2.1 | Row 1: Agendar \| Vincular/Desvincular \| Compartilhar | ☐ | |
| 17.2.2 | Row 2: Editar \| Excluir \| Concluir | ☐ | |
| 17.2.3 | Nenhum emoji nos botões | ☐ | |

### 17.3 Grid de Ações — Evento Ativo

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 17.3.1 | Row 1: Adiar \| Vincular/Desvincular \| Compartilhar | ☐ | |
| 17.3.2 | Row 2: Editar \| Excluir \| Concluir | ☐ | |

### 17.4 Grid de Ações — Rotina Ativa

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 17.4.1 | Row 1: Suspender/Retomar \| Vincular/Desvincular \| Compartilhar | ☐ | |
| 17.4.2 | Row 2: Editar \| Excluir \| Concluir | ☐ | |

### 17.5 Grid de Ações — Item Concluído

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 17.5.1 | Row 2: Editar (desabilitado) \| Excluir \| Reabrir | ☐ | |
| 17.5.2 | Botão Editar visualmente desabilitado (não funciona) | ☐ | |
| 17.5.3 | Botão Reabrir funciona corretamente | ☐ | |

---

## 18. TESTES DE REGRESSÃO

### 18.1 Dados Persistem Após Fechar e Abrir App

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 18.1.1 | Eventos criados persistem após reiniciar app | ☐ | |
| 18.1.2 | Pendências criadas persistem | ☐ | |
| 18.1.3 | Listas criadas persistem | ☐ | |
| 18.1.4 | Rotinas criadas persistem | ☐ | |
| 18.1.5 | Configurações persistem | ☐ | |
| 18.1.6 | Estado de conclusão de instâncias de rotina persiste | ☐ | |

### 18.2 Banco de Dados Artificial (Seed)

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 18.2.1 | Injetar seedDatabase → app carrega 500+ registros sem crash | ☐ | |
| 18.2.2 | Scroll fluido na tela Pendências com 120+ itens | ☐ | |
| 18.2.3 | Scroll fluido na tela Listas com 16+ listas | ☐ | |
| 18.2.4 | Calendário renderiza corretamente com 30+ eventos no mês | ☐ | |
| 18.2.5 | Auto-migração de eventos vencidos do seed funciona | ☐ | |

---

## 19. TESTES DE EDGE CASES

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 19.1 | Evento sem título: formulário bloqueia envio | ☐ | |
| 19.2 | Lista sem nome: formulário bloqueia envio | ☐ | |
| 19.3 | Rotina com weekdays vazio: não cria ocorrências | ☐ | |
| 19.4 | Rotina mensal no dia 31 em fevereiro: ajusta para dia 28 | ☐ | |
| 19.5 | Notas com texto muito longo: textarea expande sem overflow | ☐ | |
| 19.6 | Muitos itens em lista (50+): scroll funciona | ☐ | |
| 19.7 | Completar todos os eventos do dia: mensagem "Tudo em paz!" | ☐ | |
| 19.8 | App sem conexão: dados locais continuam funcionando | ☐ | |
| 19.9 | Dados migrados de versão antiga (schema v1.x) carregam corretamente | ☐ | |
| 19.10 | sharedWith[] legado migrado para sharedWithUid | ☐ | |
| 19.11 | Criar 2 pendências com o mesmo nome: alerta de duplicata | ☐ | |
| 19.12 | Swipe simultâneo em múltiplos cards: não causa estado inconsistente | ☐ | |

---

## 20. PERFORMANCE E UX

| # | Teste | Resultado | Observações |
|---|-------|-----------|-------------|
| 20.1 | App abre em menos de 3 segundos (cold start) | ☐ | |
| 20.2 | Nenhum layout shift visível durante carregamento | ☐ | |
| 20.3 | Animações a 60fps (sem jank) | ☐ | |
| 20.4 | Swipe de cards suave sem travamentos | ☐ | |
| 20.5 | Todos os headers idênticos em todas as telas (regra de acessibilidade ADHD) | ☐ | |
| 20.6 | Cards de evento são não-expansíveis (single-line) | ☐ | |
| 20.7 | Calendário não causa lag ao navegar entre meses | ☐ | |
| 20.8 | Digitação nas anotações sem lag (TextInput responsivo) | ☐ | |

---

## Sumário de Bugs Encontrados

| # | Tela/Funcionalidade | Descrição do Bug | Severidade | Status |
|---|---------------------|-----------------|------------|--------|
| | | | | |
| | | | | |
| | | | | |

**Severidade:** 🔴 Crítico \| 🟠 Alto \| 🟡 Médio \| 🟢 Baixo

---

## Assinatura

**Testador(a):** _______________________  
**Data:** _______________________  
**Aprovado por:** _______________________
