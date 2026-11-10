import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import {
  AboutPage,
  AcademicsPage,
  AchievementsPage,
  AdmissionsPage,
  ContactPage,
  EventsPage,
  FacilitiesPage,
  GalleryPage,
  HomePage,
  LoginPage,
} from './pages/PublicPages';
import {
  AdminAcademicsPage,
  AdminAssignmentsPage,
  AdminAttendancePage,
  AdminDashboardPage,
  AdminEventsPage,
  AdminExamsResultsPage,
  AdminFeesPage,
  AdminGalleryPage,
  AdminAdmissionsPage,
  AdminNotificationsPage,
  AdminStudentsPage,
  AdminTeachersPage,
  AdminWebsitePage,
  StudentAcademicsPage,
  StudentAssignmentsPage,
  StudentAttendancePage,
  StudentDashboardPage,
  StudentExamsResultsPage,
  StudentFeesPage,
  StudentNotificationsPage,
  StudentProfilePage,
  TeacherAssignmentsPage,
  TeacherAttendancePage,
  TeacherAcademicsPage,
  TeacherClassesPage,
  TeacherDashboardPage,
  TeacherExamsResultsPage,
  TeacherNotificationsPage,
  TeacherProfilePage,
  TeacherStudentsPage,
} from './pages/PortalPages';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/academics" element={<AcademicsPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/admissions" element={<AdmissionsPage />} />
          <Route path="/admissions/apply" element={<AdmissionsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboardPage /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentProfilePage /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentAttendancePage /></ProtectedRoute>} />
          <Route path="/student/academics" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentAcademicsPage /></ProtectedRoute>} />
          <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentAssignmentsPage /></ProtectedRoute>} />
          <Route path="/student/exams-results" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentExamsResultsPage /></ProtectedRoute>} />
          <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentNotificationsPage /></ProtectedRoute>} />
          <Route path="/student/fees" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentFeesPage /></ProtectedRoute>} />

          <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboardPage /></ProtectedRoute>} />
          <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherProfilePage /></ProtectedRoute>} />
          <Route path="/teacher/classes" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherClassesPage /></ProtectedRoute>} />
          <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherStudentsPage /></ProtectedRoute>} />
          <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherAttendancePage /></ProtectedRoute>} />
          <Route path="/teacher/academics" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherAcademicsPage /></ProtectedRoute>} />
          <Route path="/teacher/exams-results" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherExamsResultsPage /></ProtectedRoute>} />
          <Route path="/teacher/assignments" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherAssignmentsPage /></ProtectedRoute>} />
          <Route path="/teacher/notifications" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherNotificationsPage /></ProtectedRoute>} />

          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN_ACADEMIC', 'SUPER_ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['ADMIN_ACADEMIC', 'SUPER_ADMIN']}><AdminStudentsPage /></ProtectedRoute>} />
          <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['ADMIN_ACADEMIC', 'SUPER_ADMIN']}><AdminTeachersPage /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['ADMIN_ACADEMIC', 'SUPER_ADMIN']}><AdminAttendancePage /></ProtectedRoute>} />
          <Route path="/admin/academics" element={<ProtectedRoute allowedRoles={['ADMIN_ACADEMIC', 'SUPER_ADMIN']}><AdminAcademicsPage /></ProtectedRoute>} />
          <Route path="/admin/exams-results" element={<ProtectedRoute allowedRoles={['ADMIN_ACADEMIC', 'SUPER_ADMIN']}><AdminExamsResultsPage /></ProtectedRoute>} />
          <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminFeesPage /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminNotificationsPage /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminEventsPage /></ProtectedRoute>} />
          <Route path="/admin/website" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminWebsitePage /></ProtectedRoute>} />
          <Route path="/admin/website/gallery" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminGalleryPage /></ProtectedRoute>} />
          <Route path="/admin/admissions" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminAdmissionsPage /></ProtectedRoute>} />
          <Route path="/admin/assignments" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminAssignmentsPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
