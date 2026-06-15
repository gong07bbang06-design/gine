import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterId, UserProgress } from '../types';
import { CHARACTERS } from '../data/characters';
import { sound } from './SoundGenerator';
// Using standard lucide-react icons from the group below
import { Lock, Unlock, Download, Award, TriangleAlert, Sparkles, Share2, Copy, FileText, Check } from 'lucide-react';

interface RewardClosetTabProps {
  progress: UserProgress;
  userEmail: string;
}

export default function RewardClosetTab({ progress, userEmail }: RewardClosetTabProps) {
  const [selectedCharaId, setSelectedCharaId] = useState<CharacterId | null>(null);
  const [showShareNotification, setShowShareNotification] = useState<boolean>(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleOpenVoucher = (charId: CharacterId) => {
    sound.playCrunch();
    setSelectedCharaId(charId);
  };

  const handleCloseVoucher = () => {
    sound.playCrunch();
    setSelectedCharaId(null);
  };

  // HTML Canvas Image Exporter
  const handleDownloadPNG = (charId: CharacterId) => {
    sound.playSuccessFanfare();
    const character = CHARACTERS.find((c) => c.id === charId);
    if (!character) return;

    const level = progress.levels[charId];
    if (level < 5) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions for gifticon ratio
    canvas.width = 400;
    canvas.height = 680;

    // 1. Background Fill (Slate gradient themed)
    const gd = ctx.createLinearGradient(0, 0, 0, 680);
    gd.addColorStop(0, '#1e293b'); // slate-800
    gd.addColorStop(1, '#0f172a'); // slate-900
    ctx.fillStyle = gd;
    ctx.fillRect(0, 0, 400, 680);

    // Decorative School Blueprint Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 400; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 680);
      ctx.stroke();
    }
    for (let y = 0; y < 680; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(400, y);
      ctx.stroke();
    }

    // 2. Coupon Card Holder Plate (White rounded box)
    ctx.fillStyle = '#ffffff';
    // Rounded Rect helper
    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    drawRoundRect(25, 40, 350, 500, 24);
    ctx.fill();

    // Inner dashed line
    ctx.strokeStyle = '#e2e8f0';
    ctx.setLineDash([6, 4]);
    drawRoundRect(35, 50, 330, 480, 16);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 3. Voucher Title Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px "Gowun Dodum", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('공부했닭 가상 모바일 쿠폰', 200, 100);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px "Gowun Dodum", Arial, sans-serif';
    ctx.fillText('STUDY-HESS-DAK HACKATHON PASS', 200, 122);

    // 4. Large Mascot stage Circle & badge
    const stage = character.stages[5];
    ctx.fillStyle = character.id === 'chicken' ? '#f59e0b' : character.id === 'hamster' ? '#f43f5e' : character.id === 'bear' ? '#10b981' : '#6366f1';
    ctx.beginPath();
    ctx.arc(200, 195, 48, 0, Math.PI * 2);
    ctx.fill();

    // Emoji overlay
    ctx.font = '54px Arial';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(stage.emoji, 200, 195);
    ctx.textBaseline = 'alphabetic'; // Reset baseline

    // Stage Name Badge
    ctx.fillStyle = '#1e293b';
    drawRoundRect(130, 255, 140, 24, 12);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`LEVEL 5 · ${stage.name}`, 200, 271);

    // 5. Main Voucher Title Box
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px "Gowun Dodum", sans-serif';
    
    // Split voucher title to wrap nicely if too long
    const title = character.rewardCoupon.title;
    if (title.length > 15) {
      ctx.fillText(title.substring(0, 14), 200, 316);
      ctx.fillText(title.substring(14), 200, 336);
    } else {
      ctx.fillText(title, 200, 326);
    }

    // Funny Quote
    ctx.fillStyle = '#e11d48';
    ctx.font = 'italic 10px "Gowun Dodum", sans-serif';
    ctx.fillText(character.rewardCoupon.funnyQuote, 200, 365);

    // 6. Barcode representation
    // Barcode box background
    ctx.fillStyle = '#faf5ff';
    drawRoundRect(50, 395, 300, 80, 12);
    ctx.fill();

    // Barcode vertical lines
    ctx.fillStyle = '#000000';
    let startX = 75;
    const barcodePattern = [3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 1, 2, 3, 2, 1, 4, 3, 1, 2, 4, 1, 2, 1, 3, 4, 2, 1, 3];
    barcodePattern.forEach((width, index) => {
      if (index % 2 === 0) {
        ctx.fillRect(startX, 405, width * 2, 50);
      }
      startX += width * 2.8;
    });

    // Barcode serial label
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillText(`★ CODE-5555-${charId.toUpperCase()} ★`, 200, 468);

    // 7. Recipient Signature info
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "Gowun Dodum", sans-serif';
    ctx.fillText(`발급 대상자: ${userEmail || 'gong07bbang06@gmail.com'}`, 200, 510);

    // 8. Bottom branding & disclaimer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "Gowun Dodum", sans-serif';
    ctx.fillText(character.rewardCoupon.giftIconTerms, 200, 565);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 12px "Fredoka", "Gowun Dodum", sans-serif';
    ctx.fillText('🐣 공부했닭 (Study-Hess-Dak) · MINI HACKATHON 🏆', 200, 620);

    // Trigger standard browser download of image stream
    const link = document.createElement('a');
    link.download = `VOUCHER_STUDY_DAK_${charId.toUpperCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);
  };

  const handleCopyShareLink = () => {
    sound.playCrunch();
    navigator.clipboard.writeText(`https://study-hess-dak.applet/?reward_claim_from=${userEmail}`);
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 3000);
  };

  return (
    <div className="space-y-6" id="reward-closet-root">
      {/* Invisible Canvas for programatic high-quality png generator */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Intro hero banner */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[40px] p-6 shadow-lg">
        <h2 className="text-xl font-black text-amber-950 font-sans flex items-center gap-1.5">
          <Award className="w-5 h-5 text-amber-700" /> 나의 가상 리워드 쿠폰함
        </h2>
        <p className="text-xs text-amber-900/80 mt-1 leading-relaxed font-semibold">
          공부 메이트를 <strong>최종 만렙(Level 5)</strong>까지 키우는 데 성공하셨나요? 만렙을 해금한 마스터에게는 교실 사기를 북돋아 줄 닭살 돋는 가상 모바일 쿠폰이 발송 보증됩니다! 바코드 이미지와 함께 갤러리에 다운로드하여 주번들 혹은 학우들과 공유해 보세요.
        </p>
      </div>

      {/* Copy / Share toast notification */}
      <AnimatePresence>
        {showShareNotification && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-amber-400 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold"
          >
            <Check className="w-4 h-4 text-emerald-400 stroke-[3px]" />
            <span>가상 모의고사 쿠폰공유 링크가 클립보드에 카피되었습니다!</span>
          </motion.div>
        )}
        {downloadSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-800 text-emerald-200 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>가상 쿠폰 PNG 파일 갤러리 다운로드 발급 성공!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid wrapper for the 4 character cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CHARACTERS.map((char) => {
          const level = progress.levels[char.id];
          const isUnlocked = level >= 5;
          const stageMax = char.stages[5];

          return (
            <div
              key={char.id}
              className={`rounded-[30px] border overflow-hidden flex flex-col md:flex-row relative transition-all ${
                isUnlocked 
                  ? 'border-white/50 bg-white/60 backdrop-blur-xl shadow-lg hover:shadow-xl' 
                  : 'border-white/20 bg-white/20 backdrop-blur-md opacity-60 select-none'
              }`}
            >
              {/* Left Side: Avatar and Visual Lock State */}
              <div className={`w-full md:w-1/3 p-5 flex flex-col items-center justify-center text-center relative ${
                isUnlocked ? `${char.bgColor} text-white` : 'bg-amber-950/10 border-dashed border-r border-amber-900/20 text-amber-900/40'
              }`}>
                {/* Dynamic Lock overlay */}
                {!isUnlocked && (
                  <div className="absolute top-2.5 right-2.5 bg-amber-950/20 px-2 py-0.5 rounded-lg text-2xs font-bold uppercase tracking-wider flex items-center gap-0.5">
                    <Lock className="w-3 h-3" /> Locked
                  </div>
                )}
                {isUnlocked && (
                  <div className="absolute top-2.5 right-2.5 bg-white/20 px-2.5 py-0.5 rounded-lg text-2xs font-bold uppercase tracking-wider flex items-center gap-0.5">
                    <Unlock className="w-3 h-3 text-yellow-350" /> Unlocked
                  </div>
                )}

                <span className="text-5xl filter drop-shadow whitespace-nowrap flex items-center justify-center tracking-tighter leading-none select-none">{stageMax.emoji}</span>
                <h4 className="mt-2 text-sm font-black tracking-tight">{char.baseName} 만렙</h4>
                <p className="text-3xs text-white/90 uppercase font-mono font-bold tracking-widest mt-0.5">{stageMax.name}</p>
              </div>

              {/* Right Side: details and claims */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-sans font-black text-amber-950 text-base leading-tight">
                      {char.rewardCoupon.title}
                    </h3>
                  </div>
                  <p className="text-2xs text-amber-900/80 font-bold mt-2 leading-relaxed">
                    {char.rewardCoupon.description}
                  </p>
                </div>

                {isUnlocked ? (
                  <div className="mt-5 pt-3.5 border-t border-white/50 flex gap-2">
                    <button
                      onClick={() => handleOpenVoucher(char.id)}
                      className="flex-1 py-2.5 px-3 bg-amber-900 hover:bg-amber-950 text-white rounded-full text-3xs font-black transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-amber-900/10"
                    >
                      <FileText className="w-3.5 h-3.5 text-yellow-300" /> 상세 뷰 및 바코드
                    </button>
                    <button
                      onClick={() => handleDownloadPNG(char.id)}
                      className={`py-2.5 px-3 ${char.bgColor} hover:brightness-105 text-white rounded-full text-3xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md`}
                    >
                      <Download className="w-3.5 h-3.5" /> 이미지 저장
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 pt-4 border-t border-dashed border-amber-900/20">
                    <div className="flex items-center gap-2 text-amber-900/40">
                      <Lock className="w-4 h-4 text-amber-900/40" />
                      <span className="text-3xs font-sans font-black uppercase text-amber-900/60">잠금 상태 (해금 요건)</span>
                    </div>
                    {/* Prompt detailing required experience */}
                    <div className="mt-1.5 p-2 bg-white/40 border border-white/50 rounded-xl text-3xs font-extrabold text-amber-800/80 text-left flex justify-between items-center font-mono">
                      <span>{char.baseName} 최고 레벨 (Lv. 5) 달성 필요</span>
                      <span className="text-amber-950 font-black px-1.5 py-0.5 bg-white/60 border border-white rounded">현재 Lv.{level}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Detailed Interactive Coupon Modal (Unlocks barcoded gifticon container) */}
      <AnimatePresence>
        {selectedCharaId && (() => {
          const char = CHARACTERS.find((c) => c.id === selectedCharaId)!;
          const stage = char.stages[5];
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/40 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-white/80 backdrop-blur-2xl rounded-[40px] overflow-hidden border-2 border-white shadow-2xl flex flex-col justify-between text-amber-950"
              >
                {/* Header coupon strip */}
                <div className={`p-5 text-center text-white relative ${char.bgColor} flex flex-col items-center`}>
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2.5xl mb-2 filter drop-shadow whitespace-nowrap overflow-hidden tracking-tighter leading-none select-none px-1">
                    {stage.emoji}
                  </div>
                  <h3 className="text-xl font-sans font-black">{char.rewardCoupon.title}</h3>
                  <span className="text-3xs font-mono font-bold text-white/80 mt-1 uppercase tracking-wider">공부했닭 가상 모바일 쿠폰</span>
                </div>

                <div className="p-6 space-y-6">
                  {/* Coupon card funny conditions */}
                  <div className="space-y-2">
                    <h4 className="text-2xs font-extrabold uppercase text-amber-800/60 tracking-wider">사용 가이드라인</h4>
                    <p className="text-xs text-amber-950 leading-relaxed font-black bg-white/60 p-3.5 rounded-2xl border border-white">
                      {char.rewardCoupon.description}
                    </p>
                    <blockquote className="text-rose-650 text-3xs font-extrabold italic text-center mt-1">
                      {char.rewardCoupon.funnyQuote}
                    </blockquote>
                  </div>

                  {/* Retro looking Barcode representation */}
                  <div className="bg-white/40 backdrop-blur-md p-4 rounded-3xl border-2 border-dashed border-amber-900/20 flex flex-col items-center">
                    {/* Simulated barcode bars */}
                    <div className="w-full h-12 flex gap-[2px] items-center justify-center bg-white px-3 py-1 border border-white/50 rounded-xl overflow-hidden">
                      {[1, 3, 2, 4, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 3, 2, 1, 3, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2].map((width, i) => (
                        <div 
                          key={i} 
                          className="h-full bg-amber-950 shrink-0" 
                          style={{ width: `${width}px`, opacity: i % 2 === 0 ? 1 : 0 }} 
                        />
                      ))}
                    </div>
                    <span className="mt-1.5 font-mono text-3xs font-bold text-amber-800/60 tracking-widest">★ STUDY-5555-{char.id.toUpperCase()} ★</span>
                  </div>

                  {/* Details column */}
                  <div className="space-y-1 text-3xs text-amber-800/65 font-bold">
                    <div className="flex justify-between">
                      <span>발급 번호</span>
                      <span className="font-mono text-amber-950 font-black">ST-CH-2026-0612</span>
                    </div>
                    <div className="flex justify-between">
                      <span>사용 조건</span>
                      <span className="text-amber-950 font-black">학교 자습 및 야간자율학습 수험 대기실 전용</span>
                    </div>
                    <div className="flex justify-between border-t border-amber-900/10 pt-1.5 mt-1.5 text-amber-800/80">
                      <span>발급 대상 수험생</span>
                      <span className="font-black text-amber-950">{userEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Footer action bar */}
                <div className="p-4 bg-white/50 border-t border-white flex gap-2">
                  <button
                    onClick={handleCloseVoucher}
                    className="flex-1 py-2.5 text-xs font-bold text-amber-950/80 border border-white bg-white/80 rounded-full hover:bg-white transition-colors cursor-pointer"
                  >
                    창 닫기
                  </button>
                  <button
                    onClick={handleCopyShareLink}
                    className="p-2.5 text-amber-950 bg-white/80 border border-white rounded-full hover:bg-white transition-colors cursor-pointer"
                    title="쿠폰 링크 복사"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadPNG(char.id)}
                    className={`flex-1 py-2.5 ${char.bgColor} hover:brightness-105 text-white rounded-full text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer`}
                  >
                    <Download className="w-4 h-4" /> 이미지 저장
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
