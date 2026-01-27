import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, AlertCircle, Clock } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useConversations } from '@/hooks/useConversations';
import { differenceInMonths } from 'date-fns';

interface EmployeeSelectorProps {
  selectedEmployees: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function EmployeeSelector({ selectedEmployees, onSelectionChange }: EmployeeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: employees, isLoading } = useEmployees();
  const { data: allConversations } = useConversations();

  const getLastConversation = (employeeId: string) => {
    const employeeConversations = allConversations?.filter(
      c => c.employee_id === employeeId && c.status === 'completed'
    ) || [];
    
    if (employeeConversations.length === 0) return null;
    
    return employeeConversations.sort(
      (a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
    )[0];
  };

  const filteredEmployees = employees?.filter(emp =>
    emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const toggleEmployee = (id: string) => {
    if (selectedEmployees.includes(id)) {
      onSelectionChange(selectedEmployees.filter(e => e !== id));
    } else {
      onSelectionChange([...selectedEmployees, id]);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Søk etter ansatt..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {selectedEmployees.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedEmployees.length} ansatt{selectedEmployees.length > 1 ? 'e' : ''} valgt
        </p>
      )}

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {filteredEmployees.map(employee => {
          const lastConv = getLastConversation(employee.id);
          const monthsSinceLastConv = lastConv?.completed_at
            ? differenceInMonths(new Date(), new Date(lastConv.completed_at))
            : null;
          const neverHadConversation = !lastConv;
          const longTimeSince = monthsSinceLastConv !== null && monthsSinceLastConv >= 6;

          return (
            <div
              key={employee.id}
              className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                selectedEmployees.includes(employee.id) ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => toggleEmployee(employee.id)}
            >
              <Checkbox
                checked={selectedEmployees.includes(employee.id)}
                onCheckedChange={() => toggleEmployee(employee.id)}
              />

              <Avatar className="h-10 w-10">
                <AvatarImage src={employee.avatar_url || undefined} />
                <AvatarFallback>
                  {employee.full_name ? getInitials(employee.full_name) : '??'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{employee.full_name}</span>
                  {neverHadConversation && (
                    <Badge variant="outline" className="gap-1 border-orange-500 text-orange-500">
                      <AlertCircle className="h-3 w-3" />
                      Aldri hatt samtale
                    </Badge>
                  )}
                  {longTimeSince && (
                    <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-500">
                      <Clock className="h-3 w-3" />
                      {monthsSinceLastConv}+ mnd siden
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            Ingen ansatte funnet
          </p>
        )}
      </div>
    </div>
  );
}
