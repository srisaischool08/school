import { Link, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard' }, { to: '/admin/students', label: 'Students' }, { to: '/admin/teachers', label: 'Teachers' },
  { to: '/admin/attendance', label: 'Attendance' }, { to: '/admin/academics', label: 'Academics' }, { to: '/admin/exams-results', label: 'Exams & Results' },
  { to: '/admin/assignments', label: 'Assignments' }, { to: '/admin/fees', label: 'Fees' }, { to: '/admin/notifications', label: 'Notifications' },
  { to: '/admin/events', label: 'Events' }, { to: '/admin/website', label: 'Website Management' }, { to: '/admin/website/gallery', label: '  - Gallery' }, { to: '/admin/admissions', label: 'Admissions / Enquiries' },
];

function AdminShell({ title, children }) {
  const { logout } = useAuth();
  return <div className="portal-shell"><aside className="portal-sidebar"><div className="portal-brand">SRISAI</div><nav className="portal-nav">{adminNavItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `portal-link ${isActive ? 'active' : ''}`}>{item.label}</NavLink>)}</nav><div className="portal-profile-tag">SUPER_ADMIN</div></aside><main className="portal-content"><div className="portal-topbar"><h1>{title}</h1><div className="form-actions"><Link to="/" className="secondary-btn small">School Website</Link><button type="button" className="logout-btn" onClick={logout}>Logout</button></div></div>{children}</main></div>;
}

function State({ loading, error }) { if (loading) return <p className="resource-state">Loading...</p>; if (error) return <div className="error-box">{error}</div>; return null; }
function Field({ label, children }) { return <label>{label}{children}</label>; }
const blankStudent = { studentId: '', name: '', gender: 'Male', rollNumber: '', username: '', classId: '', parentName: '', parentContact: '', subjects: '', roomNumber: '', academicYear: '2026-2027', email: '', address: '', dateOfBirth: '' };
const blankTeacher = { employeeId: '', name: '', username: '', password: '', email: '', classIds: [], subjects: '' };

function StudentForm({ form, mode, classes, saving, onChange, onSubmit, onCancel }) {
  return <form className="panel student-profile-panel" onSubmit={onSubmit}><div className="panel-heading-row"><h2>{mode === 'create' ? 'Add Student' : 'Edit Student'}</h2><button type="button" className="secondary-btn small" onClick={onCancel}>Cancel</button></div><div className="form-grid"><Field label="Student ID"><input name="studentId" value={form.studentId} onChange={onChange} required readOnly={mode === 'edit'} /></Field><Field label="Student Name"><input name="name" value={form.name} onChange={onChange} required /></Field><Field label="Gender"><select name="gender" value={form.gender} onChange={onChange}><option>Male</option><option>Female</option><option>Other</option></select></Field><Field label="Roll Number"><input name="rollNumber" value={form.rollNumber} onChange={onChange} required /></Field><Field label="Username / Login ID"><input name="username" value={form.username} onChange={onChange} required /></Field><Field label="Class / Section"><select name="classId" value={form.classId} onChange={onChange} required><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} - {item.section}</option>)}</select></Field><Field label="Parent / Guardian"><input name="parentName" value={form.parentName} onChange={onChange} required /></Field><Field label="Parent Contact"><input name="parentContact" value={form.parentContact} onChange={onChange} required /></Field><Field label="Subjects"><input name="subjects" value={form.subjects} onChange={onChange} required /></Field><Field label="Room Number"><input name="roomNumber" value={form.roomNumber} onChange={onChange} /></Field><Field label="Academic Year"><input name="academicYear" value={form.academicYear} onChange={onChange} required /></Field><Field label="Date of Birth"><input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={onChange} /></Field><Field label="Email"><input name="email" type="email" value={form.email} onChange={onChange} /></Field><Field label="Address"><input name="address" value={form.address} onChange={onChange} /></Field></div><button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saving...' : mode === 'create' ? 'Add Student' : 'Save Changes'}</button></form>;
}

