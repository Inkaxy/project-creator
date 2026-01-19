import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Search, Users, GraduationCap, AlertCircle, MoreHorizontal, Mail } from "lucide-react";
import { CourseEnrollment, useExpiringCertificates, useCourses } from "@/hooks/useCourses";
import { useEmployees } from "@/hooks/useEmployees";
import { format, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminEnrollmentsPanelProps {
  enrollments: CourseEnrollment[];
}

export function AdminEnrollmentsPanel({ enrollments }: AdminEnrollmentsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  const { data: courses = [] } = useCourses();
  const { data: employees = [] } = useEmployees();
  const { data: expiringCerts = [] } = useExpiringCertificates(30);

  // Stats
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter(e => e.completed_at).length;
  const inProgressEnrollments = enrollments.filter(e => !e.completed_at && (e.progress_percent || 0) > 0).length;

  // Filter enrollments
  const filteredEnrollments = enrollments.filter(enrollment => {
    const employee = enrollment.profiles;
    const course = enrollment.courses;

    const matchesSearch = 
      employee?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "completed" && enrollment.completed_at) ||
      (statusFilter === "in-progress" && !enrollment.completed_at && (enrollment.progress_percent || 0) > 0) ||
      (statusFilter === "not-started" && !enrollment.completed_at && (enrollment.progress_percent || 0) === 0);

    const matchesCourse = 
      courseFilter === "all" || enrollment.course_id === courseFilter;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  const getStatusBadge = (enrollment: CourseEnrollment) => {
    if (enrollment.completed_at) {
      return <Badge variant="success" className="bg-success/10 text-success">Fullført</Badge>;
    }
    if ((enrollment.progress_percent || 0) > 0) {
      return <Badge variant="secondary">Pågår ({enrollment.progress_percent}%)</Badge>;
    }
    return <Badge variant="outline">Ikke startet</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEnrollments}</p>
                <p className="text-sm text-muted-foreground">Totale påmeldinger</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-success/10 p-3">
                <GraduationCap className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedEnrollments}</p>
                <p className="text-sm text-muted-foreground">Fullførte</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-warning/10 p-3">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiringCerts.length}</p>
                <p className="text-sm text-muted-foreground">Sertifikater utløper</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring certificates alert */}
      {expiringCerts.length > 0 && (
        <Card className="border-warning">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Sertifikater som utløper snart
            </CardTitle>
            <CardDescription>
              Disse ansatte har sertifikater som utløper innen 30 dager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringCerts.slice(0, 5).map(cert => {
                const daysLeft = cert.certificate_expires_at 
                  ? differenceInDays(new Date(cert.certificate_expires_at), new Date())
                  : 0;
                return (
                  <div key={cert.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-3">
                      <AvatarWithInitials name={cert.profiles?.full_name || ""} size="sm" />
                      <div>
                        <p className="font-medium">{cert.profiles?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.courses?.title} - {daysLeft} dager igjen
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Send påminnelse
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk etter ansatt eller kurs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statuser</SelectItem>
            <SelectItem value="completed">Fullført</SelectItem>
            <SelectItem value="in-progress">Pågår</SelectItem>
            <SelectItem value="not-started">Ikke startet</SelectItem>
          </SelectContent>
        </Select>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Kurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kurs</SelectItem>
            {courses.map(course => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Enrollments table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ansatt</TableHead>
                <TableHead>Kurs</TableHead>
                <TableHead>Fremgang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sertifikat</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Ingen påmeldinger funnet
                  </TableCell>
                </TableRow>
              ) : (
                filteredEnrollments.map(enrollment => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <AvatarWithInitials name={enrollment.profiles?.full_name || ""} size="sm" />
                        <span className="font-medium">{enrollment.profiles?.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{enrollment.courses?.title}</p>
                        {enrollment.courses?.category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {enrollment.courses.category}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[100px]">
                        <Progress value={enrollment.progress_percent || 0} className="h-2" />
                        <span className="text-xs text-muted-foreground">
                          {enrollment.progress_percent || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(enrollment)}</TableCell>
                    <TableCell>
                      {enrollment.certificate_expires_at ? (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(enrollment.certificate_expires_at), "d. MMM yyyy", { locale: nb })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Se detaljer</DropdownMenuItem>
                          <DropdownMenuItem>Send påminnelse</DropdownMenuItem>
                          <DropdownMenuItem>Nullstill fremgang</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
