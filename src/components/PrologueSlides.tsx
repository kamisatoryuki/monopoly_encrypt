import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CryptoniaStory } from '../types/story';

interface PrologueSlidesProps {
  story: CryptoniaStory;
  onFinishPrologue?: () => void;
}

export const PrologueSlides: React.FC<PrologueSlidesProps> = ({
  story,
  onFinishPrologue,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const slides = story.prologue.slides;
  const current = slides[slideIdx] ?? slides[0];
  const isFirst = slideIdx === 0;
  const isLast = slideIdx === slides.length - 1;

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span className="font-mono text-cyan-300">{story.prologue.kicker}</span>
        <span className="font-mono tabular-nums">
          Bagian {slideIdx + 1} / {slides.length}
        </span>
      </div>

      <div className="space-y-2.5 min-h-[120px]">
        <h3 className="text-base sm:text-lg font-semibold text-white">
          {current.title}
        </h3>
        {current.paragraphs.map((para, i) => (
          <p key={i} className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {para}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setSlideIdx(idx)}
              aria-label={`Slide prolog ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === slideIdx
                  ? 'w-6 bg-cyan-400'
                  : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              type="button"
              onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 whitespace-nowrap"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {story.prologue.backLabel}
            </button>
          )}
          {!isLast ? (
            <button
              type="button"
              onClick={() =>
                setSlideIdx((i) => Math.min(slides.length - 1, i + 1))
              }
              className="inline-flex items-center gap-1 rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 whitespace-nowrap"
            >
              {story.prologue.nextLabel}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            onFinishPrologue && (
              <button
                type="button"
                onClick={onFinishPrologue}
                className="inline-flex items-center gap-1 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 whitespace-nowrap"
              >
                {story.prologue.startLabel}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
