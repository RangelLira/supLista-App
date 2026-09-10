// ===========================
// DEV — POOLS DE NOMES PARA GERAÇÃO DE DADOS FAKE
// ===========================
// Somente usado por src/dev/fakeData.ts, que só é carregado sob __DEV__.
// Nada aqui aparece em release.

export const GROCERY: string[] = [
  'Arroz branco 5kg', 'Feijão carioca 1kg', 'Feijão preto 1kg', 'Macarrão espaguete',
  'Macarrão parafuso', 'Óleo de soja', 'Azeite extra virgem', 'Sal refinado',
  'Açúcar refinado', 'Açúcar mascavo', 'Café torrado e moído 500g', 'Café solúvel',
  'Farinha de trigo', 'Farinha de mandioca', 'Fubá', 'Amido de milho',
  'Leite integral', 'Leite desnatado', 'Leite condensado', 'Creme de leite',
  'Iogurte natural', 'Iogurte grego', 'Requeijão cremoso', 'Queijo mussarela',
  'Queijo prato', 'Queijo parmesão ralado', 'Manteiga com sal', 'Margarina',
  'Ovos brancos dúzia', 'Pão de forma', 'Pão francês', 'Bisnaguinha',
  'Presunto fatiado', 'Peito de peru fatiado', 'Mortadela', 'Salsicha',
  'Linguiça toscana', 'Bacon em cubos', 'Carne moída', 'Patinho',
  'Alcatra', 'Coxão mole', 'Frango inteiro', 'Peito de frango',
  'Coxa e sobrecoxa', 'Filé de tilápia', 'Sardinha em lata', 'Atum em lata',
  'Tomate', 'Cebola', 'Alho', 'Batata inglesa', 'Batata doce', 'Cenoura',
  'Beterraba', 'Abobrinha', 'Chuchu', 'Pepino', 'Pimentão verde', 'Pimentão vermelho',
  'Alface crespa', 'Rúcula', 'Couve', 'Espinafre', 'Brócolis', 'Couve-flor',
  'Repolho', 'Abóbora cabotiá', 'Milho verde em lata', 'Ervilha em lata',
  'Banana prata', 'Banana nanica', 'Maçã gala', 'Maçã fuji', 'Laranja pera',
  'Mexerica', 'Limão taiti', 'Mamão formosa', 'Melancia', 'Melão',
  'Abacaxi', 'Manga palmer', 'Uva itália', 'Morango', 'Pera', 'Kiwi',
  'Maracujá', 'Abacate', 'Coco seco',
  'Refrigerante cola 2L', 'Refrigerante guaraná 2L', 'Suco de laranja integral',
  'Suco de uva integral', 'Água mineral 1,5L', 'Água com gás', 'Cerveja lata',
  'Vinho tinto seco', 'Energético', 'Achocolatado em pó', 'Chá de camomila',
  'Chá mate', 'Erva-mate para chimarrão',
  'Sabão em pó', 'Sabão líquido', 'Amaciante', 'Água sanitária', 'Desinfetante',
  'Detergente neutro', 'Esponja de aço', 'Esponja multiuso', 'Pano de chão',
  'Saco de lixo 50L', 'Saco de lixo 100L', 'Papel higiênico 12 rolos',
  'Papel toalha', 'Guardanapo', 'Filme plástico', 'Papel alumínio',
  'Fósforo', 'Vela', 'Inseticida', 'Lustra-móveis', 'Limpa-vidros',
  'Sabonete em barra', 'Sabonete líquido', 'Shampoo', 'Condicionador',
  'Creme dental', 'Fio dental', 'Enxaguante bucal', 'Escova de dente',
  'Desodorante roll-on', 'Desodorante aerosol', 'Aparelho de barbear',
  'Espuma de barbear', 'Absorvente', 'Algodão', 'Cotonete', 'Lenço de papel',
  'Fralda descartável M', 'Fralda descartável G', 'Lenço umedecido',
  'Ração para cães 10kg', 'Ração para gatos 3kg', 'Areia sanitária',
  'Biscoito recheado', 'Biscoito cream cracker', 'Bolacha maisena',
  'Chocolate ao leite', 'Barra de cereal', 'Amendoim torrado', 'Pipoca de micro-ondas',
  'Gelatina', 'Pudim em pó', 'Fermento em pó', 'Fermento biológico seco',
  'Molho de tomate', 'Extrato de tomate', 'Maionese', 'Ketchup', 'Mostarda',
  'Vinagre de maçã', 'Shoyu', 'Caldo de galinha', 'Orégano', 'Colorau',
  'Pimenta-do-reino', 'Canela em pó', 'Cominho', 'Louro em folha',
];

