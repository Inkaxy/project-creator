import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  X, 
  Send, 
  Trash2, 
  Loader2, 
  Sparkles,
  AlertCircle,
  Calendar,
  Shield,
  AlertTriangle,
  Thermometer,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Flame,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useCrewAIChat, type CrewAIMessage } from "@/hooks/useCrewAIChat";
import { getModuleConfig } from "@/lib/crew-ai-config";
import { cn } from "@/lib/utils";

interface CrewAIChatPanelProps {
  module: string;
  contextId?: string;
  onClose: () => void;
}

// Icon mapping for quick actions
const iconMap: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  "alert-circle": AlertCircle,
  calendar: Calendar,
  shield: Shield,
  "alert-triangle": AlertTriangle,
  thermometer: Thermometer,
  "clipboard-check": ClipboardCheck,
  "file-text": FileText,
  "graduation-cap": GraduationCap,
  flame: Flame,
  clock: Clock,
  "help-circle": HelpCircle,
};

function MessageBubble({ message }: { message: CrewAIMessage }) {
  const isUser = message.role === "user";
  
  return (
    <div className={cn(
      "flex gap-2 mb-3",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className={cn(
        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-foreground"
      )}>
        <p className="whitespace-pre-wrap">{message.content || "..."}</p>
      </div>
    </div>
  );
}

export function CrewAIChatPanel({ module, contextId, onClose }: CrewAIChatPanelProps) {
  const [input, setInput] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, isLoading, sendMessage, clearMessages } = useCrewAIChat({
    module,
    contextId,
  });
  
  const moduleConfig = getModuleConfig(module);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Hide quick actions after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowQuickActions(false);
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <Card className="flex flex-col h-[600px] max-h-[calc(100vh-8rem)] shadow-2xl border-2">
      {/* Header */}
      <CardHeader className="flex-shrink-0 pb-2 pt-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">CrewAI</h3>
              <p className="text-xs text-muted-foreground">{moduleConfig.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearMessages}
                title="Tøm chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full p-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Hei! Jeg er CrewAI 👋</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {moduleConfig.description}
              </p>
            </div>
          )}

          {/* Quick actions */}
          {showQuickActions && messages.length === 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Hurtigvalg:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {moduleConfig.quickActions.map((action, index) => {
                  const IconComponent = action.icon ? iconMap[action.icon] : HelpCircle;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto py-2 px-3 text-left justify-start"
                      onClick={() => handleQuickAction(action.prompt)}
                    >
                      <IconComponent className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-xs line-clamp-2">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Loading indicator */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-2 mb-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Tenker...</span>
              </div>
            </div>
          )}

          {/* Toggle quick actions after conversation started */}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              {showQuickActions ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Skjul hurtigvalg
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Vis hurtigvalg
                </>
              )}
            </Button>
          )}

          {/* Quick actions in conversation */}
          {showQuickActions && messages.length > 0 && (
            <div className="grid grid-cols-2 gap-1 mt-2">
              {moduleConfig.quickActions.slice(0, 4).map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs justify-start"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                >
                  <span className="truncate">{action.label}</span>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv en melding..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          CrewAI kan gjøre feil. Verifiser viktig informasjon.
        </p>
      </div>
    </Card>
  );
}
