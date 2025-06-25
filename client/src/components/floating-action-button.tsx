import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-all z-30 md:bottom-6"
      size="icon"
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}
