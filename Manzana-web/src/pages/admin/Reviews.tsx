import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard-enhancement.css";

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_item_id?: string | null;
  rating: number;
  title?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  product?: {
    id: string;
    name: string;
    images?: Array<{ url: string }>;
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recentReviews: number;
}

export default function Reviews() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Role-based access control - Admin only
  useEffect(() => {
    if (!isAdmin) {
      console.error('Insufficient permissions - Admin only');
      navigate("/admin");
      return;
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadReviews();
      calculateStats();
    }
  }, [isAdmin]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      console.log('⭐ Loading all reviews...');

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users (
            id,
            full_name,
            email
          ),
          products (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reviews:', error);
        console.error('Error details:', error.message);
        setReviews([]);
        return;
      }

      console.log('Raw reviews data:', data);

      // Fetch product images separately
      const reviewsWithImages = await Promise.all(
        (data || []).map(async (review: any) => {
          const productId = review.products?.id || review.product_id;

          if (productId) {
            const { data: images } = await supabase
              .from('product_images')
              .select('url')
              .eq('product_id', productId)
              .eq('is_primary', true)
              .limit(1);

            return {
              id: review.id,
              user_id: review.user_id,
              product_id: review.product_id,
              order_item_id: review.order_item_id,
              rating: review.rating,
              title: review.title,
              comment: review.comment,
              created_at: review.created_at,
              updated_at: review.updated_at,
              user: review.users ? {
                id: review.users.id,
                full_name: review.users.full_name,
                email: review.users.email
              } : undefined,
              product: review.products ? {
                id: review.products.id,
                name: review.products.name,
                images: images || []
              } : undefined
            };
          }

          return {
            id: review.id,
            user_id: review.user_id,
            product_id: review.product_id,
            order_item_id: review.order_item_id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            created_at: review.created_at,
            updated_at: review.updated_at,
            user: review.users ? {
              id: review.users.id,
              full_name: review.users.full_name,
              email: review.users.email
            } : undefined,
            product: review.products ? {
              id: review.products.id,
              name: review.products.name,
              images: []
            } : undefined
          };
        })
      );

      setReviews(reviewsWithImages);
      console.log(`⭐ Loaded ${reviewsWithImages.length} reviews`);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      const { data: allReviews, error } = await supabase
        .from('reviews')
        .select('rating, created_at');

      if (error) throw error;

      const totalReviews = allReviews?.length || 0;
      const averageRating = totalReviews > 0
        ? allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
        : 0;

      const ratingDistribution = {
        5: allReviews?.filter((r: any) => r.rating === 5).length || 0,
        4: allReviews?.filter((r: any) => r.rating === 4).length || 0,
        3: allReviews?.filter((r: any) => r.rating === 3).length || 0,
        2: allReviews?.filter((r: any) => r.rating === 2).length || 0,
        1: allReviews?.filter((r: any) => r.rating === 1).length || 0,
      };

      // Reviews in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentReviews = allReviews?.filter(
        (r: any) => new Date(r.created_at) > sevenDaysAgo
      ).length || 0;

      setStats({
        totalReviews,
        averageRating,
        ratingDistribution,
        recentReviews
      });
    } catch (error) {
      console.error('Failed to calculate stats:', error);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      console.log(`🗑️ Deleting review ${reviewId}...`);

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review');
        return;
      }

      // Update local state
      setReviews(prevReviews => prevReviews.filter(r => r.id !== reviewId));

      // Recalculate stats
      await calculateStats();

      console.log('✅ Review deleted successfully');
      alert('Review deleted successfully!');

      // Close modal if open
      if (showDetailsModal && selectedReview?.id === reviewId) {
        setShowDetailsModal(false);
        setSelectedReview(null);
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  const openDetailsModal = (review: Review) => {
    setSelectedReview(review);
    setShowDetailsModal(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              color: star <= rating ? '#FFC107' : '#E0E0E0',
              fontSize: '16px'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getRatingBadgeClass = (rating: number) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'danger';
  };

  const filteredReviews = reviews
    .filter(review => {
      const matchesSearch = !searchTerm ||
        review.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRating = ratingFilter === "all" ||
        review.rating === parseInt(ratingFilter);

      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading reviews...</span>
      </div>
    );
  }

  return (
    <div className="reviews-management-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reviews Management</h1>
          <p className="page-subtitle">
            View, moderate, and analyze customer reviews
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadReviews}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid cols-4" style={{ marginBottom: "var(--spacing-lg)" }}>
        <div className="metric-card info">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">⭐</span>
              Total Reviews
            </h3>
          </div>
          <div className="metric-value">{stats?.totalReviews || 0}</div>
        </div>

        <div className="metric-card success">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">📊</span>
              Average Rating
            </h3>
          </div>
          <div className="metric-value">
            {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
            <span style={{ fontSize: '24px', color: 'var(--muted)' }}> / 5.0</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">🔥</span>
              Recent (7 days)
            </h3>
          </div>
          <div className="metric-value">{stats?.recentReviews || 0}</div>
        </div>

        <div className="metric-card primary">
          <div className="metric-header">
            <h3 className="metric-title">
              <span className="metric-icon">🌟</span>
              5-Star Reviews
            </h3>
          </div>
          <div className="metric-value">{stats?.ratingDistribution[5] || 0}</div>
        </div>
      </div>

      {/* Rating Distribution Chart */}
      {stats && (
        <div className="card" style={{ marginBottom: "var(--spacing-lg)" }}>
          <h3 style={{ marginBottom: "var(--spacing)" }}>📈 Rating Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
              const percentage = stats.totalReviews > 0
                ? (count / stats.totalReviews) * 100
                : 0;

              return (
                <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing)' }}>
                  <span style={{ width: '60px', fontWeight: 'var(--font-weight-medium)' }}>
                    {rating} ⭐
                  </span>
                  <div style={{
                    flex: 1,
                    height: '24px',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: rating >= 4 ? 'var(--success)' : rating >= 3 ? 'var(--warning)' : 'var(--danger)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ width: '80px', textAlign: 'right', color: 'var(--muted)' }}>
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by product, customer, or review content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="filter-select"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {/* Reviews Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      {review.product?.images?.[0]?.url ? (
                        <img
                          src={review.product.images[0].url}
                          alt={review.product.name}
                          style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '50px',
                          height: '50px',
                          background: 'var(--surface)',
                          borderRadius: 'var(--radius)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          📦
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: "var(--font-weight-medium)" }}>
                          {review.product?.name || "Unknown Product"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: "var(--font-weight-medium)" }}>
                        {review.user?.full_name || "Anonymous"}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                        {review.user?.email || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {renderStars(review.rating)}
                      <span className={`badge ${getRatingBadgeClass(review.rating)}`}>
                        {review.rating}.0
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '300px' }}>
                      {review.title && (
                        <div style={{ fontWeight: "var(--font-weight-semibold)", marginBottom: '4px' }}>
                          {review.title}
                        </div>
                      )}
                      {review.comment && (
                        <div style={{
                          color: "var(--muted)",
                          fontSize: "14px",
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {review.comment}
                        </div>
                      )}
                      {!review.title && !review.comment && (
                        <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                          No comment
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "14px" }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openDetailsModal(review)}
                        title="View details"
                      >
                        👁️ View
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteReview(review.id)}
                        title="Delete review"
                        disabled={deleting}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReviews.length === 0 && (
            <div className="empty-state">
              <span style={{ fontSize: "48px", marginBottom: "var(--spacing)" }}>⭐</span>
              <h3>No reviews found</h3>
              <p>
                {searchTerm || ratingFilter !== "all"
                  ? "No reviews match your current filters."
                  : "No customer reviews yet."}
              </p>
              {(searchTerm || ratingFilter !== "all") && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setRatingFilter('all');
                  }}
                  style={{ marginTop: "var(--spacing)" }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Details Modal */}
      {showDetailsModal && selectedReview && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>⭐ Review Details</h3>
              <button
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Product Info */}
              <div className="section">
                <h4>Product</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing)', padding: 'var(--spacing)', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                  {selectedReview.product?.images?.[0]?.url ? (
                    <img
                      src={selectedReview.product.images[0].url}
                      alt={selectedReview.product.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: 'var(--border)',
                      borderRadius: 'var(--radius)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px'
                    }}>
                      📦
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: "var(--font-weight-semibold)", fontSize: '18px' }}>
                      {selectedReview.product?.name || "Unknown Product"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="section" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h4>Customer</h4>
                <div style={{ padding: 'var(--spacing)', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                  <div><strong>Name:</strong> {selectedReview.user?.full_name || "Anonymous"}</div>
                  <div style={{ marginTop: 'var(--spacing-xs)' }}><strong>Email:</strong> {selectedReview.user?.email || "N/A"}</div>
                </div>
              </div>

              {/* Rating */}
              <div className="section" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h4>Rating</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing)' }}>
                  {renderStars(selectedReview.rating)}
                  <span className={`badge ${getRatingBadgeClass(selectedReview.rating)}`} style={{ fontSize: '16px' }}>
                    {selectedReview.rating}.0 / 5.0
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="section" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h4>Review</h4>
                {selectedReview.title && (
                  <div style={{
                    fontWeight: "var(--font-weight-semibold)",
                    fontSize: '18px',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    "{selectedReview.title}"
                  </div>
                )}
                {selectedReview.comment ? (
                  <div style={{
                    padding: 'var(--spacing)',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius)',
                    lineHeight: '1.6',
                    fontSize: '15px'
                  }}>
                    {selectedReview.comment}
                  </div>
                ) : (
                  <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                    No written comment provided.
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="section" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h4>Submitted</h4>
                <div style={{ color: 'var(--muted)' }}>
                  {new Date(selectedReview.created_at).toLocaleString()}
                </div>
              </div>

              {/* Actions */}
              <div className="section" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div style={{
                  display: 'flex',
                  gap: 'var(--spacing)',
                  justifyContent: 'flex-end',
                  borderTop: '1px solid var(--border)',
                  paddingTop: 'var(--spacing-lg)'
                }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteReview(selectedReview.id)}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : '🗑️ Delete Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
