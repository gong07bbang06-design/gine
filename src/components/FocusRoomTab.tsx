import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterConfig, TimerMode, UserProgress, TimerModeId } from '../types';
import { TIMER_MODES } from '../data/timerModes';
import { sound } from './SoundGenerator';
import { Play, Pause, RotateCcw, Volume2, AlertTriangle, HelpCircle, EyeOff, BookOpen, Music, CheckCircle } from 'lucide-react';

interface FocusRoomTabProps {
  character: CharacterConfig;
  currentLevel: number;
  userProgress: UserProgress;
  onSessionComplete: (durationSeconds: number) => void;
  onCheatingDetected: () => void;

  // Lifted Timer States
  selectedModeId: TimerModeId;
  setSelectedModeId: (id: TimerModeId) => void;
  secondsLeft: number;
  setSecondsLeft: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  setIsRunning: (run: boolean) => void;
  isBreak: boolean;
  setIsBreak: (brk: boolean) => void;
  totalDuration: number;
  setTotalDuration: (dur: number) => void;

  // Lifted Volume/Audio States
  rainVol: number;
  setRainVol: (v: number) => void;
  campVol: number;
  setCampVol: (v: number) => void;
  libVol: number;
  setLibVol: (v: number) => void;
  masterSoundOn: boolean;
  setMasterSoundOn: (on: boolean) => void;

  // Lifted Cheat Modal states
  cheatModalOpen: boolean;
  setCheatModalOpen: (open: boolean) => void;
  cheatMascotSentence: string;
  setCheatMascotSentence: (sentence: string) => void;

  // Custom setting states
  customFocusMinutes: number;
  setCustomFocusMinutes: (v: number) => void;
  customBreakMinutes: number;
  setCustomBreakMinutes: (v: number) => void;

  // Class period states
  currentPeriod: number;
  setCurrentPeriod: React.Dispatch<React.SetStateAction<number>>;

  // Queued Timer state for Breaks
  queuedModeId: TimerModeId | null;
  setQueuedModeId: React.Dispatch<React.SetStateAction<TimerModeId | null>>;
}

