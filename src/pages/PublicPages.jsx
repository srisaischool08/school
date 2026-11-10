import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Baby, Calculator, CheckCircle, ClipboardCheck, Droplets, GraduationCap, Heart, LifeBuoy, MessageCircle, Monitor, Palette, ShieldCheck, Snowflake } from 'lucide-react';
import Header from '../components/Header';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { SCHOOL_INFO } from '../constants/schoolInfo';

function PageHero({ title, subtitle }) {
  return (
    <section className="page-hero">
      <div className="container narrow">
        <span className="eyebrow">SRISAI MODEL SCHOOL</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </section>
  );
}

export function HomePage() {
  const previewCards = [
    { title: 'About School', text: 'Learn about our values, curriculum, and vibrant learning community.', link: '/about' },
    { title: 'Academics', text: 'Flexible teaching, skill-building, and student-centered learning.', link: '/academics' },
    { title: 'Facilities', text: 'Modern labs, library, sports, and digital classrooms for growth.', link: '/facilities' },
    { title: 'Gallery', text: 'Browse moments from campus life, celebrations, and activities.', link: '/gallery' },
  ];

  return (
    <>
      <Header />
      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow">Welcome to</span>
              <h1>SRISAI MODEL SCHOOL</h1>
              <p>
                An institution of excellence where learning, discipline, creativity, and values come together to help every child grow with confidence.
              </p>
              <div className="hero-actions">
                <Link to="/admissions/apply" className="primary-btn">Apply Now</Link>
                <Link to="/about" className="secondary-btn">Explore More</Link>
              </div>
            </div>
            <div className="hero-card">
              <div className="stat-card">
                <strong>25+</strong>
                <span>Years of Excellence</span>
              </div>
              <div className="stat-card">
                <strong>90%</strong>
                <span>Academic Success</span>
              </div>
              <div className="stat-card">
                <strong>100%</strong>
                <span>Holistic Development</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">Our School</span>
              <h2>Learning that shapes future leaders</h2>
            </div>
            <div className="card-grid three-column">
              {previewCards.map((card) => (
                <div key={card.title} className="feature-card">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <Link to={card.link}>Read More</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block alt-block">
          <div className="container two-column">
            <div>
              <span className="eyebrow">Why Choose Us</span>
              <h2>Balancing academics, character, and creativity</h2>
              <ul className="check-list">
                <li>Student-centered pedagogy and digital learning</li>
                <li>Values-based education and personal mentoring</li>
                <li>Strong co-curricular program in sports, arts, and leadership</li>
                <li>Safe and supportive campus environment</li>
              </ul>
            </div>
            <div className="mini-panel">
              <h3>Admissions Open for 2026-27</h3>
              <p>Applications are open across three clear academic sections.</p>
              <Link to="/admissions" className="primary-btn small">View Admission Details</Link>
            </div>
          </div>
        </section>
      </main>
      <ContactSection />
      <Footer />
    </>
  );
}

export function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero title="About School" subtitle="We create confident learners with strong character and a clear sense of purpose." />
        <section className="section-block">
          <div className="container text-layout">
            <p>SRISAI MODEL SCHOOL has been built on a simple belief: every child deserves a nurturing environment that brings out their best. Our educators combine discipline, compassion, and modern pedagogy to help students grow academically and emotionally.</p>
            <p>From foundational years to upper grades, we focus on innovation, skill-building, and holistic education so that each learner becomes a responsible citizen and future-ready leader.</p>
          </div>
        </section>
        <section className="section-block alt-block">
          <div className="container">
            <div className="section-heading center"><span className="eyebrow">Our Academic Structure</span><h2>Three stages of learning</h2></div>
            <div className="card-grid three-column structure-grid">
              <article className="feature-card structure-card"><h3>PRE-PRIMARY</h3><p>Play-based learning, early childhood development, basic communication and social skills, and activity-based learning in a safe, child-friendly environment.</p></article>
              <article className="feature-card structure-card"><h3>PRIMARY SCHOOL</h3><p>A strong foundation in core subjects through concept-based and activity-based education, with steady development of communication and academic skills.</p></article>
              <article className="feature-card structure-card"><h3>HIGH SCHOOL</h3><p>Strong academic foundations, subject-focused learning, regular assessments, analytical and problem-solving skills, and preparation for higher education.</p></article>
            </div>
          </div>
        </section>
      </main>
      <ContactSection />
      <Footer />
    </>
  );
}

export function AcademicsPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero title="Academics" subtitle="A rigorous, future-focused academic experience for every stage of learning." />
        <section className="section-block">
            <div className="container card-grid three-column structure-grid">
            <div className="feature-card structure-card"><h3>PRE-PRIMARY</h3><p>Play-based learning and early development with joyful, activity-led experiences.</p></div>
            <div className="feature-card structure-card"><h3>PRIMARY SCHOOL</h3><p>Concept-based learning that builds strong foundations in core subjects and communication.</p></div>
            <div className="feature-card structure-card"><h3>HIGH SCHOOL</h3><p>Subject-focused learning, regular assessment, and preparation for higher education.</p></div>
          </div>
        </section>
      </main>
      <ContactSection />
      <Footer />
    </>
  );
}

