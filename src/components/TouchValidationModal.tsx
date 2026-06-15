import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterConfig } from '../types';
import { sound } from './SoundGenerator';
import { Sparkles, Trophy, Flame, AlertCircle } from 'lucide-react';

interface TouchValidationModalProps {
  character: CharacterConfig;
  currentLevel: number;
  onSuccess: () => void;
  onFail: () => void;
}

export default function TouchValidationModal({
  character,
  currentLevel,
  onSuccess,
  onFail,
}: TouchValidationModalProps) {
  const [timeLeft, setTimeLeft] = useState(30); // Reduced to 30 seconds
  const [feedProgress, setFeedProgress] = useState(0); // 0 to 100
  const [tapCount, setTapCount] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; char: string }[]>([]);
  const [isDone, setIsDone] = useState(false);
  const isDoneRef = React.useRef(false);
  const stage = character.stages[currentLevel] || character.stages[1];

  const onFailRef = React.useRef(onFail);
  const onSuccessRef = React.useRef(onSuccess);

  useEffect(() => {
    onFailRef.current = onFail;
    onSuccessRef.current = onSuccess;
  }, [onFail, onSuccess]);

  const triggerSuccess = () => {
    if (isDoneRef.current) return;
    isDoneRef.current = true;
    setIsDone(true);
    onSuccessRef.current();
  };

  const triggerFail = () => {
    if (isDoneRef.current) return;
    isDoneRef.current = true;
    setIsDone(true);
    onFailRef.current();
  };

  // Tick timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerFail(); // Out of time = experience forfeited
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (feedProgress >= 100 || isDoneRef.current) return;

    sound.playCrunch();
    setTapCount((prev) => prev + 1);
    
    // Add 10-15% progress per click (needs roughly 7-10 clicks)
    const increment = Math.floor(Math.random() * 6) + 10;
    setFeedProgress((prev) => {
      const next = Math.min(100, prev + increment);
      if (next >= 100) {
        setTimeout(() => {
          sound.playSuccessFanfare();
          triggerSuccess();
        }, 600);
      }
      return next;
    });

    // Spawn a shiny food/heart particle at click coordinates relative to target element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const foodEmojis: { [key: string]: string[] } = {
      chicken: ['🌽', '🐛', '🌱', '🌾', '❤️'],
      hamster: ['🌻', '🌰', '🥜', '🥕', '✨'],
      bear: ['🍯', '🍯', '🐝', '🍓', '💛'],
      wolf: ['🍖', '🥩', '🍗', '🦴', '💙']
    };

    const emojis = foodEmojis[character.id] || ['✨', '💖'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    const newParticle = {
      id: Date.now() + Math.random(),
      x,
      y,
      char: randomEmoji
    };

    setParticles((prev) => [...prev, newParticle]);

    // Clean up particles
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 1000);
  };

  // Human-readable minutes/seconds
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Get prompts based on design docs
  const getPromptMessage = () => {
    switch (character.id) {
      case 'chicken':
        return '1교시 끝! 화면을 콕! 찔러서 고생한 꼬꼬에게 모이를 주세요!';
      case 'hamster':
        return '찍찍이가 해바라기씨를 다 먹었어요. 화면을 터치해 밥그릇을 채워주세요!';
      case 'bear':
        return '아웅이가 집중하느라 배가 고파요! 꿀단지를 터치해 가득 채워주세요!';
      case 'wolf':
        return '늑구가 사냥을 마쳤습니다! 고기 간식 버튼을 눌러 하이파이브를 해주세요!';
      default:
        return '수고하셨습니다! 캐릭터를 터치해 보상을 나눠주세요!';
    }
  };

  const getFoodLabel = () => {
    switch (character.id) {
      case 'chicken': return '🌽 모이 채우기';
      case 'hamster': return '🌻 해바라기씨 가득';
      case 'bear': return '🍯 꿀단지 충전';
      case 'wolf': return '🍖 고기 하이파이브';
      default: return '❤️ 터치 수혈';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-md overflow-hidden bg-white rounded-3xl shadow-2xl border-4"
        style={{ borderColor: `var(--color-${character.bgColor === 'bg-amber-500' ? 'amber-400' : character.bgColor === 'bg-rose-500' ? 'rose-400' : character.bgColor === 'bg-emerald-500' ? 'emerald-400' : 'indigo-400'})` }}
        id="survival-declarer-modal"
      >
        {/* Banner header */}
        <div className={`p-5 text-center text-white relative ${character.bgColor}`}>
          <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 text-xs font-mono font-bold tracking-wider rounded-full bg-black/30">
            <Flame className="w-3 h-3 text-orange-300 animate-pulse" />
            <span>LIMIT {formatTime(timeLeft)}</span>
          </div>
          
          <h2 className="text-2xl font-black font-sans leading-tight mt-3">
            🔔 생존 인증 타임!
          </h2>
          <p className="text-xs text-white/90 mt-1 font-sans">
            30초 내에 밥을 주지 않으면 유령 자습 처리되어 경험치가 날아가요!
          </p>
        </div>

        {/* Dynamic game-interaction board */}
        <div className="p-6 flex flex-col items-center">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-600 bg-rose-50 rounded-full border border-rose-100 animate-bounce">
              <AlertCircle className="w-3.5 h-3.5" />
              자습 생존 승인 대기 중
            </span>
            <p className="mt-3 text-base font-bold text-slate-800 leading-relaxed font-sans px-2">
              {getPromptMessage()}
            </p>
          </div>

          {/* Huge interactive pet zone */}
          <div 
            onClick={handleTap}
            className="w-48 h-48 my-4 rounded-full border-4 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 flex items-center justify-center cursor-pointer relative overflow-hidden select-none active:scale-95 transition-transform"
            style={{ touchAction: 'none' }}
          >
            {/* Clickable character avatar */}
            <motion.div
              animate={{ 
                scale: feedProgress >= 100 ? [1, 1.2, 1] : [1, 1.05, 0.98, 1],
                rotate: feedProgress >= 100 ? [0, 15, -15, 0] : 0
              }}
              transition={{ repeat: feedProgress >= 100 ? Infinity : 0, duration: 1 }}
              className="text-8.5xl flex items-center justify-center filter drop-shadow-md"
            >
              <span className="text-6.5xl whitespace-nowrap flex items-center justify-center tracking-tighter shrink-0 select-none p-1">{stage.emoji}</span>
            </motion.div>

            {/* Tap count badge */}
            <div className="absolute bottom-2 bg-slate-800/80 text-white rounded-full px-2.5 py-0.5 text-xs font-mono font-bold tracking-wider">
              TAP: {tapCount}
            </div>

            {/* Floating food particle effects */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, y: p.y, x: p.x, scale: 0.8 }}
                animate={{ opacity: 0, y: p.y - 120, x: p.x + (Math.random() * 60 - 30), scale: 1.4, rotate: Math.random() * 360 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute pointer-events-none text-2xl"
              >
                {p.char}
              </motion.div>
            ))}

            {/* Glowing complete ring */}
            {feedProgress >= 100 && (
              <div className="absolute inset-0 bg-white/25 flex items-center justify-center animate-pulse pointer-events-none">
                <Trophy className="w-16 h-16 text-yellow-500 filter drop-shadow" />
              </div>
            )}
          </div>

          {/* Interactive progress bar */}
          <div className="w-full mt-2 mb-6">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1.5 px-1">
              <span>{getFoodLabel()}</span>
              <span className="font-mono text-slate-800">{feedProgress}% / 100%</span>
            </div>
            
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <motion.div 
                className={`h-full rounded-full ${character.bgColor}`}
                initial={{ width: '0%' }}
                animate={{ width: `${feedProgress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full flex gap-3">
            <button
              onClick={triggerFail}
              className="flex-1 py-3 text-sm font-bold text-slate-400 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-600 rounded-2xl transition-colors cursor-pointer"
            >
              자습 파기 (경험치 몰수)
            </button>
            <button
              disabled={feedProgress < 100 || isDoneRef.current}
              onClick={() => {
                if (feedProgress >= 100) {
                  triggerSuccess();
                }
              }}
              className={`flex-1 py-3 text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                feedProgress >= 100 
                  ? `${character.bgColor} text-white hover:brightness-105 hover:shadow-lg active:scale-95` 
                  : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              자습 승인 & 충전완료
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
