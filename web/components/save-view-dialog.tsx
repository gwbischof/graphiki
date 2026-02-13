"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

interface SaveViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description: string) => void;
}

export function SaveViewDialog({ open, onOpenChange, onSave }: SaveViewDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/5 sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Bookmark className="size-4 text-primary/70" />
            Save as View
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div>
            <label className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-1.5 block">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Financial Network"
              className="h-8 text-xs bg-white/[0.04] border-white/[0.06]"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div>
            <label className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-1.5 block">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this view show?"
              className="h-8 text-xs bg-white/[0.04] border-white/[0.06]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 text-[10px] bg-white/[0.03] border-white/[0.06]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!name.trim()}
              className="h-7 text-[10px]"
            >
              Save View
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
