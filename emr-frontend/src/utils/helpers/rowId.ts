/**
 * Creates a factory that produces form-list rows with a unique `_rowId`.
 *
 * Each row needs an identity that survives its position in the list changing
 * when another row is added or removed.  The `_rowId` is used for identity-
 * based diffing in `onValuesChange` handlers instead of positional indexing.
 *
 * Usage:
 *   const newRow = createRowIdGenerator();
 *   // in field constants:
 *   initialValue: [newRow()],
 *   newRow,
 */
export const createRowIdGenerator = () => {
  const prefix = Date.now().toString(36);
  let n = 0;
  return () => ({ _rowId: `row-${prefix}-${(n += 1)}` });
};
