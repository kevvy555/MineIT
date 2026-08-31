# Mobile Interaction Diagnostics

MineIT v5.13.6 adds bounded, behaviour-neutral interaction tracing to diagnose the intermittent Android/mobile issue where some buttons need repeated taps before they activate.

## What is recorded

The shared UI controller records semantic controls only. It does not change activation behaviour and does not act on `pointerdown`.

The rolling trace records:

- `pointerdown`;
- `pointerup`;
- `pointercancel`;
- click capture and click bubble;
- movement distance during the press;
- whether pointer-up occurred on the same control;
- whether the original pressed node was still connected;
- `target-disconnected` when the exact pressed DOM node is removed while the pointer remains down;
- modal `ui-open-start` and `ui-open-commit` transitions.

The trace is limited to the latest 240 interaction events and lives only in the in-memory `Diagnostics` instance. It is not persisted in the save and is not sent anywhere.

## How to capture a failed tap

1. Reproduce the problem, ideally with one or two failed taps on the Player Colony Ship panel or Corporate Trade Ship SELL / BUY / COLONISTS controls.
2. Open the game menu.
3. Open `Diagnostics`.
4. Copy the `INTERACTION TRACE` section, including a few events before and after the failed tap.

## Interpretation

- `pointercancel` after `pointerdown` indicates browser gesture cancellation.
- `target-disconnected` before `pointerup` proves the pressed node was replaced during the physical tap.
- `pointerup` without a subsequent click indicates the browser did not generate activation.
- `click-capture` followed by `click-bubble` proves a click crossed the control's target-handler phase.
- a later `ui-open-start` / `ui-open-commit` shows the action produced a modal transition; absence of one helps isolate handler or async-render lifecycle problems.

The existing Player Ship browser probe now also holds a touch for 180ms across the 125ms HUD refresh interval and verifies that the diagnostic layer can detect a deliberately disconnected pressed node.