export const TASKS: string[] = [
  'Lavar a louça', 'Varrer a cozinha', 'Passar pano no chão', 'Tirar o lixo',
  'Limpar o banheiro', 'Trocar a roupa de cama', 'Lavar as roupas', 'Estender as roupas',
  'Recolher as roupas do varal', 'Passar as camisas', 'Dobrar as roupas', 'Guardar as roupas',
  'Aspirar a sala', 'Tirar o pó dos móveis', 'Limpar o espelho', 'Organizar o guarda-roupa',
  'Limpar a geladeira por dentro', 'Descongelar o freezer', 'Limpar o fogão',
  'Limpar o micro-ondas', 'Lavar o quintal', 'Regar as plantas', 'Aparar a grama',
  'Podar as plantas', 'Limpar a caixa d’água', 'Trocar o filtro de água',
  'Pagar a conta de luz', 'Pagar a conta de água', 'Pagar o aluguel', 'Pagar a internet',
  'Pagar o cartão de crédito', 'Pagar o IPTU', 'Renovar o seguro do carro',
  'Fazer a declaração do imposto de renda', 'Revisar o orçamento do mês',
  'Transferir para a poupança', 'Cancelar assinatura não usada',
  'Agendar consulta médica', 'Agendar dentista', 'Marcar exame de sangue',
  'Comprar remédio na farmácia', 'Tomar a segunda dose da vacina',
  'Levar o pet ao veterinário', 'Dar banho no cachorro', 'Cortar as unhas do gato',
  'Trocar o óleo do carro', 'Calibrar os pneus', 'Levar o carro pra revisão',
  'Lavar o carro', 'Renovar a CNH', 'Fazer o licenciamento',
  'Responder os e-mails pendentes', 'Enviar o relatório semanal', 'Marcar reunião com o time',
  'Atualizar o currículo', 'Preparar a apresentação', 'Revisar o contrato',
  'Fazer backup do computador', 'Organizar os arquivos da nuvem',
  'Estudar para a prova', 'Ler um capítulo do livro', 'Assistir a videoaula',
  'Fazer os exercícios da lista', 'Entregar o trabalho da faculdade',
  'Ligar para a vovó', 'Comprar presente de aniversário', 'Confirmar presença na festa',
  'Marcar o almoço em família', 'Organizar as fotos do celular',
  'Trocar a lâmpada queimada do corredor', 'Consertar a torneira que pinga',
  'Apertar a dobradiça da porta', 'Comprar pilha para o controle',
  'Devolver o livro na biblioteca', 'Levar doações para o brechó',
];

export const LIST_NAMES_SHOPPING: string[] = [
  'Compras do mês', 'Feira da semana', 'Mercado rápido', 'Compras do churrasco',
  'Lista da farmácia', 'Compras da limpeza', 'Padaria', 'Hortifruti',
  'Compras da festa', 'Reposição da despensa', 'Café da manhã', 'Ceia de Natal',
  'Compras do fim de semana', 'Atacadão', 'Compras do bebê', 'Kit lanche da escola',
  'Compras de emergência', 'Feira orgânica', 'Compras da viagem',
];

export const LIST_NAMES_TASKS: string[] = [
  'Tarefas da casa', 'Faxina de sábado', 'Afazeres da semana', 'Contas a pagar',
  'Pendências do trabalho', 'Antes da viagem', 'Manutenção do carro', 'Saúde em dia',
  'Organização do escritório', 'Rotina da manhã', 'Projeto reforma', 'Mudança',
  'Preparativos da festa', 'Tarefas do jardim', 'Estudos do mês',
];

// Tags personalizadas (fora dos 7 presets do TagPicker).
export const CUSTOM_TAGS: string[] = [
  'Churrasco', 'Farmácia', 'Viagem — Praia', 'Bebê', 'Pet', 'Escritório',
  'Obra', 'Natal', 'Feira', 'Aniversário', 'Emergência', 'Bar da esquina',
];

export const UNITS: (string | null)[] = [
  'unidade', 'unidade', 'unidade', 'kg', 'g', 'litros', 'ml', 'porção', 'pedaço',
];