export function FacilitiesPage() {
  const facilities = [
    { title: 'A Complete AC Campus', description: 'A comfortable learning environment with a fully air-conditioned campus designed for students throughout the school day.', icon: Snowflake },
    { title: 'Separate Play Zone for Play Group', description: 'A dedicated, safe, and child-friendly play area for Play Group children with age-appropriate activities.', icon: Baby },
    { title: 'Separate Activity Zone', description: 'A dedicated space for creative, educational, cultural, and co-curricular activities.', icon: Palette },
    { title: 'IIT & Medical Foundation', description: 'Foundation-level academic preparation to develop strong concepts and prepare students for future IIT and Medical competitive examinations.', icon: GraduationCap },
    { title: 'Daily Tests & Regular Assessments', description: 'Daily tests and regular assessments to continuously monitor student understanding, identify learning gaps, and improve academic performance.', icon: ClipboardCheck },
    { title: 'Abacus Training', description: 'Abacus-based learning to improve calculation speed, concentration, memory, numerical ability, and mental mathematics skills.', icon: Calculator },
    { title: 'Individual Care & Personal Attention', description: "Individual attention and personal care for every student, with teachers monitoring each student's learning needs, progress, strengths, and areas for improvement.", icon: Heart },
    { title: 'Smart Classrooms & Digital Learning', description: 'Technology-enabled classrooms and digital learning resources to make lessons more interactive, visual, and engaging.', icon: Monitor },
    { title: 'Safe & Secure Campus', description: 'A safe, secure, and student-friendly campus environment with appropriate supervision and safety measures.', icon: ShieldCheck },
    { title: 'Clean Drinking Water & Hygienic Facilities', description: 'Clean drinking water and well-maintained hygienic facilities to support students health and comfort.', icon: Droplets },
    { title: 'First Aid & Student Safety Support', description: 'Basic first-aid support and appropriate safety arrangements for students when needed.', icon: LifeBuoy },
    { title: 'Parent–Teacher Communication', description: 'Regular communication between parents and teachers regarding academics, attendance, assessments, student progress, and important school updates.', icon: MessageCircle },
  ];

  return (
    <>
      <Header />
      <main>
        <PageHero title="Facilities" subtitle="A safe and inspiring campus that supports academic and personal excellence." />
        <section className="section-block">
          <div className="container card-grid three-column facilities-grid">
            {facilities.map(({ title, description, icon: Icon }) => (
              <article className="feature-card facility-card" key={title}>
                <div className="facility-icon" aria-hidden="true"><Icon size={26} strokeWidth={1.8} /></div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <ContactSection />
      <Footer />
    </>
  );
}

export function AchievementsPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero title="Achievements" subtitle="Celebrating the excellence of students, teachers, and school communities." />
        <section className="section-block">
          <div className="container card-grid three-column">
            <div className="feature-card"><h3>Academic Awards</h3><p>Consistent high-performance in board examinations and annual assessments.</p></div>
            <div className="feature-card"><h3>Sports Honors</h3><p>Inter-school championships and team excellence across multiple sports.</p></div>
            <div className="feature-card"><h3>Innovation & Arts</h3><p>Student-led innovation, debate, and performing arts achievements.</p></div>
          </div>
        </section>
      </main>
      <ContactSection />
      <Footer />
    </>
  );
}

export function EventsPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero title="Events & News" subtitle="Updates, celebrations, and meaningful school moments from the community." />
        <section className="section-block">
          <div className="container card-grid two-column">
            <div className="feature-card"><h3>Science Expo</h3><p>Students showcase experiments and innovation projects.</p></div>
            <div className="feature-card"><h3>Parent Orientation</h3><p>Open discussions on learning outcomes, progress, and school partnerships.</p></div>
          </div>
        </section>
      </main>
      <ContactSection />
      <Footer />
    </>
  );
}

