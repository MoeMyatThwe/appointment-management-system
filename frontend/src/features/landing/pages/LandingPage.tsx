import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FiArrowRight, FiBell, FiCalendar, FiCheckCircle, FiGrid, FiLink, FiUsers } from 'react-icons/fi'
import dashboardImage from '../../../assets/schedora-dashboard-overview.png'
import calendarImage from '../../../assets/schedora-calendar.svg'
import bookingImage from '../../../assets/schedora-booking.svg'
import customersImage from '../../../assets/schedora-customers.svg'
import teamImage from '../../../assets/schedora-team.svg'
import reportsImage from '../../../assets/schedora-reports.svg'

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

function ProductVisual({ label, className = '', src }: { label: string; className?: string; src: string }) {
  return (
    <div className={`schedora-product-visual schedora-reveal ${className}`} role="img" aria-label={label}>
      <img src={src} alt="" />
    </div>
  )
}

function SectionHeading({ eyebrow, title, description, align = 'left' }: { eyebrow: string; title: string; description: string; align?: 'left' | 'center' }) {
  return (
    <div className={`schedora-section-heading schedora-reveal ${align === 'center' ? 'schedora-section-heading-center' : ''}`}>
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
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          revealObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' })

    document.querySelectorAll('.schedora-reveal').forEach((element) => revealObserver.observe(element))
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      revealObserver.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <main className="schedora-landing">
      <header className={`schedora-header ${isScrolled ? 'schedora-header-scrolled' : ''}`}>
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
          <div className="schedora-hero-copy schedora-reveal">
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
          <ProductVisual label="Schedora dashboard preview" src={dashboardImage} className="schedora-hero-image" />
        </div>
      </section>

      <section className="schedora-trust-strip" aria-label="Schedora benefits">
        <div className="schedora-container schedora-trust-grid">
          {['Online booking', 'Centralized calendar', 'Customer management', 'Team coordination'].map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="schedora-section schedora-value-section">
        <div className="schedora-container">
          <SectionHeading eyebrow="A clearer operating system" title="Everything your business needs to stay in sync." description="Schedora connects the moments that usually get scattered across messages, spreadsheets, and separate calendars." align="center" />
          <div className="schedora-value-grid">
            {[
              ['For your customers', 'A simple booking page makes it easy to choose a service, team member, and available time.'],
              ['For your team', 'A shared calendar keeps appointments, availability, services, and responsibilities visible.'],
              ['For your business', 'Customer history, reports, and exports give you useful context for every decision.'],
            ].map(([title, description], index) => (
              <article className="schedora-value-card schedora-reveal" key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
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
          <ProductVisual label="Schedora customer directory" src={customersImage} />
        </div>
      </section>

      <section className="schedora-section schedora-muted-section" id="features">
        <div className="schedora-container">
          <SectionHeading eyebrow="Everything in one place" title="The tools to run a smoother business." description="From your first booking of the day to your final appointment, Schedora keeps the details organized and easy to find." />
          <div className="schedora-feature-grid">
            {featurePlaceholders.map(([number, title, description, Icon]) => (
              <article className="schedora-feature-card schedora-reveal" key={title}>
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
        <div className="schedora-container schedora-two-column">
          <div>
            <SectionHeading eyebrow="See the bigger picture" title="Turn daily bookings into better decisions." description="Track appointment volume, service demand, and completed work so you can understand what is happening across your business." />
            <div className="schedora-benefit-list">
              {['See demand by service', 'Export tenant-scoped records', 'Keep your team aligned with real workload data'].map((benefit) => <div className="schedora-benefit-item" key={benefit}><FiCheckCircle /><span>{benefit}</span></div>)}
            </div>
          </div>
          <ProductVisual label="Schedora reports and exports" src={reportsImage} />
        </div>
      </section>

      <section className="schedora-section">
        <div className="schedora-container">
          <SectionHeading eyebrow="See it in action" title="One workspace, every booking detail." description="Move from your workspace overview to the calendar and public booking page without losing context." align="center" />
          <div className="schedora-showcase-grid">
            <ProductVisual label="Schedora dashboard" src={dashboardImage} className="schedora-showcase-large" />
            <ProductVisual label="Schedora calendar" src={calendarImage} />
            <ProductVisual label="Schedora booking page" src={bookingImage} />
          </div>
        </div>
      </section>

      <section className="schedora-section schedora-muted-section" id="how-it-works">
        <div className="schedora-container">
          <SectionHeading eyebrow="A better daily workflow" title="How Schedora works" description="Set up your workspace once, then let your team and customers use the same clear booking flow." align="center" />
          <div className="schedora-steps-grid">
            {[
              ['Create your workspace', 'Start with your business name, timezone, and team access.'],
              ['Add services and staff', 'Define what you offer and who can deliver each service.'],
              ['Set your availability', 'Choose business hours and keep bookable time predictable.'],
              ['Share your booking link', 'Let customers choose a service, team member, and open slot.'],
            ].map(([step, description], index) => <div className="schedora-step-card schedora-reveal" key={step}><span>0{index + 1}</span><h3>{step}</h3><p>{description}</p></div>)}
          </div>
        </div>
      </section>

      <section className="schedora-section">
        <div className="schedora-container schedora-two-column">
          <ProductVisual label="Schedora team and services management" src={teamImage} />
          <div>
            <SectionHeading eyebrow="Built for service businesses" title="Who Schedora is for" description="Give every appointment-based business a clearer way to coordinate customers, staff, services, and availability." />
            <div className="schedora-benefit-list">
              {['Salons and barbershops managing rotating staff', 'Clinics and studios coordinating services and rooms', 'Consultants and wellness teams sharing a simple booking link'].map((useCase) => <div className="schedora-benefit-item" key={useCase}><FiCheckCircle /><span>{useCase}</span></div>)}
            </div>
          </div>
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
          <div><p className="schedora-eyebrow">Ready when you are</p><h2>Give your team a calmer way to run the day.</h2></div>
          <Link className="schedora-button" to="/register">Create your workspace <FiArrowRight /></Link>
        </div>
      </section>

      <footer className="schedora-footer">
        <div className="schedora-container schedora-footer-inner"><Brand /><p>Appointment management for calmer, more organized businesses.</p><span>© {new Date().getFullYear()} Schedora</span></div>
      </footer>
    </main>
  )
}
