import { Link } from 'react-router-dom';

export default function NotFound() {
  return <main className="not-found"><p className="eyebrow">WRONG TURN</p><h1>That page isn't on the calendar.</h1><Link className="button" to="/events">Back to events <span aria-hidden="true">→</span></Link></main>;
}