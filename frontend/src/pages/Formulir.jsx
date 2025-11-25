import { useState, useEffect, useRef } from 'react';
import { FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { formulirAPI, getImageUrl } from '../services/api';
import './Formulir.css';

const Formulir = () => {
  const [formulirs, setFormulirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [currentPage, setCurrentPage] = useState({});
  const carouselRefs = useRef({});

  useEffect(() => {
    const fetchFormulirs = async () => {
      try {
        setLoading(true);
        const response = await formulirAPI.getAll();
        setFormulirs(response.data || []);
      } catch (error) {
        console.error('Error fetching formulirs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFormulirs();
  }, []);

  // Get unique categories
  const categories = ['Semua', ...new Set(formulirs.map(f => f.category))];

  // Filter formulirs by category
  const filteredFormulirs = selectedCategory === 'Semua'
    ? formulirs
    : formulirs.filter(f => f.category === selectedCategory);

  // Group by category
  const groupedFormulirs = filteredFormulirs.reduce((acc, formulir) => {
    const category = formulir.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(formulir);
    return acc;
  }, {});

  // Constants
  const ITEMS_PER_PAGE = 4;

  // Get total pages for a category
  const getTotalPages = (items) => Math.ceil(items.length / ITEMS_PER_PAGE);

  // Get current page for a category
  const getCurrentPageForCategory = (category) => currentPage[category] || 0;

  // Navigate slider
  const navigateSlider = (category, direction) => {
    const totalPages = getTotalPages(groupedFormulirs[category]);
    const current = getCurrentPageForCategory(category);

    let newPage;
    if (direction === 'next') {
      newPage = current + 1 >= totalPages ? 0 : current + 1;
    } else {
      newPage = current - 1 < 0 ? totalPages - 1 : current - 1;
    }

    setCurrentPage(prev => ({ ...prev, [category]: newPage }));
  };

  // Get items for current page
  const getPageItems = (items, category) => {
    const page = getCurrentPageForCategory(category);
    const start = page * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  // Handle download
  const handleDownload = async (formulir) => {
    try {
      const fileUrl = getImageUrl(formulir.document);

      // Fetch the file
      const response = await fetch(fileUrl);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from path or use formulir name
      const fileName = formulir.name.replace(/\s+/g, '_') + '.pdf';
      link.download = fileName;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Gagal mengunduh file. Silakan coba lagi.');
    }
  };

  return (
    <div className="formulir-page">
      <div className="page-header">
        <div className="container">
          <h1>Formulir Stasi</h1>
          <p>Unduh formulir yang Anda butuhkan</p>
        </div>
      </div>

      <div className="container">
        <div className="intro-section">
          <p>
            Berikut adalah daftar formulir yang tersedia untuk berbagai keperluan di Stasi Yohanes Gabriel Perboyre.
            Silakan unduh formulir yang Anda butuhkan, lengkapi dengan benar, dan serahkan ke sekretariat stasi.
          </p>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{textAlign: 'center', padding: '2rem'}}>Memuat data formulir...</p>
        ) : Object.keys(groupedFormulirs).length > 0 ? (
          <div className="formulir-sections">
            {Object.entries(groupedFormulirs).map(([category, forms], index) => {
              const totalPages = getTotalPages(forms);
              const currentCategoryPage = getCurrentPageForCategory(category);
              const displayItems = getPageItems(forms, category);

              return (
                <div key={index} className="formulir-category">
                  <div className="category-header">
                    <h2 className="category-title">
                      <FileText size={24} />
                      {category}
                    </h2>
                    {totalPages > 1 && (
                      <div className="slider-controls">
                        <button
                          onClick={() => navigateSlider(category, 'prev')}
                          className="slider-btn"
                          aria-label="Previous"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <span className="page-indicator">
                          {currentCategoryPage + 1} / {totalPages}
                        </span>
                        <button
                          onClick={() => navigateSlider(category, 'next')}
                          className="slider-btn"
                          aria-label="Next"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="formulir-grid">
                    {displayItems.map((formulir) => (
                      <div key={formulir.id} className="formulir-card-new">
                        <div className="card-icon">
                          <FileText size={48} />
                        </div>
                        <div className="formulir-info">
                          <h3>{formulir.name}</h3>
                          <p>{formulir.description}</p>
                        </div>
                        <button
                          onClick={() => handleDownload(formulir)}
                          className="download-btn"
                        >
                          <Download size={20} />
                          Unduh PDF
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{textAlign: 'center', padding: '2rem'}}>Tidak ada formulir tersedia</p>
        )}

        <div className="info-box">
          <h3>Informasi Penting</h3>
          <ul>
            <li>Pastikan formulir diisi dengan lengkap dan jelas</li>
            <li>Formulir yang sudah diisi dapat diserahkan ke sekretariat stasi setelah Misa atau pada jam kerja</li>
            <li>Untuk informasi lebih lanjut, silakan hubungi sekretariat stasi</li>
            <li>Beberapa formulir memerlukan dokumen pendukung, pastikan Anda membawa kelengkapan yang diperlukan</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Formulir;
