# STATE

## Decisions

| ID | Decisão | Rationale | Status |
|----|---------|-----------|--------|
| AD-001 | Stack: Vite + Three.js em JavaScript puro, página estática (sem framework) | Projeto pequeno, um dev, deploy simples (rede local/estático); decidido no brainstorming | active |
| AD-002 | Câmera fixa em diorama — sem orbit/zoom/parallax | Público de 4 anos se perde com controle de câmera | superseded by AD-007 |
| AD-003 | Arrasto próprio via raycasting contra plano invisível na altura do chão (Pointer Events); NÃO usar `DragControls` | DragControls arrasta em profundidade livre, ruim para criança; Pointer Events unifica touch e mouse | active |
| AD-004 | Lógica de jogo pura em `game.js`, sem dependência de renderer, testada com Vitest; código de renderização validado manualmente/Playwright | Permite gate automatizado no que é testável sem WebGL headless | active |
| AD-005 | Assets oficiais da Bluey somente para uso privado em família; publicação exige troca de arte ou licença | Limite de IP documentado em `docs/references.md` | active |
| AD-006 | E2E guiado por prompt via Playwright MCP: cenários em `e2e/scenarios/*.md` executados pelo agente com as tools do MCP, apoiados no hook determinístico `window.__game` | Pedido do usuário; canvas WebGL é opaco para asserts de DOM — asserts via estado do hook, screenshots como evidência | active |
| AD-007 | Câmera viva automática: segue a ação (arrasto/acerto/celebração) com easing e retorna ao diorama; a criança NUNCA controla a câmera diretamente | Supersede AD-002 preservando seu espírito (sem controle infantil de câmera); pedido do usuário de "ambiente se movendo" resolvido sem orbit/pan manual (discuss 2026-07-08) | active |
| AD-008 | Personagem Bluey: GLTF fan-made se houver asset com licença ok para uso privado; fallback é construir low-poly procedural própria (nunca billboard 2D) | Escolha explícita do usuário no discuss; coerente com AD-005 (uso privado) e com o padrão de fallback do projeto | active |

## Handoff

- **Feature `hora-de-guardar`: CONCLUÍDA em 2026-07-08.** 14/14 tasks (commits `5d12769..61947ac`), Verifier PASS (17/17 ACs, sensor 3/3 mutantes mortos, gates exit 0) — relatório em `.specs/features/hora-de-guardar/validation.md`.
- **Feature `visual-bluey`: CONCLUÍDA em 2026-07-08.** 11/11 tasks (commits `5c77f0f..8f616d8`), Verifier PASS (16/16 ACs P1, sensor 3/3 mutantes mortos, gates exit 0, cenários E2E 02/04 verdes via Playwright MCP contra `vite preview`) — relatório em `.specs/features/visual-bluey/validation.md`. VIS-08 (P2 celebração) e VIS-09 (P3 Bingo) fora desta entrega, Pending na spec.
- Pendências conhecidas (não bloqueantes): lessons candidatas L-001..L-005; 1 SPEC_DEVIATION documentado em `index.html` (z-index do `#transition-overlay`: 5 em vez dos 30 do design, para ficar abaixo do start-overlay/erro WebGL).
- **Feature `mobile-camera`: Tasks prontas, NÃO iniciada.** spec.md + context.md + design.md + tasks.md em `.specs/features/mobile-camera/`. Próximo passo: Execute (nota: `cameraDirector` deve ser módulo puro testável, cf. design de `visual-bluey`).
- **Pendência do usuário:** baixar manualmente o modelo "Bluey Heeler's Family" (Sketchfab, CC-BY) e salvar em `assets/bluey/bluey.glb` — instruções em `docs/references.md`. Sem o arquivo, o jogo usa a Bluey procedural (fallback automático, validado); com o arquivo, revalidar o ramo `'gltf'` do cenário E2E 04 (nota em T7/validation.md).
- **Feature `musica-e-sons`: CONCLUÍDA em 2026-07-08.** 6/6 ACs (MUS-01..04.1) implementadas em `src/feedback.js`: música de fundo sintetizada em loop (WebAudio, sem download — consistente com AD-005/L-003), duck automático nos efeitos, toque bem-humorado ao errar (caixa errada e solto fora de caixa) — emenda GUARD-03/GUARD-09 em `.specs/features/hora-de-guardar/spec.md`. Sem testes unitários (WebAudio não é testável em jsdom, mesma exceção de AD-004 já aplicada a chime/fanfare/victoryTune); validado via suite Vitest sem regressão + build limpo + checagem manual pendente do usuário (ouvir com `npm run dev`).
- Jogo jogável com `npm run dev`; build de produção validado via `npm run build` + `vite preview`.
