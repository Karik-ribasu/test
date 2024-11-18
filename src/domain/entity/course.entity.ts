export default class Course {
  constructor(readonly id: number, readonly description: null | string, readonly name: string, readonly heading: string, readonly is_published: boolean, readonly image_url: string) {}

  isPublished(): boolean {
    return this.is_published;
  }
}
