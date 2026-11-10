import { Link, NavLink } from 'react-router-dom';
import { Fragment, useEffect, useState } from 'react';
import { ArrowUpRight, Bell, BookOpen, CalendarDays, CircleDollarSign, ClipboardCheck, ClipboardList, GraduationCap, UserRound, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { AdminStudentsManagementPage, AdminTeachersManagementPage } from './AdminManagementPages';

function DashboardShell({ title, navItems, children, profileLabel }) {
  const { logout } = useAuth();

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-brand">SRISAI</div>
        <nav className="portal-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `portal-link ${isActive ? 'active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="portal-profile-tag">{profileLabel}</div>
      </aside>
      <main className="portal-content">
        <div className="portal-topbar">
          <h1>{title}</h1>
          <div className="form-actions">
            <Link to="/" className="secondary-btn small">School Website</Link>
            <button type="button" className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

const studentNavItems = [
  { to: '/student/dashboard', label: 'Dashboard' },
  { to: '/student/profile', label: 'My Profile' },
  { to: '/student/attendance', label: 'Attendance' },
  { to: '/student/academics', label: 'Academics' },
  { to: '/student/assignments', label: 'Assignments' },
  { to: '/student/exams-results', label: 'Exams & Results' },
  { to: '/student/notifications', label: 'Notifications' },
  { to: '/student/fees', label: 'Fees' },
];

const teacherNavItems = [
  { to: '/teacher/dashboard', label: 'Dashboard' },
  { to: '/teacher/profile', label: 'My Profile' },
  { to: '/teacher/classes', label: 'My Classes' },
  { to: '/teacher/students', label: 'Students' },
  { to: '/teacher/attendance', label: 'Attendance' },
  { to: '/teacher/academics', label: 'Academics' },
  { to: '/teacher/exams-results', label: 'Exams & Results' },
  { to: '/teacher/assignments', label: 'Assignments' },
  { to: '/teacher/notifications', label: 'Notifications' },
];

const studentCards = [
  { to: '/student/profile', label: 'My Profile', icon: UserRound },
  { to: '/student/attendance', label: 'Attendance', icon: CalendarDays },
  { to: '/student/academics', label: 'Academics', icon: BookOpen },
  { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/student/exams-results', label: 'Exams & Results', icon: GraduationCap },
  { to: '/student/notifications', label: 'Notifications', icon: Bell },
  { to: '/student/fees', label: 'Fees', icon: CircleDollarSign },
];

const teacherCards = [
  { to: '/teacher/profile', label: 'My Profile', icon: UserRound },
  { to: '/teacher/classes', label: 'My Classes', icon: BookOpen },
  { to: '/teacher/students', label: 'Students', icon: Users },
  { to: '/teacher/attendance', label: 'Attendance', icon: CalendarDays },
  { to: '/teacher/academics', label: 'Academics', icon: BookOpen },
  { to: '/teacher/exams-results', label: 'Exams & Results', icon: GraduationCap },
  { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/teacher/notifications', label: 'Notifications', icon: Bell },
];

function useStudentResource(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(endpoint);
      setData(response.data);
      return response.data;
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load student information.');
      return null;
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [endpoint]);
  return { data, loading, error, load };
}

function StudentResourceState({ loading, error }) {
  if (loading) return <p className="resource-state">Loading...</p>;
  if (error) return <div className="error-box">{error}</div>;
  return null;
}

function useTeacherResource(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(endpoint);
      setData(response.data);
      return response.data;
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load teacher information.');
      return null;
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [endpoint]);
  return { data, loading, error, load };
}

function percentage(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function StudentDashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useStudentResource('/student/dashboard');

  return (
    <DashboardShell title="Student Dashboard" navItems={studentNavItems} profileLabel={data?.student?.name || user?.username || 'Student'}>
      <StudentResourceState loading={loading} error={error} />
      <section className="student-welcome"><div><span className="eyebrow">Student Portal</span><h2>Welcome, {data?.student?.name || user?.username || 'Student'}</h2><p>{data?.student?.className || 'Your school information and learning modules'}</p></div><div className="welcome-attendance"><span>Attendance</span><strong>{percentage(data?.summary?.attendancePercentage)}</strong></div></section>
      <div className="student-dashboard-grid">
        {studentCards.map(({ to, label, icon: Icon }) => <Link className="student-dashboard-card" to={to} key={to}><Icon size={24} strokeWidth={1.8} /><span>{label}</span><ArrowUpRight size={17} className="student-card-arrow" /></Link>)}
      </div>
      <div className="student-quick-stats">
        <div><span>Pending Assignments</span><strong>{data?.summary?.pendingAssignments ?? '—'}</strong></div>
        <div><span>Upcoming Exams</span><strong>{data?.summary?.upcomingExams ?? '—'}</strong></div>
        <div><span>Notifications</span><strong>{data?.summary?.unreadNotifications ?? '—'}</strong></div>
        <div><span>Pending Fees</span><strong>{data ? `₹${Number(data.summary.pendingFees).toLocaleString('en-IN')}` : '—'}</strong></div>
      </div>
    </DashboardShell>
  );
}

export function StudentProfilePage() {
  const { data, loading, error, load } = useStudentResource('/student/profile');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const student = data?.student;
  const [form, setForm] = useState({});
  useEffect(() => {
    if (student) setForm({
      name: student.name || '',
      gender: student.gender || '',
      dob: student.dob ? new Date(student.dob).toISOString().slice(0, 10) : '',
      email: student.email || '',
      address: student.address || '',
    });
  }, [student]);
  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setFormError('');
    try {
      const response = await api.put('/student/profile', form);
      setMessage(response.data.message);
      setEditing(false);
      await load();
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <DashboardShell title="My Profile" navItems={studentNavItems} profileLabel="Student Profile">
      <StudentResourceState loading={loading} error={error} />
      {student && <section className="panel student-profile-panel"><div className="panel-heading-row"><h2>Student Profile</h2><button className="secondary-btn" type="button" onClick={() => { setEditing((value) => !value); setMessage(''); setFormError(''); }}>{editing ? 'Cancel' : 'Edit Profile'}</button></div>
        {message && <div className="success-box">{message}</div>}
        {formError && <div className="error-box">{formError}</div>}
        {editing ? <form className="student-profile-form" onSubmit={saveProfile}><div className="form-grid"><label>Name<input required minLength="2" maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Gender<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option></select></label><label>Date of Birth<input type="date" value={form.dob} onChange={(event) => setForm({ ...form, dob: event.target.value })} /></label><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="form-field-wide">Address<textarea maxLength="500" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label></div><p className="form-help">Student ID, username, class, section, roll number, and parent contact are controlled by the school.</p><div className="form-actions"><button className="primary-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button></div></form> : <dl className="student-profile-grid">
        <div><dt>Student Name</dt><dd>{student.name}</dd></div>
        <div><dt>Student ID</dt><dd>{student.studentId}</dd></div>
        <div><dt>Class</dt><dd>{student.class ? `${student.class.name} - ${student.section || student.class.section}` : 'Not assigned'}</dd></div>
        <div><dt>Section</dt><dd>{student.section || student.class?.section || 'Not assigned'}</dd></div>
        <div><dt>Roll Number</dt><dd>{student.rollNumber || 'Not assigned'}</dd></div>
        <div><dt>Room Number</dt><dd>{student.roomNumber || 'Not assigned'}</dd></div>
        <div><dt>Academic Year</dt><dd>{student.academicYear || 'Not assigned'}</dd></div>
        <div><dt>Date of Birth</dt><dd>{formatDate(student.dob)}</dd></div>
        <div><dt>Gender</dt><dd>{student.gender || 'Not provided'}</dd></div>
        <div><dt>Email</dt><dd>{student.email || 'Not provided'}</dd></div>
        <div><dt>Parent / Guardian</dt><dd>{student.parentName || 'Not provided'}</dd></div>
        <div><dt>Parent Contact</dt><dd>{student.parentContact || 'Not provided'}</dd></div>
        <div><dt>Address</dt><dd>{student.address || 'Not provided'}</dd></div>
        <div><dt>Current Attendance</dt><dd>{percentage(data.attendancePercentage)}</dd></div>
      </dl>}</section>}
    </DashboardShell>
  );
}

export function StudentAttendancePage() {
  const { data, loading, error, load } = useStudentResource('/student/attendance');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [filterError, setFilterError] = useState('');
  const [academicYear, setAcademicYear] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const submitRange = async (event) => {
    event.preventDefault();
    if (dateRange.from && dateRange.to && dateRange.from > dateRange.to) {
      setFilterError('The start date must be before the end date.');
      return;
    }
    setFilterError('');
    setAcademicYear(false);
    await loadWithParams({ from: dateRange.from || undefined, to: dateRange.to || undefined });
  };
  const loadWithParams = (params) => api.get('/student/attendance', { params }).then((response) => {
    setAttendanceData(response.data);
  }).catch((requestError) => setFilterError(requestError.response?.data?.message || 'Unable to load attendance.'));
  const [attendanceData, setAttendanceData] = useState(null);
  useEffect(() => { if (data) setAttendanceData(data); }, [data]);
  const showAcademicYear = async () => {
    setAcademicYear(true);
    setDateRange({ from: '', to: '' });
    setSelectedMonth('');
    setFilterError('');
    await loadWithParams({ academicYear: true });
  };
  const showAllAttendance = async () => {
    setAcademicYear(false);
    setDateRange({ from: '', to: '' });
    setSelectedMonth('');
    setFilterError('');
    await loadWithParams({});
  };
  const selectMonth = async (event) => {
    const month = event.target.value;
    setSelectedMonth(month);
    setAcademicYear(false);
    setFilterError('');
    await loadWithParams(month ? { month } : {});
  };
  const records = attendanceData?.daily || [];
  return (
    <DashboardShell title="Attendance" navItems={studentNavItems} profileLabel="Attendance">
      <StudentResourceState loading={loading} error={error} />
      {!loading && !error && <><section className="panel student-attendance-panel"><div className="panel-heading-row"><div><span className="eyebrow">Attendance Report</span><h2>Attendance Report</h2></div><div><span>Overall Attendance</span><strong className="attendance-overall">{percentage(attendanceData?.overallPercentage)}</strong></div></div>
        <form className="attendance-filter" onSubmit={submitRange}><label>From Date<input type="date" value={dateRange.from} onChange={(event) => setDateRange({ ...dateRange, from: event.target.value })} /></label><label>To Date<input type="date" value={dateRange.to} onChange={(event) => setDateRange({ ...dateRange, to: event.target.value })} /></label><button className="primary-btn small" type="submit">Submit</button><button className="secondary-btn dark small" type="button" onClick={showAcademicYear}>Academic Year</button><button className="secondary-btn dark small" type="button" onClick={showAllAttendance}>All Records</button></form>
        {filterError && <div className="error-box">{filterError}</div>}
        <h3>{academicYear ? `Academic-Year Attendance: ${attendanceData?.academicYear || 'Current academic year'}` : dateRange.from || dateRange.to ? `Attendance Between: From ${dateRange.from || 'earliest'} to ${dateRange.to || 'latest'}` : 'Attendance History'}</h3>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>S.No</th><th>Date</th><th>Day</th><th>Morning Session</th><th>Afternoon Session</th><th>Daily Attendance %</th></tr></thead><tbody>{records.map((record, index) => <tr key={record.date}><td>{index + 1}</td><td>{formatDate(record.date)}</td><td>{new Date(`${record.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })}</td><td>{record.morning || 'Not recorded'}</td><td>{record.afternoon || 'Not recorded'}</td><td>{percentage(record.percentage)}</td></tr>)}</tbody></table></div>
        {records.length === 0 && <p>No attendance records for this period.</p>}
      </section><section className="attendance-summary-layout"><div className="panel"><h2>Morning & Afternoon Session Attendance</h2><div className="table-scroll"><table className="data-table"><thead><tr><th>S.No</th><th>Session</th><th>Total Sessions</th><th>Present</th><th>Absent</th><th>Attendance %</th></tr></thead><tbody>{(attendanceData?.sessions || []).map((session, index) => <tr key={session.session}><td>{index + 1}</td><td>{session.session}</td><td>{session.totalSessions}</td><td>{session.present}</td><td>{session.absent}</td><td>{percentage(session.percentage)}</td></tr>)}</tbody></table></div></div><div className="panel"><div className="panel-heading-row"><h2>Monthly Attendance</h2><label>Month<select value={selectedMonth} onChange={selectMonth}><option value="">All available months</option>{(attendanceData?.monthly || []).map((month) => <option key={month.month} value={month.month}>{new Date(`${month.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>)}</select></label></div><h3>Subject-wise Attendance</h3>{attendanceData?.subjectWise?.length ? <div className="monthly-attendance-list">{attendanceData.subjectWise.map((subject) => <div key={subject.subject}><span>{subject.subject}</span><strong>{percentage(subject.percentage)}</strong></div>)}</div> : <p>No subjects assigned in the student record.</p>}</div></section></>}
    </DashboardShell>
  );
}

export function StudentAcademicsPage() {
  const { data, loading, error } = useStudentResource('/student/academics');
  return (
    <DashboardShell title="Academics" navItems={studentNavItems} profileLabel="Academics">
      <StudentResourceState loading={loading} error={error} />
      {!loading && !error && <section className="panel"><div className="panel-heading-row"><div><span className="eyebrow">{data?.class ? `${data.class.name} - ${data.class.section}` : 'Academic Programme'}</span><h2>Subjects</h2></div></div>{data?.subjects?.length ? <div className="student-subject-grid">{data.subjects.map((subject) => <article className="student-subject-row" key={subject.id}><BookOpen size={20} /><span>{subject.name}</span><span className="subject-code">{subject.code || ''}</span></article>)}</div> : <p>No subjects have been assigned to your class yet.</p>}</section>}
    </DashboardShell>
  );
}

export function StudentAssignmentsPage() {
  const { data, loading, error, load } = useStudentResource('/student/assignments');
  const [savingId, setSavingId] = useState('');
  const [actionError, setActionError] = useState('');
  const assignments = data?.assignments || [];
  const setCompleted = async (assignment, completed) => {
    setSavingId(assignment.id);
    setActionError('');
    try {
      await api.patch(`/student/assignments/${assignment.id}/completion`, { completed });
      await load();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to update assignment status.');
    } finally {
      setSavingId('');
    }
  };
  return (
    <DashboardShell title="Assignments" navItems={studentNavItems} profileLabel="Assignments">
      <StudentResourceState loading={loading} error={error} />{actionError && <div className="error-box">{actionError}</div>}
      {!loading && !error && (assignments.length ? <div className="student-assignment-list">{assignments.map((assignment) => <article className="student-assignment" key={assignment.id}><div className="panel-heading-row"><div><span className="eyebrow">{assignment.subject?.name || 'Class Assignment'}</span><h2>{assignment.title}</h2></div><span className={`student-status ${assignment.status.toLowerCase()}`}>{assignment.status === 'COMPLETED' ? 'Completed' : assignment.status === 'OVERDUE' ? 'Overdue' : 'Pending'}</span></div><p>{assignment.description || 'No additional instructions provided.'}</p><div className="assignment-date-row"><span>Posted {formatDate(assignment.publishedAt)}</span><span>Due {formatDate(assignment.dueDate)}</span></div><label className="completion-toggle"><input type="checkbox" checked={assignment.status === 'COMPLETED'} disabled={savingId === assignment.id} onChange={(event) => setCompleted(assignment, event.target.checked)} /><span>Mark as Completed</span></label></article>)}</div> : <div className="panel"><p>No assignments have been posted for your class yet.</p></div>)}
    </DashboardShell>
  );
}

export function StudentExamsResultsPage() {
  const { data, loading, error } = useStudentResource('/student/exams-results');
  return (
    <DashboardShell title="Exams & Results" navItems={studentNavItems} profileLabel="Exams">
      <StudentResourceState loading={loading} error={error} />
      {!loading && !error && <><section className="panel"><div className="panel-heading-row"><div><span className="eyebrow">Academic Record</span><h2>Exams & Results</h2></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Exam Name</th><th>Subject</th><th>Maximum Marks</th><th>Marks Obtained</th><th>Grade</th><th>Percentage</th><th>Rank</th></tr></thead><tbody>{(data?.results || []).map((result) => <tr key={result.id}><td>{result.exam.name}</td><td>{result.exam.subject?.name || '—'}</td><td>{result.exam.maxMarks}</td><td>{result.marks}</td><td>{result.grade}</td><td>{percentage(result.percentage)}</td><td>{result.rank ?? '—'}</td></tr>)}</tbody></table></div>{!data?.results?.length && <p>No exam results have been published yet.</p>}</section><section className="student-quick-stats results-summary"><div><span>Total Marks</span><strong>{data?.summary?.maxMarks ?? 0}</strong></div><div><span>Marks Obtained</span><strong>{data?.summary?.marks ?? 0}</strong></div><div><span>Overall Percentage</span><strong>{percentage(data?.summary?.percentage)}</strong></div><div><span>Overall Grade</span><strong>{data?.summary?.grade || 'N/A'}</strong></div><div><span>Rank</span><strong>{data?.summary?.rank ? `#${data.summary.rank}` : '—'}</strong></div></section></>}
    </DashboardShell>
  );
}

export function StudentNotificationsPage() {
  const { data, loading, error } = useStudentResource('/student/notifications');
  return (
    <DashboardShell title="Notifications" navItems={studentNavItems} profileLabel="Notifications">
      <StudentResourceState loading={loading} error={error} />
      {!loading && !error && <section className="panel"><div className="panel-heading-row"><div><span className="eyebrow">Student Updates</span><h2>Notifications</h2></div></div>{data?.notifications?.length ? <div className="student-notification-list">{data.notifications.map((notification) => <article className="student-notification" key={notification.id}><div className="notification-symbol"><Bell size={19} /></div><div><div className="panel-heading-row"><h3>{notification.title}</h3><small>{formatDate(notification.createdAt)}</small></div><p>{notification.message}</p></div></article>)}</div> : <p>No notifications yet.</p>}</section>}
    </DashboardShell>
  );
}

export function StudentFeesPage() {
  const { data, loading, error } = useStudentResource('/student/fees');
  const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  return (
    <DashboardShell title="Fees" navItems={studentNavItems} profileLabel="Fees">
      <StudentResourceState loading={loading} error={error} />
      {!loading && !error && <><section className="panel"><div className="panel-heading-row"><div><span className="eyebrow">DEMO / TEST DATA</span><h2>Fee Summary</h2></div></div><div className="fee-summary-grid"><div><span>Total Fee</span><strong>{money(data?.summary?.committed)}</strong></div><div><span>Amount Paid</span><strong>{money(data?.summary?.paid)}</strong></div><div><span>Amount Due</span><strong>{money(data?.summary?.pending)}</strong></div></div></section><section className="panel"><h2>Fee Breakdown</h2><p className="form-help">These are seeded development records and are not real financial statements.</p><div className="table-scroll"><table className="data-table"><thead><tr><th>Category</th><th>Fee</th><th>Total Fee</th><th>Paid</th><th>Balance to Pay</th><th>Due Date</th></tr></thead><tbody>{(data?.fees || []).map((fee) => <tr key={fee.id}><td>{fee.category}</td><td>{fee.title}</td><td>{money(fee.amount)}</td><td>{money(fee.payments?.length ? fee.payments.reduce((sum, payment) => sum + payment.amount, 0) : fee.paidAmount)}</td><td>{money(Math.max(0, fee.amount - (fee.payments?.length ? fee.payments.reduce((sum, payment) => sum + payment.amount, 0) : fee.paidAmount)))}</td><td>{formatDate(fee.dueDate)}</td></tr>)}</tbody></table></div>{!data?.fees?.length && <p>No fee records are available.</p>}</section></>}
    </DashboardShell>
  );
}

export function TeacherDashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useTeacherResource('/teacher/dashboard');
  const canTakeAttendance = data?.summary?.isClassTeacher === true;
  const dashboardCards = teacherCards.filter((card) => canTakeAttendance || card.to !== '/teacher/attendance');
  const dashboardNavItems = teacherNavItems.filter((item) => canTakeAttendance || item.to !== '/teacher/attendance');

  return (
    <DashboardShell title="Teacher Dashboard" navItems={dashboardNavItems} profileLabel={data?.teacher?.name || user?.username || 'Teacher'}>
      <StudentResourceState loading={loading} error={error} />
      <section className="student-welcome"><div><span className="eyebrow">Teacher Portal</span><h2>Welcome, {data?.teacher?.name || user?.username || 'Teacher'}</h2><p>{data?.teacher?.employeeId || 'Your classes, students, and school work'}</p></div><div className="welcome-attendance"><span>Class Attendance Today</span><strong>{percentage(data?.summary?.attendanceToday)}</strong></div></section>
      <div className="student-dashboard-grid teacher-dashboard-grid">{dashboardCards.map(({ to, label, icon: Icon }) => <Link className="student-dashboard-card" to={to} key={to}><Icon size={24} strokeWidth={1.8} /><span>{label}</span><ArrowUpRight size={17} className="student-card-arrow" /></Link>)}</div>
      <div className="student-quick-stats teacher-quick-stats"><div><span>Classes</span><strong>{data?.summary?.assignedClasses ?? '—'}</strong></div><div><span>Students</span><strong>{data?.summary?.studentsCount ?? '—'}</strong></div><div><span>Assignments Due</span><strong>{data?.summary?.pendingAssignments ?? '—'}</strong></div><div><span>Upcoming Exams</span><strong>{data?.summary?.upcomingExams ?? '—'}</strong></div><div><span>Notifications</span><strong>{data?.summary?.unreadNotifications ?? '—'}</strong></div></div>
    </DashboardShell>
  );
}

export function TeacherProfilePage() {
  const { data, loading, error } = useTeacherResource('/teacher/profile');
  const teacher = data?.teacher;
  return (
    <DashboardShell title="My Profile" navItems={teacherNavItems} profileLabel="Teacher Profile">
      <StudentResourceState loading={loading} error={error} />
      {teacher && <section className="panel student-profile-panel"><h2>Teacher Profile</h2><dl className="student-profile-grid"><div><dt>Employee ID</dt><dd>{teacher.employeeId}</dd></div><div><dt>Employee Name</dt><dd>{teacher.name}</dd></div><div><dt>Subjects Taught</dt><dd>{teacher.subjects.length ? [...new Set(teacher.subjects.map((subject) => subject.name))].join(', ') : 'Not assigned'}</dd></div><div><dt>Classes Taught</dt><dd>{teacher.classes.length ? teacher.classes.map((schoolClass) => `${schoolClass.name} - ${schoolClass.section}`).join(', ') : 'Not assigned'}</dd></div></dl></section>}
    </DashboardShell>
  );
}

export function TeacherClassesPage() {
  const { data, loading, error } = useTeacherResource('/teacher/classes');
  return (
    <DashboardShell title="My Classes" navItems={teacherNavItems} profileLabel="Classes">
      <StudentResourceState loading={loading} error={error} />
      {!loading && !error && <section className="panel"><h2>My Classes</h2>{data?.classes?.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Class</th><th>Section</th><th>Students</th><th>Subjects</th><th>Class Teacher</th></tr></thead><tbody>{data.classes.map((schoolClass) => <tr key={schoolClass.id}><td>{schoolClass.name}</td><td>{schoolClass.section}</td><td>{schoolClass.students.length}</td><td>{schoolClass.subjects.map((subject) => subject.name).join(', ') || '—'}</td><td>{schoolClass.isClassTeacher ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div> : <p>No classes are assigned to this teacher account.</p>}</section>}
    </DashboardShell>
  );
}

export function TeacherStudentsPage() {
  const { data, loading, error, load } = useTeacherResource('/teacher/students');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', studentId: '', username: '', dateOfBirth: '', gender: '', roomNumber: '', parentName: '', parentContact: '', email: '', address: '' });
  useEffect(() => {
    if (data?.classes?.length && !selectedClassId) setSelectedClassId(data.classes[0].id);
  }, [data, selectedClassId]);
  const selectedClass = data?.classes?.find((schoolClass) => schoolClass.id === selectedClassId);
  const students = (data?.students || []).filter((student) => !selectedClassId || student.classId === selectedClassId);
  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const addStudent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    setMessage('');
    try {
      const response = await api.post('/teacher/students', { ...form, classId: selectedClassId, dateOfBirth: form.dateOfBirth || null });
      setMessage(`Student added. Temporary login password: ${response.data.temporaryPassword}`);
      setForm({ name: '', studentId: '', username: '', dateOfBirth: '', gender: '', roomNumber: '', parentName: '', parentContact: '', email: '', address: '' });
      setAddingStudent(false);
      await load();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to add student.');
    } finally {
      setSaving(false);
    }
  };
  const removeStudent = async (student) => {
    if (!window.confirm(`Remove ${student.name} and their linked school records?`)) return;
    setActionError('');
    setMessage('');
    try {
      await api.delete(`/teacher/students/${student.id}`);
      setMessage(`${student.name} was removed from the roster.`);
      await load();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to remove student.');
    }
  };
  return (
    <DashboardShell title="Students" navItems={teacherNavItems} profileLabel="Students">
      <div className="panel">
        <div className="panel-heading-row"><div><span className="eyebrow">Class Roster</span><h2>Students</h2></div>{selectedClass?.isClassTeacher && <button className="primary-btn small" type="button" onClick={() => setAddingStudent((open) => !open)}>{addingStudent ? 'Cancel' : '+ Add Student'}</button>}</div>
        <StudentResourceState loading={loading} error={error} />
        {actionError && <div className="error-box">{actionError}</div>}{message && <div className="success-box">{message}</div>}
        <label className="student-class-filter">Class<select value={selectedClassId} onChange={(event) => { setSelectedClassId(event.target.value); setAddingStudent(false); }}><option value="">All classes</option>{(data?.classes || []).map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name} - {schoolClass.section}</option>)}</select></label>
        {addingStudent && selectedClass?.isClassTeacher && <form className="student-add-form" onSubmit={addStudent}><label>Student Name<input name="name" value={form.name} onChange={updateForm} required /></label><label>Student ID<input name="studentId" value={form.studentId} onChange={updateForm} required /></label><label>Username / Login ID<input name="username" value={form.username} onChange={updateForm} minLength="3" required /></label><label>Date of Birth<input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateForm} /></label><label>Gender<input name="gender" value={form.gender} onChange={updateForm} /></label><label>Room Number<input name="roomNumber" value={form.roomNumber} onChange={updateForm} /></label><label>Parent / Guardian<input name="parentName" value={form.parentName} onChange={updateForm} /></label><label>Parent Contact<input name="parentContact" value={form.parentContact} onChange={updateForm} /></label><label>Email<input name="email" type="email" value={form.email} onChange={updateForm} /></label><label>Address<input name="address" value={form.address} onChange={updateForm} /></label><button className="primary-btn" type="submit" disabled={saving}>{saving ? 'Adding...' : `Add to ${selectedClass.name} - ${selectedClass.section}`}</button></form>}
        {selectedClass && !selectedClass.isClassTeacher && <p className="resource-state">Only the assigned class teacher can add or remove students in this class.</p>}
        {!loading && !error && <div className="table-scroll"><table className="data-table"><thead><tr><th>Roll No.</th><th>Student Name</th><th>Student ID</th><th>Class</th><th>Section</th><th>Action</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td>{student.rollNumber || '—'}</td><td>{student.name}</td><td>{student.studentId}</td><td>{student.class.name}</td><td>{student.class.section}</td><td>{student.isClassTeacher && <button className="danger-btn small" type="button" onClick={() => removeStudent(student)}>Remove</button>}</td></tr>)}</tbody></table></div>}
      </div>
    </DashboardShell>
  );
}

export function TeacherAttendancePage() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [session, setSession] = useState('MORNING');
  const [attendanceData, setAttendanceData] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const loadClasses = async () => {
    try {
      const response = await api.get('/teacher/classes');
      const classTeacherClasses = (response.data.classes || []).filter((schoolClass) => schoolClass.isClassTeacher);
      setClasses(classTeacherClasses);
      setClassId((current) => current || classTeacherClasses[0]?.id || '');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load assigned classes.');
      setLoading(false);
    }
  };
  const loadAttendance = async () => {
    if (!classId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/teacher/attendance', { params: { classId, date } });
      setAttendanceData(response.data);
      const nextStatuses = {};
      response.data.students.forEach((student) => { nextStatuses[student.id] = ''; });
      response.data.attendance.filter((record) => record.session === session).forEach((record) => { nextStatuses[record.studentId] = record.status; });
      setStatuses(nextStatuses);
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load class attendance.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { loadAttendance(); }, [classId, date, session]);
  const saveAttendance = async (event) => {
    event.preventDefault();
    if (!attendanceData?.students?.length) {
      setError('No students are available for this class.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/teacher/attendance', { classId, date, session, records: attendanceData.students.map((student) => ({ studentId: student.id, status: statuses[student.id] === 'PRESENT' ? 'PRESENT' : 'ABSENT' })) });
      setMessage(isEditing ? 'Attendance changes saved successfully.' : 'Attendance submitted successfully.');
      setIsEditing(false);
      await loadAttendance();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save attendance.');
    } finally {
      setSaving(false);
    }
  };
  const sessionSummary = ['MORNING', 'AFTERNOON'].map((key) => {
    const rows = (attendanceData?.attendance || []).filter((record) => record.session === key);
    return { key, total: rows.length, present: rows.filter((record) => record.status === 'PRESENT').length, records: rows };
  });
  const reportRows = (attendanceData?.attendance || []).filter((record) => record.session === session);
  const selectedClass = classes.find((schoolClass) => schoolClass.id === classId);
  const hasSavedReport = reportRows.length > 0;
  const day = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long' });
  return (
    <DashboardShell title="Attendance" navItems={teacherNavItems} profileLabel="Attendance">
      <section className="panel"><div className="panel-heading-row"><div><span className="eyebrow">Class Teacher Access</span><h2>Class Attendance</h2></div></div>
        {error && <div className="error-box">{error}</div>}{message && <div className="success-box">{message}</div>}
        {!classes.length && !loading && <p>You are not assigned as a class teacher. Only class teachers can record attendance.</p>}
        {classes.length > 0 && <><div className="teacher-attendance-filters"><label>Class<select value={classId} onChange={(event) => setClassId(event.target.value)}>{classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name} - {schoolClass.section}</option>)}</select></label><label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></div><div className="session-switch" role="group" aria-label="Attendance session"><button type="button" className={session === 'MORNING' ? 'active' : ''} onClick={() => setSession('MORNING')}>Morning Session</button><button type="button" className={session === 'AFTERNOON' ? 'active' : ''} onClick={() => setSession('AFTERNOON')}>Afternoon Session</button></div>
          {(!hasSavedReport || isEditing) && <form onSubmit={saveAttendance}><h3>{isEditing ? 'Edit Attendance' : 'Take Attendance'}</h3><div className="table-scroll"><table className="data-table"><thead><tr><th>Roll No.</th><th>Student Name</th><th>Student ID</th><th>Attendance</th></tr></thead><tbody>{(attendanceData?.students || []).map((student) => <tr key={student.id}><td>{student.rollNumber || '—'}</td><td>{student.name}</td><td>{student.studentId}</td><td><input type="checkbox" aria-label={`${student.name} attendance`} checked={statuses[student.id] === 'PRESENT'} onChange={(event) => setStatuses((current) => ({ ...current, [student.id]: event.target.checked ? 'PRESENT' : 'ABSENT' }))} /></td></tr>)}</tbody></table></div><div className="form-actions attendance-save-actions"><span>{loading ? 'Loading roster...' : `${attendanceData?.students?.length || 0} students`}</span><button className="primary-btn" type="submit" disabled={loading || saving || !attendanceData?.students?.length}>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Submit Attendance'}</button>{isEditing && <button className="secondary-btn" type="button" onClick={() => { setIsEditing(false); loadAttendance(); }}>Cancel</button>}</div></form>}
          {hasSavedReport && !isEditing && <section className="attendance-report"><div className="panel-heading-row"><div><span className="eyebrow">Saved Attendance</span><h3>Attendance Report</h3></div><button className="secondary-btn" type="button" onClick={() => setIsEditing(true)}>Edit</button></div><p>{date} · {day} · {selectedClass?.name} · Section {selectedClass?.section} · {session === 'MORNING' ? 'Morning' : 'Afternoon'} Session</p><div className="table-scroll"><table className="data-table"><thead><tr><th>Roll Number</th><th>Student Name</th><th>Status</th><th>Edit</th></tr></thead><tbody>{reportRows.sort((left, right) => String(left.student.rollNumber).localeCompare(String(right.student.rollNumber), undefined, { numeric: true })).map((record) => <tr key={record.id}><td>{record.student.rollNumber || '—'}</td><td>{record.student.name}</td><td>{record.status === 'PRESENT' ? 'Present' : 'Absent'}</td><td><button className="secondary-btn small" type="button" onClick={() => setIsEditing(true)}>Edit</button></td></tr>)}</tbody></table></div></section>}
          <h3>Attendance Overview · {date}</h3><div className="session-summary-grid">{sessionSummary.map((summary) => <div key={summary.key}><span>{summary.key === 'MORNING' ? 'Morning Session' : 'Afternoon Session'}</span><strong>{summary.present} / {summary.total} Present</strong><small>{summary.total ? percentage(summary.present / summary.total * 100) : 'Not taken'}</small></div>)}</div>
        </>}
      </section>
    </DashboardShell>
  );
}

