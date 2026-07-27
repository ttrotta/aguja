type QueryErrorProps = {
  message: string | null;
};

export function QueryError({ message }: QueryErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
      Query failed: {message}
    </p>
  );
}
