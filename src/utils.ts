export const bufferEndsWith = (buffer: Buffer, suffix: Buffer) => {
  if (suffix.length > buffer.length) {
    return false;
  }

  const endSlice = buffer.subarray(buffer.length - suffix.length);

  return endSlice.equals(suffix);
};