export default function FocusRoomTab({
  character,
  currentLevel,
  userProgress,
  onSessionComplete,
  onCheatingDetected,
  selectedModeId,
  setSelectedModeId,
  secondsLeft,
  setSecondsLeft,
  isRunning,
  setIsRunning,
  isBreak,
  setIsBreak,
  totalDuration,
  setTotalDuration,
  rainVol,
  setRainVol,
  campVol,
  setCampVol,
  libVol,
  setLibVol,
  masterSoundOn,
  setMasterSoundOn,
  cheatModalOpen,
  setCheatModalOpen,
  cheatMascotSentence,
  setCheatMascotSentence,
  customFocusMinutes,
  setCustomFocusMinutes,
  customBreakMinutes,
  setCustomBreakMinutes,
  currentPeriod,
  setCurrentPeriod,
  queuedModeId,
  setQueuedModeId,
}: FocusRoomTabProps) {
  const activeMode = selectedModeId === 'custom'
    ? {
        id: 'custom' as TimerModeId,
        name: '⚙️ 직접 설정 자습 모드',
        focusMinutes: customFocusMinutes,
        breakMinutes: customBreakMinutes,
        label: `내가 직접 정하는 몰입 시간 (${customFocusMinutes}분 집중 / ${customBreakMinutes}분 휴식)`
      }
    : (TIMER_MODES.find(m => m.id === selectedModeId) || TIMER_MODES[3]);
  const stage = character.stages[currentLevel] || character.stages[1];

  const handleToggleTimer = () => {
    sound.playCrunch();
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    sound.playCrunch();
    setIsRunning(false);
    const targetSec = Math.round((isBreak ? activeMode.breakMinutes : activeMode.focusMinutes) * 60);
    setSecondsLeft(targetSec);
  };

  const skipTimerForDemo = () => {
    sound.playCrunch();
    setSecondsLeft(2);
    setIsRunning(true);
  };

  // Human-readable time math
  const formatTimerDigits = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    const format = (num: number) => (num < 10 ? `0${num}` : num.toString());
    return `${format(min)}:${format(sec)}`;
  };

  // Motivational caption during study
  const getFocusMascotQuote = () => {
    if (!isRunning) {
      return `“주조님, 준비됐다면 어서 타이머를 가동해주시게나!”`;
    }
    if (isBreak) {
      return `“꿀맛 같은 교내 휴식 시간! 엎드려 자는 잠이 제일 꿀잠이다!”`;
    }
    switch (character.id) {
      case 'chicken':
        return '“아, 공부하니까 온몸이 백숙이 될 것처럼 노릇노릇 뜨거워진닭!”';
      case 'hamster':
        return '“쳇바퀴도 기출문제를 오답 정리하듯 돌리면 서울대 햄스터 쌉가능찍!”';
      case 'bear':
        return '“한 문제만 더 맞히면 인생 꿀단지가 통째로 나의 품에 안긴다웅!”';
      case 'wolf':
        return '“벼락치기의 야생적인 칼날 독해 눈빛을 시험지 위에 난사하는 중이다울프!”';
      default:
        return '“눈 깜빡하면 다른 지원자가 치고 나갑니다! 몰입하세요!”';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="focus-room-root">
      {/* 딴짓 발각 경고 긴급 모달 */}
      <AnimatePresence>
        {cheatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 border-4 border-rose-500 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <AlertTriangle className="w-8 h-8 text-rose-600 animate-pulse" />
              </div>
              
              <h2 className="text-xl font-black text-rose-600 font-sans tracking-tight">🚨 자습실 창 이탈 감지!</h2>
              <div className="my-5 p-4 bg-rose-50 rounded-2xl border border-rose-100 text-sm font-bold text-slate-800 leading-relaxed font-sans shadow-inner">
                {cheatMascotSentence}
              </div>

              <div className="text-xs text-rose-500 font-mono font-bold mb-5 flex items-center justify-center gap-1">
                <EyeOff className="w-4 h-4 animate-spin" />
                <span>PAGE VISIBILITY SENSOR TRIGGERED</span>
              </div>

              <button
                onClick={() => {
                  sound.playCrunch();
                  setCheatModalOpen(false);
                }}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                 선생님 죄송합니다! 자습 복귀하겠습니다 🙇‍♂️
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. Timer Panel (Center-Left) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[40px] p-6 shadow-lg flex flex-col items-center relative overflow-hidden">
          
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <span className={`px-3 py-1.5 text-2xs font-extrabold rounded-full flex items-center gap-1 border ${isBreak ? 'bg-indigo-50 border-indigo-200 text-indigo-950 shadow-sm' : 'bg-amber-500 border-amber-600 text-white shadow-sm'}`}>
              <BookOpen className="w-3.5 h-3.5" />
              {isBreak ? `☕ [${currentPeriod}교시] 꿀맛 같은 쉬는 시간` : `✍️ [${currentPeriod}교시] 몰입 자습 집중 시간`}
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="font-mono text-3xs text-amber-800/80 font-bold uppercase tracking-wider">Page Visibility Active</span>
              </div>
            </div>
          </div>

          {/* Queued Next Mode Indicator during rest periods */}
          {isBreak && (
            <div className="w-full mt-1 mb-4 select-none">
              {queuedModeId ? (() => {
                const queuedMode = TIMER_MODES.find(m => m.id === queuedModeId);
                return (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full py-2.5 px-4 bg-indigo-50/75 border-2 border-indigo-200 rounded-2xl text-center shadow-sm relative overflow-hidden flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="flex h-2 w-2 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <p className="text-[11px] font-bold text-indigo-950 truncate">
                        ⏱️ 다음 [{currentPeriod + 1}교시] 자습 예약: <span className="font-extrabold text-indigo-800">{queuedMode ? queuedMode.name : '⚙️ 직접 설정 자습 모드'}</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-black text-indigo-600 bg-indigo-100/80 px-2.5 py-0.5 rounded-lg animate-pulse">
                      대기 적립 중 ⏱️
                    </span>
                  </motion.div>
                );
              })() : (
                <div className="w-full py-2.5 px-4 bg-amber-50/60 border border-amber-200/50 rounded-2xl text-center shadow-sm">
                  <p className="text-[10px] font-bold text-amber-900/80 leading-relaxed">
                    💡 쉬는 시간 중에 목록에서 다른 교시를 선택하면 <strong className="font-black text-amber-950">다음 교시 대기 타이머</strong>로 누적 예약됩니다!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Big countdown graphics */}
          <div className="my-8 text-center relative select-none">
            {/* Pulsing countdown glow circle */}
            <div className="w-[280px] h-[280px] rounded-full flex flex-col items-center justify-center relative">
              {/* Colored active border ring overlay */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="140"
                  cy="140"
                  r="130"
                  stroke="rgba(120, 53, 15, 0.1)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="140"
                  cy="140"
                  r="130"
                  fill="transparent"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={isBreak ? 'stroke-indigo-400' : 'stroke-amber-600'}
                  initial={{ pathLength: 1 }}
                  animate={{ 
                    pathLength: isRunning ? secondsLeft / totalDuration : 1 
                  }}
                  transition={{ ease: 'linear' }}
                />
              </svg>

              <div className="z-10 font-sans text-[72px] font-black text-amber-950 tracking-tighter tabular-nums mt-1">
                {formatTimerDigits(secondsLeft)}
              </div>
              <div className="z-10 text-[10px] font-black text-amber-800/60 tracking-[0.2em] font-sans uppercase">
                {isBreak ? 'REST BREAK' : 'STUDY FOCUS'}
              </div>
              
              {/* Skip shortcut for evaluations */}
              <button
                onClick={skipTimerForDemo}
                title="시간 도달 테스트를 위해 타이머를 즉각 완료 상태로 전송합니다"
                className="absolute bottom-4 p-1.5 bg-white/60 border border-white text-amber-950/60 hover:bg-white hover:text-amber-950 text-3xs font-black rounded-full cursor-pointer transition-colors shadow-sm flex items-center gap-0.5"
                id="timer-instant-finish-dev-btn"
              >
                <span>⚡ 2초 남기기</span>
              </button>
            </div>
          </div>

          {/* Floating encouraging dialogue card */}
          <div className="w-full bg-white/60 rounded-[30px] p-4 border border-white mb-6 flex items-center gap-3 relative shadow-inner">
            <span className="text-3xl filter drop-shadow whitespace-nowrap flex items-center justify-center tracking-tighter shrink-0 select-none">{stage.emoji}</span>
            <p className="text-xs font-black font-sans text-amber-950 leading-relaxed">
              {getFocusMascotQuote()}
            </p>
          </div>

          {/* Timer controls */}
          <div className="flex gap-4 w-full">
            <button
              onClick={handleResetTimer}
              className="flex-1 py-4 text-amber-950 font-black text-xs bg-white/85 border border-white shadow-sm rounded-full hover:bg-white active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> 다시 시작
            </button>
            
            <button
              onClick={handleToggleTimer}
              className={`flex-[2] py-4 text-white font-black text-xs rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                isRunning 
                  ? 'bg-rose-500 shadow-rose-500/25' 
                  : 'bg-amber-900 shadow-amber-900/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white" /> 일시 정지
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" /> 자습 집중 시작!
                </>
              )}
            </button>
          </div>

          {/* Core warning explanation */}
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left text-xs font-semibold text-amber-950 leading-relaxed font-sans select-none flex items-start gap-2.5">
            <span className="text-base shrink-0 leading-none">⚠️</span>
            <p className="flex-1">
              <strong className="font-extrabold text-amber-900 block mb-0.5">자습 주의 사항</strong>
              자습 도중 다른 인터넷 창/탭을 열거나 스마트폰 브라우저 화면을 이탈하면 <span className="font-extrabold text-amber-700 underline decoration-wavy decoration-amber-500/30">페이지 비지빌리티 감지 센서</span>가 즉시 실시간 작동하여 <span className="font-extrabold text-red-650">경험치 -15 XP 패널티</span>와 함께 <span className="font-extrabold text-red-650">딴짓 감지 횟수가 누적</span>됩니다. 집중 화면을 안정되게 유지해 주세요!
            </p>
          </div>
        </div>
      </div>

      {/* 2. Audio ASMR Mixer & Mode Config (Right Column) */}
      <div className="space-y-6">
        {/* Presets choice */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[40px] p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <h3 className="font-black font-sans text-amber-950 text-sm">🕰️ 집중 시간 규칙 선택</h3>
          </div>

          <div className="space-y-2.5">
            {TIMER_MODES.map((mode) => {
              const isQueued = isBreak && queuedModeId === mode.id;
              const isSelected = selectedModeId === mode.id;
              
              let buttonStyleClass = 'border-transparent bg-white/20 hover:bg-white/30 border-white/20';
              if (isQueued) {
                buttonStyleClass = 'border-indigo-500 bg-white/80 shadow-md scale-[1.01]';
              } else if (isSelected && (!isBreak || !queuedModeId)) {
                buttonStyleClass = 'border-amber-500 bg-white/60 shadow-md scale-[1.01]';
              }

              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    sound.playCrunch();
                    if (isBreak) {
                      setQueuedModeId(mode.id);
                    } else {
                      setSelectedModeId(mode.id);
                      setIsBreak(false);
                    }
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer block ${buttonStyleClass}`}
                >
                  <div className="flex justify-between items-center select-none">
                    <span className="font-extrabold text-amber-950 text-xs">{mode.name}</span>
                    <div className="flex items-center gap-1.5">
                      {isQueued && (
                        <span className="font-mono text-[9px] font-black text-white px-2 py-0.5 bg-indigo-600 rounded-full animate-bounce">
                          ⏰ 다음 교시 예약됨
                        </span>
                      )}
                      {isSelected && isBreak && !queuedModeId && (
                        <span className="font-mono text-[9px] font-black text-white px-2 py-0.5 bg-indigo-400 rounded-full">
                          ☕ 휴식 작동중
                        </span>
                      )}
                      <span className="font-mono text-3xs font-bold text-white px-2 py-0.5 bg-amber-500 rounded-full">
                        {mode.focusMinutes >= 1 ? `${mode.focusMinutes}분` : `${Math.round(mode.focusMinutes * 60)}초`}
                      </span>
                    </div>
                  </div>
                  <p className="text-3xs text-amber-800/80 mt-1 leading-snug font-bold">
                    {mode.label}
                  </p>
                </button>
              );
            })}

            {/* Custom Mode Select Button */}
            {(() => {
              const isQueuedCustom = isBreak && queuedModeId === 'custom';
              const isSelectedCustom = selectedModeId === 'custom';

              let customButtonStyleClass = 'border-transparent bg-white/20 hover:bg-white/30 border-white/20';
              if (isQueuedCustom) {
                customButtonStyleClass = 'border-indigo-500 bg-white/80 shadow-md scale-[1.01]';
              } else if (isSelectedCustom && (!isBreak || !queuedModeId)) {
                customButtonStyleClass = 'border-amber-500 bg-white/60 shadow-md scale-[1.01]';
              }

              return (
                <button
                  onClick={() => {
                    sound.playCrunch();
                    if (isBreak) {
                      setQueuedModeId('custom');
                    } else {
                      setSelectedModeId('custom');
                      setIsBreak(false);
                    }
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer block ${customButtonStyleClass}`}
                >
                  <div className="flex justify-between items-center select-none">
                    <span className="font-extrabold text-amber-950 text-xs">⚙️ 직접 설정 자습 모드</span>
                    <div className="flex items-center gap-1.5">
                      {isQueuedCustom && (
                        <span className="font-mono text-[9px] font-black text-white px-2 py-0.5 bg-indigo-600 rounded-full animate-pulse">
                          ⏰ 다음 교시 예약됨
                        </span>
                      )}
                      {isSelectedCustom && isBreak && !queuedModeId && (
                        <span className="font-mono text-[9px] font-black text-white px-2 py-0.5 bg-indigo-400 rounded-full">
                          ☕ 휴식 작동중
                        </span>
                      )}
                      <span className="font-mono text-3xs font-bold text-white px-2.5 py-0.5 bg-indigo-500 rounded-full animate-pulse">
                        ⏱️ 커스텀
                      </span>
                    </div>
                  </div>
                  <p className="text-3xs text-amber-800/80 mt-1 leading-snug font-bold">
                    내가 직접 원하는 자습 집중 시간과 휴식 대기 시간을 설정하여 집중을 진행합니다.
                  </p>
                </button>
              );
            })()}

            {/* Custom Configuration Panel when 'custom' is selected or queued */}
            <AnimatePresence>
              {(selectedModeId === 'custom' || queuedModeId === 'custom') && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-3xl bg-amber-900/10 border border-amber-900/20 space-y-4">
                    {/* Focus Minutes Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-3xs font-extrabold text-amber-950">
                        <span>🎯 자습 집중 시간</span>
                        <span className="font-mono text-xs text-amber-900 font-black">{customFocusMinutes}분</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="180"
                        step="1"
                        value={customFocusMinutes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 25;
                          setCustomFocusMinutes(val);
                        }}
                        className="w-full accent-amber-700 h-1 bg-white/50 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {[15, 25, 45, 60, 90, 120].map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              sound.playCrunch();
                              setCustomFocusMinutes(t);
                            }}
                            className={`px-2 py-0.5 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                              customFocusMinutes === t
                                ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                                : 'bg-white/60 text-amber-905 hover:bg-white border-white'
                            }`}
                          >
                            {t}분
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Break Minutes Slider */}
                    <div className="space-y-1.5 border-t border-amber-900/10 pt-3">
                      <div className="flex justify-between items-center text-3xs font-extrabold text-amber-950">
                        <span>☕ 꿀맛 휴식 시간</span>
                        <span className="font-mono text-xs text-amber-900 font-black">{customBreakMinutes}분</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="60"
                        step="1"
                        value={customBreakMinutes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 5;
                          setCustomBreakMinutes(val);
                        }}
                        className="w-full accent-amber-700 h-1 bg-white/50 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {[5, 10, 15, 20, 30].map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              sound.playCrunch();
                              setCustomBreakMinutes(t);
                            }}
                            className={`px-2 py-0.5 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                              customBreakMinutes === t
                                ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                                : 'bg-white/60 text-amber-900 hover:bg-white border-white'
                            }`}
                          >
                            {t}분
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Audio ASMR sound board board */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[40px] p-6 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-700" />
              <h3 className="font-black font-sans text-amber-950 text-sm">🎧 백색소음 연구실 ASMR</h3>
            </div>
            {/* Master control logic */}
            <button
              onClick={() => {
                sound.playCrunch();
                setMasterSoundOn(!masterSoundOn);
              }}
              className={`px-3 py-1 text-2xs font-bold rounded-full cursor-pointer transition-all ${
                masterSoundOn ? 'bg-amber-500 text-white shadow-md' : 'bg-white/40 text-amber-950/60 hover:bg-white/60'
              }`}
            >
              {masterSoundOn ? '소리 ON' : '소리 OFF'}
            </button>
          </div>

          <p className="text-3xs text-amber-800/80 leading-relaxed font-bold">
            독서실, 야외 우물 소리 등 학생들의 뇌 가도를 증가시키는 오디오를 Procedural Web Audio 기술로 로우레벨에서 합성해 냅니다.
          </p>

          <div className="space-y-4 pt-2">
            {/* ASMR 1: Rain */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-3xs font-sans text-amber-900 font-extrabold">
                <span className="flex items-center gap-1">🌦️ 창밖 빗소리 (Rain ASMR)</span>
                <span className="font-mono">{Math.round(rainVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={rainVol}
                onChange={(e) => {
                  setRainVol(parseFloat(e.target.value));
                  if (!masterSoundOn) setMasterSoundOn(true);
                }}
                className="w-full accent-amber-600 h-1.5 bg-white/40 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* ASMR 2: Library */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-3xs font-sans text-amber-900 font-extrabold">
                <span className="flex items-center gap-1">🤫 조용한 독서실 에어컨바람 (Library)</span>
                <span className="font-mono">{Math.round(libVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={libVol}
                onChange={(e) => {
                  setLibVol(parseFloat(e.target.value));
                  if (!masterSoundOn) setMasterSoundOn(true);
                }}
                className="w-full accent-amber-600 h-1.5 bg-white/40 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* ASMR 3: Campfire */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-3xs font-sans text-amber-900 font-extrabold">
                <span className="flex items-center gap-1">🔥 모닥불 참나무 탁탁 타는소리 (Crackling)</span>
                <span className="font-mono">{Math.round(campVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={campVol}
                onChange={(e) => {
                  setCampVol(parseFloat(e.target.value));
                  if (!masterSoundOn) setMasterSoundOn(true);
                }}
                className="w-full accent-amber-600 h-1.5 bg-white/40 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
