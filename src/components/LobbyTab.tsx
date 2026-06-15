import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CharacterId, CharacterConfig, UserProgress } from '../types';
import { CHARACTERS } from '../data/characters';
import { sound } from './SoundGenerator';
import { getRequiredXpForNextLevel, calculateXpPercentage } from '../utils/xp';
import { Clock, Flame, Calendar, Award, Zap, ChevronRight, RefreshCw, Star, MessageSquare } from 'lucide-react';

interface LobbyTabProps {
  progress: UserProgress;
  onSelectCharacter: (id: CharacterId) => void;
  onResetProgress: () => void;
  setActiveTab: (tab: 'lobby' | 'timer' | 'rewards') => void;
}

export default function LobbyTab({
  progress,
  onSelectCharacter,
  onResetProgress,
  setActiveTab,
}: LobbyTabProps) {
  const currentChara = CHARACTERS.find((c) => c.id === progress.selectedCharacterId) || CHARACTERS[0];
  const charaLevel = progress.levels[currentChara.id];
  const charaExp = progress.expPoints[currentChara.id];
  const stage = currentChara.stages[charaLevel] || currentChara.stages[5];

  const [dialogue, setDialogue] = useState<string>(stage.dialogue[0]);
  const [isWiggly, setIsWiggly] = useState<boolean>(false);

  // Trigger dialogue clicking character
  const handleCharacterClick = () => {
    sound.playCrunch();
    setIsWiggly(true);
    setTimeout(() => setIsWiggly(false), 500);

    const dialogs = stage.dialogue;
    const randomIdx = Math.floor(Math.random() * dialogs.length);
    setDialogue(dialogs[randomIdx]);
  };

  // Convert seconds to readable hour/min/sec
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${seconds}초`;
    }
    return `${minutes}분 ${seconds}초`;
  };

  // Compact formatter for tiny grass cell display
  const formatGrassTimeCompact = (totalSeconds: number) => {
    if (totalSeconds <= 0) return <span>•</span>;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return (
        <span className="flex flex-col items-center leading-[1] text-[9px] font-extrabold select-none">
          <span>{hours}시간</span>
          <span>{minutes}분</span>
        </span>
      );
    }
    if (minutes > 0) {
      return (
        <span className="flex flex-col items-center leading-[1] text-[9px] font-extrabold select-none">
          <span>{minutes}분</span>
          <span>{seconds}초</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] sm:text-[9px] font-extrabold select-none">{seconds}초</span>
    );
  };

  // Daily study grass visualization generator (last 14 days)
  const getStudyGrass = () => {
    const grass = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      
      // Calculate focus seconds for that day from logs
      const dayLogs = progress.dailyHistory.filter((log) => log.date === dateString);
      const totalDaySeconds = dayLogs.reduce((acc, curr) => acc + (curr.completed ? curr.durationSeconds : 0), 0);
      
      // Color based on intensity - Emerald tones for study days, soft tinted white for resting days
      let colorClass = 'bg-white/10 hover:bg-white/20 border-white/10 text-amber-900/40';
      let title = `${dateString}: 공부 기록 없음 🐣`;
      
      if (totalDaySeconds > 0 && totalDaySeconds < 60) {
        colorClass = 'bg-emerald-400/90 hover:bg-emerald-500 border-emerald-400 text-white shadow-sm font-bold';
        title = `${dateString}: 가벼운 맛보기 공부 (${formatTime(totalDaySeconds)}) 🌱`;
      } else if (totalDaySeconds >= 60 && totalDaySeconds < 500) {
        colorClass = 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white shadow-md font-bold';
        title = `${dateString}: 알찬 자습 몰입 완료 (${formatTime(totalDaySeconds)}) 🌿`;
      } else if (totalDaySeconds >= 500) {
        colorClass = 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-lg font-black';
        title = `${dateString}: 불태운 전교 1등 야자 몰입 (${formatTime(totalDaySeconds)}) 🔥`;
      }

      grass.push({
        date: dateString,
        seconds: totalDaySeconds,
        colorClass,
        title,
        dayLabel: d.getDate()
      });
    }
    return grass;
  };

  return (
    <div className="space-y-8" id="lobby-root">
      {/* 1. Header Hero Dash */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[40px] p-6 md:p-8 text-amber-950 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 dark-school-grid opacity-10 pointer-events-none" />
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-full animate-pulse flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-white" /> HACKATHON FOCUS TIMER
              </span>
              <span className="text-amber-800/60 text-xs font-mono font-bold">STUDY-HESS-DAK</span>
            </div>
            
            <h1 className="text-3xl md:text-5.51xl font-black font-sans leading-tight text-amber-950">
              오늘도 끝까지 <br className="hidden sm:inline" />
              <span className="text-amber-700 underline decoration-wavy decoration-amber-500/50">공부했닭?</span> 🐣
            </h1>

            {/* Quick stats buttons - Enhanced by 1.2x scale for focal point clarity */}
            <div className="flex flex-wrap gap-5 mt-6">
              <div className="flex items-center gap-4 px-6 py-4 bg-white/70 rounded-3xl border border-white shadow-md text-amber-950 shrink-0 transform hover:scale-[1.03] transition-all">
                <Clock className="w-7 h-7 text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs text-amber-800 uppercase font-bold tracking-wider">오늘 총 집중 시간</div>
                  <div className="text-xl font-black font-mono mt-0.5">{formatTime(progress.totalFocusSeconds)}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 px-6 py-4 bg-white/70 rounded-3xl border border-white shadow-md text-amber-950 shrink-0 transform hover:scale-[1.03] transition-all">
                <Flame className="w-7 h-7 text-red-500 shrink-0" />
                <div>
                  <div className="text-xs text-amber-800 uppercase font-bold tracking-wider">딴짓 감지 횟수</div>
                  <div className="text-xl font-black font-mono mt-0.5">{progress.cheatingDetectedCount}회 감지</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Mascot Display Side */}
          <div className="flex flex-col items-center bg-white/40 backdrop-blur-xl border border-white/50 rounded-[40px] p-6 relative shadow-lg">
            <div className="absolute top-4 left-4 bg-amber-500/20 text-amber-900 px-2.5 py-0.5 text-2xs font-extrabold rounded-lg uppercase tracking-wide">
              Selected Companion
            </div>

            {/* Speaking Dialogue Bubble */}
            <div className="w-full bg-white/60 text-amber-950 rounded-2xl p-3 text-xs relative mb-4 mt-4 border border-white flex gap-2 items-start shadow-inner">
              <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="font-sans font-medium">{dialogue}</p>
              <div className="absolute bottom-[-6px] right-12 w-3 h-3 bg-white/60 border-b border-r border-white/40 rotate-45" />
            </div>

            <div className="flex items-center gap-5 w-full">
              {/* Mascot Bubble */}
              <motion.div
                animate={isWiggly ? { 
                  y: [0, -15, 0],
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0]
                } : {}}
                transition={{ duration: 0.5 }}
                onClick={handleCharacterClick}
                className={`w-28 h-28 ${currentChara.bgColor} rounded-full flex items-center justify-center cursor-pointer border-4 border-white hover:brightness-105 active:scale-95 shadow-lg select-none relative group shrink-0 p-1`}
              >
                <span className="text-4xl sm:text-5xl whitespace-nowrap flex items-center justify-center tracking-tighter leading-none select-none">{stage.emoji}</span>
                <span className="absolute -bottom-2 bg-amber-500 text-white border-2 border-white font-sans font-bold text-2xs px-2.5 py-0.5 rounded-full shadow-md">
                  Lv.{charaLevel}
                </span>
                
                {/* Click tooltip overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  클릭해서 대화
                </div>
              </motion.div>

              {/* mascot description */}
              <div className="flex-1 space-y-1.5 overflow-hidden">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-xl font-black font-sans text-amber-950 leading-none">{stage.name}</h3>
                  <span className="text-xs text-amber-700/80 font-bold leading-none">{currentChara.baseName}</span>
                </div>

                {/* Level up progress */}
                <div className="pt-2">
                  <div className="flex justify-between items-center text-3xs font-mono text-amber-800 font-bold mb-1">
                    <span>Mascot XP</span>
                    <span>
                      {charaLevel >= 5
                        ? 'MAX LEVEL 👑'
                        : `${charaExp} / ${getRequiredXpForNextLevel(charaLevel)} XP (${calculateXpPercentage(charaExp, charaLevel)}%)`}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-amber-900/10 rounded-full overflow-hidden p-0.5 border border-white/50">
                    <div 
                      className={`h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]`}
                      style={{ width: `${charaLevel >= 5 ? 100 : calculateXpPercentage(charaExp, charaLevel)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action panel inside hero */}
            <div className="w-full flex gap-3 mt-4">
              <button
                onClick={() => {
                  sound.playCrunch();
                  setActiveTab('timer');
                }}
                className="w-full py-3 bg-amber-900 text-white font-black text-xs rounded-full shadow-xl shadow-amber-900/30 hover:scale-105 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Clock className="w-4 h-4 fill-white" /> {currentChara.baseName}와(과) 자습실 가기
                <ChevronRight className="w-3.5 h-3.5 stroke-[3px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Character Choice Panel */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-black font-sans text-amber-950">🐹 공부 메이트 라인업</h2>
            <p className="text-xs text-amber-800/80 font-semibold mt-1">
              동물 카드를 클릭해 메이트로 즉각 영입하세요! <span className="text-amber-600 font-extrabold">★ Lv.5 해금 시 가상 기프티콘 증정!</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CHARACTERS.map((char) => {
            const level = progress.levels[char.id];
            const currentStage = char.stages[level] || char.stages[1];
            const isSelected = progress.selectedCharacterId === char.id;

            return (
              <motion.div
                key={char.id}
                onClick={() => {
                  sound.playCrunch();
                  onSelectCharacter(char.id);
                  // Update speech dialogue to the newly selected stages
                  const s = char.stages[level];
                  if (s) {
                    setDialogue(s.dialogue[0]);
                  }
                }}
                whileHover={{ y: -4 }}
                className={`transition-all cursor-pointer relative overflow-visible flex flex-col justify-between group ${
                  isSelected 
                    ? `bg-white/60 border-2 border-amber-500 shadow-xl rounded-[30px] p-5` 
                    : 'bg-white/10 hover:bg-white/25 border border-white/20 backdrop-blur-md rounded-[30px] p-5 opacity-60 hover:opacity-100'
                }`}
              >
                {/* selected outline corner badge */}
                {isSelected && (
                  <div className={`absolute top-0 right-0 ${char.bgColor} text-white text-xs font-black font-sans px-3 py-1 rounded-bl-xl rounded-tr-[28px] shadow-sm flex items-center gap-1`}>
                    <Star className="w-3.5 h-3.5 fill-white" /> ACTIVE
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${char.bgColor} flex items-center justify-center text-xl whitespace-nowrap overflow-hidden shadow-inner border border-white/40 tracking-tighter leading-none select-none px-1`}>
                      {currentStage.emoji}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1">
                        {char.baseName}
                      </h3>
                      <p className="text-2xs text-amber-800/60 font-black uppercase tracking-wider font-mono">LEVEL {level} / 5</p>
                    </div>
                  </div>

                  {/* Level text with Hover tooltip description */}
                  <div className="mt-3.5 border-t border-amber-900/10 pt-3.5 relative">
                    <div className="text-xs font-black text-amber-950 font-sans">
                      {currentStage.name}
                    </div>
                    
                    {/* Floating Tooltip showing the rich backstory content when hovered */}
                    <div className="absolute left-1/2 top-full transform -translate-x-1/2 mt-2 w-56 text-center text-3xs font-medium bg-amber-950 text-white rounded-2xl p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-30 border border-white/20 select-none">
                      <p className="font-bold text-amber-300 text-2xs mb-1">{currentStage.name}</p>
                      <p className="text-[10px] text-amber-100/90 leading-normal font-sans font-medium">{currentStage.description}</p>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 bg-amber-950 rotate-45 border-l border-t border-white/20" />
                    </div>
                  </div>
                </div>

                {/* Progress Mini bar */}
                <div className="mt-5 space-y-1">
                  <div className="flex justify-between items-center text-3xs font-mono font-bold text-amber-800/80">
                    <span>XP</span>
                    <span>
                      {level >= 5
                        ? '만렙 달성 👑'
                        : `${progress.expPoints[char.id]} / ${getRequiredXpForNextLevel(level)} XP (${calculateXpPercentage(progress.expPoints[char.id], level)}%)`}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-amber-900/10 rounded-full overflow-hidden p-0.5 border border-white/50">
                    <div 
                      className={`h-full bg-amber-500 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.4)]`}
                      style={{ width: `${level >= 5 ? 100 : calculateXpPercentage(progress.expPoints[char.id], level)}%` }}
                    />
                  </div>
                  
                  {level >= 5 && (
                    <div className="text-3xs text-center font-bold font-sans mt-2 bg-white/60 p-2 rounded-2xl border border-white text-amber-900 animate-pulse flex items-center justify-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" /> 리워드 쿠폰 해금!
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. Study Calendar Grass Container */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[40px] p-6 shadow-lg">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-700" />
            <h3 className="font-black font-sans text-amber-950 text-sm">🔥 나의 잔디 심수 (최근 14일 공부 일지)</h3>
          </div>
          <div className="flex gap-4 items-center text-3xs font-mono font-bold text-amber-800/80">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-white/20 border border-white/10 rounded-sm" /> 0회
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-400/90 border border-emerald-400 rounded-sm" /> 맛보기
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 border border-emerald-500 rounded-sm" /> 알참
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-600 border border-emerald-600 rounded-sm" /> 완벽 🔥
            </div>
          </div>
        </div>

        {/* 14 elements study timeline */}
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 leading-none">
          {getStudyGrass().map((g, idx) => (
            <div
              key={idx}
              title={g.title}
              className={`aspect-square sm:aspect-auto sm:h-14 sm:py-2 px-1 border rounded-xl flex flex-col items-center justify-center transition-all relative group cursor-help ${g.colorClass}`}
            >
              <span className={`text-2xs font-mono font-black tracking-tight ${g.seconds > 0 ? 'text-white' : 'text-amber-950/80'}`}>{g.dayLabel}일</span>
              <span className={`text-3xs mt-1 font-bold font-mono flex items-center justify-center ${g.seconds > 0 ? 'text-emerald-100 group-hover:text-white' : 'text-amber-800/40 group-hover:text-amber-950'}`}>
                {g.seconds > 0 ? formatGrassTimeCompact(g.seconds) : '•'}
              </span>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 text-center text-3xs font-medium bg-amber-950 text-white rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-45 flex flex-col gap-0.5 border border-white/20">
                <span className="font-bold">{g.date}</span>
                <span className="text-amber-200 font-bold">{g.seconds > 0 ? `자습 정산 시간: ${formatTime(g.seconds)}` : '공부 기록이 없어요'}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-amber-800/40 mt-4 font-bold select-none italic text-center">
          * 공부 완료 시 브라우저 내장 저장소 LocalStorage에 세션 기록이 완벽 보관되어 언제든 불러오실 수 있습니다.
        </p>
      </div>

      {/* 4. Danger reset zone */}
      <div className="bg-red-500/10 backdrop-blur-md rounded-3xl p-5 border border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-black text-red-900">⚠️ 데이터 초기화</h4>
          <p className="text-3xs text-red-850 mt-0.5 font-bold">만렙 데이터, 일일 집중 시간, 누적 딴짓 감지 횟수를 모두 삭제하고 공장 출고 초기 상태로 되돌립니다.</p>
        </div>
        <button
          onClick={() => {
            if (confirm('모든 캐릭터 레벨과 누적 공부 일지가 삭제됩니다. 정말로 초기화하시겠습니까?')) {
              onResetProgress();
            }
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-750 text-white text-xs font-bold rounded-full shadow-lg shadow-red-600/20 cursor-pointer transition-all hover:scale-105 flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 데이터 리셋
        </button>
      </div>
    </div>
  );
}
