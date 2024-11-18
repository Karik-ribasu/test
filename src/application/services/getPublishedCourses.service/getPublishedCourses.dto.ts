export type CourseWithEnrollment = {
  course_name: string;
  course_heading: string;
  enrollments: {
    name: string;
    email: string;
  }[];
};