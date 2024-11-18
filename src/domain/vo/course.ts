import type { MetaPagination } from "./pagination";

export type HTTPGetCoursesResponse = {
  courses: {
    id: number;
    description: null | string;
    name: string;
    heading: string;
    is_published: boolean;
    image_url: string;
  }[];
  meta: MetaPagination
};