export function AdminStudentsManagementPage() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [selectedClass, setSelectedClass] = useState(''); const [mode, setMode] = useState(''); const [form, setForm] = useState(blankStudent); const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); setError(''); try { const response = await api.get('/admin/students'); setData(response.data); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load students.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (mode !== 'create' && mode !== 'edit') return;
    if (mode === 'create') {
      setError('');
      setMessage('');
    }
    document.querySelector('form.panel.student-profile-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [mode]);
  const students = data?.students || []; const classes = data?.classOptions || []; const visibleStudents = selectedClass ? students.filter((student) => student.class?.name === selectedClass) : students;
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const edit = (student) => { setForm({ ...blankStudent, ...student, username: student.user?.username || '', classId: student.class?.id || '', dateOfBirth: student.dob ? new Date(student.dob).toISOString().slice(0, 10) : '' }); setMode('edit'); };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, dateOfBirth: form.dateOfBirth || null };
      if (mode === 'create') {
        const response = await api.post('/admin/students', payload);
        const credentials = response.data.temporaryPassword
          ? ` Login ID: ${form.username}. Temporary password: ${response.data.temporaryPassword}.`
          : '';
        setMessage(`Student added successfully.${credentials}`);
      } else {
        await api.put(`/admin/students/${form.id}`, payload);
        setMessage('Student updated successfully.');
      }
      setMode('');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save student.');
    } finally {
      setSaving(false);
    }
  };
  const remove = async (student) => { if (!window.confirm('Are you sure you want to remove this student?')) return; try { await api.delete(`/admin/students/${student.id}`); setMessage('Student removed successfully.'); await load(); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to remove student.'); } };
  return <AdminShell title="Students"><section className="panel"><div className="panel-heading-row"><div><span className="eyebrow">Student Management</span><h2>Students</h2></div><button type="button" className="primary-btn small" onClick={() => { setForm(blankStudent); setMode('create'); }}>+ Add Student</button></div><State loading={loading} error={error} />{message && <div className="success-box">{message}</div>}<div className="form-actions"><Field label="Select Class"><select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}><option value="">All classes</option>{[...new Set(classes.map((item) => item.name))].map((name) => <option key={name} value={name}>{name}</option>)}</select></Field><span>{visibleStudents.length} students</span></div>{!loading && !error && <div className="table-scroll"><table className="data-table admin-management-table"><thead><tr><th>Student ID</th><th>Student Name</th><th>Class Teacher Name</th><th>Actions</th></tr></thead><tbody>{visibleStudents.map((student) => <tr key={student.id}><td>{student.studentId}</td><td>{student.name}</td><td>{student.classTeacherName || 'Not assigned'}</td><td><div className="table-actions"><button type="button" className="secondary-btn small" onClick={() => setMode(`view-${student.id}`)}>View</button><button type="button" className="secondary-btn small" onClick={() => edit(student)}>Edit</button><button type="button" className="danger-btn small" onClick={() => remove(student)}>Remove</button></div></td></tr>)}</tbody></table></div>}{mode.startsWith('view-') && (() => { const student = students.find((item) => item.id === mode.slice(5)); return student && <div className="panel student-profile-panel"><div className="panel-heading-row"><h2>Student Profile</h2><button type="button" className="secondary-btn small" onClick={() => setMode('')}>Close</button></div><dl className="student-profile-grid"><div><dt>Student ID</dt><dd>{student.studentId}</dd></div><div><dt>Student Name</dt><dd>{student.name}</dd></div><div><dt>Class</dt><dd>{student.class?.name || 'Not assigned'}</dd></div><div><dt>Section</dt><dd>{student.class?.section || student.section || 'Not assigned'}</dd></div><div><dt>Class Teacher</dt><dd>{student.classTeacherName || 'Not assigned'}</dd></div><div><dt>Gender</dt><dd>{student.gender || 'Not provided'}</dd></div><div><dt>Roll Number</dt><dd>{student.rollNumber || 'Not assigned'}</dd></div><div><dt>Username</dt><dd>{student.user?.username || 'Not assigned'}</dd></div><div><dt>Room Number</dt><dd>{student.roomNumber || 'Not assigned'}</dd></div><div><dt>Academic Year</dt><dd>{student.academicYear || 'Not assigned'}</dd></div><div><dt>Parent / Guardian</dt><dd>{student.parentName || 'Not provided'}</dd></div><div><dt>Parent Contact</dt><dd>{student.parentContact || 'Not provided'}</dd></div><div><dt>Subjects</dt><dd>{student.subjects || 'Not provided'}</dd></div><div><dt>Address</dt><dd>{student.address || 'Not provided'}</dd></div></dl></div>; })()}{(mode === 'create' || mode === 'edit') && <StudentForm form={form} mode={mode} classes={classes} saving={saving} onChange={update} onSubmit={submit} onCancel={() => setMode('')} />}</section></AdminShell>;
}

function TeacherForm({ form, mode, classes, saving, onChange, onToggleClass, onSubmit, onCancel }) {
  return <form className="panel student-profile-panel" onSubmit={onSubmit}><div className="panel-heading-row"><h2>{mode === 'create' ? 'Add Teacher' : 'Edit Teacher'}</h2><button type="button" className="secondary-btn small" onClick={onCancel}>Cancel</button></div><div className="form-grid"><Field label="Teacher ID"><input name="employeeId" value={form.employeeId} onChange={onChange} required readOnly={mode === 'edit'} /></Field><Field label="Teacher Name"><input name="name" value={form.name} onChange={onChange} required /></Field><Field label="Username / Login ID"><input name="username" value={form.username} onChange={onChange} required /></Field>{mode === 'create' && <Field label="Password (optional)"><input name="password" type="password" value={form.password} onChange={onChange} /></Field>}<Field label="Subjects (comma separated)"><input name="subjects" value={form.subjects} onChange={onChange} required /></Field><Field label="Email"><input name="email" type="email" value={form.email} onChange={onChange} /></Field></div><fieldset className="class-checkboxes"><legend>Assigned Classes</legend>{classes.map((item) => <label key={item.id}><input type="checkbox" checked={form.classIds.includes(item.id)} onChange={() => onToggleClass(item.id)} />{item.name} - {item.section}</label>)}</fieldset><button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saving...' : mode === 'create' ? 'Add Teacher' : 'Save Changes'}</button></form>;
}

