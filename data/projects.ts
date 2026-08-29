export type ProjectCategory =
  | "main-quest"
  | "side-quest"
  | "experiment"
  | "archived";

export type ProjectStatus = "active" | "completed" | "archived" | "in-progress";

export type ProjectImage = {
  src: string;
  alt: string;
};

export type Project = {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  technologies: string[];
  featured: boolean;
  githubUrl: string | null;
  liveUrl: string | null;
  image: ProjectImage | null;
  highlights: string[];
  challenges: string[];
  lessonsLearned: string[];
};

export const projects: Project[] = [];
