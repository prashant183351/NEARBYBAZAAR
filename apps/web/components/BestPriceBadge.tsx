// ...existing code...

interface BestPriceBadgeProps {
  reason: string;
}

const BestPriceBadge: React.FC<BestPriceBadgeProps> = ({ reason }) => (
  <span
    className="badge best-price"
    aria-label={reason ? `Best Price: ${reason}` : 'Best Price'}
    title={reason ? `Best Price: ${reason}` : 'Best Price'}
    style={{
      background: '#1fa463',
      color: '#fff',
      padding: '0.25em 0.75em',
      borderRadius: '1em',
      fontWeight: 600,
    }}
  >
    <span aria-hidden="true" style={{ marginRight: 4 }}>
      💸
    </span>
    Best Price
    {reason && <span className="sr-only">: {reason}</span>}
  </span>
);

export { BestPriceBadge };
export default BestPriceBadge;
