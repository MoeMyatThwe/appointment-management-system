import { Link } from 'react-router-dom'
import { useState } from 'react'
import { FiArrowRight, FiBell, FiCalendar, FiCheckCircle, FiGrid, FiLink, FiUsers } from 'react-icons/fi'

const sectionLinks = [
  ['Features', '#features'],
  ['How it works', '#how-it-works'],
  ['FAQ', '#faq'],
]

const featurePlaceholders = [
  ['01', 'Smart calendar', 'See your week clearly, avoid double bookings, and make changes in seconds.', FiCalendar],
  ['02', 'Online booking page', 'Give customers a simple way to discover services and choose a suitable time.', FiLink],
  ['03', 'Staff management', 'Keep team members, availability, and responsibilities organized in one place.', FiUsers],
  ['04', 'Service management', 'Set up your services, durations, pricing, and booking availability with ease.', FiGrid],
  ['05', 'Customer records', 'Keep customer details and appointment history available when your team needs them.', FiCheckCircle],
  ['06', 'Helpful reminders', 'Reduce missed appointments with a more connected customer communication flow.', FiBell],
] as const

const faqs = [
  ['What is Schedora?', 'Schedora is an appointment-management platform that helps service businesses organize bookings, staff, services, customers, and availability from one workspace.'],
  ['Who is Schedora for?', 'Schedora is designed for salons, barbers, spas, clinics, consultants, studios, and other businesses that manage customer appointments.'],
  ['Can customers book appointments online?', 'Yes. Each workspace can share a public booking page where customers can view available services and choose a suitable time.'],
  ['Can my team use Schedora together?', 'Yes. Workspace owners can add staff members and keep team availability, appointments, and service responsibilities organized.'],
  ['Do I need technical knowledge to set up Schedora?', 'No. The onboarding flow guides you through creating your workspace, adding services and staff, setting hours, and preparing your booking page.'],
  ['Can I manage different types of services?', 'Yes. You can create services with their own names, durations, pricing, and availability to match the way your business operates.'],
] as const

function Brand() {
  return (
    <Link className="schedora-brand" to="/" aria-label="Schedora home">
      <span className="schedora-brand-mark">S</span>
      <span>Schedora</span>
    </Link>
  )
}

function ImagePlaceholder({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`schedora-image-placeholder ${className}`} role="img" aria-label={`${label} image placeholder`}>
      <span className="schedora-image-placeholder-icon">+</span>
      <span>{label} image placeholder</span>
      <small>Ready for your product screenshot</small>
    </div>
  )
}

function SectionHeading({ eyebrow, title, description, align = 'left' }: { eyebrow: string; title: string; description: string; align?: 'left' | 'center' }) {
  return (
    <div className={`schedora-section-heading ${align === 'center' ? 'schedora-section-heading-center' : ''}`}>
      <p className="schedora-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

function FAQList() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="schedora-faq-list">
      {faqs.map(([question, answer], index) => {
        const isOpen = openIndex === index
        return (
          <div className={`schedora-faq-item ${isOpen ? 'schedora-faq-item-open' : ''}`} key={question}>
            <button className="schedora-faq-question" type="button" aria-expanded={isOpen} onClick={() => setOpenIndex(isOpen ? null : index)}>
              <span>{question}</span>
              <span className="schedora-faq-toggle" aria-hidden="true">{isOpen ? '-' : '+'}</span>
            </button>
            {isOpen ? <p className="schedora-faq-answer">{answer}</p> : null}
          </div>
        )
      })}
    </div>
  )
}

