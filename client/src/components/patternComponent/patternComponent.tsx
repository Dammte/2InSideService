import './patternComponent.css';
import React, { useState, useRef, useEffect } from 'react';

interface PatternLockProps {
  onPatternComplete: (pattern: number[]) => void;
  pattern: number[];
}

const PatternLock: React.FC<PatternLockProps> = ({ onPatternComplete, pattern }) => {
  const [selectedPattern, setSelectedPattern] = useState<number[]>(pattern);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gridSize = 3;
  const dotSize = 40;
  const gap = 30;
  const canvasSize = dotSize * gridSize + gap * (gridSize - 1);

  const dotPositions = [...Array(9)].map((_, i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    return {
      x: col * (dotSize + gap) + dotSize / 2,
      y: row * (dotSize + gap) + dotSize / 2,
      index: i + 1,
    };
  });

  const getTouchedDot = (x: number, y: number) => {
    return dotPositions.find((dot) => {
      const dx = x - dot.x;
      const dy = y - dot.y;
      return Math.sqrt(dx * dx + dy * dy) < dotSize / 2 && !selectedPattern.includes(dot.index);
    });
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    dotPositions.forEach((dot) => {
      const isSelected = selectedPattern.includes(dot.index);
      const isFirst = isSelected && selectedPattern[0] === dot.index;

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = isFirst ? '#ff4500' : isSelected ? '#1e90ff' : '#d3d3d3';
      ctx.fill();
      ctx.closePath();

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotSize / 4, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#ffffff' : '#a9a9a9';
      ctx.fill();
      ctx.closePath();
    });

    if (selectedPattern.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#1e90ff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      selectedPattern.forEach((index, i) => {
        const dot = dotPositions[index - 1];
        if (i === 0) {
          ctx.moveTo(dot.x, dot.y);
        } else {
          ctx.lineTo(dot.x, dot.y);
        }
      });
      ctx.stroke();
    }

    if (isDrawing && currentPos && selectedPattern.length > 0) {
      const lastDot = dotPositions[selectedPattern[selectedPattern.length - 1] - 1];
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(30, 144, 255, 0.7)';
      ctx.lineWidth = 4;
      ctx.moveTo(lastDot.x, lastDot.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [selectedPattern, currentPos, isDrawing]);

  useEffect(() => {
    setSelectedPattern(pattern);
  }, [pattern]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    const touchedDot = getTouchedDot(x, y);
    if (touchedDot) {
      const newPattern = [...selectedPattern, touchedDot.index];
      setSelectedPattern(newPattern);
      onPatternComplete(newPattern);
    }
    setCurrentPos({ x, y });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    const touchedDot = getTouchedDot(x, y);
    if (touchedDot) {
      const newPattern = [...selectedPattern, touchedDot.index];
      setSelectedPattern(newPattern);
      onPatternComplete(newPattern);
    }
    setCurrentPos({ x, y });
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
    setCurrentPos(null);
    onPatternComplete(selectedPattern);
  };

  const handleReset = () => {
    setSelectedPattern([]);
    setCurrentPos(null);
    setIsDrawing(false);
    onPatternComplete([]);
  };

  return (
    <div className="pattern-lock-container">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className="pattern-canvas"
      />
      <div className="pattern-buttons">
        <button onClick={handleReset} className="pattern-button reset">
          Reiniciar Patrón
        </button>
      </div>
      {/* <p className="pattern-text">Patrón: {selectedPattern.length > 0 ? selectedPattern.join(' → ') : 'No seleccionado'}</p> */}
    </div>
  );
};

export default PatternLock;