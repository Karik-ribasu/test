import type { MetaPagination } from "./pagination";

export type HTTPGetEnrollmentsByCourseIDResponse = {
  enrollments: {
    user_id: number,
    enrolled_at: string,
    completed_at: null | string,
    percent_complete: number,
    expires_at: null | string
  }[];
  meta: MetaPagination;
};