export function LandingPage() {
  return (
    <main className="schedora-landing">
      <header className="schedora-header">
        <div className="schedora-container schedora-header-inner">
          <Brand />
          <nav className="schedora-nav" aria-label="Main navigation">
            {sectionLinks.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
          </nav>
          <div className="schedora-header-actions">
            <Link className="schedora-text-button" to="/login">Sign in</Link>
            <Link className="schedora-button schedora-button-small" to="/register">Get started <FiArrowRight /></Link>
          </div>
        </div>
      </header>

      <section className="schedora-section schedora-hero-section">
        <div className="schedora-container schedora-hero-grid">
          <div className="schedora-hero-copy">
            <div className="schedora-hero-badge"><span /> Built for calmer business days</div>
            <p className="schedora-eyebrow">Appointment management, simplified</p>
            <h1>Make every booking feel effortless.</h1>
            <p>Schedora gives service businesses one calm, organized workspace to manage appointments, customers, staff, and online bookings.</p>
            <div className="schedora-placeholder-actions">
              <Link className="schedora-button" to="/register">Start your workspace <FiArrowRight /></Link>
              <Link className="schedora-outline-button" to="/login">Sign in</Link>
            </div>
            <p className="schedora-hero-note">Set up your business in minutes. Keep your team and customers in sync.</p>
          </div>
          <ImagePlaceholder label="Hero product screenshot" className="schedora-hero-image" />
        </div>
      </section>

      <section className="schedora-trust-strip" aria-label="Schedora benefits">
        <div className="schedora-container schedora-trust-grid">
          {['Online booking', 'Centralized calendar', 'Customer management', 'Team coordination'].map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="schedora-section">
        <div className="schedora-container schedora-two-column">
          <div>
            <SectionHeading eyebrow="The simpler way to work" title="Less admin. More time for your customers." description="Scattered messages, manual calendars, and missed updates make a busy day harder than it needs to be. Schedora brings the essential parts of your business together." />
            <div className="schedora-benefit-list">
              {['Keep every appointment in one clear view', 'Let customers book when it suits them', 'Give your team the context they need'].map((benefit) => <div className="schedora-benefit-item" key={benefit}><FiCheckCircle /><span>{benefit}</span></div>)}
            </div>
          </div>
          <ImagePlaceholder label="Benefits product screenshot" />
        </div>
      </section>

      <section className="schedora-section schedora-muted-section" id="features">
        <div className="schedora-container">
          <SectionHeading eyebrow="Everything in one place" title="The tools to run a smoother business." description="From your first booking of the day to your final appointment, Schedora keeps the details organized and easy to find." />
          <div className="schedora-feature-grid">
            {featurePlaceholders.map(([number, title, description, Icon]) => (
              <article className="schedora-feature-card" key={title}>
                <span className="schedora-card-number">{number}</span>
                <span className="schedora-feature-icon"><Icon /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="schedora-section">
        <div className="schedora-container">
          <SectionHeading eyebrow="See it in action" title="Product showcase section" description="Your dashboard, calendar, and booking-page images will be placed in these responsive slots." align="center" />
          <div className="schedora-showcase-grid">
            <ImagePlaceholder label="Dashboard" className="schedora-showcase-large" />
            <ImagePlaceholder label="Calendar" />
            <ImagePlaceholder label="Booking page" />
          </div>
        </div>
      </section>

      <section className="schedora-section schedora-muted-section" id="how-it-works">
        <div className="schedora-container">
          <SectionHeading eyebrow="A better daily workflow" title="How Schedora works" description="A simple three-to-four step walkthrough will make the product easy to understand before registration." align="center" />
          <div className="schedora-steps-grid">
            {['Create your workspace', 'Add services and staff', 'Set your availability', 'Share your booking link'].map((step, index) => <div className="schedora-step-card" key={step}><span>0{index + 1}</span><h3>{step}</h3><p>Step description placeholder.</p></div>)}
          </div>
        </div>
      </section>

      <section className="schedora-section">
        <div className="schedora-container schedora-two-column">
          <ImagePlaceholder label="Use case" />
          <SectionHeading eyebrow="Built for service businesses" title="Who Schedora is for" description="Use-case content will show how salons, clinics, studios, and other appointment-based businesses can benefit." />
        </div>
      </section>

      <section className="schedora-section schedora-faq-section" id="faq">
        <div className="schedora-container">
          <SectionHeading eyebrow="Questions, answered" title="Everything you need to know about Schedora." description="Find quick answers about setup, online booking, and running your workspace." align="center" />
          <FAQList />
        </div>
      </section>

      <section className="schedora-cta-section">
        <div className="schedora-container schedora-cta-inner">
          <div><p className="schedora-eyebrow">Ready when you are</p><h2>Final CTA section ready for your message.</h2></div>
          <Link className="schedora-button" to="/register">Create your workspace <FiArrowRight /></Link>
        </div>
      </section>

      <footer className="schedora-footer">
        <div className="schedora-container schedora-footer-inner"><Brand /><p>Appointment management for calmer, more organized businesses.</p><span>© {new Date().getFullYear()} Schedora</span></div>
      </footer>
    </main>
  )
}
