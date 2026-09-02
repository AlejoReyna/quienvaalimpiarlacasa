'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SHUFFLE_DURATION = 5000;
const TICK_DURATION = 360;
const UINT32_RANGE = 4_294_967_296;
const SESSION_ACTION_KEY = 'orden-al-azar-action';

type NameToken = {
  id: string;
  name: string;
};

type FloatingName = NameToken & {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
  zIndex: number;
};

function randomUnit() {
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] / UINT32_RANGE;
  }

  return Math.random();
}

function randomIndex(maxExclusive: number) {
  return Math.floor(randomUnit() * maxExclusive);
}

function fisherYates<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = randomIndex(index + 1);
    [shuffled[index], shuffled[targetIndex]] = [
      shuffled[targetIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function arrangeOrbit(tokens: NameToken[]): FloatingName[] {
  const shuffled = fisherYates(tokens);
  const phase = randomUnit() * Math.PI * 2;

  return shuffled.map((token, index) => {
    const angle = phase + (index / shuffled.length) * Math.PI * 2;
    const radiusX = 27 + randomUnit() * 13;
    const radiusY = 24 + randomUnit() * 15;

    return {
      ...token,
      x: 50 + Math.cos(angle) * radiusX + (randomUnit() - 0.5) * 8,
      y: 50 + Math.sin(angle) * radiusY + (randomUnit() - 0.5) * 8,
      rotation: (randomUnit() - 0.5) * 12,
      scale: 0.88 + randomUnit() * 0.2,
      opacity: 0.72 + randomUnit() * 0.28,
      zIndex: randomIndex(10),
    };
  });
}

export default function Home() {
  const [intro, setIntro] = useState<'hello' | 'ready'>('hello');
  const [rows, setRows] = useState(['', '']);
  const [action, setAction] = useState('');
  const [floatingNames, setFloatingNames] = useState<FloatingName[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [questionFontSize, setQuestionFontSize] = useState<number | null>(null);
  const questionRef = useRef<HTMLSpanElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const completedNames = rows.map((name) => name.trim()).filter(Boolean);
  const canShuffle =
    completedNames.length >= 2 && action.trim().length > 0 && !isShuffling;
  const showsOrderTitle = isShuffling || hasResult;
  const titleKey =
    intro === 'hello' ? 'hello' : showsOrderTitle ? 'order' : 'question';

  useLayoutEffect(() => {
    const question = questionRef.current;

    if (!question) return;

    const fitQuestion = () => {
      const currentFontSize = question.style.fontSize;
      question.style.fontSize = '';

      const baseFontSize = Number.parseFloat(getComputedStyle(question).fontSize);
      const availableWidth = question.clientWidth;
      const contentWidth = question.scrollWidth;
      const fittedFontSize =
        contentWidth > availableWidth
          ? (baseFontSize * availableWidth) / contentWidth
          : null;

      question.style.fontSize = currentFontSize;
      setQuestionFontSize((current) => {
        if (fittedFontSize === null) return current === null ? current : null;
        if (current !== null && Math.abs(current - fittedFontSize) < 0.5) {
          return current;
        }
        return fittedFontSize;
      });
    };

    const observer = new ResizeObserver(fitQuestion);
    observer.observe(question);
    fitQuestion();

    return () => observer.disconnect();
  }, [action, intro, showsOrderTitle]);

  useEffect(() => {
    const introTimeout = setTimeout(() => setIntro('ready'), 1400);
    const storedAction = sessionStorage.getItem(SESSION_ACTION_KEY);

    if (storedAction) setAction(storedAction);

    return () => {
      clearTimeout(introTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function updateRow(index: number, value: string) {
    setHasResult(false);
    setRows((current) =>
      current.map((name, rowIndex) => (rowIndex === index ? value : name)),
    );
  }

  function updateAction(value: string) {
    setHasResult(false);
    setAction(value);
    sessionStorage.setItem(SESSION_ACTION_KEY, value);
  }

  function addRow() {
    setHasResult(false);
    setRows((current) => [...current, '']);
  }

  function removeRow(index: number) {
    setHasResult(false);
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  function handleShuffle() {
    if (!canShuffle) return;

    const tokens = completedNames.map((name, index) => ({
      id: `${index}-${name}`,
      name,
    }));

    setHasResult(false);
    setIsShuffling(true);
    setFloatingNames(arrangeOrbit(tokens));

    intervalRef.current = setInterval(() => {
      setFloatingNames(arrangeOrbit(tokens));
    }, TICK_DURATION);

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setFloatingNames([]);
      setRows(fisherYates(completedNames));
      setIsShuffling(false);
      setHasResult(true);
    }, SHUFFLE_DURATION);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-10 text-center text-black sm:px-8">
      <div className="w-full max-w-[520px]">
        <div className="relative left-1/2 flex min-h-24 w-[calc(100vw-2.5rem)] -translate-x-1/2 items-center justify-center sm:min-h-32">
          <h1
            key={titleKey}
            className="intro-fade w-full min-w-0 text-balance text-[clamp(2.6rem,9vw,5rem)] font-semibold leading-none tracking-[-0.065em]"
          >
            {intro === 'hello' ? (
              'Hola.'
            ) : showsOrderTitle ? (
              'El orden es'
            ) : (
              <span
                ref={questionRef}
                className="flex w-full flex-nowrap items-baseline justify-center gap-x-[0.12em] whitespace-nowrap sm:gap-x-[0.16em]"
                style={
                  questionFontSize === null
                    ? undefined
                    : { fontSize: `${questionFontSize}px` }
                }
              >
                <span className="shrink-0">¿Quién va a</span>
                <Input
                  value={action}
                  onChange={(event) => updateAction(event.target.value)}
                  placeholder="..."
                  aria-label="Acción para repartir"
                  autoComplete="off"
                  maxLength={28}
                  style={{
                    width: `${Math.min(Math.max(action.length + 1, 3.5), 13)}ch`,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    letterSpacing: 'inherit',
                    lineHeight: 'inherit',
                  }}
                  className="inline-block h-[1.02em] min-w-[3.5ch] shrink-0 max-w-[13ch] rounded-none border-0 border-b border-black/35 bg-transparent px-0 py-0 text-center leading-none shadow-none placeholder:text-black/20 focus-visible:border-black/35 focus-visible:ring-0"
                />
                <span className="shrink-0">?</span>
              </span>
            )}
          </h1>
        </div>

        {intro === 'ready' && (
          <div className="interface-fade mt-10 sm:mt-14">
            {isShuffling ? (
              <div
                role="status"
                aria-label="Mezclando nombres durante cinco segundos"
                className="mixing-stage relative h-64 overflow-hidden border-y border-black sm:h-72"
              >
                <span
                  aria-hidden="true"
                  className="mixing-action absolute left-1/2 top-1/2 max-w-[80%] -translate-x-1/2 -translate-y-1/2 truncate text-[clamp(2rem,9vw,4rem)] font-semibold tracking-[-0.06em] text-black/[0.06]"
                >
                  {action}
                </span>
                {floatingNames.map((item) => (
                  <span
                    key={item.id}
                    className="mixing-name absolute max-w-[46%] truncate whitespace-nowrap border border-black/15 bg-white/95 px-3 py-1.5 text-sm font-medium shadow-[0_8px_24px_rgb(0_0_0/6%)] sm:text-base"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      opacity: item.opacity,
                      zIndex: item.zIndex,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                    }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className={hasResult ? 'result-fade' : undefined}>
                <div className="border-t border-black">
                  {rows.map((name, index) => (
                    <div
                      key={index}
                      className="group/row grid grid-cols-[2.75rem_1fr_2.75rem] items-center border-b border-black/20"
                    >
                      <span className="pl-1 text-left text-[11px] tabular-nums text-black/40">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <label htmlFor={`name-${index}`} className="sr-only">
                        Nombre {index + 1}
                      </label>
                      <Input
                        id={`name-${index}`}
                        value={name}
                        onChange={(event) => updateRow(index, event.target.value)}
                        placeholder={`Nombre ${index + 1}`}
                        autoComplete="off"
                        className="h-14 rounded-none border-0 bg-white px-2 text-center text-base shadow-none placeholder:text-black/25 focus-visible:ring-0 sm:h-16 sm:text-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeRow(index)}
                        aria-label={`Eliminar ${name || `nombre ${index + 1}`}`}
                        className="mx-auto rounded-full text-black/40 opacity-100 transition-opacity hover:bg-black/5 hover:text-black focus-visible:opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 sm:group-focus-within/row:opacity-100"
                      >
                        <X aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-7 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={addRow}
                disabled={isShuffling}
                className="h-10 rounded-full px-4 text-xs font-medium text-black/55 hover:bg-black/5 hover:text-black"
              >
                <Plus aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                Añadir
              </Button>
              <Button
                type="button"
                onClick={handleShuffle}
                disabled={!canShuffle}
                className="h-10 rounded-full bg-black px-7 text-xs font-semibold text-white hover:bg-black/80 focus-visible:ring-black/20 disabled:opacity-20"
              >
                {isShuffling ? 'Mezclando…' : 'Mezclar'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
