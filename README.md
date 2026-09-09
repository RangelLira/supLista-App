# supLista

Aplicativo de **listas de compras e tarefas** para Android e iOS. Simples, rápido,
sem anúncios, sem rastreamento e de código aberto.

Feito com React Native. As listas ficam no seu aparelho; o compartilhamento em
tempo real com outra pessoa é **opcional** e usa Firebase.

- **Licença:** [MIT](LICENSE)
- **Política de Privacidade:** https://rangellira.github.io/supLista-App/privacy.html
- **Desenvolvido por:** Contest Software · contato.contestsoftware@gmail.com

> **Status:** em preparação para o primeiro lançamento na Google Play.

---

## Funcionalidades

- Listas de **compras** (com quantidade, unidade e preço opcional por item) e de **tarefas**
- Marcar itens, concluir e reabrir listas
- Anotações em texto livre por lista
- Renomear listas, reordenação estável (listas concluídas não "pulam" de lugar)
- Tema **claro / escuro / automático** + 4 cores de destaque
- 3 idiomas: **português, inglês e espanhol**
- **Compartilhamento em tempo real** de uma lista com outra pessoa (opcional):
  conexão por código de convite, edição colaborativa dos dois lados, o dono controla
  exclusão e encerramento
- Funciona **offline**; os dados de compartilhamento sincronizam quando há rede

Não tem: backup em nuvem, notificações, conta obrigatória, anúncios, telemetria.

---

## Stack

| | |
|---|---|
| Framework | React Native 0.80 (nova arquitetura), React 19, TypeScript |
| Estado | Nenhuma biblioteca externa — `App.tsx` é a fonte única da verdade |
| Persistência local | `@react-native-async-storage/async-storage` |
| Compartilhamento | Firebase Authentication (anônimo + Google) e Cloud Firestore |
| Navegação | Manual (sem biblioteca de navegação) |

---

## Rodando o projeto

### Pré-requisitos

- Node.js ≥ 18
- Ambiente React Native configurado ([guia oficial](https://reactnative.dev/docs/set-up-your-environment))
- Android: JDK 17 + Android SDK. iOS: macOS + Xcode + CocoaPods

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o Firebase (necessário para login e compartilhamento)
#    Crie um projeto no Firebase, registre um app Android e um iOS, e coloque:
#      android/app/google-services.json
#      ios/<pasta do app>/GoogleService-Info.plist
#    Ajuste o webClientId em src/contexts/FirebaseContext.tsx com o OAuth
#    web client do seu projeto. Publique as regras de firestore.rules.
#    (O app abre sem isso; só o login/compartilhamento fica indisponível.)

# 3. Iniciar o Metro
npm start

# 4. Em outro terminal
npm run android
# ou
npm run ios
```

### Windows

`npm run android` pode falhar com `'gradlew.bat' não é reconhecido...` (regressão do
`spawn` do Node com arquivos `.bat`). Alternativa: com o Metro rodando, na pasta `android/`:

```powershell
.\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
adb shell am start -n com.contestsoftware.suplista/com.contestsoftware.suplista.MainActivity
# se aparecer "Could not connect to development server":
adb reverse tcp:8081 tcp:8081
```

### iOS — primeira execução

```bash
bundle install
bundle exec pod install
```

---

## Scripts

```bash
npm start          # Metro bundler
npm run android    # build + instalar no Android
npm run ios        # build + instalar no iOS
npm run lint       # ESLint
npm test           # Jest
```

---

## Estrutura

```
App.tsx                  Estado global + handlers de todas as mutações
src/
  screens/               Telas (Listas, Configurações, Onboarding)
  components/             Componentes (ShoppingList, TagPicker, formulários/modais)
  contexts/              ThemeContext, LanguageContext, FirebaseContext
  utils/                 storage (AsyncStorage), firestore (sync), schemaUtils
  types/                 Modelo de dados (ShoppingList, ListItem)
  styles/               theme.ts — todas as cores e estilos reutilizáveis
  content/              Textos longos (Termos de Uso)
firestore.rules          Regras de segurança do Cloud Firestore
docs/                    Site estático (GitHub Pages): política de privacidade
```

Detalhes de arquitetura para quem for mexer no código estão em [`CLAUDE.md`](CLAUDE.md).

---

## Privacidade

O supLista trata o mínimo de dados possível. Um resumo:

- Suas listas ficam **no aparelho**. Só vão para a internet as listas que **você** compartilha.
- A conta é anônima por padrão. O login com Google é opcional e serve para te
  identificar para quem você compartilha listas.
- Sem anúncios, sem identificadores de publicidade, sem telemetria.

Texto completo: **https://rangellira.github.io/supLista-App/privacy.html**

---

## Contribuindo

Issues e pull requests são bem-vindos. Antes de um PR grande, abra uma issue para
alinhar a proposta. Rode `npm run lint` e `npm test` antes de enviar.

---

## Licença

[MIT](LICENSE) © 2026 Contest Software