export function GalleryPage() {
  const [gallery, setGallery] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [categories, setCategories] = useState([]);
  const [albumFilter, setAlbumFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    Promise.all([api.get('/gallery'), api.get('/gallery/albums'), api.get('/gallery/categories')])
      .then(([galleryResponse, albumsResponse, categoriesResponse]) => {
        setGallery(galleryResponse.data.gallery || []);
        setAlbums(albumsResponse.data.albums || []);
        setCategories(categoriesResponse.data.categories || []);
      })
      .catch(() => setGallery([]));
  }, []);

  const visibleGallery = gallery.filter((item) => (!albumFilter || item.albumId === albumFilter) && (!categoryFilter || item.categoryId === categoryFilter));

  return (
    <>
      <Header />
      <main>
        <PageHero title="Gallery" subtitle="Moments of learning, celebration, creativity, and student joy." />
        <section className="section-block">
          <div className="container gallery-filter-bar">
            <label>Album<select value={albumFilter} onChange={(event) => setAlbumFilter(event.target.value)}><option value="">All albums</option>{albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}</select></label>
            <label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          </div>
          <div className="container card-grid three-column gallery-grid">
            {(visibleGallery.length ? visibleGallery : gallery.length ? [] : [
              { title: 'Campus Life', description: 'Daily learning and shared experiences.', imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b' },
              { title: 'Sports Day', description: 'Energy, teamwork, and active participation.', imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211' },
              { title: 'Annual Day', description: 'Culture, creativity, and memorable performances.', imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f' },
            ]).map((item) => (
              <article key={item.id || item.title} className="feature-card gallery-card">
                <img src={item.imageUrl} alt={item.title} loading="lazy" />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <ContactSection />
      <Footer />
    </>
  );
}

export function AdmissionsPage() {
  const submittingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    submittingRef.current = true;
    setLoading(true);
    setError('');
    setSuccess(null);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await api.post('/public/admission-enquiries', payload);
      setError('');
      setSuccess(response.data);
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not submit your enquiry. Please try again.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main>
        <PageHero title="Admissions" subtitle="A welcoming school journey for families seeking quality education and values." />
        <section className="section-block">
          <div className="container two-column admission-layout">
            <div className="text-layout">
              <p>Admissions for the upcoming academic year are now open. Share your details and our school team will contact you about the next steps.</p>
              <ul className="check-list">
                <li>Document verification and interaction with school team</li>
                <li>Supportive onboarding and parent communication</li>
                <li>Guidance on classes, schedule, and required documents</li>
              </ul>
            </div>

            {success ? <div className="panel admission-form success-confirmation">
              <span className="eyebrow">Submission received</span>
              <h2>Enquiry Submitted Successfully!</h2>
              <p>Thank you for contacting SRISAI MODEL SCHOOL. Your admission enquiry has been submitted successfully. Our school team will contact you shortly.</p>
              <p className="enquiry-reference">Enquiry Number: <strong>{success.enquiryNumber}</strong></p>
              <Link className="primary-btn" to="/">Back to Home</Link>
            </div> : <form className="panel admission-form" onSubmit={handleSubmit}>
              <h2>Admission Enquiry</h2>
              <div className="form-grid">
                <label>Student Name<input name="studentName" required minLength="2" maxLength="120" /></label>
                <label>Date of Birth<input name="dateOfBirth" type="date" /></label>
                <label>Gender<select name="gender" defaultValue=""><option value="">Select gender</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label>
                <fieldset className="full-span section-choice"><legend>Class / Section Interested In *</legend><label><input type="radio" name="classApplyingFor" value="PRE-PRIMARY" required /> <span><strong>PRE-PRIMARY</strong></span></label><label><input type="radio" name="classApplyingFor" value="PRIMARY SCHOOL" /> <span><strong>PRIMARY SCHOOL</strong></span></label><label><input type="radio" name="classApplyingFor" value="HIGH SCHOOL" /> <span><strong>HIGH SCHOOL</strong></span></label></fieldset>
                <label>Parent / Guardian Name<input name="parentName" required minLength="2" maxLength="120" /></label>
                <label>Parent / Guardian Phone<input name="phone" required minLength="7" maxLength="25" type="tel" /></label>
                <label>Email<input name="email" type="email" maxLength="160" /></label>
                <label>Previous School<input name="previousSchool" maxLength="160" /></label>
                <label className="full-span">Address<textarea name="address" required minLength="10" maxLength="500" rows="3" /></label>
                <label className="full-span">Additional Message / Enquiry<textarea name="message" maxLength="1000" rows="4" /></label>
              </div>

              {error && <div className="error-box">Unable to submit your enquiry. Please try again.</div>}
              <button className="primary-btn" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Application'}</button>
            </form>}
          </div>
        </section>
      </main>
      <ContactSection />
      <Footer />
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero title="Contact Us" subtitle="We are happy to answer your questions and help with admissions or school information." />
        <section className="section-block">
          <div className="container text-layout">
            <p>Phone: <a href={`tel:${SCHOOL_INFO.phone}`}>{SCHOOL_INFO.phone}</a></p>
            <p>Email: <a href={`mailto:${SCHOOL_INFO.email}`}>{SCHOOL_INFO.email}</a></p>
            <p>Address: {SCHOOL_INFO.address}</p>
          </div>
        </section>
      </main>
      <ContactSection />
      <Footer />
    </>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [adminRole, setAdminRole] = useState('SUPER_ADMIN');
  const [form, setForm] = useState({ username: '', password: '', remember: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'STUDENT') navigate('/student/dashboard');
      if (user.role === 'TEACHER') navigate('/teacher/dashboard');
      if (user.role === 'SUPER_ADMIN' || user.role?.startsWith('ADMIN')) navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submittedForm = new FormData(event.currentTarget);
      const result = await login({
        username: String(submittedForm.get('username') || '').trim(),
        password: String(submittedForm.get('password') || ''),
        role: selectedRole === 'ADMIN' ? adminRole : selectedRole,
        remember: form.remember,
      });
      if (result.user.role === 'STUDENT') navigate('/student/dashboard');
      if (result.user.role === 'TEACHER') navigate('/teacher/dashboard');
      if (result.user.role === 'SUPER_ADMIN' || result.user.role?.startsWith('ADMIN')) navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="login-shell">
        <div className="container login-container">
          <div className="login-panel">
            <span className="eyebrow">Login Portal</span>
            <h1>Choose your role</h1>
            <div className="role-grid">
              {['STUDENT', 'TEACHER', 'ADMIN'].map((role) => (
                <button type="button" key={role} className={`role-card ${selectedRole === role ? 'selected' : ''}`} onClick={() => setSelectedRole(role)}>
                  {role === 'ADMIN' ? 'ADMIN LOGIN' : `${role.replace('_', ' ')} LOGIN`}
                </button>
              ))}

              {selectedRole === 'ADMIN' && <label className="admin-role-select">
                Admin role
                <select value={adminRole} onChange={(event) => setAdminRole(event.target.value)}>
                  <option value="ADMIN_ACADEMIC">Academic Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </label>}
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <label>
                Username / ID
                <input name="username" type="text" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} autoComplete="username" required />
              </label>
              <label>
                Password
                <input name="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" required />
              </label>
              <div className="row-spread">
                <label className="check-inline"><input type="checkbox" checked={form.remember} onChange={() => setForm({ ...form, remember: !form.remember })} /> Remember me</label>
                <Link to="/contact">Forgot password?</Link>
              </div>

              {error && <div className="error-box">{error}</div>}
              <button className="primary-btn full-width" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
