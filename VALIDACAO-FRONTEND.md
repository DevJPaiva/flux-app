# Eskgo — checklist de validação do front-end

## Escopo desta entrega

React 19 + TypeScript + Vite + Tailwind CSS v4. Somente front-end, sem backend,
autenticação real, Google, OpenAI ou envio de arquivos. Dados do aplicativo são
mantidos no navegador em `eskgo-frontend-v2`; a sessão demonstrativa usa sessionStorage.
Senhas e conteúdo de arquivos não são armazenados.

## Telas do briefing

| Tela | Implementada | Validada no navegador |
| --- | --- | --- |
| Login, com acesso sem preencher campos | Sim | Sim |
| Cadastro, com acesso sem preencher campos | Sim | Sim |
| Home: saldo, mês, categorias e transações | Sim | Sim |
| Cartões: carteira, seleção, faturas e limites | Sim | Sim |
| Metas: orçamento mensal e objetivos guardados | Sim | Sim |
| Fatura: seleção, simulação, revisão e confirmação | Sim, demonstrativa | Sim |
| Assistente: sugestões, espera e respostas sobre registros | Sim, baseado em regras locais | Sim |

Não falta uma tela cheia para fechar a navegação prevista. Objetivos permanecem
em **Metas**; gastos permanecem na **Home**. Não foram criadas telas extras de
Gastos, Objetivos, Perfil ou Configurações, nem sidebar.

## Fluxos e folhas

- [x] Entrar com e-mail e senha vazios → Home.
- [x] Criar conta com campos vazios → Home.
- [x] Adicionar gasto → lista, saldo, categoria e fatura do cartão atualizados.
- [x] Editar gasto, inclusive trocar cartão → totais recalculados.
- [x] Apagar gasto → confirmação, opção de manter e atualização dos totais.
- [x] Expandir todas as transações na própria Home.
- [x] Fechar folha por Escape e restaurar foco ao botão de origem.
- [x] Cartões padronizados em tamanho e proporção, com chip, bandeira ilustrativa e titular.
- [x] Selecionar cartão → percentual, usado e disponível correspondentes.
- [x] Cadastrar e editar cartão → carteira atualizada.
- [x] Ajustar orçamento do mês e teto de categoria.
- [x] Criar objetivo → objetivo aparece na tela.
- [x] Guardar valor → progresso e saldo disponível atualizados, sem tratar como gasto.
- [x] Concluir objetivo → indicação de conquista e depósito desabilitado.
- [x] Fatura inválida → erro e possibilidade de tentar novamente.
- [x] Selecionar PDF local → nome e confirmação para simular leitura.
- [x] Fatura de exemplo → 34 compras, 6 assinaturas e R$ 1.284.
- [x] Corrigir nome/valor e desmarcar compra antes de confirmar.
- [x] Confirmar apenas 33 lançamentos → exatamente 33 novas transações na Home.
- [x] Bloquear segunda importação da mesma fatura de exemplo.
- [x] Assistente responder com total do mês e dados dos cartões registrados.
- [x] Assistente voltar para Metas, sem nova aba na navegação.
- [x] Ocultar saldo ao entrar → preferência preservada.
- [x] Recarregar → transações, cartões, objetivos e preferências preservados.
- [x] Conta → confirmação de saída → Login → Cadastro → Home.

## Responsividade

As sete telas, além da revisão da fatura, passaram na verificação de largura de
documento e dos contêineres principais em **320, 390, 800, 1100, 1920 e 3840 px**,
sem transbordamento horizontal detectado.

Também foram inspecionadas imagens da tela de login em desktop e da carteira
em mobile. Isso não substitui a aprovação visual humana de cada estado.

## Verificação técnica

- [x] 23 verificações de fluxo/layout aprovadas em Chromium headless.
- [x] Nenhum erro JavaScript de página observado durante o fluxo aprovado.
- [x] Testes de modelo: saldo e orçamento iniciais; incluir/editar/apagar; troca
      de cartão; categorias por mês; moeda; fatura; fallback e migração local.
- [x] Checagem TypeScript.
- [x] Build de produção.

Comandos para repetir os testes de modelo e a compilação:

```sh
node --experimental-strip-types --test tests/finance.test.mjs
pnpm exec tsc --noEmit
pnpm build
```

## Limites e validações ainda externas a esta entrega

- [ ] Aprovação visual final de todas as telas e estados pelo responsável pelo produto.
- [ ] Captura pela câmera em celular físico e comportamento do teclado virtual.
- [ ] Auditoria formal WCAG AA com leitores de tela.
- [ ] Medição de carregamento em conexão móvel média; não há promessa medida de menos de 3 segundos.
- [ ] Autenticação, sincronização entre dispositivos e banco de dados: fora do escopo local.
- [ ] Leitura real de PDF/foto, chat OpenAI e armazenamento de mídia: dependem de backend futuro.

### Estados de demonstração

Sheets incluem contenção de foco, Escape e fechamento pelo fundo. Estão implementados
estados vazios para transações, categorias, cartões e objetivos; os vazios de carteira
e objetivos não foram exercitados no fluxo automatizado com os dados iniciais.
Progresso de fatura, espera do assistente, validação de formulários e mensagens de
feedback são locais. Os arquivos escolhidos **não são lidos nem enviados**: qualquer
seleção válida usa a mesma fatura fictícia, importável uma única vez por conjunto local.