export function TeacherAcademicsPage() {
  return (
    <DashboardShell title="Academics" navItems={teacherNavItems} profileLabel="Academics">
      <div className="panel">
        <h3>Academic Management</h3>
        <p>Review subjects, curriculum progress, and academic plans for your assigned classes.</p>
      </div>
    </DashboardShell>
  );
}

export function TeacherExamsResultsPage() {
  return (
    <DashboardShell title="Exams & Results" navItems={teacherNavItems} profileLabel="Exams">
      <div className="panel">
        <h3>Unit Test 1</h3>
        <p>Grade book and marks entry ready.</p>
      </div>
    </DashboardShell>
  );
}

export function TeacherAssignmentsPage() {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', classId: '', subjectId: '', dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const loadAssignments = async () => {
    try {
      const [classResponse, assignmentResponse] = await Promise.all([api.get('/teacher/classes'), api.get('/teacher/assignments')]);
      setClasses(classResponse.data.classes || []);
      setAssignments(assignmentResponse.data.assignments || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load teacher assignments.');
    }
  };
  useEffect(() => { loadAssignments(); }, []);
  const selectedClass = classes.find((schoolClass) => schoolClass.id === form.classId);
  const updateAssignmentForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value, ...(name === 'classId' ? { subjectId: '' } : {}) }));
  };
  const createAssignment = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/teacher/assignments', { ...form, dueDate: new Date(`${form.dueDate}T23:59:59`).toISOString() });
      setForm((current) => ({ ...current, title: '', description: '' }));
      setMessage('Assignment posted to the selected class.');
      await loadAssignments();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to post assignment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="Assignments" navItems={teacherNavItems} profileLabel="Assignments">
      <div className="panel">
        <h2>Post an Assignment</h2>
        {error && <div className="error-box">{error}</div>}{message && <div className="success-box">{message}</div>}
        {classes.length ? <form className="gallery-form" onSubmit={createAssignment}>
          <label>Title<input name="title" value={form.title} onChange={updateAssignmentForm} required maxLength="160" /></label>
          <label>Class<select name="classId" value={form.classId} onChange={updateAssignmentForm} required><option value="">Select class</option>{classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name} - {schoolClass.section}</option>)}</select></label>
          <label>Subject<select name="subjectId" value={form.subjectId} onChange={updateAssignmentForm} disabled={!selectedClass}><option value="">Select subject (optional)</option>{(selectedClass?.subjects || []).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
          <label>Due Date<input name="dueDate" type="date" value={form.dueDate} onChange={updateAssignmentForm} required /></label>
          <label className="full-width">What to Do<textarea name="description" rows="3" value={form.description} onChange={updateAssignmentForm} maxLength="2000" /></label>
          <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Posting...' : 'Post Assignment'}</button>
        </form> : <p>No classes are assigned to this teacher account.</p>}
        <h2>Assignment Completion</h2>
        {!assignments.length && <p>No assignments have been posted by your account.</p>}
        <div className="student-assignment-list">{assignments.map((assignment) => {
          const completedByStudent = new Map(assignment.submissions.map((submission) => [submission.studentId, submission]));
          return <article className="student-assignment" key={assignment.id}><div className="panel-heading-row"><div><span className="eyebrow">{assignment.class?.name} - {assignment.class?.section} · {assignment.subject?.name || 'General'}</span><h3>{assignment.title}</h3></div><span>Due {formatDate(assignment.dueDate)}</span></div>{assignment.description && <p>{assignment.description}</p>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Student</th><th>Student ID</th><th>Status</th><th>Completed At</th></tr></thead><tbody>{(assignment.class?.students || []).map((student) => { const submission = completedByStudent.get(student.id); return <tr key={student.id}><td>{student.name}</td><td>{student.studentId}</td><td>{submission?.status === 'COMPLETED' ? 'Completed' : 'Pending'}</td><td>{submission?.submittedAt ? formatDate(submission.submittedAt) : '—'}</td></tr>; })}</tbody></table></div></article>;
        })}</div>
      </div>
    </DashboardShell>
  );
}

