import React from 'react';
import '../styles/skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  ariaLabel = 'Loading...',
  style,
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr role="row" aria-label="Loading table row">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index}>
          <Skeleton height="20px" ariaLabel={`Loading column ${index + 1}`} />
        </td>
      ))}
    </tr>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card-skeleton" role="article" aria-label="Loading card">
      <Skeleton height="200px" borderRadius="8px" ariaLabel="Loading image" />
      <div style={{ padding: '16px' }}>
        <Skeleton width="80%" height="24px" style={{ marginBottom: '12px' }} ariaLabel="Loading title" />
        <Skeleton width="60%" height="16px" style={{ marginBottom: '8px' }} ariaLabel="Loading subtitle" />
        <Skeleton width="40%" height="20px" ariaLabel="Loading price" />
      </div>
    </div>
  );
};

export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 3 }) => {
  return (
    <div className="form-skeleton" role="form" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} style={{ marginBottom: '20px' }}>
          <Skeleton width="120px" height="16px" style={{ marginBottom: '8px' }} ariaLabel={`Loading label ${index + 1}`} />
          <Skeleton height="40px" borderRadius="4px" ariaLabel={`Loading input ${index + 1}`} />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
