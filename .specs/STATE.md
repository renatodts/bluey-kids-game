# STATE

## Decisions

| ID | Decisão | Rationale | Status |
|----|---------|-----------|--------|
| AD-001 | Stack: Vite + Three.js em JavaScript puro, página estática (sem framework) | Projeto pequeno, um dev, deploy simples (rede local/estático); decidido no brainstorming | active |
| AD-002 | Câmera fixa em diorama — sem orbit/zoom/parallax | Público de 4 anos se perde com controle de câmera | active |
| AD-003 | Arrasto próprio via raycasting contra plano invisível na altura do chão (Pointer Events); NÃO usar `DragControls` | DragControls arrasta em profundidade livre, ruim para criança; Pointer Events unifica touch e mouse | active |
| AD-004 | Lógica de jogo pura em `game.js`, sem dependência de renderer, testada com Vitest; código de renderização validado manualmente/Playwright | Permite gate automatizado no que é testável sem WebGL headless | active |
| AD-005 | Assets oficiais da Bluey somente para uso privado em família; publicação exige troca de arte ou licença | Limite de IP documentado em `docs/references.md` | active |
| AD-006 | E2E guiado por prompt via Playwright MCP: cenários em `e2e/scenarios/*.md` executados pelo agente com as tools do MCP, apoiados no hook determinístico `window.__game` | Pedido do usuário; canvas WebGL é opaco para asserts de DOM — asserts via estado do hook, screenshots como evidência | active |

## Handoff

- **Feature ativa:** `hora-de-guardar` — fase de planejamento (spec/design/tasks aguardando aprovação do usuário)
- **Origem:** spec de produto aprovada em `docs/2026-07-08-hora-de-guardar-design.md`
- **Próximo passo:** usuário aprova `tasks.md` → Execute (14 tasks, oferta de sub-agents obrigatória por >8 tasks)
