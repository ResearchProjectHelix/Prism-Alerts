// Keep each request below the API row limit. Callers must provide a stable order.
export async function readAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const pageSize = 200;
  const rows: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await fetchPage(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

// Bound the IN filter as well as the result size; do not build one URL for every patient.
export async function readPatientBatches<T>(
  ids: string[],
  fetchPage: (ids: string[], from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let index = 0; index < ids.length; index += 100) {
    const batch = ids.slice(index, index + 100);
    rows.push(...await readAllPages((from, to) => fetchPage(batch, from, to)));
  }
  return rows;
}
