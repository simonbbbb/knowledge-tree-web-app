import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      if (target.value.trim()) {
        onSend(target.value.trim());
        target.value = '';
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder={placeholder || 'Ask about your infrastructure...'}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <Button size="icon" disabled={disabled}>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
