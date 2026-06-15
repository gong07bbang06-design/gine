import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProgress, CharacterId, StudySessionRecord, TimerModeId } from './types';
import { CHARACTERS } from './data/characters';
import { TIMER_MODES } from './data/timerModes';
import LobbyTab from './components/LobbyTab';
import FocusRoomTab from './components/FocusRoomTab';
import RewardClosetTab from './components/RewardClosetTab';
import TouchValidationModal from './components/TouchValidationModal';
import { sound } from './components/SoundGenerator';
import { Sparkles, Trophy, BookOpen, Flame, GraduationCap, Award, RefreshCw, User, Settings, AlertCircle, Volume2 } from 'lucide-react';
import { getRequiredXpForNextLevel, calculateXpPercentage } from './utils/xp';

const LOCAL_STORAGE_KEY = 'study_hess_dak_progress_v2';

const initialProgress: UserProgress = {
  selectedCharacterId: 'chicken',
  levels: {
    chicken: 0,
    hamster: 0,
    bear: 0,
    wolf: 0,
  },
  expPoints: {
    chicken: 0,
    hamster: 0,
    bear: 0,
    wolf: 0,
  },
  totalFocusSeconds: 0,
  cheatingDetectedCount: 0,
  claimedCoupons: [],
  dailyHistory: [],
};

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(initialProgress);
  const [currentPeriod, setCurrentPeriod] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'lobby' | 'timer' | 'rewards'>('lobby');
  const [userEmail, setUserEmail] = useState<string>('gong07bbang06@gmail.com');
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);

  // Survival assessment popup variables
  const [survivalModalOpen, setSurvivalModalOpen] = useState<boolean>(false);
  const [survivalSessionDuration, setSurvivalSessionDuration] = useState<number>(0);

  // Level Up Screen state variables
  const [levelUpState, setLevelUpState] = useState<{
    show: boolean;
    characterId: CharacterId;
    oldLevel: number;
    newLevel: number;
  } | null>(null);

  // --- LIFTED TIMER & ASMR STATES ---
  const [selectedModeId, setSelectedModeId] = useState<TimerModeId>('demo_10s');
  const [queuedModeId, setQueuedModeId] = useState<TimerModeId | null>(null);
  const [customFocusMinutes, setCustomFocusMinutes] = useState<number>(25);
  const [customBreakMinutes, setCustomBreakMinutes] = useState<number>(5);

  const rawActiveMode = selectedModeId === 'custom'
    ? {
        id: 'custom' as TimerModeId,
        name: '⚙️ 직접 설정 자습 모드',
        focusMinutes: customFocusMinutes,
        breakMinutes: customBreakMinutes,
        label: `내가 직접 정하는 몰입 시간 (${customFocusMinutes}분 집중 / ${customBreakMinutes}분 휴식)`
      }
    : (TIMER_MODES.find(m => m.id === selectedModeId) || TIMER_MODES[3]);

  // 대수능 모드는 20분 휴식, 고등학교 모드는 10분 휴식으로 명세 규칙 보정
  const activeMode = {
    ...rawActiveMode,
    breakMinutes: selectedModeId === 'custom'
      ? customBreakMinutes
      : selectedModeId.startsWith('suneung')
        ? 20
        : selectedModeId === 'highschool'
          ? 10
          : rawActiveMode.breakMinutes
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(Math.round(activeMode.focusMinutes * 60));
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [totalDuration, setTotalDuration] = useState<number>(Math.round(activeMode.focusMinutes * 60));

  // Audio/Snd board states
  const [rainVol, setRainVol] = useState<number>(0.2);
  const [campVol, setCampVol] = useState<number>(0);
  const [libVol, setLibVol] = useState<number>(0.2);
  const [masterSoundOn, setMasterSoundOn] = useState<boolean>(true);

  // Cheat alarm states
  const [cheatModalOpen, setCheatModalOpen] = useState<boolean>(false);
  const [cheatMascotSentence, setCheatMascotSentence] = useState<string>('');

  // Ref to hold the freshest timer completion handler to avoid stale closures with setInterval
  const handleTimerCompleteRef = useRef<() => void>(() => {});
  useEffect(() => {
    handleTimerCompleteRef.current = handleTimerComplete;
  });

  // 1. Synced Mode Changer (설정이 변경될 때만 자습 1교시 집중 시간으로 초기화)
  useEffect(() => {
    if (isBreak) return; // 쉬는 시간일 경우 타이머 상태 자동 초기화를 방지합니다 (대기/누적 모드 보존)
    const targetSec = Math.round(activeMode.focusMinutes * 60);
    setSecondsLeft(targetSec);
    setTotalDuration(targetSec);
    setIsBreak(false);
    setIsRunning(false);
    setCurrentPeriod(1);
  }, [selectedModeId, customFocusMinutes, customBreakMinutes]);

  // 2. Timer Countdown Engine
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerCompleteRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isBreak]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    // Play school chime procedurally
    sound.playSchoolBell();

    if (!isBreak) {
      // Completed concentrated studying portion! Run the survival validation
      handleSessionComplete(totalDuration);
    } else {
      // Completed resting portion! Next session/period dynamically and automatically starts!
      const targetNextModeId = queuedModeId || selectedModeId;
      
      setCurrentPeriod((prev) => prev + 1);
      setIsBreak(false);
      
      if (queuedModeId) {
        setSelectedModeId(queuedModeId);
        setQueuedModeId(null);
      }
      
      const targetModeObj = targetNextModeId === 'custom'
        ? {
            focusMinutes: customFocusMinutes,
            breakMinutes: customBreakMinutes
          }
        : (TIMER_MODES.find(m => m.id === targetNextModeId) || TIMER_MODES[3]);

      const nextFocusSecs = Math.round(targetModeObj.focusMinutes * 60);
      setSecondsLeft(nextFocusSecs);
      setTotalDuration(nextFocusSecs);
      setIsRunning(true); // 유저 개입 없이 강제 연속 스타트
    }
  };

  // 3. Page Visibility Cheat Detector
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 휴식 중에는 완전히 자유로운 휴식을 위해 감시를 OFF 처리합니다.
        if (isRunning && !isBreak) {
          setIsRunning(false);
          sound.playWarning();
          adjustExperience(progress.selectedCharacterId, -15, true);

          const funnyReprimands = [
            '“어허! 주조님! 스마트폰 불빛에 뇌가 다 익어가고 있닭! 귀가 \%$가 섰으니 가만히 복귀하시오! (-15 XP 패널티)”',
            '“야자 가방을 벌써 싸려는가찍! 지금 인스타 켰지? 해바라기씨 압수해 버릴거다 찍! (-15 XP 패널티)”',
            '“카페인 각성을 마셨으면서 이탈을 감행하다니! 곰둥이 꿀단지가 비명 지르는 소리가 들리지 않느웅?! (-15 XP 패널티)”',
            '“폭풍 벼락치기를 한다더니 딴짓창을 열었구나울프! 수험생은 오직 교과서로 사냥하는 법이다울프! (-15 XP 패널티)”',
            '“교탁 위 빗자루가 부르르 떨린다... 30초 내에 이 눈빛을 감내하고 자습 모드로 원상복귀 하라! (-15 XP 패널티)”'
          ];
          // Since we want genuine Korean, let's fix that tiny escape typo there: '귀가 쫑긋 섰으니'
          const fixedFunnyReprimands = [
            '“어허! 주조님! 스마트폰 불빛에 뇌가 다 익어가고 있닭! 귀가 쫑긋 섰으니 가만히 복귀하시오! (-15 XP 패널티)”',
            '“야자 가방을 벌써 싸려는가찍! 지금 인스타 켰지? 해바라기씨 압수해 버릴거다 찍! (-15 XP 패널티)”',
            '“카페인 각성을 마셨으면서 이탈을 감행하다니! 곰둥이 꿀단지가 비명 지르는 소리가 들리지 않느웅?! (-15 XP 패널티)”',
            '“폭풍 벼락치기를 한다더니 딴짓창을 열었구나울프! 수험생은 오직 교과서로 사냥하는 법이다울프! (-15 XP 패널티)”',
            '“교탁 위 빗자루가 부르르 떨린다... 30초 내에 이 눈빛을 감내하고 자습 모드로 원상복귀 하라! (-15 XP 패널티)”'
          ];
          const chosenSentence = fixedFunnyReprimands[Math.floor(Math.random() * fixedFunnyReprimands.length)];
          setCheatMascotSentence(chosenSentence);
          setCheatModalOpen(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, progress]);


  // 4. Audio Engine Sync
  useEffect(() => {
    if (masterSoundOn) {
      if (rainVol > 0) sound.startRain(rainVol); else sound.stopRain();
      if (campVol > 0) sound.startCampfire(campVol); else sound.stopCampfire();
      if (libVol > 0) sound.startLibrary(libVol); else sound.stopLibrary();
    } else {
      sound.stopAllASMR();
    }
  }, [rainVol, campVol, libVol, masterSoundOn]);

  // Load from local storage
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Deep default check in case updates are added
        const merged: UserProgress = {
          ...initialProgress,
          ...parsed,
          levels: { ...initialProgress.levels, ...parsed.levels },
          expPoints: { ...initialProgress.expPoints, ...parsed.expPoints },
        };
        setProgress(merged);
      }
    } catch (e) {
      console.error('Error reading localStorage data', e);
    }
  }, []);

  // Save to local storage
  const saveProgress = (newProgress: UserProgress) => {
    setProgress(newProgress);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProgress));
  };

  // Select new character companion
  const handleSelectCharacter = (charId: CharacterId) => {
    const updated = {
      ...progress,
      selectedCharacterId: charId,
    };
    saveProgress(updated);
  };

  // Cheating / Vis violation tally update
  const handleCheatingDetected = () => {
    const updated = {
      ...progress,
      cheatingDetectedCount: progress.cheatingDetectedCount + 1,
    };
    saveProgress(updated);
  };

  // Experience point change handler (supporting positive levels incrementing & negative levels drop-down)
  const adjustExperience = (charId: CharacterId, offset: number, incrementCheatingCount = false) => {
    let currentLevel = progress.levels[charId];
    let currentExp = progress.expPoints[charId];

    let nextExp = currentExp + offset;
    let nextLevel = currentLevel;

    if (offset > 0) {
      if (currentLevel < 5) {
        while (nextLevel < 5) {
          const req = getRequiredXpForNextLevel(nextLevel);
          if (nextExp >= req) {
            nextExp -= req;
            nextLevel++;
            
            // Trigger Level up splash modal
            setLevelUpState({
              show: true,
              characterId: charId,
              oldLevel: currentLevel,
              newLevel: nextLevel,
            });
          } else {
            break;
          }
        }
        if (nextLevel === 5) {
          nextExp = 100; // Cap at max
        }
      } else {
        nextExp = 100; // already Level 5, Cap out
      }
    } else if (offset < 0) {
      // Negative offset: lose XP / level down
      if (nextLevel === 5) {
        nextExp = 100 + offset;
        if (nextExp < 0) {
          nextLevel = 4;
          nextExp = getRequiredXpForNextLevel(4) + nextExp;
        }
      }

      while (nextExp < 0 && nextLevel > 0) {
        nextLevel--;
        const req = getRequiredXpForNextLevel(nextLevel);
        nextExp = req + nextExp;
      }

      if (nextLevel === 0 && nextExp < 0) {
        nextExp = 0; // clamp at Level 0, 0 XP
      }
    }

    const updated: UserProgress = {
      ...progress,
      cheatingDetectedCount: incrementCheatingCount ? progress.cheatingDetectedCount + 1 : progress.cheatingDetectedCount,
      levels: {
        ...progress.levels,
        [charId]: nextLevel,
      },
      expPoints: {
        ...progress.expPoints,
        [charId]: nextExp,
      }
    };
    saveProgress(updated);
    return { oldLevel: currentLevel, newLevel: nextLevel, finalExp: nextExp };
  };

  // BETA TESTER HANDLER (Full Cheat/Distraction Simulation Engine)
  const handleDeductXpCheat = () => {
    sound.playWarning();
    const charId = progress.selectedCharacterId;
    const char = CHARACTERS.find(c => c.id === charId) || CHARACTERS[0];
    
    // 1. Increment cheating detected count
    const updatedCount = progress.cheatingDetectedCount + 1;
    
    // 2. Adjust Experience with -15 XP penalty
    const currentLevel = progress.levels[charId];
    let nextExp = progress.expPoints[charId] - 15;
    let nextLevel = currentLevel;

    if (nextExp < 0) {
      if (nextLevel > 0) {
        nextLevel--;
        nextExp = getRequiredXpForNextLevel(nextLevel) + nextExp; // rollback
      } else {
        nextExp = 0; // clamp at Lv.0, 0 XP
      }
    }

    const updated: UserProgress = {
      ...progress,
      cheatingDetectedCount: updatedCount,
      levels: {
        ...progress.levels,
        [charId]: nextLevel,
      },
      expPoints: {
        ...progress.expPoints,
        [charId]: nextExp,
      }
    };
    saveProgress(updated);

    // 3. Assemble custom warning alert statement
    const funnyReprimands = [
      '“어허! 주조님! 스마트폰 불빛에 뇌가 다 익어가고 있닭! 귀가 쫑긋 섰으니 가만히 복귀하시오! (-15 XP 패널티)”',
      '“야자 가방을 벌써 싸려는가찍! 지금 인스타 켰지? 해바라기씨 압수해 버릴거다 찍! (-15 XP 패널티)”',
      '“카페인 각성을 마셨으면서 이탈을 감행하다니! 곰둥이 꿀단지가 비명 지르는 소리가 들리지 않느웅?! (-15 XP 패널티)”',
      '“폭풍 벼락치기를 한다더니 딴짓창을 열었구나울프! 수험생은 오직 교과서로 사냥하는 법이다울프! (-15 XP 패널티)”',
      '“교탁 위 빗자루가 부르르 떨린다... 30초 내에 이 눈빛을 감내하고 자습 모드로 원상복귀 하라! (-15 XP 패널티)”'
    ];

    let specificReprimand = funnyReprimands[4]; // Default teacher
    if (charId === 'chicken') specificReprimand = funnyReprimands[0];
    else if (charId === 'hamster') specificReprimand = funnyReprimands[1];
    else if (charId === 'bear') specificReprimand = funnyReprimands[2];
    else if (charId === 'wolf') specificReprimand = funnyReprimands[3];

    if (nextLevel < currentLevel) {
      specificReprimand += `\n\n📉 [체험용 패널티] 야단법석! 경험치가 깎여 진화 단계가 강등되었습니다! (Lv.${currentLevel} ➔ Lv.${nextLevel})`;
    } else {
      specificReprimand += `\n\n📊 [체험용 패널티] 딴짓 감지 누적 +1회! 캐릭터 경험치 -15 XP (현재: ${nextExp} XP)`;
    }

    setCheatMascotSentence(specificReprimand);
    setCheatModalOpen(true);

    if (isRunning) {
      setIsRunning(false);
    }
  };

  // Session clock concluded -> launch Touch feed survival modally
  const handleSessionComplete = (durationSeconds: number) => {
    setSurvivalSessionDuration(durationSeconds);
    setSurvivalModalOpen(true);
  };

  // Handled when user successfully feeds the companion inside the 3m countdown
  const handleSurvivalSuccess = () => {
    setSurvivalModalOpen(false);

    const charId = progress.selectedCharacterId;
    const oldLevel = progress.levels[charId];
    const currentExp = progress.expPoints[charId];

    // Calculate awarded experience dynamically (longer active sessions award premium experience)
    let expAwarded = 25; // default
    if (survivalSessionDuration >= 3000) { expAwarded = 60; } // 50m focus
    else if (survivalSessionDuration >= 500) { expAwarded = 40; } // 수능 intervals
    else if (survivalSessionDuration <= 15) { expAwarded = 35; } // instantaneous demo gets +35 for simple demo level-ups!

    let nextExp = currentExp + expAwarded;
    let nextLevel = oldLevel;

    // Check level boundaries
    if (oldLevel < 5) {
      while (nextLevel < 5) {
        const req = getRequiredXpForNextLevel(nextLevel);
        if (nextExp >= req) {
          nextExp -= req;
          nextLevel++;
          
          // Trigger Level up splash modal
          setLevelUpState({
            show: true,
            characterId: charId,
            oldLevel: oldLevel,
            newLevel: nextLevel,
          });
        } else {
          break;
        }
      }
      if (nextLevel === 5) {
        nextExp = 100; // Cap out
      }
    } else {
      nextExp = 100; // Cap out
    }

    // Register active logs
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: StudySessionRecord = {
      id: Date.now().toString(),
      date: todayStr,
      durationSeconds: survivalSessionDuration,
      characterId: charId,
      level: oldLevel,
      completed: true,
      timestamp: Date.now(),
    };

    const updated: UserProgress = {
      ...progress,
      levels: {
        ...progress.levels,
        [charId]: nextLevel,
      },
      expPoints: {
        ...progress.expPoints,
        [charId]: nextExp,
      },
      totalFocusSeconds: progress.totalFocusSeconds + survivalSessionDuration,
      dailyHistory: [newRecord, ...progress.dailyHistory],
    };

    saveProgress(updated);

    // 터치 인증 완료 시 '쉬는 시간' 자동 세팅 및 즉시 시작
    setIsBreak(true);
    
    let breakSecs = 600; // 일반 고대학교 기준 10분
    if (selectedModeId.startsWith('suneung')) {
      breakSecs = 1200; // 대수능 기준 20분
    } else if (selectedModeId === 'custom') {
      breakSecs = Math.round(customBreakMinutes * 60);
    } else {
      breakSecs = Math.round(activeMode.breakMinutes * 60);
    }

    setSecondsLeft(breakSecs);
    setTotalDuration(breakSecs);
    setIsRunning(true); // 즉시 휴식 시작
  };

  // Handled when user skips or lets the 3-minute clock terminate
  const handleSurvivalFail = () => {
    setSurvivalModalOpen(false);
    
    sound.playWarning();
    const charId = progress.selectedCharacterId;
    const charStr = charId === 'chicken' ? '꼬꼬' : charId === 'hamster' ? '찍찍이' : charId === 'bear' ? '아웅이' : charId === 'wolf' ? '늑구' : '꼬꼬';
    alert(`❌ [인증 실패] 자리 비움 또는 자습 포기로 판단되어 해당 교시에 획득한 경험치가 소멸되었습니다. ${charStr}가 무척 슬퍼합니다!`);

    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: StudySessionRecord = {
      id: Date.now().toString(),
      date: todayStr,
      durationSeconds: survivalSessionDuration,
      characterId: charId,
      level: progress.levels[charId],
      completed: false,
      timestamp: Date.now(),
    };

    const updated = {
      ...progress,
      dailyHistory: [newRecord, ...progress.dailyHistory],
    };
    saveProgress(updated);
  };

  // Reset all progressive states back to blank factory state
  const handleResetProgress = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    const blankProgress: UserProgress = {
      selectedCharacterId: 'chicken',
      levels: {
        chicken: 0,
        hamster: 0,
        bear: 0,
        wolf: 0,
      },
      expPoints: {
        chicken: 0,
        hamster: 0,
        bear: 0,
        wolf: 0,
      },
      totalFocusSeconds: 0,
      cheatingDetectedCount: 0,
      claimedCoupons: [],
      dailyHistory: [],
    };

    setProgress(blankProgress);
    setCurrentPeriod(1);
    setActiveTab('lobby');
  };

  const selectedChara = CHARACTERS.find((c) => c.id === progress.selectedCharacterId) || CHARACTERS[0];
  const activeLevel = progress.levels[selectedChara.id];
  const activeStage = selectedChara.stages[activeLevel] || selectedChara.stages[5];

  // Force active sound context setup on first tab click
  const handleTabClick = (tab: 'lobby' | 'timer' | 'rewards') => {
    sound.playCrunch();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-amber-200 to-orange-200 text-amber-950 flex flex-col font-sans select-none" id="applet-main-container">
      {/* 1. Header Toolbar */}
      <header className="sticky top-0 z-40 bg-white/45 backdrop-blur-xl border-b border-white/50 px-4 py-4.5 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-2xl shadow-md border border-white animate-bounce">
              🐣
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-sans font-black text-amber-950 text-lg leading-tight tracking-tight">공부했닭</h1>
                <span className="px-1.5 py-0.5 bg-amber-500 border border-amber-600 text-white text-3xs font-extrabold rounded-md uppercase tracking-wider font-mono shadow-sm">
                  S-H-D
                </span>
              </div>
              <p className="text-3xs text-amber-800/80 font-bold uppercase tracking-wider font-mono">Study-Hess-Dak focus system</p>
            </div>
          </div>

          {/* Email personalization & configuration option */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              {isEditingEmail ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="px-2.5 py-1 text-2xs bg-white/60 border border-white rounded-xl font-mono text-amber-950 focus:outline-amber-500 shrink-0 w-44 font-bold"
                    placeholder="student@school.com"
                  />
                  <button
                    onClick={() => {
                      sound.playCrunch();
                      setIsEditingEmail(false);
                    }}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-3xs font-black rounded-full cursor-pointer transition-colors shadow-md"
                  >
                    확인
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 justify-end text-3xs font-semibold text-amber-800/60">
                  <span>수혜 대상자:</span>
                  <span className="font-mono text-amber-950/85 font-black">{userEmail}</span>
                  <button
                    onClick={() => {
                      sound.playCrunch();
                      setIsEditingEmail(true);
                    }}
                    className="text-[10px] text-amber-800/80 hover:text-amber-950 hover:underline font-bold bg-white/30 px-1.5 py-0.5 rounded border border-white/20"
                  >
                    [이메일 변경]
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Primary Navigation Section */}
      <nav className="bg-white/20 border-b border-white/40 py-3 px-4 backdrop-blur-sm shadow-inner">
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-2">
          {/* Lobby Tab */}
          <button
            onClick={() => handleTabClick('lobby')}
            className={`py-3 px-4 rounded-full font-black text-xs transition-transform hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'lobby'
                ? 'bg-white/80 border border-white text-amber-950 shadow-md scale-[1.02]'
                : 'text-amber-950/65 hover:bg-white/30 hover:text-amber-950'
            }`}
          >
            <User className="w-4 h-4 text-amber-950/80" />
            <span>대시보드</span>
          </button>

          {/* Timer Tab */}
          <button
            onClick={() => handleTabClick('timer')}
            className={`py-3 px-4 rounded-full font-black text-xs transition-transform hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'timer'
                ? 'bg-white/80 border border-white text-amber-950 shadow-md scale-[1.02]'
                : 'text-amber-950/65 hover:bg-white/30 hover:text-amber-950'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>몰입 자습방</span>
          </button>

          {/* Rewards Tab */}
          <button
            onClick={() => handleTabClick('rewards')}
            className={`py-3 px-4 rounded-full font-black text-xs transition-transform hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'rewards'
                ? 'bg-white/80 border border-white text-amber-950 shadow-md scale-[1.02]'
                : 'text-amber-950/65 hover:bg-white/30 hover:text-amber-950'
            }`}
          >
            <Award className="w-4 h-4 text-amber-700 animate-pulse" />
            <span>가상 쿠폰함</span>
          </button>
        </div>
      </nav>

      {/* 3. Central Dynamic Canvas wrapper with fade triggers */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'lobby' && (
            <motion.div
              key="lobby-panel"
              initial={{ transform: 'translateY(15px)', opacity: 0 }}
              animate={{ transform: 'translateY(0)', opacity: 1 }}
              exit={{ transform: 'translateY(-15px)', opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <LobbyTab
                progress={progress}
                onSelectCharacter={handleSelectCharacter}
                onResetProgress={handleResetProgress}
                setActiveTab={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === 'timer' && (
            <motion.div
              key="timer-panel"
              initial={{ transform: 'translateY(15px)', opacity: 0 }}
              animate={{ transform: 'translateY(0)', opacity: 1 }}
              exit={{ transform: 'translateY(-15px)', opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <FocusRoomTab
                character={selectedChara}
                currentLevel={activeLevel}
                userProgress={progress}
                onSessionComplete={handleSessionComplete}
                onCheatingDetected={handleCheatingDetected}
                selectedModeId={selectedModeId}
                setSelectedModeId={setSelectedModeId}
                secondsLeft={secondsLeft}
                setSecondsLeft={setSecondsLeft}
                isRunning={isRunning}
                setIsRunning={setIsRunning}
                isBreak={isBreak}
                setIsBreak={setIsBreak}
                totalDuration={totalDuration}
                setTotalDuration={setTotalDuration}
                rainVol={rainVol}
                setRainVol={setRainVol}
                campVol={campVol}
                setCampVol={setCampVol}
                libVol={libVol}
                setLibVol={setLibVol}
                masterSoundOn={masterSoundOn}
                setMasterSoundOn={setMasterSoundOn}
                cheatModalOpen={cheatModalOpen}
                setCheatModalOpen={setCheatModalOpen}
                cheatMascotSentence={cheatMascotSentence}
                setCheatMascotSentence={setCheatMascotSentence}
                customFocusMinutes={customFocusMinutes}
                setCustomFocusMinutes={setCustomFocusMinutes}
                customBreakMinutes={customBreakMinutes}
                setCustomBreakMinutes={setCustomBreakMinutes}
                currentPeriod={currentPeriod}
                setCurrentPeriod={setCurrentPeriod}
                queuedModeId={queuedModeId}
                setQueuedModeId={setQueuedModeId}
              />
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div
              key="rewards-panel"
              initial={{ transform: 'translateY(15px)', opacity: 0 }}
              animate={{ transform: 'translateY(0)', opacity: 1 }}
              exit={{ transform: 'translateY(-15px)', opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <RewardClosetTab progress={progress} userEmail={userEmail} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Touch validation modal activation trigger */}
      <AnimatePresence>
        {survivalModalOpen && (
          <TouchValidationModal
            character={selectedChara}
            currentLevel={activeLevel}
            onSuccess={handleSurvivalSuccess}
            onFail={handleSurvivalFail}
          />
        )}
      </AnimatePresence>

      {/* 5. Level Up Celebration Modal Overlay */}
      <AnimatePresence>
        {levelUpState?.show && (() => {
          const char = CHARACTERS.find((c) => c.id === levelUpState.characterId)!;
          const stage = char.stages[levelUpState.newLevel] || char.stages[5];
          const isMax = levelUpState.newLevel === 5;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/40 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.8, rotate: 5, opacity: 0 }}
                className="w-full max-w-sm bg-white/80 backdrop-blur-2xl rounded-[40px] p-6 border-2 border-white shadow-2xl text-center relative overflow-hidden text-amber-950"
              >
                {/* Visual confetti */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-rose-500/5 pointer-events-none" />
                
                <span className="text-5xl animate-bounce flex items-center justify-center gap-1 my-5 drop-shadow whitespace-nowrap tracking-tighter leading-none select-none">
                  {stage.emoji}
                </span>

                <h2 className="text-2xl font-black text-amber-950 tracking-tight font-sans mt-3 animate-pulse">
                   🎉 {char.baseName} 진화 성공!
                </h2>
                
                <div className="my-3 font-mono text-xs font-extrabold text-white bg-amber-500 px-3.5 py-1 rounded-full shadow-sm">
                  Level {levelUpState.oldLevel} ➔ Level {levelUpState.newLevel}
                </div>

                <div className="p-4 bg-white/60 rounded-[30px] border border-white my-4 text-xs leading-relaxed font-bold text-amber-900/80">
                  <div className="font-extrabold text-amber-950 text-sm mb-1">{stage.name}</div>
                  {stage.description}
                </div>

                <blockquote className="text-3xs text-rose-650 italic font-black my-4 leading-relaxed font-sans px-3">
                   {stage.dialogue[0]}
                </blockquote>

                {isMax && (
                  <div className="p-3 bg-amber-500 border border-amber-600 text-white rounded-3xl text-3xs font-black leading-normal mb-6 shadow-md flex items-center gap-1.5 justify-center">
                    <Award className="w-4 h-4 text-yellow-350 shrink-0 animate-spin" />
                    <span>축하합니다! 캐릭터 만렙을 달성하여 가상 모바일 쿠폰이 영구 해금되었습니다!</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    sound.playCrunch();
                    setLevelUpState(null);
                    // If maxed out, route to coupon tab directly so they can inspect immediately and praise their accomplishment!
                    if (isMax) {
                      setActiveTab('rewards');
                    }
                  }}
                  className="w-full py-4 bg-amber-900 hover:bg-amber-950 text-white font-black text-xs rounded-full shadow-xl shadow-amber-900/10 transition-transform hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  {isMax ? '보상 수락하고 쿠폰함 가기 🏆' : '열심히 자습 계속하기 ✍️'}
                </button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* 6. Compact Status Footer Disclaimer */}
      <footer className="bg-amber-950/20 backdrop-blur-md text-amber-950 py-6 px-4 border-t border-white/20 mt-auto text-center font-sans">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-3xs">
          <p className="text-amber-950/60 font-bold">
            © 2026 공부했닭 (Study-Hess-Dak) · 수험생 및 야자 탈출 전문 가상 마스터 시스템
          </p>
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-1 text-amber-950/60 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span>웹 세션 스토어: ACTIVE</span>
            </span>
            <span className="opacity-40">|</span>
            <p className="text-amber-950/60 font-bold">
              미니 해커톤 프론트엔드 출품작 (No External API Connection)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
