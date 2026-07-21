import Header from '../Header/Header';
import person from '../assets/person.png';
const team = [
  ['Maya Chen', 'Customer Experience Lead', 'Helps drivers compare dealerships with clear, useful information.'],
  ['Jordan Ellis', 'Dealer Partnerships', 'Works with dealerships to keep location and inventory details current.'],
  ['Sam Rivera', 'Platform Engineering', 'Builds reliable tools for reviews, search, and account security.']
];
const About = () => <><Header/><main className="page-shell"><section className="page-intro"><p className="eyebrow">About Best Cars</p><h1>A better way to choose a dealership.</h1><p>We connect drivers with dealership information and candid customer feedback, making the search for a car more transparent.</p></section><section className="team-grid" aria-label="Our team">{team.map(([name, role, bio]) => <article className="team-member" key={name}><img src={person} alt=""/><h2>{name}</h2><strong>{role}</strong><p>{bio}</p></article>)}</section></main></>;
export default About;
