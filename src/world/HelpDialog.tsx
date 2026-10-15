"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTouch: boolean;
  onReplayIntro: () => void;
}

const KEYS: [string, string][] = [
  ["WASD / arrows", "Walk"],
  ["Click / tap ground", "Walk there"],
  ["E", "Interact"],
  ["M", "Toggle map"],
  ["+ / −, scroll, pinch", "Zoom"],
  ["Esc", "Close panel"],
  ["?", "This dialog"],
];

export function HelpDialog({
  open,
  onOpenChange,
  isTouch,
  onReplayIntro,
}: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How to explore</DialogTitle>
          <DialogDescription>
            {isTouch
              ? "Tap the ground to walk, tap a glowing object to open it."
              : "Walk, click, or tab through the world — it all works."}
          </DialogDescription>
        </DialogHeader>
        <table className="w-full text-sm">
          <tbody>
            {KEYS.map(([key, action]) => (
              <tr
                key={key}
                className="border-border/50 border-t first:border-t-0"
              >
                <td className="text-foreground py-1.5 pr-3 font-mono">{key}</td>
                <td className="text-muted-foreground py-1.5">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button variant="outline" onClick={onReplayIntro}>
          Replay intro
        </Button>
      </DialogContent>
    </Dialog>
  );
}
