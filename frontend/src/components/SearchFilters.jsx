const categories = ['Arts & culture', 'Food & drink', 'Learning', 'Music', 'Outdoors', 'Technology', 'Wellness'];

export default function SearchFilters({ filters, onChange, onReset }) {
  return (
    <section className="filters" aria-label="Filter events">
      <label className="search-field">
        <span className="sr-only">Search events</span>
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input value={filters.search} onChange={(event) => onChange('search', event.target.value)} placeholder="Search events, places, people" />
      </label>
      <label className="select-field">
        <span className="sr-only">Category</span>
        <select value={filters.category} onChange={(event) => onChange('category', event.target.value)}>
          <option value="">Every category</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <label className="date-field">
        <span className="sr-only">Event date</span>
        <input type="date" value={filters.date} onChange={(event) => onChange('date', event.target.value)} />
      </label>
      <label className="toggle-field">
        <input type="checkbox" checked={filters.upcoming} onChange={(event) => onChange('upcoming', event.target.checked)} />
        <span className="toggle-track" aria-hidden="true" />
        <span>Upcoming</span>
      </label>
      <button className="reset-filters" onClick={onReset} type="button">Reset</button>
    </section>
  );
}