# Mobile Camera & Fullscreen Context

**Gathered:** 2026-07-08
**Spec:** `.specs/features/mobile-camera/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Fazer o jogo funcionar bem no celular em viewport cheia, servido na rede local via IP: tela cheia em paisagem, e uma "câmera viva" que se move automaticamente para dar sensação de ambiente em movimento e foco na ação. A criança NUNCA controla a câmera diretamente.

---

## Implementation Decisions

### Câmera viva automática

- Escolha do usuário: **câmera viva automática** (não pan manual). Mantém o espírito do AD-002 — a criança não controla câmera — mas o enquadramento deixa de ser estático:
  - Aproxima suavemente do brinquedo sendo arrastado (follow com easing).
  - Enquadra a caixa no acerto.
  - Faz passeio curto na celebração de rodada completa (conteúdo definido na feature `visual-bluey`).
  - Volta ao enquadramento diorama quando ocioso.

### Tela cheia e orientação

- Botão play pede **fullscreen** e trava **landscape** (best effort — iOS Safari não suporta Fullscreen API/orientation lock em iPhone; nesses casos, viewport cheia via CSS/meta é o máximo possível).
- Em retrato, aviso visual "vire o celular" (sem texto longo; ícone/animação — público de 4 anos).

### Servir na rede local

- Jogo acessado via link `http://IP:porta` — servidor Vite com `--host` (dev e preview). Nenhuma API que exija secure context pode ser requisito de jogabilidade.

### Agent's Discretion

- Curvas de easing, distâncias e limites exatos da câmera (desde que a sala nunca "se perca" do enquadramento).
- Implementação do aviso de retrato (overlay CSS vs cena).

### Declined / Undiscussed Gray Areas → Assumptions

- Pan manual pelo dedo: **descartado** pelo usuário (escolheu automática pura).
- PWA/instalável: assumido fora de escopo — acesso é via link direto no navegador.
- Vibração (haptics) no acerto: assumido fora de escopo — não pedido.

---

## Specific References

- "Será jogado no celular via link de servidor com IP" — rede local, HTTP simples.
- AD-002 permanece no espírito (sem controle de câmera pela criança); o enquadramento fixo é revisado para "câmera automática com retorno ao diorama".

---

## Deferred Ideas

- Ajuste manual leve de pan (combinado com automático) — opção não escolhida; candidata futura se a câmera automática não bastar.
