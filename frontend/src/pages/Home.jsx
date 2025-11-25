import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, FileText, Users, Heart } from 'lucide-react';
import { pengumumanAPI, profileAPI, artikelAPI, liturgicalCalendarAPI } from '../services/api';
import HeroSlider from '../components/HeroSlider';
import './Home.css';

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [articles, setArticles] = useState([]);
  const [profile, setProfile] = useState(null);
  const [massSchedule, setMassSchedule] = useState([]);
  const [socialMedia, setSocialMedia] = useState({});
  const [liturgicalData, setLiturgicalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Helper function to get color class for liturgical color
  const getLiturgicalColorClass = (color) => {
    const colorMap = {
      'Putih': 'white',
      'Hijau': 'green',
      'Ungu': 'purple',
      'Merah': 'red',
      'Merah Muda': 'pink',
      'Hitam': 'black'
    };
    return colorMap[color] || 'green';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch pengumuman terbaru (3 items, published only)
        const pengumumanData = await pengumumanAPI.getAll({
          status: 'published',
          limit: 3
        });
        setAnnouncements(pengumumanData.data || []);

        // Fetch artikel terbaru (5 items, published only)
        const artikelData = await artikelAPI.getAll({
          status: 'published',
          limit: 5
        });
        setArticles(artikelData.data || []);
        setArticlesLoading(false);

        // Fetch profile data (untuk social media dan jadwal misa)
        const profileData = await profileAPI.get();
        setProfile(profileData.data);

        // Fetch liturgical calendar data for today
        try {
          const liturgyData = await liturgicalCalendarAPI.getToday();
          setLiturgicalData(liturgyData);
        } catch (error) {
          console.error('Error fetching liturgical calendar:', error);
          // Set fallback data jika API gagal
          setLiturgicalData({
            liturgicalMemorial: 'Hari Biasa dalam Tahun',
            liturgicalColor: 'Hijau',
            eucharisticReading: {
              gospel: 'Tersedia di Lectio Divina atau buku liturgi',
              firstReading: ''
            }
          });
        }

        // Parse mass schedule dan social media dari profile
        if (profileData.data) {
          // Parse mass schedule
          if (profileData.data.massSchedule) {
            try {
              // Remove extra quotes and parse
              let scheduleStr = profileData.data.massSchedule;
              // Remove leading/trailing quotes and unescape
              scheduleStr = scheduleStr.replace(/^"(.*)"$/, '$1');
              scheduleStr = scheduleStr.replace(/\\"/g, '"');
              scheduleStr = scheduleStr.replace(/\\\\/g, '\\');

              const schedules = JSON.parse(scheduleStr);
              setMassSchedule(schedules);
            } catch (e) {
              console.error('Error parsing mass schedule:', e);
              setMassSchedule([]);
            }
          }

          // Parse social media
          if (profileData.data.socialMedia) {
            try {
              // Remove extra quotes and parse
              let socialStr = profileData.data.socialMedia;
              // Remove leading/trailing quotes and unescape
              socialStr = socialStr.replace(/^"(.*)"$/, '$1');
              socialStr = socialStr.replace(/\\"/g, '"');
              socialStr = socialStr.replace(/\\\\/g, '\\');

              const social = JSON.parse(socialStr);
              setSocialMedia(social);
            } catch (e) {
              console.error('Error parsing social media:', e);
              setSocialMedia({});
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setArticlesLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="home">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Quick Links */}
      <section className="quick-links">
        <div className="container">
          <div className="quick-links-grid">
            <Link to="/artikel" className="quick-link-card">
              <FileText size={40} />
              <h3>Artikel</h3>
              <p>Baca artikel terbaru</p>
            </Link>
            <Link to="/pengumuman" className="quick-link-card">
              <Calendar size={40} />
              <h3>Pengumuman</h3>
              <p>Info terkini</p>
            </Link>
            <Link to="/kategorial" className="quick-link-card">
              <Users size={40} />
              <h3>Kategorial</h3>
              <p>Kelompok kategorial</p>
            </Link>
            <Link to="/karya-sosial" className="quick-link-card">
              <Heart size={40} />
              <h3>Karya Sosial</h3>
              <p>Kegiatan sosial</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Kalender Liturgi */}
      <section className="liturgy-calendar section">
        <div className="container">
          <h2 className="section-title">Kalender Liturgi</h2>
          <div className="calendar-widget">
            <div className="calendar-header">
              <h3>Hari Ini: {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</h3>
            </div>
            {liturgicalData ? (
              <div className="liturgy-info">
                {liturgicalData.liturgicalMemorial && (
                  <p className="liturgy-memorial"><strong>{liturgicalData.liturgicalMemorial}</strong></p>
                )}
                <p className="liturgy-color">
                  Warna Liturgi:
                  <span className={`color-indicator ${getLiturgicalColorClass(liturgicalData.liturgicalColor)}`}></span>
                  {liturgicalData.liturgicalColor}
                </p>
                {liturgicalData.eucharisticReading?.gospel && (
                  <p className="liturgy-reading">Bacaan Injil: {liturgicalData.eucharisticReading.gospel}</p>
                )}
                {liturgicalData.eucharisticReading?.firstReading && (
                  <p className="liturgy-reading">Bacaan I: {liturgicalData.eucharisticReading.firstReading}</p>
                )}
              </div>
            ) : (
              <div className="liturgy-info">
                <p>Memuat data kalender liturgi...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Jadwal Misa & Artikel */}
      <section className="schedule-section section">
        <div className="container">
          <div className="schedule-grid">
            {/* Jadwal Misa */}
            <div className="schedule-card">
              <h2 className="section-title">Jadwal Misa</h2>

              <div className="schedule-list">
                {massSchedule.length > 0 ? (
                  massSchedule.map((schedule, index) => (
                    <div key={index} className="schedule-item">
                      <Clock size={20} />
                      <div>
                        <strong>{schedule.type}</strong>
                        <p>{schedule.day}</p>
                        <p>{schedule.time} WIB</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="schedule-item">
                    <Clock size={20} />
                    <div>
                      <p>Memuat jadwal misa...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="media-links">
                <h3>Streaming</h3>
                {socialMedia.youtube && (
                  <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    YouTube
                  </a>
                )}
                {socialMedia.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                    Instagram
                  </a>
                )}
              </div>
            </div>

            {/* Artikel Terbaru */}
            <div className="schedule-card">
              <h2 className="section-title">Artikel Terbaru</h2>
              <div className="artikel-list">
                {articlesLoading ? (
                  <p>Memuat artikel...</p>
                ) : articles.length > 0 ? (
                  articles.map((article) => (
                    <Link key={article.id} to={`/artikel/${article.slug}`} className="artikel-item">
                      <h4>{article.title}</h4>
                      <p>{article.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                      <span className="read-more">Read more →</span>
                    </Link>
                  ))
                ) : (
                  <p>Tidak ada artikel terbaru</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pengumuman Terbaru */}
      <section className="announcements section">
        <div className="container">
          <h2 className="section-title">Pengumuman Terbaru</h2>
          {loading ? (
            <p style={{textAlign: 'center'}}>Memuat pengumuman...</p>
          ) : (
            <div className="announcements-grid">
              {announcements.length > 0 ? (
                announcements.map((item) => (
                  <Link key={item.id} to={`/pengumuman/${item.slug}`} className="announcement-card">
                    <div className="announcement-date">
                      {new Date(item.publishDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                    <span className="read-more">Baca Selengkapnya →</span>
                  </Link>
                ))
              ) : (
                <p style={{textAlign: 'center', gridColumn: '1/-1'}}>Tidak ada pengumuman terbaru</p>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default Home;