export function TeacherNotificationsPage() {
  const { data, loading, error } = useTeacherResource('/teacher/notifications');
  return (
    <DashboardShell title="Notifications" navItems={teacherNavItems} profileLabel="Notifications">
      <StudentResourceState loading={loading} error={error} />
      {!loading && !error && <section className="panel"><div className="panel-heading-row"><div><span className="eyebrow">Staff Updates</span><h2>Notifications</h2></div></div>{data?.notifications?.length ? <div className="student-notification-list">{data.notifications.map((notification) => <article className="student-notification" key={notification.id}><div className="notification-symbol"><Bell size={19} /></div><div><div className="panel-heading-row"><h3>{notification.title}</h3><small>{formatDate(notification.createdAt)}</small></div><p>{notification.message}</p></div></article>)}</div> : <p>No staff notifications yet.</p>}</section>}
    </DashboardShell>
  );
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const navItems = getAdminNavItems(user?.role);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((response) => setSummary(response.data.summary))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load dashboard data.'));
  }, []);

  return (
    <DashboardShell title="Admin Dashboard" navItems={navItems} profileLabel={user?.role || 'Admin'}>
      <div className="stats-grid">
        <Link className="stat-box" to="/admin/students"><span>Students</span><strong>{summary?.studentsCount ?? '...'}</strong></Link>
        <Link className="stat-box" to="/admin/teachers"><span>Teachers</span><strong>{summary?.teachersCount ?? '...'}</strong></Link>
        <Link className="stat-box" to="/admin/assignments"><span>Assignments</span><strong>{summary?.assignmentsCount ?? '...'}</strong></Link>
        <Link className="stat-box" to="/admin/notifications"><span>Unread Notifications</span><strong>{summary?.notificationsCount ?? '...'}</strong></Link>
        {user?.role === 'SUPER_ADMIN' && <Link className="stat-box" to="/admin/admissions"><span>New Enquiries</span><strong>{summary?.newEnquiriesCount ?? '...'}</strong></Link>}
      </div>
      {error && <div className="error-box">{error}</div>}
      {user?.role === 'SUPER_ADMIN' && summary?.latestEnquiries?.length > 0 && <div className="panel latest-enquiries-panel"><div className="panel-heading-row"><h2>Latest Admission Enquiries</h2><Link className="primary-btn small" to="/admin/admissions">View All Enquiries</Link></div><div className="enquiry-list">{summary.latestEnquiries.map((enquiry) => <div className="enquiry-item" key={enquiry.id}><div className="panel-heading-row"><div><h3>{enquiry.studentName}</h3><small>{enquiry.enquiryNumber} · {new Date(enquiry.createdAt).toLocaleString()}</small></div><span className="status-badge published">{enquiry.status}</span></div><p>{enquiry.parentName} · {enquiry.classApplyingFor} · {enquiry.phone}</p><Link className="secondary-btn dark small" to="/admin/admissions">View Enquiry</Link></div>)}</div></div>}
    </DashboardShell>
  );
}

