export interface ICache {
  getInstance(): ICache
  get(key: string): Promise<string | null>
  set(key: string, value: any): Promise<string | null>
}