export function AdminTeachersManagementPage() {
  const [data, setData] = useState(null); const [classes, setClasses] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [mode, setMode] = useState(''); const [form, setForm] = useState(blankTeacher); const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); setError(''); try { const [teacherResponse, studentResponse] = await Promise.all([api.get('/admin/teachers'), api.get('/admin/students')]); setData(teacherResponse.data); setClasses(studentResponse.data.classOptions || []); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load teachers.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (mode !== 'create' && mode !== 'edit') return;
    if (mode === 'create') {
      setError('');
      setMessage('');
    }
    document.querySelector('form.panel.student-profile-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [mode]);
  const teachers = data?.teachers || []; const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value })); const toggleClass = (id) => setForm((current) => ({ ...current, classIds: current.classIds.includes(id) ? current.classIds.filter((value) => value !== id) : [...current.classIds, id] }));
  const edit = (teacher) => { setForm({ ...blankTeacher, ...teacher, username: teacher.user?.username || '', classIds: teacher.classes?.map((item) => item.id) || [], subjects: teacher.assignedSubjects || '' }); setMode('edit'); };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, subjects: form.subjects.split(',').map((subject) => subject.trim()).filter(Boolean) };
      if (mode === 'create') {
        const response = await api.post('/admin/teachers', payload);
        const credentials = response.data.temporaryPassword
          ? ` Login ID: ${form.username}. Temporary password: ${response.data.temporaryPassword}.`
          : '';
        setMessage(`Teacher added successfully.${credentials}`);
      } else {
        await api.put(`/admin/teachers/${form.id}`, payload);
        setMessage('Teacher updated successfully.');
      }
      setMode('');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save teacher.');
    } finally {
      setSaving(false);
    }
  };
  const remove = async (teacher) => { if (!window.confirm('Are you sure you want to remove this teacher?')) return; try { await api.delete(`/admin/teachers/${teacher.id}`); setMessage('Teacher removed successfully.'); await load(); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to remove teacher.'); } };
  return <AdminShell title="Teachers"><section className="panel"><div className="panel-heading-row"><div><span className="eyebrow">Teacher Management</span><h2>Teachers</h2></div><button type="button" className="primary-btn small" onClick={() => { setForm(blankTeacher); setMode('create'); }}>+ Add Teacher</button></div><State loading={loading} error={error} />{message && <div className="success-box">{message}</div>}{!loading && !error && <div className="table-scroll"><table className="data-table admin-management-table"><thead><tr><th>Teacher ID</th><th>Teacher Name</th><th>Subjects</th><th>Actions</th></tr></thead><tbody>{teachers.map((teacher) => <tr key={teacher.id}><td>{teacher.employeeId}</td><td>{teacher.name}</td><td>{teacher.assignedSubjects || 'Not assigned'}</td><td><div className="table-actions"><button type="button" className="secondary-btn small" onClick={() => setMode(`view-${teacher.id}`)}>View</button><button type="button" className="secondary-btn small" onClick={() => edit(teacher)}>Edit</button><button type="button" className="danger-btn small" onClick={() => remove(teacher)}>Remove</button></div></td></tr>)}</tbody></table></div>}{mode.startsWith('view-') && (() => { const teacher = teachers.find((item) => item.id === mode.slice(5)); return teacher && <div className="panel student-profile-panel"><div className="panel-heading-row"><h2>Teacher Profile</h2><button type="button" className="secondary-btn small" onClick={() => setMode('')}>Close</button></div><dl className="student-profile-grid"><div><dt>Teacher ID</dt><dd>{teacher.employeeId}</dd></div><div><dt>Teacher Name</dt><dd>{teacher.name}</dd></div><div><dt>Username</dt><dd>{teacher.user?.username || 'Not assigned'}</dd></div><div><dt>Assigned Classes</dt><dd>{teacher.assignedClass || 'Not assigned'}</dd></div><div><dt>Subjects</dt><dd>{teacher.assignedSubjects || 'Not assigned'}</dd></div></dl></div>; })()}{(mode === 'create' || mode === 'edit') && <TeacherForm form={form} mode={mode} classes={classes} saving={saving} onChange={update} onToggleClass={toggleClass} onSubmit={submit} onCancel={() => setMode('')} />}</section></AdminShell>;
}
