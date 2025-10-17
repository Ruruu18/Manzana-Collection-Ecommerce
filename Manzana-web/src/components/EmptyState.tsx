import React from 'react';
import '../styles/empty-state.css';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`empty-state ${className}`}
      role="status"
      aria-label={`${title}. ${message}`}
    >
      <div
        className="empty-state-icon"
        role="img"
        aria-label={`${icon} icon`}
      >
        {icon}
      </div>

      <h3 className="empty-state-title">{title}</h3>

      <p className="empty-state-message">{message}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary empty-state-action"
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}

      {secondaryActionLabel && onSecondaryAction && (
        <button
          onClick={onSecondaryAction}
          className="btn btn-outline empty-state-secondary"
          aria-label={secondaryActionLabel}
        >
          {secondaryActionLabel}
        </button>
      )}
    </div>
  );
};

// Preset empty states
export const EmptyProducts: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="📦"
    title="No products found"
    message="There are no products available at the moment."
    {...props}
  />
);

export const EmptyOrders: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="🛍️"
    title="No orders yet"
    message="You haven't received any orders yet. They will appear here once customers start ordering."
    {...props}
  />
);

export const EmptyCustomers: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="👥"
    title="No customers"
    message="You don't have any registered customers yet."
    {...props}
  />
);

export const EmptySearch: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="🔍"
    title="No results found"
    message="We couldn't find anything matching your search. Try different keywords."
    {...props}
  />
);

export const EmptyReviews: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="⭐"
    title="No reviews yet"
    message="This product hasn't received any reviews yet."
    {...props}
  />
);

export const ErrorState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="⚠️"
    title="Something went wrong"
    message="We encountered an error loading this content. Please try again."
    {...props}
  />
);

export default EmptyState;