function getAdminNavItems(role) {
  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/students', label: 'Students' },
    { to: '/admin/teachers', label: 'Teachers' },
    ...(role === 'ADMIN_ACADEMIC' || role === 'SUPER_ADMIN' ? [{ to: '/admin/attendance', label: 'Attendance' }, { to: '/admin/academics', label: 'Academics' }, { to: '/admin/exams-results', label: 'Exams & Results' }] : []),
    ...(role === 'SUPER_ADMIN' ? [{ to: '/admin/assignments', label: 'Assignments' }] : []),
    ...(role === 'SUPER_ADMIN' ? [
      { to: '/admin/fees', label: 'Fees' },
      { to: '/admin/notifications', label: 'Notifications' },
      { to: '/admin/events', label: 'Events' },
      { to: '/admin/website', label: 'Website Management' },
      { to: '/admin/website/gallery', label: '  - Gallery' },
      { to: '/admin/admissions', label: 'Admissions / Enquiries' },
    ] : []),
  ];
  return navItems;
}

function LegacyAdminStudentsPage() {
  const { user } = useAuth();
  const navItems = getAdminNavItems(user?.role);

  const { data, loading, error } = useStudentResource('/admin/students');
  const students = data?.students || [];
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentMessage, setStudentMessage] = useState('');
  const classes = [...new Set(students.map((student) => student.class?.name).filter(Boolean))];
  const visibleStudents = selectedClass ? students.filter((student) => student.class?.name === selectedClass) : [];
  return (
    <DashboardShell title="Students" navItems={navItems} profileLabel="Students">
      <div className="panel"><StudentResourceState loading={loading} error={error} /><div className="form-actions"><label>Select Class<select value={selectedClass} onChange={(event) => { setSelectedClass(event.target.value); setSelectedStudent(null); }}><option value="">Select a class</option>{classes.map((className) => <option key={className} value={className}>{className}</option>)}</select></label>{selectedClass && <span>{visibleStudents.length} students</span>}</div>{studentMessage && <div className="success-box">{studentMessage}</div>}{selectedClass && <div className="table-scroll"><table className="data-table"><thead><tr><th>Student ID</th><th>Student Name</th><th>Gender</th><th>Roll Number</th><th>Username</th><th>Class Teacher Name</th><th>Parent / Guardian</th><th>Actions</th></tr></thead><tbody>{visibleStudents.map((student) => <tr key={student.id}><td>{student.studentId}</td><td>{student.name}</td><td>{student.gender}</td><td>{student.rollNumber}</td><td>{student.user?.username}</td><td>{student.classTeacherName}</td><td>{student.parentName}</td><td><button type="button" className="secondary-btn small" onClick={() => setEditingStudent({ ...student, classId: student.class?.id, username: student.user?.username || '' })}>Edit</button></td></tr>)}</tbody></table></div>}{editingStudent && <form className="panel student-profile-panel" onSubmit={async (event) => { event.preventDefault(); setStudentMessage(''); try { await api.put(`/admin/students/${editingStudent.id}`, editingStudent); setEditingStudent(null); setStudentMessage('Student record updated successfully.'); await load(); } catch (requestError) { setStudentMessage(requestError.response?.data?.message || 'Unable to update student record.'); } }}><div className="panel-heading-row"><h2>Edit Student</h2><button type="button" className="secondary-btn small" onClick={() => setEditingStudent(null)}>Cancel</button></div><div className="form-grid"><label>Student ID<input value={editingStudent.studentId} readOnly /></label><label>Student Name<input value={editingStudent.name} onChange={(event) => setEditingStudent({ ...editingStudent, name: event.target.value })} required /></label><label>Gender<input value={editingStudent.gender || ''} onChange={(event) => setEditingStudent({ ...editingStudent, gender: event.target.value })} required /></label><label>Roll Number<input value={editingStudent.rollNumber || ''} onChange={(event) => setEditingStudent({ ...editingStudent, rollNumber: event.target.value })} required /></label><label>Username<input value={editingStudent.username} onChange={(event) => setEditingStudent({ ...editingStudent, username: event.target.value })} required /></label><label>Class / Section<select value={editingStudent.classId || ''} onChange={(event) => setEditingStudent({ ...editingStudent, classId: event.target.value })} required>{(data?.classOptions || []).map((item) => <option key={item.id} value={item.id}>{item.name} - Section {item.section}</option>)}</select></label><label>Parent / Guardian<input value={editingStudent.parentName || ''} onChange={(event) => setEditingStudent({ ...editingStudent, parentName: event.target.value })} required /></label><label>Parent Mobile<input value={editingStudent.parentContact || ''} onChange={(event) => setEditingStudent({ ...editingStudent, parentContact: event.target.value })} required /></label><label>Subjects<input value={editingStudent.subjects || ''} onChange={(event) => setEditingStudent({ ...editingStudent, subjects: event.target.value })} /></label></div><button type="submit" className="primary-btn small">Save Changes</button></form>}{!loading && !error && !students.length && <p>No student records are available yet.</p>}</div>
    </DashboardShell>
  );
}

