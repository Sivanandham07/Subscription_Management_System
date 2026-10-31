import Link from 'next/link';

type SearchParams = Record<string, string | string[] | undefined>;

type PaginationProps = {
  page: number;          // current page (1, 2, 3...)
  total: number;         // total rows (the `count` from Supabase)
  basePath: string;      // e.g. "/invoices"
  searchParams?: SearchParams; // the awaited searchParams, so filters are kept
  pageSize?: number;     // default 25
};

// Build a link like /invoices?status=paid&page=3 (keeps other filters)
function buildHref(basePath: string, searchParams: SearchParams, page: number): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page' || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value !== '') {
      params.set(key, value);
    }
  }

  if (page > 1) params.set('page', String(page));

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

// Pages to show: first, last, and the ones around the current page. 'gap' = "..."
function getPageList(current: number, totalPages: number): (number | 'gap')[] {
  const wanted = new Set<number>([1, totalPages, current - 1, current, current + 1]);
  const sorted = Array.from(wanted)
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | 'gap')[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) result.push('gap');
    result.push(n);
  });
  return result;
}

const BASE_BUTTON = 'rounded-md border px-3 py-1.5 text-sm';
const ACTIVE_BUTTON = `${BASE_BUTTON} border-indigo-600 bg-indigo-600 text-white`;
const NORMAL_BUTTON = `${BASE_BUTTON} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
const DISABLED_BUTTON = `${BASE_BUTTON} cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400`;

export function Pagination({
  page,
  total,
  basePath,
  searchParams = {},
  pageSize = 25,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);

  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  const pages = getPageList(current, totalPages);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-gray-600 sm:flex-row">
      <p>
        Showing {from.toLocaleString('en-IN')}–{to.toLocaleString('en-IN')} of{' '}
        {total.toLocaleString('en-IN')}
      </p>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
          {current > 1 ? (
            <Link href={buildHref(basePath, searchParams, current - 1)} className={NORMAL_BUTTON}>
              Previous
            </Link>
          ) : (
            <span className={DISABLED_BUTTON}>Previous</span>
          )}

          {pages.map((item, index) =>
            item === 'gap' ? (
              <span key={`gap-${index}`} className="px-1 text-gray-400">
                …
              </span>
            ) : (
              <Link
                key={item}
                href={buildHref(basePath, searchParams, item)}
                className={item === current ? ACTIVE_BUTTON : NORMAL_BUTTON}
                aria-current={item === current ? 'page' : undefined}
              >
                {item}
              </Link>
            )
          )}

          {current < totalPages ? (
            <Link href={buildHref(basePath, searchParams, current + 1)} className={NORMAL_BUTTON}>
              Next
            </Link>
          ) : (
            <span className={DISABLED_BUTTON}>Next</span>
          )}
        </nav>
      )}
    </div>
  );
}