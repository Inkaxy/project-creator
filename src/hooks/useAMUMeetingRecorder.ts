import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface AgendaItemForTranscription {
  id: string;
  title: string;
  description?: string | null;
}

interface MeetingContextForTranscription {
  title: string;
  date: string;
  location?: string | null;
}

interface TranscriptionResult {
  transcription: string;
  notes: Array<{
    itemIndex: number;
    notes: string;
    decision: string | null;
  }>;
  generalNotes: string;
  actionItems: Array<{
    description: string;
    responsible?: string;
  }>;
}

const TRANSCRIBE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/amu-transcribe-meeting`;

export function useAMUMeetingRecorder() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const transcribeMeeting = useCallback(async (
    audioBlob: Blob,
    meetingContext: MeetingContextForTranscription,
    agendaItems: AgendaItemForTranscription[]
  ): Promise<TranscriptionResult | null> => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "meeting-recording.webm");
      formData.append("meetingContext", JSON.stringify(meetingContext));
      formData.append("agendaItems", JSON.stringify(agendaItems));

      const response = await fetch(TRANSCRIBE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Kunne ikke transkribere møtet");
      }

      const result = await response.json();
      
      toast({
        title: "Transkribering fullført",
        description: "Møteopptak er transkribert og referat er generert.",
      });

      return result as TranscriptionResult;
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke transkribere møtet",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  return {
    isProcessing,
    transcribeMeeting,
  };
}
