# Mobile Interaction Diagnostics

MineIT v5.13.6 added bounded, behaviour-neutral interaction tracing to diagnose the intermittent Android/mobile issue where some buttons needed repeated taps before they activated.

## Root cause confirmed from Android trace

The captured Corporate Trade Ship BUY failure showed repeated clean sequences of `pointerdown` → `pointerup` → `click-capture` → `click-bubble`, with zero pointer movement, no `pointercancel`, and the pressed button remaining connected. This ruled out touch-target size, scroll cancellation, overlays, pointer suppression and HUD-driven DOM replacement for the Corporate Ship case.

The remaining failure was the cold external-view lifecycle introduced when templates moved from embedded JavaScript markup into separately fetched files. A fresh browser/module session had an empty in-memory template cache. The first BUY/SELL/COLONISTS navigation could therefore wait on an asynchronous template fetch. Each repeated tab tap started a new `renderQuick()` revision, invalidating earlier render attempts while giving no immediate visual acknowledgement.

## v5.13.7 fix

- Navigation-critical ship templates are now preloaded non-blockingly at startup, including Corporate Ship, Buyers Service, technology, Spaceport, Star Map and ship-preparation views.
- The Corporate Ship shell is mounted once while the panel is open. SELL / BUY / COLONISTS switch only the view host; the title, metrics, tabs and departure control remain stable DOM nodes.
- A tab becomes active immediately on the first click and exposes an explicit loading state while a cold template finishes.
- Repeated taps on the already-selected tab are ignored, so an in-flight render cannot be continuously superseded by duplicate input.
- Different tab selections still invalidate stale async writes, preserving the existing stale-render safety rule.
- Corporate Ship metrics are refreshed in place instead of rebuilding the whole modal.
- A browser regression intentionally delays the cold BUY template for five seconds, then verifies that one click selects BUY immediately, repeated BUY taps do not create extra render revisions, the BUY view eventually mounts, and the Corporate Ship shell node is never replaced.

## Diagnostic tracer retained

The shared UI controller still records semantic controls only. It does not change activation behaviour and does not act on `pointerdown`.

The rolling trace records `pointerdown`, `pointerup`, `pointercancel`, click capture/bubble, movement, connection state, target disconnection and modal open transitions. The trace remains limited to the latest 240 events, exists only in memory, is not persisted in the save and is not sent anywhere.

The tracer remains useful if another interaction path later shows a genuinely different mobile failure mode.
