import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  Calendar, 
  MessageSquare, 
  Star, 
  ListTodo,
  Users,
  TrendingUp
} from 'lucide-react';
import { useConversations, useConversationStats } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationCard } from '@/components/conversations/ConversationCard';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import type { ConversationStatus } from '@/types/conversations';

export default function ConversationsPage() {
  const navigate = useNavigate();
  const { isAdminOrManager } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'scheduled' | 'completed' | 'cancelled'>('scheduled');

  const statusFilter: ConversationStatus | 'all' = activeTab === 'scheduled' 
    ? 'scheduled' 
    : activeTab === 'completed' 
      ? 'completed' 
      : 'cancelled';

  const { data: conversations, isLoading } = useConversations({ 
    status: statusFilter === 'scheduled' ? 'all' : statusFilter 
  });
  const { data: stats } = useConversationStats();

  // Filter conversations based on tab
  const filteredConversations = conversations?.filter(conv => {
    const matchesSearch = 
      conv.employee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.manager?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'scheduled') {
      return matchesSearch && ['draft', 'scheduled', 'confirmed', 'in_progress'].includes(conv.status);
    }
    return matchesSearch;
  }) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Medarbeidersamtaler</h1>
            <p className="text-muted-foreground">
              Planlegg og gjennomfør strukturerte samtaler med ansatte
            </p>
          </div>
          {isAdminOrManager() && (
            <Button onClick={() => navigate('/samtaler/ny')} className="gap-2">
              <Plus className="h-4 w-4" />
              Ny samtale
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Denne måneden</p>
                <p className="text-2xl font-bold">{stats?.thisMonth || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <MessageSquare className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gjennomført</p>
                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gj.snitt rating</p>
                <p className="text-2xl font-bold">{stats?.avgRating || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <ListTodo className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventende oppgaver</p>
                <p className="text-2xl font-bold">{stats?.pendingActions || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Samtaler</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Søk etter ansatt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="mb-4">
                <TabsTrigger value="scheduled" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Planlagt
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Gjennomført
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="gap-2">
                  Kansellert
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">Ingen samtaler</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {activeTab === 'scheduled' 
                        ? 'Det er ingen planlagte samtaler for øyeblikket.'
                        : activeTab === 'completed'
                          ? 'Ingen gjennomførte samtaler ennå.'
                          : 'Ingen kansellerte samtaler.'}
                    </p>
                    {isAdminOrManager() && activeTab === 'scheduled' && (
                      <Button onClick={() => navigate('/samtaler/ny')} className="mt-4 gap-2">
                        <Plus className="h-4 w-4" />
                        Planlegg samtale
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredConversations.map((conversation) => (
                      <ConversationCard 
                        key={conversation.id} 
                        conversation={conversation}
                        onClick={() => navigate(`/samtaler/${conversation.id}`)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
