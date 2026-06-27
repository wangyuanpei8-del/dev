let uuidSeq = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => {
    uuidSeq += 1;
    return `00000000-0000-4000-8000-${String(uuidSeq).padStart(12, '0')}`;
  }),
}));
