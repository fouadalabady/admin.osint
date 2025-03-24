"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import zxcvbn from "zxcvbn";

type PasswordStrengthIndicatorProps = {
  password: string;
  onScoreChange?: (score: number) => void;
};

export function PasswordStrengthIndicator({ 
  password, 
  onScoreChange
}: PasswordStrengthIndicatorProps) {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!password) {
      setScore(0);
      setFeedback("");
      if (onScoreChange) onScoreChange(0);
      return;
    }

    // Calculate password strength
    const result = zxcvbn(password);
    setScore(result.score);
    
    // Set feedback based on the score
    if (result.feedback.warning) {
      setFeedback(result.feedback.warning);
    } else if (result.score < 3) {
      setFeedback("Try using a longer password with symbols and numbers");
    } else {
      setFeedback("");
    }

    if (onScoreChange) onScoreChange(result.score);
  }, [password, onScoreChange]);

  // Determine progress color based on score
  const getProgressColor = () => {
    if (score < 2) return "bg-destructive";
    if (score < 4) return "bg-orange-500";
    return "bg-green-500";
  };

  // Get text description of password strength
  const getStrengthText = () => {
    if (!password) return "";
    const descriptions = ["Very weak", "Weak", "Fair", "Good", "Strong"];
    return descriptions[score];
  };

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Password strength: {getStrengthText()}</p>
        <p className="text-xs text-muted-foreground">{Math.min(score + 1, 4)}/4</p>
      </div>
      <Progress 
        value={(score + 1) * 20} 
        className={getProgressColor()}
      />
      {feedback && (
        <p className="text-xs text-muted-foreground">{feedback}</p>
      )}
    </div>
  );
} 