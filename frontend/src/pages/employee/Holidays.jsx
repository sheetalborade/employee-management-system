import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { getHolidays } from '../../services/leaveService';
import { formatDate } from '../../utils/formatDate';

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    getHolidays(year)
      .then((res) => {
        if (res.success) setHolidays(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  return (
    <div className="page">
      <Navbar title="Holidays" subtitle="Company holiday calendar" />

      <div className="toolbar">
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? <Loader /> : (
          <div className="holiday-list full">
            {holidays.map((h) => (
              <div key={h.id} className="holiday-item">
                <div className="holiday-date">
                  <span className="day">{new Date(h.date).getDate()}</span>
                  <span className="month">{new Date(h.date).toLocaleString('en', { month: 'short' })}</span>
                </div>
                <div>
                  <span className="name">{h.name}</span>
                  <span className="meta">{formatDate(h.date)}{h.description ? ` · ${h.description}` : ''}</span>
                </div>
              </div>
            ))}
            {holidays.length === 0 && <p className="empty-text">No holidays for {year}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Holidays;