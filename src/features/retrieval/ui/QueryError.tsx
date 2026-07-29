"use client";

import { useTranslations } from "next-intl";

type QueryErrorProps = {
  message: string | null;
};

export function QueryError({ message }: QueryErrorProps) {
  const t = useTranslations("query");
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-warning">
      {t("failed", { message })}
    </p>
  );
}
