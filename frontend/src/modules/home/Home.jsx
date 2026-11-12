import React, { useState, useEffect, useCallback, useRef } from 'react';
import productService from '../../services/product.service';
import ProductList from '../../components/ProductList';
import './Home.css';
import { Alert, Button, Flex, Input, Select, Typography } from 'antd';
import { MagnifyingGlass, MapPin } from '@phosphor-icons/react';
import CategoryIcon from '../../utils/categoryIcons';

const CATEGORIES = [
  { id: 'books', name: 'Sách' },
  { id: 'fashion', name: 'Quần áo' },
  { id: 'electronics', name: 'Đồ điện tử' },
  { id: 'home', name: 'Đồ gia dụng' },
  { id: 'beauty', name: 'Làm đẹp' },
  { id: 'sports', name: 'Thể thao' },
  { id: 'toys', name: 'Đồ chơi' },
  { id: 'pets', name: 'Thú cưng' }
];

const CATEGORY_OPTIONS = CATEGORIES.map(({ id, name }) => ({ value: id, label: name }));

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Mới' },
  { value: 'like-new', label: 'Như mới' },
  { value: 'good', label: 'Tốt' },
  { value: 'fair', label: 'Khá' },
  { value: 'poor', label: 'Cũ' }
];

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Giá: thấp đến cao' },
  { value: 'price_desc', label: 'Giá: cao đến thấp' },
  { value: 'name_asc', label: 'Tên: A đến Z' },
  { value: 'name_desc', label: 'Tên: Z đến A' }
];

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

  const [draft, setDraft] = useState({ search: '', city: '' });

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

  const handleSearch = (event) => {
    event.preventDefault();
    const search = draft.search.trim();
    const city = draft.city.trim();
    setFilters(prev => ({ ...prev, search, cities: city ? [city] : [] }));
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

  return (
    <div className="home">
      <section className="home__hero">
        <div className="home__hero-background" aria-hidden="true">
          <div className="home__hero-overlay"></div>
        </div>

        <div className="home__hero-content">
          <Typography.Title level={1} className="home__title">Giá tốt, gần bạn, chốt nhanh!</Typography.Title>

          <form className="home__search" role="search" aria-label="Tìm sản phẩm" onSubmit={handleSearch}>
            <Select
              className="home__search-category"
              size="large"
              variant="filled"
              allowClear
              placeholder="Danh mục"
              aria-label="Danh mục"
              options={CATEGORY_OPTIONS}
              value={filters.category ?? undefined}
              onChange={(value) => handleFilterChange({ category: value || null })}
            />
            <Input
              className="home__search-query"
              size="large"
              variant="filled"
              allowClear
              prefix={<MagnifyingGlass />}
              placeholder="Tìm sản phẩm..."
              aria-label="Tìm sản phẩm"
              value={draft.search}
              onChange={(event) => setDraft(prev => ({ ...prev, search: event.target.value }))}
            />
            <Input
              className="home__search-city"
              size="large"
              variant="filled"
              prefix={<MapPin />}
              placeholder="Tỉnh/thành"
              aria-label="Lọc theo tỉnh/thành"
              value={draft.city}
              onChange={(event) => setDraft(prev => ({ ...prev, city: event.target.value }))}
            />
            <Button className="home__search-submit" type="primary" htmlType="submit" size="large" shape="round">
              Tìm kiếm
            </Button>
          </form>
        </div>
      </section>

      <section className="home__categories" aria-labelledby="category-heading">
        <div className="home__container">
          <Flex justify="space-between" align="flex-end" gap={16} className="home__categories-heading">
            <div>
              <Typography.Text strong className="home__eyebrow">KHÁM PHÁ</Typography.Text>
              <Typography.Title level={2} id="category-heading" className="home__section-title">Danh mục đa dạng</Typography.Title>
            </div>
            <Typography.Text type="secondary" className="home__categories-note">Cập nhật sản phẩm đang bán</Typography.Text>
          </Flex>
          <Flex gap={10} className="home__chips" role="group" aria-label="Danh mục sản phẩm">
            {CATEGORIES.map((cat) => {
              const active = filters.category === cat.id;
              return (
                <Button
                  key={cat.id}
                  size="large"
                  shape="round"
                  type={active ? 'primary' : 'default'}
                  icon={<CategoryIcon slug={cat.id} />}
                  aria-pressed={active}
                  onClick={() => handleFilterChange({ category: active ? null : cat.id })}
                >
                  {cat.name}
                </Button>
              );
            })}
          </Flex>
        </div>
      </section>

      <div className="home__container">
        <Flex justify="flex-end" gap={10} wrap className="home__filters">
          <Select
            className="home__filter"
            allowClear
            placeholder="Tình trạng"
            aria-label="Lọc theo tình trạng"
            options={CONDITION_OPTIONS}
            value={filters.condition ?? undefined}
            onChange={(value) => handleFilterChange({ condition: value || null })}
          />
          <Select
            className="home__filter home__filter--sort"
            allowClear
            placeholder="Sắp xếp"
            aria-label="Sắp xếp sản phẩm"
            options={SORT_OPTIONS}
            value={filters.sort ?? undefined}
            onChange={(value) => handleFilterChange({ sort: value || null })}
          />
        </Flex>
      </div>

      <div className="home__content">
        <div className="home__container">
          <section className="home__main" aria-label="Sản phẩm đang được rao bán">
            {error && (
              <Alert
                type="error"
                showIcon
                className="home__error"
                title={error}
                action={<Button size="small" type="primary" onClick={() => fetchProducts(1, true)}>Thử lại</Button>}
              />
            )}

            <ProductList products={products} loading={loading && products.length === 0} />

            {!error && hasMore && products.length > 0 && (
              <Flex justify="center" className="home__load-more">
                <Button size="large" shape="round" onClick={handleLoadMore} disabled={loading}>
                  {loading ? 'Đang tải sản phẩm...' : 'Xem thêm'}
                </Button>
              </Flex>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Home;
