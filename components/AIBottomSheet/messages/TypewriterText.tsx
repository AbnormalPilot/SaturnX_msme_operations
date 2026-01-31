import React, { useEffect, useState } from 'react';
import { Text, TextStyle } from 'react-native';

interface TypewriterTextProps {
  text: string;
  style?: TextStyle;
  onComplete?: () => void;
  speed?: number;
}

export function TypewriterText({
  text,
  style,
  onComplete,
  speed = 20,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (index === text.length && onComplete) {
      onComplete();
    }
  }, [index, text, onComplete, speed]);

  return <Text style={style}>{displayedText}</Text>;
}
