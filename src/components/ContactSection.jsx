import { SCHOOL_INFO } from '../constants/schoolInfo';

export default function ContactSection() {
  return (
    <section className="contact-section">
      <div className="container">
        <div className="section-heading center">
          <span className="eyebrow">Connect With Us</span>
          <h2>Contact SRISAI MODEL SCHOOL</h2>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <h3>School Address</h3>
            <p>{SCHOOL_INFO.address}</p>
          </div>
          <div className="info-card">
            <h3>Call Us</h3>
            <p><a href={`tel:${SCHOOL_INFO.phone}`}>{SCHOOL_INFO.phone}</a></p>
          </div>
          <div className="info-card">
            <h3>Email Us</h3>
            <p><a href={`mailto:${SCHOOL_INFO.email}`}>{SCHOOL_INFO.email}</a></p>
          </div>
        </div>
      </div>
    </section>
  );
}
