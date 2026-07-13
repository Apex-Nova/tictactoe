'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { BoardIndex, SuperGameState } from '@/types';
import { MicroBoard } from './MicroBoard';

const BASE_CELL = 150; // px per micro-board at 100% zoom
const GAP = 8;
const PAD = 8;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.0;
const STEP = 0.1;

interface Props {
  state: SuperGameState;
  playableBoardIndices: readonly BoardIndex[];
  controlChoiceBoards: readonly BoardIndex[];
  onCellPlay: (boardIndex: BoardIndex, cellIndex: number) => void;
  onBoardSelect: (boardIndex: BoardIndex) => void;
}

export function MacroBoard({ state, playableBoardIndices, controlChoiceBoards, onCellPlay, onBoardSelect }: Props) {
  const size = state.boardSize ?? 3;
  const isAwaitingControl = state.phase === 'awaiting-board-choice';

  const scrollRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [zoom, setZoom] = useState(1);
  const [userZoomed, setUserZoomed] = useState(false);

  // Scroll edge fade visibility
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollUp, setCanScrollUp]       = useState(false);
  const [canScrollDown, setCanScrollDown]   = useState(false);

  function updateEdgeFades() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    setCanScrollUp(el.scrollTop > 2);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  }

  // ── Auto-fit zoom ─────────────────────────────────────────────────────────────
  const fitZoom = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return 1;
    const w = scroll.clientWidth;
    const h = scroll.clientHeight;
    if (!w || !h) return 1;
    const boardPx = size * BASE_CELL + (size - 1) * GAP + PAD * 2;
    const margin = 20;
    const fit = Math.min((w - margin) / boardPx, (h - margin) / boardPx);
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fit));
  }, [size]);

  useEffect(() => {
    if (userZoomed) return;
    const raf = requestAnimationFrame(() => {
      setZoom(fitZoom());
      updateEdgeFades();
    });
    return () => cancelAnimationFrame(raf);
  }, [fitZoom, userZoomed]);

  useEffect(() => {
    if (userZoomed) return;
    const obs = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        setZoom(fitZoom());
        updateEdgeFades();
      });
    });
    if (scrollRef.current) obs.observe(scrollRef.current);
    return () => obs.disconnect();
  }, [userZoomed, fitZoom]);

  // Recheck fades after zoom changes
  useEffect(() => {
    requestAnimationFrame(updateEdgeFades);
  }, [zoom]);

  // ── Auto-scroll to active board ───────────────────────────────────────────────
  useEffect(() => {
    const idx = state.activeBoardIndex;
    if (idx === null || idx === undefined) return;
    const el = cellRefs.current[idx as number];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [state.activeBoardIndex]);

  // ── Zoom helpers ──────────────────────────────────────────────────────────────
  function bump(delta: number) {
    setUserZoomed(true);
    setZoom(z => {
      const next = parseFloat(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)).toFixed(2));
      return next;
    });
  }

  function resetFit() {
    setUserZoomed(false);
    setZoom(fitZoom());
  }

  const cellPx = Math.floor(BASE_CELL * zoom);
  const zoomPct = Math.round(zoom * 100);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col gap-1 overflow-hidden"
      style={isFullscreen ? { background: 'var(--color-surface-1)', padding: 8 } : undefined}
    >

      {/* ── Zoom bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 flex-shrink-0 py-1 px-4">
        <button
          onClick={() => bump(-STEP)}
          disabled={zoom <= MIN_ZOOM}
          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
            bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]
            hover:border-[var(--color-text-muted)] disabled:opacity-30 transition-all"
          aria-label="Zoom out"
        >−</button>

        {/* Slider meter */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <input
            type="range"
            min={Math.round(MIN_ZOOM * 100)}
            max={Math.round(MAX_ZOOM * 100)}
            step={Math.round(STEP * 100)}
            value={zoomPct}
            onChange={e => {
              setUserZoomed(true);
              setZoom(Number(e.target.value) / 100);
            }}
            className="flex-1 h-1.5 rounded-full cursor-pointer accent-[var(--color-accent)]"
            aria-label="Zoom level"
            style={{ accentColor: 'var(--color-accent)' } as React.CSSProperties}
          />
        </div>

        <button
          onClick={resetFit}
          className="text-xs font-mono w-[38px] text-center flex-shrink-0
            text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
            transition-colors"
          title="Click to fit board to screen"
        >
          {zoomPct}%
        </button>

        <button
          onClick={() => bump(STEP)}
          disabled={zoom >= MAX_ZOOM}
          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
            bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]
            hover:border-[var(--color-text-muted)] disabled:opacity-30 transition-all"
          aria-label="Zoom in"
        >+</button>

        <button
          onClick={toggleFullscreen}
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
            bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]
            hover:border-[var(--color-text-muted)] transition-all"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
              <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
              <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
            </svg>
          )}
        </button>
      </div>

      {/* ── Scrollable board (with edge-fade indicators) ──────────────────────── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Scroll fade edges — tell the user there's more content */}
        {canScrollLeft  && <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 z-10"
          style={{ background: 'linear-gradient(to right, var(--color-surface-1), transparent)' }} />}
        {canScrollRight && <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-10"
          style={{ background: 'linear-gradient(to left, var(--color-surface-1), transparent)' }} />}
        {canScrollUp    && <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 z-10"
          style={{ background: 'linear-gradient(to bottom, var(--color-surface-1), transparent)' }} />}
        {canScrollDown  && <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 z-10"
          style={{ background: 'linear-gradient(to top, var(--color-surface-1), transparent)' }} />}

        <div
          ref={scrollRef}
          className="w-full h-full overflow-auto"
          style={{ scrollbarWidth: 'thin' }}
          onScroll={updateEdgeFades}
        >
          {/*
            IMPORTANT: min-width: max-content fixes left-clipping when board overflows.
            justify-content: center clips negative overflow in scroll containers — the
            left side becomes unreachable. max-content forces the wrapper to be at least
            as wide as the board, so centering resolves to 0px offset instead of negative.
          */}
          <div
            className="min-h-full flex items-center justify-center p-2"
            style={{ minWidth: 'max-content' }}
          >
            <div
              role="group"
              aria-label="Super Tic Tac Toe board"
              className="bg-[var(--color-surface-2)] rounded-2xl shadow-2xl flex-shrink-0"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${size}, ${cellPx}px)`,
                gap: GAP,
                padding: PAD,
              }}
            >
              {state.microBoards.map((board, index) => {
                const bi = index as BoardIndex;
                const isActive = state.activeBoardIndex === bi;
                const isPlayable = playableBoardIndices.includes(bi);
                const isControlChoice = isAwaitingControl && controlChoiceBoards.includes(bi);

                return (
                  <div
                    key={index}
                    ref={el => { cellRefs.current[index] = el; }}
                    style={{ width: cellPx, height: cellPx }}
                  >
                    <MicroBoard
                      board={board}
                      boardIndex={bi}
                      isActive={isActive}
                      isPlayable={isPlayable}
                      isControlChoice={isControlChoice}
                      currentPlayer={state.currentPlayer}
                      cellPx={cellPx}
                      onCellPlay={onCellPlay}
                      onBoardSelect={onBoardSelect}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
