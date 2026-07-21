import Header from '../Header/Header';
import person from '../assets/person.png';

const team = [
  ['Maya Chen', 'Customer Experience Lead', 'Helps drivers compare dealerships with clear, useful information.', 'maya.chen@bestcars.com'],
  ['Jordan Ellis', 'Dealer Partnerships', 'Works with dealerships to keep location and inventory details current.', 'jordan.ellis@bestcars.com'],
  ['Sam Rivera', 'Platform Engineering', 'Builds reliable tools for reviews, search, and account security.', 'sam.rivera@bestcars.com'],
];

const About = () => <>
  <Header />
  <main className="page-shell">
    <section className="page-intro">
      <p className="eyebrow">About Best Cars</p>
      <h1>A better way to choose a dealership.</h1>
      <p>We connect drivers with dealership information and candid customer feedback, making the search for a car more transparent.</p>
    </section>
    <section className="team-grid" aria-label="Our team">
      {team.map(([name, role, bio, email]) => <article className="team-member" key={name}>
        <img src={person} alt={`${name}, ${role}`} />
        <h2>{name}</h2>
        <strong>{role}</strong>
        <p>{bio}</p>
        <a href={`mailto:${email}`}>{email}</a>
      </article>)}
    </section>
  </main>
</>;

export default About;
