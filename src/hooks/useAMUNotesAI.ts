import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface AgendaItemForAI {
  id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  decision?: string | null;
}

interface MeetingContextForAI {
  title: string;
  date: string;
  location?: string | null;
  generalNotes?: string | null;
}

interface GeneratedNotes {
  notes: Array<{
    itemIndex: number;
    notes: string;
    decision: string | null;
  }>;
  generalNotes: string;
}

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/amu-meeting-notes-ai`;

export function useAMUNotesAI() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateNotes = useCallback(async (
    agendaItems: AgendaItemForAI[],
    meetingContext: MeetingContextForAI
  ): Promise<GeneratedNotes | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          agendaItems,
          meetingContext,
          action: "generate_notes",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Kunne ikke generere notater");
      }

      const data = await response.json();
      
      if (data.parsed) {
        return data.parsed as GeneratedNotes;
      }
      
      return null;
    } catch (error) {
      console.error("Generate notes error:", error);
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke generere notater",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const summarizeMeeting = useCallback(async (
    agendaItems: AgendaItemForAI[],
    meetingContext: MeetingContextForAI
  ): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          agendaItems,
          meetingContext,
          action: "summarize",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Kunne ikke oppsummere møtet");
      }

      const data = await response.json();
      return data.content || null;
    } catch (error) {
      console.error("Summarize meeting error:", error);
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke oppsummere møtet",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const suggestDecision = useCallback(async (
    agendaItem: AgendaItemForAI
  ): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          agendaItems: [agendaItem],
          action: "suggest_decision",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Kunne ikke foreslå beslutning");
      }

      const data = await response.json();
      return data.content || null;
    } catch (error) {
      console.error("Suggest decision error:", error);
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke foreslå beslutning",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    generateNotes,
    summarizeMeeting,
    suggestDecision,
  };
}
