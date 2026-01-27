import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAMUMeetingRecorder } from "@/hooks/useAMUMeetingRecorder";
import { Mic, MicOff, Pause, Play, Square, Loader2, FileAudio, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { AMUMeeting } from "@/types/amu";

interface Props {
  meeting: AMUMeeting;
  onTranscriptionComplete: (result: {
    transcription: string;
    notes: Array<{ itemIndex: number; notes: string; decision: string | null }>;
    generalNotes: string;
  }) => void;
}

export function MeetingRecorderPanel({ meeting, onTranscriptionComplete }: Props) {
  const [showRecorder, setShowRecorder] = useState(false);
  
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    formatDuration,
  } = useAudioRecorder();

  const { isProcessing, transcribeMeeting } = useAMUMeetingRecorder();

  const handleStartRecording = async () => {
    const success = await startRecording();
    if (!success) {
      // Permission denied or error
      alert("Kunne ikke starte opptak. Sjekk at mikrofontilgang er gitt.");
    }
  };

  const handleProcessRecording = async () => {
    if (!audioBlob) return;

    const meetingContext = {
      title: meeting.title,
      date: format(new Date(meeting.meeting_date), "d. MMMM yyyy", { locale: nb }),
      location: meeting.location,
    };

    const agendaItems = (meeting.agenda_items || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
    }));

    const result = await transcribeMeeting(audioBlob, meetingContext, agendaItems);
    
    if (result) {
      onTranscriptionComplete({
        transcription: result.transcription,
        notes: result.notes,
        generalNotes: result.generalNotes,
      });
      resetRecording();
      setShowRecorder(false);
    }
  };

  if (!showRecorder) {
    return (
      <Button
        variant="outline"
        onClick={() => setShowRecorder(true)}
        className="gap-2"
      >
        <Mic className="h-4 w-4" />
        Ta opp møte
      </Button>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isRecording ? "bg-destructive/20 animate-pulse" : "bg-primary/10"}`}>
              {isRecording ? (
                <Mic className="h-5 w-5 text-destructive" />
              ) : (
                <MicOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Møteopptak</p>
              <p className="text-xs text-muted-foreground">
                {isRecording
                  ? isPaused
                    ? "Pauset"
                    : "Tar opp..."
                  : audioBlob
                  ? "Opptak klart"
                  : "Klar til opptak"}
              </p>
            </div>
          </div>

          {(isRecording || audioBlob) && (
            <Badge variant={isRecording ? "destructive" : "secondary"} className="font-mono">
              {formatDuration(duration)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isRecording && !audioBlob && (
            <Button onClick={handleStartRecording} size="sm" className="gap-2">
              <Mic className="h-4 w-4" />
              Start opptak
            </Button>
          )}

          {isRecording && (
            <>
              {isPaused ? (
                <Button onClick={resumeRecording} size="sm" variant="outline" className="gap-2">
                  <Play className="h-4 w-4" />
                  Fortsett
                </Button>
              ) : (
                <Button onClick={pauseRecording} size="sm" variant="outline" className="gap-2">
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              <Button onClick={stopRecording} size="sm" variant="destructive" className="gap-2">
                <Square className="h-4 w-4" />
                Stopp
              </Button>
            </>
          )}

          {audioBlob && !isRecording && (
            <>
              <Button
                onClick={handleProcessRecording}
                size="sm"
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileAudio className="h-4 w-4" />
                )}
                {isProcessing ? "Behandler..." : "Generer referat"}
              </Button>
              <Button
                onClick={resetRecording}
                size="sm"
                variant="ghost"
                disabled={isProcessing}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Slett
              </Button>
            </>
          )}

          <Button
            onClick={() => {
              resetRecording();
              setShowRecorder(false);
            }}
            size="sm"
            variant="ghost"
            disabled={isRecording || isProcessing}
          >
            Lukk
          </Button>
        </div>

        {isProcessing && (
          <div className="text-xs text-muted-foreground bg-background/50 rounded p-2">
            <p>🎙️ Transkriberer lydopptak...</p>
            <p>📝 Genererer møtereferat basert på agendapunkter...</p>
            <p className="mt-1 text-primary">Dette kan ta opptil et minutt avhengig av lengden på opptaket.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
