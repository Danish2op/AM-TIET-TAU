export function nextIndex(current: number, length: number): number {
  if (length <= 1) {
    return 0;
  }
  return (current + 1) % length;
}

export function prevIndex(current: number, length: number): number {
  if (length <= 1) {
    return 0;
  }
  return (current - 1 + length) % length;
}
