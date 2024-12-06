const find = (array: number[], target: number)=>{
  const map: {[key: number]: number} = {}
  array.map((value, index) => {
    map[value] = index
  })

  for(let index = 0; index < array.length; index++) {
    const subTarget = target - array[index]
    if(map[subTarget] && map[subTarget] != index) return [index, map[subTarget]]
  }
}

describe('find (Two Sum)', () => {
  test('should find two numbers that add up to the target', () => {
    expect(find([2, 7, 11, 15], 9)).toEqual([0, 1]);
  });

  test('should find numbers in non-sequential positions', () => {
    expect(find([3, 2, 4], 6)).toEqual([1, 2]);
  });

  test('should work with negative numbers', () => {
    expect(find([-1, -2, -3, -4, -5], -8)).toEqual([2, 4]);
  });

  test('should work with duplicate numbers', () => {
    expect(find([3, 3], 6)).toEqual([0, 1]);
  });

  test('should handle zero values', () => {
    expect(find([0, 2, 3, 0], 0)).toEqual([0, 3]);
  });

  test('should return undefined when no solution exists', () => {
    expect(find([1, 2, 3], 7)).toBeUndefined();
  });

  test('should work with larger numbers', () => {
    expect(find([1000, 2000, 3000], 5000)).toEqual([1, 2]);
  });

  test('should work with decimals', () => {
    expect(find([1.5, 2.5, 3.5], 4)).toEqual([0, 1]);
  });

  test('should handle empty array', () => {
    expect(find([], 5)).toBeUndefined();
  });

  test('should handle array with single element', () => {
    expect(find([1], 1)).toBeUndefined();
  });
});