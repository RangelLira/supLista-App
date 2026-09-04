// ===========================
// TERMOS DE USO — TASKFLOW
// ===========================

export const termsOfService: Record<'pt' | 'en' | 'es', string> = {

  pt: `TERMOS DE USO — TASKFLOW
Versão 1.0 — Junho de 2026

Leia atentamente estes Termos de Uso antes de utilizar o aplicativo TaskFlow. Ao aceitar, você concorda com todas as condições descritas abaixo.

─────────────────────────────────
1. ACEITAÇÃO DOS TERMOS
─────────────────────────────────
O uso do TaskFlow implica a aceitação integral destes Termos de Uso. Caso não concorde com alguma das condições, não utilize o aplicativo.

Estes termos podem ser atualizados periodicamente. Notificaremos sobre alterações relevantes. O uso continuado do app após as mudanças constitui aceitação das novas condições.

─────────────────────────────────
2. DESCRIÇÃO DO SERVIÇO
─────────────────────────────────
O TaskFlow é um aplicativo de produtividade pessoal que permite ao usuário organizar compromissos, pendências, listas e rotinas. O aplicativo funciona primariamente de forma offline, com funcionalidades opcionais de compartilhamento em nuvem via Firebase (Google).

O TaskFlow é oferecido gratuitamente. Funcionalidades adicionais podem ser introduzidas futuramente, com ou sem custo.

─────────────────────────────────
3. CONTA E DADOS DO USUÁRIO
─────────────────────────────────
3.1 Dados locais
Todos os seus dados (eventos, listas, pendências, rotinas) são armazenados localmente no seu dispositivo via AsyncStorage. O aplicativo não coleta nem transmite esses dados sem sua autorização explícita.

3.2 Conta Google (opcional)
Se você optar por conectar sua conta Google, seu nome de exibição será utilizado para personalização. O identificador único gerado pelo Firebase Auth (UID) é usado para operações de compartilhamento. Nenhuma senha é armazenada pelo TaskFlow.

3.3 Compartilhamento
Ao usar a função de compartilhamento, os itens selecionados são enviados ao serviço Firebase Firestore. Você controla o que é compartilhado e com quem. Você pode desativar o compartilhamento a qualquer momento em Configurações.

3.4 Backup em nuvem (opcional)
Se ativado, seus dados são enviados ao Firebase Firestore vinculado à sua conta Google. Você pode desativar o backup ou excluir seus dados remotos a qualquer momento.

─────────────────────────────────
4. USO ACEITÁVEL
─────────────────────────────────
Você concorda em utilizar o TaskFlow exclusivamente para fins pessoais e lícitos. É proibido:

• Utilizar o aplicativo para armazenar ou compartilhar conteúdo ilegal, ofensivo ou que viole direitos de terceiros;
• Tentar acessar dados de outros usuários sem autorização;
• Realizar engenharia reversa, descompilar ou modificar o aplicativo;
• Usar o aplicativo de forma que possa causar danos a outros usuários ou à infraestrutura do serviço.

─────────────────────────────────
5. PRIVACIDADE
─────────────────────────────────
O TaskFlow respeita sua privacidade. Os dados inseridos no aplicativo são de sua propriedade e responsabilidade. Não vendemos nem compartilhamos suas informações com terceiros para fins comerciais.

Ao usar funcionalidades online (compartilhamento, backup em nuvem), parte dos seus dados transitará pelos servidores do Firebase (Google LLC). O uso desses serviços está sujeito à Política de Privacidade do Google, disponível em: https://policies.google.com/privacy

─────────────────────────────────
6. BACKUP E PERDA DE DADOS
─────────────────────────────────
O TaskFlow não garante a disponibilidade contínua do armazenamento local ou dos serviços em nuvem. Recomendamos que você realize backups periódicos dos seus dados.

Não nos responsabilizamos por perda de dados decorrente de:
• Desinstalação do aplicativo sem backup prévio;
• Falha, reset ou troca de dispositivo;
• Interrupção dos serviços Firebase (Google);
• Bugs ou falhas inesperadas do aplicativo.

─────────────────────────────────
7. PROPRIEDADE INTELECTUAL
─────────────────────────────────
O TaskFlow, incluindo seu código-fonte, design, logotipos e conteúdo, é protegido por direitos autorais. Todos os direitos não expressamente concedidos nestes Termos são reservados ao desenvolvedor.

O conteúdo inserido pelo usuário (títulos de eventos, notas, listas) permanece de propriedade do usuário.

─────────────────────────────────
8. LIMITAÇÃO DE RESPONSABILIDADE
─────────────────────────────────
O TaskFlow é fornecido "no estado em que se encontra", sem garantias expressas ou implícitas de qualquer tipo, incluindo, mas não se limitando a, garantias de comercialização, adequação a uma finalidade específica ou não violação.

Em nenhuma circunstância o desenvolvedor será responsável por danos diretos, indiretos, incidentais, especiais ou consequenciais decorrentes do uso ou da impossibilidade de uso do aplicativo.

─────────────────────────────────
9. MODIFICAÇÕES E ENCERRAMENTO
─────────────────────────────────
O desenvolvedor reserva o direito de modificar, suspender ou encerrar o aplicativo a qualquer momento, com ou sem aviso prévio. Não nos responsabilizamos por qualquer prejuízo decorrente dessas ações.

─────────────────────────────────
10. CONTATO
─────────────────────────────────
Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail: lira_coast@hotmail.com

Ao tocar em "Li e aceito os Termos de Uso", você declara ter lido, compreendido e concordado com todas as condições acima.`,

// ─────────────────────────────────────────────────────────────────────────────

  en: `TERMS OF USE — TASKFLOW
Version 1.0 — June 2026

Please read these Terms of Use carefully before using the TaskFlow application. By accepting, you agree to all the conditions described below.

─────────────────────────────────
1. ACCEPTANCE OF TERMS
─────────────────────────────────
Using TaskFlow implies full acceptance of these Terms of Use. If you do not agree with any of the conditions, do not use the application.

These terms may be updated periodically. We will notify you of relevant changes. Continued use of the app after changes constitutes acceptance of the new terms.

─────────────────────────────────
2. DESCRIPTION OF SERVICE
─────────────────────────────────
TaskFlow is a personal productivity application that allows users to organize appointments, pending tasks, lists, and routines. The app works primarily offline, with optional cloud sharing features via Firebase (Google).

TaskFlow is offered free of charge. Additional features may be introduced in the future, with or without cost.

─────────────────────────────────
3. USER ACCOUNT AND DATA
─────────────────────────────────
3.1 Local data
All your data (events, lists, pending items, routines) is stored locally on your device via AsyncStorage. The app does not collect or transmit this data without your explicit authorization.

3.2 Google Account (optional)
If you choose to connect your Google account, your display name will be used for personalization. The unique identifier generated by Firebase Auth (UID) is used for sharing operations. No passwords are stored by TaskFlow.

3.3 Sharing
When using the sharing feature, selected items are sent to the Firebase Firestore service. You control what is shared and with whom. You can disable sharing at any time in Settings.

3.4 Cloud backup (optional)
If enabled, your data is sent to Firebase Firestore linked to your Google account. You can disable backup or delete your remote data at any time.

─────────────────────────────────
4. ACCEPTABLE USE
─────────────────────────────────
You agree to use TaskFlow exclusively for personal and lawful purposes. It is prohibited to:

• Use the app to store or share illegal, offensive content, or content that violates third-party rights;
• Attempt to access other users' data without authorization;
• Reverse engineer, decompile, or modify the application;
• Use the app in a way that may harm other users or the service infrastructure.

─────────────────────────────────
5. PRIVACY
─────────────────────────────────
TaskFlow respects your privacy. The data you enter in the app belongs to you and is your responsibility. We do not sell or share your information with third parties for commercial purposes.

When using online features (sharing, cloud backup), some of your data will transit through Firebase servers (Google LLC). Use of these services is subject to Google's Privacy Policy, available at: https://policies.google.com/privacy

─────────────────────────────────
6. BACKUP AND DATA LOSS
─────────────────────────────────
TaskFlow does not guarantee the continuous availability of local storage or cloud services. We recommend that you perform periodic backups of your data.

We are not responsible for data loss resulting from:
• Uninstalling the app without a prior backup;
• Device failure, reset, or replacement;
• Firebase (Google) service interruption;
• Application bugs or unexpected failures.

─────────────────────────────────
7. INTELLECTUAL PROPERTY
─────────────────────────────────
TaskFlow, including its source code, design, logos, and content, is protected by copyright. All rights not expressly granted in these Terms are reserved by the developer.

Content entered by the user (event titles, notes, lists) remains the property of the user.

─────────────────────────────────
8. LIMITATION OF LIABILITY
─────────────────────────────────
TaskFlow is provided "as is", without express or implied warranties of any kind, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.

Under no circumstances shall the developer be liable for direct, indirect, incidental, special, or consequential damages arising from the use or inability to use the application.

─────────────────────────────────
9. CHANGES AND TERMINATION
─────────────────────────────────
The developer reserves the right to modify, suspend, or terminate the application at any time, with or without notice. We are not responsible for any damages arising from such actions.

─────────────────────────────────
10. CONTACT
─────────────────────────────────
For questions about these Terms of Use, please contact us at: lira_coast@hotmail.com

By tapping "I have read and accept the Terms of Use", you declare that you have read, understood, and agreed to all the conditions above.`,

// ─────────────────────────────────────────────────────────────────────────────

  es: `TÉRMINOS DE USO — TASKFLOW
Versión 1.0 — Junio de 2026

Lee atentamente estos Términos de Uso antes de utilizar la aplicación TaskFlow. Al aceptar, estás de acuerdo con todas las condiciones descritas a continuación.

─────────────────────────────────
1. ACEPTACIÓN DE LOS TÉRMINOS
─────────────────────────────────
El uso de TaskFlow implica la aceptación íntegra de estos Términos de Uso. Si no estás de acuerdo con alguna de las condiciones, no utilices la aplicación.

Estos términos pueden actualizarse periódicamente. Te notificaremos sobre cambios relevantes. El uso continuado de la app después de los cambios constituye la aceptación de las nuevas condiciones.

─────────────────────────────────
2. DESCRIPCIÓN DEL SERVICIO
─────────────────────────────────
TaskFlow es una aplicación de productividad personal que permite al usuario organizar compromisos, pendientes, listas y rutinas. La app funciona principalmente de forma offline, con funcionalidades opcionales de compartido en la nube a través de Firebase (Google).

TaskFlow se ofrece de forma gratuita. En el futuro pueden introducirse funcionalidades adicionales, con o sin costo.

─────────────────────────────────
3. CUENTA Y DATOS DEL USUARIO
─────────────────────────────────
3.1 Datos locales
Todos tus datos (eventos, listas, pendientes, rutinas) se almacenan localmente en tu dispositivo mediante AsyncStorage. La app no recopila ni transmite estos datos sin tu autorización explícita.

3.2 Cuenta de Google (opcional)
Si eliges conectar tu cuenta de Google, tu nombre para mostrar se utilizará para la personalización. El identificador único generado por Firebase Auth (UID) se usa para operaciones de compartido. TaskFlow no almacena contraseñas.

3.3 Compartición
Al usar la función de compartido, los elementos seleccionados se envían al servicio Firebase Firestore. Tú controlas qué se comparte y con quién. Puedes desactivar el compartido en cualquier momento en Configuración.

3.4 Copia de seguridad en la nube (opcional)
Si está activada, tus datos se envían a Firebase Firestore vinculado a tu cuenta de Google. Puedes desactivar la copia de seguridad o eliminar tus datos remotos en cualquier momento.

─────────────────────────────────
4. USO ACEPTABLE
─────────────────────────────────
Aceptas usar TaskFlow exclusivamente para fines personales y legales. Está prohibido:

• Usar la app para almacenar o compartir contenido ilegal, ofensivo o que viole derechos de terceros;
• Intentar acceder a los datos de otros usuarios sin autorización;
• Realizar ingeniería inversa, descompilar o modificar la aplicación;
• Usar la app de forma que pueda causar daños a otros usuarios o a la infraestructura del servicio.

─────────────────────────────────
5. PRIVACIDAD
─────────────────────────────────
TaskFlow respeta tu privacidad. Los datos que introduces en la app son de tu propiedad y responsabilidad. No vendemos ni compartimos tu información con terceros con fines comerciales.

Al usar funcionalidades online (compartido, copia de seguridad en la nube), parte de tus datos transitará por los servidores de Firebase (Google LLC). El uso de estos servicios está sujeto a la Política de Privacidad de Google, disponible en: https://policies.google.com/privacy

─────────────────────────────────
6. COPIA DE SEGURIDAD Y PÉRDIDA DE DATOS
─────────────────────────────────
TaskFlow no garantiza la disponibilidad continua del almacenamiento local ni de los servicios en la nube. Recomendamos que realices copias de seguridad periódicas de tus datos.

No somos responsables por la pérdida de datos derivada de:
• Desinstalación de la app sin copia de seguridad previa;
• Fallo, restablecimiento o cambio de dispositivo;
• Interrupción de los servicios Firebase (Google);
• Errores o fallos inesperados de la aplicación.

─────────────────────────────────
7. PROPIEDAD INTELECTUAL
─────────────────────────────────
TaskFlow, incluido su código fuente, diseño, logotipos y contenido, está protegido por derechos de autor. Todos los derechos no concedidos expresamente en estos Términos quedan reservados al desarrollador.

El contenido introducido por el usuario (títulos de eventos, notas, listas) sigue siendo propiedad del usuario.

─────────────────────────────────
8. LIMITACIÓN DE RESPONSABILIDAD
─────────────────────────────────
TaskFlow se proporciona "tal cual", sin garantías expresas o implícitas de ningún tipo, incluidas, entre otras, las garantías de comerciabilidad, adecuación para un propósito particular o no infracción.

En ningún caso el desarrollador será responsable por daños directos, indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso de la aplicación.

─────────────────────────────────
9. MODIFICACIONES Y TERMINACIÓN
─────────────────────────────────
El desarrollador se reserva el derecho de modificar, suspender o finalizar la aplicación en cualquier momento, con o sin previo aviso. No somos responsables por ningún perjuicio derivado de dichas acciones.

─────────────────────────────────
10. CONTACTO
─────────────────────────────────
Para preguntas sobre estos Términos de Uso, contáctanos en: lira_coast@hotmail.com

Al tocar "He leído y acepto los Términos de Uso", declaras haber leído, comprendido y aceptado todas las condiciones anteriores.`,
};
