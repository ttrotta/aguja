type QueryErrorProps = {
  message: string | null;
};

export function QueryError({ message }: QueryErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-warning">
      Query failed: {message}
    </p>
  );
}