function LegacyAdminTeachersPage() {
  const { user } = useAuth();
  const navItems = getAdminNavItems(user?.role);

  const { data, loading, error } = useStudentResource('/admin/teachers');
  const teachers = data?.teachers || [];
  const [editingTeacher, setEditingTeacher] = useState(null);
  return (
    <DashboardShell title="Teachers" navItems={navItems} profileLabel="Teachers">
      <div className="panel"><StudentResourceState loading={loading} error={error} /><div className="table-scroll"><table className="data-table"><thead><tr><th>Teacher ID</th><th>Teacher Name</th><th>Username</th><th>Assigned Classes</th><th>Subjects</th><th>Actions</th></tr></thead><tbody>{teachers.map((teacher) => <tr key={teacher.id}><td>{teacher.employeeId}</td><td>{teacher.name}</td><td>{teacher.user?.username}</td><td>{teacher.assignedClass}</td><td>{teacher.assignedSubjects}</td><td><button type="button" className="secondary-btn small" onClick={() => setEditingTeacher({ ...teacher, username: teacher.user?.username || '' })}>Edit</button></td></tr>)}</tbody></table></div>{editingTeacher && <form className="panel student-profile-panel" onSubmit={async (event) => { event.preventDefault(); await api.put(`/admin/teachers/${editingTeacher.id}`, editingTeacher); setEditingTeacher(null); window.location.reload(); }}><div className="panel-heading-row"><h2>Edit Teacher</h2><button type="button" className="secondary-btn small" onClick={() => setEditingTeacher(null)}>Cancel</button></div><div className="form-grid"><label>Teacher ID<input value={editingTeacher.employeeId} readOnly /></label><label>Teacher Name<input value={editingTeacher.name} onChange={(event) => setEditingTeacher({ ...editingTeacher, name: event.target.value })} required /></label><label>Username<input value={editingTeacher.username} onChange={(event) => setEditingTeacher({ ...editingTeacher, username: event.target.value })} required /></label></div><button type="submit" className="primary-btn small">Save Changes</button></form>}{!loading && !error && !teachers.length && <p>No teacher records are available yet.</p>}</div>
    </DashboardShell>
  );
}

