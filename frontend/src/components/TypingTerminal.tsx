import { useState, useEffect, useRef } from 'react';

interface TypingTerminalProps {
    messages: string[];
    speed?: number;
}

export function TypingTerminal({ messages, speed = 30 }: TypingTerminalProps) {
    const [displayedLines, setDisplayedLines] = useState<string[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentLineIndex < messages.length) {
            const currentMessage = messages[currentLineIndex];

            if (currentCharIndex < currentMessage.length) {
                const timer = setTimeout(() => {
                    setDisplayedLines(prev => {
                        const newLines = [...prev];
                        if (!newLines[currentLineIndex]) {
                            newLines[currentLineIndex] = currentMessage[currentCharIndex];
                        } else {
                            newLines[currentLineIndex] += currentMessage[currentCharIndex];
                        }
                        return newLines;
                    });
                    setCurrentCharIndex(prev => prev + 1);
                }, speed);
                return () => clearTimeout(timer);
            } else {
                // Line finished, move to next
                const timer = setTimeout(() => {
                    setCurrentLineIndex(prev => prev + 1);
                    setCurrentCharIndex(0);
                }, 500); // Wait before next line
                return () => clearTimeout(timer);
            }
        }
    }, [messages, currentLineIndex, currentCharIndex, speed]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [displayedLines]);

    return (
        <div
            ref={scrollRef}
            className="font-mono text-[10px] text-accent/80 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar"
        >
            {displayedLines.map((line, i) => (
                <div key={i} className="mb-1 py-0.5 border-l border-accent/20 pl-2">
                    <span className="text-accent/40 mr-2 opacity-50">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span className="text-white/80">{line}</span>
                </div>
            ))}
            {currentLineIndex < messages.length && (
                <div className="flex items-center gap-1 pl-2">
                    <span className="w-1.5 h-3 bg-accent animate-pulse" />
                </div>
            )}
        </div>
    );
}
