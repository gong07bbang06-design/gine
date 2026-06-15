import { TimerMode } from '../types';

export const TIMER_MODES: TimerMode[] = [
  {
    id: 'highschool',
    name: '🔔 정규 수업 모드',
    focusMinutes: 50,
    breakMinutes: 10,
    label: '대한민국 정규 고등학교 시간표 (50분 집중 / 10분 휴식)'
  },
  {
    id: 'suneung_korean',
    name: '📝 1교시 국어 모드',
    focusMinutes: 80,
    breakMinutes: 15,
    label: '대학수학능력시험 1교시 국어 영역 (80분 집중 실전 훈련)'
  },
  {
    id: 'suneung_math',
    name: '📐 2교시 수학 모드',
    focusMinutes: 100,
    breakMinutes: 15,
    label: '대학수학능력시험 2교시 수학 영역 (100분 집중 실전 극대화)'
  },
  {
    id: 'suneung_english',
    name: '🔤 3교시 영어 영역',
    focusMinutes: 70,
    breakMinutes: 15,
    label: '대학수학능력시험 3교시 영어 영역 (70분 집중 실전 극대화)'
  },
  {
    id: 'demo_10s',
    name: '⚡ 초고속 데모 모드 (10초)',
    focusMinutes: 1/6, // 10 seconds
    breakMinutes: 1/12, // 5 seconds
    label: '심사위원 및 빠른 테스트용 (10초 집중 / 5초 휴식)'
  },
  {
    id: 'demo_30s',
    name: '🏃‍♂️ 고속 기획 검증 모드 (30초)',
    focusMinutes: 0.5, // 30 seconds
    breakMinutes: 0.1666, // 10 seconds
    label: '체감용 및 게임 흐름 확인용 (30초 집중 / 10초 휴식)'
  }
];