export function AdminAttendancePage() {
  const { user } = useAuth();
  const navItems = getAdminNavItems(user?.role);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [session, setSession] = useState('ALL');

  const endpoint = isSuperAdmin
    ? '/admin/attendance'
    : `/admin/attendance?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&date=${encodeURIComponent(date)}&month=${encodeURIComponent(month)}&session=${session}`;

  const { data, loading, error } = useStudentResource(endpoint);
  const attendance = data?.attendance || [];
  const summary = data?.summary;
  const summaryRows = data?.summaryRows || [];
  const updateClass = (value) => { setClassName(value); setSection(''); };

  if (isSuperAdmin) {
    return (
      <DashboardShell title="Attendance Management" navItems={navItems} profileLabel="Attendance">
        <div className="panel">
          <StudentResourceState loading={loading} error={error} />
          {!loading && !error && (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Total Number of Students</th>
                    <th>Number of Students Present</th>
                  </tr>
                </thead>
                <tbody>
                  {(summaryRows.length ? summaryRows : []).map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.totalStudents}</td>
                      <td>{row.present}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && summaryRows.length === 0 && <p>No class attendance data is available yet.</p>}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Attendance Management" navItems={navItems} profileLabel="Attendance">
      <div className="panel"><StudentResourceState loading={loading} error={error} /><div className="form-actions"><label>Select Class<select value={className} onChange={(event) => updateClass(event.target.value)}><option value="">Select a class</option>{(data?.classes || []).map((name) => <option key={name} value={name}>{name}</option>)}</select></label><label>Section<select value={section} onChange={(event) => setSection(event.target.value)} disabled={!className}><option value="">Select a section</option>{(data?.sections || []).map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>Date<input type="date" value={date} onChange={(event) => { setDate(event.target.value); if (event.target.value) setMonth(''); }} disabled={!className} /></label><label>Month<input type="month" value={month} onChange={(event) => { setMonth(event.target.value); if (event.target.value) setDate(''); }} disabled={!className} /></label><label>Session<select value={session} onChange={(event) => setSession(event.target.value)} disabled={!className}><option value="ALL">All Sessions</option><option value="MORNING">Morning Session</option><option value="AFTERNOON">Afternoon Session</option></select></label></div>{className && <p><strong>{className} - Section {section || data?.sections?.[0] || 'All'}</strong> · Class Teacher: <strong>{data?.classTeacher || 'Teacher assigned to class'}</strong></p>}{summary && <div className="stats-grid"><div className="stat-box"><span>Total Students</span><strong>{summary.totalStudents}</strong></div><div className="stat-box"><span>Present Students</span><strong>{summary.present}</strong></div><div className="stat-box"><span>Present Percentage</span><strong>{percentage(summary.presentPercentage)}</strong></div><div className="stat-box"><span>Absent Students</span><strong>{summary.absent}</strong></div><div className="stat-box"><span>Absent Percentage</span><strong>{percentage(summary.absentPercentage)}</strong></div></div>}{className && <div className="table-scroll"><table className="data-table"><thead><tr><th>Student ID</th><th>Student Name</th><th>Roll Number</th><th>Class</th><th>Section</th><th>Class Teacher</th><th>Attendance Status</th><th>Attendance %</th></tr></thead><tbody>{attendance.map((record) => <tr key={record.studentId}><td>{record.studentId}</td><td>{record.name}</td><td>{record.rollNumber}</td><td>{record.class}</td><td>{record.section}</td><td>{record.classTeacher || 'Teacher assigned to class'}</td><td>{record.status}</td><td>{percentage(record.attendancePercentage)}</td></tr>)}</tbody></table></div>}{className && !loading && !error && !attendance.length && <p>No students are available for the selected class.</p>}</div>
    </DashboardShell>
  );
}

export function AdminAcademicsPage() {
  const { user } = useAuth();
  const navItems = getAdminNavItems(user?.role);

  return (
    <DashboardShell title="Academic Management" navItems={navItems} profileLabel="Academics">
      <div className="panel"><p>Curriculum, subjects, assessments, and academic oversight are managed from this section.</p></div>
    </DashboardShell>
  );
}

export function AdminExamsResultsPage() {
  const { user } = useAuth();
  const navItems = getAdminNavItems(user?.role);

  return (
    <DashboardShell title="Exams & Results" navItems={navItems} profileLabel="Results">
      <div className="panel"><p>Exam and result administration is controlled here.</p></div>
    </DashboardShell>
  );
}

const adminFeeClassOptions = [
  'Nursery', 'LKG', 'UKG',
  ...Array.from({ length: 10 }, (_, index) => `Class ${index + 1}`),
];

export function AdminFeesPage() {
  const { user } = useAuth();
  const navItems = getAdminNavItems(user?.role);
  const [selectedClass, setSelectedClass] = useState('');
  const [feesData, setFeesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState('');
  const classOptions = [...new Set([...adminFeeClassOptions, ...(feesData?.classes || [])])];
  const students = feesData?.students || [];
  const summary = feesData?.summary;
  const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setExpandedStudentId('');
    api.get('/admin/fees', { params: selectedClass ? { className: selectedClass } : {} })
      .then((response) => {
        if (active) setFeesData(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load fee records.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [selectedClass]);

  return (
    <DashboardShell title="Fee Management" navItems={navItems} profileLabel="Fees">
      <div className="panel">
        <div className="form-actions">
          <label>Select Class
            <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
              <option value="">Select a class</option>
              {classOptions.map((className) => <option key={className} value={className}>{className}</option>)}
            </select>
          </label>
        </div>
        {error && <div className="error-box">{error}</div>}
        {loading && <p className="resource-state">Loading fee records...</p>}
        {!loading && !error && selectedClass && (
          <>
            <h2>{selectedClass}</h2>
            <section className="fee-summary-grid">
              <div><span>Total Students</span><strong>{summary?.totalStudents || 0}</strong></div>
              <div><span>Total Fees</span><strong>{money(summary?.totalFees)}</strong></div>
              <div><span>Total Collected</span><strong>{money(summary?.totalCollected)}</strong></div>
              <div><span>Total Pending</span><strong>{money(summary?.totalPending)}</strong></div>
            </section>
            {students.length ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Student ID</th><th>Student Name</th><th>Total Fee</th><th>Paid</th><th>Pending</th><th>Status</th><th>Fee Details</th></tr></thead>
                  <tbody>
                    {students.map((student) => (
                      <Fragment key={student.id}>
                        <tr>
                          <td>{student.studentId}</td>
                          <td>{student.name}</td>
                          <td>{money(student.totalFee)}</td>
                          <td>{money(student.paidAmount)}</td>
                          <td>{money(student.pendingAmount)}</td>
                          <td>{student.status}</td>
                          <td><button type="button" className="secondary-btn small" onClick={() => setExpandedStudentId((current) => current === student.id ? '' : student.id)}>{expandedStudentId === student.id ? 'Hide' : 'View'}</button></td>
                        </tr>
                        {expandedStudentId === student.id && (
                          <tr>
                            <td colSpan="7">
                              {student.fees.length ? (
                                <div className="table-scroll">
                                  <table className="data-table">
                                    <thead><tr><th>Category</th><th>Fee</th><th>Total Fee</th><th>Paid</th><th>Pending</th><th>Status</th><th>Due Date</th><th>Payments</th></tr></thead>
                                    <tbody>{student.fees.map((fee) => (
                                      <tr key={fee.id}>
                                        <td>{fee.category}</td>
                                        <td>{fee.title}</td>
                                        <td>{money(fee.amount)}</td>
                                        <td>{money(fee.effectivePaidAmount)}</td>
                                        <td>{money(fee.pendingAmount)}</td>
                                        <td>{fee.status}</td>
                                        <td>{formatDate(fee.dueDate)}</td>
                                        <td>{fee.payments.length ? fee.payments.map((payment) => <div key={payment.id}>{money(payment.amount)} · {formatDate(payment.paidAt)}{payment.reference ? ` · ${payment.reference}` : ''}</div>) : 'No payment records'}</td>
                                      </tr>
                                    ))}</tbody>
                                  </table>
                                </div>
                              ) : <p>No fee records are available for this student.</p>}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p>No students found for {selectedClass}.</p>}
          </>
        )}
        {!loading && !error && !selectedClass && <p>Select a class to view its students’ fee details.</p>}
      </div>
    </DashboardShell>
  );
}

export function AdminNotificationsPage() {
  const { user } = useAuth();
  const navItems = getAdminNavItems(user?.role);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/notifications')
      .then((response) => setNotifications(response.data.notifications || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load notifications.'));
  }, []);

  return (
    <DashboardShell title="Notifications" navItems={navItems} profileLabel="Notifications">
      <div className="panel"><h2>Super Admin Notifications</h2>{error && <div className="error-box">{error}</div>}{notifications.length === 0 && !error && <p>No notifications yet.</p>}<div className="enquiry-list">{notifications.map((notification) => <article className="enquiry-item" key={notification.id}><div className="panel-heading-row"><div><h3>{notification.title}</h3><small>{new Date(notification.createdAt).toLocaleString()}</small></div><span className="status-badge published">{notification.type}</span></div><p>{notification.message}</p>{notification.admissionEnquiry && <><p><strong>Enquiry:</strong> {notification.admissionEnquiry.enquiryNumber}</p><Link className="primary-btn small" to="/admin/admissions">View Enquiry</Link></>}</article>)}</div></div>
    </DashboardShell>
  );
}

export function AdminEventsPage() {
  const { user } = useAuth();
  const navItems = getAdminNavItems(user?.role);

  return (
    <DashboardShell title="Events" navItems={navItems} profileLabel="Events">
      <div className="panel"><p>Community and school events can be scheduled and updated here.</p></div>
    </DashboardShell>
  );
}

export function AdminWebsitePage() {
  const { user } = useAuth();
  const navItems = getAdminNavItems(user?.role);

  return (
    <DashboardShell title="Website Management" navItems={navItems} profileLabel="Website">
      <div className="panel">
        <h3>Public Website Content</h3>
        <p>Manage home, school information, admissions, events, and gallery content from the website modules.</p>
        <Link className="secondary-btn small" to="/admin/admissions">Open Admissions Enquiries</Link>
        <Link className="primary-btn small" to="/admin/website/gallery">Open Gallery Management</Link>
      </div>
    </DashboardShell>
  );
}

export function AdminAdmissionsPage() {
  const navItems = getAdminNavItems('SUPER_ADMIN');
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState({ status: 'NEW', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadEnquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/admission-enquiries', { params: { search, status: statusFilter } });
      setEnquiries(response.data.enquiries || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load admission enquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, [statusFilter]);

  const beginEdit = (enquiry) => {
    setEditingId(enquiry.id);
    setEditForm({ status: enquiry.status, notes: enquiry.notes || '' });
    setMessage('');
  };

  const saveEnquiry = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.patch(`/admin/admission-enquiries/${editingId}`, editForm);
      setEditingId('');
      setMessage('Enquiry updated successfully.');
      await loadEnquiries();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update enquiry.');
      setLoading(false);
    }
  };

  const deleteEnquiry = async (id) => {
    if (!window.confirm('Delete this admission enquiry permanently?')) return;
    setLoading(true);
    setError('');
    try {
      await api.delete(`/admin/admission-enquiries/${id}`);
      setMessage('Enquiry deleted successfully.');
      await loadEnquiries();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete enquiry.');
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="Admissions / Enquiries" navItems={navItems} profileLabel="Super Admin">
      <div className="panel">
        <div className="panel-heading-row">
          <div>
            <h2>Admission Enquiries</h2>
            <p>Review applicant information and track follow-up status.</p>
          </div>
          <button type="button" className="secondary-btn small dark" onClick={loadEnquiries} disabled={loading}>Refresh</button>
        </div>

        <div className="filter-row">
          <label>Search<input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadEnquiries()} placeholder="Name, phone, email, reference" /></label>
          <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option>{['NEW', 'CONTACTED', 'FOLLOW_UP', 'COMPLETED', 'REJECTED'].map((status) => <option key={status}>{status}</option>)}</select></label>
          <button type="button" className="primary-btn small" onClick={loadEnquiries} disabled={loading}>Search</button>
        </div>

        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}
        {loading && <p>Loading enquiries...</p>}
        {!loading && enquiries.length === 0 && <p>No enquiries match the selected filters.</p>}

        <div className="enquiry-list">
          {enquiries.map((enquiry) => (
            <article className="enquiry-item" key={enquiry.id}>
              <div className="panel-heading-row">
                <div><h3>{enquiry.studentName}</h3><small>{enquiry.enquiryNumber} · {new Date(enquiry.createdAt).toLocaleDateString()}</small></div>
                <span className="status-badge published">{enquiry.status}</span>
              </div>
              <div className="enquiry-details"><p><strong>Class:</strong> {enquiry.classApplyingFor}</p><p><strong>Parent:</strong> {enquiry.parentName}</p><p><strong>Phone:</strong> <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a></p><p><strong>Email:</strong> {enquiry.email ? <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a> : 'Not provided'}</p><p><strong>Address:</strong> {enquiry.address}</p>{enquiry.previousSchool && <p><strong>Previous school:</strong> {enquiry.previousSchool}</p>}{enquiry.message && <p><strong>Message:</strong> {enquiry.message}</p>}</div>
              {editingId === enquiry.id ? (
                <form className="enquiry-edit-form" onSubmit={saveEnquiry}>
                  <label>Status<select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}>{['NEW', 'CONTACTED', 'FOLLOW_UP', 'COMPLETED', 'REJECTED'].map((status) => <option key={status}>{status}</option>)}</select></label>
                  <label>Notes<textarea rows="3" value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} maxLength="2000" /></label>
                  <div className="form-actions"><button type="submit" className="primary-btn small" disabled={loading}>Save Changes</button><button type="button" className="secondary-btn small dark" onClick={() => setEditingId('')}>Cancel</button></div>
                </form>
              ) : (
                <div className="form-actions"><button type="button" className="primary-btn small" onClick={() => beginEdit(enquiry)}>Update Status / Notes</button><button type="button" className="danger-btn" onClick={() => deleteEnquiry(enquiry.id)}>Delete</button></div>
              )}
            </article>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

export function AdminGalleryPage() {
  const navItems = getAdminNavItems('SUPER_ADMIN');
  const emptyForm = { title: '', description: '', imageUrl: '', albumId: '', categoryId: '', eventId: '', displayOrder: 0, published: true };
  const [gallery, setGallery] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadGallery = () => api.get('/admin/gallery').then((response) => {
    setGallery(response.data.gallery || []);
    setAlbums(response.data.albums || []);
    setCategories(response.data.categories || []);
  }).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load gallery items.'));

  useEffect(() => {
    loadGallery();
  }, []);

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const submitGalleryItem = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const submitted = new FormData(event.currentTarget);
      const files = submitted.getAll('images').filter((file) => file instanceof File && file.size > 0);
      const endpoint = editingId ? `/gallery/${editingId}` : '/gallery/upload';

      if (editingId || files.length === 0) {
        if (editingId && files[0]) submitted.set('image', files[0]);
        submitted.delete('images');
        await api({ method: editingId ? 'put' : 'post', url: endpoint, data: submitted, headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        for (const file of files) {
          const uploadData = new FormData();
          for (const [key, value] of submitted.entries()) {
            if (key !== 'images') uploadData.append(key, value);
          }
          uploadData.append('image', file);
          await api.post('/gallery/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      }

      setForm(emptyForm);
      setEditingId('');
      setMessage('Gallery item published successfully.');
      await loadGallery();
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save gallery item.');
    } finally {
      setLoading(false);
    }
  };

  const editItem = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      albumId: item.albumId || '',
      categoryId: item.categoryId || '',
      eventId: item.eventId || '',
      displayOrder: item.displayOrder,
      published: item.published,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this gallery item?')) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/gallery/${id}`);
      setMessage('Gallery item deleted successfully.');
      await loadGallery();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete gallery item.');
    }
  };

  const createTaxonomy = async (type) => {
    const name = window.prompt(`Enter ${type} name`);
    if (!name?.trim()) return;
    await api.post(`/gallery/${type}s`, { name: name.trim() });
    await loadGallery();
  };

  return (
    <DashboardShell title="Website Management / Gallery" navItems={navItems} profileLabel="SUPER ADMIN">
      <div className="panel gallery-admin-panel">
        <div className="panel-heading-row">
          <div><span className="eyebrow">Super Admin Only</span><h2>Gallery Management</h2></div>
          <button type="button" className="primary-btn" onClick={() => { setEditingId(''); setForm(emptyForm); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>+ ADD TO GALLERY</button>
        </div>
        <p>Upload one or multiple images, organize albums and categories, publish content, and manage public gallery visibility.</p>

        <form className="gallery-form" onSubmit={submitGalleryItem}>
          <label>Title<input name="title" value={form.title} onChange={updateForm} required /></label>
          <label>Description<textarea name="description" value={form.description} onChange={updateForm} rows="3" /></label>
          <label>Image URL (optional when uploading)<input name="imageUrl" value={form.imageUrl} onChange={updateForm} placeholder="https://..." /></label>
          <label>Upload image(s)<input name="images" type="file" accept="image/*" multiple /></label>
          <label>Album<select name="albumId" value={form.albumId} onChange={updateForm}><option value="">No album</option>{albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}</select></label>
          <label>Category<select name="categoryId" value={form.categoryId} onChange={updateForm}><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>Event ID (optional)<input name="eventId" value={form.eventId} onChange={updateForm} placeholder="Optional event reference" /></label>
          <label>Display order<input name="displayOrder" type="number" min="0" value={form.displayOrder} onChange={updateForm} /></label>
          <label className="check-inline"><input name="published" value="true" type="checkbox" checked={form.published} onChange={updateForm} /> Publish on public website</label>
          <div className="form-actions"><button className="primary-btn" type="submit" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Gallery Item'}</button>{editingId && <button type="button" className="secondary-btn dark" onClick={() => { setEditingId(''); setForm(emptyForm); }}>Cancel Edit</button>}</div>
        </form>

        <div className="taxonomy-actions"><button type="button" className="secondary-btn dark small" onClick={() => createTaxonomy('album')}>+ New Album</button><button type="button" className="secondary-btn dark small" onClick={() => createTaxonomy('category')}>+ New Category</button></div>
        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}

        <div className="admin-gallery-grid">
          {gallery.map((item) => <article className="admin-gallery-item" key={item.id}>
            <img src={item.imageUrl} alt={item.title} />
            <div><div className="row-spread"><h3>{item.title}</h3><span className={`status-badge ${item.published ? 'published' : 'draft'}`}>{item.published ? 'Published' : 'Draft'}</span></div><p>{item.description || 'No description'}</p><small>{item.album?.name || 'No album'} · {item.category?.name || 'No category'} · Order {item.displayOrder}</small></div>
            <div className="form-actions"><a className="secondary-btn dark small" href={item.imageUrl} target="_blank" rel="noreferrer">Preview</a><button type="button" className="secondary-btn dark small" onClick={() => editItem(item)}>Edit</button><button type="button" className="danger-btn small" onClick={() => deleteItem(item.id)}>Delete</button></div>
          </article>)}
        </div>
      </div>
    </DashboardShell>
  );
}

export function AdminAssignmentsPage() {
  const { user } = useAuth();
  const navItems = getAdminNavItems(user?.role);

  return (
    <DashboardShell title="Assignments" navItems={navItems} profileLabel="Assignments">
      <div className="panel"><p>Assignments and submissions review can be managed here.</p></div>
    </DashboardShell>
  );
}

export { AdminStudentsManagementPage as AdminStudentsPage, AdminTeachersManagementPage as AdminTeachersPage };
