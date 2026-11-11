import React, { useState, useEffect, useCallback, useRef } from 'react';
import productService from '../../services/product.service';
import ProductList from '../../components/ProductList';
import './Home.css';

/**
 * Home Component (Landing Page)
 * Displays product listing with search, filters, and pagination
 * Implements Requirements 5-10: Browse, Search, Filter products
 * Design: Chợ Tốt marketplace style
 */
function Home() {
  const PRODUCTS_UPDATED_KEY = 'products:lastCreatedAt';
  // State for products
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRequested = useRef(false);
  const newProductsStartId = useRef(null);

  // State for filters (Req 6-9)
  const [filters, setFilters] = useState({
    search: '',
    category: null,
    minPrice: null,
    maxPrice: null,
    cities: [],
    sort: null,
    condition: null
  });

  // State phan trang (Yeu cau 5)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Tai san pham khi bo loc thay doi (reset ve trang 1)
  useEffect(() => {
    setProducts([]);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProducts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const refreshProductsFromEvent = useCallback(() => {
    setProducts([]);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProducts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (!newProductsStartId.current) return;
    const firstNewProduct = document.getElementById(`product-${newProductsStartId.current}`);
    if (!firstNewProduct) return;
    firstNewProduct.scrollIntoView({ behavior: 'smooth', block: 'start' });
    newProductsStartId.current = null;
  }, [products]);

  useEffect(() => {
    const handleProductsUpdated = () => {
      refreshProductsFromEvent();
    };

    const handleStorageChange = (event) => {
      if (event.key === PRODUCTS_UPDATED_KEY) {
        refreshProductsFromEvent();
      }
    };

    window.addEventListener('products:updated', handleProductsUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('products:updated', handleProductsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshProductsFromEvent]);

  /**
   * Tai danh sach san pham tu API
   * Trien khai Yeu cau 5: Duyet san pham co phan trang
   * Trien khai Yeu cau 10: Ket hop nhieu bo loc
   */
  const fetchProducts = async (page = 1, reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.cities && filters.cities.length > 0 && { cities: filters.cities }),
        ...(filters.sort && { sort: filters.sort }),
        ...(filters.condition && { condition: filters.condition })
      };

      const result = await productService.getProducts(params);

      // Client-side fallback for name sorting: ensure loaded items are ordered by title
      const incoming = result.products || [];

      // FILTER CONDITION
      let processed = incoming;

      if (filters.condition) {
        processed = processed.filter(p => p.condition === filters.condition);
      }

      // SORT fallback
      if (filters.sort === 'name_asc' || filters.sort === 'name_desc') {
        const direction = filters.sort === 'name_asc' ? 1 : -1;
        processed = processed.slice().sort((a, b) => {
          const ta = (a.title || '').toString();
          const tb = (b.title || '').toString();
          return ta.localeCompare(tb, 'vi', { sensitivity: 'base' }) * direction;
        });
      }

      if (reset) {
        loadMoreRequested.current = false;
        setProducts(processed);
      } else {
        const shouldScrollToNewPage = loadMoreRequested.current;
        loadMoreRequested.current = false;
        if (shouldScrollToNewPage && processed.length > 0) {
          newProductsStartId.current = processed[0]._id;
        }
        setProducts(prev => {
          const merged = [...prev, ...processed];
          if (filters.sort === 'name_asc' || filters.sort === 'name_desc') {
            const direction = filters.sort === 'name_asc' ? 1 : -1;
            return merged.slice().sort((a, b) => {
              const ta = (a.title || '').toString();
              const tb = (b.title || '').toString();
              return ta.localeCompare(tb, 'vi', { sensitivity: 'base' }) * direction;
            });
          }
          return merged;
        });
      }

      setPagination(prev => ({
        ...prev,
        page: page,
        total: result.total || 0,
        totalPages: result.totalPages || 0
      }));

      setHasMore(page < (result.totalPages || 0));
    } catch (err) {
      loadMoreRequested.current = false;
      console.error('Error fetching products:', err);
      setError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle load more
   */
  const handleLoadMore = () => {
    if (loading) return;
    const nextPage = pagination.page + 1;
    loadMoreRequested.current = true;
    fetchProducts(nextPage, false);
  };

  /**
   * Handle search
   * Implements Requirement 6: Search Products
   * Resets pagination to page 1 when search changes
   */
  const handleSearch = (searchValue) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  /**
   * Handle filter changes
   * Implements Requirements 7-9: Filter by category, price, location
   * Resets pagination to page 1 when filters change
   */
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Categories data - Updated to match seed data
  const categories = [
    { id: 'books', name: 'Sách', icon: '📚' },
    { id: 'fashion', name: 'Quần áo', icon: '👕' },
    { id: 'electronics', name: 'Đồ điện tử', icon: '📱' },
    { id: 'home', name: 'Đồ gia dụng', icon: '🏠' },
    { id: 'beauty', name: 'Làm đẹp', icon: '💄' },
    { id: 'sports', name: 'Thể thao', icon: '⚽' },
    { id: 'toys', name: 'Đồ chơi', icon: '🧸' },
    { id: 'pets', name: 'Thú cưng', icon: '🐕' }
  ];

  return (
    <div className="home">
      {/* Hero Banner */}
      <div className="home__hero">
        <div className="home__hero-background" aria-hidden="true">
          <div className="home__hero-overlay"></div>
        </div>

        <div className="home__hero-content" style={{ marginTop: '60px' }}>
          <h1>Giá tốt, gần bạn, chốt nhanh!</h1>

          {/* Advanced Search Bar */}
          <div className="home__search-advanced">
            <div className="search-advanced">
              {/* Category Dropdown */}
              <div className="search-advanced__category">
                <select
                  className="search-advanced__select"
                  onChange={(e) => handleFilterChange({ category: e.target.value || null })}
                  value={filters.category || ''}
                >
                  <option value="">Danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="search-advanced__input-wrapper">
                <span className="search-advanced__icon">🔍</span>
                <input
                  type="text"
                  className="search-advanced__input"
                  placeholder="Tìm sản phẩm..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(filters.search);
                    }
                  }}
                />
              </div>

              {/* City filter */}
              <label className="search-advanced__location">
                <span className="search-advanced__location-icon">📍</span>
                <input
                  className="search-advanced__city"
                  type="text"
                  placeholder="Tỉnh/thành"
                  aria-label="Lọc theo tỉnh/thành"
                  value={filters.cities[0] || ''}
                  onChange={(event) => handleFilterChange({
                    cities: event.target.value ? [event.target.value] : []
                  })}
                />
              </label>

              {/* (Sort removed from search bar - moved below categories) */}
              {/* Search Button */}
              <button
                className="search-advanced__button"
                onClick={() => handleSearch(filters.search)}
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Icons */}
      <section className="home__categories" aria-labelledby="category-heading">
        <div className="home__categories-container">
          <div className="home__categories-heading">
            <div><p>KHÁM PHÁ</p><h2 id="category-heading">Danh mục đa dạng</h2></div>
            <span>Cập nhật sản phẩm đang bán</span>
          </div>
          <div className="home__categories-grid">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-item${filters.category === cat.id ? ' is-active' : ''}`}
                onClick={() => handleFilterChange({ category: cat.id })}
              >
                <span className="category-item__icon" aria-hidden="true">{cat.icon}</span>
                <span className="category-item__name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sort control: placed below categories and above products */}
      <div className="home__sort-container" style={{ maxWidth: 1200, margin: '16px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <select
            className="search-advanced__select"
            onChange={(e) => handleFilterChange({ condition: e.target.value || null })}
            value={filters.condition || ''}
            style={{ minWidth: 160 }}
          >
            <option value="">Tình trạng</option>
            <option value="new">Mới</option>
            <option value="like-new">Như mới</option>
            <option value="good">Tốt</option>
            <option value="fair">Khá</option>
            <option value="poor">Cũ</option>
          </select>
          <select
            className="search-advanced__select"
            onChange={(e) => handleFilterChange({ sort: e.target.value || null })}
            value={filters.sort || ''}
            style={{ minWidth: 180 }}
          >
            <option value="">Sắp xếp</option>
            <option value="price_asc">Giá: thấp → cao</option>
            <option value="price_desc">Giá: cao → thấp</option>
            <option value="name_asc">Tên: A → Z</option>
            <option value="name_desc">Tên: Z → A</option>
          </select>
        </div>
      </div>

      <div className="home__content">
        {/* Products Section */}
        <div className="home__products-container">
          <section className="home__main" aria-label="Sản phẩm đang được rao bán">
            {/* Error Message */}
            {error && (
              <div className="home__error">
                <p>{error}</p>
                <button onClick={() => fetchProducts(1, true)} className="home__retry-button">
                  Thử lại
                </button>
              </div>
            )}

            {/* Product List - Requirement 5 */}
            <ProductList products={products} loading={loading && products.length === 0} />

            {/* Load More Button */}
            {!error && hasMore && products.length > 0 && (
              <div className="home__load-more">
                <button onClick={handleLoadMore} className="home__load-more-button" disabled={loading}>
                  {loading ? 'Đang tải sản phẩm...' : 'Xem thêm'}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Home;
